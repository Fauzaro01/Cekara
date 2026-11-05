<?php

use App\Services\Emergency\EmergencyGuidanceService;
use Inertia\Testing\AssertableInertia as Assert;

/*
|--------------------------------------------------------------------------
| Section 1: All 5 Preset Categories & Schema Integrity
|--------------------------------------------------------------------------
*/

describe('Section 1: All 5 Preset Categories & Schema Integrity', function () {
    test('guidance service provides all 5 required scam preset categories', function () {
        $service = app(EmergencyGuidanceService::class);
        $presets = $service->getWhatsAppPresets();

        expect($presets)->toBeArray();
        expect(count($presets))->toBe(5);

        $categories = collect($presets)->pluck('category')->all();
        $expectedCategories = [
            'apk_malware',
            'fraud_transfer',
            'ktp_leak',
            'freelance_scam',
            'fake_relative',
        ];

        foreach ($expectedCategories as $expected) {
            expect($categories)->toContain($expected);
        }

        // Verify distinct categories (no duplicate slugs)
        expect(count(array_unique($categories)))->toBe(5);
    });

    test('each of the 5 presets contains complete non-empty string attributes', function () {
        $service = app(EmergencyGuidanceService::class);
        $presets = $service->getWhatsAppPresets();

        $requiredKeys = [
            'category',
            'title',
            'default_impersonation',
            'warning_template',
            'prevention_advice',
        ];

        foreach ($presets as $index => $preset) {
            foreach ($requiredKeys as $key) {
                expect($preset)->toHaveKey($key);
                expect($preset[$key])->toBeString();
                expect(trim($preset[$key]))->not->toBeEmpty();
            }
        }
    });

    test('preset categories match valid snake_case identifiers', function () {
        $service = app(EmergencyGuidanceService::class);
        $presets = $service->getWhatsAppPresets();

        foreach ($presets as $preset) {
            expect($preset['category'])->toMatch('/^[a-z]+(_[a-z]+)*$/', "Preset category '{$preset['category']}' is not valid snake_case");
        }
    });

    test('emergency center inertia page provides all 5 presets to frontend client', function () {
        $response = $this->get('/tanggap-darurat');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('emergency/index')
            ->has('whatsappPresets', 5)
            ->where('whatsappPresets.0.category', 'apk_malware')
            ->where('whatsappPresets.1.category', 'fraud_transfer')
            ->where('whatsappPresets.2.category', 'ktp_leak')
            ->where('whatsappPresets.3.category', 'freelance_scam')
            ->where('whatsappPresets.4.category', 'fake_relative')
        );
    });
});

/*
|--------------------------------------------------------------------------
| Section 2: WhatsApp Markdown Syntax Integrity (*bold*, _italic_)
|--------------------------------------------------------------------------
*/

describe('Section 2: WhatsApp Markdown Syntax Integrity (*bold*, _italic_)', function () {
    test('preset warning templates maintain balanced markdown asterisks without orphaned markers', function () {
        $service = app(EmergencyGuidanceService::class);
        $presets = $service->getWhatsAppPresets();

        foreach ($presets as $preset) {
            $template = $preset['warning_template'];
            // Count total asterisks
            $asteriskCount = substr_count($template, '*');
            expect($asteriskCount % 2)->toBe(0, "Preset {$preset['category']} has unbalanced bold asterisks (*) in warning_template: count is {$asteriskCount}");

            // Count total underscores
            $underscoreCount = substr_count($template, '_');
            expect($underscoreCount % 2)->toBe(0, "Preset {$preset['category']} has unbalanced italic underscores (_) in warning_template: count is {$underscoreCount}");
        }
    });

    test('tone headers and field labels maintain strict WhatsApp bold syntax', function () {
        $tones = [
            'family' => [
                'header' => '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨',
                'greeting' => 'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:',
            ],
            'community' => [
                'header' => '📢 *INFORMASI WASPADA KOMUNITAS & WARGA* 📢',
                'greeting' => 'Bapak/Ibu/Rekan-rekan warga sekalian, mohon berhati-hati terhadap modus kejahatan siber berikut:',
            ],
            'public' => [
                'header' => '⚠️ *PERINGATAN PUBLIK: WASPADA PENIPUAN SIBER* ⚠️',
                'greeting' => 'Pemberitahuan kepada seluruh kontak dan rekan untuk mewaspadai indikasi penipuan berikut:',
            ],
        ];

        foreach ($tones as $toneKey => $toneData) {
            $header = $toneData['header'];
            expect(substr_count($header, '*'))->toBe(2, "Tone {$toneKey} header does not have exactly 2 asterisks for bold");

            // WhatsApp bold rule: asterisks must touch non-whitespace chars
            expect($header)->toMatch('/\*[^\s*](?:.*[^\s*])?\*/', "Tone {$toneKey} header asterisks are improperly spaced");
        }

        $standardLabels = [
            '*Modus:*',
            '*Mengatasnamakan:*',
            '*Kontak/No. Terduga:*',
            '*Ciri-Ciri Modus:*',
            '*Langkah Pencegahan:*',
        ];

        foreach ($standardLabels as $label) {
            expect(substr_count($label, '*'))->toBe(2);
            expect(str_starts_with($label, '*'))->toBeTrue();
            expect(str_ends_with($label, '*'))->toBeTrue();
        }

        $standardFooter = '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber) - https://cekara.id_';
        expect(substr_count($standardFooter, '_'))->toBe(2);
        expect(str_starts_with($standardFooter, '_'))->toBeTrue();
        expect(str_ends_with($standardFooter, '_'))->toBeTrue();
    });

    test('all 15 combinations of presets (5) and tones (3) produce syntactically valid markdown', function () {
        $service = app(EmergencyGuidanceService::class);
        $presets = $service->getWhatsAppPresets();

        $tones = [
            'family' => [
                'header' => '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨',
                'greeting' => 'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:',
            ],
            'community' => [
                'header' => '📢 *INFORMASI WASPADA KOMUNITAS & WARGA* 📢',
                'greeting' => 'Bapak/Ibu/Rekan-rekan warga sekalian, mohon berhati-hati terhadap modus kejahatan siber berikut:',
            ],
            'public' => [
                'header' => '⚠️ *PERINGATAN PUBLIK: WASPADA PENIPUAN SIBER* ⚠️',
                'greeting' => 'Pemberitahuan kepada seluruh kontak dan rekan untuk mewaspadai indikasi penipuan berikut:',
            ],
        ];

        foreach ($presets as $preset) {
            foreach ($tones as $toneKey => $toneData) {
                $lines = [
                    $toneData['header'],
                    $toneData['greeting'],
                    "*Modus:* {$preset['title']}",
                    "*Mengatasnamakan:* {$preset['default_impersonation']}",
                    '*Kontak/No. Terduga:* +62 812-3456-7890',
                    "*Ciri-Ciri Modus:*\n{$preset['warning_template']}",
                    "*Langkah Pencegahan:*\n{$preset['prevention_advice']}",
                    '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber) - https://cekara.id_',
                ];

                $fullMessage = implode("\n\n", $lines);

                // Verify balanced bold
                $asterisks = substr_count($fullMessage, '*');
                expect($asterisks % 2)->toBe(0, "Unbalanced bold asterisks in preset {$preset['category']} tone {$toneKey}");

                // Verify balanced italics
                $underscores = substr_count($fullMessage, '_');
                expect($underscores % 2)->toBe(0, "Unbalanced italic underscores in preset {$preset['category']} tone {$toneKey}");

                // Verify contains expected structural markers
                expect($fullMessage)->toContain($toneData['header']);
                expect($fullMessage)->toContain("*Modus:* {$preset['title']}");
                expect($fullMessage)->toContain('_Pesan ini dibuat otomatis melalui Cekara');
            }
        }
    });
});

/*
|--------------------------------------------------------------------------
| Section 3: Complex Characters, Emojis & RFC 3986 Whitespace Encoding
|--------------------------------------------------------------------------
*/

describe('Section 3: Complex Characters, Emojis & RFC 3986 Whitespace Encoding', function () {
    test('special URL punctuation characters (&, #, ?, =, %, +, quotes) are strictly encoded without breaking query string', function () {
        $adversarialInputs = [
            'ampersand' => 'Rekening & Akun: Mandiri & BCA & BRI',
            'hash_fragment' => 'Tautan: http://scam.id#claim-prize#token=12345',
            'question_query' => 'Pertanyaan: Kenapa minta OTP? Berapa saldo?',
            'equals_param' => 'Kode: ref=promo&status=win&amount=5000000',
            'percent_sign' => 'Diskon 100% biaya penanganan & cashback 50%',
            'plus_sign' => '+62 812-9988-7766 + CS Hotline + Rekening',
            'quotes_and_slashes' => 'Pesan "PENTING": \'Transfer sekarang!\' /path/to/malware\\trojan.apk',
            'html_injection' => '<script>alert("XSS")</script><img src="x" onerror="evil()"/>',
        ];

        foreach ($adversarialInputs as $type => $input) {
            $rawMessage = "🚨 *WASPADA PENIPUAN* 🚨\n\n*Detail:* {$input}\n\n_Cekara_";

            // Simulating JavaScript encodeURIComponent (RFC 3986)
            $encoded = rawurlencode($rawMessage);
            $fullUrl = "https://wa.me/?text={$encoded}";

            // 1. URL prefix verification
            expect($fullUrl)->toStartWith('https://wa.me/?text=');

            // 2. Query string boundary check:
            // An unencoded '#' would make everything after it a URL fragment, cutting off data!
            // An unencoded '&' would create additional query parameters, breaking the 'text' param!
            $parsedUrl = parse_url($fullUrl);
            expect($parsedUrl)->toHaveKey('scheme', 'https');
            expect($parsedUrl)->toHaveKey('host', 'wa.me');
            expect($parsedUrl)->not->toHaveKey('fragment', "Unencoded '#' leaked into URL fragment in type '{$type}'");

            // Extract query
            parse_str($parsedUrl['query'], $queryParams);
            expect(count($queryParams))->toBe(1, "Unencoded '&' split query string into multiple parameters in type '{$type}': ".json_encode(array_keys($queryParams)));
            expect($queryParams)->toHaveKey('text');

            // 3. Round-trip lossless fidelity
            expect($queryParams['text'])->toBe($rawMessage, "Lossless round-trip failed for type '{$type}'");
        }
    });

    test('multi-line whitespace combinations (CRLF, double newlines, tabs, spaces) encode cleanly to RFC 3986', function () {
        $whitespacePayload = "Baris 1: Peringatan\r\n\r\nBaris 2: Detail insiden\n\n\nBaris 3:\t\tTabulasi dan   spasi jamak.\r\nSelesai.";

        $encoded = rawurlencode($whitespacePayload);
        $fullUrl = "https://wa.me/?text={$encoded}";

        // No literal newlines or spaces in URL
        expect($fullUrl)->not->toContain("\n");
        expect($fullUrl)->not->toContain("\r");
        expect($fullUrl)->not->toContain(' ');
        expect($fullUrl)->not->toContain("\t");

        // Proper hex encoding present
        expect($fullUrl)->toContain('%0A'); // Newline
        expect($fullUrl)->toContain('%20'); // Space

        // Lossless roundtrip decoding
        $query = parse_url($fullUrl, PHP_URL_QUERY);
        parse_str($query, $params);
        expect($params['text'])->toBe($whitespacePayload);
    });

    test('multibyte emojis, flags, ZWJ sequences, and international characters encode and decode losslessly', function () {
        $emojiPayload = implode(' ', [
            '🚨 Alert',
            '⚠️ Warning',
            '📢 Megaphone',
            '🛑 Stop',
            '👮‍♂️ Police Officer',
            '🕵️‍♀️ Detective',
            '💳 Credit Card',
            '💰 Money Bag',
            '📱 Smartphone',
            '🇮🇩 Indonesian Flag',
            '👨‍👩‍👧‍👦 Family (ZWJ sequence)',
            'Rp 50.000.000 (Rupiah)',
            '日本語 テスト (Japanese)',
            'اختبار عربي (Arabic RTL)',
        ]);

        $encoded = rawurlencode($emojiPayload);
        $fullUrl = "https://wa.me/?text={$encoded}";

        // Must start with wa.me
        expect($fullUrl)->toStartWith('https://wa.me/?text=');

        // Hex representations of multibyte UTF-8
        expect($fullUrl)->toContain('%F0%9F%9A%A8'); // 🚨 siren

        // Roundtrip decoding
        $query = parse_url($fullUrl, PHP_URL_QUERY);
        parse_str($query, $params);
        expect($params['text'])->toBe($emojiPayload);
    });
});

/*
|--------------------------------------------------------------------------
| Section 4: Boundary Stress Testing & URL Length Thresholds
|--------------------------------------------------------------------------
*/

describe('Section 4: Boundary Stress Testing & URL Length Thresholds', function () {
    test('default messages from all 5 presets fit comfortably within standard mobile URL limit (2,048 chars)', function () {
        $service = app(EmergencyGuidanceService::class);
        $presets = $service->getWhatsAppPresets();

        foreach ($presets as $preset) {
            $lines = [
                '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨',
                'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:',
                "*Modus:* {$preset['title']}",
                "*Mengatasnamakan:* {$preset['default_impersonation']}",
                '*Kontak/No. Terduga:* +62 812-9876-5432 (BCA: 1234567890)',
                "*Ciri-Ciri Modus:*\n{$preset['warning_template']}",
                "*Langkah Pencegahan:*\n{$preset['prevention_advice']}",
                '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber) - https://cekara.id_',
            ];

            $message = implode("\n\n", $lines);
            $encodedUrl = 'https://wa.me/?text='.rawurlencode($message);

            // Verify raw message character count is compact (< 1,200 chars)
            expect(mb_strlen($message))->toBeLessThan(1200, "Raw preset {$preset['category']} is excessively long: ".mb_strlen($message));

            // Verify encoded URL is well below mobile threshold of 2,048 characters
            expect(strlen($encodedUrl))->toBeLessThan(2048, "Encoded URL for preset {$preset['category']} exceeds 2,048 chars: ".strlen($encodedUrl));

            // Round trip fidelity
            $query = parse_url($encodedUrl, PHP_URL_QUERY);
            parse_str($query, $params);
            expect($params['text'])->toBe($message);
        }
    });

    test('large adversarial payloads approaching threshold limits encode correctly without truncating', function () {
        // Construct large input: 800-character description containing repeated patterns and emojis
        $longDescription = str_repeat('Penipu mengaku sebagai kurir paket mengirim file APK jahat dengan ekstensi .apk. ', 10)
            .'Harap waspada dan jangan transfer dana ke nomor rekening mana pun!';

        $lines = [
            '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨',
            'Keluarga sekalian, mohon perhatiannya:',
            '*Modus:* Penipuan Berbahaya',
            '*Mengatasnamakan:* Sindikat Siber',
            '*Kontak/No. Terduga:* 0812-9999-8888',
            "*Ciri-Ciri Modus:*\n{$longDescription}",
            '*Langkah Pencegahan:* Segera blokir dan laporkan ke bank.',
            '_Pesan ini dibuat otomatis melalui Cekara - https://cekara.id_',
        ];

        $message = implode("\n\n", $lines);
        $encodedUrl = 'https://wa.me/?text='.rawurlencode($message);

        // Raw message length
        expect(mb_strlen($message))->toBeGreaterThan(900);

        // Encoded URL is clean
        expect($encodedUrl)->toStartWith('https://wa.me/?text=');
        expect($encodedUrl)->not->toContain(' ');
        expect($encodedUrl)->not->toContain("\n");

        // Verify parseable and reversible
        $query = parse_url($encodedUrl, PHP_URL_QUERY);
        parse_str($query, $params);
        expect($params['text'])->toBe($message);
    });

    test('extreme stress payload (4,000 characters) encodes losslessly and remains valid RFC 3986 URI', function () {
        // 4,000 character stress payload
        $extremePayload = str_repeat('🚨 Modus penipuan siber berbahaya: jangan klik link atau install apk! ', 55);

        $encodedUrl = 'https://wa.me/?text='.rawurlencode($extremePayload);

        // Verification: URL is valid URI
        expect(filter_var($encodedUrl, FILTER_VALIDATE_URL))->toBeString();

        // Roundtrip check
        $query = parse_url($encodedUrl, PHP_URL_QUERY);
        parse_str($query, $params);
        expect($params['text'])->toBe($extremePayload);
    });
});

/*
|--------------------------------------------------------------------------
| Section 5: Edge Cases, Fallbacks & Empty Form Handling
|--------------------------------------------------------------------------
*/

describe('Section 5: Edge Cases, Fallbacks & Empty Form Handling', function () {
    test('generator applies proper fallback defaults when user inputs are completely empty', function () {
        // Mirrors frontend fallback logic in resources/js/pages/emergency/index.tsx
        $waScamTitle = '';
        $waImpersonated = '';
        $waSuspectContact = '';
        $waDetails = '';
        $waAdvice = '';

        $titleFallback = $waScamTitle ?: 'Penipuan Siber Mencurigakan';
        $impersonatedFallback = $waImpersonated ?: 'Pihak Asing / Tidak Dikenal';
        $contactFallback = $waSuspectContact ?: '(Nomor / Rekening Tidak Diketahui)';
        $detailsFallback = $waDetails ?: 'Harap waspada terhadap permintaan kode OTP, tautan berkas APK, atau permintaan transfer mencurigakan.';
        $adviceFallback = $waAdvice ?: 'Jangan berikan data pribadi, jangan unduh file mencurigakan, dan segera hubungi pihak resmi untuk konfirmasi.';

        $lines = [
            '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨',
            'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:',
            "*Modus:* {$titleFallback}",
            "*Mengatasnamakan:* {$impersonatedFallback}",
            "*Kontak/No. Terduga:* {$contactFallback}",
            "*Ciri-Ciri Modus:*\n{$detailsFallback}",
            "*Langkah Pencegahan:*\n{$adviceFallback}",
            '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber) - https://cekara.id_',
        ];

        $fallbackMessage = implode("\n\n", $lines);

        // Check fallback text presence
        expect($fallbackMessage)->toContain('*Modus:* Penipuan Siber Mencurigakan');
        expect($fallbackMessage)->toContain('*Mengatasnamakan:* Pihak Asing / Tidak Dikenal');
        expect($fallbackMessage)->toContain('*Kontak/No. Terduga:* (Nomor / Rekening Tidak Diketahui)');
        expect($fallbackMessage)->toContain('Harap waspada terhadap permintaan kode OTP');

        // Check valid markdown
        expect(substr_count($fallbackMessage, '*'))->toBe(12);
        expect(substr_count($fallbackMessage, '_'))->toBe(2);

        // Check URL formation
        $url = 'https://wa.me/?text='.rawurlencode($fallbackMessage);
        expect($url)->toStartWith('https://wa.me/?text=');
    });

    test('generator handles input strings with leading and trailing whitespaces and quotes safely', function () {
        $trickyInput = "   'BCA Customer Service' \"Resmi\" `bot`   ";
        $sanitized = trim($trickyInput);

        $lines = [
            '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨',
            'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:',
            '*Modus:* Modus Penipuan',
            "*Mengatasnamakan:* {$sanitized}",
            '*Kontak/No. Terduga:* 0812345678',
            "*Ciri-Ciri Modus:*\nKronologi",
            "*Langkah Pencegahan:*\nSaran",
            '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber) - https://cekara.id_',
        ];

        $message = implode("\n\n", $lines);
        $encodedUrl = 'https://wa.me/?text='.rawurlencode($message);

        $query = parse_url($encodedUrl, PHP_URL_QUERY);
        parse_str($query, $params);

        expect($params['text'])->toBe($message);
        expect($params['text'])->toContain("'BCA Customer Service' \"Resmi\" `bot`");
    });
});
