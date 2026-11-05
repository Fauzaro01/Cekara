<?php

namespace App\Http\Controllers;

use App\Models\EmergencyChecklistProgress;
use App\Services\Emergency\EmergencyGuidanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmergencyActionController extends Controller
{
    public function __construct(
        protected EmergencyGuidanceService $guidanceService
    ) {}

    /**
     * Display the Emergency Response Action Center.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $scenarios = $this->guidanceService->getScenarios();
        $whatsappPresets = $this->guidanceService->getWhatsAppPresets();
        $userProgress = [];

        if ($user) {
            $records = EmergencyChecklistProgress::query()
                ->where('user_id', $user->id)
                ->where('is_completed', true)
                ->get();

            foreach ($records as $record) {
                $userProgress[$record->scenario_key][$record->step_key] = true;
            }
        }

        return Inertia::render('emergency/index', [
            'scenarios' => $scenarios,
            'whatsappPresets' => $whatsappPresets,
            'userProgress' => $userProgress,
            'isGuest' => $user === null,
        ]);
    }

    /**
     * Toggle the completion status of an emergency checklist step for an authenticated user.
     */
    public function toggleChecklist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scenario_key' => ['required', 'string', 'in:apk_malware,fraud_transfer,ktp_leak'],
            'step_key' => ['required', 'string', 'max:100'],
            'is_completed' => ['required', 'boolean'],
        ]);

        $progress = EmergencyChecklistProgress::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'scenario_key' => $validated['scenario_key'],
                'step_key' => $validated['step_key'],
            ],
            [
                'is_completed' => $validated['is_completed'],
                'completed_at' => $validated['is_completed'] ? now() : null,
            ]
        );

        return response()->json([
            'success' => true,
            'scenario_key' => $progress->scenario_key,
            'step_key' => $progress->step_key,
            'is_completed' => $progress->is_completed,
        ]);
    }

    /**
     * Reset emergency checklist progress for a specific scenario or all scenarios for the authenticated user.
     */
    public function resetChecklist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scenario_key' => ['nullable', 'string', 'in:apk_malware,fraud_transfer,ktp_leak'],
        ]);

        $query = EmergencyChecklistProgress::query()
            ->where('user_id', $request->user()->id);

        if (! empty($validated['scenario_key'])) {
            $query->where('scenario_key', $validated['scenario_key']);
        }

        $query->delete();

        return response()->json([
            'success' => true,
            'message' => 'Progres checklist darurat berhasil direset.',
        ]);
    }
}
