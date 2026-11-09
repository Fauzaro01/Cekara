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
            SimulationScenarioSeeder::class,
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
            ]
        );

        // 3. Showcase User account
        $user = User::updateOrCreate(
            ['email' => 'guardian@cekara.id'],
            [
                'name' => 'Fauzar (Master Guardian)',
                'password' => Hash::make('password'),
                'is_admin' => false,
            ]
        );

        // 4. Seed completed simulation attempts to achieve 'Master Guardian' rank
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

        // 5. Seed diverse scan histories for the showcase user
        $demoScans = [
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
        ];

        foreach ($demoScans as $scanData) {
            Scan::create($scanData);
        }
    }
}
