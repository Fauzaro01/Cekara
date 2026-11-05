<?php

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

function resolveChatEndpoint(): string
{
    if (Route::has('chat.analyze')) {
        return route('chat.analyze');
    }
    if (Route::has('api.chat.analyze')) {
        return route('api.chat.analyze');
    }

    foreach (Route::getRoutes()->getRoutes() as $route) {
        if (str_contains($route->uri(), 'chat/analyze')) {
            return '/'.ltrim($route->uri(), '/');
        }
    }

    return '/api/chat/analyze';
}

test('system automatically uses mock fallback when active provider api key is empty', function () {
    // Ensure active provider has NULL or empty API key
    if (DB::getSchemaBuilder()->hasTable('llm_providers')) {
        DB::table('llm_providers')->updateOrInsert(
            ['key' => 'gemini'],
            [
                'name' => 'Google Gemini',
                'model' => 'gemini-1.5-flash',
                'api_key' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    $endpoint = resolveChatEndpoint();

    $response = $this->postJson($endpoint, [
        'content' => 'Selamat anda dapat hadiah undian 100 juta rupiah. Hubungi nomor kami.',
    ]);

    $response->assertOk();

    $result = $response->json('data') ?? $response->json();
    expect($result)->toBeArray();
    expect($result)->toHaveKey('risk_level');

    // System did not fail and provided fallback analysis
    $isFallback = $result['is_fallback'] ?? $result['is_mock'] ?? false;
    $providerUsed = $result['provider_used'] ?? $result['provider_name'] ?? '';

    // Either is_fallback is true or provider indicates mock
    expect($isFallback || str_contains(strtolower((string) $providerUsed), 'mock'))->toBeTrue();
});

test('system operates reliably in automated testing environment without external api dependencies', function () {
    expect(app()->environment('testing'))->toBeTrue();

    $endpoint = resolveChatEndpoint();

    $response = $this->postJson($endpoint, [
        'content' => 'Undangan_pernikahan_digital.apk mohon diunduh untuk konfirmasi kehadiran.',
    ]);

    $response->assertOk();

    $result = $response->json('data') ?? $response->json();
    expect($result)->toHaveKey('risk_level');
    expect($result)->toHaveKey('summary');
});

test('system gracefully falls back to mock driver when upstream external api fails', function () {
    // Configure an active provider with a dummy key
    if (DB::getSchemaBuilder()->hasTable('llm_providers')) {
        DB::table('llm_providers')->updateOrInsert(
            ['key' => 'openai'],
            [
                'name' => 'OpenAI',
                'model' => 'gpt-4o-mini',
                'api_key' => Crypt::encryptString('sk-dummy-test-key'),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        DB::table('llm_providers')->where('key', '!=', 'openai')->update(['is_active' => false]);
    }

    // Fake HTTP to simulate an upstream timeout or 500 error from external LLM
    Http::fake([
        '*' => Http::response('Gateway Timeout', 504),
    ]);

    $endpoint = resolveChatEndpoint();

    $response = $this->postJson($endpoint, [
        'content' => 'Pemberitahuan rekening bank Anda terblokir, klik link untuk reset.',
    ]);

    // System must not throw 500 Server Error; it must gracefully catch and return mock fallback with 200
    $response->assertOk();

    $result = $response->json('data') ?? $response->json();
    expect($result)->toHaveKey('risk_level');
});

test('system gracefully handles scenario when no providers are configured in database', function () {
    if (DB::getSchemaBuilder()->hasTable('llm_providers')) {
        DB::table('llm_providers')->truncate();
    }

    $endpoint = resolveChatEndpoint();

    $response = $this->postJson($endpoint, [
        'content' => 'Halo apakah pinjaman online cepat cair ini aman?',
    ]);

    // System should not crash with 500; it falls back to mock heuristic driver
    $response->assertOk();

    $result = $response->json('data') ?? $response->json();
    expect($result)->toHaveKey('risk_level');
});
