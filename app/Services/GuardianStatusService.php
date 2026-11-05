<?php

namespace App\Services;

use App\Models\SimulationScenario;
use App\Models\User;

class GuardianStatusService
{
    /**
     * Get guardian metrics and status for a given user (or guest defaults).
     *
     * @return array{
     *     rank: string,
     *     alertness_score: int,
     *     alertness_label: string,
     *     completed_simulations: int,
     *     total_simulations: int,
     *     simulation_completion_rate: int,
     *     average_score: int,
     *     total_scans: int,
     *     threats_detected: int,
     *     safe_scans: int
     * }
     */
    public function getStatusForUser(?User $user = null): array
    {
        $totalScenarios = SimulationScenario::query()->where('is_active', true)->count();

        if ($user === null) {
            return [
                'rank' => 'Pemula Digital',
                'alertness_score' => 0,
                'alertness_label' => 'Perlu Latihan',
                'completed_simulations' => 0,
                'total_simulations' => $totalScenarios,
                'simulation_completion_rate' => 0,
                'average_score' => 0,
                'total_scans' => 0,
                'threats_detected' => 0,
                'safe_scans' => 0,
            ];
        }

        $attempts = $user->simulationAttempts()->get();
        $completedCount = $attempts->unique('simulation_scenario_id')->count();
        $averageScore = $completedCount > 0 ? (int) round($attempts->avg('score')) : 0;

        $rank = 'Pemula Digital';
        if ($completedCount >= 4 && $averageScore >= 85) {
            $rank = 'Master Guardian';
        } elseif ($completedCount >= 2 && $averageScore >= 70) {
            $rank = 'Guardian Waspada';
        } elseif ($completedCount >= 1) {
            $rank = 'Kadet Pengawas';
        }

        $alertnessScore = $averageScore;
        $alertnessLabel = match (true) {
            $alertnessScore >= 85 => 'Sangat Siaga',
            $alertnessScore >= 70 => 'Siaga & Waspada',
            $alertnessScore >= 50 => 'Cukup Waspada',
            default => 'Perlu Latihan',
        };

        $totalScans = $user->scans()->count();
        $threatsDetected = $user->scans()
            ->whereIn('risk_level', ['HIGH', 'danger', 'tinggi'])
            ->count();
        $safeScans = $user->scans()
            ->whereIn('risk_level', ['LOW', 'safe', 'aman'])
            ->count();

        $completionRate = $totalScenarios > 0
            ? (int) round(($completedCount / $totalScenarios) * 100)
            : 0;

        return [
            'rank' => $rank,
            'alertness_score' => $alertnessScore,
            'alertness_label' => $alertnessLabel,
            'completed_simulations' => $completedCount,
            'total_simulations' => $totalScenarios,
            'simulation_completion_rate' => min(100, $completionRate),
            'average_score' => $averageScore,
            'total_scans' => $totalScans,
            'threats_detected' => $threatsDetected,
            'safe_scans' => $safeScans,
        ];
    }
}
