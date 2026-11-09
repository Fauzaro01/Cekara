<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    /**
     * Display the email verification prompt / notice screen.
     */
    public function notice(Request $request): RedirectResponse|Response
    {
        if ($request->user()?->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        return Inertia::render('auth/verify-email', [
            'status' => session('status'),
            'email' => $request->user()?->email ?? session('verification_email'),
        ]);
    }

    /**
     * Send a new email verification notification.
     */
    public function send(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            $email = $request->input('email') ?: session('verification_email');
            if ($email) {
                $user = User::where('email', strtolower(trim((string) $email)))->first();
            }
        }

        if ($user && $user->hasVerifiedEmail()) {
            if ($request->user()) {
                return redirect()->intended(route('dashboard', absolute: false));
            }

            return redirect()->route('login')->with('status', 'Alamat email Anda sudah terverifikasi. Silakan masuk.');
        }

        if ($user) {
            $user->sendEmailVerificationNotification();
            session(['verification_email' => $user->email]);
        }

        return back()->with('status', 'verification-link-sent');
    }

    /**
     * Display the verification confirmation page opened from the signed email link,
     * where the user clicks the button to verify their email address.
     */
    public function showVerifyPage(Request $request, string $id, string $hash): Response
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            abort(403, 'Tautan verifikasi email tidak valid.');
        }

        return Inertia::render('auth/verify-email-confirm', [
            'userName' => $user->name,
            'userEmail' => $user->email,
            'alreadyVerified' => $user->hasVerifiedEmail(),
            'actionUrl' => $request->fullUrl(),
        ]);
    }

    /**
     * Mark the user's email address as verified when they press the verification button.
     */
    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            abort(403, 'Tautan verifikasi email tidak valid.');
        }

        if (! $user->hasVerifiedEmail()) {
            if ($user->markEmailAsVerified()) {
                event(new Verified($user));
            }
        }

        session()->forget('verification_email');

        if ($request->user() && (int) $request->user()->id === (int) $user->id) {
            return redirect()->intended(route('dashboard', absolute: false))
                ->with('status', 'Email Anda berhasil diverifikasi!');
        }

        return redirect()->route('login')
            ->with('status', 'Email Anda berhasil diverifikasi! Silakan masuk menggunakan akun Anda.');
    }
}
