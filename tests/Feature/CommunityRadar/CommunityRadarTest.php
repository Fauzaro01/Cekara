<?php

use App\Events\CommunityMessageReacted;
use App\Events\CommunityMessageSent;
use App\Events\CommunityRoomCreated;
use App\Models\CommunityMessage;
use App\Models\CommunityRoom;
use App\Models\ScamPatternContribution;
use App\Models\User;
use Database\Seeders\CommunityRadarSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(CommunityRadarSeeder::class);
});

test('guest can view community threat radar page with discussion rooms', function () {
    $response = $this->get(route('radar.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('radar/index')
        ->has('alerts')
        ->has('rooms')
        ->has('dailyRoomQuota')
        ->has('realtimeConfig')
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
    $alert = ScamPatternContribution::first();
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

test('authenticated user can create up to 3 discussion rooms per day and 4th attempt is rejected', function () {
    Event::fake([CommunityRoomCreated::class]);
    $user = User::factory()->create();

    for ($i = 1; $i <= 3; $i++) {
        $response = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
            'title' => "Ruang Diskusi Investigasi Kasus Ke-{$i}",
            'category' => 'apk_malware',
            'description' => "Pembahasan mendalam mengenai modus file APK berbahaya bagian {$i}.",
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('daily_room_quota.used', $i);
        $response->assertJsonPath('daily_room_quota.remaining', 3 - $i);
    }

    Event::assertDispatchedTimes(CommunityRoomCreated::class, 3);

    // 4th attempt on the same day must fail with 422
    $fourthResponse = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => 'Ruang Diskusi Ke-4 yang Melebihi Kuota Harian',
        'category' => 'phishing_banking',
        'description' => 'Percobaan membuat ruang ke-4 di hari yang sama harus ditolak.',
    ]);

    $fourthResponse->assertStatus(422);
    $fourthResponse->assertJsonValidationErrors(['quota']);
    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(3);
});

test('authenticated user can send markdown messages and upload images in a discussion room', function () {
    Event::fake([CommunityMessageSent::class]);
    Storage::fake('public');

    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $image = UploadedFile::fake()->image('bukti-chat-penipu.png', 600, 400);
    $markdownBody = "Waspada nomor **`0812-0000-9999`** mengirim file `Tagihan_PLN.apk`!\n\n> Jangan pernah klik izinkan instalasi.";

    $response = $this->actingAs($user)->post(route('radar.rooms.messages.store', $room->id), [
        'body' => $markdownBody,
        'image' => $image,
    ], ['Accept' => 'application/json']);

    $response->assertStatus(201);
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('message.body', $markdownBody);
    expect($response->json('message.image_url'))->not->toBeNull();

    Event::assertDispatched(CommunityMessageSent::class, function (CommunityMessageSent $event) use ($room) {
        return $event->roomId === $room->id;
    });
});

test('authenticated user can toggle like and keyboard emoji reactions in real-time', function () {
    Event::fake([CommunityMessageReacted::class]);

    $user = User::factory()->create();
    $message = CommunityMessage::firstOrFail();

    // Add keyboard emoji reaction
    $addResponse = $this->actingAs($user)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => '🚀',
    ]);

    $addResponse->assertOk();
    $addResponse->assertJsonPath('action', 'added');

    // Toggle off the same emoji
    $removeResponse = $this->actingAs($user)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => '🚀',
    ]);

    $removeResponse->assertOk();
    $removeResponse->assertJsonPath('action', 'removed');

    Event::assertDispatchedTimes(CommunityMessageReacted::class, 2);
});

test('real-time sync endpoint returns rooms and daily quota', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $response = $this->actingAs($user)->getJson(route('radar.sync', ['room_id' => $room->id]));

    $response->assertOk();
    $response->assertJsonStructure([
        'rooms',
        'alert_upvotes',
        'daily_room_quota' => ['used', 'max', 'remaining'],
        'server_time',
    ]);
});
