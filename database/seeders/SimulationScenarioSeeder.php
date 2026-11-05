<?php

namespace Database\Seeders;

use App\Models\SimulationScenario;
use Illuminate\Database\Seeder;

class SimulationScenarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $scenarios = [
            [
                'title' => 'Surat Undangan Pernikahan Digital (.APK)',
                'slug' => 'surat-undangan-pernikahan-digital-apk',
                'category' => 'apk_malware',
                'difficulty' => 'mudah',
                'order' => 1,
                'sender_name' => '0821-4471-XXXX (Kontak Tak Dikenal)',
                'sender_avatar' => 'mail',
                'context_description' => 'Anda menerima pesan WhatsApp dari nomor asing yang mengaku sebagai kerabat keluarga dan mengirimkan dokumen pernikahan.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => 'Halo Kak, apa kabar? Kami bermaksud mengundang Kakak dan keluarga ke resepsi pernikahan kami minggu depan.',
                        'time' => '10:14',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Mohon maaf undangannya baru bisa kami kirim lewat digital ya Kak. Berikut surat undangannya, mohon dibuka dan dihadiri.',
                        'time' => '10:15',
                        'attachment' => [
                            'type' => 'file',
                            'name' => 'Surat_Undangan_Pernikahan.apk',
                            'size' => '6.4 MB',
                            'icon' => 'document',
                        ],
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Ditunggu konfirmasi kehadirannya ya Kak, terima kasih banyak!',
                        'time' => '10:16',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Langsung unduh dan pasang (install) file APK untuk melihat siapa yang menikah.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Sangat Berbahaya! File berekstensi .APK adalah aplikasi Android, bukan gambar atau dokumen undangan. Memasangnya akan memberikan izin malware SMS Fraud untuk mencuri kode OTP M-Banking Anda.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Tanyakan balik nama pengantin, lalu hapus pesan dan blokir nomor jika berbelit-belit.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Keputusan Tepat! Undangan digital asli selalu berupa tautan web (HTML/link browser) atau gambar/PDF, tidak pernah meminta penginstalan aplikasi Android (.APK). Menolak instalasi melindungi perangkat Anda.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Kirimkan file tersebut ke teman untuk minta tolong dibukakan.',
                        'is_safe' => false,
                        'score' => 20,
                        'explanation' => 'Berisiko! Meneruskan file malware berbahaya ke orang lain justru membahayakan keamanan teman atau keluarga Anda.',
                    ],
                ],
                'psychological_tricks' => [
                    'Rasa Sungkan & Norma Sosial (merasa tidak enak jika tidak membuka undangan)',
                    'Rasa Penasaran Tinggi (siapa kenalan yang sedang menikah)',
                    'Penyamaran Ekstensi Berkas (mengaku surat undangan padahal format aplikasi Android .APK)',
                ],
                'red_flags' => [
                    'Nomor pengirim tidak tersimpan di buku telepon.',
                    'Berkas menggunakan ekstensi executable .APK, bukan format PDF atau link web.',
                    'Pengirim tidak menyebutkan identitas nama dirinya atau mempelai secara spesifik di teks pesan.',
                ],
                'prevention_advice' => 'Jangan pernah memasang file .APK yang dikirim lewat chat WhatsApp dari nomor tak dikenal. Undangan pernikahan resmi biasanya berupa tautan web atau PDF tanpa perlu izin akses ponsel.',
            ],
            [
                'title' => 'Tawaran Kerja Freelance Like & Subscribe Berbayar',
                'slug' => 'tawaran-kerja-freelance-like-subscribe',
                'category' => 'fake_job',
                'difficulty' => 'sedang',
                'order' => 2,
                'sender_name' => 'HR Talent Global Agency (via Telegram)',
                'sender_avatar' => 'briefcase',
                'context_description' => 'Anda dihubungi oleh seseorang yang mengaku representatif agensi pemasaran digital terkemuka dan menawarkan pekerjaan sampingan dengan penghasilan fantastis.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => 'Halo kak! Kami dari Agensi Mitra TikTok & YouTube Global. Kami melihat profil Anda sangat cocok untuk program promosi kami.',
                        'time' => '14:02',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Tugasnya sangat mudah: Cukup tonton dan like video TikTok/YouTube selama 10 detik, lalu screenshot. Anda akan dibayar Rp 25.000 per video. Sehari bisa dapat Rp 500.000 - Rp 2.500.000!',
                        'time' => '14:03',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Untuk tugas awal, kami sudah transfer komisi trial Rp 30.000 ke e-wallet Anda. Untuk tugas VIP berikutnya dengan komisi 5x lipat, silakan deposit modal awal Rp 300.000 ke rekening bendahara kami ya.',
                        'time' => '14:05',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Kirim deposit Rp 300.000 karena di awal mereka sudah terbukti membayar komisi kecil Rp 30.000.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Sangat Berbahaya! Ini adalah modus klasik "Task Scam". Penipu sengaja memberi uang kecil di awal untuk memancing kepercayaan, lalu meminta deposit uang yang semakin besar dan tidak akan pernah bisa ditarik kembali.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Ambil uang Rp 30.000 pertama lalu langsung blokir nomor penipu dan jangan pernah transfer uang sepeserpun.',
                        'is_safe' => true,
                        'score' => 90,
                        'explanation' => 'Pilihan Cerdas! Anda menyadari tanda bahaya deposit modal. Prinsip utama: Pekerjaan yang sah membayar karyawan, bukan meminta pelamar menyetor deposit uang terlebih dahulu.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Tanyakan apakah bisa dicicil depositnya dan negosiasi komisi.',
                        'is_safe' => false,
                        'score' => 30,
                        'explanation' => 'Kurang Tepat! Terus bernegosiasi membuat penipu terus melancarkan manipulasi rekayasa sosial sampai Anda lengah.',
                    ],
                ],
                'psychological_tricks' => [
                    'Umpan Kepercayaan Awal (membayar komisi kecil untuk membuktikan kredibilitas semu)',
                    'Keserakahan & Harapan Finansial Cepat (iming-iming jutaan rupiah hanya dengan sentuhan jari)',
                    'Tekanan Tingkatan VIP (menciptakan ilusi kesempatan langka)',
                ],
                'red_flags' => [
                    'Imbalan kerja yang tidak masuk akal untuk tugas yang sangat sepele.',
                    'Diharuskan menyetor deposit uang pribadi untuk membuka tugas baru.',
                    'Komunikasi dialihkan ke grup Telegram dengan banyak akun anonim yang diduga bot/komplotan.',
                ],
                'prevention_advice' => 'Ingat aturan emas pencari kerja: Perusahaan manapun yang mewajibkan Anda mentransfer sejumlah uang sebagai syarat bekerja adalah 100% indikasi penipuan.',
            ],
            [
                'title' => 'Peringatan Pemblokiran M-Banking & Tautan Verifikasi',
                'slug' => 'peringatan-pemblokiran-m-banking-tautan-verifikasi',
                'category' => 'phishing_banking',
                'difficulty' => 'sulit',
                'order' => 3,
                'sender_name' => 'INFO-BANK-RESMI (SMS Sender ID)',
                'sender_avatar' => 'building',
                'context_description' => 'Sebuah SMS masuk dengan sender ID yang tampak formal, menyatakan ada transaksi mencurigakan dan akun Anda akan dibekukan jika tidak segera diverifikasi.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => '[PERINGATAN RESMI] Sistem mendeteksi aktivitas mencurigakan dari perangkat tidak dikenal pada akun Anda. Rekening Anda akan DIBEKUKAN dalam 1x24 jam.',
                        'time' => '19:40',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Segera batalkan transaksi dan amankan data Anda melalui tautan resmi verifikasi: https://bca-klik-keamanan.vip/login-verifikasi. Abaikan jika Anda memang melakukan transaksi.',
                        'time' => '19:41',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Klik tautan tersebut dan segera masukkan User ID, PIN, serta nomor kartu ATM untuk membatalkan pemblokiran.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Fatal! Tautan tersebut adalah situs web phishing tiruan. Begitu Anda memasukkan User ID dan PIN pada halaman palsu tersebut, saldo rekening Anda akan langsung dikuras.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Jangan klik tautan apapun. Buka langsung aplikasi m-Banking resmi di ponsel atau telepon Halo BCA/Call Center resmi.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Tindakan Sempurna! Selalu verifikasi status rekening melalui kanal resmi mandiri (buka aplikasi perbankan asli atau hubungi call center terverifikasi). Perhatikan domain URL mencurigakan (.vip bukan domain resmi bank).',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Balas SMS tersebut menanyakan transaksi apa yang mencurigakan.',
                        'is_safe' => false,
                        'score' => 40,
                        'explanation' => 'Kurang Efektif. SMS phishing otomatis biasanya tidak menerima balasan atau akan dijawab oleh komplotan penipu yang terus memandu Anda mengklik tautan.',
                    ],
                ],
                'psychological_tricks' => [
                    'Urgensi Ekstrem & Kepanikan (ancaman pemblokiran rekening dalam 24 jam)',
                    'Eksploitasi Rasa Takut Kehilangan Uang Tabungan',
                    'Otoritas Institusi Perbankan Palsu',
                ],
                'red_flags' => [
                    'Domain tautan bukan domain resmi (contoh: bca.co.id, bri.co.id), melainkan memakai akhiran aneh (.vip, .top, .site).',
                    'Bank resmi tidak pernah meminta nasabah memverifikasi data sensitif/PIN melalui tautan di SMS.',
                    'Penggunaan bahasa bernada panik dan memaksa.',
                ],
                'prevention_advice' => 'Jangan pernah memasukkan kredensial perbankan (PIN, Password, Kode OTP) pada tautan yang dikirim melalui SMS atau aplikasi chat.',
            ],
            [
                'title' => 'Teman Dekat Pinjam Saldo Darurat via Akun Kloning',
                'slug' => 'teman-dekat-pinjam-saldo-darurat-akun-kloning',
                'category' => 'social_engineering',
                'difficulty' => 'sedang',
                'order' => 4,
                'sender_name' => 'Dimas Pratama (Foto Profil Sama)',
                'sender_avatar' => 'user',
                'context_description' => 'Akun dengan foto dan nama teman sekolah Anda mengirimkan DM di media sosial meminta bantuan pinjaman uang kilat.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => 'Bro, lo lagi senggang gak? Urgent banget nih.',
                        'time' => '21:10',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Gue lagi di RS nemenin nyokap, tapi M-Banking gue error kena limit transfer. Boleh pinjem talangan 500 ribu dulu gak buat bayar obat? Besok pagi jam 8 gue balikin 600 ribu.',
                        'time' => '21:12',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Tolong transferin ke e-wallet RS ini ya: DANA 0857-1234-9999 a/n Kasir Darurat Medis.',
                        'time' => '21:13',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Langsung transfer ke nomor e-wallet yang diberikan karena tidak enak hati dan situasinya tampak darurat.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Sangat Berisiko! Modus pembajakan atau kloning akun sering memanfaatkan cerita darurat (rumah sakit, musibah) agar korban tidak sempat berpikir jernih dan segera mentransfer uang.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Telepon nomor seluler teman Anda langsung atau lakukan panggilan video sebelum mentransfer uang.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Langkah Guardian Terbaik! Verifikasi suara langsung (*two-way verification*) adalah penangkal paling efektif untuk modus impersonasi/kloning akun.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Minta foto KTP-nya terlebih dahulu via chat.',
                        'is_safe' => false,
                        'score' => 40,
                        'explanation' => 'Tidak Cukup Aman. Pelaku yang membajak akun seringkali sudah memiliki foto identitas korban di percakapan lama.',
                    ],
                ],
                'psychological_tricks' => [
                    'Empati & Solidaritas Pertemanan',
                    'Kondisi Darurat Medis Palsu untuk Menghilangkan Waktu Berpikir Kritis',
                    'Imbalan Tambahan Pengembalian',
                ],
                'red_flags' => [
                    'Nama pemilik rekening tujuan transfer berbeda dengan nama teman Anda.',
                    'Menolak ditelepon suara atau video call dengan alasan sedang di ruangan steril.',
                    'Pola bahasa atau gaya menyapa sedikit berbeda dari kebiasaan teman asli Anda.',
                ],
                'prevention_advice' => 'Selalu verifikasi panggilan suara (voice call) atau video call ke nomor pribadi teman Anda yang lama sebelum mengirim uang dalam situasi darurat.',
            ],
            [
                'title' => 'Pencairan Pinjaman Online Cepat Tanpa Agunan & Minta Biaya Admin',
                'slug' => 'pinjaman-online-cepat-biaya-admin-muka',
                'category' => 'loan_scam',
                'difficulty' => 'mudah',
                'order' => 5,
                'sender_name' => 'KSP Dana Sejahtera Mandiri',
                'sender_avatar' => 'banknote',
                'context_description' => 'Pesan WhatsApp menawarkan pinjaman dana tunai instan puluhan juta rupiah tanpa syarat BI checking.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => 'SELAMAT! Nomor Anda terpilih mendapatkan fasilitas pinjaman lunak Rp 20.000.000 dengan bunga 0.5% tanpa jaminan, pasti cair 10 menit.',
                        'time' => '09:00',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Pengajuan Anda sudah disetujui sistem. Sebelum dana dikirim ke rekening Anda, harap transfer biaya administrasi & asuransi pencairan Rp 350.000 terlebih dahulu.',
                        'time' => '09:02',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Transfer biaya admin Rp 350.000 agar pinjaman 20 juta segera cair.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Penipuan Mutlak! Pinjaman legal yang diawasi OJK tidak pernah meminta biaya admin ditransfer di muka oleh peminjam; biaya administrasi resmi selalu dipotong langsung dari pokok pinjaman yang dicairkan.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Abaikan, blokir kontak, dan laporkan nomor tersebut ke Kontak OJK 157.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Tindakan Tepat! Lembaga jasa keuangan resmi dilarang memasarkan penawaran pinjaman melalui SMS/WhatsApp pribadi tanpa persetujuan konsumen.',
                    ],
                ],
                'psychological_tricks' => [
                    'Pemanfaatan Kebutuhan Mendesak Finansial',
                    'Syarat Terlalu Mudah (tanpa agunan, bunga tidak realistis rendah)',
                    'Uang Muka Diminta di Awal (Advance Fee Fraud)',
                ],
                'red_flags' => [
                    'Ditawari pinjaman lewat pesan pribadi WhatsApp/SMS tanpa pernah mendaftar.',
                    'Meminta transfer biaya uang muka/administrasi sebelum pinjaman cair.',
                    'Mengklaim resmi OJK padahal nomor kontak berupa nomor ponsel pribadi.',
                ],
                'prevention_advice' => 'Cek legalitas pinjol di situs resmi OJK (ojk.go.id) atau WhatsApp OJK 081-157-157-157. Jangan pernah mentransfer uang muka untuk mendapatkan pinjaman.',
            ],
        ];

        foreach ($scenarios as $scenarioData) {
            SimulationScenario::updateOrCreate(
                ['slug' => $scenarioData['slug']],
                $scenarioData
            );
        }
    }
}
