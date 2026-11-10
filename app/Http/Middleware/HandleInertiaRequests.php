<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'is_admin' => $request->user()->isAdmin(),
                    'avatar' => $request->user()->avatar ? asset('storage/' . $request->user()->avatar) : null,
                ] : null,
            ],
            'nav_badges' => fn () => [
                'latest_community_activity_at' => rescue(function () {
                    $msgMax = \App\Models\CommunityMessage::query()->max('created_at');
                    $roomMax = \App\Models\CommunityRoom::query()->max('updated_at');
                    $max = max($msgMax, $roomMax);

                    return $max ? \Illuminate\Support\Carbon::parse($max)->toIso8601String() : null;
                }, null, false),
                'latest_simulation_activity_at' => rescue(function () {
                    $scenarioMax = \App\Models\SimulationScenario::query()->where('is_active', true)->max('updated_at');

                    return $scenarioMax ? \Illuminate\Support\Carbon::parse($scenarioMax)->toIso8601String() : null;
                }, null, false),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success') ?? ($request->session()->get('status') === 'profile-updated' ? 'Profil akun Anda berhasil diperbarui!' : null),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'message' => fn () => $request->session()->get('message'),
            ],
        ];
    }
}
