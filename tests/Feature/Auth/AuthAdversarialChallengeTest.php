<?php

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    app()->setLocale('id');
});

describe('Milestone 2 Adversarial Auth & Role Challenges', function () {

    /*
    |--------------------------------------------------------------------------
    | Challenge 1: Rate Limiting Lockout & Throttle Messages
    |--------------------------------------------------------------------------
    */
    test('consecutive failed login attempts trigger lockout with seconds in Indonesian throttle message', function () {
        $user = User::factory()->create([
            'email' => 'test.lockout@example.com',
            'password' => bcrypt('correct-password'),
        ]);

        $loginUrl = route('login');

        // Clear any previous rate limit for clean test state
        $throttleKey = 'test.lockout@example.com|127.0.0.1';
        RateLimiter::clear($throttleKey);

        // Attempt 1 through 5: should fail with credentials mismatch
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->postJson($loginUrl, [
                'email' => 'test.lockout@example.com',
                'password' => 'wrong-password-'.$i,
            ]);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['email']);
            $errorMessage = $response->json('errors.email.0');
            expect($errorMessage)->toBe('Kredensial yang diberikan tidak cocok dengan data kami.');
        }

        // Attempt 6: Lockout must be triggered with 422 and auth.throttle message containing seconds
        $lockoutResponse = $this->postJson($loginUrl, [
            'email' => 'test.lockout@example.com',
            'password' => 'wrong-password-6',
        ]);

        $lockoutResponse->assertStatus(422);
        $lockoutResponse->assertJsonValidationErrors(['email']);

        $lockoutMessage = $lockoutResponse->json('errors.email.0');
        expect($lockoutMessage)->toMatch('/Terlalu banyak upaya masuk\. Silakan coba lagi dalam \d+ detik\./');

        // Also test web request format (session error)
        $webLockoutResponse = $this->post($loginUrl, [
            'email' => 'test.lockout@example.com',
            'password' => 'wrong-password-7',
        ]);

        $webLockoutResponse->assertSessionHasErrors(['email']);
        $webErrorMessage = session('errors')->first('email');
        expect($webErrorMessage)->toMatch('/Terlalu banyak upaya masuk\. Silakan coba lagi dalam \d+ detik\./');
    });

    test('throttle key isolates rate limiting by email and ip address', function () {
        $victim = User::factory()->create(['email' => 'victim@example.com', 'password' => bcrypt('secret123')]);
        $innocent = User::factory()->create(['email' => 'innocent@example.com', 'password' => bcrypt('secret123')]);

        RateLimiter::clear('victim@example.com|127.0.0.1');
        RateLimiter::clear('innocent@example.com|127.0.0.1');

        $loginUrl = route('login');

        // Exhaust attempts for victim
        for ($i = 0; $i < 5; $i++) {
            $this->postJson($loginUrl, [
                'email' => 'victim@example.com',
                'password' => 'badpass',
            ]);
        }

        // Victim is locked out
        $this->postJson($loginUrl, [
            'email' => 'victim@example.com',
            'password' => 'badpass',
        ])->assertJsonValidationErrorFor('email');

        // Innocent user can still log in successfully
        $response = $this->post($loginUrl, [
            'email' => 'innocent@example.com',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($innocent);
    });

    /*
    |--------------------------------------------------------------------------
    | Challenge 2: Route Protection & Admin Authorization
    |--------------------------------------------------------------------------
    */
    test('guest access to profile is redirected to login', function () {
        $response = $this->get('/profile');
        $response->assertRedirect(route('login'));
    });

    test('guest access to admin routes is redirected to login', function () {
        $response = $this->get('/admin/llm-providers');
        $response->assertRedirect(route('login'));
    });

    test('regular non-admin authenticated user receives 403 with Indonesian denial message', function () {
        $regularUser = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($regularUser)->get('/admin/llm-providers');

        $response->assertStatus(403);
        expect($response->getContent())->toContain('Akses ditolak. Halaman ini hanya untuk administrator.');
    });

    test('authenticated admin user passes admin middleware on admin routes', function () {
        $adminUser = User::factory()->admin()->create();

        expect($adminUser->isAdmin())->toBeTrue();
        expect($adminUser->is_admin)->toBeTrue();

        // 1. Admin passes middleware on POST mutation route without 403 or redirect to login
        $postResponse = $this->actingAs($adminUser)->post('/admin/llm-providers', [
            'name' => 'Gemini Provider',
        ]);
        $postResponse->assertStatus(302); // Redirect back from closure
        expect($postResponse->headers->get('Location'))->not->toBe(route('login'));

        // 2. Admin passes middleware on GET request (withoutVite avoids manifest check for unbuilt M3 pages)
        $getResponse = $this->actingAs($adminUser)->withoutVite()->get('/admin/llm-providers');
        $getResponse->assertOk();
    });

    test('full page get to admin llm providers resolves correctly via vite manifest', function () {
        $adminUser = User::factory()->admin()->create();

        // When accessed as full HTML page (without X-Inertia header), app.blade.php loads compiled page from Vite manifest
        $response = $this->actingAs($adminUser)->get('/admin/llm-providers');
        $response->assertOk();
    });

    test('privilege escalation attack via registration payload is thwarted', function () {
        $url = route('register');

        $this->post($url, [
            'name' => 'Attacker',
            'email' => 'attacker@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'is_admin' => true,
            'isAdmin' => true,
            'role' => 'admin',
        ]);

        $createdUser = User::where('email', 'attacker@example.com')->first();
        expect($createdUser)->not->toBeNull();
        expect($createdUser->is_admin)->toBeFalse();
        expect($createdUser->isAdmin())->toBeFalse();
    });

    test('privilege escalation attack via profile update payload is thwarted', function () {
        $user = User::factory()->create([
            'is_admin' => false,
        ]);

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => $user->email,
            'is_admin' => true,
            'isAdmin' => 1,
        ]);

        $response->assertSessionHasNoErrors();

        $user->refresh();
        expect($user->is_admin)->toBeFalse();
        expect($user->isAdmin())->toBeFalse();
    });

    /*
    |--------------------------------------------------------------------------
    | Challenge 3: Registration & Password Validation Indonesian Messages
    |--------------------------------------------------------------------------
    */
    test('duplicate email registration is rejected with Indonesian validation message', function () {
        User::factory()->create([
            'email' => 'existing.user@example.com',
        ]);

        $response = $this->post(route('register'), [
            'name' => 'New User',
            'email' => 'existing.user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors(['email']);
        $errorMessage = session('errors')->first('email');
        expect($errorMessage)->toBe('alamat email sudah digunakan.');
    });

    test('password confirmation mismatch is rejected with validation.confirmed message', function () {
        $response = $this->post(route('register'), [
            'name' => 'Mismatch Test',
            'email' => 'mismatch@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ]);

        $response->assertSessionHasErrors(['password']);
        $errorMessage = session('errors')->first('password');
        expect($errorMessage)->toBe('Konfirmasi kata sandi tidak cocok.');
    });

    test('password below minimum length is rejected with Indonesian validation message', function () {
        $response = $this->post(route('register'), [
            'name' => 'Short Pass',
            'email' => 'shortpass@example.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        $response->assertSessionHasErrors(['password']);
        $errorMessage = session('errors')->first('password');
        expect($errorMessage)->toBe('Kolom kata sandi harus berisi minimal 8 karakter.');
    });

    test('uppercase registration email is rejected with Indonesian validation message', function () {
        $response = $this->post(route('register'), [
            'name' => 'Uppercase Email User',
            'email' => 'UPPERCASE@EXAMPLE.COM',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors(['email']);
        $errorMessage = session('errors')->first('email');

        expect($errorMessage)->toBe('Kolom alamat email harus berupa huruf kecil.');
    });

    /*
    |--------------------------------------------------------------------------
    | Challenge 4: User Model and Cast Integrity
    |--------------------------------------------------------------------------
    */
    test('user model enforces boolean casting and isAdmin helper accurately', function () {
        $defaultUser = User::factory()->create();
        expect($defaultUser->is_admin)->toBeFalse();
        expect($defaultUser->isAdmin())->toBeFalse();
        expect($defaultUser->refresh()->is_admin)->toBeFalse();
        expect($defaultUser->is_admin)->toBeBool();

        $freshModel = new User;
        expect($freshModel->is_admin)->toBeFalse();
        expect($freshModel->isAdmin())->toBeFalse();

        $adminUser = User::factory()->admin()->create();
        expect($adminUser->isAdmin())->toBeTrue();
        expect($adminUser->is_admin)->toBeTrue();
        expect($adminUser->is_admin)->toBeBool();
    });
});
