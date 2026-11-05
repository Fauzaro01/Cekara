<?php

namespace App\Services\Llm\Drivers;

use App\Services\Llm\FraudAnalysisResult;
use App\Services\Llm\LlmDriverInterface;

class MockLlmDriver implements LlmDriverInterface
{
    public function analyze(string $content, array $context = []): FraudAnalysisResult
    {
        $lower = strtolower($content);
        $isFallback = (bool) ($context['is_fallback'] ?? false);
        $fallbackReason = $context['fallback_reason'] ?? null;
        $hasImage = ! empty($context['image']);
        $imageFilename = strtolower((string) ($context['image']['filename'] ?? ''));
        $search = trim($lower.' '.$imageFilename);
        $providerName = $hasImage ? 'Mock Heuristic Vision Engine' : 'Mock Heuristic Engine';
        $modelName = $hasImage ? 'cekara-vision-heuristics-v1' : 'cekara-heuristics-v1';

        // 1. Wedding APK Scam Heuristic
        if ((str_contains($search, 'undangan') || str_contains($search, 'pernikahan') || str_contains($search, 'surat undangan'))
            && (str_contains($search, '.apk') || str_contains($search, 'apk') || str_contains($search, 'instal') || str_contains($search, 'unduh') || str_contains($search, 'aplikasi'))) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Menggunakan lampiran berkas berekstensi .apk yang menyamar sebagai surat undangan pernikahan digital.',
                    'Meminta korban mengunduh dan memasang (instal) aplikasi tidak dikenal di luar toko resmi Google Play / App Store.',
                    'Modus malware APK pencuri SMS OTP untuk menguras rekening bank dan dompet digital korban.',
                ],
                summary: 'Pesan ini terindikasi kuat sebagai penipuan modus surat undangan pernikahan digital berupa malware APK berbahaya.',
                recommendations: [
                    'Jangan pernah klik, unduh, atau pasang file .apk tersebut di ponsel Anda.',
                    'Hapus berkas dan pesan tersebut segera.',
                    'Blokir nomor pengirim yang tidak dikenal.',
                    'Pastikan fitur instalasi dari sumber tidak dikenal tetap dinonaktifkan di pengaturan ponsel.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 95,
                fallbackReason: $fallbackReason,
            );
        }

        // 2. Courier / Package Delivery APK Scam Heuristic
        if ((str_contains($search, 'paket') || str_contains($search, 'kurir') || str_contains($search, 'resi') || str_contains($search, 'j&t') || str_contains($search, 'jnt') || str_contains($search, 'sicepat'))
            && (str_contains($search, '.apk') || str_contains($search, 'apk') || str_contains($search, 'unduh') || str_contains($search, 'pasang') || str_contains($search, 'instal') || str_contains($search, 'aplikasi') || str_contains($search, 'foto_paket') || str_contains($search, 'tertahan'))) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Mengirimkan berkas .apk berbahaya berkedok foto paket atau aplikasi pelacak resi kurir.',
                    'Mendesak penerima untuk memasang aplikasi guna melihat status pengiriman paket yang tertahan.',
                    'Aplikasi meminta izin berbahaya seperti membaca SMS dan aksesibilitas untuk membajak kode OTP perbankan.',
                ],
                summary: 'Pesan ini merupakan modus penipuan kurir paket palsu yang menyebarkan virus/malware APK pencuri data perbankan.',
                recommendations: [
                    'Jangan pasang aplikasi .apk tersebut.',
                    'Hapus berkas mencurigakan segera dari perangkat Anda.',
                    'Blokir nomor pengirim.',
                    'Periksa nomor resi paket hanya melalui situs web atau aplikasi resmi ekspedisi terkait.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 95,
                fallbackReason: $fallbackReason,
            );
        }

        // 3. Generic APK / Malware mention
        if (str_contains($search, '.apk') || str_contains($search, '_apk') || str_contains($search, '-apk') || (str_contains($search, 'apk') && (str_contains($search, 'unduh') || str_contains($search, 'pasang') || str_contains($search, 'instal') || str_contains($search, 'download')))) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Pesan menyertakan file berekstensi .apk yang berpotensi merupakan malware pengintai data sensitif.',
                    'Pengiriman file aplikasi melalui pesan instan merupakan ciri utama rekayasa sosial malware Android.',
                ],
                summary: 'Peringatan bahaya: Terdapat file instalasi Android (.apk) mencurigakan yang dapat membahayakan keamanan perangkat Anda.',
                recommendations: [
                    'Jangan unduh atau pasang berkas .apk tersebut.',
                    'Hapus pesan dan blokir pengirim.',
                    'Hanya unduh aplikasi dari Google Play Store resmi.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 90,
                fallbackReason: $fallbackReason,
            );
        }

        // 4. Fake Bank Customer Service, OTP Phishing & Account Block Scam
        if (str_contains($search, 'otp')
            || (str_contains($search, 'rekening') && (str_contains($search, 'blokir') || str_contains($search, 'reset') || str_contains($search, 'link') || str_contains($search, 'tautan')))
            || (str_contains($search, 'cvv') || str_contains($search, 'pin atm') || str_contains($search, 'kode 6 digit'))
            || ((str_contains($search, 'bri') || str_contains($search, 'bca') || str_contains($search, 'mandiri') || str_contains($search, 'bni')) && (str_contains($search, 'hadiah') || str_contains($search, 'pemenang') || str_contains($search, 'klik link') || str_contains($search, 'terblokir')))) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Meminta informasi kredensial rahasia seperti kode OTP, PIN, atau data perbankan sensitif.',
                    'Mencatut nama institusi perbankan resmi dengan mengatasnamakan undian berhadiah atau ancaman pemblokiran akun.',
                    'Mengarahkan korban untuk segera memasukkan data ke tautan phishing tidak resmi.',
                ],
                summary: 'Pesan ini terindikasi kuat sebagai phishing perbankan dan rekayasa sosial untuk mencuri dana atau mengambil alih rekening.',
                recommendations: [
                    'Jangan pernah bagikan kode OTP atau data perbankan rahasia kepada siapa pun termasuk pihak yang mengaku petugas bank.',
                    'Pihak bank resmi tidak pernah meminta kode OTP atau kata sandi nasabah.',
                    'Jangan klik tautan dalam pesan, segera hapus pesan dan blokir nomor kontak pengirim.',
                    'Hubungi call center resmi bank jika Anda ragu atau merasa akun Anda dalam bahaya.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 95,
                fallbackReason: $fallbackReason,
            );
        }

        // 5. Job & Task Scam (Like Video, Telegram, Komisi Paruh Waktu)
        if ((str_contains($search, 'like video') || str_contains($search, 'kerja paruh waktu') || str_contains($search, 'komisi') || str_contains($search, 'tugas') || str_contains($search, 'freelance'))
            && (str_contains($search, 'telegram') || str_contains($search, 'deposit') || str_contains($search, 'jutaan') || str_contains($search, 'harian') || str_contains($search, 'uang') || str_contains($search, 'aman') || str_contains($search, 'kerja'))) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Menawarkan pekerjaan mudah (seperti like video / follow akun) dengan janji imbalan komisi harian yang tidak wajar.',
                    'Mengarahkan komunikasi ke kanal Telegram atau platform tertutup untuk instruksi deposit uang.',
                    'Modus penipuan skema ponzi tugas berbayar (task scam).',
                ],
                summary: 'Pesan ini merupakan modus penipuan lowongan kerja paruh waktu / tugas like video palsu yang berujung pada pemerasan deposit uang.',
                recommendations: [
                    'Jangan terima tawaran pekerjaan ini dan jangan transfer uang deposit untuk alasan apa pun.',
                    'Pekerjaan profesional yang sah tidak pernah meminta pembayaran di awal dari calon pekerja.',
                    'Tinggalkan grup Telegram atau tautan obrolan terkait, hapus dan blokir pengirim.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 85,
                fallbackReason: $fallbackReason,
            );
        }

        // 6. Lottery & Prize Scam
        if ((str_contains($search, 'selamat anda') || str_contains($search, 'undian') || str_contains($search, 'memenangkan') || str_contains($search, 'hadiah'))
            && (str_contains($search, 'juta') || str_contains($search, 'rupiah') || str_contains($search, 'klaim') || str_contains($search, 'hubungi nomor'))) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Klaim memenangkan undian berhadiah uang tunai besar dari program yang tidak pernah Anda ikuti.',
                    'Mengarahkan calon korban untuk menghubungi nomor pribadi WhatsApp atau tautan eksternal tidak resmi.',
                    'Ciri umum penipuan berkedok biaya administrasi pencairan hadiah.',
                ],
                summary: 'Pesan ini adalah penipuan undian berhadiah palsu yang menargetkan transfer biaya administrasi dari korban.',
                recommendations: [
                    'Abaikan pesan dan jangan pernah hubungi nomor telepon atau tautan yang diberikan.',
                    'Jangan pernah mengirimkan uang muka untuk klaim hadiah apa pun.',
                    'Hapus dan blokir kontak pengirim segera.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 90,
                fallbackReason: $fallbackReason,
            );
        }

        // 7. Illegal Loan (Pinjol Ilegal)
        if (str_contains($search, 'pinjaman online') || str_contains($search, 'pinjol') || (str_contains($search, 'pinjaman') && (str_contains($search, 'cepat cair') || str_contains($search, 'tanpa agunan') || str_contains($search, 'cair')))) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Tawaran pinjaman dana tunai instan melalui SMS / chat pribadi tanpa proses analisis kredit yang wajar.',
                    'Indikasi kuat pinjaman online (pinjol) ilegal yang tidak berizin dan tidak diawasi oleh Otoritas Jasa Keuangan (OJK).',
                    'Potensi bunga mencekik, biaya terselubung, dan intimidasi penyebaran data pribadi.',
                ],
                summary: 'Tawaran pinjaman online melalui pesan langsung sangat berisiko dan terindikasi sebagai pinjol ilegal yang merugikan.',
                recommendations: [
                    'Jangan ajukan pinjaman melalui kontak tidak dikenal atau tautan dalam pesan instan.',
                    'Selalu periksa daftar penyelenggara fintech lending berizin resmi di situs OJK (ojk.go.id).',
                    'Hapus pesan dan blokir nomor penawar pinjaman ilegal.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 85,
                fallbackReason: $fallbackReason,
            );
        }

        // 8. General Chat / Screenshot Fraud Indicator
        if (str_contains($search, 'penipuan') || str_contains($search, 'scam') || str_contains($search, 'palsu') || str_contains($search, 'fraud') || str_contains($search, 'bodong')) {
            return new FraudAnalysisResult(
                riskLevel: 'HIGH',
                isMock: true,
                redFlags: [
                    'Tangkapan layar percakapan menunjukkan indikasi rekayasa sosial dan manipulasi psikologis khas penipuan digital.',
                    'Ditemukan pola pesan mencurigakan yang berupaya mendesak korban atau menyebarkan konten manipulatif.',
                ],
                summary: 'Pesan / tangkapan layar percakapan ini terindikasi kuat mengandung modus penipuan digital.',
                recommendations: [
                    'Jangan ikuti instruksi yang tertera pada pesan tersebut.',
                    'Blokir nomor kontak pengirim segera.',
                    'Laporkan nomor atau rekening terkait ke portal aduan resmi.',
                ],
                providerName: $providerName,
                model: $modelName,
                score: 90,
                fallbackReason: $fallbackReason,
            );
        }

        // 9. Default Safe / Benign Conversation
        return new FraudAnalysisResult(
            riskLevel: 'LOW',
            isMock: true,
            redFlags: [
                'Tidak ditemukan kata kunci ancaman pemblokiran, permintaan OTP, atau tautan mencurigakan.',
                'Struktur pesan sesuai dengan pola komunikasi percakapan wajar.',
            ],
            summary: $hasImage
                ? 'Tangkapan layar chat telah dianalisis dan tidak ditemukan indikasi penipuan atau berkas berbahaya.'
                : 'Pesan ini tampak seperti percakapan wajar dan tidak terindikasi mengandung unsur rekayasa sosial atau ancaman penipuan digital.',
            recommendations: [
                'Pesan ini aman untuk ditanggapi secara biasa.',
                'Tetap jaga kewaspadaan dan jangan pernah membagikan data kredensial rahasia jika lawan bicara meminta di kemudian hari.',
            ],
            providerName: $providerName,
            model: $modelName,
            score: 10,
            fallbackReason: $fallbackReason,
        );
    }
}
