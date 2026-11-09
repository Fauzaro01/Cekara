<?php

namespace App\Http\Controllers;

use App\Models\Scan;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    /**
     * Display the specified public scan result.
     */
    public function show(string $publicId): Response
    {
        $scan = Scan::where('public_id', $publicId)->firstOrFail();

        $imagePath = $scan->metadata['image_path'] ?? null;
        $imageUrl = $imagePath ? Storage::disk('public')->url($imagePath) : null;

        return Inertia::render('scans/show', [
            'scan' => [
                'id' => $scan->id,
                'public_id' => $scan->public_id,
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
                'image_url' => $imageUrl,
                'share_url' => url("/scans/{$scan->public_id}"),
                'created_at' => $scan->created_at?->toISOString(),
                'formatted_date' => $scan->created_at?->translatedFormat('d F Y, H:i') ?? $scan->created_at?->format('d M Y H:i'),
                'relative_time' => $scan->created_at?->diffForHumans() ?? 'Baru saja',
            ],
        ]);
    }
}
