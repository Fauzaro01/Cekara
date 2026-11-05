<?php

namespace App\Services\Llm\Drivers;

use App\Models\LlmProvider;
use App\Services\Llm\FraudAnalysisResult;
use App\Services\Llm\LlmDriverInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiDriver implements LlmDriverInterface
{
    public function __construct(
        protected ?LlmProvider $provider = null,
    ) {}

    public function analyze(string $content, array $context = []): FraudAnalysisResult
    {
        $apiKey = $this->provider?->api_key;
        if (empty($apiKey)) {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $baseUrl = rtrim($this->provider?->base_url ?: 'https://generativelanguage.googleapis.com/v1beta', '/');
        $model = $this->provider?->model ?: 'gemini-1.5-flash';
        $endpoint = "{$baseUrl}/models/{$model}:generateContent";

        $analyzedText = trim($content);
        if ($analyzedText === '' && ! empty($context['image'])) {
            $filename = $context['image']['filename'] ?? 'screenshot.png';
            $analyzedText = "Tangkapan layar percakapan chat terlampir untuk dianalisis (berkas: {$filename}).";
        }

        $prompt = <<<PROMPT
Anda adalah Cekara, sistem pakar AI deteksi penipuan digital (fraud & scam guardian) Indonesia.
Analisis pesan/konten berikut untuk mendeteksi indikasi penipuan (APK malware, phishing bank/OTP, loker paruh waktu like video/telegram, pinjol ilegal, undian berhadiah, atau pesan biasa).

Konten pengguna:
"""
{$analyzedText}
"""

Balas HANYA dalam format JSON valid dengan skema:
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "score": integer antara 0 - 100,
  "summary": "Ringkasan analisis dalam Bahasa Indonesia",
  "red_flags": ["tanda bahaya 1", "tanda bahaya 2"],
  "recommendations": ["rekomendasi tindakan 1", "rekomendasi tindakan 2"]
}
PROMPT;

        $parts = [
            ['text' => $prompt],
        ];

        if (! empty($context['image']['data']) && ! empty($context['image']['mime_type'])) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $context['image']['mime_type'],
                    'data' => $context['image']['data'],
                ],
            ];
        }

        $response = Http::withHeaders([
            'x-goog-api-key' => $apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(10)->post($endpoint, [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => $parts,
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0.2,
            ],
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Gemini API returned error: '.$response->status().' - '.$response->body());
        }

        $data = $response->json();
        $rawText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (! $rawText) {
            throw new RuntimeException('Gemini API returned empty candidate text.');
        }

        $parsed = json_decode($rawText, true);
        if (! is_array($parsed) || ! isset($parsed['risk_level'])) {
            throw new RuntimeException('Gemini API returned invalid JSON structure: '.$rawText);
        }

        $riskLevel = strtoupper((string) ($parsed['risk_level'] ?? 'LOW'));
        if (! in_array($riskLevel, ['HIGH', 'MEDIUM', 'LOW'])) {
            $riskLevel = 'HIGH';
        }

        return new FraudAnalysisResult(
            riskLevel: $riskLevel,
            isMock: false,
            redFlags: (array) ($parsed['red_flags'] ?? []),
            summary: (string) ($parsed['summary'] ?? 'Analisis berhasil dilakukan oleh model Google Gemini.'),
            recommendations: (array) ($parsed['recommendations'] ?? []),
            providerName: $this->provider?->name ?: 'Google Gemini',
            model: $model,
            score: (int) ($parsed['score'] ?? ($riskLevel === 'HIGH' ? 90 : ($riskLevel === 'MEDIUM' ? 50 : 10))),
        );
    }
}
