<?php

namespace App\Http\Controllers;

use App\Models\Scan;
use App\Services\Llm\LlmManager;
use App\Services\Security\UrlPhishingScanner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * Analyze message content or screenshot image for digital fraud indicators.
     */
    public function analyze(
        Request $request,
        LlmManager $llmManager,
        UrlPhishingScanner $urlScanner
    ): JsonResponse {
        if (! $request->has('content') && $request->has('message')) {
            $request->merge(['content' => $request->input('message')]);
        }

        $validated = $request->validate([
            'content' => ['required_without:image', 'nullable', 'string', 'min:3', 'max:10000'],
            'image' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'extensions:jpg,jpeg,png,webp',
                'dimensions:min_width=1,min_height=1',
                'max:5120',
            ],
            'context' => ['nullable', 'array'],
        ], [
            'content.required_without' => 'Kolom isi pesan wajib diisi bila gambar tidak disertakan.',
            'content.required' => 'Kolom isi pesan wajib diisi.',
            'content.min' => 'Kolom isi pesan harus berisi minimal :min karakter.',
            'content.max' => 'Kolom isi pesan tidak boleh lebih dari :max karakter.',
            'image.image' => 'Berkas harus berupa gambar.',
            'image.mimes' => 'Format gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
            'image.extensions' => 'Ekstensi berkas gambar harus berupa jpg, jpeg, png, atau webp.',
            'image.dimensions' => 'Berkas gambar tidak valid atau rusak.',
            'image.max' => 'Ukuran gambar maksimal adalah 5MB.',
        ]);

        $context = $request->input('context', []);
        $storedImagePath = null;
        $imageFilename = null;

        if ($request->hasFile('image')) {
            $imageFile = $request->file('image');
            $imageFilename = $imageFile->getClientOriginalName();

            // Store image to 'public' disk in 'scans' folder for all scans (both guest and auth)
            $storedImagePath = $imageFile->store('scans', 'public');

            $context['image'] = [
                'mime_type' => $imageFile->getMimeType(),
                'data' => base64_encode(file_get_contents($imageFile->getRealPath())),
                'filename' => $imageFilename,
                'path' => $storedImagePath,
            ];
        }

        $contentToAnalyze = $validated['content'] ?? ($imageFilename ?? 'Screenshot Percakapan');

        $result = $llmManager->analyze(
            $contentToAnalyze,
            $context
        );

        // Scan any URLs present in content
        $detectedUrls = [];
        $urlScans = [];
        $hasSuspiciousUrl = false;

        if (! empty($validated['content'])) {
            $detectedUrls = $urlScanner->extractUrls($validated['content']);
            foreach ($detectedUrls as $url) {
                $urlResult = $urlScanner->scan($url);
                $urlScans[] = $urlResult;

                if ($urlResult['is_suspicious']) {
                    $hasSuspiciousUrl = true;
                    foreach ($urlResult['indicators'] as $indicator) {
                        $result->redFlags[] = $indicator;
                    }
                    $result->score = max($result->score, $urlResult['score']);
                    if (in_array(strtoupper($urlResult['risk_level']), ['HIGH', 'DANGER', 'TINGGI'], true)) {
                        $result->riskLevel = 'HIGH';
                    } elseif ($result->riskLevel !== 'HIGH' && in_array(strtoupper($urlResult['risk_level']), ['MEDIUM', 'SEDANG'], true)) {
                        $result->riskLevel = 'MEDIUM';
                    }
                }
            }
        }

        if ($hasSuspiciousUrl && $result->riskLevel === 'HIGH' && (str_contains(strtolower($result->summary), 'wajar') || str_contains(strtolower($result->summary), 'aman'))) {
            $result->summary = 'Peringatan bahaya: Tautan yang terdeteksi di dalam pesan mengarah ke situs mencurigakan atau indikasi phishing berbahaya.';
            $result->recommendations = [
                'Jangan pernah membuka tautan atau memasukkan data login / kredensial perbankan di situs tersebut.',
                'Hapus pesan dan blokir nomor pengirim segera.',
                'Laporkan tautan mencurigakan ke portal aduan resmi atau pihak bank terkait.',
            ];
        }

        // Deduplicate red flags
        $result->redFlags = array_values(array_unique($result->redFlags));

        // Persist scan for both guest (user_id = null) and authenticated user
        $scanType = match (true) {
            $request->hasFile('image') => 'image',
            ! empty($detectedUrls) => 'url',
            default => 'text',
        };

        $scan = Scan::create([
            'user_id' => $request->user()?->id,
            'scan_type' => $scanType,
            'content' => $validated['content'] ?? ($imageFilename ?? 'Screenshot Chat'),
            'risk_level' => $result->riskLevel,
            'score' => $result->score,
            'summary' => $result->summary,
            'red_flags' => $result->redFlags,
            'recommendations' => $result->recommendations,
            'provider_used' => $result->providerName,
            'model_used' => $result->model,
            'is_mock' => $result->isMock,
            'metadata' => [
                'image_path' => $storedImagePath,
                'image_filename' => $imageFilename,
                'detected_urls' => $detectedUrls,
                'url_scans' => $urlScans,
                'fallback_reason' => $result->fallbackReason,
            ],
        ]);

        $data = $result->toArray();
        $data['public_id'] = $scan->public_id;
        $data['scan_id'] = $scan->id;
        $data['share_url'] = url("/scans/{$scan->public_id}");

        return response()->json([
            'success' => true,
            'public_id' => $scan->public_id,
            'scan_id' => $scan->id,
            'share_url' => url("/scans/{$scan->public_id}"),
            'data' => $data,
            ...$data,
        ]);
    }
}
