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

Konten pengguna:
"""
{$analyzedText}
"""

Balas HANYA dalam format JSON valid dengan skema:
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "score": integer antara 0 - 100,
  "summary": "Penjelasan spesifik letak bahaya kejahatan siber (atau konfirmasi aman jika di luar konteks kejahatan siber) dalam Bahasa Indonesia",
  "red_flags": ["letak bahaya kejahatan siber 1", "letak bahaya kejahatan siber 2"],
  "recommendations": ["langkah penanggulangan / perlindungan pengguna 1", "langkah penanggulangan 2"]
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
