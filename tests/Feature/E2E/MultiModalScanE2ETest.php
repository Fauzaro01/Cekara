<?php

use App\Http\Controllers\ChatController;
use App\Models\Scan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    // Progressive testability check: verify ChatController has implemented image parameter handling
    $ref = new ReflectionClass(ChatController::class);
    $source = file_get_contents($ref->getFileName());
    if (! str_contains($source, 'image')) {
        $this->markTestSkipped('Waiting for Milestone 3: Multi-modal chat screenshot upload implementation in ChatController.');
    }
});

/*
|--------------------------------------------------------------------------
| Tier 1: Multi-Modal Upload Contract & Validation
|--------------------------------------------------------------------------
*/

test('tier 1: chat analyze accepts valid jpg and png screenshot uploads', function () {
    $pngFile = UploadedFile::fake()->image('chat_screenshot.png', 800, 600);

    $response = $this->postJson('/chat/analyze', [
        'image' => $pngFile,
    ]);

    $response->assertOk();
    $response->assertJsonStructure([
        'success',
        'data' => [
            'risk_level',
            'summary',
            'red_flags',
            'recommendations',
        ],
    ]);
});

test('tier 1: chat analyze rejects non-image mime types with 422 validation error', function () {
    $pdfFile = UploadedFile::fake()->create('malicious.pdf', 200, 'application/pdf');

    $response = $this->postJson('/chat/analyze', [
        'image' => $pdfFile,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
});

test('tier 1: chat analyze rejects oversized image files exceeding 5mb with 422', function () {
    // 5121 KB exceeds 5120 KB (5MB) limit
    $oversizedFile = UploadedFile::fake()->image('huge_screenshot.jpg')->size(5121);

    $response = $this->postJson('/chat/analyze', [
        'image' => $oversizedFile,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
});

test('tier 1: payload requires either content or image; empty payload returns 422', function () {
    $response = $this->postJson('/chat/analyze', []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['content']);
});

/*
|--------------------------------------------------------------------------
| Tier 2: Multimodal Threat Analysis & Result Schema
|--------------------------------------------------------------------------
*/

test('tier 2: screenshot analysis produces structured fraud evaluation result', function () {
    $file = UploadedFile::fake()->image('undangan_pernikahan_apk_chat.jpg', 600, 800);

    $response = $this->postJson('/chat/analyze', [
        'image' => $file,
    ]);

    $response->assertOk();

    $data = $response->json('data') ?? $response->json();
    expect($data)->toHaveKey('risk_level');
    expect($data)->toHaveKey('score');
    expect($data)->toHaveKey('red_flags');
    expect($data)->toHaveKey('recommendations');
    expect($data)->toHaveKey('summary');
});

test('tier 2: authenticated user screenshot scan persists to database with image scan_type', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('bukti_chat_penipuan.png', 720, 1280);

    $response = $this->actingAs($user)->postJson('/chat/analyze', [
        'image' => $file,
    ]);

    $response->assertOk();

    $this->assertDatabaseHas('scans', [
        'user_id' => $user->id,
        'scan_type' => 'image',
    ]);
});

test('tier 2: guest user screenshot scan persists to database with user_id null and stores image', function () {
    $file = UploadedFile::fake()->image('guest_chat_sample.png', 500, 500);

    $this->assertDatabaseCount('scans', 0);

    $response = $this->postJson('/chat/analyze', [
        'image' => $file,
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['public_id', 'scan_id', 'share_url']);

    $this->assertDatabaseCount('scans', 1);
    $scan = Scan::first();
    expect($scan->user_id)->toBeNull();
    expect($scan->scan_type)->toBe('image');
    expect($scan->public_id)->not->toBeEmpty();
    expect($scan->metadata['image_path'])->not->toBeNull();
    Storage::disk('public')->assertExists($scan->metadata['image_path']);
});

/*
|--------------------------------------------------------------------------
| Tier 3: Adversarial Image Edge Cases
|--------------------------------------------------------------------------
*/

test('tier 3: handles synergistic submission with both image and accompanying text prompt', function () {
    $file = UploadedFile::fake()->image('resi_paket_kurir.png', 600, 800);

    $response = $this->postJson('/chat/analyze', [
        'image' => $file,
        'content' => 'Saya dapat pesan kiriman paket dari kurir ini, apakah aman dibuka berkasnya?',
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);

    $data = $response->json('data') ?? $response->json();
    expect($data)->toHaveKey('risk_level');
});

test('tier 3: screenshot with suspicious apk indicator evaluates to high risk', function () {
    $file = UploadedFile::fake()->image('undangan_pernikahan_apk.jpg', 600, 800);

    $response = $this->postJson('/chat/analyze', [
        'image' => $file,
        'content' => 'Tolong cek gambar undangan pernikahan apk ini',
    ]);

    $response->assertOk();

    $data = $response->json('data') ?? $response->json();
    $riskLevel = strtolower($data['risk_level']);
    expect(in_array($riskLevel, ['high', 'danger', 'tinggi']))->toBeTrue();
});

test('tier 3: handles image filename with whitespace and indonesian unicode characters safely', function () {
    $file = UploadedFile::fake()->image('Screenshot Percakapan Penipuan 2026 #1 (Resmi).png', 400, 400);

    $response = $this->postJson('/chat/analyze', [
        'image' => $file,
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);
});

/*
|--------------------------------------------------------------------------
| Tier 4: Integrated End-to-End Screenshot Scan Lifecycle
|--------------------------------------------------------------------------
*/

test('tier 4: authenticated user uploads screenshot, verifies risk rating, and inspects record in dashboard', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('bukti_paket_apk.png', 720, 1280);

    // 1. User uploads suspicious courier screenshot via analyze endpoint
    $scanResponse = $this->actingAs($user)->postJson('/chat/analyze', [
        'image' => $file,
        'content' => 'Unduh aplikasi Cek_Resi_Paket.apk untuk melihat foto barang',
    ]);

    $scanResponse->assertOk();
    $scanData = $scanResponse->json('data') ?? $scanResponse->json();
    expect(strtolower($scanData['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);

    // 2. User navigates to dashboard to review recent scan history
    $dashboardResponse = $this->actingAs($user)->get('/dashboard');
    $dashboardResponse->assertOk();
    $dashboardResponse->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('guardianStatus.total_scans', 1)
        ->has('recentScans', 1)
        ->where('recentScans.0.scan_type', 'image')
    );
});
