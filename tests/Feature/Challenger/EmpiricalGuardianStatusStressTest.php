<?php

use App\Models\Scan;
use App\Models\SimulationAttempt;
use App\Models\SimulationScenario;
use App\Models\User;
use App\Services\GuardianStatusService;
use Database\Seeders\SimulationScenarioSeeder;

beforeEach(function () {
    $this->seed(SimulationScenarioSeeder::class);
    $this->service = app(GuardianStatusService::class);
});

describe('GuardianStatusService - Guest & Null Safety Fallback', function () {
    test('guest or null user returns safe baseline defaults without exceptions', function () {
        $status = $this->service->getStatusForUser(null);

        expect($status)->toBeArray()
            ->and($status['rank'])->toBe('Pemula Digital')
            ->and($status['alertness_score'])->toBe(0)
            ->and($status['alertness_label'])->toBe('Perlu Latihan')
            ->and($status['completed_simulations'])->toBe(0)
            ->and($status['total_simulations'])->toBeGreaterThanOrEqual(1)
            ->and($status['simulation_completion_rate'])->toBe(0)
            ->and($status['average_score'])->toBe(0)
            ->and($status['total_scans'])->toBe(0)
            ->and($status['threats_detected'])->toBe(0)
            ->and($status['safe_scans'])->toBe(0);
    });

    test('resilient against zero active scenarios without division by zero error', function () {
        SimulationScenario::query()->update(['is_active' => false]);

        $statusGuest = $this->service->getStatusForUser(null);
        expect($statusGuest['total_simulations'])->toBe(0)
            ->and($statusGuest['simulation_completion_rate'])->toBe(0);

        $user = User::factory()->create();
        $statusUser = $this->service->getStatusForUser($user);
        expect($statusUser['total_simulations'])->toBe(0)
            ->and($statusUser['simulation_completion_rate'])->toBe(0);
    });
});

describe('GuardianStatusService - Rank Boundary Stress Tests', function () {
    test('0 scenarios completed evaluates to Pemula Digital with 0 score', function () {
        $user = User::factory()->create();

        $status = $this->service->getStatusForUser($user);

        expect($status['rank'])->toBe('Pemula Digital')
            ->and($status['completed_simulations'])->toBe(0)
            ->and($status['average_score'])->toBe(0)
            ->and($status['alertness_score'])->toBe(0)
            ->and($status['alertness_label'])->toBe('Perlu Latihan');
    });

    test('1 scenario completed evaluates to Kadet Pengawas regardless of score', function (int $score, string $expectedLabel) {
        $user = User::factory()->create();
        $scenario = SimulationScenario::first();

        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenario->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => $score,
            'feedback_notes' => 'Catatan percobaan.',
        ]);

        $status = $this->service->getStatusForUser($user);

        expect($status['rank'])->toBe('Kadet Pengawas')
            ->and($status['completed_simulations'])->toBe(1)
            ->and($status['average_score'])->toBe($score)
            ->and($status['alertness_score'])->toBe($score)
            ->and($status['alertness_label'])->toBe($expectedLabel);
    })->with([
        'perfect score' => [100, 'Sangat Siaga'],
        'high score 85' => [85, 'Sangat Siaga'],
        'medium-high score 75' => [75, 'Siaga & Waspada'],
        'boundary score 69' => [69, 'Cukup Waspada'],
        'boundary score 50' => [50, 'Cukup Waspada'],
        'low score 20' => [20, 'Perlu Latihan'],
        'zero score' => [0, 'Perlu Latihan'],
    ]);

    test('2 scenarios completed with average score 69 evaluates to Kadet Pengawas', function () {
        $user = User::factory()->create();
        $scenarios = SimulationScenario::take(2)->get();

        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[0]->id,
            'selected_option' => 'A',
            'is_safe' => true,
            'score' => 69,
            'feedback_notes' => 'Skenario 1',
        ]);

        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[1]->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 69,
            'feedback_notes' => 'Skenario 2',
        ]);

        $status = $this->service->getStatusForUser($user);

        expect($status['completed_simulations'])->toBe(2)
            ->and($status['average_score'])->toBe(69)
            ->and($status['rank'])->toBe('Kadet Pengawas')
            ->and($status['alertness_label'])->toBe('Cukup Waspada');
    });

    test('2 scenarios completed with average score 70 evaluates to Guardian Waspada', function () {
        $user = User::factory()->create();
        $scenarios = SimulationScenario::take(2)->get();

        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[0]->id,
            'selected_option' => 'A',
            'is_safe' => true,
            'score' => 70,
            'feedback_notes' => 'Skenario 1',
        ]);

        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[1]->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 70,
            'feedback_notes' => 'Skenario 2',
        ]);

        $status = $this->service->getStatusForUser($user);

        expect($status['completed_simulations'])->toBe(2)
            ->and($status['average_score'])->toBe(70)
            ->and($status['rank'])->toBe('Guardian Waspada')
            ->and($status['alertness_label'])->toBe('Siaga & Waspada');
    });

    test('4 scenarios completed with average score 84 evaluates to Guardian Waspada', function () {
        $user = User::factory()->create();
        $scenarios = SimulationScenario::take(4)->get();

        $scores = [84, 84, 84, 84];
        foreach ($scenarios as $idx => $scenario) {
            SimulationAttempt::create([
                'user_id' => $user->id,
                'simulation_scenario_id' => $scenario->id,
                'selected_option' => 'B',
                'is_safe' => true,
                'score' => $scores[$idx],
                'feedback_notes' => "Skenario $idx",
            ]);
        }

        $status = $this->service->getStatusForUser($user);

        expect($status['completed_simulations'])->toBe(4)
            ->and($status['average_score'])->toBe(84)
            ->and($status['rank'])->toBe('Guardian Waspada')
            ->and($status['alertness_label'])->toBe('Siaga & Waspada');
    });

    test('4 scenarios completed with average score 85 evaluates to Master Guardian', function () {
        $user = User::factory()->create();
        $scenarios = SimulationScenario::take(4)->get();

        $scores = [85, 85, 85, 85];
        foreach ($scenarios as $idx => $scenario) {
            SimulationAttempt::create([
                'user_id' => $user->id,
                'simulation_scenario_id' => $scenario->id,
                'selected_option' => 'B',
                'is_safe' => true,
                'score' => $scores[$idx],
                'feedback_notes' => "Skenario $idx",
            ]);
        }

        $status = $this->service->getStatusForUser($user);

        expect($status['completed_simulations'])->toBe(4)
            ->and($status['average_score'])->toBe(85)
            ->and($status['rank'])->toBe('Master Guardian')
            ->and($status['alertness_label'])->toBe('Sangat Siaga');
    });

    test('3 scenarios with score 90 evaluates to Guardian Waspada because count is under 4', function () {
        $user = User::factory()->create();
        $scenarios = SimulationScenario::take(3)->get();

        foreach ($scenarios as $scenario) {
            SimulationAttempt::create([
                'user_id' => $user->id,
                'simulation_scenario_id' => $scenario->id,
                'selected_option' => 'B',
                'is_safe' => true,
                'score' => 90,
                'feedback_notes' => 'Skenario',
            ]);
        }

        $status = $this->service->getStatusForUser($user);

        // Even with score 90, Master Guardian requires completedCount >= 4.
        expect($status['completed_simulations'])->toBe(3)
            ->and($status['average_score'])->toBe(90)
            ->and($status['rank'])->toBe('Guardian Waspada');
    });

    test('4 scenarios with low average score 60 evaluates to Kadet Pengawas', function () {
        $user = User::factory()->create();
        $scenarios = SimulationScenario::take(4)->get();

        foreach ($scenarios as $scenario) {
            SimulationAttempt::create([
                'user_id' => $user->id,
                'simulation_scenario_id' => $scenario->id,
                'selected_option' => 'A',
                'is_safe' => false,
                'score' => 60,
                'feedback_notes' => 'Skenario',
            ]);
        }

        $status = $this->service->getStatusForUser($user);

        // completedCount >= 4, but averageScore is 60 (< 70), so rank drops to Kadet Pengawas.
        expect($status['completed_simulations'])->toBe(4)
            ->and($status['average_score'])->toBe(60)
            ->and($status['rank'])->toBe('Kadet Pengawas')
            ->and($status['alertness_label'])->toBe('Cukup Waspada');
    });
});

describe('GuardianStatusService - Duplicate Attempts Stress Tests', function () {
    test('multiple attempts on the SAME scenario counts as 1 unique scenario', function () {
        $user = User::factory()->create();
        $scenario = SimulationScenario::first();

        // 5 attempts on the same scenario
        for ($i = 1; $i <= 5; $i++) {
            SimulationAttempt::create([
                'user_id' => $user->id,
                'simulation_scenario_id' => $scenario->id,
                'selected_option' => 'B',
                'is_safe' => true,
                'score' => 90,
                'feedback_notes' => "Attempt $i",
            ]);
        }

        $status = $this->service->getStatusForUser($user);

        // Unique completed count MUST be 1, not 5
        expect($status['completed_simulations'])->toBe(1)
            ->and($user->simulationAttempts()->count())->toBe(5)
            // Cannot be promoted to Master Guardian or Guardian Waspada despite having 5 attempts
            ->and($status['rank'])->toBe('Kadet Pengawas');
    });

    test('user with 4 total attempts across only 2 scenarios does NOT achieve Master Guardian', function () {
        $user = User::factory()->create();
        $scenarios = SimulationScenario::take(2)->get();

        // 2 attempts on scenario 1 with 100 score
        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[0]->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 100,
        ]);
        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[0]->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 100,
        ]);

        // 2 attempts on scenario 2 with 80 score
        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[1]->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 80,
        ]);
        SimulationAttempt::create([
            'user_id' => $user->id,
            'simulation_scenario_id' => $scenarios[1]->id,
            'selected_option' => 'B',
            'is_safe' => true,
            'score' => 80,
        ]);

        $status = $this->service->getStatusForUser($user);

        expect($user->simulationAttempts()->count())->toBe(4)
            ->and($status['completed_simulations'])->toBe(2)
            ->and($status['average_score'])->toBe(90)
            ->and($status['rank'])->toBe('Guardian Waspada'); // NOT Master Guardian
    });
});

describe('GuardianStatusService - Scans Counting and Tenant Isolation', function () {
    test('accurately categorizes threat levels and isolates user scans', function () {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create scans for User 1
        Scan::factory()->create(['user_id' => $user1->id, 'risk_level' => 'HIGH']);
        Scan::factory()->create(['user_id' => $user1->id, 'risk_level' => 'danger']);
        Scan::factory()->create(['user_id' => $user1->id, 'risk_level' => 'tinggi']);
        Scan::factory()->create(['user_id' => $user1->id, 'risk_level' => 'LOW']);
        Scan::factory()->create(['user_id' => $user1->id, 'risk_level' => 'safe']);
        Scan::factory()->create(['user_id' => $user1->id, 'risk_level' => 'aman']);
        Scan::factory()->create(['user_id' => $user1->id, 'risk_level' => 'MEDIUM']);

        // Create scans for User 2 (should not leak into User 1)
        Scan::factory()->count(10)->create(['user_id' => $user2->id, 'risk_level' => 'HIGH']);

        $status1 = $this->service->getStatusForUser($user1);

        expect($status1['total_scans'])->toBe(7)
            ->and($status1['threats_detected'])->toBe(3) // HIGH, danger, tinggi
            ->and($status1['safe_scans'])->toBe(3);       // LOW, safe, aman

        $status2 = $this->service->getStatusForUser($user2);
        expect($status2['total_scans'])->toBe(10)
            ->and($status2['threats_detected'])->toBe(10)
            ->and($status2['safe_scans'])->toBe(0);
    });
});
