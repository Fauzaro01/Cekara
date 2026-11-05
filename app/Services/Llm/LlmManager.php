<?php

namespace App\Services\Llm;

use App\Models\LlmProvider;
use App\Services\Llm\Drivers\CustomRouterDriver;
use App\Services\Llm\Drivers\GeminiDriver;
use App\Services\Llm\Drivers\MockLlmDriver;
use App\Services\Llm\Drivers\OpenAiDriver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use ReflectionProperty;
use Throwable;

class LlmManager
{
    protected MockLlmDriver $mockDriver;

    public function __construct()
    {
        $this->mockDriver = new MockLlmDriver;
    }

    /**
     * Resolve the currently active LLM provider from database.
     */
    public function getActiveProvider(): ?LlmProvider
    {
        try {
            return LlmProvider::where('is_active', true)->first();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Analyze content using active provider or fallback to mock heuristic engine.
     *
     * @param  array<string, mixed>  $context
     */
    public function analyze(string $content, array $context = []): FraudAnalysisResult
    {
        $provider = $this->getActiveProvider();

        // 1. If no active provider is configured
        if (! $provider) {
            return $this->mockDriver->analyze($content, array_merge($context, [
                'is_fallback' => true,
                'fallback_reason' => 'No active provider configured in database.',
            ]));
        }

        // 2. If provider has no API key configured or API key is corrupted
        try {
            $rawKey = $provider->getRawOriginal('api_key') ?? ($provider->getAttributes()['api_key'] ?? null);
            if (empty($rawKey)) {
                return $this->mockDriver->analyze($content, array_merge($context, [
                    'is_fallback' => true,
                    'fallback_reason' => 'Active provider has no API key.',
                ]));
            }

            if (! $provider->hasApiKey()) {
                return $this->mockDriver->analyze($content, array_merge($context, [
                    'is_fallback' => true,
                    'fallback_reason' => 'Active provider API key is invalid or corrupted.',
                ]));
            }
        } catch (Throwable) {
            return $this->mockDriver->analyze($content, array_merge($context, [
                'is_fallback' => true,
                'fallback_reason' => 'Active provider API key is invalid or corrupted.',
            ]));
        }

        // 3. In automated testing environment, unless HTTP requests are faked with Http::fake(),
        // safely fallback to mock driver to ensure zero external dependency.
        if (app()->environment('testing') && ! $this->isHttpFaked()) {
            return $this->mockDriver->analyze($content, array_merge($context, [
                'is_fallback' => true,
                'fallback_reason' => 'Testing environment active with real network calls disabled.',
            ]));
        }

        // 4. Invoke the concrete driver with defensive failure handling
        try {
            $driver = $this->resolveDriver($provider);

            return $driver->analyze($content, $context);
        } catch (Throwable $e) {
            Log::warning('LLM provider invocation failed, activating mock heuristic fallback.', [
                'provider' => $provider->key,
                'error' => $e->getMessage(),
            ]);

            return $this->mockDriver->analyze($content, array_merge($context, [
                'is_fallback' => true,
                'fallback_reason' => $e->getMessage(),
            ]));
        }
    }

    /**
     * Instantiate the corresponding driver for a given provider.
     */
    public function resolveDriver(LlmProvider $provider): LlmDriverInterface
    {
        return match ($provider->key) {
            'gemini' => new GeminiDriver($provider),
            'openai' => new OpenAiDriver($provider),
            'custom' => new CustomRouterDriver($provider),
            default => $this->mockDriver,
        };
    }

    /**
     * Check if Laravel Http facade has active mock/fake callbacks registered.
     */
    protected function isHttpFaked(): bool
    {
        try {
            $root = Http::getFacadeRoot();
            $ref = new ReflectionProperty($root, 'stubCallbacks');
            $ref->setAccessible(true);
            $callbacks = $ref->getValue($root);

            return ! empty($callbacks);
        } catch (Throwable) {
            return false;
        }
    }
}
