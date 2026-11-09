<?php

use App\Models\Scan;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

const UUID_V4_REGEX = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
const UUID_ANY_REGEX = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

/*
|--------------------------------------------------------------------------
| Milestone 1 Challenge: Scan Model UUID Auto-Generation
|--------------------------------------------------------------------------
*/

describe('Scan Model UUID Generation', function () {
    test('creating a scan without public_id automatically populates a valid 36-char UUID', function () {
        $scan = Scan::create([
            'scan_type' => 'text',
            'content' => 'Pesan pengujian otomatis tanpa public_id',
            'risk_level' => 'LOW',
            'score' => 15,
            'summary' => 'Ringkasan pengujian',
        ]);

        expect($scan->public_id)->not->toBeNull();
        expect(strlen($scan->public_id))->toBe(36);
        expect(preg_match(UUID_ANY_REGEX, $scan->public_id))->toBe(1);
    });

    test('creating a scan with explicit public_id preserves the given UUID', function () {
        $customUuid = (string) Str::uuid();

        $scan = Scan::create([
            'public_id' => $customUuid,
            'scan_type' => 'text',
            'content' => 'Pesan pengujian dengan explicit public_id',
            'risk_level' => 'MEDIUM',
            'score' => 50,
            'summary' => 'Explicit UUID summary',
        ]);

        expect($scan->public_id)->toBe($customUuid);
    });

    test('creating a scan with empty string public_id triggers auto-generation of UUID', function () {
        $scan = Scan::create([
            'public_id' => '',
            'scan_type' => 'text',
            'content' => 'Pesan pengujian dengan empty string public_id',
            'risk_level' => 'LOW',
            'score' => 20,
            'summary' => 'Empty string public_id summary',
        ]);

        expect($scan->public_id)->not->toBe('');
        expect($scan->public_id)->not->toBeNull();
        expect(strlen($scan->public_id))->toBe(36);
        expect(preg_match(UUID_ANY_REGEX, $scan->public_id))->toBe(1);
    });

    test('duplicate public_id throws unique constraint database exception', function () {
        $duplicateUuid = (string) Str::uuid();

        Scan::create([
            'public_id' => $duplicateUuid,
            'scan_type' => 'text',
            'content' => 'First scan with duplicate UUID',
            'risk_level' => 'LOW',
            'score' => 10,
            'summary' => 'First',
        ]);

        expect(fn () => Scan::create([
            'public_id' => $duplicateUuid,
            'scan_type' => 'text',
            'content' => 'Second scan with duplicate UUID',
            'risk_level' => 'HIGH',
            'score' => 90,
            'summary' => 'Second',
        ]))->toThrow(QueryException::class);
    });

    test('multiple scans receive unique non-colliding UUIDs', function () {
        $uuids = [];
        for ($i = 0; $i < 10; $i++) {
            $scan = Scan::create([
                'scan_type' => 'text',
                'content' => "Uniqueness test scan {$i}",
                'risk_level' => 'LOW',
                'score' => 10,
                'summary' => "Summary {$i}",
            ]);
            $uuids[] = $scan->public_id;
        }

        expect(count(array_unique($uuids)))->toBe(10);
    });
});

/*
|--------------------------------------------------------------------------
| Milestone 1 Challenge: POST /chat/analyze Guest & Response Contract
|--------------------------------------------------------------------------
*/

describe('POST /chat/analyze Guest Scans & Response Contract', function () {
    test('guest request returns public_id, scan_id, and share_url in JSON response', function () {
        $response = $this->postJson('/chat/analyze', [
            'content' => 'Selamat Anda memenangkan undian 100 juta rupiah transfer sekarang!',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'public_id',
            'scan_id',
            'share_url',
            'data' => [
                'risk_level',
                'score',
                'summary',
                'public_id',
                'scan_id',
                'share_url',
            ],
        ]);

        $publicId = $response->json('public_id');
        $scanId = $response->json('scan_id');
        $shareUrl = $response->json('share_url');

        expect(strlen($publicId))->toBe(36);
        expect(preg_match(UUID_ANY_REGEX, $publicId))->toBe(1);
        expect($scanId)->toBeGreaterThan(0);
        expect($shareUrl)->toBe(url("/scans/{$publicId}"));

        // Verify top-level and nested data parity
        expect($response->json('data.public_id'))->toBe($publicId);
        expect($response->json('data.scan_id'))->toBe($scanId);
        expect($response->json('data.share_url'))->toBe($shareUrl);
    });

    test('guest request persists scan in database with user_id = null and matching public_id', function () {
        $testContent = 'Halo saya dari bank minta nomor OTP dan PIN Anda segera!';

        $response = $this->postJson('/chat/analyze', [
            'content' => $testContent,
        ]);

        $response->assertOk();
        $publicId = $response->json('public_id');
        $scanId = $response->json('scan_id');

        $this->assertDatabaseHas('scans', [
            'id' => $scanId,
            'public_id' => $publicId,
            'user_id' => null,
            'scan_type' => 'text',
        ]);

        $scan = Scan::find($scanId);
        expect($scan)->not->toBeNull();
        expect($scan->user_id)->toBeNull();
        expect($scan->public_id)->toBe($publicId);
        expect($scan->content)->toBe($testContent);
    });

    test('authenticated user request persists scan with user_id = auth->id()', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/chat/analyze', [
            'content' => 'Pesan dari akun login untuk tes audit fraud',
        ]);

        $response->assertOk();
        $scanId = $response->json('scan_id');
        $publicId = $response->json('public_id');

        $this->assertDatabaseHas('scans', [
            'id' => $scanId,
            'public_id' => $publicId,
            'user_id' => $user->id,
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| Milestone 1 Challenge: WebP Image Upload & Storage Verification
|--------------------------------------------------------------------------
*/

describe('POST /chat/analyze WebP Image Upload & Storage', function () {
    test('uploading a valid WebP image persists file on public disk under scans/ and stores scan', function () {
        $webpFile = UploadedFile::fake()->image('emergency_tab_capture.webp', 640, 480);

        $response = $this->postJson('/chat/analyze', [
            'image' => $webpFile,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $publicId = $response->json('public_id');
        $scanId = $response->json('scan_id');

        $scan = Scan::findOrFail($scanId);
        expect($scan->public_id)->toBe($publicId);
        expect($scan->scan_type)->toBe('image');
        expect($scan->user_id)->toBeNull();

        $storedPath = $scan->metadata['image_path'] ?? null;
        expect($storedPath)->not->toBeNull();
        expect($storedPath)->toStartWith('scans/');
        expect($storedPath)->toEndWith('.webp');

        Storage::disk('public')->assertExists($storedPath);
    });

    test('uploading WebP image with accompanying text content records both', function () {
        $webpFile = UploadedFile::fake()->image('evidence.webp', 400, 300);
        $accompanyingText = 'Mohon periksa screenshot web phising ini';

        $response = $this->postJson('/chat/analyze', [
            'content' => $accompanyingText,
            'image' => $webpFile,
        ]);

        $response->assertOk();
        $scanId = $response->json('scan_id');

        $scan = Scan::findOrFail($scanId);
        expect($scan->scan_type)->toBe('image');
        expect($scan->content)->toBe($accompanyingText);

        $storedPath = $scan->metadata['image_path'] ?? null;
        expect($storedPath)->not->toBeNull();
        Storage::disk('public')->assertExists($storedPath);
    });

    test('real binary WebP file passes fileinfo inspection and stores correctly', function () {
        // Minimal 1x1 lossy WebP binary header
        $webpHeader = base64_decode('UklGRjIAAABXRUJQVlA4ICYAAACyAAAAAnicM0hKGno4gw0j641A6P9/GB0DCKaPkWmY3v8A85wD4gAA');
        $tempPath = tempnam(sys_get_temp_dir(), 'real_webp_');
        file_put_contents($tempPath, $webpHeader);

        $realWebpFile = new UploadedFile($tempPath, 'minimal_1x1.webp', 'image/webp', null, true);

        $response = $this->postJson('/chat/analyze', [
            'image' => $realWebpFile,
        ]);

        $response->assertOk();
        $scanId = $response->json('scan_id');
        $scan = Scan::findOrFail($scanId);

        expect($scan->scan_type)->toBe('image');
        $storedPath = $scan->metadata['image_path'] ?? null;
        expect($storedPath)->not->toBeNull();
        Storage::disk('public')->assertExists($storedPath);
    });
});

/*
|--------------------------------------------------------------------------
| Milestone 1 Challenge: ScanController GET /scans/{public_id} Public Access
|--------------------------------------------------------------------------
*/

describe('GET /scans/{public_id} Public Scan Viewer Route', function () {
    test('guest can access scan report by valid public_id and receives Inertia payload', function () {
        $scan = Scan::create([
            'scan_type' => 'text',
            'content' => 'Investigasi link palsu https://bca-klik-login.fake',
            'risk_level' => 'HIGH',
            'score' => 92,
            'summary' => 'Indikasi phishing perbankan tingkat tinggi.',
            'red_flags' => ['Domain palsu', 'Meminta PIN ATM'],
            'recommendations' => ['Blokir nomor', 'Laporkan ke Halo BCA'],
            'provider_used' => 'Mock Provider',
            'model_used' => 'mock-model',
            'is_mock' => true,
        ]);

        $manifest = public_path('build/manifest.json');
        $version = file_exists($manifest) ? hash_file('xxh128', $manifest) : '';

        $response = $this->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version,
        ])->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $response->assertHeader('X-Inertia', 'true');
        $props = $response->json('props.scan');

        expect($response->json('component'))->toBe('scans/show');
        expect($props['id'])->toBe($scan->id);
        expect($props['public_id'])->toBe($scan->public_id);
        expect($props['scan_type'])->toBe('text');
        expect($props['risk_level'])->toBe('HIGH');
        expect($props['score'])->toBe(92);
        expect($props['summary'])->toBe('Indikasi phishing perbankan tingkat tinggi.');
        expect($props['red_flags'])->toBe(['Domain palsu', 'Meminta PIN ATM']);
        expect($props['recommendations'])->toBe(['Blokir nomor', 'Laporkan ke Halo BCA']);
        expect($props['image_url'])->toBeNull();
        expect($props['share_url'])->toBe(url("/scans/{$scan->public_id}"));
        expect($props)->toHaveKeys(['formatted_date', 'relative_time']);
    });

    test('image scan resolves public image_url via Storage url', function () {
        $fakeImagePath = 'scans/test_investigation_image.webp';
        Storage::disk('public')->put($fakeImagePath, 'fake-image-binary-data');

        $scan = Scan::create([
            'scan_type' => 'image',
            'content' => 'Screenshot Investigasi',
            'risk_level' => 'MEDIUM',
            'score' => 60,
            'summary' => 'Screenshot mencurigakan.',
            'metadata' => [
                'image_path' => $fakeImagePath,
            ],
        ]);

        $manifest = public_path('build/manifest.json');
        $version = file_exists($manifest) ? hash_file('xxh128', $manifest) : '';

        $response = $this->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version,
        ])->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $expectedUrl = Storage::disk('public')->url($fakeImagePath);

        expect($response->json('component'))->toBe('scans/show');
        expect($response->json('props.scan.image_url'))->toBe($expectedUrl);
    });

    test('requesting non-existent public_id returns 404 Not Found', function () {
        $randomUuid = (string) Str::uuid();

        $response = $this->get("/scans/{$randomUuid}");

        $response->assertNotFound();
    });

    test('requesting malformed or adversarial public_id returns 404 Not Found without 500 error', function () {
        $maliciousInputs = [
            "' OR '1'='1",
            '../../../etc/passwd',
            '<script>alert(1)</script>',
            '123-not-a-uuid',
            str_repeat('a', 500),
        ];

        foreach ($maliciousInputs as $input) {
            $response = $this->get('/scans/'.urlencode($input));
            $response->assertNotFound();
        }
    });
});

/*
|--------------------------------------------------------------------------
| Milestone 1 Adversarial & Stress Testing
|--------------------------------------------------------------------------
*/

describe('Adversarial Boundary & Attack Surface Stress Tests', function () {
    test('fake webp file containing text content but with .webp extension fails dimensions/image validation', function () {
        // Create an invalid file: plain text disguised as webp
        $fakeWebp = UploadedFile::fake()->create('malicious.webp', 10, 'image/webp');
        // Overwrite temp file with non-image string
        file_put_contents($fakeWebp->getRealPath(), '<?php echo "evil payload"; ?>');

        $response = $this->postJson('/chat/analyze', [
            'image' => $fakeWebp,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    });

    test('disallowed file formats (.exe, .svg, .pdf, .gif) are rejected with 422', function () {
        $disallowedExtensions = ['executable.exe', 'vector.svg', 'document.pdf', 'animation.gif'];

        foreach ($disallowedExtensions as $filename) {
            $file = UploadedFile::fake()->create($filename, 20);

            $response = $this->postJson('/chat/analyze', [
                'image' => $file,
            ]);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['image']);
        }
    });

    test('oversized image (> 5120 KB) is rejected with 422', function () {
        $oversizedWebp = UploadedFile::fake()->image('too_large.webp', 100, 100)->size(5121);

        $response = $this->postJson('/chat/analyze', [
            'image' => $oversizedWebp,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
        expect($response->json('errors.image.0'))->toContain('5MB');
    });

    test('empty payload with neither content nor image is rejected with 422', function () {
        $response = $this->postJson('/chat/analyze', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
    });

    test('content below 3 characters is rejected with 422', function () {
        $response = $this->postJson('/chat/analyze', [
            'content' => 'ab',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
    });

    test('content exceeding 10000 characters is rejected with 422', function () {
        $response = $this->postJson('/chat/analyze', [
            'content' => str_repeat('A', 10001),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
    });
});
