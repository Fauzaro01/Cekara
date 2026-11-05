<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FamilyGuardianController extends Controller
{
    /**
     * Display the family guardian toolkit and vulnerability quiz.
     */
    public function index(): Response
    {
        $cheatSheets = [
            [
                'id' => 1,
                'title' => 'Mengaku Teman/Anak Ganti Nomor & Pinjam Uang',
                'category' => 'Rekayasa Sosial',
                'summary' => 'Penipu memasang foto profil kerabat dan mengaku HP rusak, lalu meminta transfer darurat.',
                'red_flags' => [
                    'Nomor asing menyapa akrab seolah sudah lama kenal.',
                    'Meminta uang dengan nada panik atau buru-buru.',
                    'Rekening tujuan transfer bukan atas nama kerabat yang dimaksud.',
                ],
                'action_rule' => 'Telepon langsung nomor lama kerabat tersebut. Jangan pernah transfer sebelum mendengar suara aslinya.',
            ],
            [
                'id' => 2,
                'title' => 'Pesan Berkas Format .APK (Undangan / Foto Paket)',
                'category' => 'Malware HP',
                'summary' => 'Penipu mengirim berkas aplikasi Android (.APK) berkedok foto surat undangan atau paket kurir.',
                'red_flags' => [
                    'Nama berkas berakhiran .apk (bukan .pdf atau .jpg).',
                    'Mengirim berkas tanpa ada obrolan sebelumnya.',
                    'Meminta izin akses SMS dan notifikasi saat dibuka.',
                ],
                'action_rule' => 'Jangan pernah klik atau pasang file .APK dari WhatsApp. Foto dan undangan asli tidak pernah meminta penginstalan aplikasi.',
            ],
            [
                'id' => 3,
                'title' => 'Telepon Mengaku Petugas Bank / Polisi / Bea Cukai',
                'category' => 'Otoritas Palsu',
                'summary' => 'Penipu menggertak korban dengan tuduhan rekening bermasalah, narkoba, atau paket tertahan.',
                'red_flags' => [
                    'Menelepon via nomor WhatsApp atau nomor seluler pribadi.',
                    'Melarang Anda mematikan telepon atau berdiskusi dengan keluarga.',
                    'Meminta kode OTP, nomor kartu ATM, atau PIN rahasia.',
                ],
                'action_rule' => 'Matikan telepon segera. Bank dan kepolisian resmi tidak pernah meminta kode OTP atau PIN kepada nasabah.',
            ],
            [
                'id' => 4,
                'title' => 'Undian Berhadiah & Promo Sembako Murah Tak Masuk Akal',
                'category' => 'Uang Muka Fiktif',
                'summary' => 'Iming-iming hadiah mobil atau tebus murah sembako dengan syarat mentransfer biaya admin di awal.',
                'red_flags' => [
                    'Menang undian padahal tidak pernah mendaftar program apapun.',
                    'Meminta uang muka untuk pencairan hadiah atau biaya kurir.',
                    'Rekening tujuan menggunakan rekening perorangan pribadi.',
                ],
                'action_rule' => 'Abaikan dan hapus. Undian resmi tidak pernah memungut biaya transfer di muka kepada pemenang.',
            ],
            [
                'id' => 5,
                'title' => 'Aturan Emas 3T untuk Orang Tua & Keluarga',
                'category' => 'Panduan Inti',
                'summary' => 'Prinsip pertahanan sederhana 3 langkah yang mudah diingat setiap anggota keluarga di rumah.',
                'red_flags' => [
                    '1. TENANG: Jangan panik saat membaca pesan mendesak atau kabar musibah.',
                    '2. TELEPON LANGSUNG: Hubungi orang yang bersangkutan lewat panggilan suara biasa.',
                    '3. TANYA ANAK/GUARDIAN: Jika ragu, tunjukkan pesan tersebut kepada anak muda di rumah.',
                ],
                'action_rule' => 'Jadikan anak muda di rumah sebagai Guardian Digital keluarga Anda.',
            ],
        ];

        $quizQuestions = [
            [
                'id' => 1,
                'question' => 'Anda menerima pesan WhatsApp dari nomor baru berfoto anak Anda, mengabarkan HP-nya hilang dan meminta transfer uang kos 1 juta ke rekening temannya. Tindakan Anda?',
                'options' => [
                    ['id' => 'A', 'text' => 'Langsung transfer karena kasihan anak sedang kesulitan di perantauan.', 'score' => 0],
                    ['id' => 'B', 'text' => 'Telepon suara ke nomor lama anak atau hubungi kerabat/teman satu kosnya terlebih dahulu.', 'score' => 20],
                    ['id' => 'C', 'text' => 'Balas chat menanyakan kenapa bisa hilang.', 'score' => 10],
                ],
            ],
            [
                'id' => 2,
                'question' => 'Muncul SMS menyatakan ada kiriman paket dari kurir, dan ada lampiran file Lihat_Foto_Barang.apk. Apa yang Anda lakukan?',
                'options' => [
                    ['id' => 'A', 'text' => 'Hapus pesan dan jangan pernah klik file tersebut karena berekstensi .APK (aplikasi berbahaya).', 'score' => 20],
                    ['id' => 'B', 'text' => 'Klik buka file untuk mengecek barang apa yang dikirim kurir.', 'score' => 0],
                    ['id' => 'C', 'text' => 'Kirim file tersebut ke grup WhatsApp keluarga menanyakan ini paket siapa.', 'score' => 5],
                ],
            ],
            [
                'id' => 3,
                'question' => 'Seseorang menelepon mengaku dari Customer Service Bank Anda menyatakan kartu ATM diblokir, lalu meminta Anda membacakan 6 digit kode angka yang masuk di SMS. Tindakan Anda?',
                'options' => [
                    ['id' => 'A', 'text' => 'Tolak memberikan kode tersebut dan segera matikan telepon karena itu kode OTP rahasia.', 'score' => 20],
                    ['id' => 'B', 'text' => 'Bacakan kodenya agar kartu ATM tidak jadi diblokir.', 'score' => 0],
                    ['id' => 'C', 'text' => 'Minta petugas tersebut menyebutkan nomor rekening Anda dulu baru Anda beri kodenya.', 'score' => 5],
                ],
            ],
            [
                'id' => 4,
                'question' => 'Anda melihat promo minyak goreng murah Rp 10.000 per 2 liter di Facebook, tetapi harus transfer langsung ke nomor rekening BRI pribadi atas nama perorangan. Apa keputusan Anda?',
                'options' => [
                    ['id' => 'A', 'text' => 'Beli banyak sekaligus mumpung sedang diskon besar-besaran.', 'score' => 0],
                    ['id' => 'B', 'text' => 'Abaikan karena harga tidak masuk akal dan rekening tujuan bukan toko resmi (indikasi penipuan).', 'score' => 20],
                    ['id' => 'C', 'text' => 'Coba transfer untuk 1 botol dulu untuk coba-coba.', 'score' => 5],
                ],
            ],
            [
                'id' => 5,
                'question' => 'Saat ingin membayar infak masjid atau belanja di warung, Anda melihat stiker barcode QRIS tertimpa stiker baru yang sedikit miring dengan nama toko yang aneh. Tindakan Anda?',
                'options' => [
                    ['id' => 'A', 'text' => 'Konfirmasi ke kasir atau pengurus masjid apakah QRIS tersebut asli sebelum memindai.', 'score' => 20],
                    ['id' => 'B', 'text' => 'Langsung scan dan bayar tanpa memeriksa nama penerima yang muncul di layar HP.', 'score' => 0],
                    ['id' => 'C', 'text' => 'Foto kodenya dan bayar nanti di rumah.', 'score' => 5],
                ],
            ],
        ];

        return Inertia::render('family/index', [
            'cheatSheets' => $cheatSheets,
            'quizQuestions' => $quizQuestions,
        ]);
    }

    /**
     * Submit and evaluate the family vulnerability assessment quiz.
     */
    public function submitQuiz(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['required', 'string'],
        ]);

        $scoreMap = [
            1 => ['A' => 0, 'B' => 20, 'C' => 10],
            2 => ['A' => 20, 'B' => 0, 'C' => 5],
            3 => ['A' => 20, 'B' => 0, 'C' => 5],
            4 => ['A' => 0, 'B' => 20, 'C' => 5],
            5 => ['A' => 20, 'B' => 0, 'C' => 5],
        ];

        $totalScore = 0;
        foreach ($validated['answers'] as $qId => $chosen) {
            $qNum = (int) $qId;
            $opt = strtoupper(trim($chosen));
            if (isset($scoreMap[$qNum][$opt])) {
                $totalScore += $scoreMap[$qNum][$opt];
            }
        }

        if ($totalScore >= 80) {
            $level = 'Tinggi (Keluarga Anda Sangat Waspada & Sulit Ditipu)';
            $verdict = 'Luar biasa! Pengetahuan literasi keamanan digital keluarga Anda sudah berada di tingkat Guardian yang aman.';
            $badgeColor = 'safe';
        } elseif ($totalScore >= 50) {
            $level = 'Sedang (Cukup Paham Namun Masih Berisiko Pada Modus Baru)';
            $verdict = 'Keluarga Anda sudah memiliki kehati-hatian dasar, namun masih berpotensi terjebak pada rekayasa sosial halus atau pesan manipulatif.';
            $badgeColor = 'warn';
        } else {
            $level = 'Rentan (Sangat Memerlukan Pendampingan Anak Muda)';
            $verdict = 'Waspada! Keluarga Anda sangat mudah menjadi sasaran empuk penipuan digital. Disarankan untuk mencetak lembar panduan 3T Cekara dan menempelkannya di rumah.';
            $badgeColor = 'danger';
        }

        $shareText = "Saya baru saja menyelesaikan Tes Literasi Keamanan Penipuan Digital untuk Keluarga di Cekara.\nSkor Keamanan Keluarga: {$totalScore}/100 ({$level}).\n\nYuk cek seberapa aman keluarga Anda dari penipuan online di https://cekara.id/panduan-keluarga";

        return response()->json([
            'success' => true,
            'score' => $totalScore,
            'level' => $level,
            'verdict' => $verdict,
            'badgeColor' => $badgeColor,
            'share_url' => 'https://wa.me/?text='.urlencode($shareText),
            'share_text' => $shareText,
        ]);
    }
}
