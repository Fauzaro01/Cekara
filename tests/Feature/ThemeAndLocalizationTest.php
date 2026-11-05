<?php

use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

test('application default locale is configured to indonesian', function () {
    expect(config('app.locale'))->toBe('id');
    expect(app()->getLocale())->toBe('id');
});

test('indonesian translation dictionaries are loaded and contain proper copy', function () {
    app()->setLocale('id');

    // Auth translations
    $authFailed = trans('auth.failed');
    expect($authFailed)->toBeString();
    expect(
        str_contains(strtolower($authFailed), 'cocok')
        || str_contains(strtolower($authFailed), 'kredensial')
        || str_contains(strtolower($authFailed), 'data kami')
    )->toBeTrue();

    $authThrottle = trans('auth.throttle', ['seconds' => 60]);
    expect(str_contains(strtolower($authThrottle), 'terlalu banyak'))->toBeTrue();
    expect(str_contains(strtolower($authThrottle), 'detik'))->toBeTrue();

    // Validation translations
    $validationRequired = trans('validation.required', ['attribute' => 'email']);
    expect(str_contains(strtolower($validationRequired), 'wajib diisi'))->toBeTrue();
});

test('failed login attempts return localized indonesian error messages', function () {
    app()->setLocale('id');

    $user = User::factory()->create([
        'password' => bcrypt('correct-password'),
    ]);

    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->post($loginUrl, [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors(['email']);

    $errorMessage = session('errors')->first('email');
    expect($errorMessage)->toBe(trans('auth.failed'));
});

test('blade layout template includes inline anti fouc script in head', function () {
    $bladePath = resource_path('views/app.blade.php');
    expect(File::exists($bladePath))->toBeTrue();

    $content = File::get($bladePath);

    // Verify inline script exists in <head>
    expect(str_contains($content, '<script>'))->toBeTrue();

    // Verify it handles theme preference from localStorage and dark class
    expect(
        str_contains($content, "localStorage.getItem('theme')")
        || str_contains($content, 'localStorage.getItem("theme")')
    )->toBeTrue();

    expect(
        str_contains($content, "classList.add('dark')")
        || str_contains($content, 'classList.add("dark")')
        || str_contains($content, "'dark'")
    )->toBeTrue();
});

test('home page renders with indonesian html lang attribute', function () {
    $homeUrl = Route::has('home') ? route('home') : '/';

    $response = $this->get($homeUrl);

    $response->assertOk();

    // The HTML tag should contain lang="id"
    expect(str_contains($response->getContent(), 'lang="id"'))->toBeTrue();
});
