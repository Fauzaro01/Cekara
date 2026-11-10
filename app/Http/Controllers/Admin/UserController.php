<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of registered users.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $role = $request->query('role');
        $status = $request->query('status');
        $period = $request->query('period');
        $perPage = (int) $request->query('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100], true)) {
            $perPage = 5;
        }

        $query = User::query()
            ->withCount(['scans', 'simulationAttempts'])
            ->with(['scans' => fn ($q) => $q->latest()->select('id', 'user_id', 'created_at')->limit(1)]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role === 'admin') {
            $query->where('is_admin', true);
        } elseif ($role === 'user') {
            $query->where('is_admin', false);
        }

        if ($status === 'verified') {
            $query->whereNotNull('email_verified_at');
        } elseif ($status === 'unverified') {
            $query->whereNull('email_verified_at');
        }

        if ($period === 'new_7_days') {
            $query->where('created_at', '>=', now()->subDays(7));
        }

        $users = $query->latest()->paginate($perPage)->withQueryString()->through(function (User $u) {
            $latestScan = $u->scans->first();

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => $u->getAvatarUrl(),
                'is_admin' => (bool) $u->is_admin,
                'is_verified' => $u->hasVerifiedEmail(),
                'scans_count' => $u->scans_count,
                'simulations_count' => $u->simulation_attempts_count,
                'last_active' => $latestScan ? $latestScan->created_at?->diffForHumans() : 'Belum aktif',
                'created_at_human' => $u->created_at?->diffForHumans() ?? '-',
                'created_at_date' => $u->created_at?->format('d M Y') ?? '-',
            ];
        });

        $stats = [
            'total_users' => User::count(),
            'total_admins' => User::where('is_admin', true)->count(),
            'total_verified' => User::whereNotNull('email_verified_at')->count(),
            'new_this_week' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search ?? '',
                'role' => $role ?? 'all',
                'status' => $status ?? 'all',
                'period' => $period ?? 'all',
                'per_page' => $perPage,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Toggle the administrator role of a user.
     */
    public function toggleRole(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'Anda tidak dapat mengubah hak akses akun Anda sendiri.');
        }

        $user->is_admin = ! $user->is_admin;
        $user->save();

        $roleName = $user->is_admin ? 'Administrator' : 'Pengguna';

        return back()->with('success', "Hak akses akun {$user->name} berhasil diubah menjadi {$roleName}.");
    }

    /**
     * Update user details and role.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'is_admin' => ['required', 'boolean'],
        ]);

        if ($request->user()->id === $user->id && ! $validated['is_admin']) {
            return back()->with('error', 'Anda tidak dapat mencabut hak akses administrator akun Anda sendiri.');
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_admin' => (bool) $validated['is_admin'],
        ]);

        return back()->with('success', "Data pengguna {$user->name} berhasil diperbarui.");
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $userName = $user->name;
        $user->delete();

        return back()->with('success', "Pengguna {$userName} berhasil dihapus.");
    }
}

