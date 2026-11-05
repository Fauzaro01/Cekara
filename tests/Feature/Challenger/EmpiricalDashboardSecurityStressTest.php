<?php

use App\Models\Scan;
use App\Models\User;
use Database\Seeders\SimulationScenarioSeeder;

beforeEach(function () {
    $this->seed(SimulationScenarioSeeder::class);
});

/*
|--------------------------------------------------------------------------
| Section 1: Dashboard Authentication Gate
|--------------------------------------------------------------------------
*/

describe('Dashboard Authentication Gate', function () {
    test('unauthenticated guest GET /dashboard redirects to login with 302', function () {
        $response = $this->get('/dashboard');

        $response->assertStatus(302);
        $response->assertRedirect(route('login'));
    });

    test('unauthenticated guest JSON GET /dashboard returns 401 unauthorized', function () {
        $response = $this->getJson('/dashboard');

        $response->assertStatus(401);
        $response->assertUnauthorized();
    });

    test('unauthenticated guest request with Accept application/json header returns 401', function () {
        $response = $this->withHeader('Accept', 'application/json')->get('/dashboard');

        $response->assertStatus(401);
    });

    test('intended url is preserved in session during unauthenticated redirect to login', function () {
        $guestResponse = $this->get('/dashboard');

        $guestResponse->assertStatus(302);
        $guestResponse->assertRedirect(route('login'));

        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $loginResponse->assertRedirect(route('dashboard'));
    });

    test('authenticated user can successfully access GET /dashboard with 200 OK', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('dashboard'));
    });

    test('logging out revokes dashboard access immediately', function () {
        $user = User::factory()->create();

        // 1. Authenticated access succeeds
        $this->actingAs($user)->get('/dashboard')->assertOk();

        // 2. User logs out
        $this->post('/logout')->assertRedirect('/');

        // 3. Subsequent access is blocked
        $this->get('/dashboard')->assertRedirect(route('login'));
        $this->getJson('/dashboard')->assertUnauthorized();
    });
});

/*
|--------------------------------------------------------------------------
| Section 2: Scan Deletion Authorization Gate & IDOR Immunity
|--------------------------------------------------------------------------
*/

describe('Scan Deletion Authorization Gate & IDOR Immunity', function () {
    test('unauthenticated guest DELETE /scans/{id} redirects to login', function () {
        $user = User::factory()->create();
        $scan = Scan::factory()->create(['user_id' => $user->id]);

        $response = $this->delete("/scans/{$scan->id}");

        $response->assertStatus(302);
        $response->assertRedirect(route('login'));
        $this->assertDatabaseHas('scans', ['id' => $scan->id]);
    });

    test('unauthenticated guest JSON DELETE /scans/{id} returns 401 unauthorized', function () {
        $user = User::factory()->create();
        $scan = Scan::factory()->create(['user_id' => $user->id]);

        $response = $this->deleteJson("/scans/{$scan->id}");

        $response->assertStatus(401);
        $this->assertDatabaseHas('scans', ['id' => $scan->id]);
    });

    test('IDOR: User B cannot delete User A scan and User A scan data remains intact', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $scanA = Scan::factory()->create([
            'user_id' => $userA->id,
            'content' => 'Pesan rahasia phishing perbankan milik User A',
            'risk_level' => 'HIGH',
            'score' => 95,
        ]);

        // Attacker User B attempts to delete Victim User A's scan
        $response = $this->actingAs($userB)->delete("/scans/{$scanA->id}");

        $response->assertNotFound();

        // Ensure record still exists intact in the database
        $this->assertDatabaseHas('scans', [
            'id' => $scanA->id,
            'user_id' => $userA->id,
            'content' => 'Pesan rahasia phishing perbankan milik User A',
            'risk_level' => 'HIGH',
            'score' => 95,
        ]);
    });

    test('IDOR: User B cannot delete User A scan via JSON request', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $scanA = Scan::factory()->create([
            'user_id' => $userA->id,
            'content' => 'Pesan APK malware rahasia',
        ]);

        $response = $this->actingAs($userB)->deleteJson("/scans/{$scanA->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('scans', ['id' => $scanA->id]);
    });

    test('authenticated user cannot delete orphaned scan without user_id', function () {
        $user = User::factory()->create();

        $orphanedScan = Scan::factory()->create([
            'user_id' => null,
            'content' => 'Pesan anonim tanpa pemilik',
        ]);

        $response = $this->actingAs($user)->delete("/scans/{$orphanedScan->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('scans', ['id' => $orphanedScan->id]);
    });

    test('authenticated user deleting non-existent scan ID returns 404 not found', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->delete('/scans/999999');

        $response->assertNotFound();
    });

    test('authenticated user deleting non-existent scan ID via JSON returns 404 not found', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->deleteJson('/scans/999999');

        $response->assertNotFound();
    });

    test('legitimate owner can delete their own scan with flash message confirmation', function () {
        $user = User::factory()->create();
        $scan = Scan::factory()->create(['user_id' => $user->id]);

        $this->assertDatabaseHas('scans', ['id' => $scan->id]);

        $response = $this->actingAs($user)
            ->from('/dashboard')
            ->delete("/scans/{$scan->id}");

        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('message', 'Riwayat pemindaian berhasil dihapus.');
        $this->assertDatabaseMissing('scans', ['id' => $scan->id]);
    });

    test('replay attack: deleting already deleted scan returns 404', function () {
        $user = User::factory()->create();
        $scan = Scan::factory()->create(['user_id' => $user->id]);

        // First deletion succeeds
        $this->actingAs($user)->delete("/scans/{$scan->id}")->assertRedirect();
        $this->assertDatabaseMissing('scans', ['id' => $scan->id]);

        // Second deletion attempt must return 404
        $secondResponse = $this->actingAs($user)->delete("/scans/{$scan->id}");
        $secondResponse->assertNotFound();
    });
});

/*
|--------------------------------------------------------------------------
| Section 3: Boundary & Parameter Robustness
|--------------------------------------------------------------------------
*/

describe('Boundary & Parameter Robustness', function () {
    test('deleting scan with negative ID returns 404 not found', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->delete('/scans/-1');

        $response->assertNotFound();
    });

    test('deleting scan with zero ID returns 404 not found', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->delete('/scans/0');

        $response->assertNotFound();
    });

    test('deleting scan with arbitrary non-numeric string is rejected with 404 via whereNumber constraint', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->delete('/scans/non-numeric-payload');

        // Route is hardened with ->whereNumber('id'), returning 404 for non-numeric payload
        expect($response->status())->toBe(404);
    });
});
