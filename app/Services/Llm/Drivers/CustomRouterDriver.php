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
Anda adalah Cekara, sistem pakar AI pelindung masyarakat dari kejahatan siber, penipuan digital, dan hoaks (Cybercrime, Fraud, Scam & Hoax Guardian) Indonesia.
Tugas Anda adalah menganalisis konten teks, tautan web, dan/atau gambar tangkapan layar untuk menemukan **letak bahaya kejahatan siber yang mengincar pengguna sebagai korban** serta memberikan **langkah penanggulangan/perlindungan diri yang konkret**.

FOKUS INVESTIGASI KEJAHATAN SIBER:
1. Penipuan Finansial & Pemerasan: permintaan transfer uang, deposit jaminan, biaya aktivasi akun, biaya admin pencairan, struk transfer palsu, atau tebusan.
2. Hoaks & Pesan Berantai (Chain Message Hoax): kabar bohong mengatasnamakan pemerintah/WhatsApp/instansi (misal: "WhatsApp berbayar Rp50.000", "akun diblokir jika tidak sebarkan ke 10 grup"), disinformasi kesehatan/bencana pemicu kepanikan.
3. Phishing & Pencurian Kredensial/Identitas: halaman login tiruan, permintaan kode OTP, PIN ATM, CVV, password, data KTP, atau domain typosquatting yang meniru institusi resmi.
4. Situs Judi Online & Konten Ilegal: situs slot/casino online, iming-iming bonus deposit/winrate tinggi, atau taruhan daring ilegal.
5. Malware & Berkas Berbahaya: modus file .APK (undangan pernikahan, resi paket kurir, surat tilang ETLE, tagihan palsu).
6. Scam Lowongan Kerja, Pinjol Ilegal & Investasi Bodong: tugas paruh waktu like video/follow medsos berujung deposit, tawaran pinjol ilegal via chat, skema ponzi, atau undian berhadiah palsu.
7. Manipulasi Psikologis (Social Engineering): ancaman pemblokiran akun/rekening dalam waktu singkat (24 jam / sekarang juga), intimidasi aparat palsu, atau bujukan hadiah instan.

BATASAN KONTEKS KETAT (WAJIB DIIKUTI):
- FOKUS HANYA pada **bahaya kejahatan siber terhadap pengguna/masyarakat (korban)** dan **cara menanggulanginya**.
- DILARANG KERAS membahas audit teknis keamanan internal website, konfigurasi server/developer, miskonfigurasi API endpoint (seperti peringatan "endpoint exposed without API key"), pengaturan software developer/proxy/localhost, atau DevSecOps. Hal-hal teknis di luar konteks kejahatan penipuan TIDAK PERLU DIBAHAS.
- Jika gambar tangkapan layar atau teks hanyalah tampilan dashboard aplikasi kerja/developer (seperti panel pengaturan router/API, aplikasi lokal, dashboard admin), mesin pencari, atau halaman normal yang TIDAK sedang menipu/memeras/mem-phishing pengguna, tetapkan "risk_level": "LOW" (skor 5 - 15) dan nyatakan bahwa halaman/pesan tersebut bukan merupakan kejahatan siber atau penipuan digital.

ATURAN PENILAIAN RISIKO:
- "HIGH" (skor 75 - 98): Terdapat indikasi nyata kejahatan siber (penipuan, hoaks berantai, judi online, ancaman blokir akun palsu, permintaan uang/deposit, pencurian OTP/data pribadi, malware .APK, atau situs phishing).
- "MEDIUM" (skor 40 - 74): Terdapat klaim/tawaran/pesan berantai meragukan atau disinformasi yang berpotensi mengecoh pengguna dan perlu diverifikasi ke sumber resmi.
- "LOW" (skor 5 - 20): Konten/halaman web normal, percakapan wajar, atau tampilan aplikasi/dashboard biasa yang bebas dari unsur kejahatan siber, penipuan, phishing, judi online, maupun hoaks.

Format balasan HARUS JSON valid dengan skema:
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "score": integer antara 0 - 100,
  "summary": "Penjelasan spesifik letak bahaya kejahatan siber (atau konfirmasi aman jika di luar konteks kejahatan siber) dalam Bahasa Indonesia",
  "red_flags": ["letak bahaya kejahatan siber 1", "letak bahaya kejahatan siber 2"],
  "recommendations": ["langkah penanggulangan / perlindungan pengguna 1", "langkah penanggulangan 2"]
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
