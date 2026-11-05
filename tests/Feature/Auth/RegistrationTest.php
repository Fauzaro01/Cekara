<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

test('registration screen can be rendered', function () {
    $url = Route::has('register') ? route('register') : '/register';

    $response = $this->get($url);

    $response->assertOk();
});

test('new users can register with valid credentials', function () {
    $url = Route::has('register') ? route('register') : '/register';
    $dashboardUrl = Route::has('dashboard') ? route('dashboard') : '/dashboard';

    $response = $this->post($url, [
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect($dashboardUrl);

    $this->assertDatabaseHas('users', [
        'email' => 'budi.santoso@example.com',
        'name' => 'Budi Santoso',
    ]);

    $user = User::where('email', 'budi.santoso@example.com')->first();
    expect($user)->not->toBeNull();
    // Newly registered users should not have administrative privileges
    if (isset($user->is_admin)) {
        expect((bool) $user->is_admin)->toBeFalse();
    }
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
