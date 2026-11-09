<?php

use App\Models\ScamPatternContribution;
use App\Models\User;
use Database\Seeders\CommunityRadarSeeder;

beforeEach(function () {
    $this->seed(CommunityRadarSeeder::class);
});

test('guest can view community threat radar page', function () {
    $response = $this->get(route('radar.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('radar/index')
        ->has('alerts')
        ->has('stats')
        ->has('filters')
    );
});

test('community radar can filter by category', function () {
    $response = $this->get(route('radar.index', ['category' => 'apk_malware']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('radar/index')
        ->where('filters.category', 'apk_malware')
    );
});

test('user can upvote a community alert', function () {
    $alert = ScamPatternContribution::create([
        'title' => 'Modus Stiker QRIS Palsu',
        'category' => 'social_engineering',
        'platform' => 'QRIS Fisik / Offline',
        'location' => 'Jakarta Selatan',
        'description' => 'Pelaku menempelkan stiker barcode QRIS miliknya sendiri.',
        'is_verified' => true,
        'upvotes_count' => 5,
    ]);
    $initialCount = $alert->upvotes_count;

    $response = $this->postJson(route('radar.upvote', $alert->id));

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'new_count' => $initialCount + 1,
    ]);

    expect($alert->fresh()->upvotes_count)->toBe($initialCount + 1);
});

test('user can submit a new threat report', function () {
    $response = $this->postJson(route('radar.store'), [
        'title' => 'Modus Stiker QRIS Palsu di Rest Area Tol Cipali',
        'category' => 'social_engineering',
        'platform' => 'QRIS Fisik / Offline',
        'location' => 'Subang, Jawa Barat',
        'description' => 'QRIS di kasir rest area tertempel stiker baru atas nama perorangan bukan nama rumah makan.',
        'evidence_text' => 'Nama penerima di aplikasi: Toko Berkah Pribadi.',
    ]);

    $response->assertStatus(201);
    $response->assertJson([
        'success' => true,
    ]);

    $this->assertDatabaseHas('scam_pattern_contributions', [
        'title' => 'Modus Stiker QRIS Palsu di Rest Area Tol Cipali',
        'platform' => 'QRIS Fisik / Offline',
    ]);
});

test('admin submission is auto-verified immediately', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $response = $this->actingAs($admin)->postJson(route('radar.store'), [
        'title' => 'Modus Panggilan Suara AI Menirukan Direktur Perusahaan',
        'category' => 'social_engineering',
        'platform' => 'Telepon / Voice',
        'location' => 'Jakarta Pusat',
        'description' => 'Suara AI menirukan atasan menyuruh bagian keuangan mentransfer dana proyek mendesak.',
    ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('scam_pattern_contributions', [
        'title' => 'Modus Panggilan Suara AI Menirukan Direktur Perusahaan',
        'is_verified' => true,
    ]);
});

test('report submission validates required inputs', function () {
    $response = $this->postJson(route('radar.store'), [
        'title' => '',
        'category' => '',
        'platform' => '',
        'description' => 'pendek',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['title', 'category', 'platform', 'description']);
});
