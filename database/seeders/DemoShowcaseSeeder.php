<?php

namespace Database\Seeders;

use App\Models\Scan;
use App\Models\SimulationAttempt;
use App\Models\SimulationScenario;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoShowcaseSeeder extends Seeder
{
    /**
     * Seed a rich demonstration state for judges, live presentation, and testing.
     */
    public function run(): void
    {
        // 1. Seed scenarios, providers, and community radar alerts
        $this->call([
            // SimulationScenarioSeeder::class, // Dikelola langsung oleh admin melalui panel
            LlmProviderSeeder::class,
            // CommunityRadarSeeder::class, // Menggunakan data nyata dari komunitas
        ]);

        // 2. Admin account
        $admin = User::updateOrCreate(
            ['email' => 'admin@cekara.id'],
            [
                'name' => 'Admin Guardian Cekara',
                'password' => Hash::make('password'),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        // 3. Showcase User account (Master Guardian)
        $user = User::updateOrCreate(
            ['email' => 'guardian@cekara.id'],
            [
                'name' => 'Fauzar (Master Guardian)',
                'password' => Hash::make('password'),
                'is_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        // 4. Regular User account
        $regularUser = User::updateOrCreate(
            ['email' => 'user@cekara.id'],
            [
                'name' => 'Budi Santoso (Guardian Muda)',
                'password' => Hash::make('password'),
                'is_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        // 5. Seed completed simulation attempts for showcase user
        $scenarios = SimulationScenario::all();
        foreach ($scenarios as $scenario) {
            SimulationAttempt::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'simulation_scenario_id' => $scenario->id,
                ],
                [
                    'selected_option' => 'B',
                    'is_safe' => true,
                    'score' => 100,
                    'feedback_notes' => 'Tanda bahaya jelas: ekstensi berkas mencurigakan dan desakan waktu tanpa verifikasi suara.',
                ]
            );
        }

        // 6. Seed diverse scan histories for showcase user and guest users
        $demoScans = [
            // Authenticated Scan 1: High Risk APK Text
            [
                'user_id' => $user->id,
                'scan_type' => 'text',
                'content' => 'Undangan Pernikahan Digital Kami.apk Kami mengundang Bapak/Ibu hadir di resepsi pernikahan kami. Mohon pasang file surat undangan pernikahan digital ini.',
                'risk_level' => 'Tinggi',
                'score' => 15,
                'summary' => 'Pesan rekayasa sosial berkedok undangan pernikahan yang melampirkan berkas aplikasi Android (.APK) berbahaya untuk menyadap SMS OTP.',
                'red_flags' => [
                    'Mengirim berkas berekstensi .APK bukan format dokumen resmi seperti PDF.',
                    'Pengirim nomor asing yang tidak tersimpan di kontak.',
                    'Meminta penginstalan aplikasi eksternal.',
                ],
                'recommendations' => [
                    'Jangan pernah mengklik atau memasang berkas berekstensi .APK.',
                    'Hapus pesan dan blokir nomor telepon pengirim.',
                    'Peringatkan keluarga melalui WhatsApp Alert Generator.',
                ],
                'provider_used' => 'Heuristic Guardian Engine',
                'model_used' => 'guardian-heuristic-v1',
                'is_mock' => true,
                'metadata' => ['has_apk' => true],
            ],

            // Authenticated Scan 2: High Risk Phishing URL
            [
                'user_id' => $user->id,
                'scan_type' => 'url',
                'content' => 'Peringatan akun Anda dibekukan! Segera verifikasi data login di: https://bca-klik-keamanan.vip/login',
                'risk_level' => 'Tinggi',
                'score' => 10,
                'summary' => 'Tautan situs web phishing yang meniru halaman login internet banking dengan domain mencurigakan berakhiran .vip.',
                'red_flags' => [
                    'Domain bca-klik-keamanan.vip bukan domain resmi Bank BCA (.co.id).',
                    'Menggunakan kata kunci perbankan pada domain palsu (typosquatting).',
                    'Menciptakan urgensi ancaman pemblokiran rekening palsu.',
                ],
                'recommendations' => [
                    'Jangan pernah memasukkan User ID, PIN, atau kata sandi pada tautan asing.',
                    'Buka langsung aplikasi perbankan resmi mandiri atau hubungi Halo BCA resmi.',
                ],
                'provider_used' => 'UrlPhishingScanner',
                'model_used' => 'url-threat-heuristics-v2',
                'is_mock' => false,
                'metadata' => ['detected_url' => 'https://bca-klik-keamanan.vip/login'],
            ],

            // Authenticated Scan 3: High Risk Task Scam Text
            [
                'user_id' => $user->id,
                'scan_type' => 'text',
                'content' => 'Lowongan kerja sampingan online! Cukup like video TikTok dan follow akun, bayaran Rp 25.000 per tugas. Sehari bisa dapat Rp 1.500.000. Hubungi admin Telegram kami.',
                'risk_level' => 'Tinggi',
                'score' => 20,
                'summary' => 'Penipuan lowongan kerja paruh waktu modus Task Scam Telegram dengan iming-iming imbalan uang tidak wajar.',
                'red_flags' => [
                    'Pekerjaan sangat sepele namun menjanjikan komisi harian jutaan rupiah.',
                    'Komunikasi dialihkan ke grup Telegram dengan akun anonim.',
                    'Ciri khas modus setor uang deposit di awal untuk tugas berikutnya.',
                ],
                'recommendations' => [
                    'Pekerjaan yang sah membayar gaji karyawan, bukan meminta deposit uang.',
                    'Abaikan dan jangan pernah mentransfer deposit dana.',
                ],
                'provider_used' => 'Heuristic Guardian Engine',
                'model_used' => 'guardian-heuristic-v1',
                'is_mock' => true,
                'metadata' => ['platform' => 'Telegram'],
            ],

            // Authenticated Scan 4: Screenshot Image Scan (Medium Risk)
            [
                'user_id' => $user->id,
                'scan_type' => 'image',
                'content' => 'Tangkapan layar bukti transfer m-banking Rp 2.500.000 dengan logo bank tidak proporsional dan font nominal tidak serasi.',
                'risk_level' => 'Sedang',
                'score' => 50,
                'summary' => 'Tangkapan layar struk transfer menunjukkan anomali tipografi dan ketidaksesuaian nomor referensi transaksi.',
                'red_flags' => [
                    'Jenis huruf pada angka nominal berbeda dengan teks sekitarnya.',
                    'Kesejajaran logo institusi keuangan tampak kabur (indikasi rekayasa visual).',
                ],
                'recommendations' => [
                    'Cek mutasi rekening langsung pada aplikasi mobile banking resmi Anda.',
                    'Jangan kirimkan barang pesanan sebelum saldo benar-benar masuk ke rekening.',
                ],
                'provider_used' => 'Mock Heuristic Vision Engine',
                'model_used' => 'cekara-vision-heuristics-v1',
                'is_mock' => true,
                'metadata' => [
                    'image_filename' => 'bukti_transfer_palsu.png',
                ],
            ],

            // Authenticated Scan 5: Safe Text
            [
                'user_id' => $user->id,
                'scan_type' => 'text',
                'content' => 'Halo selamat siang Mas Andi, apakah materi presentasi untuk rapat evaluasi kinerja tim besok jam 2 siang sudah siap di drive bersama? Terima kasih.',
                'risk_level' => 'Rendah',
                'score' => 95,
                'summary' => 'Percakapan koordinasi kerja profesional normal tanpa indikasi manipulasi rekayasa sosial atau permintaan data rahasia.',
                'red_flags' => [],
                'recommendations' => [
                    'Pesan ini tampak wajar dan aman untuk ditanggapi.',
                    'Tetap jaga kerahasiaan kata sandi dan kredensial pribadi.',
                ],
                'provider_used' => 'Heuristic Guardian Engine',
                'model_used' => 'guardian-heuristic-v1',
                'is_mock' => true,
                'metadata' => [],
            ],

            // Guest Scan 1 (user_id = null): Pinjol Ilegal SMS
            [
                'user_id' => null,
                'scan_type' => 'text',
                'content' => 'DANA CEPAT CAIR! Pinjaman tanpa jaminan limit s/d 50jt bunga 0.1% langsung cair ke rekening. Klik dana-kilat-indonesia.top/klaim atau instal apk.',
                'risk_level' => 'Tinggi',
                'score' => 12,
                'summary' => 'Penawaran pinjaman online ilegal melalui SMS blast liar tanpa izin OJK dan mengarahkan ke domain tidak terdaftar.',
                'red_flags' => [
                    'Penawaran pinjaman melalui SMS nomor pribadi (pelanggaran regulasi OJK).',
                    'Menggunakan domain asing (.top) bukan domain resmi institusi keuangan.',
                ],
                'recommendations' => [
                    'Cek legalitas entitas pinjaman di website resmi OJK (ojk.go.id).',
                    'Blokir dan laporkan nomor pengirim ke aduankonten.id.',
                ],
                'provider_used' => 'Heuristic Guardian Engine',
                'model_used' => 'guardian-heuristic-v1',
                'is_mock' => true,
                'metadata' => ['is_guest' => true],
            ],

            // Guest Scan 2 (user_id = null): WebP Tab Snapshot Phishing
            [
                'user_id' => null,
                'scan_type' => 'image',
                'content' => 'Tangkapan layar halaman web login web-bri-info.xyz yang meniru halaman verifikasi bank resmi.',
                'risk_level' => 'Tinggi',
                'score' => 8,
                'summary' => 'Tangkapan layar tab peramban mendeteksi situs kloning perbankan yang dirancang untuk menjebak username dan kata sandi nasabah.',
                'red_flags' => [
                    'Alamat situs web tidak menggunakan sertifikat SSL bank terpercaya.',
                    'Formulir meminta input nomor kartu ATM lengkap beserta nomor CVV dan PIN.',
                ],
                'recommendations' => [
                    'Segera tutup tab peramban tersebut.',
                    'Jangan pernah mengisikan data finansial atau PIN pada formulir web asing.',
                ],
                'provider_used' => 'Mock Heuristic Vision Engine',
                'model_used' => 'cekara-vision-heuristics-v1',
                'is_mock' => true,
                'metadata' => [
                    'is_guest' => true,
                    'image_filename' => 'tab_snapshot.webp',
                ],
            ],

            // Guest Scan 3 (user_id = null): Safe URL
            [
                'user_id' => null,
                'scan_type' => 'url',
                'content' => 'https://kemkominfo.go.id/berita/waspada-kejahatan-siber',
                'risk_level' => 'Rendah',
                'score' => 98,
                'summary' => 'Tautan resmi portal pemerintah Republik Indonesia (domain go.id) dengan enkripsi aman HTTPS.',
                'red_flags' => [],
                'recommendations' => [
                    'Situs web resmi pemerintah aman untuk dikunjungi.',
                ],
                'provider_used' => 'UrlPhishingScanner',
                'model_used' => 'url-threat-heuristics-v2',
                'is_mock' => false,
                'metadata' => [
                    'is_guest' => true,
                    'detected_url' => 'https://kemkominfo.go.id/berita/waspada-kejahatan-siber',
                ],
            ],
        ];

        foreach ($demoScans as $scanData) {
            Scan::create($scanData);
        }
    }
}
