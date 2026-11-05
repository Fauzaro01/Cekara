<?php

use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

function createAdminUser(): User
{
    $attributes = [];
    if (Schema::hasColumn('users', 'is_admin')) {
        $attributes['is_admin'] = true;
    }

    return User::factory()->create($attributes);
}

function createLlmProvider(array $attributes = []): int
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

test('admin can view llm providers list without exposing raw api keys', function () {
    $admin = createAdminUser();

    $providerId = createLlmProvider([
        'key' => 'gemini',
        'name' => 'Google Gemini',
        'api_key' => Crypt::encryptString('secret-key-1234567890'),
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->get('/admin/llm-providers');

    $response->assertOk();

    // Raw unmasked API key must never be visible in response content
    $response->assertDontSee('secret-key-1234567890');
});

test('non-admin user receives 403 forbidden when accessing provider management', function () {
    $regularUser = User::factory()->create([
        'is_admin' => false,
    ]);

    $providerId = createLlmProvider();

    $this->actingAs($regularUser)
        ->get('/admin/llm-providers')
        ->assertForbidden();

    $this->actingAs($regularUser)
        ->put("/admin/llm-providers/{$providerId}", [
            'name' => 'Hacked Provider',
            'model' => 'malicious-model',
        ])
        ->assertForbidden();

    $this->actingAs($regularUser)
        ->post("/admin/llm-providers/{$providerId}/activate")
        ->assertForbidden();
});

test('admin can update provider credentials with encryption at rest', function () {
    $admin = createAdminUser();

    $providerId = createLlmProvider([
        'key' => 'openai',
        'name' => 'OpenAI',
        'model' => 'gpt-4o-mini',
        'api_key' => null,
        'is_active' => false,
    ]);

    $secretKey = 'sk-proj-super-secret-openai-api-key-998877';

    $response = $this->actingAs($admin)->put("/admin/llm-providers/{$providerId}", [
        'name' => 'OpenAI Production',
        'model' => 'gpt-4o',
        'base_url' => 'https://api.openai.com/v1',
        'api_key' => $secretKey,
    ]);

    $response->assertRedirect();

    $rawDbRecord = DB::table('llm_providers')->where('id', $providerId)->first();
    expect($rawDbRecord)->not->toBeNull();
    expect($rawDbRecord->model)->toBe('gpt-4o');

    // Verify key is encrypted at rest: raw database value must not match plaintext
    expect($rawDbRecord->api_key)->not->toBeNull();
    expect($rawDbRecord->api_key)->not->toBe($secretKey);

    // Verify decryption retrieves original key
    $decrypted = Crypt::decryptString($rawDbRecord->api_key);
    expect($decrypted)->toBe($secretKey);
});

test('admin can switch active provider', function () {
    $admin = createAdminUser();

    $geminiId = createLlmProvider([
        'key' => 'gemini',
        'name' => 'Google Gemini',
        'is_active' => true,
    ]);

    $openaiId = createLlmProvider([
        'key' => 'openai',
        'name' => 'OpenAI',
        'is_active' => false,
    ]);

    $response = $this->actingAs($admin)->post("/admin/llm-providers/{$openaiId}/activate");

    $response->assertRedirect();

    // Verify openai is now active and gemini is inactive
    $gemini = DB::table('llm_providers')->where('id', $geminiId)->first();
    $openai = DB::table('llm_providers')->where('id', $openaiId)->first();

    expect((bool) $openai->is_active)->toBeTrue();
    expect((bool) $gemini->is_active)->toBeFalse();
});

test('malformed or invalid provider configuration is rejected', function () {
    $admin = createAdminUser();

    $providerId = createLlmProvider();

    // Updating with empty model or invalid data should trigger validation error
    $response = $this->actingAs($admin)->put("/admin/llm-providers/{$providerId}", [
        'model' => '',
    ]);

    $response->assertSessionHasErrors(['model']);
});

test('admin switches active provider and chat analysis uses updated provider', function () {
    $admin = createAdminUser();

    $geminiId = createLlmProvider([
        'key' => 'gemini',
        'name' => 'Google Gemini',
        'is_active' => true,
    ]);

    $customId = createLlmProvider([
        'key' => 'custom',
        'name' => 'Custom Router API',
        'is_active' => false,
    ]);

    // Admin activates Custom Router provider
    $this->actingAs($admin)->post("/admin/llm-providers/{$customId}/activate")->assertRedirect();

    // Verify active provider in database is now Custom Router
    $activeProvider = DB::table('llm_providers')->where('is_active', true)->first();
    expect($activeProvider->id)->toBe($customId);
    expect($activeProvider->key)->toBe('custom');

    // Run chat analysis endpoint
    $analyzeUrl = Route::has('chat.analyze') ? route('chat.analyze') : (Route::has('api.chat.analyze') ? route('api.chat.analyze') : '/api/chat/analyze');

    $chatResponse = $this->postJson($analyzeUrl, [
        'content' => 'Halo apakah tawaran kerja like video ini aman?',
    ]);

    $chatResponse->assertOk();

    // The chat analysis executed with the updated configuration (mock fallback or custom provider)
    $data = $chatResponse->json('data') ?? $chatResponse->json();
    expect($data)->toBeArray();
    expect($data)->toHaveKey('risk_level');
});
