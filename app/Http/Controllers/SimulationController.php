<?php

namespace App\Http\Controllers;

use App\Models\ScamPatternContribution;
use App\Models\SimulationAttempt;
use App\Models\SimulationScenario;
use App\Services\GuardianStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimulationController extends Controller
{
    public function __construct(
        protected GuardianStatusService $guardianStatusService
    ) {}

    /**
     * Display a listing of interactive simulation scenarios.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $scenarios = SimulationScenario::query()
            ->active()
            ->get()
            ->map(function (SimulationScenario $scenario) use ($user) {
                $userAttempt = null;
                if ($user) {
                    $userAttempt = SimulationAttempt::query()
                        ->where('user_id', $user->id)
                        ->where('simulation_scenario_id', $scenario->id)
                        ->latest()
                        ->first();
                }

                return [
                    'id' => $scenario->id,
                    'title' => $scenario->title,
                    'slug' => $scenario->slug,
                    'category' => $scenario->category,
                    'difficulty' => $scenario->difficulty,
                    'context_description' => $scenario->context_description,
                    'sender_name' => $scenario->sender_name,
                    'sender_avatar' => $scenario->sender_avatar,
                    'order' => $scenario->order,
                    'has_attempted' => $userAttempt !== null,
                    'latest_score' => $userAttempt?->score,
                    'is_safe' => $userAttempt?->is_safe,
                ];
            });

        $status = $this->guardianStatusService->getStatusForUser($user);

        $userStats = [
            'total_scenarios' => $scenarios->count(),
            'completed_count' => $status['completed_simulations'],
            'average_score' => $status['average_score'],
            'guardian_rank' => $status['rank'],
        ];

        return Inertia::render('simulations/index', [
            'scenarios' => $scenarios,
            'userStats' => $userStats,
        ]);
    }

    /**
     * Display the specified interactive simulation scenario.
     */
    public function show(Request $request, string $slug): Response
    {
        $scenario = SimulationScenario::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $user = $request->user();
        $latestAttempt = null;

        if ($user) {
            $latestAttempt = SimulationAttempt::query()
                ->where('user_id', $user->id)
                ->where('simulation_scenario_id', $scenario->id)
                ->latest()
                ->first();
        }

        return Inertia::render('simulations/show', [
            'scenario' => [
                'id' => $scenario->id,
                'title' => $scenario->title,
                'slug' => $scenario->slug,
                'category' => $scenario->category,
                'difficulty' => $scenario->difficulty,
                'context_description' => $scenario->context_description,
                'sender_name' => $scenario->sender_name,
                'sender_avatar' => $scenario->sender_avatar,
                'chat_messages' => $scenario->chat_messages,
                'options' => $scenario->options,
                'psychological_tricks' => $scenario->psychological_tricks,
                'red_flags' => $scenario->red_flags,
                'prevention_advice' => $scenario->prevention_advice,
            ],
            'latestAttempt' => $latestAttempt ? [
                'selected_option' => $latestAttempt->selected_option,
                'is_safe' => $latestAttempt->is_safe,
                'score' => $latestAttempt->score,
                'feedback_notes' => $latestAttempt->feedback_notes,
            ] : null,
        ]);
    }

    /**
     * Submit a decision choice for a scenario and evaluate the outcome.
     */
    public function submit(Request $request, string $slug): JsonResponse
    {
        $scenario = SimulationScenario::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $validated = $request->validate([
            'selected_option' => ['required', 'string'],
            'feedback_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $selectedOptionId = strtoupper(trim($validated['selected_option']));
        $options = collect($scenario->options);
        $chosen = $options->firstWhere('id', $selectedOptionId);

        if (! $chosen) {
            return response()->json([
                'success' => false,
                'message' => 'Pilihan jawaban tidak valid untuk skenario ini.',
            ], 422);
        }

        $isSafe = (bool) ($chosen['is_safe'] ?? false);
        $score = (int) ($chosen['score'] ?? 0);

        $attempt = SimulationAttempt::create([
            'user_id' => $request->user()?->id,
            'simulation_scenario_id' => $scenario->id,
            'selected_option' => $selectedOptionId,
            'is_safe' => $isSafe,
            'score' => $score,
            'feedback_notes' => $validated['feedback_notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'evaluation' => [
                'attempt_id' => $attempt->id,
                'selected_option' => $selectedOptionId,
                'is_safe' => $isSafe,
                'score' => $score,
                'explanation' => $chosen['explanation'] ?? '',
                'psychological_tricks' => $scenario->psychological_tricks,
                'red_flags' => $scenario->red_flags,
                'prevention_advice' => $scenario->prevention_advice,
            ],
        ]);
    }

    /**
     * Contribute a new real-world scam pattern/feedback to enrich the knowledge base.
     */
    public function contribute(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'platform' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'evidence_text' => ['nullable', 'string', 'max:5000'],
        ]);

        $contribution = ScamPatternContribution::create([
            'user_id' => $request->user()?->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'platform' => $validated['platform'],
            'description' => $validated['description'],
            'evidence_text' => $validated['evidence_text'] ?? null,
            'is_verified' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih, Guardian! Pola penipuan baru berhasil dikirim dan akan dikurasi sebagai dataset peningkatan sistem deteksi.',
            'id' => $contribution->id,
        ], 201);
    }
}
