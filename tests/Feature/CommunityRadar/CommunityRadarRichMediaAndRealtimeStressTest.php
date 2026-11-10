<?php

use App\Events\CommunityAlertUpvoted;
use App\Events\CommunityMessageReacted;
use App\Events\CommunityMessageSent;
use App\Events\CommunityRoomCreated;
use App\Models\CommunityMessage;
use App\Models\CommunityMessageReaction;
use App\Models\CommunityRoom;
use App\Models\ScamPatternContribution;
use App\Models\User;
use Database\Seeders\CommunityRadarSeeder;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(CommunityRadarSeeder::class);
});

/*
|--------------------------------------------------------------------------
| Section 1: Rich Media, Markdown, and Image Upload Stress Tests
|--------------------------------------------------------------------------
*/

test('authenticated user can send combined rich markdown and image message', function () {
    Event::fake([CommunityMessageSent::class]);
    Storage::fake('public');

    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $markdownText = "### Laporan Ancaman\n\n- File APK: `surat_tilang.apk`\n- Rekening Penipu: **BCA 1234567890**\n> Hati-hati jangan diunduh!";
    $webpImage = UploadedFile::fake()->image('bukti_tilang.webp', 800, 600);

    $response = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        [
            'body' => $markdownText,
            'image' => $webpImage,
        ],
        ['Accept' => 'application/json']
    );

    $response->assertStatus(201);
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('message.body', $markdownText);

    $imageUrl = $response->json('message.image_url');
    expect($imageUrl)->not->toBeNull();
    expect($imageUrl)->toContain('community-messages/');

    // Verify storage file exists on public disk
    $savedMessage = CommunityMessage::latest('id')->first();
    expect($savedMessage)->not->toBeNull();
    expect($savedMessage->image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($savedMessage->image_path);

    Event::assertDispatched(CommunityMessageSent::class, function (CommunityMessageSent $event) use ($room, $markdownText) {
        return $event->roomId === $room->id
            && $event->messagePayload['body'] === $markdownText
            && ! empty($event->messagePayload['image_url']);
    });
});

test('whitespace-only message body without image is rejected with 422', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $response = $this->actingAs($user)->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => "   \n\t   \n  ",
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['body']);
});

test('message exceeding maximum 5000 characters is rejected with 422', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    // 5001 characters should fail
    $oversizedBody = str_repeat('A', 5001);

    $response = $this->actingAs($user)->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => $oversizedBody,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['body']);

    // Exactly 5000 characters should succeed
    $validLongBody = str_repeat('B', 5000);
    $validResponse = $this->actingAs($user)->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => $validLongBody,
    ]);

    $validResponse->assertStatus(201);
});

test('non-image file uploaded as message attachment is rejected with 422', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $fakePdf = UploadedFile::fake()->create('dokumen_penipuan.pdf', 500, 'application/pdf');

    $response = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        ['image' => $fakePdf],
        ['Accept' => 'application/json']
    );

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
});

test('image exactly at 5120KB passes while 5121KB fails with 422', function () {
    Storage::fake('public');
    Event::fake([CommunityMessageSent::class]);
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    // 5121 KB (exceeding 5MB by 1 KB)
    $overImage = UploadedFile::fake()->create('terlalu_besar.png', 5121, 'image/png');
    $overResponse = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        ['image' => $overImage],
        ['Accept' => 'application/json']
    );
    $overResponse->assertStatus(422);
    $overResponse->assertJsonValidationErrors(['image']);

    // Exactly 5120 KB (exactly 5MB boundary)
    $exactImage = UploadedFile::fake()->create('tepat_5mb.png', 5120, 'image/png');
    $exactResponse = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        ['image' => $exactImage],
        ['Accept' => 'application/json']
    );
    $exactResponse->assertStatus(201);
});

/*
|--------------------------------------------------------------------------
| Section 2: Reaction Addition, Toggling, and Unicode Stress Tests
|--------------------------------------------------------------------------
*/

test('multiple users can add and toggle reactions with accurate count and user_ids', function () {
    Event::fake([CommunityMessageReacted::class]);

    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $user3 = User::factory()->create();

    $message = CommunityMessage::firstOrFail();
    $emoji = '🔥';

    // User 1 adds reaction
    $res1 = $this->actingAs($user1)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => $emoji,
    ]);
    $res1->assertOk();
    $res1->assertJsonPath('action', 'added');
    $reactions = $res1->json('reactions');
    $group = collect($reactions)->firstWhere('emoji', $emoji);
    expect($group['count'])->toBe(1);
    expect($group['user_ids'])->toContain($user1->id);

    // User 2 adds the same reaction
    $res2 = $this->actingAs($user2)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => $emoji,
    ]);
    $res2->assertOk();
    $res2->assertJsonPath('action', 'added');
    $reactions2 = $res2->json('reactions');
    $group2 = collect($reactions2)->firstWhere('emoji', $emoji);
    expect($group2['count'])->toBe(2);
    expect($group2['user_ids'])->toContain($user1->id, $user2->id);

    // User 1 toggles off the reaction
    $res3 = $this->actingAs($user1)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => $emoji,
    ]);
    $res3->assertOk();
    $res3->assertJsonPath('action', 'removed');
    $reactions3 = $res3->json('reactions');
    $group3 = collect($reactions3)->firstWhere('emoji', $emoji);
    expect($group3['count'])->toBe(1);
    expect($group3['user_ids'])->not->toContain($user1->id);
    expect($group3['user_ids'])->toContain($user2->id);

    // User 2 toggles off the reaction
    $res4 = $this->actingAs($user2)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => $emoji,
    ]);
    $res4->assertOk();
    $res4->assertJsonPath('action', 'removed');
    $reactions4 = $res4->json('reactions');
    $group4 = collect($reactions4)->firstWhere('emoji', $emoji);
    expect($group4)->toBeNull();
});

test('handles diverse and complex multi-byte Unicode emojis without corruption', function () {
    Event::fake([CommunityMessageReacted::class]);

    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();
    $message = CommunityMessage::create([
        'community_room_id' => $room->id,
        'user_id' => $user->id,
        'body' => 'Test message for diverse unicode reactions',
    ]);

    $complexEmojis = [
        '🇮🇩', // Flag of Indonesia (surrogate pairs)
        '🛡️', // Shield with variation selector
        '👨‍💻', // Technologist with ZWJ
        '🚀', // Rocket
        '❤️', // Red Heart with variation selector
    ];

    foreach ($complexEmojis as $emoji) {
        $res = $this->actingAs($user)->postJson(route('radar.messages.reactions.toggle', $message->id), [
            'emoji' => $emoji,
        ]);
        $res->assertOk();
        $res->assertJsonPath('action', 'added');

        $matched = collect($res->json('reactions'))->firstWhere('emoji', $emoji);
        expect($matched)->not->toBeNull();
        expect($matched['count'])->toBe(1);
    }

    // Verify in database
    foreach ($complexEmojis as $emoji) {
        $exists = CommunityMessageReaction::where('community_message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->exists();
        expect($exists)->toBeTrue();
    }
});

test('blank or oversized reaction emojis are rejected with 422', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();
    $message = CommunityMessage::create([
        'community_room_id' => $room->id,
        'user_id' => $user->id,
        'body' => 'Test message for diverse unicode reactions',
    ]);

    // Blank emoji
    $blankRes = $this->actingAs($user)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => '   ',
    ]);
    $blankRes->assertStatus(422);

    // Oversized string (>32 characters)
    $oversizedEmoji = str_repeat('A', 33);
    $oversizedRes = $this->actingAs($user)->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => $oversizedEmoji,
    ]);
    $oversizedRes->assertStatus(422);
    $oversizedRes->assertJsonValidationErrors(['emoji']);
});

/*
|--------------------------------------------------------------------------
| Section 3: Broadcasting Contracts & Real-time Event Specification Tests
|--------------------------------------------------------------------------
*/

test('CommunityRoomCreated event adheres to ShouldBroadcastNow contract, channels, and payload', function () {
    $roomPayload = [
        'id' => 999,
        'title' => 'Ruang Broadcast Test',
        'category' => 'phishing_banking',
        'description' => 'Test event broadcasting.',
    ];

    $event = new CommunityRoomCreated($roomPayload);

    // Contract: ShouldBroadcastNow
    expect($event)->toBeInstanceOf(ShouldBroadcastNow::class);

    // Channel: community.radar
    $channels = $event->broadcastOn();
    expect($channels)->toHaveCount(1);
    expect($channels[0]->name)->toBe('community.radar');

    // Broadcast As: room.created
    expect($event->broadcastAs())->toBe('room.created');

    // Broadcast payload
    $payload = $event->broadcastWith();
    expect($payload)->toHaveKey('room');
    expect($payload['room']['id'])->toBe(999);
    expect($payload['room']['title'])->toBe('Ruang Broadcast Test');
});

test('CommunityMessageSent event adheres to ShouldBroadcastNow contract, channels, and payload', function () {
    $roomId = 42;
    $messagePayload = [
        'id' => 101,
        'room_id' => 42,
        'body' => 'Test message payload',
        'image_url' => 'https://example.com/image.png',
        'user' => ['id' => 1, 'name' => 'Guardian', 'is_admin' => false],
        'reactions' => [],
    ];

    $event = new CommunityMessageSent($roomId, $messagePayload);

    // Contract: ShouldBroadcastNow
    expect($event)->toBeInstanceOf(ShouldBroadcastNow::class);

    // Channels: community.radar AND community.room.{roomId}
    $channels = $event->broadcastOn();
    expect($channels)->toHaveCount(2);
    $channelNames = array_map(fn ($c) => $c->name, $channels);
    expect($channelNames)->toContain('community.radar');
    expect($channelNames)->toContain('community.room.42');

    // Broadcast As: message.sent
    expect($event->broadcastAs())->toBe('message.sent');

    // Broadcast payload
    $payload = $event->broadcastWith();
    expect($payload['room_id'])->toBe(42);
    expect($payload['message']['id'])->toBe(101);
    expect($payload['message']['body'])->toBe('Test message payload');
});

test('CommunityMessageReacted event adheres to ShouldBroadcastNow contract, channels, and payload', function () {
    $roomId = 42;
    $messageId = 101;
    $reactionsPayload = [
        ['emoji' => '🔥', 'count' => 3, 'user_ids' => [1, 2, 3]],
    ];

    $event = new CommunityMessageReacted($roomId, $messageId, $reactionsPayload);

    // Contract: ShouldBroadcastNow
    expect($event)->toBeInstanceOf(ShouldBroadcastNow::class);

    // Channels: community.radar AND community.room.{roomId}
    $channels = $event->broadcastOn();
    expect($channels)->toHaveCount(2);
    $channelNames = array_map(fn ($c) => $c->name, $channels);
    expect($channelNames)->toContain('community.radar');
    expect($channelNames)->toContain('community.room.42');

    // Broadcast As: message.reacted
    expect($event->broadcastAs())->toBe('message.reacted');

    // Broadcast payload
    $payload = $event->broadcastWith();
    expect($payload['room_id'])->toBe(42);
    expect($payload['message_id'])->toBe(101);
    expect($payload['reactions'])->toBe($reactionsPayload);
});

test('CommunityAlertUpvoted event adheres to ShouldBroadcastNow contract, channels, and payload', function () {
    Event::fake([CommunityAlertUpvoted::class]);

    $alert = ScamPatternContribution::first();
    $currentUpvotes = $alert->upvotes_count;

    $response = $this->postJson(route('radar.upvote', $alert->id));
    $response->assertOk();

    Event::assertDispatched(CommunityAlertUpvoted::class, function (CommunityAlertUpvoted $event) use ($alert, $currentUpvotes) {
        // Contract
        expect($event)->toBeInstanceOf(ShouldBroadcastNow::class);

        // Channel: community.radar
        $channels = $event->broadcastOn();
        expect($channels)->toHaveCount(1);
        expect($channels[0]->name)->toBe('community.radar');

        // Broadcast As: alert.upvoted
        expect($event->broadcastAs())->toBe('alert.upvoted');

        // Payload
        $payload = $event->broadcastWith();
        expect($payload['alert_id'])->toBe($alert->id);
        expect($payload['upvotes_count'])->toBe($currentUpvotes + 1);

        return $event->alertId === $alert->id && $event->upvotesCount === $currentUpvotes + 1;
    });
});

test('unsupported image formats like GIF and SVG are rejected with 422', function () {
    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $fakeGif = UploadedFile::fake()->create('animasi.gif', 200, 'image/gif');
    $resGif = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        ['image' => $fakeGif],
        ['Accept' => 'application/json']
    );
    $resGif->assertStatus(422);
    $resGif->assertJsonValidationErrors(['image']);

    $fakeSvg = UploadedFile::fake()->create('vektor.svg', 50, 'image/svg+xml');
    $resSvg = $this->actingAs($user)->post(
        route('radar.rooms.messages.store', $room->id),
        ['image' => $fakeSvg],
        ['Accept' => 'application/json']
    );
    $resSvg->assertStatus(422);
    $resSvg->assertJsonValidationErrors(['image']);
});

test('multiple distinct emojis by multiple users are grouped and updated accurately', function () {
    Event::fake([CommunityMessageReacted::class]);

    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $room = CommunityRoom::firstOrFail();
    $message = CommunityMessage::create([
        'community_room_id' => $room->id,
        'user_id' => $userA->id,
        'body' => 'Multiple distinct reactions test message',
    ]);

    // User A reacts with 👍
    $this->actingAs($userA)->postJson(route('radar.messages.reactions.toggle', $message->id), ['emoji' => '👍'])->assertOk();

    // User B reacts with ❤️
    $this->actingAs($userB)->postJson(route('radar.messages.reactions.toggle', $message->id), ['emoji' => '❤️'])->assertOk();

    // User A also reacts with ❤️
    $res = $this->actingAs($userA)->postJson(route('radar.messages.reactions.toggle', $message->id), ['emoji' => '❤️']);
    $res->assertOk();

    $reactions = collect($res->json('reactions'));
    $thumbsGroup = $reactions->firstWhere('emoji', '👍');
    $heartGroup = $reactions->firstWhere('emoji', '❤️');

    expect($thumbsGroup['count'])->toBe(1);
    expect($thumbsGroup['user_ids'])->toEqual([$userA->id]);

    expect($heartGroup['count'])->toBe(2);
    expect($heartGroup['user_ids'])->toContain($userA->id, $userB->id);
});

test('reacting to a non-existent message returns 404', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('radar.messages.reactions.toggle', 999999), [
        'emoji' => '👍',
    ]);

    $response->assertNotFound();
});

test('text-only message broadcast payload contains null image_url', function () {
    Event::fake([CommunityMessageSent::class]);

    $user = User::factory()->create();
    $room = CommunityRoom::firstOrFail();

    $response = $this->actingAs($user)->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => 'Hanya teks tanpa lampiran gambar sama sekali.',
    ]);

    $response->assertStatus(201);

    Event::assertDispatched(CommunityMessageSent::class, function (CommunityMessageSent $event) {
        expect($event->messagePayload['image_url'])->toBeNull();
        expect($event->messagePayload['body'])->toBe('Hanya teks tanpa lampiran gambar sama sekali.');

        return true;
    });
});
