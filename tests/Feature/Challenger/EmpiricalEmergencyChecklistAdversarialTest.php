<?php

use App\Models\EmergencyChecklistProgress;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Section 1: Toggling Items (True, False, and Idempotent Operations)
|--------------------------------------------------------------------------
*/

describe('Emergency Checklist Toggling & Idempotency', function () {
    test('authenticated user can toggle a step to completed (true) and set completed_at timestamp', function () {
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

        $record = EmergencyChecklistProgress::where('user_id', $user->id)->first();
        expect($record)->not->toBeNull();
        expect($record->completed_at)->not->toBeNull();
    });

    test('repeated idempotent toggle to true does not create duplicate rows', function () {
        $user = User::factory()->create();

        // Send toggle true 3 times in succession
        for ($i = 0; $i < 3; $i++) {
            $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
                'scenario_key' => 'fraud_transfer',
                'step_key' => 'freeze_account',
                'is_completed' => true,
            ]);

            $response->assertOk();
            $response->assertJson([
                'success' => true,
                'is_completed' => true,
            ]);
        }

        // Exactly one record must exist in the database
        expect(EmergencyChecklistProgress::where('user_id', $user->id)
            ->where('scenario_key', 'fraud_transfer')
            ->where('step_key', 'freeze_account')
            ->count()
        )->toBe(1);
    });

    test('authenticated user can toggle a step to uncompleted (false) and nullify completed_at', function () {
        $user = User::factory()->create();

        // First set to true
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'ktp_leak',
            'step_key' => 'slik_ojk',
            'is_completed' => true,
        ]);

        // Untoggle to false
        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'ktp_leak',
            'step_key' => 'slik_ojk',
            'is_completed' => false,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'scenario_key' => 'ktp_leak',
            'step_key' => 'slik_ojk',
            'is_completed' => false,
        ]);

        $record = EmergencyChecklistProgress::where('user_id', $user->id)
            ->where('scenario_key', 'ktp_leak')
            ->where('step_key', 'slik_ojk')
            ->first();

        expect($record->is_completed)->toBeFalse();
        expect($record->completed_at)->toBeNull();
    });

    test('repeated idempotent toggle to false remains false and does not duplicate rows', function () {
        $user = User::factory()->create();

        // Send toggle false 3 times directly
        for ($i = 0; $i < 3; $i++) {
            $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
                'scenario_key' => 'apk_malware',
                'step_key' => 'revoke_admin_uninstall',
                'is_completed' => false,
            ]);

            $response->assertOk();
            $response->assertJson([
                'success' => true,
                'is_completed' => false,
            ]);
        }

        expect(EmergencyChecklistProgress::where('user_id', $user->id)
            ->where('scenario_key', 'apk_malware')
            ->where('step_key', 'revoke_admin_uninstall')
            ->count()
        )->toBe(1);

        $record = EmergencyChecklistProgress::where('user_id', $user->id)
            ->where('scenario_key', 'apk_malware')
            ->where('step_key', 'revoke_admin_uninstall')
            ->first();

        expect($record->is_completed)->toBeFalse();
        expect($record->completed_at)->toBeNull();
    });

    test('rapid alternating toggle transitions (true -> false -> true) reflect correctly in index payload', function () {
        $user = User::factory()->create();

        // 1. Toggle true
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ])->assertOk();

        $pageTrue = $this->actingAs($user)->get('/tanggap-darurat');
        $pageTrue->assertInertia(fn ($page) => $page
            ->where('userProgress.apk_malware.disconnect_network', true)
        );

        // 2. Toggle false
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => false,
        ])->assertOk();

        $pageFalse = $this->actingAs($user)->get('/tanggap-darurat');
        $pageFalse->assertInertia(function ($page) {
            $progress = $page->toArray()['props']['userProgress'];
            expect(isset($progress['apk_malware']['disconnect_network']))->toBeFalse();
        });

        // 3. Toggle true again
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ])->assertOk();

        $pageTrueAgain = $this->actingAs($user)->get('/tanggap-darurat');
        $pageTrueAgain->assertInertia(fn ($page) => $page
            ->where('userProgress.apk_malware.disconnect_network', true)
        );
    });

    test('multiple distinct steps across different scenarios can be completed simultaneously', function () {
        $user = User::factory()->create();

        $steps = [
            ['apk_malware', 'disconnect_network'],
            ['apk_malware', 'revoke_admin_uninstall'],
            ['fraud_transfer', 'freeze_account'],
            ['ktp_leak', 'slik_ojk'],
        ];

        foreach ($steps as [$scenario, $step]) {
            $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
                'scenario_key' => $scenario,
                'step_key' => $step,
                'is_completed' => true,
            ])->assertOk();
        }

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(4);
        expect(EmergencyChecklistProgress::where('user_id', $user->id)->where('is_completed', true)->count())->toBe(4);
    });
});

/*
|--------------------------------------------------------------------------
| Section 2: Global Reset vs Single Scenario Reset
|--------------------------------------------------------------------------
*/

describe('Emergency Checklist Reset Scopes', function () {
    test('single scenario reset deletes only steps for that specific scenario', function () {
        $user = User::factory()->create();

        // Populate multiple scenarios
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_2',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'fraud_transfer',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'ktp_leak',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(4);

        // Reset ONLY apk_malware
        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => 'apk_malware',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Progres checklist darurat berhasil direset.',
        ]);

        // apk_malware must be cleared
        expect(EmergencyChecklistProgress::where('user_id', $user->id)
            ->where('scenario_key', 'apk_malware')
            ->count()
        )->toBe(0);

        // fraud_transfer and ktp_leak must remain intact
        expect(EmergencyChecklistProgress::where('user_id', $user->id)
            ->where('scenario_key', 'fraud_transfer')
            ->count()
        )->toBe(1);

        expect(EmergencyChecklistProgress::where('user_id', $user->id)
            ->where('scenario_key', 'ktp_leak')
            ->count()
        )->toBe(1);
    });

    test('global reset without scenario_key wipes all checklist records for the user', function () {
        $user = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'fraud_transfer',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'ktp_leak',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(3);

        // Global reset with empty body
        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', []);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(0);
    });

    test('global reset with explicit null scenario_key wipes all checklist records for the user', function () {
        $user = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => null,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(0);
    });

    test('resetting an already empty checklist is a safe no-op that returns 200', function () {
        $user = User::factory()->create();

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(0);

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => 'fraud_transfer',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(0);
    });
});

/*
|--------------------------------------------------------------------------
| Section 3: Invalid Keys & Validation Boundaries (422 Unprocessable Entity)
|--------------------------------------------------------------------------
*/

describe('Emergency Checklist Input Validation & Boundaries', function () {
    test('toggle returns 422 for invalid scenario_key strings', function (string $invalidKey) {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => $invalidKey,
            'step_key' => 'test_step',
            'is_completed' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['scenario_key']);
    })->with([
        'crypto_scam',
        'phishing_email',
        'apk_malware_unknown',
        "apk_malware' OR '1'='1",
        '<script>alert(1)</script>',
        'APK_MALWARE',
        'fraud transfer',
    ]);

    test('toggle returns 422 when scenario_key is missing, null, or non-string', function ($invalidValue) {
        $user = User::factory()->create();

        $payload = [
            'step_key' => 'test_step',
            'is_completed' => true,
        ];

        if ($invalidValue !== 'O_MIT_KEY') {
            $payload['scenario_key'] = $invalidValue;
        }

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['scenario_key']);
    })->with([
        'O_MIT_KEY',
        null,
        12345,
        [['apk_malware']],
        false,
    ]);

    test('toggle returns 422 when step_key is missing, null, or exceeds 100 characters', function () {
        $user = User::factory()->create();

        // Missing step_key
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'is_completed' => true,
        ])->assertStatus(422)->assertJsonValidationErrors(['step_key']);

        // Null step_key
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => null,
            'is_completed' => true,
        ])->assertStatus(422)->assertJsonValidationErrors(['step_key']);

        // Exceeds 100 characters (101 chars)
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => str_repeat('a', 101),
            'is_completed' => true,
        ])->assertStatus(422)->assertJsonValidationErrors(['step_key']);

        // Exactly 100 characters is allowed
        $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => str_repeat('a', 100),
            'is_completed' => true,
        ])->assertOk();
    });

    test('toggle returns 422 when is_completed is missing or non-boolean', function ($invalidCompleted) {
        $user = User::factory()->create();

        $payload = [
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
        ];

        if ($invalidCompleted !== 'O_MIT_KEY') {
            $payload['is_completed'] = $invalidCompleted;
        }

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['is_completed']);
    })->with([
        'O_MIT_KEY',
        'invalid_string',
        'yes',
        'no',
        [['array_value']],
        null,
    ]);

    test('reset returns 422 for invalid scenario_key', function (string $invalidKey) {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => $invalidKey,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['scenario_key']);
    })->with([
        'random_scenario',
        'ktp_leak; DROP TABLE emergency_checklist_progress; --',
        '<svg onload=alert(1)>',
    ]);
});

/*
|--------------------------------------------------------------------------
| Section 4: Unauthenticated Requests (Auth Gate Boundaries)
|--------------------------------------------------------------------------
*/

describe('Emergency Checklist Auth Gate Boundaries', function () {
    test('unauthenticated JSON request to toggle returns 401 unauthorized', function () {
        $response = $this->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);

        $response->assertStatus(401);
        $response->assertUnauthorized();

        expect(EmergencyChecklistProgress::count())->toBe(0);
    });

    test('unauthenticated request with Accept application/json header to toggle returns 401', function () {
        $response = $this->withHeader('Accept', 'application/json')->post('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);

        $response->assertStatus(401);
        expect(EmergencyChecklistProgress::count())->toBe(0);
    });

    test('unauthenticated web form request to toggle redirects to login with 302', function () {
        $response = $this->post('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);

        $response->assertStatus(302);
        $response->assertRedirect(route('login'));

        expect(EmergencyChecklistProgress::count())->toBe(0);
    });

    test('unauthenticated JSON request to reset returns 401 unauthorized', function () {
        $response = $this->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => 'apk_malware',
        ]);

        $response->assertStatus(401);
        $response->assertUnauthorized();
    });

    test('unauthenticated request with Accept application/json header to reset returns 401', function () {
        $response = $this->withHeader('Accept', 'application/json')->post('/tanggap-darurat/checklist/reset');

        $response->assertStatus(401);
    });

    test('unauthenticated web form request to reset redirects to login with 302', function () {
        $response = $this->post('/tanggap-darurat/checklist/reset', [
            'scenario_key' => 'apk_malware',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect(route('login'));
    });
});

/*
|--------------------------------------------------------------------------
| Section 5: Cross-User Tenant Isolation
|--------------------------------------------------------------------------
*/

describe('Emergency Checklist Multi-Tenant Isolation', function () {
    test('guest user cannot see progress of authenticated users', function () {
        $userA = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);

        $guestResponse = $this->get('/tanggap-darurat');

        $guestResponse->assertOk();
        $guestResponse->assertInertia(fn ($page) => $page
            ->where('isGuest', true)
            ->where('userProgress', [])
        );
    });

    test('User B cannot see User A checklist progress on emergency center page', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'fraud_transfer',
            'step_key' => 'freeze_account',
            'is_completed' => true,
        ]);

        // User B visits page
        $responseB = $this->actingAs($userB)->get('/tanggap-darurat');

        $responseB->assertOk();
        $responseB->assertInertia(fn ($page) => $page
            ->where('isGuest', false)
            ->where('userProgress', [])
        );
    });

    test('User B parameter tampering cannot modify User A checklist progress', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // User A completed disconnect_network
        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
            'completed_at' => now()->subDay(),
        ]);

        $originalAProgress = EmergencyChecklistProgress::where('user_id', $userA->id)->first();

        // User B maliciously sends user_id = $userA->id in body trying to mark it false
        $responseB = $this->actingAs($userB)->postJson('/tanggap-darurat/checklist/toggle', [
            'user_id' => $userA->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => false,
        ]);

        $responseB->assertOk();

        // Refresh User A's record from DB
        $freshA = EmergencyChecklistProgress::where('user_id', $userA->id)->first();
        expect($freshA->is_completed)->toBeTrue();
        expect($freshA->completed_at->toIso8601String())->toBe($originalAProgress->completed_at->toIso8601String());

        // Verify User B's record was created independently with is_completed = false
        $recordB = EmergencyChecklistProgress::where('user_id', $userB->id)->first();
        expect($recordB)->not->toBeNull();
        expect($recordB->is_completed)->toBeFalse();
    });

    test('User B scenario reset does not wipe User A checklist progress', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $userB->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);

        // User B resets apk_malware
        $responseB = $this->actingAs($userB)->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => 'apk_malware',
        ]);
        $responseB->assertOk();

        // User B's record is gone
        expect(EmergencyChecklistProgress::where('user_id', $userB->id)->count())->toBe(0);

        // User A's record is still present
        expect(EmergencyChecklistProgress::where('user_id', $userA->id)->count())->toBe(1);
        $this->assertDatabaseHas('emergency_checklist_progress', [
            'user_id' => $userA->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);
    });

    test('User B global reset does not wipe User A checklist progress across any scenario', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // Populate records for User A
        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'fraud_transfer',
            'step_key' => 'freeze_account',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $userA->id,
            'scenario_key' => 'ktp_leak',
            'step_key' => 'slik_ojk',
            'is_completed' => true,
        ]);

        // Populate records for User B
        EmergencyChecklistProgress::create([
            'user_id' => $userB->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'disconnect_network',
            'is_completed' => true,
        ]);

        // User B triggers global reset
        $responseB = $this->actingAs($userB)->postJson('/tanggap-darurat/checklist/reset');
        $responseB->assertOk();

        // User B has 0 records
        expect(EmergencyChecklistProgress::where('user_id', $userB->id)->count())->toBe(0);

        // User A still has all 3 records
        expect(EmergencyChecklistProgress::where('user_id', $userA->id)->count())->toBe(3);
    });

    test('concurrent toggles by different users on the same step create isolated database records', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // Both users toggle the exact same scenario and step
        $this->actingAs($userA)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'fraud_transfer',
            'step_key' => 'collect_digital_evidence',
            'is_completed' => true,
        ])->assertOk();

        $this->actingAs($userB)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'fraud_transfer',
            'step_key' => 'collect_digital_evidence',
            'is_completed' => false,
        ])->assertOk();

        // Verify two records with correct ownership
        $recordA = EmergencyChecklistProgress::where('user_id', $userA->id)->first();
        $recordB = EmergencyChecklistProgress::where('user_id', $userB->id)->first();

        expect($recordA)->not->toBeNull();
        expect($recordB)->not->toBeNull();
        expect($recordA->is_completed)->toBeTrue();
        expect($recordB->is_completed)->toBeFalse();
    });
});

/*
|--------------------------------------------------------------------------
| Section 6: Database Integrity, Cascade Deletes & Advanced Injection Stress
|--------------------------------------------------------------------------
*/

describe('Emergency Checklist Database Integrity & Advanced Adversarial Vectors', function () {
    test('user deletion cascades and automatically removes all associated checklist progress', function () {
        $user = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'fraud_transfer',
            'step_key' => 'step_2',
            'is_completed' => true,
        ]);

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(2);

        // Delete user
        $user->delete();

        // Foreign key cascade must remove all records
        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(0);
    });

    test('reset endpoint rejects SQL wildcard injection attempts with 422 and does not delete records', function (string $wildcardPayload) {
        $user = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => $wildcardPayload,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['scenario_key']);

        // Data must not have been deleted
        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(1);
    })->with([
        '%',
        '_',
        'apk_%',
        '*',
        'apk_malware%',
        "' OR '1'='1",
    ]);

    test('reset ignores user_id in payload and does not wipe victim records', function () {
        $victim = User::factory()->create();
        $attacker = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $victim->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_1',
            'is_completed' => true,
        ]);

        $response = $this->actingAs($attacker)->postJson('/tanggap-darurat/checklist/reset', [
            'user_id' => $victim->id,
            'scenario_key' => 'apk_malware',
        ]);

        $response->assertOk();

        // Victim records remain intact
        expect(EmergencyChecklistProgress::where('user_id', $victim->id)->count())->toBe(1);
    });

    test('whitespace-only step_key is rejected with 422', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'apk_malware',
            'step_key' => '   ',
            'is_completed' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['step_key']);
    });

    test('unicode characters and symbols within 100 chars in step_key are properly persisted', function () {
        $user = User::factory()->create();
        $unicodeStep = 'langkah_cek_rekening_penipu_⚠️_123';

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/toggle', [
            'scenario_key' => 'fraud_transfer',
            'step_key' => $unicodeStep,
            'is_completed' => true,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'step_key' => $unicodeStep,
            'is_completed' => true,
        ]);

        $this->assertDatabaseHas('emergency_checklist_progress', [
            'user_id' => $user->id,
            'scenario_key' => 'fraud_transfer',
            'step_key' => $unicodeStep,
            'is_completed' => true,
        ]);
    });

    test('reset operation removes both completed and untoggled records cleanly', function () {
        $user = User::factory()->create();

        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_true',
            'is_completed' => true,
        ]);
        EmergencyChecklistProgress::create([
            'user_id' => $user->id,
            'scenario_key' => 'apk_malware',
            'step_key' => 'step_false',
            'is_completed' => false,
        ]);

        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(2);

        $response = $this->actingAs($user)->postJson('/tanggap-darurat/checklist/reset', [
            'scenario_key' => 'apk_malware',
        ]);

        $response->assertOk();
        expect(EmergencyChecklistProgress::where('user_id', $user->id)->count())->toBe(0);
    });
});
