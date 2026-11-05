<?php

namespace App\Services\Llm\Drivers;

use App\Models\LlmProvider;
use App\Services\Llm\FraudAnalysisResult;
use App\Services\Llm\LlmDriverInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CustomRouterDriver implements LlmDriverInterface
{
    public function __construct(
        protected ?LlmProvider $provider = null,
    ) {}

    public function analyze(string $content, array $context = []): FraudAnalysisResult
    {
        $apiKey = $this->provider?->api_key;
        if (empty($apiKey)) {
            throw new RuntimeException('Custom Router API key is not configured.');
        }

        $baseUrl = rtrim($this->provider?->base_url ?: 'https://openrouter.ai/api/v1', '/');
        $model = $this->provider?->model ?: 'meta-llama/llama-3.1-8b-instruct';
        $endpoint = "{$baseUrl}/chat/completions";

        $systemPrompt = <<<'SYS'
Anda adalah Cekara, sistem AI pendeteksi penipuan digital (fraud & scam guardian) Indonesia.
Evaluasi teks pengguna untuk mendeteksi penipuan (APK malware, phishing bank/OTP, scam tugas like video, pinjol ilegal, undian berhadiah, atau pesan wajar).

Format balasan HARUS JSON valid dengan skema:
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "score": integer antara 0 - 100,
  "summary": "Ringkasan analisis dalam Bahasa Indonesia",
  "red_flags": ["tanda bahaya 1", "tanda bahaya 2"],
  "recommendations": ["langkah rekomendasi 1", "langkah rekomendasi 2"]
}
SYS;

        $headers = [
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ];

        if (is_array($this->provider?->custom_headers)) {
            $headers = array_merge($headers, $this->provider->custom_headers);
        }

        $response = Http::withHeaders($headers)
            ->timeout(10)
            ->post($endpoint, [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $content],
                ],
                'temperature' => 0.2,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Custom Router API returned error: '.$response->status().' - '.$response->body());
        }

        $data = $response->json();
        $rawContent = $data['choices'][0]['message']['content'] ?? null;
        if (! $rawContent) {
            throw new RuntimeException('Custom Router API returned empty response content.');
        }

        // Strip any markdown code fences if present (e.g. ```json ... ```)
        $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($rawContent));
        $parsed = json_decode($cleanJson, true);

        if (! is_array($parsed) || ! isset($parsed['risk_level'])) {
            throw new RuntimeException('Custom Router API returned invalid JSON structure: '.$rawContent);
        }

        $riskLevel = strtoupper((string) ($parsed['risk_level'] ?? 'LOW'));
        if (! in_array($riskLevel, ['HIGH', 'MEDIUM', 'LOW'])) {
            $riskLevel = 'HIGH';
        }

        return new FraudAnalysisResult(
            riskLevel: $riskLevel,
            isMock: false,
            redFlags: (array) ($parsed['red_flags'] ?? []),
            summary: (string) ($parsed['summary'] ?? 'Analisis berhasil dilakukan oleh Custom Router.'),
            recommendations: (array) ($parsed['recommendations'] ?? []),
            providerName: $this->provider?->name ?: 'Custom Router API',
            model: $model,
            score: (int) ($parsed['score'] ?? ($riskLevel === 'HIGH' ? 90 : ($riskLevel === 'MEDIUM' ? 50 : 10))),
        );
    }
}
