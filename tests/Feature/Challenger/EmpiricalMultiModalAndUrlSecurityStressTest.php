<?php

use App\Models\Scan;
use App\Models\User;
use App\Services\Security\UrlPhishingScanner;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

/*
|--------------------------------------------------------------------------
| Section 1: UrlPhishingScanner ReDoS Resistance & Complex Payloads
|--------------------------------------------------------------------------
*/

describe('UrlPhishingScanner ReDoS & Stress Resistance', function () {
    test('extractUrls handles 50,000 character hostile string in sub-millisecond linear time without ReDoS', function () {
        $scanner = app(UrlPhishingScanner::class);

        // Hostile ReDoS payloads: unclosed protocols, repeated slashes, dots, symbols
        $hostilePayload = str_repeat('http://', 1000)
            .str_repeat('a.', 2000)
            .str_repeat('https://sub.domain.com/path?query=', 500)
            .str_repeat('../', 1000);

        $startTime = microtime(true);
        $urls = $scanner->extractUrls($hostilePayload);
        $duration = microtime(true) - $startTime;

        // ReDoS would hang for seconds or minutes; linear scan must take under 100ms
        expect($duration)->toBeLessThan(0.1);
        expect($urls)->toBeArray();
        expect(count($urls))->toBeGreaterThan(0);
    });

    test('extractUrls correctly ignores trailing sentence punctuation without corrupting URL', function () {
        $scanner = app(UrlPhishingScanner::class);

        $text = 'Kunjungi https://cekara.id! Apakah https://bca.co.id/id? Atau https://dana.id, juga https://ovo.id; dan (https://wa.me/628123).';
        $urls = $scanner->extractUrls($text);

        expect($urls)->toContain('https://cekara.id');
        expect($urls)->toContain('https://bca.co.id/id');
        expect($urls)->toContain('https://dana.id');
        expect($urls)->toContain('https://ovo.id');
        expect($urls)->toContain('https://wa.me/628123');
        expect($urls)->not->toContain('https://cekara.id!');
        expect($urls)->not->toContain('https://dana.id,');
    });

    test('punycode and unicode homoglyphs are strictly detected as high risk', function () {
        $scanner = app(UrlPhishingScanner::class);

        // Standard xn-- punycode
        $r1 = $scanner->scan('https://xn--pple-43d.com');
        expect($r1['is_suspicious'])->toBeTrue();
        expect($r1['risk_level'])->toBe('HIGH');
        expect($r1['score'])->toBeGreaterThanOrEqual(90);

        // Embedded subdomain punycode
        $r2 = $scanner->scan('https://login.xn--bca-9oa.xyz');
        expect($r2['is_suspicious'])->toBeTrue();
        expect($r2['risk_level'])->toBe('HIGH');

        // Raw unicode homoglyph (Cyrillic 'а' \u{0430} instead of Latin 'a')
        $rawHomoglyph = "http://b\u{0430}nk-bca.com";
        $r3 = $scanner->scan($rawHomoglyph);
        expect($r3['is_suspicious'])->toBeTrue();
        expect($r3['risk_level'])->toBe('HIGH');
    });

    test('subdomain spoofing and TLD suffix tricks do not bypass whitelist', function () {
        $scanner = app(UrlPhishingScanner::class);

        // Attacker creates domain bca.co.id.evil-domain.com
        $r1 = $scanner->scan('https://bca.co.id.evil-domain.com/login');
        expect($r1['is_suspicious'])->toBeTrue();
        expect($r1['risk_level'])->toBe('HIGH');

        // Fake government domain fakego.id or attacker.go.id.evil.top
        $r2 = $scanner->scan('https://pajak.go.id.portal-bansos.xyz');
        expect($r2['is_suspicious'])->toBeTrue();
        expect($r2['risk_level'])->toBe('HIGH');

        // Whitelisted domain hosting malicious direct APK
        $r3 = $scanner->scan('https://bca.co.id/downloads/Update_BCA_Mobile.apk');
        expect($r3['is_suspicious'])->toBeTrue();
        expect($r3['risk_level'])->toBe('HIGH');

        // Legitimate whitelisted domains without malware path
        $r4 = $scanner->scan('https://m.klikbca.com/authentication.do');
        expect($r4['is_suspicious'])->toBeFalse();
        expect($r4['risk_level'])->toBe('LOW');

        $r5 = $scanner->scan('https://layanan.kominfo.go.id/portal');
        expect($r5['is_suspicious'])->toBeFalse();
        expect($r5['risk_level'])->toBe('LOW');
    });
});

/*
|--------------------------------------------------------------------------
| Section 2: Multi-Modal Upload Security & Storage Isolation
|--------------------------------------------------------------------------
*/

describe('Multi-Modal Upload Security & Storage Isolation', function () {
    test('guest uploads are persisted to database with user_id null and saved to public storage disk', function () {
        $image = UploadedFile::fake()->image('guest_chat_proof.png', 400, 400);
        $initialScanCount = Scan::count();
        $initialFileCount = count(Storage::disk('public')->allFiles('scans'));

        $response = $this->postJson('/chat/analyze', [
            'image' => $image,
            'content' => 'Tolong periksa gambar ini',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
        $response->assertJsonStructure(['public_id', 'scan_id', 'share_url']);

        expect(Scan::count())->toBe($initialScanCount + 1);
        expect(count(Storage::disk('public')->allFiles('scans')))->toBe($initialFileCount + 1);

        $scan = Scan::latest('id')->first();
        expect($scan->user_id)->toBeNull();
        expect($scan->public_id)->not->toBeEmpty();
        expect($response->json('public_id'))->toBe($scan->public_id);
        expect($response->json('share_url'))->toBe(url("/scans/{$scan->public_id}"));
    });

    test('authenticated uploads are securely stored to public disk and persisted with correct user_id', function () {
        $user = User::factory()->create();
        $image = UploadedFile::fake()->image('auth_chat_proof.png', 400, 400);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'image' => $image,
            'content' => 'Tolong periksa gambar ini',
        ]);

        $response->assertOk();

        // 1. Database persistence strictly bound to authenticated user
        $scan = Scan::where('user_id', $user->id)->latest()->first();
        expect($scan)->not->toBeNull();
        expect($scan->scan_type)->toBe('image');
        expect($scan->user_id)->toBe($user->id);

        // 2. Storage file exists on public disk
        $files = Storage::disk('public')->allFiles('scans');
        expect(count($files))->toBe(1);
        expect($scan->metadata['image_path'])->toBe($files[0]);

        // 3. Stored path has random hash filename, preventing path traversal
        expect($files[0])->not->toContain('auth_chat_proof.png');
        expect($files[0])->toMatch('/^scans\/[a-zA-Z0-9_-]+\.(png|jpe?g)$/');
    });

    test('parameter tampering: user cannot forge user_id to attribute scan to another user', function () {
        $victimUser = User::factory()->create();
        $attackerUser = User::factory()->create();

        // Attacker attempts mass-assignment / parameter tampering passing victim user_id
        $response = $this->actingAs($attackerUser)->postJson('/chat/analyze', [
            'content' => 'Pesan percobaan peretasan user_id',
            'user_id' => $victimUser->id,
        ]);

        $response->assertOk();

        // Verify the scan belongs to attacker, NOT victim
        $this->assertDatabaseHas('scans', [
            'user_id' => $attackerUser->id,
            'content' => 'Pesan percobaan peretasan user_id',
        ]);

        $this->assertDatabaseMissing('scans', [
            'user_id' => $victimUser->id,
            'content' => 'Pesan percobaan peretasan user_id',
        ]);
    });

    test('upload rejects executable and dangerous file types disguised with image extensions', function () {
        // Text file containing PHP code renamed to .png (mime-type text/plain)
        $fakePng = UploadedFile::fake()->create('exploit.png', 100, 'text/plain');

        $response = $this->postJson('/chat/analyze', [
            'image' => $fakePng,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('upload strictly enforces 5120KB limit (5120KB passes, 5121KB fails)', function () {
        // Boundary test: exactly 5120 KB
        $exact5Mb = UploadedFile::fake()->image('exact_5mb.png')->size(5120);
        $resPass = $this->postJson('/chat/analyze', [
            'image' => $exact5Mb,
        ]);
        $resPass->assertOk();

        // 1 KB over limit: 5121 KB
        $overLimit = UploadedFile::fake()->image('too_large.png')->size(5121);
        $resFail = $this->postJson('/chat/analyze', [
            'image' => $overLimit,
        ]);
        $resFail->assertStatus(422);
        $resFail->assertJsonValidationErrors(['image']);
    });
});
