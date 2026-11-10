<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SimulationAttempt;
use App\Models\SimulationScenario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SimulationController extends Controller
{
    /**
     * Display a listing of simulation scenarios for admin management.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $category = $request->query('category');
        $difficulty = $request->query('difficulty');
        $status = $request->query('status');
        $perPage = (int) $request->query('per_page', 10);
        if (! in_array($perPage, [5, 10, 20, 50, 100], true)) {
            $perPage = 10;
        }

        $query = SimulationScenario::query()
            ->withCount('attempts')
            ->withAvg('attempts', 'score');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('sender_name', 'like', "%{$search}%")
                    ->orWhere('context_description', 'like', "%{$search}%");
            });
        }

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($difficulty && $difficulty !== 'all') {
            $query->where('difficulty', $difficulty);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $scenarios = $query->orderBy('order', 'asc')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (SimulationScenario $s) {
                return [
                    'id' => $s->id,
                    'title' => $s->title,
                    'slug' => $s->slug,
                    'category' => $s->category,
                    'difficulty' => $s->difficulty,
                    'context_description' => $s->context_description,
                    'sender_name' => $s->sender_name,
                    'sender_avatar' => $s->sender_avatar,
                    'chat_messages' => $s->chat_messages ?? [],
                    'options' => $s->options ?? [],
                    'psychological_tricks' => $s->psychological_tricks ?? [],
                    'red_flags' => $s->red_flags ?? [],
                    'prevention_advice' => $s->prevention_advice,
                    'order' => (int) $s->order,
                    'is_active' => (bool) $s->is_active,
                    'attempts_count' => (int) $s->attempts_count,
                    'average_score' => $s->attempts_avg_score !== null ? (int) round((float) $s->attempts_avg_score) : null,
                    'created_at_human' => $s->created_at?->diffForHumans() ?? '-',
                    'created_at_date' => $s->created_at?->format('d M Y') ?? '-',
                ];
            });

        $stats = [
            'total_scenarios' => SimulationScenario::count(),
            'active_scenarios' => SimulationScenario::where('is_active', true)->count(),
            'total_attempts' => SimulationAttempt::count(),
            'average_score' => (int) round((float) SimulationAttempt::avg('score') ?: 0),
        ];

        return Inertia::render('admin/simulations/index', [
            'scenarios' => $scenarios,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? 'all',
                'difficulty' => $difficulty ?? 'all',
                'status' => $status ?? 'all',
                'per_page' => $perPage,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created simulation scenario in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateScenario($request);

        $slug = $this->resolveUniqueSlug($request->input('slug') ?: $validated['title']);

        SimulationScenario::create([
            ...$validated,
            'slug' => $slug,
            'psychological_tricks' => $validated['psychological_tricks'] ?? [],
            'red_flags' => $validated['red_flags'] ?? [],
            'order' => $validated['order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('admin.simulations.index')
            ->with('success', 'Modul skenario simulasi berhasil ditambahkan!');
    }

    /**
     * Update the specified simulation scenario in storage.
     */
    public function update(Request $request, SimulationScenario $scenario): RedirectResponse
    {
        $validated = $this->validateScenario($request, $scenario->id);

        $slug = $this->resolveUniqueSlug($request->input('slug') ?: $validated['title'], $scenario->id);

        $scenario->update([
            ...$validated,
            'slug' => $slug,
            'psychological_tricks' => $validated['psychological_tricks'] ?? [],
            'red_flags' => $validated['red_flags'] ?? [],
            'order' => $validated['order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('admin.simulations.index')
            ->with('success', 'Modul skenario simulasi berhasil diperbarui!');
    }

    /**
     * Toggle the active status of a simulation scenario.
     */
    public function toggleActive(SimulationScenario $scenario): RedirectResponse
    {
        $scenario->update([
            'is_active' => ! $scenario->is_active,
        ]);

        $statusText = $scenario->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Modul simulasi \"{$scenario->title}\" berhasil {$statusText}.");
    }

    /**
     * Remove the specified simulation scenario from storage.
     */
    public function destroy(SimulationScenario $scenario): RedirectResponse
    {
        $title = $scenario->title;
        $scenario->delete();

        return redirect()->route('admin.simulations.index')
            ->with('success', "Modul skenario \"{$title}\" berhasil dihapus.");
    }

    /**
     * Validate incoming scenario request payload.
     *
     * @return array<string, mixed>
     */
    protected function validateScenario(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:apk_malware,phishing_banking,fake_job,social_engineering,loan_scam,fake_giveaway'],
            'difficulty' => ['required', 'string', 'in:mudah,sedang,sulit'],
            'context_description' => ['required', 'string'],
            'sender_name' => ['required', 'string', 'max:255'],
            'sender_avatar' => ['nullable', 'string', 'max:50'],
            'chat_messages' => ['required', 'array', 'min:1'],
            'chat_messages.*.sender' => ['required', 'string', 'in:scammer,system,user'],
            'chat_messages.*.text' => ['required', 'string'],
            'chat_messages.*.time' => ['required', 'string'],
            'chat_messages.*.attachment' => ['nullable', 'array'],
            'chat_messages.*.attachment.type' => ['nullable', 'string'],
            'chat_messages.*.attachment.name' => ['nullable', 'string'],
            'chat_messages.*.attachment.size' => ['nullable', 'string'],
            'chat_messages.*.attachment.icon' => ['nullable', 'string'],
            'options' => ['required', 'array', 'min:2'],
            'options.*.id' => ['required', 'string', 'max:10'],
            'options.*.text' => ['required', 'string'],
            'options.*.is_safe' => ['required', 'boolean'],
            'options.*.score' => ['required', 'integer', 'min:0', 'max:100'],
            'options.*.explanation' => ['required', 'string'],
            'psychological_tricks' => ['nullable', 'array'],
            'psychological_tricks.*' => ['string'],
            'red_flags' => ['nullable', 'array'],
            'red_flags.*' => ['string'],
            'prevention_advice' => ['required', 'string'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    /**
     * Resolve a unique URL-friendly slug.
     */
    protected function resolveUniqueSlug(string $text, ?int $ignoreId = null): string
    {
        $base = Str::slug($text);
        if (empty($base)) {
            $base = 'skenario-simulasi-'.time();
        }

        $slug = $base;
        $counter = 1;

        while (
            SimulationScenario::query()
                ->where('slug', $slug)
                ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
