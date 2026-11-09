<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

test('registration screen can be rendered', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->get($url);

    $response->assertOk();
});

test('new users can register with valid credentials and receive email verification notification', function () {
    Notification::fake();

    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
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

test('registration fails when email is already registered', function () {
    $url = Route::has('register') ? route('register') : '/register';

    User::factory()->create([
        'email' => 'budi.santoso@example.com',
    ]);

    $response = $this->post($url, [
        'name' => 'Budi Santoso Baru',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertSessionHasErrors(['email']);
    $this->assertGuest();
});

test('registration fails when password confirmation does not match', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'password_confirmation' => 'mismatched_password',
    ]);

    $response->assertSessionHasErrors(['password']);
    $this->assertGuest();
});

test('registration fails when required fields are missing', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, []);

    $response->assertSessionHasErrors(['name', 'email', 'password']);
    $this->assertGuest();
});

test('registration fails when email format is invalid', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->post($url, [
        'name' => 'Budi Santoso',
        'email' => 'invalid-email-address',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertSessionHasErrors(['email']);
    $this->assertGuest();
});
