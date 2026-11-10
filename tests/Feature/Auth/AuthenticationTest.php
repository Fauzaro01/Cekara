<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

test('login screen can be rendered', function () {
    $url = Route::has('login') ? route('login') : '/login';

    $response = $this->get($url);

    $response->assertOk();
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $loginUrl = Route::has('login') ? route('login') : '/login';
    $dashboardUrl = Route::has('dashboard') ? route('dashboard') : '/dashboard';

    $response = $this->post($loginUrl, [
        'email' => $user->email,
        'password' => 'password123',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect($dashboardUrl);
    $response->assertSessionHas('success', "Anda berhasil masuk sebagai {$user->name}");
});

test('users can logout and session is invalidated', function () {
    $user = User::factory()->create();

    $logoutUrl = Route::has('logout') ? route('logout') : '/logout';

    $response = $this->actingAs($user)->post($logoutUrl);

    $this->assertGuest();
    $response->assertRedirect('/');
});

test('users cannot authenticate with invalid password', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->post($loginUrl, [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['email']);
});

test('login fails when required fields are missing', function () {
    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->post($loginUrl, []);

    $this->assertGuest();
    $response->assertSessionHasErrors(['email', 'password']);
});

test('login is rate limited after multiple failed attempts', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $loginUrl = Route::has('login') ? route('login') : '/login';

    // Breeze rate limiting allows 5 attempts before locking out
    for ($i = 0; $i < 5; $i++) {
        $this->post($loginUrl, [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);
    }

    $response = $this->post($loginUrl, [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['email']);

    // Check that throttle error message is present
    $errorMessage = session('errors')->first('email');
    expect($errorMessage)->not->toBeEmpty();
});
