<?php

use App\Models\Scan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('unauthenticated guest can view scan result page via public_id', function () {
    $scan = Scan::factory()->create([
        'user_id' => null,
        'public_id' => (string) Str::uuid(),
        'risk_level' => 'HIGH',
        'score' => 90,
        'summary' => 'Halaman terindikasi phishing perbankan.',
    ]);

    $response = $this->get("/scans/{$scan->public_id}");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('scans/show')
        ->has('scan', fn (Assert $s) => $s
            ->where('public_id', $scan->public_id)
            ->where('risk_level', 'HIGH')
            ->where('score', 90)
            ->where('summary', 'Halaman terindikasi phishing perbankan.')
            ->etc()
        )
    );
});

test('authenticated user can view scan result page via public_id', function () {
    $user = User::factory()->create();
    $scan = Scan::factory()->create([
        'user_id' => $user->id,
        'public_id' => (string) Str::uuid(),
    ]);

    $response = $this->actingAs($user)->get("/scans/{$scan->public_id}");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('scans/show')
        ->where('scan.public_id', $scan->public_id)
    );
});

test('accessing non-existent public_id returns 404 not found', function () {
    $randomUuid = (string) Str::uuid();

    $response = $this->get("/scans/{$randomUuid}");

    $response->assertNotFound();
});

test('public scan view resolves storage url for uploaded screenshot images', function () {
    Storage::fake('public');
    $imagePath = 'scans/test_snapshot.webp';
    Storage::disk('public')->put($imagePath, 'fake webp content');

    $scan = Scan::factory()->create([
        'user_id' => null,
        'scan_type' => 'image',
        'metadata' => [
            'image_path' => $imagePath,
            'image_filename' => 'tab_snapshot.webp',
        ],
    ]);

    $response = $this->get("/scans/{$scan->public_id}");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('scans/show')
        ->where('scan.image_url', Storage::disk('public')->url($imagePath))
    );
});

test('chat analyze accepts valid webp image format and persists scan with share_url', function () {
    Storage::fake('public');
    $webpImage = UploadedFile::fake()->image('tab_snapshot.webp', 1280, 720);

    $response = $this->postJson('/chat/analyze', [
        'image' => $webpImage,
        'content' => 'Analisis tab browser dalam format WebP',
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);
    $response->assertJsonStructure(['public_id', 'scan_id', 'share_url']);

    $scan = Scan::latest('id')->first();
    expect($scan->scan_type)->toBe('image');
    expect($scan->public_id)->toBe($response->json('public_id'));
    expect($response->json('share_url'))->toBe(url("/scans/{$scan->public_id}"));
    Storage::disk('public')->assertExists($scan->metadata['image_path']);
});

test('chat analyze rejects fake executable disguised as webp file', function () {
    $fakeWebp = UploadedFile::fake()->create('exploit.webp', 100, 'application/x-php');

    $response = $this->postJson('/chat/analyze', [
        'image' => $fakeWebp,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
});

test('api scan show returns json scan data by public_id', function () {
    $scan = Scan::factory()->create([
        'user_id' => null,
        'public_id' => (string) Str::uuid(),
        'risk_level' => 'HIGH',
        'score' => 88,
        'summary' => 'Halaman terindikasi scam.',
        'red_flags' => ['Indikasi 1', 'Indikasi 2'],
        'recommendations' => ['Rekomendasi 1'],
    ]);

    $response = $this->getJson("/api/scans/{$scan->public_id}");

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'scan' => [
            'public_id' => $scan->public_id,
            'risk_level' => 'HIGH',
            'score' => 88,
            'summary' => 'Halaman terindikasi scam.',
            'red_flags' => ['Indikasi 1', 'Indikasi 2'],
            'recommendations' => ['Rekomendasi 1'],
        ],
    ]);
});

test('api scan show returns 404 for unknown public_id', function () {
    $randomUuid = (string) Str::uuid();

    $response = $this->getJson("/api/scans/{$randomUuid}");

    $response->assertNotFound();
    $response->assertJson([
        'success' => false,
        'message' => 'Scan not found',
    ]);
});

