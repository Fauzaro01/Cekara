<?php

use App\Models\SimulationAttempt;
use App\Models\SimulationScenario;
use App\Models\User;
use Database\Seeders\SimulationScenarioSeeder;

beforeEach(function () {
    $this->seed(SimulationScenarioSeeder::class);
});

test('guest can view simulations index page', function () {
    $response = $this->get(route('simulations.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('simulations/index')
        ->has('scenarios')
        ->has('userStats')
    );
});

test('authenticated user sees their guardian stats on simulations index', function () {
    $user = User::factory()->create();
    $scenario = SimulationScenario::first();

    SimulationAttempt::create([
        'user_id' => $user->id,
        'simulation_scenario_id' => $scenario->id,
        'selected_option' => 'B',
        'is_safe' => true,
        'score' => 100,
        'feedback_notes' => 'Tanda bahaya jelas file APK.',
    ]);

    $response = $this->actingAs($user)->get(route('simulations.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('simulations/index')
        ->where('userStats.completed_count', 1)
        ->where('userStats.average_score', 100)
    );
});

test('guest is redirected to login when accessing simulation scenario', function () {
    $scenario = SimulationScenario::first();

    $response = $this->get(route('simulations.show', $scenario->slug));

    $response->assertRedirect(route('login'));
});

test('authenticated user can view a specific simulation scenario', function () {
    $user = User::factory()->create();
    $scenario = SimulationScenario::first();

    $response = $this->actingAs($user)->get(route('simulations.show', $scenario->slug));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('simulations/show')
        ->where('scenario.slug', $scenario->slug)
        ->has('scenario.chat_messages')
        ->has('scenario.options')
        ->has('scenario.psychological_tricks')
    );
});

test('submitting a safe decision evaluates correctly and saves attempt', function () {
    $user = User::factory()->create();
    $scenario = SimulationScenario::where('slug', 'surat-undangan-pernikahan-digital-apk')->first();

    $response = $this->actingAs($user)->postJson(route('simulations.submit', $scenario->slug), [
        'selected_option' => 'B',
        'feedback_notes' => 'Nomor asing mengirim file APK mencurigakan.',
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'evaluation' => [
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 100,
        ],
    ]);

    $this->assertDatabaseHas('simulation_attempts', [
        'user_id' => $user->id,
        'simulation_scenario_id' => $scenario->id,
        'selected_option' => 'B',
        'is_safe' => true,
        'score' => 100,
    ]);
});

test('submitting a dangerous decision gives low score and warning explanation', function () {
    $user = User::factory()->create();
    $scenario = SimulationScenario::where('slug', 'surat-undangan-pernikahan-digital-apk')->first();

    $response = $this->actingAs($user)->postJson(route('simulations.submit', $scenario->slug), [
        'selected_option' => 'A',
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'evaluation' => [
            'selected_option' => 'A',
            'is_safe' => false,
            'score' => 0,
        ],
    ]);
});

test('submitting non-existent option returns validation error 422', function () {
    $user = User::factory()->create();
    $scenario = SimulationScenario::first();

    $response = $this->actingAs($user)->postJson(route('simulations.submit', $scenario->slug), [
        'selected_option' => 'Z',
    ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
    ]);
});

test('user can contribute a new scam pattern for dataset enrichment', function () {
    $response = $this->postJson(route('simulations.contribute'), [
        'title' => 'Modus Surat Tilang Elektronik APK via SMS',
        'category' => 'apk_malware',
        'platform' => 'SMS',
        'description' => 'SMS menyatakan STNK diblokir karena tilang ETLE dan menyuruh mengunduh berkas Surat_Tilang.apk.',
        'evidence_text' => 'Pemberitahuan ETLE: Silakan unduh Surat_Tilang_Online.apk untuk konfirmasi.',
    ]);

    $response->assertStatus(201);
    $response->assertJson([
        'success' => true,
    ]);

    $this->assertDatabaseHas('scam_pattern_contributions', [
        'title' => 'Modus Surat Tilang Elektronik APK via SMS',
        'platform' => 'SMS',
        'is_verified' => false,
    ]);
});

test('contributing scam pattern validates required fields', function () {
    $response = $this->postJson(route('simulations.contribute'), [
        'title' => '',
        'category' => '',
        'platform' => '',
        'description' => 'pendek',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['title', 'category', 'platform', 'description']);
});

test('logging in with redirect parameter redirects directly to simulation scenario', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);
    $scenario = SimulationScenario::first();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password123',
        'redirect' => "/simulasi/{$scenario->slug}",
    ]);

    $response->assertRedirect("/simulasi/{$scenario->slug}");
    $this->assertAuthenticatedAs($user);
});
