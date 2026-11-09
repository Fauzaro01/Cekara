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
Anda adalah Cekara, sistem pakar AI investigasi penipuan digital, siber, dan hoaks (Fraud, Scam & Hoax Guardian) Indonesia.
Lakukan analisis generatif yang tajam, kontekstual, dan menyeluruh terhadap konten teks, tautan web, dan/atau gambar tangkapan layar pengguna.

Periksa seluruh indikator bahaya berikut secara mendalam:
1. Penipuan Finansial & Pemerasan: permintaan transfer uang, deposit jaminan, biaya aktivasi akun, biaya admin pencairan, atau tebusan.
2. Hoaks & Pesan Berantai (Chain Message Hoax): kabar bohong mengatasnamakan pemerintah/WhatsApp/instansi (misal: "WhatsApp berbayar Rp50.000", "akun akan diblokir permanen jika tidak bayar/sebarkan ke 10 grup"), disinformasi pemicu kepanikan.
3. Phishing & Pencurian Kredensial: permintaan kode OTP, PIN ATM, CVV, password, data pribadi/KTP, atau tautan web tidak resmi/typosquatting.
4. Malware & File Berbahaya: modus berkas .APK (undangan pernikahan, resi paket kurir J&T/SiCepat, surat tilang ETLE, tagihan palsu).
5. Scam Lowongan Kerja & Investasi: tugas paruh waktu like video/follow medsos berujung deposit Telegram, pinjol ilegal, investasi bodong, atau undian berhadiah palsu.
6. Manipulasi Psikologis (Social Engineering): ancaman pemblokiran akun/rekening dalam waktu singkat (24 jam / sekarang juga), intimidasi aparat palsu, atau bujukan hadiah instan.
7. Analisis Visual (jika ada gambar): baca seluruh teks di dalam gambar, evaluasi tata letak antarmuka, URL di address bar, logo, struk transfer, atau isi percakapan.

ATURAN PENILAIAN RISIKO:
- "HIGH" (skor 75 - 98): Jika ditemukan minimal satu indikasi penipuan, hoaks berantai, ancaman blokir akun palsu, permintaan uang/deposit/biaya aktivasi, permintaan OTP/PIN/data sensitif, malware .APK, atau tautan phishing.
- "MEDIUM" (skor 40 - 74): Jika pesan mengandung klaim meragukan tanpa sumber resmi, tawaran promosi/tautan yang belum terverifikasi, atau desakan yang patut dicurigai.
- "LOW" (skor 5 - 30): HANYA jika pesan benar-benar merupakan komunikasi percakapan sehari-hari yang wajar, aman, dan bebas dari unsur manipulasi/ancaman/permintaan mencurigakan.

Format balasan HARUS JSON valid dengan skema:
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "score": integer antara 0 - 100,
  "summary": "Ringkasan analisis investigatif yang spesifik terhadap isi konten dalam Bahasa Indonesia",
  "red_flags": ["tanda bahaya spesifik 1", "tanda bahaya spesifik 2"],
  "recommendations": ["langkah rekomendasi konkret 1", "langkah rekomendasi konkret 2"]
}
SYS;

        $headers = [
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ];

        if (is_array($this->provider?->custom_headers)) {
            $headers = array_merge($headers, $this->provider->custom_headers);
        }

        $userContent = $content;

        if (! empty($context['image']['data']) && ! empty($context['image']['mime_type'])) {
            $mimeType = $context['image']['mime_type'];
            $base64 = $context['image']['data'];
            $dataUri = "data:{$mimeType};base64,{$base64}";
            $promptText = trim($content) !== '' ? $content : 'Tangkapan layar percakapan terlampir untuk dianalisis indikasi penipuan digital.';

            $userContent = [
                [
                    'type' => 'text',
                    'text' => $promptText,
                ],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => $dataUri,
                    ],
                ],
            ];
        }

        $client = Http::withHeaders($headers)->timeout(30);

        if (! app()->environment('production') && empty(ini_get('curl.cainfo'))) {
            $client = $client->withoutVerifying();
        }

        $response = $client->post($endpoint, [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userContent],
            ],
            'temperature' => 0.2,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Custom Router API returned error: '.$response->status().' - '.$response->body());
        }

        $data = $this->parseRouterPayload($response->body(), $response->json());
        $message = $data['choices'][0]['message'] ?? [];
        $rawContent = $message['content'] ?? null;

        if ((empty($rawContent) || ! is_string($rawContent)) && ! empty($message['reasoning']) && is_string($message['reasoning'])) {
            $rawContent = $message['reasoning'];
        }

        if (! $rawContent || ! is_string($rawContent)) {
            throw new RuntimeException('Custom Router API returned empty response content.');
        }

        // Strip any markdown code fences if present (e.g. ```json ... ```)
        $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($rawContent));
        $parsed = json_decode((string) $cleanJson, true);

        if ((! is_array($parsed) || ! isset($parsed['risk_level'])) && preg_match('/\{[\s\S]*\}/', $rawContent, $matches)) {
            $parsed = json_decode($matches[0], true);
        }

        if (! is_array($parsed) || ! isset($parsed['risk_level'])) {
            throw new RuntimeException('Custom Router API returned invalid JSON structure: '.$rawContent);
        }

        $riskLevel = strtoupper((string) ($parsed['risk_level'] ?? 'LOW'));
        if (! in_array($riskLevel, ['HIGH', 'MEDIUM', 'LOW'], true)) {
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

    /**
     * Parse response body from OpenAI-compatible router (such as 9router/OpenRouter),
     * handling trailing `data: [DONE]` markers or SSE chunks gracefully.
     *
     * @return array<string, mixed>
     */
    protected function parseRouterPayload(string $rawBody, mixed $decodedJson): array
    {
        if (is_array($decodedJson) && isset($decodedJson['choices'])) {
            return $decodedJson;
        }

        // Strip trailing `data: [DONE]` and surrounding whitespace emitted by 9router
        $cleaned = preg_replace('/(?:\r?\n|\s)*data:\s*\[DONE\]\s*$/i', '', trim($rawBody));
        $cleaned = preg_replace('/^data:\s*/i', '', trim((string) $cleaned));

        $decoded = json_decode((string) $cleaned, true);
        if (is_array($decoded) && isset($decoded['choices'])) {
            return $decoded;
        }

        // Handle multi-chunk SSE responses if router streamed `data: {...}` lines
        if (str_contains($rawBody, 'data:')) {
            $accumulatedContent = '';
            $lastChunk = null;
            foreach (preg_split('/\r?\n/', $rawBody) ?: [] as $line) {
                $line = trim($line);
                if (! str_starts_with($line, 'data:')) {
                    continue;
                }
                $payloadStr = trim(substr($line, 5));
                if ($payloadStr === '[DONE]' || $payloadStr === '') {
                    continue;
                }
                $chunk = json_decode($payloadStr, true);
                if (is_array($chunk)) {
                    $lastChunk = $chunk;
                    if (isset($chunk['choices'][0]['message']['content'])) {
                        return $chunk;
                    }
                    if (isset($chunk['choices'][0]['delta']['content'])) {
                        $accumulatedContent .= $chunk['choices'][0]['delta']['content'];
                    }
                }
            }

            if ($accumulatedContent !== '') {
                return [
                    'choices' => [
                        [
                            'message' => [
                                'content' => $accumulatedContent,
                            ],
                        ],
                    ],
                ];
            }

            if (is_array($lastChunk)) {
                return $lastChunk;
            }
        }

        return is_array($decodedJson) ? $decodedJson : [];
    }
}
