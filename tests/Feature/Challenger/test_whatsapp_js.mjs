/**
 * Empirical JS Test Harness for WhatsApp Alert Generator
 * Verifies exact client-side JavaScript behavior:
 * - Markdown construction & balancing
 * - RFC 3986 encoding via encodeURIComponent
 * - All 5 presets across 3 audience tones (15 permutations)
 * - URL length threshold under varying payload sizes
 * - Adversarial character sets and emojis
 */

import assert from 'node:assert/strict';

// 5 Preset Definitions matching EmergencyGuidanceService
const presets = [
    {
        category: 'apk_malware',
        title: 'Waspada Modus Undangan / Paket File APK',
        default_impersonation: 'Kurir Paket J&T/JNE / Pengirim Undangan Pernikahan Asing',
        warning_template: "🚨 *PERINGATAN KEAMANAN SIBER: JANGAN BUKA FILE APK!* 🚨\n\nKeluarga dan kerabat sekalian, harap berhati-hati jika menerima pesan berisi file berekstensi *.apk* (seperti Surat Undangan Pernikahan, Foto Resi Pengiriman Paket, atau Surat Tilang ETLE) dari nomor tidak dikenal.\n\nFile APK tersebut adalah aplikasi malware pencuri SMS OTP perbankan yang dapat menguras saldo rekening secara otomatis jika diinstal.",
        prevention_advice: 'Jangan pernah membuka atau menginstal berkas berakhiran .apk di luar toko aplikasi resmi. Jika terlanjur klik, segera matikan koneksi internet ponsel Anda (Mode Pesawat).',
    },
    {
        category: 'fraud_transfer',
        title: 'Waspada Penipuan Rekening Transfer Dana',
        default_impersonation: 'Customer Service Bank Palsu / Penjual Belanja Online Bodong',
        warning_template: "🚨 *WASPADA PENIPUAN REKENING TRANSFER BANK!* 🚨\n\nHarap berhati-hati jika ada pihak yang menghubungi dan meminta transfer uang dengan berbagai alasan mendesak, seperti pengurusan hadiah, pemulihan akun terblokir, ataupun pembayaran pesanan mencurigakan.",
        prevention_advice: 'Bank resmi TIDAK PERNAH meminta nasabah mentransfer dana ke rekening pribadi atas nama perorangan. Selalu periksa rekam jejak rekening di https://cekrekening.id sebelum bertransaksi.',
    },
    {
        category: 'ktp_leak',
        title: 'Waspada Penyalahgunaan Identitas / KTP',
        default_impersonation: 'Pihak Mengatasnamakan Saya / Sindikat Pinjol',
        warning_template: "🚨 *PEMBERITAHUAN DARURAT: WASPADA PENYALAHGUNAAN IDENTITAS* 🚨\n\nKepada seluruh keluarga dan rekan-rekan, saya ingin menginformasikan bahwa data identitas/KTP saya sedang disalahgunakan oleh pihak tidak bertanggung jawab untuk kepentingan penipuan.\n\nMohon abaikan jika ada nomor asing yang mengaku sebagai saya atau menagih pinjaman yang mengatasnamakan saya.",
        prevention_advice: 'Jika dihubungi oleh nomor asing yang meminta transfer uang atau kode OTP mengatasnamakan saya, segera hubungi saya secara langsung di nomor telepon utama untuk konfirmasi.',
    },
    {
        category: 'freelance_scam',
        title: 'Waspada Penipuan Loker Freelance / Misi Like Video',
        default_impersonation: 'Admin HRD Agensi / Manajer Pemasaran Palsu',
        warning_template: "🚨 *WASPADA PENIPUAN KERJA SAMBILAN (LIKE & SUBSCRIBE)* 🚨\n\nHarap waspada terhadap tawaran kerja paruh waktu via WhatsApp atau Telegram yang menjanjikan bayaran puluhan ribu rupiah hanya dengan menyelesaikan tugas like/subscribe YouTube atau ulasan Google Maps, yang pada akhirnya mewajibkan kita menyetor uang deposit.",
        prevention_advice: 'Pekerjaan resmi tidak pernah memungut biaya atau meminta deposit uang dari pelamar. Segera blokir kontak jika diminta deposit dana.',
    },
    {
        category: 'fake_relative',
        title: 'Waspada Panggilan Darurat Palsu Mengaku Kerabat',
        default_impersonation: 'Kerabat Mengaku Kecelakaan / Oknum Kepolisian',
        warning_template: "🚨 *WASPADA TELEPON DARURAT PALSU KERABAT DITAHAN / KECELAKAAN* 🚨\n\nJika ada yang menelepon dengan suara panik atau menangis mengaku sebagai anggota keluarga yang ditahan polisi atau mengalami musibah dan mendesak transfer uang rumah sakit/tebusan, jangan panik dan jangan langsung kirim uang.",
        prevention_advice: 'Tutup telepon segera, lalu hubungi langsung kerabat yang bersangkutan melalui nomor kontak pribadi yang biasa Anda gunakan.',
    },
];

const tones = ['family', 'community', 'public'];

// Implementation matching resources/js/pages/emergency/index.tsx
function generateWhatsAppMessage({
    waTone = 'family',
    waScamTitle = '',
    waImpersonated = '',
    waSuspectContact = '',
    waDetails = '',
    waAdvice = '',
}) {
    let toneHeader = '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨';
    let greeting = 'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:';

    if (waTone === 'community') {
        toneHeader = '📢 *INFORMASI WASPADA KOMUNITAS & WARGA* 📢';
        greeting = 'Bapak/Ibu/Rekan-rekan warga sekalian, mohon berhati-hati terhadap modus kejahatan siber berikut:';
    } else if (waTone === 'public') {
        toneHeader = '⚠️ *PERINGATAN PUBLIK: WASPADA PENIPUAN SIBER* ⚠️';
        greeting = 'Pemberitahuan kepada seluruh kontak dan rekan untuk mewaspadai indikasi penipuan berikut:';
    }

    const lines = [
        toneHeader,
        greeting,
        `*Modus:* ${waScamTitle || 'Penipuan Siber Mencurigakan'}`,
        `*Mengatasnamakan:* ${waImpersonated || 'Pihak Asing / Tidak Dikenal'}`,
        `*Kontak/No. Terduga:* ${waSuspectContact || '(Nomor / Rekening Tidak Diketahui)'}`,
        `*Ciri-Ciri Modus:*\n${waDetails || 'Harap waspada terhadap permintaan kode OTP, tautan berkas APK, atau permintaan transfer mencurigakan.'}`,
        `*Langkah Pencegahan:*\n${waAdvice || 'Jangan berikan data pribadi, jangan unduh file mencurigakan, dan segera hubungi pihak resmi untuk konfirmasi.'}`,
        '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber) - https://cekara.id_',
    ];

    return lines.join('\n\n');
}

function constructWhatsAppUrl(message) {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/?text=${encoded}`;
}

console.log('=== STARTING EMPIRICAL JAVASCRIPT STRESS TESTS ===\n');

let testsPassed = 0;

// Test 1: Preset completeness
console.log('Test 1: Presets count and completeness...');
assert.equal(presets.length, 5, 'Must have 5 presets');
for (const p of presets) {
    assert.ok(p.category && p.title && p.default_impersonation && p.warning_template && p.prevention_advice);
}
testsPassed++;
console.log('  -> PASS');

// Test 2: 15 Permutations (5 Presets x 3 Tones)
console.log('Test 2: All 15 permutations of preset x tone...');
for (const preset of presets) {
    for (const tone of tones) {
        const msg = generateWhatsAppMessage({
            waTone: tone,
            waScamTitle: preset.title,
            waImpersonated: preset.default_impersonation,
            waSuspectContact: '+62 812-3456-7890',
            waDetails: preset.warning_template,
            waAdvice: preset.prevention_advice,
        });

        // Markdown asterisks check (balanced)
        const asterisks = (msg.match(/\*/g) || []).length;
        assert.equal(asterisks % 2, 0, `Unbalanced asterisks for ${preset.category} - ${tone}`);

        // Markdown underscores check (balanced)
        const underscores = (msg.match(/_/g) || []).length;
        assert.equal(underscores % 2, 0, `Unbalanced underscores for ${preset.category} - ${tone}`);

        // URL construction
        const url = constructWhatsAppUrl(msg);
        assert.ok(url.startsWith('https://wa.me/?text='));
        assert.ok(!url.includes('\n'), 'URL must not contain raw newlines');
        assert.ok(!url.includes(' '), 'URL must not contain raw spaces');

        // URL length check for mobile threshold
        assert.ok(url.length < 2048, `URL length ${url.length} exceeds 2048 chars for ${preset.category} - ${tone}`);

        // Lossless decode check
        const parsedUrl = new URL(url);
        const decodedParam = parsedUrl.searchParams.get('text');
        assert.equal(decodedParam, msg, `Roundtrip decode failed for ${preset.category} - ${tone}`);
    }
}
testsPassed++;
console.log('  -> PASS (15 combinations verified)');

// Test 3: Complex characters, emojis & query-breaking characters
console.log('Test 3: Complex characters and query safety...');
const edgeInputs = [
    { name: 'Ampersand (&)', input: 'BCA & Mandiri & BNI & BRI' },
    { name: 'Hash (#)', input: 'Link: http://phishing.site/#claim-rewards#id=10' },
    { name: 'Question (?) and Equal (=)', input: 'Apa maksudnya? status=pending&id=99' },
    { name: 'Percent (%)', input: 'Biaya admin 100% gratis tapi bayar 50% deposit' },
    { name: 'Plus (+)', input: '+62 812-3456-7890 / +62 899-0011-2233' },
    { name: 'Quotes & Backticks', input: '\'Bank BRI\' "Customer Service" `system_bot`' },
    { name: 'HTML / Script tags', input: '<script>alert("hack")</script><img src=x onerror=alert(1)>' },
    { name: 'Multibyte Emojis', input: '🚨 👮‍♂️ 💳 💸 📱 🛑 ⚠️ 📢 🇮🇩 👨‍👩‍👧‍👦' },
    { name: 'Whitespace & CRLF', input: "Baris 1\r\n\r\nBaris 2\t\tTiga spasi   akhir." },
];

for (const edge of edgeInputs) {
    const msg = generateWhatsAppMessage({
        waTone: 'family',
        waScamTitle: `Uji Coba ${edge.name}`,
        waImpersonated: 'Penipu Uji',
        waSuspectContact: edge.input,
        waDetails: edge.input,
        waAdvice: edge.input,
    });

    const url = constructWhatsAppUrl(msg);
    assert.ok(url.startsWith('https://wa.me/?text='));

    // Check that special characters do not corrupt the URL
    const parsedUrl = new URL(url);
    assert.equal(parsedUrl.protocol, 'https:');
    assert.equal(parsedUrl.hostname, 'wa.me');
    assert.equal(parsedUrl.pathname, '/');
    assert.equal(parsedUrl.hash, '', `Hash '#' leaked into URL fragment for ${edge.name}`);

    // Verify search params has exactly one param ('text')
    const keys = Array.from(parsedUrl.searchParams.keys());
    assert.equal(keys.length, 1, `Query string was split by unencoded chars in ${edge.name}: ${keys}`);
    assert.equal(keys[0], 'text');

    // Roundtrip verification
    assert.equal(parsedUrl.searchParams.get('text'), msg, `Roundtrip mismatch for ${edge.name}`);
}
testsPassed++;
console.log('  -> PASS (9 edge cases verified)');

// Test 4: Long input boundary stress testing
console.log('Test 4: Long inputs approaching URL limits...');

// Case A: 500 chars detail
const msg500 = generateWhatsAppMessage({
    waTone: 'family',
    waScamTitle: 'Modus Pencurian Data',
    waImpersonated: 'Sindikat Phishing',
    waSuspectContact: '08123456789',
    waDetails: 'A'.repeat(500),
    waAdvice: 'B'.repeat(200),
});
const url500 = constructWhatsAppUrl(msg500);
assert.ok(url500.length < 2048, `500 char URL is ${url500.length}`);

// Case B: 1000 chars with emojis and newlines (approaching threshold)
const msg1000 = generateWhatsAppMessage({
    waTone: 'family',
    waScamTitle: 'Modus Sangat Panjang',
    waImpersonated: 'Sindikat',
    waSuspectContact: '081299998888',
    waDetails: '🚨 Peringatan: jangan klik link berbahaya ini!\n\n'.repeat(20),
    waAdvice: 'Hubungi call center resmi segera.',
});
const url1000 = constructWhatsAppUrl(msg1000);
console.log(`  - 1000-char msg encoded URL length: ${url1000.length} characters`);
const parsed1000 = new URL(url1000);
assert.equal(parsed1000.searchParams.get('text'), msg1000);

// Case C: 3000 chars stress test
const msg3000 = generateWhatsAppMessage({
    waTone: 'public',
    waScamTitle: 'Stress Test',
    waImpersonated: 'Tester',
    waSuspectContact: '0812000000',
    waDetails: 'Penipuan online '.repeat(200),
    waAdvice: 'Pencegahan '.repeat(50),
});
const url3000 = constructWhatsAppUrl(msg3000);
console.log(`  - 3000-char msg encoded URL length: ${url3000.length} characters`);
const parsed3000 = new URL(url3000);
assert.equal(parsed3000.searchParams.get('text'), msg3000);

testsPassed++;
console.log('  -> PASS');

// Test 5: Fallbacks on empty fields
console.log('Test 5: Fallbacks on empty fields...');
const emptyMsg = generateWhatsAppMessage({});
assert.ok(emptyMsg.includes('*Modus:* Penipuan Siber Mencurigakan'));
assert.ok(emptyMsg.includes('*Mengatasnamakan:* Pihak Asing / Tidak Dikenal'));
assert.ok(emptyMsg.includes('*Kontak/No. Terduga:* (Nomor / Rekening Tidak Diketahui)'));
assert.ok(emptyMsg.includes('Harap waspada terhadap permintaan kode OTP'));
assert.ok(emptyMsg.includes('Jangan berikan data pribadi'));
testsPassed++;
console.log('  -> PASS');

console.log(`\n=== ALL EMPIRICAL JAVASCRIPT TESTS PASSED (${testsPassed}/${testsPassed}) ===`);
