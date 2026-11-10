<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Rules\RecaptchaRule;
use App\Services\Security\RecaptchaService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

beforeEach(function () {
    app()->setLocale('id');
});

describe('Challenger 2: Registration End-to-End Lifecycle & Verification Enforcement', function () {

    test('complete lifecycle: register, verify-email notice, MustVerifyEmail login block, signed link activation, and verified login', function () {
        Notification::fake();

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $registerUrl = route('register');
        $userData = [
            'name' => 'Raden Wijaya',
            'email' => 'raden.wijaya@example.com',
            'password' => 'Majapahit1293!',
            'password_confirmation' => 'Majapahit1293!',
            'g-recaptcha-response' => 'mock-valid-e2e-token',
        ];

        // 1. Submit Registration Form
        $registerResponse = $this->post($registerUrl, $userData);

        // 2. Assert Redirect & Session State
        $registerResponse->assertRedirect(route('verification.notice'));
        $registerResponse->assertSessionHas('status', 'verification-link-sent');
        expect(session('verification_email'))->toBe('raden.wijaya@example.com');

        // 3. Assert MUST NOT be authenticated (user remains guest until verified)
        $this->assertGuest();

        // 4. Assert User Created in DB with email_verified_at = NULL and is_admin = false
        $this->assertDatabaseHas('users', [
            'email' => 'raden.wijaya@example.com',
            'name' => 'Raden Wijaya',
        ]);

        $user = User::where('email', 'raden.wijaya@example.com')->first();
        expect($user)->not->toBeNull();
        expect($user->email_verified_at)->toBeNull();
        expect($user->hasVerifiedEmail())->toBeFalse();
        expect((bool) $user->is_admin)->toBeFalse();

        // 5. Assert Verification Notification Dispatched via Registered Listener
        Notification::assertSentTo($user, VerifyEmailNotification::class);

        // 6. MustVerifyEmail Enforcement: Direct login attempt MUST be blocked with informative message
        $blockedLoginResponse = $this->post(route('login'), [
            'email' => 'raden.wijaya@example.com',
            'password' => 'Majapahit1293!',
        ]);

        $this->assertGuest();
        $blockedLoginResponse->assertSessionHasErrors(['email']);
        $loginError = session('errors')->first('email');
        expect($loginError)->toContain('Alamat email Anda belum diverifikasi');

        // 7. Protected Route Enforcement: Guest attempting to access /profile must be redirected to /login
        $profileResponse = $this->get(route('profile.edit'));
        $profileResponse->assertRedirect(route('login'));

        // 8. Visit Signed Verification URL (GET confirmation view)
        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $showPageResponse = $this->withoutVite()->get($signedUrl);
        $showPageResponse->assertOk();
        $showPageResponse->assertInertia(fn ($page) => $page
            ->component('auth/verify-email-confirm')
            ->where('userName', 'Raden Wijaya')
            ->where('userEmail', 'raden.wijaya@example.com')
            ->where('alreadyVerified', false)
        );

        // 9. Confirm Email Verification (POST to signed route)
        $confirmResponse = $this->post($signedUrl);
        $confirmResponse->assertRedirect(route('login'));
        $confirmResponse->assertSessionHas('status', 'Email Anda berhasil diverifikasi! Silakan masuk menggunakan akun Anda.');

        // 10. Assert User is now verified in DB
        $user->refresh();
        expect($user->hasVerifiedEmail())->toBeTrue();
        expect($user->email_verified_at)->not->toBeNull();

        // 11. Login with Verified User -> MUST succeed and honor Laravel's intended redirect to /profile
        $successfulLogin = $this->post(route('login'), [
            'email' => 'raden.wijaya@example.com',
            'password' => 'Majapahit1293!',
        ]);

        $this->assertAuthenticatedAs($user);
        $successfulLogin->assertRedirect(route('profile.edit'));
    });

    test('registered event is dispatched with correct user model instance', function () {
        Event::fake([Registered::class]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $response = $this->post(route('register'), [
            'name' => 'Event Check User',
            'email' => 'event.check@example.com',
            'password' => 'EventPassword123!',
            'password_confirmation' => 'EventPassword123!',
            'g-recaptcha-response' => 'mock-valid-event-token',
        ]);

        $response->assertRedirect(route('verification.notice'));
        $createdUser = User::where('email', 'event.check@example.com')->first();
        expect($createdUser)->not->toBeNull();

        Event::assertDispatched(Registered::class, function (Registered $event) use ($createdUser) {
            return (int) $event->user->id === (int) $createdUser->id;
        });
    });
});

describe('Challenger 2: Stress Testing, Token Replay, & Concurrency', function () {

    test('reCAPTCHA single-use token replay simulation is rejected on repeated submission', function () {
        // Stateful Google mock simulating token consumption
        $consumedTokens = [];

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => function (ClientRequest $request) use (&$consumedTokens) {
                parse_str($request->body(), $bodyParams);
                $token = $bodyParams['response'] ?? null;

                if (! empty($token) && ! in_array($token, $consumedTokens, true)) {
                    $consumedTokens[] = $token;

                    return Http::response(['success' => true]);
                }

                return Http::response([
                    'success' => false,
                    'error-codes' => ['timeout-or-duplicate'],
                ]);
            },
        ]);

        $sharedToken = 'single-use-token-uuid-'.Str::random(16);

        // Attempt 1: Valid initial registration consumes the token
        $firstAttempt = $this->post(route('register'), [
            'name' => 'Original Legitimate User',
            'email' => 'legit.user@example.com',
            'password' => 'SafePass123!',
            'password_confirmation' => 'SafePass123!',
            'g-recaptcha-response' => $sharedToken,
        ]);

        $firstAttempt->assertRedirect(route('verification.notice'));
        $this->assertDatabaseHas('users', ['email' => 'legit.user@example.com']);

        // Attempt 2: Replaying the EXACT SAME consumed token (e.g. replay attack or double submit)
        $replayAttempt = $this->post(route('register'), [
            'name' => 'Replay Attacker User',
            'email' => 'replay.user@example.com',
            'password' => 'SafePass123!',
            'password_confirmation' => 'SafePass123!',
            'g-recaptcha-response' => $sharedToken,
        ]);

        $replayAttempt->assertSessionHasErrors(['g-recaptcha-response']);
        $errorMessage = session('errors')->first('g-recaptcha-response');
        expect($errorMessage)->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');

        // Verify attacker user was NOT created in DB
        $this->assertDatabaseMissing('users', ['email' => 'replay.user@example.com']);
        $this->assertGuest();
    });

    test('concurrent duplicate email registration triggers unique constraint validation', function () {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $targetEmail = 'concurrent.collision@example.com';

        // 1st request wins
        $first = $this->post(route('register'), [
            'name' => 'First Registrant',
            'email' => $targetEmail,
            'password' => 'ValidPassword123!',
            'password_confirmation' => 'ValidPassword123!',
            'g-recaptcha-response' => 'token-1',
        ]);
        $first->assertRedirect(route('verification.notice'));

        // 2nd concurrent request with same email
        $second = $this->post(route('register'), [
            'name' => 'Second Registrant',
            'email' => $targetEmail,
            'password' => 'AnotherPassword123!',
            'password_confirmation' => 'AnotherPassword123!',
            'g-recaptcha-response' => 'token-2',
        ]);

        $second->assertSessionHasErrors(['email']);
        $error = session('errors')->first('email');
        expect($error)->toBe('alamat email sudah digunakan.');

        // Assert exactly 1 record exists in users table
        expect(User::where('email', $targetEmail)->count())->toBe(1);
    });

    test('rapid batch registrations with distinct tokens succeed without race collisions', function () {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $batchCount = 5;
        $createdEmails = [];

        for ($i = 1; $i <= $batchCount; $i++) {
            $email = "batch.user.{$i}@example.com";
            $createdEmails[] = $email;

            $response = $this->post(route('register'), [
                'name' => "Batch User {$i}",
                'email' => $email,
                'password' => 'BatchPassword123!',
                'password_confirmation' => 'BatchPassword123!',
                'g-recaptcha-response' => "mock-batch-token-{$i}",
            ]);

            $response->assertRedirect(route('verification.notice'));
            $this->assertGuest();
        }

        expect(User::whereIn('email', $createdEmails)->count())->toBe($batchCount);

        // Every user must be unverified
        foreach ($createdEmails as $email) {
            $u = User::where('email', $email)->first();
            expect($u->hasVerifiedEmail())->toBeFalse();
            expect($u->email_verified_at)->toBeNull();
        }
    });

    test('token normalization supports both recaptcha_token and g-recaptcha-response with correct precedence', function () {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        // Case 1: Only recaptcha_token provided
        $response1 = $this->post(route('register'), [
            'name' => 'Alias User Only',
            'email' => 'alias.only@example.com',
            'password' => 'ValidPass123!',
            'password_confirmation' => 'ValidPass123!',
            'recaptcha_token' => 'alias-token-1',
        ]);
        $response1->assertRedirect(route('verification.notice'));
        $this->assertDatabaseHas('users', ['email' => 'alias.only@example.com']);

        // Case 2: Both provided -> controller merges g-recaptcha-response as primary
        $response2 = $this->post(route('register'), [
            'name' => 'Dual Token User',
            'email' => 'dual.token@example.com',
            'password' => 'ValidPass123!',
            'password_confirmation' => 'ValidPass123!',
            'g-recaptcha-response' => 'primary-token',
            'recaptcha_token' => 'secondary-token',
        ]);
        $response2->assertRedirect(route('verification.notice'));
        $this->assertDatabaseHas('users', ['email' => 'dual.token@example.com']);
    });

    test('privilege escalation and mass assignment tampering are neutralized', function () {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $response = $this->post(route('register'), [
            'name' => 'Tamper Attacker',
            'email' => 'tamper.attacker@example.com',
            'password' => 'SuperSecret123!',
            'password_confirmation' => 'SuperSecret123!',
            'g-recaptcha-response' => 'valid-tamper-token',
            'is_admin' => true,
            'isAdmin' => true,
            'role' => 'admin',
            'email_verified_at' => now()->toDateTimeString(),
            'remember_token' => 'attacker-token',
            'permissions' => ['all'],
        ]);

        $response->assertRedirect(route('verification.notice'));

        $user = User::where('email', 'tamper.attacker@example.com')->first();
        expect($user)->not->toBeNull();
        expect($user->is_admin)->toBeFalse();
        expect($user->isAdmin())->toBeFalse();
        expect($user->email_verified_at)->toBeNull();
        expect($user->hasVerifiedEmail())->toBeFalse();
    });
});

describe('Challenger 2: Exhaustive Validation Failure Matrix Across All Fields', function () {

    test('missing payload returns comprehensive validation errors including recaptcha', function () {
        $response = $this->post(route('register'), []);

        $response->assertSessionHasErrors(['name', 'email', 'password', 'g-recaptcha-response']);
        $errors = session('errors')->all();
        expect($errors)->toContain('Verifikasi reCAPTCHA wajib diselesaikan.');
        $this->assertGuest();
    });

    test('invalid email formats are rejected', function (string $invalidEmail) {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $response = $this->post(route('register'), [
            'name' => 'Invalid Email Tester',
            'email' => $invalidEmail,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'g-recaptcha-response' => 'mock-token',
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertGuest();
    })->with([
        'plain-string' => 'notanemail',
        'missing-username' => '@example.com',
        'missing-domain' => 'user@',
        'missing-domain-part' => 'user@.com',
        'trailing-dot' => 'user@example.',
        'spaces' => 'user name@example.com',
        'double-at' => 'user@@example.com',
    ]);

    test('uppercase email is rejected by lowercase validation rule', function () {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $response = $this->post(route('register'), [
            'name' => 'Caps Email Tester',
            'email' => 'CAPS.USER@EXAMPLE.COM',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'g-recaptcha-response' => 'mock-token',
        ]);

        $response->assertSessionHasErrors(['email']);
        expect(session('errors')->first('email'))->toBe('Kolom alamat email harus berupa huruf kecil.');
        $this->assertGuest();
    });

    test('password validation failures: short, unconfirmed, and mismatch', function (array $passwordPayload, string $expectedField) {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
        ]);

        $base = [
            'name' => 'Password Tester',
            'email' => 'pass.tester@example.com',
            'g-recaptcha-response' => 'mock-token',
        ];

        $response = $this->post(route('register'), array_merge($base, $passwordPayload));

        $response->assertSessionHasErrors([$expectedField]);
        $this->assertGuest();
    })->with([
        'too short (<8 chars)' => [
            ['password' => '1234567', 'password_confirmation' => '1234567'],
            'password',
        ],
        'confirmation mismatch' => [
            ['password' => 'Password123!', 'password_confirmation' => 'Mismatch123!'],
            'password',
        ],
        'missing confirmation' => [
            ['password' => 'Password123!'],
            'password',
        ],
    ]);

    test('reCAPTCHA validation failures: missing, empty, whitespace, and google rejections', function (array $recaptchaPayload, ?array $mockGoogleResponse, string $expectedError) {
        if ($mockGoogleResponse !== null) {
            Http::fake([
                'https://www.google.com/recaptcha/api/siteverify*' => Http::response($mockGoogleResponse['body'], $mockGoogleResponse['status'] ?? 200),
            ]);
        }

        $base = [
            'name' => 'Recaptcha Matrix Tester',
            'email' => 'recaptcha.matrix@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->post(route('register'), array_merge($base, $recaptchaPayload));

        $response->assertSessionHasErrors(['g-recaptcha-response']);
        expect(session('errors')->first('g-recaptcha-response'))->toBe($expectedError);
        $this->assertDatabaseMissing('users', ['email' => 'recaptcha.matrix@example.com']);
        $this->assertGuest();
    })->with([
        'missing token field entirely' => [
            [],
            null,
            'Verifikasi reCAPTCHA wajib diselesaikan.',
        ],
        'empty string token' => [
            ['g-recaptcha-response' => ''],
            null,
            'Verifikasi reCAPTCHA wajib diselesaikan.',
        ],
        'whitespace string token' => [
            ['g-recaptcha-response' => '   '],
            null,
            'Verifikasi reCAPTCHA wajib diselesaikan.',
        ],
        'google API returns success false' => [
            ['g-recaptcha-response' => 'bogus-token'],
            ['body' => ['success' => false, 'error-codes' => ['invalid-input-response']]],
            'Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.',
        ],
        'google API HTTP 500 error' => [
            ['g-recaptcha-response' => 'token-500'],
            ['body' => 'Internal Server Error', 'status' => 500],
            'Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.',
        ],
        'google API HTTP 404 error' => [
            ['g-recaptcha-response' => 'token-404'],
            ['body' => 'Not Found', 'status' => 404],
            'Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.',
        ],
    ]);

    test('RecaptchaService handles network timeout exception without 500 server crash', function () {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify*' => function () {
                throw new ConnectionException('Connection timed out after 5000ms');
            },
        ]);

        $response = $this->post(route('register'), [
            'name' => 'Timeout Tester',
            'email' => 'timeout.tester@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'g-recaptcha-response' => 'timeout-token',
        ]);

        $response->assertSessionHasErrors(['g-recaptcha-response']);
        expect(session('errors')->first('g-recaptcha-response'))->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');
        $this->assertDatabaseMissing('users', ['email' => 'timeout.tester@example.com']);
        $this->assertGuest();
    });

    test('RecaptchaRule validates standalone unit behavior', function () {
        $service = Mockery::mock(RecaptchaService::class);
        $service->shouldReceive('verify')->with('valid-token', Mockery::any())->andReturn(true);
        $service->shouldReceive('verify')->with('invalid-token', Mockery::any())->andReturn(false);

        $rule = new RecaptchaRule($service);

        $failed = false;
        $failCallback = function ($msg) use (&$failed) {
            $failed = true;
        };

        // Test valid
        $rule->validate('g-recaptcha-response', 'valid-token', $failCallback);
        expect($failed)->toBeFalse();

        // Test invalid
        $rule->validate('g-recaptcha-response', 'invalid-token', $failCallback);
        expect($failed)->toBeTrue();
    });
});
