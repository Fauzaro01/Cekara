<?php

namespace Database\Seeders;

use App\Models\CommunityMessage;
use App\Models\CommunityMessageReaction;
use App\Models\CommunityRoom;
use App\Models\ScamPatternContribution;
use App\Models\User;
use Illuminate\Database\Seeder;

class CommunityRadarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patterns = [
            [
                'title' => 'Stiker QRIS Statis Palsu Menimpa Kotak Amal & Kasir Kafe',
                'category' => 'social_engineering',
                'platform' => 'QRIS Fisik / Offline',
                'location' => 'Jakarta Selatan, DKI Jakarta',
                'description' => 'Pelaku menempelkan stiker barcode QRIS miliknya sendiri di atas QRIS resmi merchant/tempat ibadah. Saat korban memindai untuk membayar atau berdonasi, dana masuk ke rekening pribadi penipu bernama rekening yang dimirip-miripkan.',
                'evidence_text' => 'Nama merchant di struk/aplikasi berbeda dari nama toko asli (contoh: Toko Kopi Sejati vs Restorasi Masjid Sejati). Tidak ada konfirmasi notifikasi di mesin kasir toko.',
                'is_verified' => true,
                'upvotes_count' => 142,
            ],
            [
                'title' => 'Surat Konfirmasi Tilang Elektronik (ETLE) Berformat Surat_Tilang.apk',
                'category' => 'apk_malware',
                'platform' => 'WhatsApp',
                'location' => 'Surabaya, Jawa Timur',
                'description' => 'Pesan WhatsApp dari nomor seluler asing mengaku dari Korlantas Polri mengabarkan kendaraan Anda melanggar marka jalan. Korban diminta memasang aplikasi Surat_Tilang.apk untuk melihat foto bukti tilang. Begitu dipasang, malware menyadap SMS OTP m-banking.',
                'evidence_text' => 'Pemberitahuan resmi ETLE: Surat Konfirmasi Pelanggaran Lalu Lintas No. 4910/ETLE. Harap unduh dan buka berkas Surat_Tilang_ETLE.apk untuk melihat jadwal sidang.',
                'is_verified' => true,
                'upvotes_count' => 318,
            ],
            [
                'title' => 'Akun CS Bank Palsu di Media Sosial Menghubungi Korban yang Sedang Komplain',
                'category' => 'phishing_banking',
                'platform' => 'X (Twitter) & Instagram',
                'location' => 'Bandung, Jawa Barat',
                'description' => 'Saat nasabah menulis keluhan terbuka di akun resmi bank, bot penipu langsung mengirim DM atau balasan memakai avatar dan nama menyerupai bank resmi (tanpa centang verifikasi). Penipu mengarahkan nasabah ke nomor WhatsApp abal-abal dan meminta nomor kartu debit, CVV, serta OTP.',
                'evidence_text' => 'Halo Kak, mohon maaf atas ketidaknyamanannya. Untuk percepatan kendala transaksi Kakak, silakan hubungi Customer Care Pusat kami via WhatsApp: 0858-XXXX-XXXX.',
                'is_verified' => true,
                'upvotes_count' => 205,
            ],
            [
                'title' => 'Grup Freelance Telegram Komisi Review Google Maps & Like Video',
                'category' => 'fake_job',
                'platform' => 'Telegram',
                'location' => 'Yogyakarta, DIY',
                'description' => 'Korban dimasukkan ke grup Telegram kerja sampingan. Awalnya diberi komisi Rp 30.000 untuk tugas memberi rating bintang 5 di Google Maps. Setelah itu, korban diwajibkan menyetor deposit "dana talangan misi VIP" mulai Rp 500.000 hingga puluhan juta yang akhirnya tidak bisa ditarik.',
                'evidence_text' => 'Selamat, komisi tugas 1 & 2 telah cair ke DANA Anda! Untuk tugas Reward Super 3 dengan keuntungan 30%, silakan pilih paket deposit mulai Rp 1.000.000 ke rekening Bendahara.',
                'is_verified' => true,
                'upvotes_count' => 289,
            ],
            [
                'title' => 'Panggilan Video Call Singkat dengan AI Face Swap Mengaku Kerabat Dekat',
                'category' => 'social_engineering',
                'platform' => 'WhatsApp Video Call',
                'location' => 'Medan, Sumatera Utara',
                'description' => 'Pelaku melakukan video call selama beberapa detik memperlihatkan wajah kerabat (hasil rekaman video medsos yang dimanipulasi AI) dengan alasan sinyal buruk, lalu mematikan panggilan dan beralih ke chat teks meminjam uang secara mendesak.',
                'evidence_text' => 'Tadi liat gue lagi di bandara koper ketahan? Sinyal putus-putus nih bro, tolong transferin 2 juta dulu ke temen gue, ntar nyampe rumah gue ganti.',
                'is_verified' => true,
                'upvotes_count' => 97,
            ],
            [
                'title' => 'Undian Berhadiah Mengatasnamakan E-Commerce dengan Domain .site Palsu',
                'category' => 'fake_giveaway',
                'platform' => 'SMS',
                'location' => 'Semarang, Jawa Tengah',
                'description' => 'SMS massal mengabarkan nomor Anda memenangkan mobil atau cek tunai ratusan juta dari undian festival belanja. Tautan mengarah ke situs web tiruan dengan logo e-commerce resmi yang meminta data KTP, nomor rekening, dan biaya asuransi pemenang.',
                'evidence_text' => 'Selamat! Nomor Anda terpilih pemenang Gebyar Hadiah Shopee/Tokopedia PIN: 829K91. Klaim hadiah Anda di: https://gebyar-promo-belanja2026.site.',
                'is_verified' => true,
                'upvotes_count' => 174,
            ],
        ];

        foreach ($patterns as $pattern) {
            ScamPatternContribution::updateOrCreate(
                ['title' => $pattern['title']],
                $pattern
            );
        }

        $moderator = User::firstOrCreate(
            ['email' => 'moderator@cekara.id'],
            [
                'name' => 'Tim Kurator Guardian',
                'password' => 'password123',
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        $memberOne = User::firstOrCreate(
            ['email' => 'rina.waspada@cekara.id'],
            [
                'name' => 'Rina Pratiwi',
                'password' => 'password123',
                'is_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        $memberTwo = User::firstOrCreate(
            ['email' => 'budi.santoso@cekara.id'],
            [
                'name' => 'Budi Santoso',
                'password' => 'password123',
                'is_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        $roomOne = CommunityRoom::updateOrCreate(
            ['slug' => 'waspada-modus-apk-kurir-undangan-tilang'],
            [
                'user_id' => $moderator->id,
                'title' => 'Waspada Modus File .APK (Kurir Paket, Undangan Nikah & Surat Tilang)',
                'category' => 'apk_malware',
                'description' => 'Ruang diskusi real-time untuk berbagi tangkapan layar, nomor pengirim, dan cara memulihkan HP yang tidak sengaja menginstal file .APK berbahaya.',
                'is_pinned' => true,
            ]
        );

        if ($roomOne->messages()->count() === 0) {
            $msg1 = CommunityMessage::create([
                'community_room_id' => $roomOne->id,
                'user_id' => $moderator->id,
                'body' => "Halo rekan-rekan **Komunitas Guardian Cekara**! 🛡️\n\nDi ruang diskusi ini Anda dapat:\n- Mengirim pesan berformat **Markdown** (`**tebal**`, `*miring*`, `` `kode` ``, kutipan `>`, dan daftar)\n- Mengunggah **gambar bukti tangkapan layar** chat/SMS mencurigakan\n- Memberikan **Like (👍)** atau **Reaksi Emoji** langsung dari tombol cepat maupun **ketik emoji dari keyboard perangkat Anda** (`Win + .` atau keyboard HP)\n\n> **Tips Darurat:** Jika telanjur mengklik file `.apk`, segera matikan Wi-Fi & Data Seluler (aktifkan *Airplane Mode*) sebelum menghapus aplikasi tersebut!",
            ]);

            $msg2 = CommunityMessage::create([
                'community_room_id' => $roomOne->id,
                'user_id' => $memberOne->id,
                'body' => "Baru saja pagi ini ibu saya dapat WA dari nomor tidak dikenal mengirimkan file:\n` Foto_Resi_JNE_Reguler.apk `\n\nUntung langsung saya cek di **Mesin Pemindai Cekara** dan muncul peringatan **BAHAYA KRITIS**. Jangan pernah buka file dengan akhiran `.apk` dari WhatsApp!",
            ]);

            CommunityMessageReaction::firstOrCreate([
                'community_message_id' => $msg1->id,
                'user_id' => $memberOne->id,
                'emoji' => '👍',
            ]);
            CommunityMessageReaction::firstOrCreate([
                'community_message_id' => $msg1->id,
                'user_id' => $memberTwo->id,
                'emoji' => '🛡️',
            ]);
            CommunityMessageReaction::firstOrCreate([
                'community_message_id' => $msg2->id,
                'user_id' => $moderator->id,
                'emoji' => '👍',
            ]);
            CommunityMessageReaction::firstOrCreate([
                'community_message_id' => $msg2->id,
                'user_id' => $memberTwo->id,
                'emoji' => '🔥',
            ]);
        }

        $roomTwo = CommunityRoom::updateOrCreate(
            ['slug' => 'verifikasi-rekening-dan-tautan-phishing-perbankan'],
            [
                'user_id' => $memberTwo->id,
                'title' => 'Diskusi Tautan Phishing Perbankan & Perubahan Tarif Transfer Rp150.000/Bulan',
                'category' => 'phishing_banking',
                'description' => 'Bahas temuan domain palsu yang meniru situs internet banking dan modus surat perubahan tarif transaksi BI-FAST.',
                'is_pinned' => false,
            ]
        );

        if ($roomTwo->messages()->count() === 0) {
            $msg3 = CommunityMessage::create([
                'community_room_id' => $roomTwo->id,
                'user_id' => $memberTwo->id,
                'body' => "**Peringatan Modus Perubahan Tarif Bank!** ⚠️\n\nBanyak beredar pesan WhatsApp berisi gambar surat resmi palsu soal perubahan tarif transfer dari `Rp 6.500` menjadi `Rp 150.000/bulan` otomatis dipotong kecuali mengisi formulir pembatalan.\n\n```text\nCiri situs palsu:\n1. Domain berakhiran .my.id, .cfd, .top, atau .site\n2. Meminta PIN, Password, dan Kode OTP SMS\n```",
            ]);

            CommunityMessageReaction::firstOrCreate([
                'community_message_id' => $msg3->id,
                'user_id' => $moderator->id,
                'emoji' => '👍',
            ]);
            CommunityMessageReaction::firstOrCreate([
                'community_message_id' => $msg3->id,
                'user_id' => $memberOne->id,
                'emoji' => '⚠️',
            ]);
        }
    }
}
