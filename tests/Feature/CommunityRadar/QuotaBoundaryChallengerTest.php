<?php

use App\Events\CommunityRoomCreated;
use App\Models\CommunityMessage;
use App\Models\CommunityRoom;
use App\Models\User;
use Database\Seeders\CommunityRadarSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(CommunityRadarSeeder::class);
});

test('multi-user quota isolation: user A reaching limit does not block user B', function () {
    Event::fake([CommunityRoomCreated::class]);

    $userA = User::factory()->create();
    $userB = User::factory()->create();

    // User A creates 3 rooms
    for ($i = 1; $i <= 3; $i++) {
        $resA = $this->actingAs($userA)->postJson(route('radar.rooms.store'), [
            'title' => "Room User A Number {$i}",
            'category' => 'phishing_banking',
            'description' => "Deskripsi detail mengenai investigasi phishing user A bagian {$i}.",
        ]);
        $resA->assertStatus(201);
        $resA->assertJsonPath('daily_room_quota.used', $i);
        $resA->assertJsonPath('daily_room_quota.remaining', 3 - $i);
    }

    // User A 4th attempt fails
    $resA4 = $this->actingAs($userA)->postJson(route('radar.rooms.store'), [
        'title' => 'Room User A Over Quota Attempt',
        'category' => 'phishing_banking',
        'description' => 'Percobaan membuat ruang ke-4 user A harus ditolak.',
    ]);
    $resA4->assertStatus(422);
    $resA4->assertJsonValidationErrors(['quota']);

    // User B should still have full 3-room quota
    $quotaB = $this->actingAs($userB)->getJson(route('radar.sync'))->json('daily_room_quota');
    expect($quotaB['used'])->toBe(0)
        ->and($quotaB['remaining'])->toBe(3);

    for ($i = 1; $i <= 3; $i++) {
        $resB = $this->actingAs($userB)->postJson(route('radar.rooms.store'), [
            'title' => "Room User B Number {$i}",
            'category' => 'apk_malware',
            'description' => "Deskripsi investigasi malware dari user B bagian {$i}.",
        ]);
        $resB->assertStatus(201);
        $resB->assertJsonPath('daily_room_quota.used', $i);
        $resB->assertJsonPath('daily_room_quota.remaining', 3 - $i);
    }

    // User B 4th attempt fails
    $resB4 = $this->actingAs($userB)->postJson(route('radar.rooms.store'), [
        'title' => 'Room User B Over Quota Attempt',
        'category' => 'apk_malware',
        'description' => 'Percobaan membuat ruang ke-4 user B harus ditolak.',
    ]);
    $resB4->assertStatus(422);
    $resB4->assertJsonValidationErrors(['quota']);
});

test('time travel: quota replenishes on the next day', function () {
    Event::fake([CommunityRoomCreated::class]);

    Carbon::setTestNow('2026-11-10 10:00:00');
    $user = User::factory()->create();

    // Day 1: Create 3 rooms
    for ($i = 1; $i <= 3; $i++) {
        $res = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
            'title' => "Day 1 Room #{$i} Title",
            'category' => 'social_engineering',
            'description' => "Deskripsi pengujian ruang hari pertama nomor {$i}.",
        ]);
        $res->assertStatus(201);
    }

    // Day 1 4th attempt rejected
    $resFailDay1 = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => 'Day 1 Room #4 Over Limit',
        'category' => 'social_engineering',
        'description' => 'Percobaan melebihi batas di hari yang sama.',
    ]);
    $resFailDay1->assertStatus(422);

    // Fast-forward to next day
    Carbon::setTestNow('2026-11-11 08:00:00');

    // Quota should now be reset to 0 used, 3 remaining
    $sync = $this->actingAs($user)->getJson(route('radar.sync'))->json('daily_room_quota');
    expect($sync['used'])->toBe(0)
        ->and($sync['remaining'])->toBe(3);

    // Can create 3 more rooms on Day 2
    for ($i = 1; $i <= 3; $i++) {
        $resDay2 = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
            'title' => "Day 2 Room #{$i} Title",
            'category' => 'social_engineering',
            'description' => "Deskripsi pengujian ruang hari kedua nomor {$i}.",
        ]);
        $resDay2->assertStatus(201);
        $resDay2->assertJsonPath('daily_room_quota.used', $i);
        $resDay2->assertJsonPath('daily_room_quota.remaining', 3 - $i);
    }

    // Total rooms created across 2 days is 6
    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(6);

    // Day 2 4th attempt rejected
    $resFailDay2 = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => 'Day 2 Room #4 Over Limit',
        'category' => 'social_engineering',
        'description' => 'Percobaan melebihi batas di hari kedua.',
    ]);
    $resFailDay2->assertStatus(422);

    Carbon::setTestNow();
});

test('rooms created across multiple prior days do not affect today quota', function () {
    Event::fake([CommunityRoomCreated::class]);

    $user = User::factory()->create();

    // Create historical rooms on Day -7, Day -3, and Day -1
    $offsets = [7, 3, 1];
    foreach ($offsets as $daysAgo) {
        for ($k = 1; $k <= 3; $k++) {
            $pastRoom = CommunityRoom::create([
                'user_id' => $user->id,
                'title' => "Past Room {$daysAgo}d ago #{$k}",
                'slug' => "past-room-{$daysAgo}d-{$k}-".Str::lower(Str::random(6)),
                'category' => 'phishing_banking',
                'description' => "Deskripsi riwayat hari lalu {$daysAgo} bagian {$k}.",
                'is_pinned' => false,
            ]);
            CommunityRoom::where('id', $pastRoom->id)->update([
                'created_at' => now()->subDays($daysAgo),
            ]);
        }
    }

    // User has 9 historical rooms in total
    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(9);

    // Today's quota check must show 0 used and 3 remaining
    $sync = $this->actingAs($user)->getJson(route('radar.sync'))->json('daily_room_quota');
    expect($sync['used'])->toBe(0)
        ->and($sync['remaining'])->toBe(3);

    // User can successfully create 3 rooms today
    for ($i = 1; $i <= 3; $i++) {
        $res = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
            'title' => "Today New Room #{$i} With 9 Historical",
            'category' => 'apk_malware',
            'description' => "Deskripsi pembuatan ruang hari ini dengan riwayat lama {$i}.",
        ]);
        $res->assertStatus(201);
        $res->assertJsonPath('daily_room_quota.used', $i);
        $res->assertJsonPath('daily_room_quota.remaining', 3 - $i);
    }

    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(12);

    // 4th room today fails
    $res4th = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => '4th Room Attempt Today',
        'category' => 'apk_malware',
        'description' => 'Percobaan membuat ruang ke-4 hari ini harus gagal.',
    ]);
    $res4th->assertStatus(422);
    $res4th->assertJsonValidationErrors(['quota']);
});

test('validation failure does not consume daily room quota', function () {
    $user = User::factory()->create();

    // 1st attempt: validation failure (title too short)
    $badRes1 = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => 'Abc', // 3 chars < 5
        'category' => 'phishing_banking',
        'description' => 'Deskripsi valid dengan panjang lebih dari 10 karakter.',
    ]);
    $badRes1->assertStatus(422);
    $badRes1->assertJsonValidationErrors(['title']);

    // 2nd attempt: validation failure (description too short)
    $badRes2 = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => 'Judul Valid 5 Karakter',
        'category' => 'phishing_banking',
        'description' => 'Pendek', // 6 chars < 10
    ]);
    $badRes2->assertStatus(422);
    $badRes2->assertJsonValidationErrors(['description']);

    // Verify quota is still completely unspent (0 used, 3 remaining)
    $sync = $this->actingAs($user)->getJson(route('radar.sync'))->json('daily_room_quota');
    expect($sync['used'])->toBe(0)
        ->and($sync['remaining'])->toBe(3);

    // User can still make all 3 rooms successfully
    for ($i = 1; $i <= 3; $i++) {
        $okRes = $this->actingAs($user)->postJson(route('radar.rooms.store'), [
            'title' => "Valid Room Title {$i}",
            'category' => 'social_engineering',
            'description' => "Deskripsi yang sepenuhnya valid dan mencukupi syarat {$i}.",
        ]);
        $okRes->assertStatus(201);
    }

    expect(CommunityRoom::where('user_id', $user->id)->count())->toBe(3);
});

test('exact character length boundaries for room creation', function () {
    $user = User::factory()->create();

    // Title: min 5
    // 4 chars -> 422
    $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => str_repeat('a', 4),
        'category' => 'apk_malware',
        'description' => 'Deskripsi valid dengan panjang cukup.',
    ])->assertStatus(422)->assertJsonValidationErrors(['title']);

    // Description: min 10
    // 9 chars -> 422
    $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => str_repeat('a', 5),
        'category' => 'apk_malware',
        'description' => str_repeat('b', 9),
    ])->assertStatus(422)->assertJsonValidationErrors(['description']);

    // Title: max 160
    // 161 chars -> 422
    $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => str_repeat('a', 161),
        'category' => 'apk_malware',
        'description' => 'Deskripsi valid dengan panjang cukup.',
    ])->assertStatus(422)->assertJsonValidationErrors(['title']);

    // Description: max 2000
    // 2001 chars -> 422
    $this->actingAs($user)->postJson(route('radar.rooms.store'), [
        'title' => str_repeat('a', 10),
        'category' => 'apk_malware',
        'description' => str_repeat('b', 2001),
    ])->assertStatus(422)->assertJsonValidationErrors(['description']);
});

test('guest boundary tests: JSON returns 401, non-JSON redirects to login', function () {
    $room = CommunityRoom::firstOrFail();
    $message = CommunityMessage::firstOrFail();

    // 1. Room creation
    // JSON -> 401
    $this->postJson(route('radar.rooms.store'), [
        'title' => 'Guest Room JSON',
        'category' => 'apk_malware',
        'description' => 'Percobaan membuat ruang oleh guest via JSON.',
    ])->assertUnauthorized();

    // Non-JSON -> 302 redirect to login
    $this->post(route('radar.rooms.store'), [
        'title' => 'Guest Room Form',
        'category' => 'apk_malware',
        'description' => 'Percobaan membuat ruang oleh guest via Form.',
    ])->assertRedirect(route('login'));

    // 2. Message posting
    // JSON -> 401
    $this->postJson(route('radar.rooms.messages.store', $room->id), [
        'body' => 'Pesan guest via JSON.',
    ])->assertUnauthorized();

    // Non-JSON -> 302 redirect to login
    $this->post(route('radar.rooms.messages.store', $room->id), [
        'body' => 'Pesan guest via Form.',
    ])->assertRedirect(route('login'));

    // 3. Message reaction
    // JSON -> 401
    $this->postJson(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => '👍',
    ])->assertUnauthorized();

    // Non-JSON -> 302 redirect to login
    $this->post(route('radar.messages.reactions.toggle', $message->id), [
        'emoji' => '👍',
    ])->assertRedirect(route('login'));
});

test('authenticated user cannot spoof user_id to bypass quota or attribute to others', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    // User A passes user_id of User B
    $res = $this->actingAs($userA)->postJson(route('radar.rooms.store'), [
        'user_id' => $userB->id,
        'title' => 'Attempt to spoof owner to user B',
        'category' => 'phishing_banking',
        'description' => 'Percobaan memasukkan user_id milik pengguna lain.',
    ]);

    $res->assertStatus(201);
    $createdRoom = CommunityRoom::where('title', 'Attempt to spoof owner to user B')->first();
    expect($createdRoom)->not->toBeNull()
        ->and($createdRoom->user_id)->toBe($userA->id)
        ->and($createdRoom->user_id)->not->toBe($userB->id);

    // Quota consumed for User A, not User B
    expect(CommunityRoom::where('user_id', $userA->id)->count())->toBe(1)
        ->and(CommunityRoom::where('user_id', $userB->id)->count())->toBe(0);
});

test('unauthenticated guest receives quota representation of 0 used and 3 remaining', function () {
    $response = $this->getJson(route('radar.sync'));
    $response->assertOk();
    $response->assertJsonPath('daily_room_quota.used', 0);
    $response->assertJsonPath('daily_room_quota.max', 3);
    $response->assertJsonPath('daily_room_quota.remaining', 3);
});
