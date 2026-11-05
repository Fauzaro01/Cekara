<?php

use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

function getChatEndpoint(): string
{
    if (Route::has('chat.analyze')) {
        return route('chat.analyze');
    }
    if (Route::has('api.chat.analyze')) {
        return route('api.chat.analyze');
    }

    foreach (Route::getRoutes()->getRoutes() as $route) {
        if (str_contains($route->uri(), 'chat/analyze')) {
            return '/'.ltrim($route->uri(), '/');
        }
    }

    return '/api/chat/analyze';
}

test('fraud analysis endpoint returns structured analysis with risk_level, red_flags, and recommendations', function () {
    $endpoint = getChatEndpoint();

    $response = $this->postJson($endpoint, [
        'content' => 'Selamat anda memenangkan hadiah 50 juta dari Bank BRI. Masukkan kode OTP 6 digit yang dikirimkan ke HP Anda sekarang.',
    ]);

    $response->assertOk();

    $result = $response->json('data') ?? $response->json();

    expect($result)->toBeArray();
    expect($result)->toHaveKey('risk_level');

    $riskLevel = strtolower($result['risk_level']);
    expect(in_array($riskLevel, ['danger', 'high', 'tinggi', 'medium', 'sedang', 'low', 'safe', 'rendah']))->toBeTrue();

    // Check red flags / indicators presence
    $redFlags = $result['red_flags'] ?? $result['indicators'] ?? null;
    expect($redFlags)->not->toBeNull();
    expect($redFlags)->toBeArray();
    expect(count($redFlags))->toBeGreaterThanOrEqual(1);

    // Check recommendations / action steps presence
    $recommendations = $result['recommendations'] ?? $result['recommendation'] ?? $result['action_steps'] ?? null;
    expect($recommendations)->not->toBeNull();
    if (is_array($recommendations)) {
        expect(count($recommendations))->toBeGreaterThanOrEqual(1);
    } else {
        expect($recommendations)->toBeString();
        expect(strlen($recommendations))->toBeGreaterThan(5);
    }

    // Check summary presence
    expect($result)->toHaveKey('summary');
    expect($result['summary'])->toBeString();
});

test('empty input to chatbot returns 422 validation error with indonesian message', function () {
    $endpoint = getChatEndpoint();

    $response = $this->postJson($endpoint, []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['content']);

    // Check Indonesian validation message
    $errors = $response->json('errors.content');
    expect($errors)->toBeArray();
    $errorMessage = strtolower(implode(' ', $errors));

    // Should contain Indonesian keywords like "wajib diisi", "kolom", "harus", or "diisi"
    $hasIndonesianCopy = str_contains($errorMessage, 'wajib')
        || str_contains($errorMessage, 'diisi')
        || str_contains($errorMessage, 'kolom')
        || str_contains($errorMessage, 'harus');

    expect($hasIndonesianCopy)->toBeTrue();
});

test('extremely short input to chatbot returns 422 validation error', function () {
    $endpoint = getChatEndpoint();

    $response = $this->postJson($endpoint, [
        'content' => 'a',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['content']);
});

test('excessively long input over 10000 characters returns 422 validation error', function () {
    $endpoint = getChatEndpoint();

    $response = $this->postJson($endpoint, [
        'content' => str_repeat('a', 10001),
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['content']);
});

test('both /chat/analyze and /api/chat/analyze routes have rate limiting middleware applied', function () {
    $chatRoute = Route::getRoutes()->getByName('chat.analyze');
    $apiRoute = Route::getRoutes()->getByName('api.chat.analyze');

    expect($chatRoute)->not->toBeNull();
    expect($apiRoute)->not->toBeNull();
    expect($chatRoute->gatherMiddleware())->toContain('throttle:60,1');
    expect($apiRoute->gatherMiddleware())->toContain('throttle:60,1');
});

test('indonesian scam scenario for apk wedding invitation triggers high risk evaluation', function () {
    $endpoint = getChatEndpoint();

    $weddingScamContent = 'Surat Undangan Pernikahan Kami.apk Kami mengundang Bapak/Ibu untuk hadir di acara kami. Mohon klik dan instal file surat undangan pernikahan digital berikut untuk membuka kartu undangan.';

    $response = $this->postJson($endpoint, [
        'content' => $weddingScamContent,
    ]);

    $response->assertOk();

    $result = $response->json('data') ?? $response->json();
    $riskLevel = strtolower($result['risk_level']);

    // Scam APK invitations must be assessed as HIGH or DANGER
    expect(in_array($riskLevel, ['danger', 'high', 'tinggi']))->toBeTrue();

    // Check for red flags highlighting APK / installation risk
    $redFlags = $result['red_flags'] ?? $result['indicators'] ?? [];
    $redFlagsText = strtolower(implode(' ', (array) $redFlags));

    $mentionsApkThreat = str_contains($redFlagsText, 'apk')
        || str_contains($redFlagsText, 'aplikasi')
        || str_contains($redFlagsText, 'instal')
        || str_contains($redFlagsText, 'izin')
        || str_contains($redFlagsText, 'malware')
        || str_contains($redFlagsText, 'unduh');

    expect($mentionsApkThreat)->toBeTrue();
});

test('indonesian scam scenario for parcel courier apk triggers high risk evaluation', function () {
    $endpoint = getChatEndpoint();

    $courierScamContent = 'Paket J&T Express Anda tertahan di gudang pusat sortir karena kendala alamat. Silakan unduh dan pasang aplikasi Lihat_Foto_Paket.apk untuk verifikasi dan konfirmasi penerimaan paket Anda segera.';

    $response = $this->postJson($endpoint, [
        'content' => $courierScamContent,
    ]);

    $response->assertOk();

    $result = $response->json('data') ?? $response->json();
    $riskLevel = strtolower($result['risk_level']);

    // Scam courier APK messages must be evaluated as HIGH or DANGER
    expect(in_array($riskLevel, ['danger', 'high', 'tinggi']))->toBeTrue();

    // Verify recommendations advise not installing and deleting file
    $recommendations = $result['recommendations'] ?? $result['recommendation'] ?? $result['action_steps'] ?? [];
    $recText = strtolower(is_array($recommendations) ? implode(' ', $recommendations) : $recommendations);

    $hasProtectiveAdvice = str_contains($recText, 'jangan')
        || str_contains($recText, 'hapus')
        || str_contains($recText, 'blokir')
        || str_contains($recText, 'pasang')
        || str_contains($recText, 'resmi');

    expect($hasProtectiveAdvice)->toBeTrue();
});

test('benign conversation message triggers low risk evaluation', function () {
    $endpoint = getChatEndpoint();

    $benignContent = 'Halo selamat siang Mas Andi, apakah jadwal rapat koordinasi tim marketing besok jam 10 pagi jadi dilaksanakan di ruang pertemuan lantai 2? Terima kasih informasinya.';

    $response = $this->postJson($endpoint, [
        'content' => $benignContent,
    ]);

    $response->assertOk();

    $result = $response->json('data') ?? $response->json();
    $riskLevel = strtolower($result['risk_level']);

    // Benign normal communications should evaluate as LOW or SAFE
    expect(in_array($riskLevel, ['safe', 'low', 'rendah', 'aman']))->toBeTrue();
});

if (! class_exists('EnforceCsrfInFraudAnalysisTestMiddleware')) {
    class EnforceCsrfInFraudAnalysisTestMiddleware extends PreventRequestForgery
    {
        protected function runningUnitTests()
        {
            return false;
        }
    }
}

test('web post without csrf token is rejected with 419 when csrf verification middleware is enforced', function () {
    $this->withMiddleware(PreventRequestForgery::class);
    app()->instance(PreventRequestForgery::class, new EnforceCsrfInFraudAnalysisTestMiddleware(app(), app('encrypter')));

    $response = $this->withSession(['_token' => 'active-session-token-xyz'])
        ->postJson('/chat/analyze', [
            'content' => 'Pesan tanpa token CSRF untuk pengujian penolakan 419',
        ]);

    $response->assertStatus(419);
});

test('web post with valid csrf token is accepted', function () {
    $this->withMiddleware(PreventRequestForgery::class);
    app()->instance(PreventRequestForgery::class, new EnforceCsrfInFraudAnalysisTestMiddleware(app(), app('encrypter')));
    $token = Str::random(40);

    $response = $this->withSession(['_token' => $token])
        ->withHeader('X-CSRF-TOKEN', $token)
        ->postJson('/chat/analyze', [
            'content' => 'Pesan dengan token CSRF valid untuk pengujian penerimaan',
        ]);

    $response->assertOk();
    $response->assertJsonStructure(['success', 'data']);
});

test('web post with valid encrypted x-xsrf-token cookie header is accepted', function () {
    $this->withMiddleware(PreventRequestForgery::class);
    app()->instance(PreventRequestForgery::class, new EnforceCsrfInFraudAnalysisTestMiddleware(app(), app('encrypter')));
    $token = Str::random(40);
    $prefixed = CookieValuePrefix::create('XSRF-TOKEN', app('encrypter')->getKey()).$token;
    $encryptedToken = app('encrypter')->encrypt($prefixed, false);

    $response = $this->withSession(['_token' => $token])
        ->withHeader('X-XSRF-TOKEN', $encryptedToken)
        ->postJson('/chat/analyze', [
            'content' => 'Pesan dengan X-XSRF-TOKEN terenkripsi valid dari frontend Cekara',
        ]);

    $response->assertOk();
    $response->assertJsonStructure(['success', 'data']);
});

test('chat analyze accepts payload exactly at 10000 characters boundary', function () {
    $response = $this->postJson('/chat/analyze', [
        'content' => str_repeat('b', 10000),
    ]);

    $response->assertOk();
});

test('chat analyze rejects payload exceeding 10000 characters with 422', function () {
    $response = $this->postJson('/chat/analyze', [
        'content' => str_repeat('c', 10001),
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['content']);
});
