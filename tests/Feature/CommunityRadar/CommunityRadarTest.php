<?php

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
use Illuminate\Support\Str;

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

test('authenticated user can toggle like and keyboard emoji reactions instantly', function () {
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

test('unauthenticated guest cannot create a discussion room', function () {
    $response = $this->postJson(route('radar.rooms.store'), [
        'title' => 'Ruang Diskusi Percobaan Guest',
        'category' => 'general',
        'description' => 'Percobaan membuat ruang oleh guest tanpa autentikasi.',
    ]);

    $response->assertUnauthorized();
    expect(CommunityRoom::where('title', 'Ruang Diskusi Percobaan Guest')->exists())->toBeFalse();
});

test('unauthenticated guest cannot post a message in a discussion room', function () {
    $room = CommunityRoom::firstOrFail();

    $response = $this->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => 'Pesan percobaan dari guest tanpa login.',
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated guest cannot toggle a message reaction', function () {
    $message = CommunityMessage::firstOrFail();

    $response = $this->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => '👍',
    ]);

    $response->assertUnauthorized();
});

test('sending a message with neither body nor image fails with 422', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $response = $this->actingAs($user)->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => '',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['body', 'image']);
});

test('uploading an image exceeding 5MB fails with 422', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    // 5200 KB > 5120 KB (5 MB limit)
    $oversizedFile = UploadedFile::fake()->create('bukti-terlalu-besar.png', 5200, 'image/png');

    $response = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        ['image' => $oversizedFile],
        ['Accept' => 'application/json']
    );

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
    expect($response->json('errors.image.0'))->toContain('5 MB');
});

test('authenticated user can send text-only message without image', function () {
    Event::fake([CommunityMessageSent::class]);
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $response = $this->actingAs($user)->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => 'Pesan informasi teks saja tanpa lampiran berkas gambar.',
    ]);

    $response->assertStatus(201);
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('message.body', 'Pesan informasi teks saja tanpa lampiran berkas gambar.');
    expect($response->json('message.image_url'))->toBeNull();
});

test('authenticated user can send image-only message without body text', function () {
    Event::fake([CommunityMessageSent::class]);
    Storage::fake('public');

    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();
    $image = UploadedFile::fake()->image('hanya-gambar.png', 400, 300);

    $response = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        ['image' => $image],
        ['Accept' => 'application/json']
    );

    $response->assertStatus(201);
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('message.body', null);
    expect($response->json('message.image_url'))->not->toBeNull();
});

test('rooms created yesterday do not count against todays 3-room quota', function () {
    Event::fake([CommunityRoomCreated::class]);
    $user = User::factory()->create();

    // Create 3 rooms yesterday for this user
    for ($i = 1; $i <= 3; $i++) {
        $yesterdayRoom = CommunityRoom::create([
            'user_id' => $user->id,
            'title' => "Ruang Kemarin #{$i}",
            'slug' => "ruang-kemarin-{$i}-".Str::lower(Str::random(6)),
            'category' => 'apk_malware',
            'description' => "Pembahasan kasus penipuan kemarin bagian {$i}.",
            'is_pinned' => false,
        ]);
        CommunityRoom::where('id', $yesterdayRoom->id)->update([
            'created_at' => now()->subDay(),
        ]);
    }

    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(3);

    // Today the user should still be able to create 3 rooms
    for ($i = 1; $i <= 3; $i++) {
        $response = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
            'title' => "Ruang Baru Hari Ini #{$i}",
            'category' => 'phishing_banking',
            'description' => "Diskusi valid dibuat hari ini bagian {$i}.",
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('daily_room_quota.used', $i);
        $response->assertJsonPath('daily_room_quota.remaining', 3 - $i);
    }

    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(6);

    // 4th room today must fail with 422 quota exceeded
    $fourthResponse = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => 'Ruang Hari Ini Ke-4 Melebihi Kuota',
        'category' => 'social_engineering',
        'description' => 'Percobaan membuat ruang ke-4 hari ini harus ditolak.',
    ]);

    $fourthResponse->assertStatus(422);
    $fourthResponse->assertJsonValidationErrors(['quota']);
    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(6);
});

test('admin cannot create discussion rooms and is restricted to read-only monitoring', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $response = $this->actingAs($admin)->postJson(route('radar.rooms.store'), [
        'title' => 'Admin mencoba membuat ruang diskusi',
        'category' => 'apk_malware',
        'description' => 'Admin hanya boleh memantau komunitas.',
    ]);

    $response->assertStatus(403);
    $response->assertJsonPath('message', 'Administrator dalam mode pemantauan hanya-lihat dan tidak dapat membuat ruang diskusi.');
});

test('admin cannot post messages in discussion rooms', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $room = CommunityRoom::firstOrFail();

    $response = $this->actingAs($admin)->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => 'Admin mencoba mengirim pesan.',
    ]);

    $response->assertStatus(403);
    $response->assertJsonPath('message', 'Administrator dalam mode pemantauan hanya-lihat dan tidak dapat mengirim pesan diskusi.');
});

test('admin cannot react to messages or upvote alerts', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $room = CommunityRoom::firstOrFail();
    $message = CommunityMessage::where('community_room_id', $room->id)->firstOrFail();
    $alert = ScamPatternContribution::firstOrFail();

    $reactionResponse = $this->actingAs($admin)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => '👍',
    ]);
    $reactionResponse->assertStatus(403);

    $upvoteResponse = $this->actingAs($admin)->postJson(route('radar.upvote', $alert->id));
    $upvoteResponse->assertStatus(403);
});

test('admin can add a new discussion category', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $response = $this->actingAs($admin)->postJson(route('radar.categories.store'), [
        'label' => 'Modus AI Voice & Deepfake',
        'key' => 'ai_voice_deepfake',
        'variant' => 'danger',
    ]);

    $response->assertStatus(201);
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('category.key', 'ai_voice_deepfake');
    $response->assertJsonPath('category.label', 'Modus AI Voice & Deepfake');

    $this->assertDatabaseHas('community_categories', [
        'key' => 'ai_voice_deepfake',
        'label' => 'Modus AI Voice & Deepfake',
        'variant' => 'danger',
    ]);

    // Non-admin attempt should be 403
    $regularUser = User::factory()->create(['is_admin' => false]);
    $forbiddenResponse = $this->actingAs($regularUser)->postJson(route('radar.categories.store'), [
        'label' => 'Kategori Ilegal',
    ]);
    $forbiddenResponse->assertStatus(403);
});

test('admin can update a discussion room category', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $room = CommunityRoom::firstOrFail();

    $response = $this->actingAs($admin)->patchJson(route('radar.rooms.category.update', $room->id), [
        'category' => 'phishing_banking',
    ]);

    $response->assertOk();
    $response->assertJsonPath('success', true);
    expect($room->fresh()->category)->toBe('phishing_banking');

    // Regular user cannot update room category
    $regularUser = User::factory()->create(['is_admin' => false]);
    $forbiddenResponse = $this->actingAs($regularUser)->patchJson(route('radar.rooms.category.update', $room->id), [
        'category' => 'fake_job',
    ]);
    $forbiddenResponse->assertStatus(403);
});

test('admin can delete a scam pattern contribution and non-admin is forbidden', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $pattern = ScamPatternContribution::create([
        'title' => 'Modus Penipuan Uji Coba',
        'category' => 'fake_job',
        'platform' => 'WhatsApp',
        'description' => 'Deskripsi modus uji coba yang akan dihapus oleh admin.',
        'is_verified' => true,
    ]);

    $regularUser = User::factory()->create(['is_admin' => false]);
    $forbiddenResponse = $this->actingAs($regularUser)->deleteJson(route('radar.patterns.destroy', $pattern->id));
    $forbiddenResponse->assertStatus(403);

    $response = $this->actingAs($admin)->deleteJson(route('radar.patterns.destroy', $pattern->id));
    $response->assertOk();
    $response->assertJsonPath('success', true);
    expect(ScamPatternContribution::find($pattern->id))->toBeNull();
});

test('admin can verify a discussion room as radar pattern', function () {
    $creator = User::factory()->create(['name' => 'Warga Waspada']);
    $admin = User::factory()->create(['is_admin' => true]);

    $room = CommunityRoom::create([
        'user_id' => $creator->id,
        'title' => 'Waspada Modus Undangan Nikah APK di Grup RT',
        'slug' => 'waspada-modus-undangan-nikah-apk-'.\Illuminate\Support\Str::random(6),
        'category' => 'apk_malware',
        'description' => 'Pelaku mengaku kerabat lalu mengirim file berkas surat.apk.',
        'is_active' => true,
        'last_activity_at' => now(),
    ]);

    $regularUser = User::factory()->create(['is_admin' => false]);
    $forbiddenResponse = $this->actingAs($regularUser)->postJson(route('radar.rooms.verify-as-pattern', $room->id), [
        'title' => 'Modus Undangan Nikah APK',
        'category' => 'apk_malware',
        'platform' => 'WhatsApp',
        'description' => 'Ringkasan modus terverifikasi.',
    ]);
    $forbiddenResponse->assertStatus(403);

    $response = $this->actingAs($admin)->postJson(route('radar.rooms.verify-as-pattern', $room->id), [
        'title' => 'Modus Undangan Nikah APK Resmi Terverifikasi',
        'category' => 'apk_malware',
        'platform' => 'WhatsApp',
        'location' => 'Jabodetabek',
        'description' => 'Pelaku mengirimkan file .apk dengan dalih undangan pernikahan via WA.',
        'evidence_text' => 'Undangan_Pernikahan.apk',
    ]);

    $response->assertStatus(201);
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('alert.title', 'Modus Undangan Nikah APK Resmi Terverifikasi');
    $response->assertJsonPath('alert.community_room_id', $room->id);
    $response->assertJsonPath('room.is_verified_radar', true);

    $createdPattern = ScamPatternContribution::where('community_room_id', $room->id)->first();
    expect($createdPattern)->not->toBeNull()
        ->and($createdPattern->user_id)->toBe($creator->id)
        ->and($createdPattern->is_verified)->toBeTrue()
        ->and($createdPattern->title)->toBe('Modus Undangan Nikah APK Resmi Terverifikasi');
});

test('admin or room owner can delete discussion room while other users are forbidden', function () {
    \Illuminate\Support\Facades\Event::fake([
        \App\Events\CommunityRoomDeleted::class,
    ]);

    $owner = User::factory()->create();
    $admin = User::factory()->create(['is_admin' => true]);
    $stranger = User::factory()->create();

    $room = CommunityRoom::create([
        'user_id' => $owner->id,
        'title' => 'Ruang Diskusi Yang Akan Dihapus',
        'slug' => 'ruang-diskusi-dihapus-'.\Illuminate\Support\Str::random(6),
        'category' => 'apk_malware',
        'description' => 'Deskripsi ruang',
        'is_active' => true,
    ]);

    // Stranger cannot delete
    $forbiddenRes = $this->actingAs($stranger)->deleteJson(route('radar.rooms.destroy', $room->id));
    $forbiddenRes->assertStatus(403);
    expect(CommunityRoom::find($room->id))->not->toBeNull();

    // Owner can delete without reason
    $successRes = $this->actingAs($owner)->deleteJson(route('radar.rooms.destroy', $room->id));
    $successRes->assertOk();
    $successRes->assertJsonPath('success', true);
    expect(CommunityRoom::find($room->id))->toBeNull();
    \Illuminate\Support\Facades\Event::assertDispatched(\App\Events\CommunityRoomDeleted::class);

    // Create another room to test admin delete
    $room2 = CommunityRoom::create([
        'user_id' => $owner->id,
        'title' => 'Ruang Dihapus Admin',
        'slug' => 'ruang-dihapus-admin-'.\Illuminate\Support\Str::random(6),
        'category' => 'apk_malware',
        'description' => 'Deskripsi ruang',
        'is_active' => true,
    ]);

    // Admin without reason fails validation
    $adminNoReasonRes = $this->actingAs($admin)->deleteJson(route('radar.rooms.destroy', $room2->id));
    $adminNoReasonRes->assertStatus(422);

    // Admin with reason succeeds and creates Moderation Notice
    $adminSuccessRes = $this->actingAs($admin)->deleteJson(route('radar.rooms.destroy', $room2->id), [
        'reason' => 'Ruang mengandung kata-kata yang tidak pantas dan memicu keributan.',
    ]);
    $adminSuccessRes->assertOk();
    expect(CommunityRoom::find($room2->id))->toBeNull();

    $notice = \App\Models\CommunityModerationNotice::where('user_id', $owner->id)
        ->where('type', 'room_deleted')
        ->first();
    expect($notice)->not->toBeNull()
        ->and($notice->reason)->toBe('Ruang mengandung kata-kata yang tidak pantas dan memicu keributan.')
        ->and($notice->admin_id)->toBe($admin->id);
});

test('admin or message author can delete individual message while other users are forbidden', function () {
    \Illuminate\Support\Facades\Event::fake([
        \App\Events\CommunityMessageDeleted::class,
        \App\Events\CommunityModerationNoticeCreated::class,
    ]);

    $roomOwner = User::factory()->create();
    $author = User::factory()->create();
    $admin = User::factory()->create(['is_admin' => true]);
    $stranger = User::factory()->create();

    $room = CommunityRoom::create([
        'user_id' => $roomOwner->id,
        'title' => 'Ruang Uji Pesan',
        'slug' => 'ruang-uji-pesan-'.\Illuminate\Support\Str::random(6),
        'category' => 'apk_malware',
        'description' => 'Deskripsi ruang',
        'is_active' => true,
    ]);

    $message = \App\Models\CommunityMessage::create([
        'community_room_id' => $room->id,
        'user_id' => $author->id,
        'body' => 'Pesan uji coba',
    ]);

    // Stranger cannot delete
    $forbiddenRes = $this->actingAs($stranger)->deleteJson(route('radar.messages.destroy', $message->id));
    $forbiddenRes->assertStatus(403);
    expect(\App\Models\CommunityMessage::find($message->id))->not->toBeNull();

    // Author can delete without reason
    $successRes = $this->actingAs($author)->deleteJson(route('radar.messages.destroy', $message->id));
    $successRes->assertOk();
    $successRes->assertJsonPath('success', true);
    expect(\App\Models\CommunityMessage::find($message->id))->toBeNull();
    \Illuminate\Support\Facades\Event::assertDispatched(\App\Events\CommunityMessageDeleted::class);

    // Create another message to test admin delete
    $message2 = \App\Models\CommunityMessage::create([
        'community_room_id' => $room->id,
        'user_id' => $author->id,
        'body' => 'Kata kata kasar tidak pantas yang harus dihapus',
    ]);

    // Admin without reason fails validation
    $adminNoReasonRes = $this->actingAs($admin)->deleteJson(route('radar.messages.destroy', $message2->id));
    $adminNoReasonRes->assertStatus(422);

    // Admin with reason succeeds and creates Moderation Notice
    $adminSuccessRes = $this->actingAs($admin)->deleteJson(route('radar.messages.destroy', $message2->id), [
        'reason' => 'Penggunaan kata-kata kasar yang melanggar etika percakapan komunitas.',
    ]);
    $adminSuccessRes->assertOk();
    expect(\App\Models\CommunityMessage::find($message2->id))->toBeNull();

    $notice = \App\Models\CommunityModerationNotice::where('user_id', $author->id)
        ->where('type', 'message_deleted')
        ->first();
    expect($notice)->not->toBeNull()
        ->and($notice->reason)->toBe('Penggunaan kata-kata kasar yang melanggar etika percakapan komunitas.')
        ->and($notice->admin_id)->toBe($admin->id);
    \Illuminate\Support\Facades\Event::assertDispatched(\App\Events\CommunityModerationNoticeCreated::class);
});

test('user can mark moderation notice as read and delete it', function () {
    $user = User::factory()->create();
    $admin = User::factory()->create(['is_admin' => true]);

    $notice = \App\Models\CommunityModerationNotice::create([
        'user_id' => $user->id,
        'admin_id' => $admin->id,
        'type' => 'message_deleted',
        'target_title' => 'Kata kasar',
        'room_title' => 'Ruang Diskusi',
        'reason' => 'Melanggar etika.',
    ]);

    expect($notice->read_at)->toBeNull();

    // Mark single notice as read
    $readRes = $this->actingAs($user)->patchJson(route('radar.notices.read', $notice->id));
    $readRes->assertOk();
    expect($notice->fresh()->read_at)->not->toBeNull();

    // Mark all as read
    $notice2 = \App\Models\CommunityModerationNotice::create([
        'user_id' => $user->id,
        'admin_id' => $admin->id,
        'type' => 'room_deleted',
        'target_title' => 'Ruang Diskusi Bermasalah',
        'room_title' => 'Ruang Diskusi Bermasalah',
        'reason' => 'Spam berulang.',
    ]);
    $allReadRes = $this->actingAs($user)->postJson(route('radar.notices.read-all'));
    $allReadRes->assertOk();
    expect($notice2->fresh()->read_at)->not->toBeNull();

    // Delete notice
    $deleteRes = $this->actingAs($user)->deleteJson(route('radar.notices.destroy', $notice->id));
    $deleteRes->assertOk();
    expect(\App\Models\CommunityModerationNotice::find($notice->id))->toBeNull();
});


