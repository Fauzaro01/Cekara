<?php

namespace App\Services\Llm\Drivers;

use App\Models\LlmProvider;
use App\Services\Llm\FraudAnalysisResult;
use App\Services\Llm\LlmDriverInterface;
use Illuminate\Support\Facades\Http;
use ReflectionProperty;
use RuntimeException;
use Throwable;

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
        $primaryModel = $this->provider?->model ?: 'gemini-3.5-flash-lite';

        $analyzedText = trim($content);
        if ($analyzedText === '' && ! empty($context['image'])) {
            $filename = $context['image']['filename'] ?? 'screenshot.png';
            $analyzedText = "Tangkapan layar percakapan chat atau halaman web terlampir untuk dianalisis (berkas: {$filename}).";
        }

        $prompt = <<<PROMPT
Anda adalah Cekara, sistem pakar AI investigasi penipuan digital, siber, dan hoaks (Fraud, Scam & Hoax Guardian) Indonesia.
Lakukan analisis generatif yang tajam, kontekstual, dan menyeluruh terhadap konten teks, tautan web, dan/atau gambar tangkapan layar yang dikirimkan pengguna.

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

Konten pengguna:
"""
{$analyzedText}
"""

Balas HANYA dalam format JSON valid dengan skema:
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "score": integer antara 0 - 100,
  "summary": "Ringkasan analisis investigatif yang spesifik terhadap isi konten dalam Bahasa Indonesia",
  "red_flags": ["tanda bahaya spesifik 1", "tanda bahaya spesifik 2"],
  "recommendations": ["rekomendasi tindakan konkret 1", "rekomendasi tindakan konkret 2"]
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

        $payload = [
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
        ];

        $modelsToTry = [$primaryModel];
        if (! $this->isHttpFaked()) {
            foreach (['gemini-2.5-flash', 'gemini-3.5-flash-lite'] as $fallbackModel) {
                if (! in_array($fallbackModel, $modelsToTry, true)) {
                    $modelsToTry[] = $fallbackModel;
                }
            }
        }

        $response = null;
        $usedModel = $primaryModel;

        foreach ($modelsToTry as $candidateModel) {
            $usedModel = $candidateModel;
            $endpoint = "{$baseUrl}/models/{$candidateModel}:generateContent";

            $client = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(25);

            if (! app()->environment('production') && empty(ini_get('curl.cainfo'))) {
                $client = $client->withoutVerifying();
            }

            $response = $client->post($endpoint, $payload);

            if ($response->successful()) {
                break;
            }

            // Only try fallback model on transient capacity (503/429) or deprecated model (404)
            if (! in_array($response->status(), [404, 429, 503], true)) {
                break;
            }
        }

        if (! $response || ! $response->successful()) {
            throw new RuntimeException('Gemini API returned error: '.$response?->status().' - '.$response?->body());
        }

        $data = $response->json();
        $candidateParts = $data['candidates'][0]['content']['parts'] ?? [];
        $rawText = null;

        if (is_array($candidateParts)) {
            foreach ($candidateParts as $part) {
                if (! empty($part['text']) && empty($part['thought'])) {
                    $rawText = $part['text'];
                }
            }
            if ($rawText === null && isset($candidateParts[0]['text'])) {
                $rawText = $candidateParts[0]['text'];
            }
        }

        if (! $rawText) {
            throw new RuntimeException('Gemini API returned empty candidate text.');
        }

        $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim((string) $rawText));
        $parsed = json_decode((string) $cleanJson, true);

        if ((! is_array($parsed) || ! isset($parsed['risk_level'])) && preg_match('/\{[\s\S]*\}/', (string) $rawText, $matches)) {
            $parsed = json_decode($matches[0], true);
        }

        if (! is_array($parsed) || ! isset($parsed['risk_level'])) {
            throw new RuntimeException('Gemini API returned invalid JSON structure: '.$rawText);
        }

        $riskLevel = strtoupper((string) ($parsed['risk_level'] ?? 'LOW'));
        if (! in_array($riskLevel, ['HIGH', 'MEDIUM', 'LOW'], true)) {
            $riskLevel = 'HIGH';
        }

        return new FraudAnalysisResult(
            riskLevel: $riskLevel,
            isMock: false,
            redFlags: (array) ($parsed['red_flags'] ?? []),
            summary: (string) ($parsed['summary'] ?? 'Analisis berhasil dilakukan oleh model Google Gemini.'),
            recommendations: (array) ($parsed['recommendations'] ?? []),
            providerName: $this->provider?->name ?: 'Google Gemini',
            model: $usedModel,
            score: (int) ($parsed['score'] ?? ($riskLevel === 'HIGH' ? 90 : ($riskLevel === 'MEDIUM' ? 50 : 10))),
        );
    }

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
