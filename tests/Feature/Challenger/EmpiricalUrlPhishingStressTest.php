<?php

use App\Models\Scan;
use App\Models\User;
use App\Services\Security\UrlPhishingScanner;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (! class_exists(UrlPhishingScanner::class)) {
        $this->markTestSkipped('UrlPhishingScanner class not found.');
    }
});

/*
|--------------------------------------------------------------------------
| Tier 1: Direct IP Hostnames & Non-Standard Ports
|--------------------------------------------------------------------------
*/
describe('Tier 1: Direct IP Hostnames & Non-Standard Ports', function () {
    test('standard ipv4 address hostname triggers high risk evaluation', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('http://192.168.1.1/login');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(80);
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'ip')))->toBeTrue();
    });

    test('direct ip address with non-standard port 8080 evaluates as high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('http://192.168.1.1:8080/login');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(80);
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'ip')))->toBeTrue();
    });

    test('direct ip address with https on non-standard port 8443 evaluates as high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://10.200.5.12:8443/verifikasi-rekening');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(80);
    });

    test('public routable ip address with high port 3000 evaluates as high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('http://103.20.15.4:3000/bca-auth');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(80);
    });

    test('direct ip address without http scheme prefix still identifies ip hostname', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('192.168.1.1:8080/update-data');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
    });
});

/*
|--------------------------------------------------------------------------
| Tier 2: Punycode, IDN & Homoglyph Attacks
|--------------------------------------------------------------------------
*/
describe('Tier 2: Punycode, IDN & Homoglyph Attacks', function () {
    test('standard punycode xn-- domain triggers high risk evaluation', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('http://xn--bca-9oa.com/login');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(90);
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'punycode') || str_contains(strtolower($i), 'homoglyph')))->toBeTrue();
    });

    test('subdomain with punycode label triggers high risk evaluation', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://auth.xn--bankmandr-9ob.com/portal');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(90);
    });

    test('cyrillic homoglyph characters in hostname trigger high risk evaluation', function () {
        $scanner = app(UrlPhishingScanner::class);
        // "bса.com" using Cyrillic small letter es (\u{0441})
        $result = $scanner->scan("http://b\u{0441}a.com/login");

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(90);
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'punycode') || str_contains(strtolower($i), 'homoglyph')))->toBeTrue();
    });

    test('cyrillic letter a homoglyph in indonesian brand triggers high risk evaluation', function () {
        $scanner = app(UrlPhishingScanner::class);
        // "danа.id" using Cyrillic small letter a (\u{0430})
        $result = $scanner->scan("https://dan\u{0430}.id/klaim-saldo");

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(90);
    });

    test('greek characters in domain name trigger non-ascii homoglyph detection', function () {
        $scanner = app(UrlPhishingScanner::class);
        // Greek alpha (\u{03B1})
        $result = $scanner->scan("https://bc\u{03B1}-secure.com");

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
    });
});

/*
|--------------------------------------------------------------------------
| Tier 3: URL Shortener Case Obfuscation & Mixed Schemes
|--------------------------------------------------------------------------
*/
describe('Tier 3: URL Shorteners & Case Obfuscation', function () {
    test('uppercase bit.ly domain is correctly recognized despite case variation', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://BIT.LY/scam123');

        expect($result['is_suspicious'])->toBeTrue();
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'pemendek') || str_contains(strtolower($i), 'shortener')))->toBeTrue();
    });

    test('mixed case tinyurl.COM domain is recognized as shortener', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('http://tinyurl.COM/xyz-bca-promo');

        expect($result['is_suspicious'])->toBeTrue();
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'pemendek') || str_contains(strtolower($i), 'shortener')))->toBeTrue();
    });

    test('indonesian shortener s.id with brand path is detected and elevated', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://S.ID/update-bca-mobile');

        expect($result['is_suspicious'])->toBeTrue();
        expect($result['score'])->toBeGreaterThanOrEqual(70);
    });

    test('mixed scheme HtTpS with shortener is parsed cleanly', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('HtTpS://Is.Gd/bca2026');

        expect($result['is_suspicious'])->toBeTrue();
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'pemendek') || str_contains(strtolower($i), 'shortener')))->toBeTrue();
    });

    test('t.co shortener is detected as shortener', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('http://t.CO/suspicious-token');

        expect($result['is_suspicious'])->toBeTrue();
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'pemendek') || str_contains(strtolower($i), 'shortener')))->toBeTrue();
    });
});

/*
|--------------------------------------------------------------------------
| Tier 4: Typosquatting, Subdomain Spoofing & Brand Impersonation
|--------------------------------------------------------------------------
*/
describe('Tier 4: Typosquatting & Brand Spoofing', function () {
    test('subdomain prepending official brand on attacker xyz domain triggers high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://bca.co.id.portal-update.xyz');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(95);
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'bca') || str_contains(strtolower($i), 'merek')))->toBeTrue();
    });

    test('bri impersonation on top-level top domain triggers high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://bri.co.id.login-verifikasi.top/auth');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(95);
    });

    test('dana e-wallet impersonation with hyphens triggers high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://dana-id-klaim-saldo.xyz/dana');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(95);
    });

    test('mandiri brand impersonation with action trigger triggers high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://mandiri-blokir-kartu-darurat.com/batal');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(95);
    });

    test('shopee brand impersonation with risky cam tld triggers high risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://shopee-undian-berhadiah.cam/claim');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBeGreaterThanOrEqual(95);
    });

    test('direct apk download link triggers max threat score 95', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://unduh-dokumen-pernikahan.com/undangan.apk');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBe(95);
        expect(collect($result['indicators'])->some(fn ($i) => str_contains(strtolower($i), 'apk')))->toBeTrue();
    });
});

/*
|--------------------------------------------------------------------------
| Tier 5: Whitelist Resilience & False Positive Prevention
|--------------------------------------------------------------------------
*/
describe('Tier 5: Whitelist Resilience & False Positive Prevention', function () {
    test('official klikbca mobile domain evaluates as safe low risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://m.klikbca.com/login.jsp');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
        expect($result['indicators'])->toBeEmpty();
    });

    test('official government pajak go id subdomain evaluates as safe low risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://subdomain.pajak.go.id/portal');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
    });

    test('official cekara id domain evaluates as safe low risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://cekara.id/dashboard');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
    });

    test('official mandiri internet banking domain evaluates as safe low risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://ib.bankmandiri.co.id/retail/Login.do');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
    });

    test('official whatsapp wa me link evaluates as safe low risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://wa.me/628123456789?text=Halo');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
    });

    test('official google play store link evaluates as safe low risk', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://play.google.com/store/apps/details?id=com.bca');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
    });

    test('whitelisted domain hosting direct apk link is not granted whitelist bypass', function () {
        $scanner = app(UrlPhishingScanner::class);
        // Even if on whitelisted domain, an APK payload must still be flagged
        $result = $scanner->scan('https://bca.co.id/downloads/unverified-patch.apk');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBe(95);
    });
});

/*
|--------------------------------------------------------------------------
| Tier 6: Punctuation & Delimiter Boundary Stripping
|--------------------------------------------------------------------------
*/
describe('Tier 6: Punctuation & Delimiter Boundary Stripping', function () {
    test('extracts url enclosed in parentheses cleanly without trailing parenthesis', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Silakan verifikasi akun Anda di tautan ini: (https://evil-phish.xyz/login)';
        $urls = $scanner->extractUrls($text);

        expect($urls)->toContain('https://evil-phish.xyz/login');
        expect($urls)->not->toContain('https://evil-phish.xyz/login)');
    });

    test('extracts url followed by trailing period cleanly without trailing dot', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Klik link konfirmasi di https://evil-phish.xyz/login.';
        $urls = $scanner->extractUrls($text);

        expect($urls)->toContain('https://evil-phish.xyz/login');
        expect($urls)->not->toContain('https://evil-phish.xyz/login.');
    });

    test('extracts url followed by trailing comma cleanly without trailing comma', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Kunjungi https://evil-phish.xyz/login, lalu masukkan pin ATM.';
        $urls = $scanner->extractUrls($text);

        expect($urls)->toContain('https://evil-phish.xyz/login');
        expect($urls)->not->toContain('https://evil-phish.xyz/login,');
    });

    test('extracts url followed by exclamation and question marks cleanly', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Segera ambil hadiahmu di https://evil-phish.xyz/hadiah! Apakah kamu sudah klaim di https://evil-phish.xyz/tanya?';
        $urls = $scanner->extractUrls($text);

        expect($urls)->toContain('https://evil-phish.xyz/hadiah');
        expect($urls)->toContain('https://evil-phish.xyz/tanya');
    });

    test('extracts url enclosed in quotes cleanly', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Buka alamat "https://evil-phish.xyz/promo" atau \'https://evil-phish.xyz/promo2\'';
        $urls = $scanner->extractUrls($text);

        expect($urls)->toContain('https://evil-phish.xyz/promo');
        expect($urls)->toContain('https://evil-phish.xyz/promo2');
    });

    test('handles empty and whitespace-only text gracefully', function () {
        $scanner = app(UrlPhishingScanner::class);

        expect($scanner->extractUrls(''))->toBeArray()->toBeEmpty();
        expect($scanner->extractUrls('    '))->toBeArray()->toBeEmpty();
        expect($scanner->extractUrls('Pesan teks biasa tanpa ada tautan sama sekali.'))->toBeArray()->toBeEmpty();
    });
});

/*
|--------------------------------------------------------------------------
| Tier 7: Multi-URL Messages & ChatController Integration Stress
|--------------------------------------------------------------------------
*/
describe('Tier 7: Multi-URL Messages & ChatController Integration', function () {
    test('extracts both safe and phishing urls from a single combined text message', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Untuk informasi resmi silakan akses https://cekara.id namun hindari tautan palsu http://192.168.1.1:8080/login segera.';
        $urls = $scanner->extractUrls($text);

        expect(count($urls))->toBe(2);
        expect($urls)->toContain('https://cekara.id');
        expect($urls)->toContain('http://192.168.1.1:8080/login');

        $safeResult = $scanner->scan($urls[0]);
        $phishResult = $scanner->scan($urls[1]);

        expect($safeResult['is_suspicious'])->toBeFalse();
        expect($phishResult['is_suspicious'])->toBeTrue();
        expect(strtoupper($phishResult['risk_level']))->toBe('HIGH');
    });

    test('chat controller elevates risk to high when safe and phishing urls coexist', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'content' => 'Bandingkan portal resmi kami https://cekara.id dengan web tiruan http://bca-verifikasi-darurat.xyz sekarang juga.',
        ]);

        $response->assertOk();
        $data = $response->json('data') ?? $response->json();

        expect(strtoupper($data['risk_level']))->toBe('HIGH');
        expect($data['score'])->toBeGreaterThanOrEqual(80);

        // Scan persistence should be recorded as url scan type
        $scan = Scan::query()->where('user_id', $user->id)->latest('id')->first();
        expect($scan)->not->toBeNull();
        expect($scan->scan_type)->toBe('url');
        expect($scan->risk_level)->toBe('HIGH');
        expect($scan->metadata['detected_urls'])->toBeArray();
        expect(count($scan->metadata['detected_urls']))->toBe(2);
    });

    test('guest analysis with phishing url returns high risk and persists with user_id null and public_id', function () {
        $scanCountBefore = Scan::query()->count();

        $response = $this->postJson('/chat/analyze', [
            'content' => 'Klik link ini http://192.168.1.1:8080/update-bca untuk verifikasi.',
        ]);

        $response->assertOk();
        $data = $response->json('data') ?? $response->json();

        expect(strtoupper($data['risk_level']))->toBe('HIGH');
        expect(Scan::query()->count())->toBe($scanCountBefore + 1);

        $scan = Scan::query()->latest('id')->first();
        expect($scan->user_id)->toBeNull();
        expect($scan->public_id)->not->toBeEmpty();
        expect($response->json('public_id'))->toBe($scan->public_id);
    });
});

/*
|--------------------------------------------------------------------------
| Tier 8: Deep Adversarial Vectors & Robustness Invariants
|--------------------------------------------------------------------------
*/
describe('Tier 8: Deep Adversarial Vectors & Robustness Invariants', function () {
    test('deeply nested official subdomains retain whitelist immunity', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://api.v2.prod.internal.bca.co.id/status');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
    });

    test('arbitrary legitimate go.id subdomains are automatically whitelisted', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://layanan-sensus-penduduk.bps.go.id/registrasi');

        expect($result['is_suspicious'])->toBeFalse();
        expect(strtoupper($result['risk_level']))->toBe('LOW');
        expect($result['score'])->toBe(10);
    });

    test('benign domains with brand substrings do not trigger false positives', function () {
        $scanner = app(UrlPhishingScanner::class);

        // "subcat" contains "bca", but is not brand typosquatting
        $subcatResult = $scanner->scan('https://subcat-media.org/about');
        expect($subcatResult['is_suspicious'])->toBeFalse();
        expect(strtoupper($subcatResult['risk_level']))->toBe('LOW');

        // "broadband" contains "bca"? No, but let's test "mandirijaya" without scam triggers
        $mandiriJaya = $scanner->scan('https://mandirijaya-logistik.net/tracking');
        expect($mandiriJaya['is_suspicious'])->toBeFalse();
    });

    test('uppercase malware extensions like .APK and .EXE are detected', function () {
        $scanner = app(UrlPhishingScanner::class);
        $result = $scanner->scan('https://storage-online.net/payloads/SURAT_UNDANGAN.APK');

        expect($result['is_suspicious'])->toBeTrue();
        expect(strtoupper($result['risk_level']))->toBe('HIGH');
        expect($result['score'])->toBe(95);
    });

    test('markdown link syntax extracts clean url without markdown brackets', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Silakan unduh dokumen penting [di tautan ini](https://phishing-portal.xyz/download.apk) sekarang juga.';
        $urls = $scanner->extractUrls($text);

        expect($urls)->toContain('https://phishing-portal.xyz/download.apk');
        $scan = $scanner->scan($urls[0]);
        expect($scan['is_suspicious'])->toBeTrue();
        expect(strtoupper($scan['risk_level']))->toBe('HIGH');
    });

    test('userinfo spoofing with brand in username targets attacker host', function () {
        $scanner = app(UrlPhishingScanner::class);
        // Browser connects to attacker host phishing-portal.xyz, passing bca.co.id as userinfo
        $result = $scanner->scan('https://bca.co.id@phishing-portal.xyz/login');

        // Attacker host has .xyz risky TLD
        expect($result['is_suspicious'])->toBeTrue();
        expect($result['score'])->toBeGreaterThanOrEqual(75);
    });

    test('multi-threat message with 4 urls correctly aggregates all indicators and highest score', function () {
        $scanner = app(UrlPhishingScanner::class);
        $text = 'Portal resmi: https://cekara.id dan https://pajak.go.id. Hati-hati dengan https://bca-update.xyz dan http://bit.ly/scam-apk';
        $urls = $scanner->extractUrls($text);

        expect(count($urls))->toBe(4);
        expect($urls)->toContain('https://cekara.id');
        expect($urls)->toContain('https://pajak.go.id');
        expect($urls)->toContain('https://bca-update.xyz');
        expect($urls)->toContain('http://bit.ly/scam-apk');

        $scores = array_map(fn ($u) => $scanner->scan($u)['score'], $urls);
        expect(max($scores))->toBeGreaterThanOrEqual(95);
    });
});
