<?php

use App\Models\Scan;
use App\Models\SimulationAttempt;
use App\Models\SimulationScenario;
use App\Models\User;
use Database\Seeders\SimulationScenarioSeeder;

beforeEach(function () {
    $this->seed(SimulationScenarioSeeder::class);
});

test('guest visiting dashboard is redirected to login', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can visit dashboard and see guardian status metrics', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('guardianStatus')
        ->where('guardianStatus.rank', 'Pemula Digital')
        ->where('guardianStatus.alertness_score', 0)
        ->where('guardianStatus.completed_simulations', 0)
        ->where('guardianStatus.total_scans', 0)
        ->has('recentScans')
        ->has('recentSimulations')
    );
});

test('authenticated user with simulations sees computed guardian rank and alertness score', function () {
    $user = User::factory()->create();
    $scenarios = SimulationScenario::take(4)->get();

    foreach ($scenarios as $scenario) {
        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenario->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 90,
            'feedback_notes' => 'Keputusan tepat.',
        ]);
    }

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('guardianStatus.rank', 'Master Guardian')
        ->where('guardianStatus.completed_simulations', 4)
        ->where('guardianStatus.alertness_score', 90)
    );
});

test('authenticated user can see recent scans history', function () {
    $user = User::factory()->create();

    $scan = Scan::factory()->create([
        'user_id' => $user->id,
        'scan_type' => 'text',
        'content' => 'Pesan undian berhadiah palsu 50 juta',
        'risk_level' => 'HIGH',
        'score' => 92,
        'summary' => 'Terindikasi penipuan undian.',
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('guardianStatus.total_scans', 1)
        ->where('guardianStatus.threats_detected', 1)
        ->has('recentScans', 1)
        ->where('recentScans.0.id', $scan->id)
        ->where('recentScans.0.content', 'Pesan undian berhadiah palsu 50 juta')
        ->where('recentScans.0.risk_level', 'HIGH')
    );
});

test('authenticated user can delete a scan item', function () {
    $user = User::factory()->create();

    $scan = Scan::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->assertDatabaseHas('scans', [
        'id' => $scan->id,
    ]);

    $response = $this->actingAs($user)->delete(route('scans.destroy', $scan->id));

    $response->assertRedirect();
    $this->assertDatabaseMissing('scans', [
        'id' => $scan->id,
    ]);
});

test('authenticated user cannot delete another users scan', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $scan = Scan::factory()->create([
        'user_id' => $user2->id,
    ]);

    $response = $this->actingAs($user1)->delete(route('scans.destroy', $scan->id));

    $response->assertNotFound();
    $this->assertDatabaseHas('scans', [
        'id' => $scan->id,
    ]);
});

test('administrator visiting dashboard sees admin dashboard component with user api recap and chart', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
    ]);
    $regularUser = User::factory()->create([
        'name' => 'Warga Guardian',
        'email' => 'warga@example.com',
        'is_admin' => false,
    ]);

    Scan::factory()->create([
        'user_id' => $regularUser->id,
        'scan_type' => 'text',
        'risk_level' => 'HIGH',
        'score' => 95,
        'summary' => 'Penipuan hadiah via SMS',
    ]);

    Scan::factory()->create([
        'user_id' => null, // Guest
        'scan_type' => 'url',
        'risk_level' => 'LOW',
        'score' => 10,
        'summary' => 'Tautan situs resmi',
    ]);

    $response = $this->actingAs($admin)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/dashboard')
        ->has('overview')
        ->where('overview.total_api_requests', 2)
        ->where('overview.high_risk_scans', 1)
        ->has('chartData', 14)
        ->has('userApiStats')
        ->has('guestStats')
        ->where('guestStats.total_requests', 1)
        ->has('recentScans', 2)
    );
});

test('admin dashboard handles missing active provider gracefully', function () {
    \App\Models\LlmProvider::query()->update(['is_active' => false]);

    $admin = User::factory()->create([
        'is_admin' => true,
    ]);

    $response = $this->actingAs($admin)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/dashboard')
        ->where('overview.active_provider', null)
    );
});

