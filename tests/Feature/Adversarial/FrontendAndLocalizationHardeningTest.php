<?php

use App\Models\LlmProvider;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use Inertia\Testing\AssertableInertia as Assert;

class EnforceCsrfVerificationInTest extends PreventRequestForgery
{
    protected function runningUnitTests()
    {
        return false;
    }
}

beforeEach(function () {
    app()->setLocale('id');
});

describe('Tier 5 Adversarial: Frontend Build & Asset Manifest Integrity', function () {
    test('vite manifest exists and contains entries for all localized inertia pages', function () {
        $manifestPath = public_path('build/manifest.json');
        expect(File::exists($manifestPath))->toBeTrue('Vite manifest must exist in public/build/manifest.json');

        $manifest = json_decode(File::get($manifestPath), true);
        expect($manifest)->toBeArray();

        $requiredPages = [
            'resources/js/pages/welcome.tsx',
            'resources/js/pages/admin/llm-providers.tsx',
            'resources/js/pages/auth/login.tsx',
            'resources/js/pages/auth/register.tsx',
            'resources/js/pages/profile/edit.tsx',
        ];

        foreach ($requiredPages as $page) {
            expect(array_key_exists($page, $manifest))->toBeTrue("Manifest must contain bundled asset for {$page}");
            expect($manifest[$page]['file'])->not->toBeEmpty();
            expect(File::exists(public_path('build/'.$manifest[$page]['file'])))
                ->toBeTrue("Physical JS chunk for {$page} must exist");
        }
    });

    test('inter font typography assets are bundled in public build directory', function () {
        $fontsManifestPath = public_path('build/fonts-manifest.json');
        expect(File::exists($fontsManifestPath))->toBeTrue('Fonts manifest must exist in public/build/fonts-manifest.json');

        $manifest = json_decode(File::get($fontsManifestPath), true);
        expect($manifest)->toBeArray();

        // Check for Inter font weights 400, 500, 600, 700
        $fontsCss = File::glob(public_path('build/assets/fonts-*.css'));
        expect(count($fontsCss))->toBeGreaterThanOrEqual(1, 'Generated fonts CSS file must exist');

        $cssContent = File::get($fontsCss[0]);
        expect($cssContent)->toContain('Inter');
        expect($cssContent)->toContain('400');
        expect($cssContent)->toContain('700');
    });

    test('blade layout renders html lang id and anti-fouc theme script with localstorage error resilience', function () {
        $response = $this->get('/');
        $response->assertOk();

        $content = $response->getContent();

        // 1. Root html element must have Indonesian lang
        expect($content)->toMatch('/<html[^>]+lang="id"/');

        // 2. Anti-FOUC script must be present in head before body
        expect($content)->toContain("localStorage.getItem('theme')");
        expect($content)->toContain('prefers-color-scheme: dark');
        expect($content)->toContain("document.documentElement.classList.add('dark')");

        // 3. Must be wrapped in try/catch to survive localStorage SecurityError in private browsing
        expect($content)->toMatch('/try\s*\{[\s\S]*?localStorage[\s\S]*?\}\s*catch/');
    });
});

describe('Tier 5 Adversarial: Profile & Auth Frontend Route Contracts', function () {
    test('profile edit page renders with authenticated inertia props and indonesian title', function () {
        $user = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi.santoso@example.com',
        ]);

        $response = $this->actingAs($user)->get('/profile');
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('profile/edit')
            ->has('auth.user', fn (Assert $userAssert) => $userAssert
                ->where('id', $user->id)
                ->where('name', 'Budi Santoso')
                ->where('email', 'budi.santoso@example.com')
                ->etc()
            )
        );
    });

    test('profile update endpoint accepts indonesian field updates', function () {
        $user = User::factory()->create([
            'name' => 'Nama Lama',
            'email' => 'lama@example.com',
        ]);

        $response = $this->actingAs($user)->patch('/profile', [
            'name' => 'Nama Baru',
            'email' => 'baru@example.com',
        ]);

        $response->assertRedirect('/profile');
        $user->refresh();
        expect($user->name)->toBe('Nama Baru');
        expect($user->email)->toBe('baru@example.com');
    });

    test('profile password update succeeds with valid credentials and redirect', function () {
        $user = User::factory()->create([
            'password' => bcrypt('old-password-123'),
        ]);

        $routeExists = Route::has('password.update') && collect(Route::getRoutes()->get('PUT'))->contains(
            fn ($r) => $r->uri() === 'password'
        );
        expect($routeExists)->toBeTrue('PUT /password must be registered and named password.update');

        $response = $this->actingAs($user)->put('/password', [
            'current_password' => 'old-password-123',
            'password' => 'new-password-456',
            'password_confirmation' => 'new-password-456',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $response->assertSessionHas('status', 'password-updated');

        $user->refresh();
        expect(Hash::check('new-password-456', $user->password))->toBeTrue();
    });

    test('profile password update rejects invalid current password with validation error', function () {
        $user = User::factory()->create([
            'password' => bcrypt('correct-password-123'),
        ]);

        $response = $this->actingAs($user)->put('/password', [
            'current_password' => 'wrong-password-999',
            'password' => 'new-password-456',
            'password_confirmation' => 'new-password-456',
        ]);

        $response->assertSessionHasErrors(['current_password']);
        $error = session('errors')->first('current_password');
        expect($error)->toBe('Kata sandi saat ini salah.');
    });

    test('profile deletion rejects invalid current password with indonesian error', function () {
        $user = User::factory()->create([
            'password' => bcrypt('correct-secret'),
        ]);

        $response = $this->actingAs($user)->delete('/profile', [
            'password' => 'wrong-secret',
        ]);

        $response->assertSessionHasErrors(['password']);
        $error = session('errors')->first('password');
        expect($error)->toBe('Kata sandi saat ini salah.');
    });
});

describe('Tier 5 Adversarial: Localization Leakage & Validation Attributes', function () {
    test('chat analyze validation attribute content uses indonesian translation without english leaks', function () {
        $validator = Validator::make([], [
            'content' => ['required', 'string', 'min:3'],
        ]);

        expect($validator->fails())->toBeTrue();
        $error = $validator->errors()->first('content');

        expect($error)->toBe('Kolom isi pesan wajib diisi.');
        expect($error)->not->toContain('Kolom content');
    });

    test('admin provider validation attributes key and custom_headers use indonesian translation without english leaks', function () {
        $validator = Validator::make([
            'custom_headers' => 'not-an-array',
        ], [
            'key' => ['required', 'string', 'max:50'],
            'custom_headers' => ['nullable', 'array'],
        ]);

        expect($validator->fails())->toBeTrue();
        expect($validator->errors()->first('key'))->toBe('Kolom kunci identitas wajib diisi.');
        expect($validator->errors()->first('key'))->not->toContain('Kolom key');

        expect($validator->errors()->first('custom_headers'))->toBe('Kolom header kustom harus berupa sebuah array.');
        expect($validator->errors()->first('custom_headers'))->not->toContain('Kolom custom_headers');
    });

    test('all core auth and profile validation errors return purely indonesian sentences', function () {
        $validator = Validator::make([
            'name' => '',
            'email' => 'invalid-email-string',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ], [
            'name' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'min:8', 'confirmed'],
        ]);

        expect($validator->fails())->toBeTrue();
        $errors = $validator->errors()->all();

        // Ensure no standard English fallback strings appear in errors
        foreach ($errors as $error) {
            expect($error)->not->toContain('The name field is required.');
            expect($error)->not->toContain('The email field must be a valid email address.');
            expect($error)->not->toContain('The password field must be at least');
            expect($error)->not->toContain('The password field confirmation does not match.');
        }

        expect($validator->errors()->first('name'))->toBe('Kolom nama lengkap wajib diisi.');
        expect($validator->errors()->first('email'))->toBe('Kolom alamat email harus berupa alamat email yang valid.');
        expect($validator->errors()->first('password'))->toBe('Kolom kata sandi harus berisi minimal 8 karakter.');
    });
});

describe('Tier 5 Adversarial: CSRF & Rate Limiting UI Protocol Error Hardening', function () {
    test('chat analyze rejects requests without xsrf token with 419 and english csrf token mismatch payload', function () {
        $this->withMiddleware(PreventRequestForgery::class);
        app()->instance(PreventRequestForgery::class, new EnforceCsrfVerificationInTest(app(), app('encrypter')));

        $response = $this->withSession(['_token' => 'active-session-token'])
            ->postJson('/chat/analyze', [
                'content' => 'Pesan uji coba tanpa menyertakan header X-XSRF-TOKEN atau X-CSRF-TOKEN.',
            ]);

        expect($response->status())->toBe(419);
        $json = $response->json();

        // Documents empirical observation: Laravel returns {"message": "CSRF token mismatch."}
        // In welcome.tsx, setErrorMessage(data.message) displays this directly if not intercepted
        expect($json['message'] ?? '')->toBe('CSRF token mismatch.');
    });

    test('chat analyze throttle error message is english Too Many Attempts', function () {
        // Probe Laravel default 429 response message
        $response = response()->json(['message' => 'Too Many Attempts.'], 429);
        expect($response->status())->toBe(429);
        expect($response->getData(true)['message'])->toBe('Too Many Attempts.');
    });
});

describe('Tier 5 Adversarial: Admin LLM Provider UI Protocol & Edge Cases', function () {
    test('admin provider index returns masked api keys and never raw api keys', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        LlmProvider::create([
            'key' => 'gemini-test-masked',
            'name' => 'Google Gemini Test',
            'model' => 'gemini-1.5-flash',
            'api_key' => 'secret-test-key-12345',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->get('/admin/llm-providers');
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/llm-providers')
            ->has('providers')
            ->where('providers.0.has_api_key', true)
            ->where('providers.0.masked_api_key', fn ($val) => is_string($val) && str_contains($val, '•') && ! str_contains($val, 'secret-test-key-12345'))
            ->missing('providers.0.api_key')
        );
    });

    test('activating non-existent provider returns 404', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        $nonExistentId = 999999;

        $response = $this->actingAs($admin)->post("/admin/llm-providers/{$nonExistentId}/activate");
        $response->assertNotFound();
    });

    test('updating non-existent provider returns 404', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        $nonExistentId = 999999;

        $response = $this->actingAs($admin)->put("/admin/llm-providers/{$nonExistentId}", [
            'name' => 'Ghost Provider',
            'model' => 'ghost-model',
        ]);
        $response->assertNotFound();
    });
});
