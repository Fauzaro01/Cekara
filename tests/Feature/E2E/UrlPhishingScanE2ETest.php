<?php

use App\Models\User;
use App\Services\Security\UrlPhishingScanner;

beforeEach(function () {
    if (! class_exists(UrlPhishingScanner::class)) {
        $this->markTestSkipped('Waiting for Milestone 3: UrlPhishingScanner implementation.');
    }
});

/*
|--------------------------------------------------------------------------
| Tier 1: UrlPhishingScanner Contract & URL Extraction
|--------------------------------------------------------------------------
*/

test('tier 1: scanner correctly extracts multiple urls from indonesian text', function () {
    $scanner = app(UrlPhishingScanner::class);

    $text = 'Silakan cek mutasi di https://bca-login.xyz dan konfirmasi ke https://wa.me/628123456789 sekarang juga.';
    $urls = $scanner->extractUrls($text);

    expect($urls)->toBeArray();
    expect(count($urls))->toBe(2);
    expect($urls)->toContain('https://bca-login.xyz');
    expect($urls)->toContain('https://wa.me/628123456789');
});

test('tier 1: scanner scan method produces structured heuristic analysis schema', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('http://192.168.1.100/login');

    expect($result)->toBeArray();
    expect($result)->toHaveKeys([
        'url',
        'is_suspicious',
        'risk_level',
        'score',
        'indicators',
    ]);
    expect($result['indicators'])->toBeArray();
});

/*
|--------------------------------------------------------------------------
| Tier 2: Heuristic Detection Engines
|--------------------------------------------------------------------------
*/

test('tier 2: direct ip address hostname triggers high risk evaluation', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('http://103.20.15.4/bca-login');

    expect($result['is_suspicious'])->toBeTrue();
    expect(strtolower($result['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);
    expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'ip')))->toBeTrue();
});

test('tier 2: punycode homoglyph spoofing triggers high risk evaluation', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('http://xn--bca-9oa.com/login');

    expect($result['is_suspicious'])->toBeTrue();
    expect(strtolower($result['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);
    expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'punycode') || str_contains(strtolower($i), 'homoglyph')))->toBeTrue();
});

test('tier 2: url shorteners trigger suspicious concealment indicator', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('https://bit.ly/undangan-pernikahan-resmi');

    expect($result['is_suspicious'])->toBeTrue();
    expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'pemendek') || str_contains(strtolower($i), 'shortener')))->toBeTrue();
});

test('tier 2: risky abused tlds trigger threat indicator', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('https://klaim-bansos-2026.xyz');

    expect($result['is_suspicious'])->toBeTrue();
    expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'tld') || str_contains(strtolower($i), 'domain') || str_contains(strtolower($i), 'ekstensi')))->toBeTrue();
});

test('tier 2: indonesian banking brand typosquatting triggers high risk evaluation', function () {
    $scanner = app(UrlPhishingScanner::class);

    // Impersonating BCA
    $bcaResult = $scanner->scan('https://bca-verifikasi-keamanan-akun.com/login');
    expect($bcaResult['is_suspicious'])->toBeTrue();
    expect(strtolower($bcaResult['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);

    // Impersonating BRI
    $briResult = $scanner->scan('https://bri-pencairan-dana-kur.xyz');
    expect($briResult['is_suspicious'])->toBeTrue();
    expect(strtolower($briResult['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);
});

test('tier 2: direct apk or executable download link triggers high risk evaluation', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('https://server-unduh.com/files/Undangan_Digital.apk');

    expect($result['is_suspicious'])->toBeTrue();
    expect(strtolower($result['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);
    expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'apk') || str_contains(strtolower($i), 'file')))->toBeTrue();
});

test('tier 2: official verified indonesian domains evaluate as safe and low risk', function () {
    $scanner = app(UrlPhishingScanner::class);

    $officialBca = $scanner->scan('https://www.bca.co.id/id/individu');
    expect($officialBca['is_suspicious'])->toBeFalse();
    expect(strtolower($officialBca['risk_level']))->toBeIn(['low', 'safe', 'aman', 'rendah']);

    $officialKominfo = $scanner->scan('https://www.kominfo.go.id');
    expect($officialKominfo['is_suspicious'])->toBeFalse();
    expect(strtolower($officialKominfo['risk_level']))->toBeIn(['low', 'safe', 'aman', 'rendah']);
});

/*
|--------------------------------------------------------------------------
| Tier 3: Adversarial Evasion & Obfuscation
|--------------------------------------------------------------------------
*/

test('tier 3: case insensitivity and mixed case schemes/domains do not evade detection', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('hTtPs://bCa-LoGiN-uPdAtE.XyZ/pAtH');

    expect($result['is_suspicious'])->toBeTrue();
    expect(strtolower($result['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);
});

test('tier 3: subdomain spoofing attempting to mimic legitimate domains triggers detection', function () {
    $scanner = app(UrlPhishingScanner::class);

    // Legitimate domain embedded as subdomain on attacker host
    $result = $scanner->scan('https://bca.co.id.portal-verifikasi-user.top');

    expect($result['is_suspicious'])->toBeTrue();
    expect(strtolower($result['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);
});

test('tier 3: custom port numbers on ip and hosts do not bypass heuristics', function () {
    $scanner = app(UrlPhishingScanner::class);

    $result = $scanner->scan('http://103.20.15.4:8080/admin-login');

    expect($result['is_suspicious'])->toBeTrue();
    expect(strtolower($result['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);
});

/*
|--------------------------------------------------------------------------
| Tier 4: Integrated Chat Analysis with Embedded Phishing URLs
|--------------------------------------------------------------------------
*/

test('tier 4: submitting message containing phishing link triggers url scanner and elevates chat risk', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/chat/analyze', [
        'content' => 'Pemberitahuan: Akun m-banking Anda dibekukan. Segera verifikasi data di http://bca-verifikasi-darurat.xyz sekarang.',
    ]);

    $response->assertOk();
    $data = $response->json('data') ?? $response->json();

    expect(strtolower($data['risk_level']))->toBeIn(['high', 'danger', 'tinggi']);

    // Check red flags contain phishing link warnings
    $redFlagsText = strtolower(implode(' ', (array) $data['red_flags']));
    expect(str_contains($redFlagsText, 'tautan') || str_contains($redFlagsText, 'domain') || str_contains($redFlagsText, 'link') || str_contains($redFlagsText, 'phishing') || str_contains($redFlagsText, 'bca'))->toBeTrue();

    // Check scan persistence records scan_type as url or contains url metadata
    $this->assertDatabaseHas('scans', [
        'user_id' => $user->id,
        'risk_level' => 'HIGH',
    ]);
});
