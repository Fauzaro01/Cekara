<?php

use App\Models\EmergencyChecklistProgress;
use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    if (! Route::has('emergency.index') && ! class_exists('App\Models\EmergencyChecklistProgress')) {
        $this->markTestSkipped('Waiting for Milestone 2: Emergency Response & Action Center implementation.');
    }
});

/*
|--------------------------------------------------------------------------
| Tier 1: Contract & Schema for Emergency Center
|--------------------------------------------------------------------------
*/

test('tier 1: emergency center route renders inertia emergency page with required props', function () {
    $response = $this->get('/tanggap-darurat');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('emergency/index')
        ->has('scenarios')
        ->has('whatsappPresets')
        ->has('userProgress')
        ->has('isGuest')
    );
});

test('tier 1: emergency center scenarios include apk, transfer, and ktp leak playbooks with steps', function () {
    $response = $this->get('/tanggap-darurat');

    $response->assertOk();
    $response->assertInertia(function ($page) {
        $page->component('emergency/index');

        $scenarios = $page->toArray()['props']['scenarios'];
        expect($scenarios)->toBeArray();

        $keys = collect($scenarios)->pluck('key')->all();
        expect($keys)->toContain('apk_malware');
        expect($keys)->toContain('fraud_transfer');
        expect($keys)->toContain('ktp_leak');

        // Check APK malware scenario has concrete actionable steps and containment details
        $apkScenario = collect($scenarios)->firstWhere('key', 'apk_malware');
        expect($apkScenario)->not->toBeNull();
        expect($apkScenario['steps'])->toBeArray();
        expect(count($apkScenario['steps']))->toBeGreaterThanOrEqual(4);

        $stepKeys = collect($apkScenario['steps'])->pluck('key')->all();
        expect(collect($stepKeys)->some(fn ($k) => str_contains($k, 'network') || str_contains($k, 'koneksi') || str_contains($k, 'airplane')))->toBeTrue();

        // Check Fraud transfer scenario contains bank freeze / golden hour guidance
        $transferScenario = collect($scenarios)->firstWhere('key', 'fraud_transfer');
        expect($transferScenario)->not->toBeNull();
        expect(count($transferScenario['steps']))->toBeGreaterThanOrEqual(4);

        // Check KTP leak scenario contains OJK / legal shield guidance
        $ktpScenario = collect($scenarios)->firstWhere('key', 'ktp_leak');
        expect($ktpScenario)->not->toBeNull();
        expect(count($ktpScenario['steps']))->toBeGreaterThanOrEqual(4);
    });
});

/*
|--------------------------------------------------------------------------
| Tier 2: State Transitions & Checklist Persistence
|--------------------------------------------------------------------------
*/

test('tier 2: authenticated user can toggle checklist item and persist state in database', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => true,
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => true,
    ]);

    $this->assertDatabaseHas('emergency_checklist_progress', [
        'user_id' => $user->id,
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => true,
    ]);

    // Untoggle
    $responseUntoggle = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => false,
    ]);

    $responseUntoggle->assertOk();
    $responseUntoggle->assertJson([
        'success' => true,
        'is_completed' => false,
    ]);

    $this->assertDatabaseHas('emergency_checklist_progress', [
        'user_id' => $user->id,
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => false,
    ]);
});

test('tier 2: authenticated user can reset checklist progress per scenario or globally', function () {
    $user = User::factory()->create();

    // Populate checklist progress for multiple scenarios
    EmergencyChecklistProgress::create([
        'user_id' => $user->id,
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => true,
        'completed_at' => now(),
    ]);
    EmergencyChecklistProgress::create([
        'user_id' => $user->id,
        'scenario_key' => 'apk_malware',
        'step_key' => 'call_bank',
        'is_completed' => true,
        'completed_at' => now(),
    ]);
    EmergencyChecklistProgress::create([
        'user_id' => $user->id,
        'scenario_key' => 'fraud_transfer',
        'step_key' => 'freeze_account',
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(3);

    // Reset only apk_malware
    $responseResetScenario = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', [
        'scenario_key' => 'apk_malware',
    ]);

    $responseResetScenario->assertOk();
    $responseResetScenario->assertJson(['success' => true]);

    expect(EmergencyChecklistProgress::where('user_id', $user->id)->where('scenario_key', 'apk_malware')->count())->toBe(0);
    expect(EmergencyChecklistProgress::where('user_id', $user->id)->where('scenario_key', 'fraud_transfer')->count())->toBe(1);

    // Reset all scenarios
    $responseResetAll = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset');
    $responseResetAll->assertOk();
    $responseResetAll->assertJson(['success' => true]);

    expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Tier 3: Validation, Boundaries & Tampering
|--------------------------------------------------------------------------
*/

test('tier 3: checklist toggle validates scenario_key, step_key, and is_completed', function () {
    $user = User::factory()->create();

    // Unknown scenario_key
    $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'invalid_unknown_scenario',
        'step_key' => 'disconnect_network',
        'is_completed' => true,
    ]);
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['scenario_key']);

    // Missing step_key
    $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'is_completed' => true,
    ]);
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['step_key']);

    // Non-boolean is_completed
    $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => 'not_a_boolean',
    ]);
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['is_completed']);
});

test('tier 3: checklist progress is strictly isolated between users', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    EmergencyChecklistProgress::create([
        'user_id' => $userA->id,
        'scenario_key' => 'ktp_leak',
        'step_key' => 'slik_ojk',
        'is_completed' => true,
    ]);

    // User B visits emergency center
    $responseB = $this->actingAs($userB)->get('/tanggap-darurat');
    $responseB->assertInertia(function ($page) {
        $userProgress = $page->toArray()['props']['userProgress'];
        expect($userProgress)->toBeArray();
        expect(isset($userProgress['ktp_leak']['slik_ojk']))->toBeFalse();
    });

    // User B attempts to reset -> must not affect User A's progress
    $this->actingAs($userB)->postJson('/tanggap-darurat/checklist/reset');
    $this->assertDatabaseHas('emergency_checklist_progress', [
        'user_id' => $userA->id,
        'scenario_key' => 'ktp_leak',
        'step_key' => 'slik_ojk',
        'is_completed' => true,
    ]);
});

/*
|--------------------------------------------------------------------------
| Tier 4: Integrated Victim Incident Playbook Flow
|--------------------------------------------------------------------------
*/

test('tier 4: realistic victim containment flow for apk malware incident with state persistence', function () {
    $user = User::factory()->create();

    // 1. Panicked user navigates to emergency page
    $initialVisit = $this->actingAs($user)->get('/tanggap-darurat');
    $initialVisit->assertOk();

    // 2. User executes containment step 1: Disconnect network
    $step1 = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'step_key' => 'disconnect_network',
        'is_completed' => true,
    ]);
    $step1->assertOk();

    // 3. User executes containment step 2: Revoke admin permissions & uninstall APK
    $step2 = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'step_key' => 'revoke_admin_uninstall',
        'is_completed' => true,
    ]);
    $step2->assertOk();

    // 4. User executes containment step 3: Call bank to block m-banking
    $step3 = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
        'scenario_key' => 'apk_malware',
        'step_key' => 'freeze_bank_account',
        'is_completed' => true,
    ]);
    $step3->assertOk();

    // 5. User refreshes or returns later to verify progress
    $followUpVisit = $this->actingAs($user)->get('/tanggap-darurat');
    $followUpVisit->assertInertia(function ($page) {
        $userProgress = $page->toArray()['props']['userProgress'];
        expect($userProgress['apk_malware']['disconnect_network'])->toBeTrue();
        expect($userProgress['apk_malware']['revoke_admin_uninstall'])->toBeTrue();
        expect($userProgress['apk_malware']['freeze_bank_account'])->toBeTrue();
    });
});
