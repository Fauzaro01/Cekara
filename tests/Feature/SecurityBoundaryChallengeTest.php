<?php

use App\Models\LlmProvider;
use App\Models\User;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function makeAdmin(): User
{
    return User::factory()->create([
        'is_admin' => true,
    ]);
}

function makeRegularUser(): User
{
    return User::factory()->create([
        'is_admin' => false,
    ]);
}

function seedTestProvider(array $attributes = []): int
{
    return DB::table('llm_providers')->insertGetId(array_merge([
        'key' => 'gemini',
        'name' => 'Google Gemini',
        'api_key' => Crypt::encryptString('sk-initial-gemini-secret-123456'),
        'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
        'model' => 'gemini-1.5-flash',
        'custom_headers' => null,
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ], $attributes));
}

// -----------------------------------------------------------------------------
// 1. UNAUTHENTICATED ACCESS
// -----------------------------------------------------------------------------

test('unauthenticated guest is redirected to login for web requests to admin endpoints', function () {
    $providerId = seedTestProvider();

    $this->get('/admin/llm-providers')->assertRedirect('/login');
    $this->post('/admin/llm-providers', ['name' => 'Test'])->assertRedirect('/login');
    $this->put("/admin/llm-providers/{$providerId}", ['model' => 'test'])->assertRedirect('/login');
    $this->post("/admin/llm-providers/{$providerId}/activate")->assertRedirect('/login');
});

test('unauthenticated guest receives 401 unauthorized for json requests to admin endpoints', function () {
    $providerId = seedTestProvider();

    $this->getJson('/admin/llm-providers')->assertUnauthorized();
    $this->postJson('/admin/llm-providers', ['name' => 'Test'])->assertUnauthorized();
    $this->putJson("/admin/llm-providers/{$providerId}", ['model' => 'test'])->assertUnauthorized();
    $this->postJson("/admin/llm-providers/{$providerId}/activate")->assertUnauthorized();
});

// -----------------------------------------------------------------------------
// 2. NON-ADMIN ACCESS CONTROL & INFORMATION LEAKAGE PREVENTION
// -----------------------------------------------------------------------------

test('non-admin user receives 403 forbidden with indonesian error message on all admin endpoints', function () {
    $user = makeRegularUser();
    $providerId = seedTestProvider();

    $endpoints = [
        ['method' => 'get', 'uri' => '/admin/llm-providers', 'data' => []],
        ['method' => 'post', 'uri' => '/admin/llm-providers', 'data' => ['name' => 'Hack', 'key' => 'hack', 'model' => 'hack']],
        ['method' => 'put', 'uri' => "/admin/llm-providers/{$providerId}", 'data' => ['model' => 'hack']],
        ['method' => 'post', 'uri' => "/admin/llm-providers/{$providerId}/activate", 'data' => []],
    ];

    foreach ($endpoints as $ep) {
        $response = $this->actingAs($user)->{$ep['method']}($ep['uri'], $ep['data']);
        $response->assertForbidden();
    }
});

test('non-admin attempting to access non-existent provider receives 403 forbidden without leaking 404', function () {
    $user = makeRegularUser();
    $nonExistentId = 999999;

    // Middleware must execute before route model resolution / findOrFail
    $this->actingAs($user)
        ->put("/admin/llm-providers/{$nonExistentId}", ['model' => 'test'])
        ->assertForbidden();

    $this->actingAs($user)
        ->post("/admin/llm-providers/{$nonExistentId}/activate")
        ->assertForbidden();
});

test('admin attempting to update non-existent provider receives 404 not found', function () {
    $admin = makeAdmin();
    $nonExistentId = 999999;

    $this->actingAs($admin)
        ->put("/admin/llm-providers/{$nonExistentId}", ['model' => 'test'])
        ->assertNotFound();

    $this->actingAs($admin)
        ->post("/admin/llm-providers/{$nonExistentId}/activate")
        ->assertNotFound();
});

// -----------------------------------------------------------------------------
// 3. KEY MASKING & SECRET LEAKAGE PREVENTION
// -----------------------------------------------------------------------------

test('raw api keys never leak in inertia props or raw html response', function () {
    $admin = makeAdmin();
    $rawSecret = 'sk-gemini-live-secret-ultra-confidential-998877665544';

    $providerId = seedTestProvider([
        'key' => 'gemini-prod',
        'name' => 'Gemini Production',
        'api_key' => Crypt::encryptString($rawSecret),
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->get('/admin/llm-providers');
    $response->assertOk();

    // Verify raw secret string never appears anywhere in the HTTP response body
    $response->assertDontSee($rawSecret, false);

    // Verify Inertia props structure
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/llm-providers')
        ->has('providers', 1)
        ->where('providers.0.has_api_key', true)
        ->where('providers.0.masked_api_key', 'sk-g••••••5544')
        ->missing('providers.0.api_key')
    );
});

test('key masking handles short and empty keys safely', function () {
    $admin = makeAdmin();

    // Provider with short key (<= 8 chars)
    seedTestProvider([
        'key' => 'short-key-provider',
        'name' => 'Short Key Provider',
        'api_key' => Crypt::encryptString('short123'),
        'is_active' => false,
    ]);

    // Provider with null key
    seedTestProvider([
        'key' => 'empty-key-provider',
        'name' => 'Empty Key Provider',
        'api_key' => null,
        'is_active' => false,
    ]);

    $response = $this->actingAs($admin)->get('/admin/llm-providers');
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/llm-providers')
        ->has('providers', 2)
        // Short key: masked completely with 8 bullets
        ->where('providers.0.has_api_key', true)
        ->where('providers.0.masked_api_key', '••••••••')
        ->missing('providers.0.api_key')
        // Empty key: masked_api_key is null, has_api_key is false
        ->where('providers.1.has_api_key', false)
        ->where('providers.1.masked_api_key', null)
        ->missing('providers.1.api_key')
    );
});

test('llm provider model toArray and toJson hides raw api_key attribute', function () {
    $rawSecret = 'sk-secret-model-serialization-test-4321';
    $provider = LlmProvider::create([
        'name' => 'Serialization Test Provider',
        'key' => 'serialization-test',
        'model' => 'gpt-4o',
        'api_key' => $rawSecret,
        'is_active' => false,
    ]);

    $array = $provider->toArray();
    $json = $provider->toJson();

    expect(array_key_exists('api_key', $array))->toBeFalse();
    expect(str_contains($json, $rawSecret))->toBeFalse();
    expect(str_contains($json, 'api_key'))->toBeFalse();
});

// -----------------------------------------------------------------------------
// 4. PARTIAL UPDATES PRESERVING ENCRYPTED KEYS
// -----------------------------------------------------------------------------

test('partial update of model without api_key preserves existing encrypted api key', function () {
    $admin = makeAdmin();
    $originalSecret = 'sk-orig-secret-preserved-999888';

    $providerId = seedTestProvider([
        'key' => 'gemini-partial',
        'name' => 'Gemini Original',
        'model' => 'gemini-1.0',
        'api_key' => Crypt::encryptString($originalSecret),
    ]);

    // Submit PUT request without api_key key in payload
    $response = $this->actingAs($admin)->put("/admin/llm-providers/{$providerId}", [
        'name' => 'Gemini Updated',
        'model' => 'gemini-1.5-pro',
        'base_url' => 'https://custom.gemini.endpoint/v1',
    ]);

    $response->assertRedirect();

    $provider = LlmProvider::findOrFail($providerId);
    expect($provider->name)->toBe('Gemini Updated');
    expect($provider->model)->toBe('gemini-1.5-pro');
    expect($provider->base_url)->toBe('https://custom.gemini.endpoint/v1');

    // Crucial check: encrypted key MUST NOT be wiped or modified
    expect($provider->api_key)->not->toBeNull();
    expect($provider->api_key)->toBe($originalSecret); // Model cast decrypts automatically
});

test('partial update with null or empty string api_key preserves existing encrypted key', function () {
    $admin = makeAdmin();
    $originalSecret = 'sk-orig-secret-keep-alive-777666';

    $providerId = seedTestProvider([
        'key' => 'openai-partial',
        'name' => 'OpenAI Original',
        'model' => 'gpt-3.5-turbo',
        'api_key' => Crypt::encryptString($originalSecret),
    ]);

    // Submitting null api_key
    $this->actingAs($admin)->put("/admin/llm-providers/{$providerId}", [
        'model' => 'gpt-4o',
        'api_key' => null,
    ])->assertRedirect();

    $provider = LlmProvider::findOrFail($providerId);
    expect($provider->model)->toBe('gpt-4o');
    expect($provider->api_key)->toBe($originalSecret);

    // Submitting empty string api_key
    $this->actingAs($admin)->put("/admin/llm-providers/{$providerId}", [
        'model' => 'gpt-4o-mini',
        'api_key' => '',
    ])->assertRedirect();

    $provider = LlmProvider::findOrFail($providerId);
    expect($provider->model)->toBe('gpt-4o-mini');
    expect($provider->api_key)->toBe($originalSecret);
});

test('update with new api_key successfully rotates key with encryption at rest', function () {
    $admin = makeAdmin();
    $initialSecret = 'sk-initial-secret-111111';
    $newSecret = 'sk-rotated-new-secret-222222';

    $providerId = seedTestProvider([
        'key' => 'rotation-provider',
        'name' => 'Rotation Provider',
        'model' => 'gpt-4o',
        'api_key' => Crypt::encryptString($initialSecret),
    ]);

    $this->actingAs($admin)->put("/admin/llm-providers/{$providerId}", [
        'model' => 'gpt-4o',
        'api_key' => $newSecret,
    ])->assertRedirect();

    $provider = LlmProvider::findOrFail($providerId);
    expect($provider->api_key)->toBe($newSecret);

    // Verify raw DB value is encrypted
    $rawRecord = DB::table('llm_providers')->where('id', $providerId)->first();
    expect($rawRecord->api_key)->not->toBe($newSecret);
    expect(Crypt::decryptString($rawRecord->api_key))->toBe($newSecret);
});

// -----------------------------------------------------------------------------
// 5. CHAT ANALYSIS ENDPOINTS: VALIDATION, JSON HANDLING, RATE LIMITING
// -----------------------------------------------------------------------------

test('chat analyze returns 422 with indonesian validation errors for missing or short content', function (string $endpoint) {
    // Missing content
    $resMissing = $this->postJson($endpoint, []);
    $resMissing->assertStatus(422);
    $resMissing->assertJsonValidationErrors(['content']);

    $missingMsg = implode(' ', $resMissing->json('errors.content'));
    $hasIndonesianWajib = str_contains(strtolower($missingMsg), 'wajib') || str_contains(strtolower($missingMsg), 'harus');
    expect($hasIndonesianWajib)->toBeTrue();

    // Short content (min:3)
    $resShort = $this->postJson($endpoint, ['content' => 'ab']);
    $resShort->assertStatus(422);
    $resShort->assertJsonValidationErrors(['content']);

    $shortMsg = implode(' ', $resShort->json('errors.content'));
    $hasIndonesianMin = str_contains(strtolower($shortMsg), 'minimal') || str_contains(strtolower($shortMsg), 'karakter');
    expect($hasIndonesianMin)->toBeTrue();
})->with(['/chat/analyze', '/api/chat/analyze']);

test('chat analyze accepts legacy message parameter by merging into content', function (string $endpoint) {
    $response = $this->postJson($endpoint, [
        'message' => 'Halo apakah ada tawaran kerja paruh waktu like video yang aman?',
    ]);

    $response->assertOk();
    $data = $response->json('data') ?? $response->json();
    expect($data)->toHaveKey('risk_level');
})->with(['/chat/analyze', '/api/chat/analyze']);

test('chat analyze rejects non-string content or non-array context with 422', function (string $endpoint) {
    $response = $this->postJson($endpoint, [
        'content' => ['nested' => 'array'],
        'context' => 'not-an-array',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['content', 'context']);
})->with(['/chat/analyze', '/api/chat/analyze']);

test('chat analyze handles malformed raw json payload safely', function (string $endpoint) {
    // Send raw malformed JSON with application/json header
    $response = $this->call(
        'POST',
        $endpoint,
        [],
        [],
        [],
        ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
        '{"content": "invalid json syntax without closing quote'
    );

    // Symfony / Laravel should return 400 Bad Request or 422, but MUST NOT crash with 500
    expect(in_array($response->getStatusCode(), [400, 422]))->toBeTrue();
})->with(['/chat/analyze', '/api/chat/analyze']);

test('empirical probe for rate limiting on chat analysis endpoints', function (string $endpoint) {
    $statuses = [];
    $count = 65; // Send 65 rapid sequential requests

    for ($i = 0; $i < $count; $i++) {
        $response = $this->postJson($endpoint, [
            'content' => "Tes keamanan pesan penipuan nomor {$i} dengan teks panjang untuk uji batas kecepatan.",
        ]);
        $statuses[] = $response->getStatusCode();

        if ($response->getStatusCode() === 429) {
            break; // Throttled!
        }
    }

    $hitRateLimit = in_array(429, $statuses);

    // Record whether rate limiting is active or unthrottled
    // If unthrottled, all 65 requests return 200 OK
    if (! $hitRateLimit) {
        expect(count($statuses))->toBe($count);
        expect(array_unique($statuses))->toBe([200]);
    }

    // We store the observation in a test attribute / static variable
    SecurityBoundaryProbeState::$endpointRateLimited[$endpoint] = $hitRateLimit;
})->with(['/chat/analyze', '/api/chat/analyze']);

class SecurityBoundaryProbeState
{
    public static array $endpointRateLimited = [];
}

// -----------------------------------------------------------------------------
// 6. CSRF PROTECTION ON WEB VS API CHAT ENDPOINTS
// -----------------------------------------------------------------------------

class EnforceCsrfVerificationMiddleware extends PreventRequestForgery
{
    protected function runningUnitTests()
    {
        return false;
    }
}

test('csrf protection is not disabled and excluded paths do not contain chat analyze endpoints', function () {
    $excluded = app(PreventRequestForgery::class)->getExcludedPaths();

    expect($excluded)->not->toContain('chat/analyze');
    expect($excluded)->not->toContain('api/chat/analyze');
    expect($excluded)->not->toContain('api/*');
});

test('chat analyze endpoints reject requests with 419 csrf mismatch when csrf token is missing', function (string $endpoint) {
    $this->withMiddleware(PreventRequestForgery::class);
    app()->instance(PreventRequestForgery::class, new EnforceCsrfVerificationMiddleware(app(), app('encrypter')));

    $response = $this->withSession(['_token' => 'session-token-xyz'])
        ->postJson($endpoint, [
            'content' => 'Pesan pengujian tanpa token CSRF yang valid',
        ]);

    $response->assertStatus(419);
})->with(['/chat/analyze', '/api/chat/analyze']);

test('chat analyze endpoints accept requests when accompanied by valid csrf header token', function (string $endpoint) {
    $this->withMiddleware(PreventRequestForgery::class);
    app()->instance(PreventRequestForgery::class, new EnforceCsrfVerificationMiddleware(app(), app('encrypter')));
    $token = Str::random(40);

    $response = $this->withSession(['_token' => $token])
        ->withHeader('X-CSRF-TOKEN', $token)
        ->postJson($endpoint, [
            'content' => 'Pesan pengujian dengan token CSRF valid untuk analisis penipuan transfer bank',
        ]);

    $response->assertOk();
    $response->assertJsonStructure(['success', 'data']);
})->with(['/chat/analyze', '/api/chat/analyze']);

test('chat analyze endpoint accepts requests with valid encrypted x-xsrf-token cookie header', function () {
    $this->withMiddleware(PreventRequestForgery::class);
    app()->instance(PreventRequestForgery::class, new EnforceCsrfVerificationMiddleware(app(), app('encrypter')));
    $token = Str::random(40);
    $prefixed = CookieValuePrefix::create('XSRF-TOKEN', app('encrypter')->getKey()).$token;
    $encryptedToken = app('encrypter')->encrypt($prefixed, false);

    $response = $this->withSession(['_token' => $token])
        ->withHeader('X-XSRF-TOKEN', $encryptedToken)
        ->postJson('/chat/analyze', [
            'content' => 'Pesan pengujian dengan token XSRF cookie terenkripsi valid dari frontend',
        ]);

    $response->assertOk();
    $response->assertJsonStructure(['success', 'data']);
});
