<?php

use App\Models\SimulationScenario;
use App\Models\User;

test('guest is redirected to login when accessing admin simulations page', function () {
    $response = $this->get('/admin/simulasi');

    $response->assertRedirect('/login');
});

test('non-admin user receives 403 forbidden when accessing admin simulations page', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $response = $this->actingAs($user)->get('/admin/simulasi');

    $response->assertForbidden();
});

test('admin can access admin simulations page and view stats', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $response = $this->actingAs($admin)->get('/admin/simulasi');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/simulations/index')
        ->has('scenarios')
        ->has('stats')
        ->has('filters')
    );
});

test('admin can create a new simulation scenario', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $payload = [
        'title' => 'Modus Phishing QRIS Palsu',
        'category' => 'phishing_banking',
        'difficulty' => 'sedang',
        'context_description' => 'Pelaku menempel stiker QRIS palsu di kotak amal masjid.',
        'sender_name' => 'Stiker QRIS Rekening Penipu',
        'sender_avatar' => 'bank',
        'chat_messages' => [
            [
                'sender' => 'scammer',
                'text' => 'Silakan scan QRIS ini untuk berdonasi langsung.',
                'time' => '08:30',
            ],
        ],
        'options' => [
            [
                'id' => 'A',
                'text' => 'Langsung scan dan transfer tanpa mengecek nama merchant.',
                'is_safe' => false,
                'score' => 0,
                'explanation' => 'Sangat berisiko! Dana donasi akan masuk ke rekening penipu.',
            ],
            [
                'id' => 'B',
                'text' => 'Periksa kesesuaian nama merchant yang tertera di aplikasi dengan pengurus resmi.',
                'is_safe' => true,
                'score' => 100,
                'explanation' => 'Tepat! Selalu cocokkan nama merchant resmi sebelum memasukkan PIN.',
            ],
        ],
        'psychological_tricks' => ['Memanfaatkan niat baik beramal korban'],
        'red_flags' => ['Stiker QRIS terlihat baru ditumpuk di atas kode lama'],
        'prevention_advice' => 'Cek selalu nama toko/lembaga yang muncul di layar M-Banking sebelum konfirmasi pembayaran.',
        'order' => 1,
        'is_active' => true,
    ];

    $response = $this->actingAs($admin)->post('/admin/simulasi', $payload);

    $response->assertRedirect('/admin/simulasi');
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('simulation_scenarios', [
        'title' => 'Modus Phishing QRIS Palsu',
        'category' => 'phishing_banking',
        'sender_name' => 'Stiker QRIS Rekening Penipu',
    ]);
});

test('admin can update an existing simulation scenario', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $scenario = SimulationScenario::create([
        'title' => 'Modus Undian SMS Awal',
        'slug' => 'modus-undian-sms-awal',
        'category' => 'fake_giveaway',
        'difficulty' => 'mudah',
        'context_description' => 'SMS mengabarkan hadiah 100 juta.',
        'sender_name' => 'Pemberitahuan Pemenang',
        'chat_messages' => [
            [
                'sender' => 'scammer',
                'text' => 'Selamat Anda memenangkan Rp100.000.000',
                'time' => '09:00',
            ],
        ],
        'options' => [
            [
                'id' => 'A',
                'text' => 'Kirim uang administrasi.',
                'is_safe' => false,
                'score' => 0,
                'explanation' => 'Salah!',
            ],
            [
                'id' => 'B',
                'text' => 'Abaikan SMS.',
                'is_safe' => true,
                'score' => 100,
                'explanation' => 'Benar!',
            ],
        ],
        'psychological_tricks' => ['Keserakahan'],
        'red_flags' => ['Minta transfer uang tebusan'],
        'prevention_advice' => 'Abaikan undian yang tidak pernah Anda ikuti.',
        'order' => 2,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->put("/admin/simulasi/{$scenario->id}", [
        'title' => 'Modus Undian SMS Revisi Baru',
        'slug' => 'modus-undian-sms-awal',
        'category' => 'fake_giveaway',
        'difficulty' => 'sulit',
        'context_description' => 'SMS mengabarkan hadiah dengan tautan website palsu.',
        'sender_name' => 'Pemberitahuan Pemenang Telkomsel',
        'sender_avatar' => 'gamepad',
        'chat_messages' => [
            [
                'sender' => 'scammer',
                'text' => 'Selamat Anda memenangkan undian poin.',
                'time' => '09:05',
            ],
        ],
        'options' => [
            [
                'id' => 'A',
                'text' => 'Buka link situs palsu.',
                'is_safe' => false,
                'score' => 0,
                'explanation' => 'Berbahaya!',
            ],
            [
                'id' => 'B',
                'text' => 'Hubungi call center resmi.',
                'is_safe' => true,
                'score' => 100,
                'explanation' => 'Aman!',
            ],
        ],
        'psychological_tricks' => ['Euforia hadiah tiba-tiba'],
        'red_flags' => ['Tautan bukan domain resmi'],
        'prevention_advice' => 'Cek ke nomor resmi operator.',
        'order' => 3,
        'is_active' => true,
    ]);

    $response->assertRedirect('/admin/simulasi');
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('simulation_scenarios', [
        'id' => $scenario->id,
        'title' => 'Modus Undian SMS Revisi Baru',
        'difficulty' => 'sulit',
    ]);
});

test('admin can toggle active status of simulation scenario', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $scenario = SimulationScenario::create([
        'title' => 'Skenario Uji Status',
        'slug' => 'skenario-uji-status',
        'category' => 'fake_job',
        'difficulty' => 'mudah',
        'context_description' => 'Deskripsi uji',
        'sender_name' => 'HRD Palsu',
        'chat_messages' => [['sender' => 'scammer', 'text' => 'Halo', 'time' => '10:00']],
        'options' => [
            ['id' => 'A', 'text' => 'A', 'is_safe' => false, 'score' => 0, 'explanation' => 'A'],
            ['id' => 'B', 'text' => 'B', 'is_safe' => true, 'score' => 100, 'explanation' => 'B'],
        ],
        'psychological_tricks' => [],
        'red_flags' => [],
        'prevention_advice' => 'Hati-hati',
        'is_active' => true,
    ]);

    $this->actingAs($admin)->patch("/admin/simulasi/{$scenario->id}/toggle-active");
    expect($scenario->fresh()->is_active)->toBeFalse();

    $this->actingAs($admin)->patch("/admin/simulasi/{$scenario->id}/toggle-active");
    expect($scenario->fresh()->is_active)->toBeTrue();
});

test('admin can delete a simulation scenario', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $scenario = SimulationScenario::create([
        'title' => 'Skenario Hapus',
        'slug' => 'skenario-hapus',
        'category' => 'loan_scam',
        'difficulty' => 'mudah',
        'context_description' => 'Deskripsi hapus',
        'sender_name' => 'Pinjol Ilegal',
        'chat_messages' => [['sender' => 'scammer', 'text' => 'Halo', 'time' => '10:00']],
        'options' => [
            ['id' => 'A', 'text' => 'A', 'is_safe' => false, 'score' => 0, 'explanation' => 'A'],
            ['id' => 'B', 'text' => 'B', 'is_safe' => true, 'score' => 100, 'explanation' => 'B'],
        ],
        'psychological_tricks' => [],
        'red_flags' => [],
        'prevention_advice' => 'Hati-hati',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->delete("/admin/simulasi/{$scenario->id}");

    $response->assertRedirect('/admin/simulasi');
    $this->assertDatabaseMissing('simulation_scenarios', [
        'id' => $scenario->id,
    ]);
});
