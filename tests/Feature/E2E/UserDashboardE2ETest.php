<?php

use App\Models\Scan;
use App\Models\SimulationAttempt;
use App\Models\SimulationScenario;
use App\Models\User;
use Database\Seeders\SimulationScenarioSeeder;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    $this->seed(SimulationScenarioSeeder::class);
});

/*
|--------------------------------------------------------------------------
| Tier 1: Contract, Schema, Validation & Endpoint Baselines
|--------------------------------------------------------------------------
*/

test('tier 1: unauthenticated guest accessing dashboard is redirected to login', function () {
    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->get('/dashboard');

    $response->assertRedirect($loginUrl);
});

test('tier 1: authenticated user can access dashboard and receives inertia dashboard view', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('guardianStatus')
        ->has('recentScans')
        ->has('recentSimulations')
    );
});

test('tier 1: dashboard returns structured guardian status contract schema', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('guardianStatus.rank')
        ->has('guardianStatus.alertness_score')
        ->has('guardianStatus.completed_simulations')
        ->has('guardianStatus.total_simulations')
        ->has('guardianStatus.simulation_completion_rate')
        ->has('guardianStatus.total_scans')
        ->has('guardianStatus.threats_detected')
    );
});

/*
|--------------------------------------------------------------------------
| Tier 2: State Transitions & Persistence
|--------------------------------------------------------------------------
*/

test('tier 2: guardian rank transitions correctly based on simulation completions and scores', function () {
    $user = User::factory()->create();
    $scenarios = SimulationScenario::where('is_active', true)->take(4)->get();

    // Baseline: 0 completed simulations -> Pemula Digital
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertInertia(fn ($page) => $page
        ->where('guardianStatus.rank', 'Pemula Digital')
        ->where('guardianStatus.completed_simulations', 0)
        ->where('guardianStatus.alertness_score', 0)
    );

    // Complete 1 scenario -> Kadet Pengawas
    SimulationAttempt::create([
        'user_id' => $user->id,
        'simulation_scenario_id' => $scenarios[0]->id,
        'selected_option' => 'B',
        'is_safe' => true,
        'score' => 80,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertInertia(fn ($page) => $page
        ->where('guardianStatus.rank', 'Kadet Pengawas')
        ->where('guardianStatus.completed_simulations', 1)
        ->where('guardianStatus.alertness_score', 80)
    );

    // Complete 2 scenarios with avg score >= 70 -> Guardian Waspada
    SimulationAttempt::create([
        'user_id' => $user->id,
        'simulation_scenario_id' => $scenarios[1]->id,
        'selected_option' => 'B',
        'is_safe' => true,
        'score' => 70,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertInertia(fn ($page) => $page
        ->where('guardianStatus.rank', 'Guardian Waspada')
        ->where('guardianStatus.completed_simulations', 2)
        ->where('guardianStatus.alertness_score', 75)
    );

    // Complete 4 scenarios with avg score >= 85 -> Master Guardian
    SimulationAttempt::create([
        'user_id' => $user->id,
        'simulation_scenario_id' => $scenarios[2]->id,
        'selected_option' => 'A',
        'is_safe' => true,
        'score' => 95,
    ]);
    SimulationAttempt::create([
        'user_id' => $user->id,
        'simulation_scenario_id' => $scenarios[3]->id,
        'selected_option' => 'B',
        'is_safe' => true,
        'score' => 100,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertInertia(fn ($page) => $page
        ->where('guardianStatus.rank', 'Master Guardian')
        ->where('guardianStatus.completed_simulations', 4)
        ->where('guardianStatus.alertness_score', 86)
    );
});

test('tier 2: dashboard displays accurate scan counts and threat metrics for authenticated user', function () {
    $user = User::factory()->create();

    // Create 3 scans for the user: 2 HIGH risk threats, 1 LOW risk safe
    Scan::factory()->create([
        'user_id' => $user->id,
        'scan_type' => 'text',
        'risk_level' => 'HIGH',
        'score' => 95,
    ]);
    Scan::factory()->create([
        'user_id' => $user->id,
        'scan_type' => 'url',
        'risk_level' => 'HIGH',
        'score' => 90,
    ]);
    Scan::factory()->safe()->create([
        'user_id' => $user->id,
        'scan_type' => 'text',
        'risk_level' => 'LOW',
        'score' => 10,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertInertia(fn ($page) => $page
        ->where('guardianStatus.total_scans', 3)
        ->where('guardianStatus.threats_detected', 2)
        ->has('recentScans', 3)
    );
});

test('tier 2: authenticated user can delete their own scan record', function () {
    $user = User::factory()->create();
    $scan = Scan::factory()->create(['user_id' => $user->id]);

    $this->assertDatabaseHas('scans', ['id' => $scan->id]);

    $destroyUrl = Route::has('scans.destroy') ? route('scans.destroy', $scan->id) : "/scans/{$scan->id}";

    $response = $this->actingAs($user)->delete($destroyUrl);

    $response->assertRedirect();
    $this->assertDatabaseMissing('scans', ['id' => $scan->id]);
});

/*
|--------------------------------------------------------------------------
| Tier 3: Adversarial, Boundaries & IDOR Defense
|--------------------------------------------------------------------------
*/

test('tier 3: user cannot delete another users scan record preventing idor attacks', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();

    $victimScan = Scan::factory()->create(['user_id' => $owner->id]);

    $destroyUrl = Route::has('scans.destroy') ? route('scans.destroy', $victimScan->id) : "/scans/{$victimScan->id}";

    $response = $this->actingAs($attacker)->delete($destroyUrl);

    // Must be rejected with 403 Forbidden or 404 Not Found (via firstOrFail scoped to user)
    expect(in_array($response->status(), [403, 404]))->toBeTrue();

    // Verify record remains intact in database
    $this->assertDatabaseHas('scans', [
        'id' => $victimScan->id,
        'user_id' => $owner->id,
    ]);
});

test('tier 3: attempting to delete non-existent scan returns 404', function () {
    $user = User::factory()->create();

    $destroyUrl = Route::has('scans.destroy') ? route('scans.destroy', 999999) : '/scans/999999';

    $response = $this->actingAs($user)->delete($destroyUrl);

    $response->assertNotFound();
});

test('tier 3: dashboard scans history strictly isolates scans belonging to other users', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Scan::factory()->create([
        'user_id' => $userA->id,
        'content' => 'Pesan rahasia User A',
    ]);
    Scan::factory()->create([
        'user_id' => $userB->id,
        'content' => 'Pesan rahasia User B',
    ]);

    $responseA = $this->actingAs($userA)->get('/dashboard');
    $responseA->assertInertia(fn ($page) => $page
        ->has('recentScans', 1)
        ->where('recentScans.0.content', 'Pesan rahasia User A')
    );

    $responseB = $this->actingAs($userB)->get('/dashboard');
    $responseB->assertInertia(fn ($page) => $page
        ->has('recentScans', 1)
        ->where('recentScans.0.content', 'Pesan rahasia User B')
    );
});

/*
|--------------------------------------------------------------------------
| Tier 4: Integrated End-to-End User Journey
|--------------------------------------------------------------------------
*/

test('tier 4: complete guardian dashboard lifecycle from novice to master with active scan management', function () {
    $user = User::factory()->create(['name' => 'Guardian Tester']);
    $scenarios = SimulationScenario::where('is_active', true)->get();

    // 1. Initial State: Pemula Digital, 0 scans, 0 completed simulations
    $step1 = $this->actingAs($user)->get('/dashboard');
    $step1->assertOk();
    $step1->assertInertia(fn ($page) => $page
        ->where('guardianStatus.rank', 'Pemula Digital')
        ->where('guardianStatus.total_scans', 0)
        ->has('recentScans', 0)
    );

    // 2. User completes simulations successfully
    foreach ($scenarios as $scenario) {
        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenario->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 90,
        ]);
    }

    // 3. User performs scans (persisted)
    $scan1 = Scan::factory()->create([
        'user_id' => $user->id,
        'scan_type' => 'text',
        'content' => 'Hadiah undian 100jt',
        'risk_level' => 'HIGH',
    ]);
    $scan2 = Scan::factory()->safe()->create([
        'user_id' => $user->id,
        'scan_type' => 'url',
        'content' => 'https://bca.co.id',
    ]);

    // 4. User views dashboard: Rank is Master Guardian, scans count is 2
    $step4 = $this->actingAs($user)->get('/dashboard');
    $step4->assertInertia(fn ($page) => $page
        ->where('guardianStatus.rank', 'Master Guardian')
        ->where('guardianStatus.total_scans', 2)
        ->has('recentScans', 2)
    );

    // 5. User cleans up history: deletes scan1
    $destroyUrl = Route::has('scans.destroy') ? route('scans.destroy', $scan1->id) : "/scans/{$scan1->id}";
    $this->actingAs($user)->delete($destroyUrl);

    // 6. User verifies remaining scan list on dashboard
    $step6 = $this->actingAs($user)->get('/dashboard');
    $step6->assertInertia(fn ($page) => $page
        ->where('guardianStatus.total_scans', 1)
        ->has('recentScans', 1)
        ->where('recentScans.0.id', $scan2->id)
    );
});
