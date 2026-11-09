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
            [
                'title' => 'Surat Tilang Elektronik (ETLE) Palsu Format .APK',
                'slug' => 'surat-tilang-elektronik-etle-apk',
                'category' => 'apk_malware',
                'difficulty' => 'sedang',
                'order' => 6,
                'sender_name' => 'Layanan ETLE Korlantas RI (0858-9211-XXXX)',
                'sender_avatar' => 'shield',
                'context_description' => 'Anda menerima pesan WhatsApp yang mengatasnamakan Kepolisian Lalu Lintas, menyatakan kendaraan Anda terekam kamera ETLE melakukan pelanggaran jalan raya.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => 'Pemberitahuan Pelanggaran Lalu Lintas: Kendaraan Anda terpantau melanggar batas kecepatan di jalan tol. Surat bukti pelanggaran & foto tilang telah terbit.',
                        'time' => '11:20',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Mohon buka berkas surat tilang digital terlampir Surat_Tilang_ETLE_2026.apk untuk melihat foto bukti dan menghindari blokir STNK dalam 24 jam.',
                        'time' => '11:21',
                        'attachment' => [
                            'type' => 'file',
                            'name' => 'Surat_Tilang_ETLE_2026.apk',
                            'size' => '6.8 MB',
                            'icon' => 'document',
                        ],
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Jika merasa tidak melakukan pelanggaran, harap segera konfirmasi melalui aplikasi tersebut.',
                        'time' => '11:22',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Langsung unduh dan pasang aplikasi Surat_Tilang_ETLE_2026.apk untuk mengecek foto plat nomor dan lokasi tilang.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Fatal! Kepolisian tidak pernah mengirimkan surat tilang dalam format aplikasi executable .APK via WhatsApp. File tersebut adalah malware peretas SMS/OTP perbankan yang akan menyedot rekening Anda.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Jangan unduh file tersebut. Cek keabsahan tilang kendaraan secara mandiri di web resmi etle-korlantas.info atau datang ke samsat/pos polisi terdekat.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Tindakan Tepat! Surat konfirmasi tilang ETLE resmi selalu dikirim melalui pos fisik oleh Korlantas atau diakses via portal resmi etle-korlantas.info, bukan dikirim via pesan singkat WhatsApp berformat .APK.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Meneruskan file APK ke rekan kantor atau grup chat untuk minta tolong dibukakan.',
                        'is_safe' => false,
                        'score' => 30,
                        'explanation' => 'Berbahaya! Meneruskan file malware berisiko terklik tanpa sengaja oleh orang lain di grup keluarga atau kantor.',
                    ],
                ],
                'psychological_tricks' => [
                    'Kepanikan Denda Hukum & Blokir STNK Kendaraan',
                    'Penyalahgunaan Identitas Otoritas Kepolisian',
                    'Urgensi Waktu Sempit (ancaman 24 jam)',
                ],
                'red_flags' => [
                    'Pesan dikirim dari nomor ponsel reguler 08XX, bukan akun centang hijau resmi Polri.',
                    'Ekstensi berkas berupa .APK (aplikasi Android), padahal surat resmi berupa dokumen fisik pos atau portal web.',
                    'Ancaman pemblokiran STNK mendadak tanpa mekanisme konfirmasi tilang yang sah.',
                ],
                'prevention_advice' => 'Surat tilang ETLE resmi dikirimkan langsung oleh pihak kepolisian via surat pos ke alamat pemilik kendaraan yang terdaftar, bukan melalui pesan WhatsApp dengan lampiran file .APK.',
            ],
            [
                'title' => 'Kloning Suara AI (Voice Clone) & Kabar Musibah Kerabat Ditangkap',
                'slug' => 'kloning-suara-ai-kerabat-kecelakaan',
                'category' => 'ai_deepfake',
                'difficulty' => 'sulit',
                'order' => 7,
                'sender_name' => 'Penyidik Iptu Hendra (Polres Metro) - 0812-9988-XXXX',
                'sender_avatar' => 'alert',
                'context_description' => 'Anda menerima panggilan telepon dengan latar suara tangisan mirip sekali dengan suara anak/kerabat Anda yang mengaku kena razia narkoba dan minta uang damai.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => '[Panggilan Suara Masuk] "Halo Bu/Pak! Dengar suara saya? Ini anak ibu..." (Terdengar suara tangisan mirip anak Anda: "Ibu tolong bu, aku kebawa teman, mobilnya ada razia...").',
                        'time' => '15:10',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Pria mengaku penyidik mengambil alih telepon: "Anak bapak/ibu ada di tahanan kami. Kalau mau diselesaikan kekeluargaan agar tidak dipenjara, transfer uang jaminan Rp 15.000.000 sekarang ke rekening kasir darurat dalam 15 menit! Jangan dimatikan teleponnya!"',
                        'time' => '15:12',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Panik dan langsung transfer Rp 15.000.000 ke rekening yang diberikan karena suara tangisannya terdengar persis seperti anak sendiri.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Sangat Berbahaya! Teknologi AI Voice Generator sekarang bisa meniru nada bicara dan intonasi seseorang hanya dari rekaman audio pendek di media sosial. Ini adalah pemerasan terencana.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Tenang dan terapkan "Kata Sandi Rahasia Keluarga", matikan telepon, lalu segera hubungi nomor pribadi anak Anda atau teman sekamarnya untuk memverifikasi lokasi aslinya.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Solusi Cerdas & Modern! Di era deepfake AI, memiliki kata sandi rahasia keluarga adalah pertahanan terkuat. Menutup telepon menghentikan manipulasi psikologis dan memberi waktu untuk verifikasi nyata.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Minta diskon uang damai menjadi Rp 5.000.000 karena saldo tabungan tidak cukup.',
                        'is_safe' => false,
                        'score' => 20,
                        'explanation' => 'Salah Kaprah! Bernegosiasi membuktikan Anda sudah terperangkap tipu daya penipu dan mereka akan terus memeras sampai uang Anda habis.',
                    ],
                ],
                'psychological_tricks' => [
                    'Kepanikan Emosional Ekstrem (Anak terancam penjara/celaka)',
                    'Kloning Suara AI (Deepfake Audio) yang sangat meyakinkan',
                    'Larangan Mematikan Sambungan Telepon agar korban tidak sempat berpikir kritis',
                ],
                'red_flags' => [
                    'Penelepon memaksa tidak boleh mematikan sambungan telepon.',
                    'Meminta transfer uang ke rekening perorangan pribadi, bukan kas negara atau kantor kepolisian resmi.',
                    'Tekanan batas waktu sempit (15 menit) untuk mematikan akal sehat.',
                ],
                'prevention_advice' => 'Buatlah "Kata Sandi Rahasia Keluarga" yang hanya diketahui keluarga inti. Jika ada telepon darurat mencurigakan, minta penelepon menyebutkan kata sandi tersebut. Matikan telepon dan verifikasi langsung ke nomor pribadi yang bersangkutan.',
            ],
            [
                'title' => 'Manipulasi Stiker QRIS Tertimpa di Kasir & Kotak Amal',
                'slug' => 'qris-palsu-tertimpa-merchant',
                'category' => 'qris_fraud',
                'difficulty' => 'sedang',
                'order' => 8,
                'sender_name' => 'Stand Pembayaran Meja 12 (Kafe Kopi Senja)',
                'sender_avatar' => 'qrcode',
                'context_description' => 'Anda sedang berada di sebuah kafe dan ingin membayar tagihan pesanan menggunakan barcode QRIS yang tertempel di meja.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => '[Situasi Lapangan] Anda duduk di meja kafe "Kopi Senja". Di tent card meja tertempel stiker QRIS. Anda perhatikan stiker tersebut tampak baru dan ditempel menimpa stiker barcode lama yang sedikit terlihat di sudutnya.',
                        'time' => '13:00',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => '[Layar Ponsel saat Scan QRIS] Aplikasi perbankan membaca kode dan menampilkan konfirmasi pembayaran: Nama Merchant: "YAYASAN RESTORASI PEDULI DHARMA", Lokasi: "Jakarta Barat". Total tagihan belum terisi.',
                        'time' => '13:01',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Lanjutkan pembayaran dan masukkan PIN m-Banking karena mengira yayasan tersebut adalah badan usaha pemilik kafe.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Fatal! Uang Anda akan langsung masuk ke rekening komplotan penipu QRIS palsu. Pihak kafe tidak akan menerima pembayaran tersebut dan Anda tetap ditagih oleh kasir kafe.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Segera batalkan pembayaran, lalu konfirmasi ke kasir kafe untuk mencocokkan nama merchant resmi kafe atau bayar langsung di mesin kasir utama.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Langkah Sangat Tepat! Modus QRIS Tampering (menempel stiker barcode palsu di atas barcode asli merchant/kotak amal) sangat marak. Selalu periksa kesesuaian Nama Merchant di layar ponsel sebelum memasukkan PIN.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Tetap bayar tetapi transfer Rp 1.000 dulu untuk mengetes apakah kasir menerima notifikasi.',
                        'is_safe' => false,
                        'score' => 30,
                        'explanation' => 'Kurang Efektif. Kasir tetap tidak akan menerima notifikasi tersebut dan Anda membuang waktu serta saldo.',
                    ],
                ],
                'psychological_tricks' => [
                    'Kepraktisan & Asumsi Otomatis (menganggap semua barcode di meja pasti milik kafe)',
                    'Manipulasi Stiker Fisik (QRIS Tampering)',
                ],
                'red_flags' => [
                    'Stiker QRIS tampak menempel ganda atau memiliki tekstur berbeda dari papan akrilik merchant.',
                    'Nama penerima yang muncul di layar m-Banking sama sekali tidak sesuai dengan nama toko/kafe yang sedang dikunjungi.',
                    'Merchant berlokasi di kota yang berbeda jauh dari tempat Anda berada.',
                ],
                'prevention_advice' => 'Selalu luangkan waktu 3 detik untuk mengecek NAMA PENERIMA (Merchant Name) di layar konfirmasi aplikasi perbankan sebelum Anda menekan tombol bayar atau memasukkan PIN.',
            ],
            [
                'title' => 'Jastip Tiket Konser Musik & Rekber Palsu di Media Sosial',
                'slug' => 'jastip-tiket-konser-rekber-abal-abal',
                'category' => 'social_engineering',
                'difficulty' => 'sedang',
                'order' => 9,
                'sender_name' => 'TiketFastPass_ID (Akun X/Twitter 50rb Follower)',
                'sender_avatar' => 'ticket',
                'context_description' => 'Anda sedang mencari tiket konser musisi internasional yang tiket resminya sudah ludes (sold out) dan menemukan tawaran jastip di media sosial.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => 'Halo kak! Masih sisa 2 tiket CAT 1 Coldplay Jakarta harga normal + fee jastip cuma Rp 100.000. Alasan jual karena sepupu mendadak ada ujian dinas.',
                        'time' => '20:15',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Biar sama-sama aman dan tidak tipu-tipu, kita transaksi lewat Rekening Bersama (Rekber) terpercaya di Telegram ya kak: @RekberAdminNusantara (bisa dicek testimoninya ada ribuan).',
                        'time' => '20:17',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => 'Silakan transfer pelunasan Rp 3.600.000 ke rekening admin rekber. Setelah dana masuk, kode booking tiket langsung kami kirim dalam 5 menit.',
                        'time' => '20:19',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Langsung transfer ke rekening admin rekber telegram tersebut karena akunnya punya 50 ribu followers dan banyak testimoni screenshoot.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Fatal! Akun medsos bisa dibeli (followers dan testimoni palsu), dan admin "Rekber Telegram" tersebut adalah komplotan penipu itu sendiri. Setelah transfer, Anda akan langsung diblokir.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Tolak transaksi rekber anonim telegram. Hanya bersedia transaksi jika melalui platform e-commerce resmi yang memiliki sistem escrow legal (Tokopedia/Shopee/Blibli) atau bertemu langsung secara fisik (COD) di hari H.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Pilihan Matang & Aman! Rekber di Telegram sangat rawan dimanipulasi oleh sindikat penipu tiket calo. Menggunakan platform escrow yang diawasi hukum menjamin dana Anda tidak cair sebelum tiket terbukti sah.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Minta foto KTP penjual sambil memegang tulisan nama Anda sebelum transfer ke rekening rekber telegram.',
                        'is_safe' => false,
                        'score' => 35,
                        'explanation' => 'Tidak Menjamin! Penipu sering memakai foto KTP curian dari korban pinjol/loker bodong sebelumnya dan mengedit tulisan menggunakan software Photoshop/AI.',
                    ],
                ],
                'psychological_tricks' => [
                    'FOMO (Fear of Missing Out) kehabisan tiket konser idola',
                    'Kredibilitas Semu (Followers banyak & Testimoni bot di Telegram)',
                    'Ilusi Keamanan (Menawarkan Rekber padahal rekber bodong buatan sendiri)',
                ],
                'red_flags' => [
                    'Harga tiket yang ditawarkan terlalu murah di tengah kelangkaan pasar yang ekstrem.',
                    'Menolak escrow e-commerce resmi berizin dan memaksa memakai grup Rekber Telegram tertentu.',
                    'Testimoni hanya berupa screenshot gambar yang bisa dipalsukan dengan mudah.',
                ],
                'prevention_advice' => 'Hindari membeli tiket dari pihak kedua melalui transaksi non-resmi. Jika terpaksa, pastikan menggunakan platform e-commerce berizin atau bertemu langsung (COD) di venue tiket konser.',
            ],
            [
                'title' => 'Transfer Dana Nyasar dari Pinjol Ilegal (Jebakan Dana Siluman)',
                'slug' => 'transfer-dana-siluman-pinjol-ilegal',
                'category' => 'loan_scam',
                'difficulty' => 'sulit',
                'order' => 10,
                'sender_name' => '0895-3412-XXXX (Penagih DanaExpress)',
                'sender_avatar' => 'alert',
                'context_description' => 'Anda mendadak menerima notifikasi transfer dana dari rekening tak dikenal, disusul teror penagihan pinjol dengan bunga mencekik.',
                'chat_messages' => [
                    [
                        'sender' => 'scammer',
                        'text' => '[Notifikasi Mutasi Bank] Anda menerima transfer dana masuk sebesar Rp 1.500.000 dari "PT DIGITAL PINJAM SEJAHTERA". Anda tidak pernah mengajukan pinjaman apapun.',
                        'time' => '08:30',
                    ],
                    [
                        'sender' => 'scammer',
                        'text' => '[Pesan WhatsApp Masuk 2 Jam Kemudian] "Pemberitahuan Tagihan: Pinjaman dana Anda Rp 1.500.000 telah cair. Jatuh tempo 4 hari ke depan! Total wajib bayar kembali Rp 2.900.000. Jika telat, foto Anda akan kami sebar ke seluruh daftar kontak darurat Anda sebagai penipu!"',
                        'time' => '10:35',
                    ],
                ],
                'options' => [
                    [
                        'id' => 'A',
                        'text' => 'Segera transfer balik uang Rp 1.500.000 tersebut ke nomor rekening pribadi yang diberikan oleh penagih di pesan WhatsApp agar urusan cepat selesai.',
                        'is_safe' => false,
                        'score' => 20,
                        'explanation' => 'Berbahaya! Jika Anda mentransfer ke rekening penagih pribadi, sindikat pinjol ilegal tetap menganggap utang pokok Anda belum lunas dan akan terus meneror Anda untuk membayar denda bunga Rp 2.900.000.',
                    ],
                    [
                        'id' => 'B',
                        'text' => 'Gunakan uang tersebut untuk belanja atau melunasi kebutuhan lain karena menganggapnya rezeki transferan salah alamat.',
                        'is_safe' => false,
                        'score' => 0,
                        'explanation' => 'Sangat Fatal! Anda akan menjadi target pemerasan, doxxing, dan teror berkelanjutan ke seluruh relasi di kontak ponsel Anda.',
                    ],
                    [
                        'id' => 'C',
                        'text' => 'Jangan gunakan uang sepeserpun. Segera hubungi pihak bank resmi untuk memblokir/mengembalikan dana salah transfer, buat laporan resmi ke kepolisian & Satgas PASTI/OJK, serta jangan berkomunikasi dengan penagih liar.',
                        'is_safe' => true,
                        'score' => 100,
                        'explanation' => 'Prosedur Tepat & Tahan Hukum! Mengikuti SOP resmi perbankan dan OJK membuktikan Anda tidak pernah bersepakat meminjam dana. Pihak bank yang berhak melakukan retur dana secara resmi dan legal.',
                    ],
                ],
                'psychological_tricks' => [
                    'Teror & Ancaman Doxxing (Penyebaran data pribadi ke teman/keluarga)',
                    'Pemaksaan Utang Fiktif (Menciptakan kewajiban bayar dari transfer tanpa izin)',
                    'Batas Waktu Bunga Mencekik',
                ],
                'red_flags' => [
                    'Menerima dana tanpa pernah mendaftar atau menyetujui perjanjian pinjaman apapun.',
                    'Bunga pengembalian tidak masuk akal (hampir 100% dalam tempo 4 hari).',
                    'Penagihan disertai intimidasi kasar dan ancaman menyebarkan identitas ke kontak pribadi.',
                ],
                'prevention_advice' => 'Jika menerima dana salah transfer dari pihak tak dikenal: Jangan sentuh dan jangan belanjakan uang tersebut. Segera buat laporan tertulis ke bank Anda dan laporkan nomor teror ke Satgas PASTI OJK di kontak 157.',
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
