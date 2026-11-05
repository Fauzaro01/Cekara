<?php

namespace App\Http\Controllers;

use App\Models\ScamPatternContribution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityRadarController extends Controller
{
    /**
     * Display the community threat radar with verified scam alerts and trending insights.
     */
    public function index(Request $request): Response
    {
        $category = $request->query('category');
        $platform = $request->query('platform');
        $sort = $request->query('sort', 'trending');
        $search = $request->query('search');

        $query = ScamPatternContribution::query()->where('is_verified', true);

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($platform && $platform !== 'all') {
            $query->where('platform', 'like', "%{$platform}%");
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($sort === 'latest') {
            $query->latest();
        } else {
            $query->orderBy('upvotes_count', 'desc')->latest();
        }

        $alerts = $query->get()->map(function (ScamPatternContribution $alert) {
            return [
                'id' => $alert->id,
                'title' => $alert->title,
                'category' => $alert->category,
                'platform' => $alert->platform,
                'location' => $alert->location,
                'description' => $alert->description,
                'evidence_text' => $alert->evidence_text,
                'upvotes_count' => $alert->upvotes_count,
                'created_at_human' => $alert->created_at?->diffForHumans() ?? 'Baru saja',
            ];
        });

        $totalVerified = ScamPatternContribution::where('is_verified', true)->count();
        $totalUpvotes = (int) ScamPatternContribution::where('is_verified', true)->sum('upvotes_count');
        $topPlatform = ScamPatternContribution::where('is_verified', true)
            ->selectRaw('platform, count(*) as count')
            ->groupBy('platform')
            ->orderByDesc('count')
            ->first()?->platform ?? 'WhatsApp';

        return Inertia::render('radar/index', [
            'alerts' => $alerts,
            'filters' => [
                'category' => $category ?? 'all',
                'platform' => $platform ?? 'all',
                'sort' => $sort,
                'search' => $search ?? '',
            ],
            'stats' => [
                'total_alerts' => $totalVerified,
                'total_confirmed_cases' => $totalUpvotes,
                'top_targeted_platform' => $topPlatform,
            ],
        ]);
    }

    /**
     * Increment the community confirmation count ("Saya Juga Mengalami Ini").
     */
    public function upvote(Request $request, ScamPatternContribution $pattern): JsonResponse
    {
        $pattern->increment('upvotes_count');

        return response()->json([
            'success' => true,
            'new_count' => $pattern->fresh()->upvotes_count,
            'message' => 'Terima kasih atas konfirmasi Anda. Laporan ini membantu memperingatkan lebih banyak calon korban.',
        ]);
    }

    /**
     * Submit a new threat pattern report directly from the radar page.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'platform' => ['required', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'evidence_text' => ['nullable', 'string', 'max:5000'],
        ]);

        $user = $request->user();
        $isAutoVerified = $user?->is_admin ?? false;

        $report = ScamPatternContribution::create([
            'user_id' => $user?->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'platform' => $validated['platform'],
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'],
            'evidence_text' => $validated['evidence_text'] ?? null,
            'is_verified' => $isAutoVerified,
            'upvotes_count' => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => $isAutoVerified
                ? 'Laporan langsung diverifikasi dan diterbitkan di Radar Komunitas.'
                : 'Laporan Anda telah diterima tim kurator Guardian Cekara dan akan ditinjau untuk diterbitkan.',
            'id' => $report->id,
        ], 201);
    }
}
