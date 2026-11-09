<?php

use App\Http\Controllers\ScanController;
use App\Models\Scan;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Response;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    config()->set('inertia.testing.ensure_pages_exist', false);
});

/*
|--------------------------------------------------------------------------
| Section 1: Route Resolution and Parameter Handling (Negative & Boundary Cases)
|--------------------------------------------------------------------------
*/

describe('Section 1: Route Resolution and Parameter Handling', function () {
    test('requesting non-existent UUID returns 404 not found', function () {
        $nonExistentUuid = '00000000-0000-0000-0000-000000000000';

        $response = $this->get("/scans/{$nonExistentUuid}");

        $response->assertNotFound();
    });

    test('requesting malformed string identifier returns 404 not found', function () {
        $malformedId = 'invalid-id';

        $response = $this->get("/scans/{$malformedId}");

        $response->assertNotFound();
    });

    test('requesting SQL injection pattern returns 404 without unhandled database exception', function () {
        $sqlInjectionPayload = "' OR '1'='1";

        $response = $this->get('/scans/'.urlencode($sqlInjectionPayload));

        $response->assertNotFound();
    });

    test('requesting XSS payload in parameter returns 404', function () {
        $xssPayload = "<script>alert('xss')</script>";

        $response = $this->get('/scans/'.urlencode($xssPayload));

        $response->assertNotFound();
    });

    test('requesting excessively long string returns 404', function () {
        $longPayload = str_repeat('a', 1000);

        $response = $this->get("/scans/{$longPayload}");

        $response->assertNotFound();
    });

    test('requesting numeric id when no scan has that public_id returns 404', function () {
        $scan = Scan::factory()->create();

        // Querying using primary key integer instead of public_id must 404
        $response = $this->get("/scans/{$scan->id}");

        $response->assertNotFound();
    });

    test('named route scans.show generates correct public url', function () {
        $uuid = (string) Str::uuid();

        $generatedUrl = route('scans.show', ['public_id' => $uuid]);

        expect($generatedUrl)->toContain("/scans/{$uuid}");
    });

    test('unsupported HTTP methods on /scans/{public_id} are rejected', function () {
        $uuid = (string) Str::uuid();

        $this->post("/scans/{$uuid}")->assertStatus(405);
        $this->put("/scans/{$uuid}")->assertStatus(405);
        $this->patch("/scans/{$uuid}")->assertStatus(405);
    });

    test('DELETE /scans/{public_id} does not collide with numeric dashboard scans.destroy', function () {
        $uuid = (string) Str::uuid();

        // Dashboard scan destroy has whereNumber('id') constraint
        $response = $this->delete("/scans/{$uuid}");

        // Must either be 404 or 405 because UUID contains non-numeric characters
        expect(in_array($response->status(), [404, 405]))->toBeTrue();
    });
});

/*
|--------------------------------------------------------------------------
| Section 2: Controller Response & Record Querying Accuracy
|--------------------------------------------------------------------------
*/

describe('Section 2: Controller Response & Record Isolation', function () {
    test('queries and returns the exact target scan among multiple database records', function () {
        $scanA = Scan::factory()->create([
            'content' => 'Pesan Scam A - Pinjaman Online Ilegal',
            'risk_level' => 'HIGH',
            'score' => 90,
            'summary' => 'Ringkasan Scam A',
        ]);

        $scanB = Scan::factory()->create([
            'content' => 'Pesan Normal B - Pengingat Jadwal Kuliah',
            'risk_level' => 'LOW',
            'score' => 10,
            'summary' => 'Ringkasan Normal B',
        ]);

        $scanC = Scan::factory()->create([
            'content' => 'Pesan Modus C - Undian Berhadiah Palsu',
            'risk_level' => 'CRITICAL',
            'score' => 99,
            'summary' => 'Ringkasan Modus C',
        ]);

        $response = $this->get("/scans/{$scanB->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.id', $scanB->id)
            ->where('scan.public_id', $scanB->public_id)
            ->where('scan.content', 'Pesan Normal B - Pengingat Jadwal Kuliah')
            ->where('scan.risk_level', 'LOW')
            ->where('scan.score', 10)
            ->where('scan.summary', 'Ringkasan Normal B')
        );
    });

    test('guest-created scan with null user_id is viewable publicly by unauthenticated guest', function () {
        $guestScan = Scan::factory()->create([
            'user_id' => null,
            'scan_type' => 'text',
            'content' => 'Laporan investigasi guest publik',
        ]);

        $response = $this->get("/scans/{$guestScan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.public_id', $guestScan->public_id)
            ->missing('scan.user_id')
            ->missing('scan.user')
        );
    });

    test('authenticated-user scan is viewable publicly without leaking user identity', function () {
        $user = User::factory()->create([
            'name' => 'Rahasia Pengguna',
            'email' => 'rahasia@example.com',
        ]);

        $authScan = Scan::factory()->create([
            'user_id' => $user->id,
            'scan_type' => 'url',
            'content' => 'https://phishing-banking-test.id',
        ]);

        // Unauthenticated guest requests authenticated user's scan
        $response = $this->get("/scans/{$authScan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.public_id', $authScan->public_id)
            ->where('scan.content', 'https://phishing-banking-test.id')
            ->missing('scan.user_id')
            ->missing('scan.user')
        );
    });

    test('authenticated user can view another users scan via public_id', function () {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();

        $scan = Scan::factory()->create([
            'user_id' => $owner->id,
            'content' => 'Scan kepemilikan user A dilihat user B',
        ]);

        $response = $this->actingAs($viewer)->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.public_id', $scan->public_id)
        );
    });
});

/*
|--------------------------------------------------------------------------
| Section 3: Data Formatting & Metadata Edge Cases
|--------------------------------------------------------------------------
*/

describe('Section 3: Data Formatting & Metadata Edge Cases', function () {
    test('resolves public image url when metadata contains image_path', function () {
        Storage::fake('public');

        $scan = Scan::factory()->create([
            'metadata' => [
                'filename' => 'evidence.png',
                'image_path' => 'scans/test-screenshot-uuid.png',
            ],
        ]);

        $response = $this->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $expectedUrl = Storage::disk('public')->url('scans/test-screenshot-uuid.png');

        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.image_url', $expectedUrl)
        );
    });

    test('returns null image_url when metadata exists but image_path is missing', function () {
        $scan = Scan::factory()->create([
            'metadata' => [
                'client_ip' => '127.0.0.1',
                'word_count' => 15,
            ],
        ]);

        $response = $this->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.image_url', null)
        );
    });

    test('returns null image_url when metadata is completely null without error', function () {
        $scan = Scan::factory()->create([
            'metadata' => null,
        ]);

        $response = $this->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.image_url', null)
        );
    });

    test('handles null red_flags and recommendations by defaulting to empty arrays', function () {
        $scan = Scan::factory()->create([
            'red_flags' => null,
            'recommendations' => null,
        ]);

        $response = $this->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.red_flags', [])
            ->where('scan.recommendations', [])
        );
    });

    test('formats created_at, formatted_date, and relative_time accurately', function () {
        $knownDate = Carbon::parse('2026-11-09 10:15:30');
        Carbon::setTestNow($knownDate);

        $scan = Scan::factory()->create([
            'created_at' => $knownDate,
        ]);

        $response = $this->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->where('scan.created_at', $knownDate->toISOString())
            ->has('scan.formatted_date')
            ->has('scan.relative_time')
            ->where('scan.share_url', url("/scans/{$scan->public_id}"))
        );

        Carbon::setTestNow();
    });

    test('payload satisfies PROJECT.md interface contract keys', function () {
        $scan = Scan::factory()->create();

        $response = $this->get("/scans/{$scan->public_id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scans/show')
            ->has('scan', fn (Assert $scanProp) => $scanProp
                ->has('id')
                ->has('public_id')
                ->has('scan_type')
                ->has('content')
                ->has('risk_level')
                ->has('score')
                ->has('summary')
                ->has('red_flags')
                ->has('recommendations')
                ->has('provider_used')
                ->has('model_used')
                ->has('is_mock')
                ->has('metadata')
                ->has('image_url')
                ->has('share_url')
                ->has('created_at')
                ->has('formatted_date')
                ->has('relative_time')
            )
        );
    });
});

/*
|--------------------------------------------------------------------------
| Section 4: Direct Controller Invocation (Unit-level Verification)
|--------------------------------------------------------------------------
*/

describe('Section 4: Direct Controller Invocation', function () {
    test('direct ScanController show execution returns Inertia Response with props', function () {
        $scan = Scan::factory()->create([
            'content' => 'Test direct controller invocation',
        ]);

        $controller = new ScanController;
        $response = $controller->show($scan->public_id);

        expect($response)->toBeInstanceOf(Response::class);

        // Verify props via reflection or property access
        $props = (fn () => $this->props)->call($response);

        expect($props)->toHaveKey('scan')
            ->and($props['scan']['public_id'])->toBe($scan->public_id)
            ->and($props['scan']['content'])->toBe('Test direct controller invocation')
            ->and($props['scan']['share_url'])->toBe(url("/scans/{$scan->public_id}"));
    });

    test('direct ScanController show with non-existent id throws ModelNotFoundException', function () {
        $controller = new ScanController;

        expect(fn () => $controller->show('non-existent-uuid'))
            ->toThrow(ModelNotFoundException::class);
    });
});
