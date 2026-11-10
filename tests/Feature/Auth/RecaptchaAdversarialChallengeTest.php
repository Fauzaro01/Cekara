<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| Adversarial Stress Tests: reCAPTCHA Registration Defense
|--------------------------------------------------------------------------
|
| Tests cover hostile payloads, type manipulation, parameter injection,
| oversized inputs, method tampering, privilege escalation, and
| Google API response spoofing.
|
*/

dataset('sqli_payloads', [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT 1, 'injected@example.com', 'pass', 1 --",
    "' AND (SELECT COUNT(*) FROM users) > 0 --",
    "test-token' OR SLEEP(1)='",
    "admin' --",
    '" OR ""="',
]);

dataset('xss_payloads', [
    'script_tag' => "<script>alert('xss')</script>",
    'svg_onload' => '"><svg onload=alert(document.cookie)>',
    'javascript_uri' => 'javascript:alert(1)',
    'img_onerror' => "<img src=x onerror=alert('pwnd')>",
    'blade_expression' => '{{ 7*7 }}',
    'system_print' => '${@print(system(\'whoami\'))}',
    'iframe_tag' => '<iframe src="javascript:alert(1)"></iframe>',
]);

dataset('non_string_payloads', [
    [['nested' => 'array', 'sub' => ['deep']]],
    [[1, 2, 3]],
    [123456],
    [0],
    [true],
    [false],
]);

test('SQL injection payloads in g-recaptcha-response are rejected without executing or corrupting the database', function (string $payload) {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $existingCount = User::count();
    $targetEmail = 'sqli.test.'.md5($payload).'@example.com';

    $response = $this->post('/register', [
        'name' => 'SQLi Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => $payload,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    expect(session('errors')->first('g-recaptcha-response'))->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');

    // Ensure database was not modified or dropped
    expect(User::count())->toBe($existingCount);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with('sqli_payloads');

test('SQL injection payload in recaptcha_token alias is rejected and does not corrupt the database', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $existingCount = User::count();
    $targetEmail = 'sqli.alias@example.com';

    $response = $this->post('/register', [
        'name' => 'SQLi Alias Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'recaptcha_token' => "'; DROP TABLE users; --",
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    expect(User::count())->toBe($existingCount);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
});

test('XSS and template injection payloads in g-recaptcha-response are safely rejected without reflection', function (string $payload) {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $targetEmail = 'xss.test.'.md5($payload).'@example.com';

    $response = $this->post('/register', [
        'name' => 'XSS Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => $payload,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);

    // Assert that the hostile payload is NOT echoed back in the error message
    $errorMessage = session('errors')->first('g-recaptcha-response');
    expect($errorMessage)->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');
    expect($errorMessage)->not->toContain('<script>');
    expect($errorMessage)->not->toContain('<svg');
    expect($errorMessage)->not->toContain('javascript:');

    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with('xss_payloads');

test('null bytes and binary payloads in g-recaptcha-response fail gracefully without server error', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $targetEmail = 'nullbyte.test@example.com';

    $response = $this->post('/register', [
        'name' => 'NullByte Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => "valid_prefix\0extra_payload\x00\xFF",
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
});

test('non-string payloads in g-recaptcha-response are rejected by validation without throwing unhandled exceptions', function ($payload) {
    $targetEmail = 'type.test.'.uniqid().'@example.com';

    $response = $this->post('/register', [
        'name' => 'Type Confusion Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => $payload,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with('non_string_payloads');

test('non-string payloads in recaptcha_token alias are rejected without throwing unhandled exceptions', function ($payload) {
    $targetEmail = 'type.alias.'.uniqid().'@example.com';

    $response = $this->post('/register', [
        'name' => 'Type Confusion Alias Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'recaptcha_token' => $payload,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with('non_string_payloads');

test('huge oversized string in g-recaptcha-response (10k chars and 64k chars) is handled safely without memory failure', function (int $length) {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $hugeToken = str_repeat('A', $length);
    $targetEmail = "oversized.{$length}@example.com";

    $response = $this->post('/register', [
        'name' => 'Oversized Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => $hugeToken,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with([
    10000,
    65536,
]);

test('disallowed HTTP methods targeted at /register do not bypass validation or create users', function (string $method) {
    $targetEmail = "method.{$method}@example.com";

    $response = $this->call($method, '/register', [
        'name' => 'Method Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => 'mock-token',
    ]);

    $response->assertStatus(405);
    $this->assertGuest();
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with([
    'PUT',
    'PATCH',
    'DELETE',
]);

test('privilege escalation payload is thwarted even when recaptcha token is valid', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $targetEmail = 'privilege.escalation@example.com';

    $response = $this->post('/register', [
        'name' => 'Privilege Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => 'mock-valid-token',
        'is_admin' => true,
        'role' => 'administrator',
        'email_verified_at' => now()->toDateTimeString(),
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('verification.notice'));

    $user = User::where('email', $targetEmail)->first();
    expect($user)->not->toBeNull();
    // Must be regular user, not admin
    expect((bool) $user->is_admin)->toBeFalse();
    // Must remain unverified
    expect($user->hasVerifiedEmail())->toBeFalse();
});

test('privilege escalation payload with invalid recaptcha token is completely rejected and no user is created', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $targetEmail = 'privilege.blocked@example.com';

    $response = $this->post('/register', [
        'name' => 'Blocked Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => 'invalid-token',
        'is_admin' => 1,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
});

test('conflicting token inputs: invalid g-recaptcha-response takes precedence over valid recaptcha_token and fails', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => false]),
    ]);

    $targetEmail = 'conflicting.tokens@example.com';

    $response = $this->post('/register', [
        'name' => 'Conflicting Tokens User',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => 'invalid-primary-token',
        'recaptcha_token' => 'valid-secondary-token',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
});

test('empty string g-recaptcha-response is converted to null and allows valid recaptcha_token alias to succeed', function () {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response(['success' => true]),
    ]);

    $targetEmail = 'empty.primary.token@example.com';

    $response = $this->post('/register', [
        'name' => 'Fallback Alias User',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => '',
        'recaptcha_token' => 'valid-alias-token',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('verification.notice'));
    $this->assertDatabaseHas('users', ['email' => $targetEmail]);
});

test('both tokens empty string fails required validation', function () {
    $targetEmail = 'both.empty@example.com';

    $response = $this->post('/register', [
        'name' => 'Both Empty User',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => '',
        'recaptcha_token' => '',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
});

test('strict Google API response verification: truthy non-boolean values and malformed responses are rejected', function (array $googleResponse) {
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify*' => Http::response($googleResponse, 200),
    ]);

    $targetEmail = 'loose.eval.'.uniqid().'@example.com';

    $response = $this->post('/register', [
        'name' => 'Loose Evaluation Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => 'some-token',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    expect(session('errors')->first('g-recaptcha-response'))->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with([
    'string "true"' => [['success' => 'true']],
    'string "1"' => [['success' => '1']],
    'integer 1' => [['success' => 1]],
    'empty payload' => [[]],
    'null success' => [['success' => null]],
    'error array without success' => [['error-codes' => ['invalid-input-response']]],
]);

test('registration fails closed when recaptcha secret key is missing or blank', function (?string $blankSecret) {
    config(['services.recaptcha.secret_key' => $blankSecret]);

    $targetEmail = 'fail.closed.'.uniqid().'@example.com';

    $response = $this->post('/register', [
        'name' => 'Fail Closed Attacker',
        'email' => $targetEmail,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'g-recaptcha-response' => 'any-token',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['g-recaptcha-response']);
    expect(session('errors')->first('g-recaptcha-response'))->toBe('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');
    $this->assertDatabaseMissing('users', ['email' => $targetEmail]);
})->with([
    'null secret' => [null],
    'empty string' => [''],
]);

test('registration screen only exposes public site key and never leaks secret key in Inertia props', function () {
    $response = $this->get('/register');

    $response->assertOk();
    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];
        expect($props)->toHaveKey('recaptchaSiteKey');
        expect(json_encode($props))->not->toContain(config('services.recaptcha.secret_key'));
    });
});
