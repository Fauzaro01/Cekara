<?php

namespace App\Http\Controllers;

use App\Models\Scan;
use App\Models\SimulationAttempt;
use App\Services\GuardianStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected GuardianStatusService $guardianStatusService
    ) {}

    /**
     * Display the authenticated user's dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $status = $this->guardianStatusService->getStatusForUser($user);

        $recentScans = $user->scans()
            ->latest()
            ->take(20)
            ->get()
            ->map(fn (Scan $scan) => [
                'id' => $scan->id,
                'scan_type' => $scan->scan_type,
                'content' => $scan->content,
                'risk_level' => $scan->risk_level,
                'score' => $scan->score,
                'summary' => $scan->summary,
                'red_flags' => $scan->red_flags ?? [],
                'recommendations' => $scan->recommendations ?? [],
                'provider_used' => $scan->provider_used,
                'model_used' => $scan->model_used,
                'is_mock' => $scan->is_mock,
                'metadata' => $scan->metadata,
                'created_at' => $scan->created_at?->toISOString(),
                'relative_time' => $scan->created_at?->diffForHumans() ?? 'Baru saja',
            ]);

        $recentSimulations = $user->simulationAttempts()
            ->with('scenario')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (SimulationAttempt $attempt) => [
                'id' => $attempt->id,
                'scenario_title' => $attempt->scenario?->title ?? 'Skenario Simulasi',
                'scenario_slug' => $attempt->scenario?->slug,
                'is_safe' => $attempt->is_safe,
                'score' => $attempt->score,
                'created_at' => $attempt->created_at?->toISOString(),
                'relative_time' => $attempt->created_at?->diffForHumans() ?? 'Baru saja',
            ]);

        return Inertia::render('dashboard', [
            'guardianStatus' => $status,
            'recentScans' => $recentScans,
            'recentSimulations' => $recentSimulations,
        ]);
    }

    /**
     * Remove the specified scan from the user's history.
     */
    public function destroyScan(Request $request, int $id): RedirectResponse
    {
        $request->user()
            ->scans()
            ->where('id', $id)
            ->firstOrFail()
            ->delete();

        return back()->with('message', 'Riwayat pemindaian berhasil dihapus.');
    }
}
