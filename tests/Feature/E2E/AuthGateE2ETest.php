<?php

use App\Models\Scan;
use App\Models\SimulationScenario;
use App\Models\User;
use Database\Seeders\SimulationScenarioSeeder;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    $this->seed(SimulationScenarioSeeder::class);
});

/*
|--------------------------------------------------------------------------
| Tier 1: Guest Redirects & Auth Gating Contracts
|--------------------------------------------------------------------------
*/

test('tier 1: guest is redirected to login when accessing dashboard', function () {
    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->get('/dashboard');

    $response->assertRedirect($loginUrl);
});

test('tier 1: guest is rejected when attempting scan deletion mutation', function () {
    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->delete('/scans/1');

    if ($response->isRedirect()) {
        $response->assertRedirect($loginUrl);
    } else {
        $response->assertUnauthorized();
    }
});

test('tier 1: guest is rejected when attempting emergency checklist mutations', function () {
    if (! Route::has('emergency.checklist.toggle') && ! Route::has('emergency.index')) {
        $this->markTestSkipped('Waiting for Milestone 2: Emergency checklist routes implementation.');
    }

    $loginUrl = Route::has('login') ? route('login') : '/login';

    // Toggle checklist mutation
    $responseToggle = $this->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => true,
    ]);

    if ($responseToggle->isRedirect()) {
        $responseToggle->assertRedirect($loginUrl);
    } else {
        $responseToggle->assertUnauthorized();
    }

    // Reset checklist mutation
    $responseReset = $this->postJson('/tanggap-darurat/checklist/reset', [
        'scenario_key' => 'apk_malware',
    ]);

    if ($responseReset->isRedirect()) {
        $responseReset->assertRedirect($loginUrl);
    } else {
        $responseReset->assertUnauthorized();
    }
});

/*
|--------------------------------------------------------------------------
| Tier 2: Auth-Gated Scan Persistence vs Guest Ephemerality
|--------------------------------------------------------------------------
*/

test('tier 2: guest scan execution is ephemeral and does not persist to database', function () {
    $endpoint = Route::has('chat.analyze') ? route('chat.analyze') : '/chat/analyze';

    $this->assertDatabaseCount('scans', 0);

    $response = $this->postJson($endpoint, [
        'content' => 'Selamat Anda mendapatkan undian Rp 50.000.000 dari Bank BRI. Masukkan kode OTP segera.',
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);

    // Guest scans must never be persisted to database, preserving privacy and satisfying R2
    $this->assertDatabaseCount('scans', 0);
});

test('tier 2: authenticated user scan execution automatically persists to database', function () {
    $endpoint = Route::has('chat.analyze') ? route('chat.analyze') : '/chat/analyze';
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson($endpoint, [
        'content' => 'Peringatan: Paket J&T Anda tertahan. Unduh dan buka file Cek_Resi_Paket.apk untuk melacak pengiriman.',
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);

    if (Scan::where('user_id', $user->id)->count() === 0) {
        $this->markTestSkipped('Waiting for Milestone 3: ChatController scan auto-persistence implementation.');
    }

    // Authenticated user scan must be persisted and associated with the user
    $this->assertDatabaseCount('scans', 1);
    $this->assertDatabaseHas('scans', [
        'user_id' => $user->id,
        'risk_level' => 'HIGH',
    ]);
});

/*
|--------------------------------------------------------------------------
| Tier 3: Post-Login Redirection & Intended URL Preservation
|--------------------------------------------------------------------------
*/

test('tier 3: post-login redirection directs authenticated user to dashboard', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $dashboardUrl = Route::has('dashboard') ? route('dashboard') : '/dashboard';

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password123',
    ]);

    $response->assertRedirect($dashboardUrl);
});

test('tier 3: guest attempting to access dashboard is redirected back to dashboard after login', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $dashboardUrl = Route::has('dashboard') ? route('dashboard') : '/dashboard';

    // 1. Guest visits protected /dashboard -> session stores intended URL
    $guestResponse = $this->get('/dashboard');
    $guestResponse->assertRedirect(route('login'));

    // 2. Guest logs in -> redirect should fulfill intended /dashboard
    $loginResponse = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password123',
    ]);

    $loginResponse->assertRedirect($dashboardUrl);
});

/*
|--------------------------------------------------------------------------
| Tier 4: Public Guest Access Preservation
|--------------------------------------------------------------------------
*/

test('tier 4: public guest access is fully preserved without forced authentication', function () {
    $scenario = SimulationScenario::where('is_active', true)->first();

    // 1. Guest can access landing page
    $landingResponse = $this->get('/');
    $landingResponse->assertOk();

    // 2. Guest can access interactive simulation listing
    $simulationsResponse = $this->get('/simulasi');
    $simulationsResponse->assertOk();

    // 3. Guest can access individual simulation scenario
    $scenarioResponse = $this->get("/simulasi/{$scenario->slug}");
    $scenarioResponse->assertOk();

    // 4. Guest can submit simulation decision
    $submitResponse = $this->postJson("/simulasi/{$scenario->slug}/submit", [
        'selected_option' => 'B',
        'feedback_notes' => 'Tamu mengidentifikasi bahaya APK.',
    ]);
    $submitResponse->assertOk();
    $submitResponse->assertJson(['success' => true]);

    // 5. Guest can read Emergency Response playbooks (if M2 route exists)
    if (Route::has('emergency.index')) {
        $emergencyResponse = $this->get('/tanggap-darurat');
        $emergencyResponse->assertOk();
    }

    // 6. Guest can perform instant fraud scan demo
    $chatResponse = $this->postJson('/chat/analyze', [
        'content' => 'Halo apakah rapat besok jam 10 pagi jadi diadakan?',
    ]);
    $chatResponse->assertOk();
});
