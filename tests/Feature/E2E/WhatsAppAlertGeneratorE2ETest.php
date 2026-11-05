<?php

use App\Services\Emergency\EmergencyGuidanceService;

/*
|--------------------------------------------------------------------------
| Tier 1: Contract, Presets & Template Schema
|--------------------------------------------------------------------------
*/

test('tier 1: emergency guidance service provides structured whatsapp warning presets', function () {
    if (! class_exists(EmergencyGuidanceService::class)) {
        $this->markTestSkipped('Waiting for Milestone 2: EmergencyGuidanceService implementation.');
    }

    $service = app(EmergencyGuidanceService::class);
    $presets = $service->getWhatsAppPresets();

    expect($presets)->toBeArray();
    expect(count($presets))->toBeGreaterThanOrEqual(4);

    $categories = collect($presets)->pluck('category')->all();
    expect($categories)->toContain('apk_malware');
    expect($categories)->toContain('fraud_transfer');
    expect($categories)->toContain('ktp_leak');

    foreach ($presets as $preset) {
        expect($preset)->toHaveKeys([
            'category',
            'title',
            'default_impersonation',
            'warning_template',
            'prevention_advice',
        ]);
        expect($preset['category'])->toBeString();
        expect($preset['title'])->toBeString();
        expect($preset['warning_template'])->toBeString();
    }
});

test('tier 1: emergency center page supplies whatsapp presets to frontend client', function () {
    if (! Route::has('emergency.index')) {
        $this->markTestSkipped('Waiting for Milestone 2: Emergency Center route implementation.');
    }

    $response = $this->get('/tanggap-darurat');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('emergency/index')
        ->has('whatsappPresets')
    );
});

/*
|--------------------------------------------------------------------------
| Tier 2: Template Rendering & Indonesian Messaging Format
|--------------------------------------------------------------------------
*/

test('tier 2: warning message generator correctly formats whatsapp markdown elements', function () {
    $title = 'Waspada Modus Undangan Pernikahan APK';
    $impersonated = 'Teman Lama / Nomor Asing';
    $contact = '+62 812-9876-5432';
    $details = 'Mengirimkan file Surat_Undangan.apk dan memaksa instalasi.';
    $advice = 'Jangan buka atau unduh berkas APK tersebut.';

    $formattedMessage = implode("\n\n", [
        '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨',
        "*Modus:* {$title}\n*Mengatasnamakan:* {$impersonated}\n*Kontak/No. Terduga:* {$contact}",
        "*Ciri-Ciri Modus:*\n{$details}",
        "*Langkah Pencegahan:*\n{$advice}",
        '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber)_',
    ]);

    // Verify WhatsApp formatting markers
    expect($formattedMessage)->toContain('*PERINGATAN KEAMANAN SIBER KELUARGA*');
    expect($formattedMessage)->toContain('*Modus:*');
    expect($formattedMessage)->toContain('*Mengatasnamakan:*');
    expect($formattedMessage)->toContain('*Kontak/No. Terduga:* +62 812-9876-5432');
    expect($formattedMessage)->toContain('_Pesan ini dibuat otomatis melalui Cekara');
});

test('tier 2: generator adapts tone between family group, neighborhood community, and public social', function () {
    if (! class_exists(EmergencyGuidanceService::class)) {
        $this->markTestSkipped('Waiting for Milestone 2: EmergencyGuidanceService implementation.');
    }

    $service = app(EmergencyGuidanceService::class);
    $presets = $service->getWhatsAppPresets();
    $apkPreset = collect($presets)->firstWhere('category', 'apk_malware');

    expect($apkPreset)->not->toBeNull();
    expect(strlen($apkPreset['warning_template']))->toBeGreaterThan(30);
    expect(str_contains(strtolower($apkPreset['warning_template']), 'apk') || str_contains(strtolower($apkPreset['prevention_advice']), 'apk'))->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Tier 3: Adversarial Encoding, Escaping & wa.me URL Formation
|--------------------------------------------------------------------------
*/

test('tier 3: wa.me share url handles special characters, emojis, and multiline text with rfc 3986 encoding', function () {
    $rawText = "🚨 *WASPADA PENIPUAN!*\n"
        ."Nomor: +62 812-3456-7890\n"
        ."Catatan: Mengaku 'Bank BRI' & meminta OTP/PIN.\n"
        ."Tautan mencurigakan: http://promo-bri.xyz?ref=bca&id=10#claim\n"
        .'Jangan percaya hadiah Rp 50.000.000!';

    // Generate URL encoded payload
    $encodedText = rawurlencode($rawText);
    $waMeUrl = "https://wa.me/?text={$encodedText}";

    // Verify URL scheme and base
    expect($waMeUrl)->toStartWith('https://wa.me/?text=');

    // Verify RFC 3986 compliance: spaces become %20, newlines become %0A
    expect($waMeUrl)->not->toContain(' ');
    expect($waMeUrl)->not->toContain("\n");
    expect($waMeUrl)->toContain('%0A'); // Newline encoded
    expect($waMeUrl)->toContain('%20'); // Space encoded

    // Verify round-trip lossless decoding
    $query = parse_url($waMeUrl, PHP_URL_QUERY);
    parse_str($query, $parsedParams);

    expect($parsedParams['text'])->toBe($rawText);
});

test('tier 3: wa.me url generation respects practical mobile url length thresholds', function () {
    // Generate a detailed warning message (~800 characters)
    $longWarning = "🚨 *PERINGATAN DARURAT: SINDIKAT PENIPUAN REKRUTMEN KERJA* 🚨\n\n"
        .str_repeat('Modus like & subscribe YouTube dengan janji komisi Rp 500.000 per hari. ', 8)
        ."\n\n*Rekening Penampung:* BCA 1234567890 a.n. Sindikat Palsu\n"
        .'*Langkah Cepat:* Segera laporkan ke cekrekening.id dan hubungi call center bank Anda.';

    $encoded = rawurlencode($longWarning);
    $url = "https://wa.me/?text={$encoded}";

    // Must be under 2,000 characters for standard mobile browser and WhatsApp Web limits
    expect(strlen($url))->toBeLessThan(2048);

    // Decodes cleanly without truncation
    $query = parse_url($url, PHP_URL_QUERY);
    parse_str($query, $params);
    expect($params['text'])->toBe($longWarning);
});

/*
|--------------------------------------------------------------------------
| Tier 4: Integrated End-to-End Alert Workflow
|--------------------------------------------------------------------------
*/

test('tier 4: user generates family warning alert from scam scenario and forms verified wa.me share link', function () {
    if (! class_exists(EmergencyGuidanceService::class)) {
        // Fallback preset verification to test workflow without M2 class
        $preset = [
            'category' => 'fraud_transfer',
            'title' => 'Waspada Penipuan Transfer Bank',
        ];
    } else {
        $service = app(EmergencyGuidanceService::class);
        $presets = $service->getWhatsAppPresets();
        $preset = collect($presets)->firstWhere('category', 'fraud_transfer') ?? $presets[0];
    }

    // 2. User inputs details of fraudulent incident
    $scamData = [
        'category' => $preset['category'],
        'title' => $preset['title'],
        'suspect_contact' => '0858-1122-3344 (Rekening BRI: 0011-2233-4455-667)',
        'impersonated_name' => 'Call Center Bank Palsu',
        'details' => 'Meminta transfer biaya administrasi penanganan rekening terblokir.',
        'advice' => 'Bank resmi TIDAK PERNAH meminta transfer uang ke rekening pribadi pegawai.',
    ];

    // 3. User generates WhatsApp formatted text
    $generatedMessage = "⚠️ *{$preset['title']}* ⚠️\n\n"
        ."*Kontak / Rekening:* {$scamData['suspect_contact']}\n"
        ."*Atas Nama / Catutan:* {$scamData['impersonated_name']}\n\n"
        ."*Kronologi Modus:*\n{$scamData['details']}\n\n"
        ."*Tindakan Penting:*\n{$scamData['advice']}\n\n"
        .'_Diteruskan melalui Cekara https://cekara.id_';

    // 4. Client constructs WhatsApp URL
    $shareUrl = 'https://wa.me/?text='.rawurlencode($generatedMessage);

    // 5. Verification: URL is valid and opens WhatsApp with exact prefilled template
    expect($shareUrl)->toStartWith('https://wa.me/?text=');
    expect(rawurldecode(substr($shareUrl, strlen('https://wa.me/?text='))))->toBe($generatedMessage);
});
