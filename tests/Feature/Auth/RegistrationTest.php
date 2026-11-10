<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

test('registration screen can be rendered', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->get($url);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('auth/register')
        ->where('recaptchaSiteKey', config('services.recaptcha.site_key'))
    );
});

test('new users can register with valid credentials and receive email verification notification', function () {
    Notification::fake();

    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'g-recaptcha-response' => 'mock-valid-token',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('verification.notice'));

    $this->assertDatabaseHas('users', [
        'email' => 'budi.santoso@example.com',
        'name' => 'Budi Santoso',
    ]);

    $user = User::where('email', 'budi.santoso@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasVerifiedEmail())->toBeFalse();

    // Newly registered users should not have administrative privileges
    if (isset($user->is_admin)) {
        expect((bool) $user->is_admin)->toBeFalse();
    }

    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

test('unverified user cannot login before verifying email and can login after pressing verification button', function () {
    $user = User::factory()->unverified()->create([
        'name' => 'Siti Aminah',
        'email' => 'siti.aminah@example.com',
        'password' => bcrypt('password123'),
    ]);

    // 1. Attempt to login before verifying email -> must be rejected
    $loginAttempt = $this->post('/login', [
        'email' => 'siti.aminah@example.com',
        'password' => 'password123',
    ]);

    $this->assertGuest();
    $loginAttempt->assertSessionHasErrors(['email']);
    expect(session('errors')->first('email'))->toContain('belum diverifikasi');

    // 2. Open the signed verification page sent to user's email
    $signedUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]
    );

    $verifyPageResponse = $this->withoutVite()->get($signedUrl);
    $verifyPageResponse->assertOk();

    // 3. Press the verification button on that page (POST to signed URL)
    $confirmResponse = $this->post($signedUrl);
    $confirmResponse->assertRedirect(route('login'));

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();

    // 4. Now login with the verified account -> succeeds and redirects to dashboard
    $verifiedLogin = $this->post('/login', [
        'email' => 'siti.aminah@example.com',
        'password' => 'password123',
    ]);

    $this->assertAuthenticatedAs($user);
    $verifiedLogin->assertRedirect(route('dashboard'));
});

test('user can request to resend email verification notification', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'unverified@example.com',
    ]);

    $response = $this->withSession(['verification_email' => $user->email])
        ->post(route('verification.send'));

    $response->assertSessionHas('status', 'verification-link-sent');
    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

test('email verification fails with 403 when hash or signature is invalid', function () {
    $user = User::factory()->unverified()->create([
        'email' => 'tamper@example.com',
    ]);

    $invalidHashUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        [
            'id' => $user->id,
            'hash' => sha1('wrong-email@example.com'),
        ]
    );

    $this->get($invalidHashUrl)->assertForbidden();
    $this->post($invalidHashUrl)->assertForbidden();
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('resend mail transport sends verification email via Resend HTTP API', function () {
    Http::fake([
        'https://api.resend.com/emails' => Http::response([
            'id' => 're_msg_123456',
        ], 200),
    ]);

    config([
        'mail.default' => 'resend',
        'services.resend.key' => 're_test_api_key_12345',
        'mail.from.address' => 'onboarding@resend.dev',
        'mail.from.name' => 'Cekara',
    ]);

    $user = User::factory()->unverified()->create([
        'name' => 'Fauzan Resend',
        'email' => 'muhamadfauzan4750@gmail.com',
    ]);

    $user->sendEmailVerificationNotification();

    Http::assertSent(function (Request $request) {
        return $request->url() === 'https://api.resend.com/emails'
            && $request->hasHeader('Authorization', 'Bearer re_test_api_key_12345')
            && in_array('muhamadfauzan4750@gmail.com', $request['to'] ?? [], true)
            && str_contains((string) ($request['html'] ?? ''), 'CEKARA');
    });
});

test('registration fails when email is already registered', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    User::factory()->create([
        'email' => 'budi.santoso@example.com',
    ]);

    $response = $this->post($url, [
        'name' => 'Budi Santoso Baru',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'g-recaptcha-response' => 'mock-valid-token',
    ]);

    $response->assertSessionHasErrors(['email']);
    $this->assertGuest();
});

test('registration fails when password confirmation does not match', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'password_confirmation' => 'mismatched_password',
        'g-recaptcha-response' => 'mock-valid-token',
    ]);

    $response->assertSessionHasErrors(['password']);
    $this->assertGuest();
});

test('registration fails when required fields are missing', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, []);

    $response->assertSessionHasErrors(['name', 'email', 'password', 'g-recaptcha-response']);
    $this->assertGuest();
});

test('registration fails when email format is invalid', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Budi Santoso',
        'email' => 'invalid-email-address',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'g-recaptcha-response' => 'mock-valid-token',
    ]);

    $response->assertSessionHasErrors(['email']);
    $this->assertGuest();
});

test('registration succeeds with valid recaptcha token and triggers email verification', function () {
    Notification::fake();
    Event::fake([Registered::class]);

    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Aditya Pratama',
        'email' => 'aditya.pratama@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
        'g-recaptcha-response' => 'mock-valid-recaptcha-token',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('verification.notice'));
    $response->assertSessionHas('status', 'verification-link-sent');
    expect(session('verification_email'))->toBe('aditya.pratama@example.com');

    $this->assertDatabaseHas('users', [
        'email' => 'aditya.pratama@example.com',
        'name' => 'Aditya Pratama',
    ]);

    $user = User::where('email', 'aditya.pratama@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasVerifiedEmail())->toBeFalse();

    Event::assertDispatched(Registered::class, function (Registered $event) use ($user) {
        return $event->user->id === $user->id;
    });
});

test('registration fails when recaptcha token is missing', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Bot Attacker',
        'email' => 'bot.attacker@example.com',
        'password' => 'BotPass123!',
        'password_confirmation' => 'BotPass123!',
    ]);

    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $errorMessage = session('errors')->first('g-recaptcha-response');
    expect($errorMessage)->toBe('Verifikasi reCAPTCHA wajib diselesaikan.');

    $this->assertDatabaseMissing('users', [
        'email' => 'bot.attacker@example.com',
    ]);
    $this->assertGuest();
});

test('registration fails when recaptcha token is empty string', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Empty Token User',
        'email' => 'empty.token@example.com',
        'password' => 'Pass12345!',
        'password_confirmation' => 'Pass12345!',
        'g-recaptcha-response' => '   ',
    ]);

    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', [
        'email' => 'empty.token@example.com',
    ]);
    $this->assertGuest();
});

test('registration fails when recaptcha verification returns false', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Invalid Token User',
        'email' => 'invalid.token@example.com',
        'password' => 'ValidPass123!',
        'password_confirmation' => 'ValidPass123!',
        'g-recaptcha-response' => 'invalid-token',
    ]);

    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $errorMessage = session('errors')->first('g-recaptcha-response');
    expect($errorMessage)->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');

    $this->assertDatabaseMissing('users', [
        'email' => 'invalid.token@example.com',
    ]);
    $this->assertGuest();
});

test('registration fails gracefully when recaptcha verification endpoint times out or errors', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response('Server Error', 500),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Error Graceful User',
        'email' => 'error.graceful@example.com',
        'password' => 'ValidPass123!',
        'password_confirmation' => 'ValidPass123!',
        'g-recaptcha-response' => 'some-token',
    ]);

    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $errorMessage = session('errors')->first('g-recaptcha-response');
    expect($errorMessage)->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');

    $this->assertDatabaseMissing('users', [
        'email' => 'error.graceful@example.com',
    ]);
    $this->assertGuest();
});

test('registration succeeds when token is sent via recaptcha_token field alias', function () {
    Notification::fake();

    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Alias Token User',
        'email' => 'alias.token@example.com',
        'password' => 'ValidPass123!',
        'password_confirmation' => 'ValidPass123!',
        'recaptcha_token' => 'mock-valid-alias-token',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('verification.notice'));
    $response->assertSessionHas('status', 'verification-link-sent');

    $this->assertDatabaseHas('users', [
        'email' => 'alias.token@example.com',
        'name' => 'Alias Token User',
    ]);
});
