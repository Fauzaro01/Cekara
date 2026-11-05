<?php

namespace Database\Factories;

use App\Models\Scan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Scan>
 */
class ScanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'scan_type' => 'text',
            'content' => 'Selamat! Nomor Anda terpilih mendapatkan dana apresiasi Rp 10.000.000. Klaim di bit.ly/hadiah-resmi',
            'risk_level' => 'HIGH',
            'score' => 95,
            'summary' => 'Pesan terindikasi kuat sebagai penipuan berhadiah phishing.',
            'red_flags' => [
                'Iming-iming hadiah instan tanpa pendaftaran.',
                'Tautan mencurigakan menggunakan pemendek URL.',
            ],
            'recommendations' => [
                'Jangan klik tautan.',
                'Blokir nomor dan laporkan pesan.',
            ],
            'provider_used' => 'gemini',
            'model_used' => 'gemini-1.5-flash',
            'is_mock' => false,
            'metadata' => null,
        ];
    }

    /**
     * Indicate that the scan is safe.
     */
    public function safe(): static
    {
        return $this->state(fn (array $attributes) => [
            'risk_level' => 'LOW',
            'score' => 10,
            'summary' => 'Pesan tampak wajar dan tidak terindikasi pola penipuan.',
            'red_flags' => [],
            'recommendations' => ['Tetap waspada terhadap permintaan data sensitif.'],
        ]);
    }

    /**
     * Indicate that the scan is a URL scan.
     */
    public function url(): static
    {
        return $this->state(fn (array $attributes) => [
            'scan_type' => 'url',
            'content' => 'https://klik-bca-verifikasi-keamanan.xyz',
        ]);
    }

    /**
     * Indicate that the scan is an image scan.
     */
    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'scan_type' => 'image',
            'content' => 'Screenshot percakapan WhatsApp modus paket kurir APK.',
            'metadata' => [
                'filename' => 'chat_screenshot.png',
                'mime_type' => 'image/png',
                'size_kb' => 450,
            ],
        ]);
    }
}
