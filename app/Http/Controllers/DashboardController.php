<?php

namespace App\Http\Controllers;

use App\Models\LlmProvider;
use App\Models\ScamPatternContribution;
use App\Models\Scan;
use App\Models\SimulationAttempt;
use App\Models\User;
use App\Services\GuardianStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected GuardianStatusService $guardianStatusService
    ) {}

    /**
     * Display the authenticated user's dashboard (or admin dashboard if admin).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return $this->adminDashboard($request);
        }

        $status = $this->guardianStatusService->getStatusForUser($user);

        $recentScans = $user->scans()
            ->latest()
            ->take(4)
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
     * Display the administrator's monitoring dashboard.
     */
    protected function adminDashboard(Request $request): Response
    {
        // Use local Indonesian timezone (WIB, Asia/Jakarta) for all day boundaries
        $tz = 'Asia/Jakarta';
        $todayStartUtc = Carbon::today($tz)->setTimezone('UTC');
        $sevenDaysAgoUtc = Carbon::now($tz)->subDays(7)->setTimezone('UTC');
        $fourteenDaysAgoUtc = Carbon::now($tz)->subDays(13)->startOfDay()->setTimezone('UTC');

        $highRiskValues = ['HIGH', 'DANGER', 'TINGGI', 'High', 'Danger', 'Tinggi'];
        $medRiskValues = ['MEDIUM', 'SEDANG', 'WARN', 'Medium', 'Sedang', 'Warn'];
        $lowRiskValues = ['LOW', 'RENDAH', 'SAFE', 'Low', 'Rendah', 'Safe'];

        // 1. Overview metrics (accurately counted from database)
        $totalApiRequests = Scan::count();
        $todayApiRequests = Scan::where('created_at', '>=', $todayStartUtc)->count();
        $weekApiRequests = Scan::where('created_at', '>=', $sevenDaysAgoUtc)->count();

        $totalUsers = User::count();
        $todayUsers = User::where('created_at', '>=', $todayStartUtc)->count();
        $newUsersWeek = User::where('created_at', '>=', $sevenDaysAgoUtc)->count();

        $highRiskScans = Scan::whereIn('risk_level', $highRiskValues)->count();
        $todayHighRiskScans = Scan::whereIn('risk_level', $highRiskValues)->where('created_at', '>=', $todayStartUtc)->count();
        $mediumRiskScans = Scan::whereIn('risk_level', $medRiskValues)->count();
        $lowRiskScans = Scan::whereIn('risk_level', $lowRiskValues)->count();

        $guestScansCount = Scan::whereNull('user_id')->count();
        $authScansCount = Scan::whereNotNull('user_id')->count();

        $totalSimulations = SimulationAttempt::count();
        $totalReports = ScamPatternContribution::count();

        $activeProvider = LlmProvider::where('is_active', true)->first();
        $activeProviderRequests = $activeProvider
            ? Scan::where('provider_used', 'LIKE', '%' . $activeProvider->name . '%')->count()
            : 0;

        // 2. Chart data: last 14 days usage in WIB timezone calculated with real AI metrics
        $chartData = [];
        $scansLast14Days = Scan::where('created_at', '>=', $fourteenDaysAgoUtc)
            ->get(['created_at', 'risk_level', 'scan_type', 'score', 'provider_used', 'is_mock']);

        for ($i = 13; $i >= 0; $i--) {
            $dayWib = Carbon::now($tz)->subDays($i);
            $dayStr = $dayWib->toDateString();
            $dayScans = $scansLast14Days->filter(function ($s) use ($dayStr, $tz) {
                return $s->created_at?->setTimezone($tz)->toDateString() === $dayStr;
            });

            $dayHigh = $dayScans->filter(fn ($s) => in_array(strtoupper($s->risk_level), ['HIGH', 'DANGER', 'TINGGI'], true))->count();
            $dayMed = $dayScans->filter(fn ($s) => in_array(strtoupper($s->risk_level), ['MEDIUM', 'SEDANG', 'WARN'], true))->count();
            $dayLow = $dayScans->filter(fn ($s) => in_array(strtoupper($s->risk_level), ['LOW', 'RENDAH', 'SAFE'], true))->count();

            $chartData[] = [
                'date' => $dayStr,
                'label' => $dayWib->locale('id')->isoFormat('D MMM'),
                'day_name' => $dayWib->locale('id')->isoFormat('ddd'),
                'total' => $dayScans->count(),
                'high_risk' => $dayHigh,
                'medium_risk' => $dayMed,
                'low_risk' => $dayLow,
                'avg_score' => $dayScans->count() > 0 ? round((float) $dayScans->avg('score'), 1) : 0,
                'text_count' => $dayScans->where('scan_type', 'text')->count(),
                'url_count' => $dayScans->where('scan_type', 'url')->count(),
                'image_count' => $dayScans->where('scan_type', 'image')->count(),
            ];
        }

        // 3. User API usage recap (data rekapan dari user sudah berapa request api nya)
        $userApiStats = User::withCount([
            'scans',
            'scans as text_scans_count' => fn ($q) => $q->where('scan_type', 'text'),
            'scans as url_scans_count' => fn ($q) => $q->where('scan_type', 'url'),
            'scans as image_scans_count' => fn ($q) => $q->where('scan_type', 'image'),
            'scans as high_risk_scans_count' => fn ($q) => $q->whereIn('risk_level', $highRiskValues),
            'simulationAttempts',
        ])
        ->with(['scans' => fn ($q) => $q->latest()->select('id', 'user_id', 'created_at')->limit(1)])
        ->orderByDesc('scans_count')
        ->get()
        ->map(function (User $u) use ($tz) {
            $latestScan = $u->scans->first();
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => $u->avatar,
                'is_admin' => (bool) $u->is_admin,
                'total_requests' => $u->scans_count,
                'text_requests' => $u->text_scans_count,
                'url_requests' => $u->url_scans_count,
                'image_requests' => $u->image_scans_count,
                'high_risk_requests' => $u->high_risk_scans_count,
                'total_simulations' => $u->simulation_attempts_count,
                'last_request_at' => $latestScan ? $latestScan->created_at?->setTimezone($tz)->diffForHumans() : 'Belum pernah',
                'joined_at' => $u->created_at?->setTimezone($tz)->locale('id')->isoFormat('D MMM YYYY') ?? '-',
            ];
        });

        $guestStats = [
            'total_requests' => $guestScansCount,
            'text_requests' => Scan::whereNull('user_id')->where('scan_type', 'text')->count(),
            'url_requests' => Scan::whereNull('user_id')->where('scan_type', 'url')->count(),
            'image_requests' => Scan::whereNull('user_id')->where('scan_type', 'image')->count(),
            'high_risk_requests' => Scan::whereNull('user_id')->whereIn('risk_level', $highRiskValues)->count(),
            'last_request_at' => Scan::whereNull('user_id')->latest()->first()?->created_at?->setTimezone($tz)->diffForHumans() ?? 'Belum pernah',
        ];

        // 4. Scan type distribution
        $scanTypeStats = [
            'text' => Scan::where('scan_type', 'text')->count(),
            'url' => Scan::where('scan_type', 'url')->count(),
            'image' => Scan::where('scan_type', 'image')->count(),
        ];

        // 5. Provider breakdown
        $providerBreakdown = Scan::select('provider_used')
            ->selectRaw('count(*) as count')
            ->groupBy('provider_used')
            ->get()
            ->map(fn ($row) => [
                'provider' => $row->provider_used ?: 'Google Gemini (Default)',
                'count' => $row->count,
            ]);

        // 6. Recent live scan requests (latest 15)
        $recentScans = Scan::with('user:id,name,email,avatar')
            ->latest()
            ->take(15)
            ->get()
            ->map(function (Scan $scan) use ($tz) {
                return [
                    'id' => $scan->id,
                    'public_id' => $scan->public_id,
                    'user_name' => $scan->user?->name ?? 'Tamu (Guest)',
                    'user_email' => $scan->user?->email,
                    'user_avatar' => $scan->user?->avatar,
                    'is_guest' => is_null($scan->user_id),
                    'scan_type' => $scan->scan_type,
                    'risk_level' => $scan->risk_level,
                    'score' => $scan->score,
                    'summary' => Str::limit($scan->summary, 120),
                    'content_snippet' => Str::limit($scan->content, 80),
                    'provider_used' => $scan->provider_used,
                    'model_used' => $scan->model_used,
                    'is_mock' => (bool) $scan->is_mock,
                    'created_at' => $scan->created_at?->setTimezone($tz)->toISOString(),
                    'relative_time' => $scan->created_at?->setTimezone($tz)->diffForHumans() ?? 'Baru saja',
                ];
            });

        return Inertia::render('admin/dashboard', [
            'overview' => [
                'total_api_requests' => $totalApiRequests,
                'today_api_requests' => $todayApiRequests,
                'week_api_requests' => $weekApiRequests,
                'total_users' => $totalUsers,
                'today_users' => $todayUsers,
                'new_users_week' => $newUsersWeek,
                'high_risk_scans' => $highRiskScans,
                'today_high_risk_scans' => $todayHighRiskScans,
                'medium_risk_scans' => $mediumRiskScans,
                'low_risk_scans' => $lowRiskScans,
                'guest_scans_count' => $guestScansCount,
                'auth_scans_count' => $authScansCount,
                'total_simulations' => $totalSimulations,
                'total_reports' => $totalReports,
                'active_provider' => $activeProvider ? [
                    'id' => $activeProvider->id,
                    'name' => $activeProvider->name,
                    'key' => $activeProvider->key,
                    'model' => $activeProvider->model,
                    'is_active' => (bool) $activeProvider->is_active,
                    'requests_handled' => $activeProviderRequests,
                ] : null,
            ],
            'chartData' => $chartData,
            'aiAnalysisSummary' => [
                'total_analyzed' => $totalApiRequests,
                'avg_fraud_score' => Scan::count() > 0 ? round((float) Scan::avg('score'), 1) : 0,
                'high_risk_count' => $highRiskScans,
                'medium_risk_count' => $mediumRiskScans,
                'low_risk_count' => $lowRiskScans,
                'high_risk_pct' => $totalApiRequests > 0 ? round(($highRiskScans / $totalApiRequests) * 100, 1) : 0,
                'safe_pct' => $totalApiRequests > 0 ? round(($lowRiskScans / $totalApiRequests) * 100, 1) : 0,
                'real_ai_requests' => Scan::where('is_mock', false)->count(),
                'active_engine' => $activeProvider ? $activeProvider->name : 'Belum terkait',
                'active_model' => $activeProvider ? $activeProvider->model : 'Belum dikonfigurasi',
            ],
            'userApiStats' => $userApiStats,
            'guestStats' => $guestStats,
            'scanTypeStats' => $scanTypeStats,
            'providerBreakdown' => $providerBreakdown,
            'recentScans' => $recentScans,
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
