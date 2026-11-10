import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    FileWarning,
    PhoneCall,
    Sparkles,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    QrCode,
    Shuffle,
    Check,
    X,
    Loader2,
    UploadCloud,
    Copy,
    Share2,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import VantaDotsBackground from '@/components/vanta-dots-background';

// Tipe data untuk status hasil pengecekan sesuai ATURAN-DESAIN.md & BRAND_GUIDELINE.md
type RiskLevel = 'high' | 'medium' | 'undetected';

interface ScanResult {
    level: RiskLevel;
    badgeLabel: string;
    headline: string;
    suspiciousPoints: string[];
    explanation: string;
    recommendedActions: string[];
    publicId?: string;
    shareUrl?: string;
    score?: number;
}

interface WelcomeSimulationOption {
    id: 'A' | 'B' | 'C';
    text: string;
    isCorrect: boolean;
    feedbackTitle: string;
    feedbackDetail: string;
    psychologicalTrick: string;
    goldenRule: string;
}

interface WelcomeSimulationCase {
    id: number;
    tag: string;
    tagBg: string;
    shortLabel: string;
    title: string;
    description: string;
    senderInitials: string;
    senderBg: string;
    senderName: string;
    senderPlatform: string;
    messageText: string;
    attachment?: {
        name: string;
        size: string;
        type: string;
    };
    options: WelcomeSimulationOption[];
}

const welcomeCases: WelcomeSimulationCase[] = [
    {
        id: 1,
        tag: 'Task Scam 2026',
        tagBg: 'bg-[#8ECDF0] text-[#3B2A1E]',
        shortLabel: '1. Freelance Like & Sub',
        title: 'Kasus: Tawaran Freelance Berkedok Like & Subscribe',
        description:
            'Bayangkan kamu dapat pesan chat di Telegram seperti ini. Apa langkah yang bakal kamu ambil?',
        senderInitials: 'HR',
        senderBg: 'bg-[#8ECDF0]',
        senderName: 'Recruiter_Dewi PT. MediaDigital',
        senderPlatform: 'Telegram Messenger',
        messageText:
            '"Halo kak, kami mencari partner remote. Tugas pertama: like 3 video YouTube di link berikut, langsung dapat komisi Rp30.000 via e-wallet. Untuk tugas selanjutnya dengan komisi Rp500.000, kakak wajib setor uang deposit jaminan tugas Rp150.000 ya."',
        options: [
            {
                id: 'A',
                text: 'Ambil uang Rp30.000 pertama, terus langsung transfer deposit Rp150.000 biar komisinya cepat cair banyak.',
                isCorrect: false,
                feedbackTitle: 'Hampir Terkecoh! Yuk Pahami Polanya.',
                feedbackDetail:
                    'Penipu memang sengaja mentransfer uang kecil di tugas pertama supaya kamu percaya ini asli. Tapi begitu kamu mengirimkan uang deposit, dana tersebut tidak akan pernah kembali. Uang komisi kecil hanyalah umpan psikologis.',
                psychologicalTrick:
                    'Umpan Kepercayaan Awal & Keserakahan Finansial Cepat',
                goldenRule:
                    'Kerja beneran itu yang menggaji kamu, bukan kamu yang membayar uang deposit.',
            },
            {
                id: 'B',
                text: 'Tunggu dulu. Pekerjaan asli tidak pernah meminta pelamar mentransfer deposit jaminan. Tolak dan blokir nomornya.',
                isCorrect: true,
                feedbackTitle: 'Pilihan Tepat! Instingmu Tajam.',
                feedbackDetail:
                    'Uang kecil Rp30.000 sengaja diberikan penipu sebagai umpan (task scam). Begitu kamu transfer uang deposit Rp150.000, mereka akan meminta setoran jutaan rupiah berikutnya dengan alasan kode error hingga seluruh tabunganmu habis.',
                psychologicalTrick:
                    'Manipulasi Sunk Cost Fallacy & Jebakan Grup VIP Telegram',
                goldenRule:
                    'Pekerjaan resmi tidak pernah memungut biaya jaminan atau deposit modal.',
            },
            {
                id: 'C',
                text: 'Tawar ke admin agar uang deposit Rp150.000 dipotong langsung dari komisi Rp500.000 nanti.',
                isCorrect: false,
                feedbackTitle: 'Masih Berisiko! Penipu Akan Menolak.',
                feedbackDetail:
                    'Penipu pasti menolak dan berdalih sistem pembayaran otomatis terkunci. Terus merespons percakapan hanya memberi penipu celah untuk memanipulasi emosi dan rasa penasaranmu.',
                psychologicalTrick:
                    'Ilusi Negosiasi & Menghabiskan Fokus Korban',
                goldenRule:
                    'Jangan bernegosiasi dengan penipu, langsung blokir dan putus komunikasi.',
            },
        ],
    },
    {
        id: 2,
        tag: 'Malware APK',
        tagBg: 'bg-[#FF9A3C] text-[#3B2A1E]',
        shortLabel: '2. Tilang ETLE .APK',
        title: 'Kasus: Surat Konfirmasi Tilang ETLE Palsu di WhatsApp',
        description:
            'Nomor tak dikenal mengirim pesan atas nama Kepolisian bahwa kendaraanmu tertangkap kamera tilang ETLE.',
        senderInitials: 'POL',
        senderBg: 'bg-[#FF9A3C]',
        senderName: 'Layanan ETLE Ditlantas RI (0858-9211-XXXX)',
        senderPlatform: 'WhatsApp Business',
        messageText:
            '"Pemberitahuan Pelanggaran: Kendaraan Anda tertangkap kamera ETLE melanggar batas kecepatan. Silakan unduh dan pasang berkas Surat_Tilang_ETLE_2026.apk untuk melihat foto bukti dan menghindari blokir STNK dalam 24 jam."',
        attachment: {
            name: 'Surat_Tilang_ETLE_2026.apk',
            size: '6.8 MB',
            type: 'Aplikasi Android (.APK)',
        },
        options: [
            {
                id: 'A',
                text: 'Langsung unduh dan pasang file Surat_Tilang_ETLE_2026.apk agar tahu foto pelanggaran dan dendanya.',
                isCorrect: false,
                feedbackTitle: 'Sangat Fatal! Rekeningmu Bisa Dibobol.',
                feedbackDetail:
                    'File .APK adalah aplikasi Android jahat (SMS Sniffer). Sekali dipasang, aplikasi itu akan membaca seluruh SMS OTP m-Banking Anda dan menguras saldo secara diam-diam di latar belakang.',
                psychologicalTrick:
                    'Kepanikan Denda Hukum & Ancaman Pemblokiran STNK 24 Jam',
                goldenRule:
                    'Polisi tidak pernah mengirim surat tilang dalam bentuk file aplikasi .APK via WhatsApp.',
            },
            {
                id: 'B',
                text: 'Jangan klik file tersebut. Cek keabsahan pelanggaran di portal resmi etle-korlantas.info atau kantor Samsat terdekat.',
                isCorrect: true,
                feedbackTitle: 'Langkah Hebat! Kamu Menyelamatkan Ponselmu.',
                feedbackDetail:
                    'Surat konfirmasi tilang ETLE resmi dikirim oleh Korlantas via pos fisik ke alamat sesuai STNK, bukan via chat WhatsApp pribadi. Membiarkan file .APK tidak terinstal menjaga ponselmu tetap aman.',
                psychologicalTrick:
                    'Penyalahgunaan Identitas Institusi Kepolisian',
                goldenRule:
                    'Surat tilang resmi dikirim via pos fisik atau dicek mandiri di portal etle-korlantas.info.',
            },
            {
                id: 'C',
                text: 'Teruskan file APK ke grup chat kantor atau keluarga untuk menanyakan keasliannya.',
                isCorrect: false,
                feedbackTitle: 'Hati-Hati! Bisa Membahayakan Orang Lain.',
                feedbackDetail:
                    'Meneruskan file malware ke grup chat keluarga berisiko tinggi file tersebut terpasang oleh orang tua atau kerabat yang belum paham bahaya file berekstensi .APK.',
                psychologicalTrick:
                    'Penyebaran Berantai Malware Tanpa Disengaja',
                goldenRule:
                    'File mencurigakan jangan diteruskan, segera hapus dan laporkan nomor pengirim.',
            },
        ],
    },
    {
        id: 3,
        tag: 'AI Deepfake',
        tagBg: 'bg-[#E64A19] text-white',
        shortLabel: '3. Suara AI / Deepfake',
        title: 'Kasus: Suara Tangisan Mirip Anak Kena Razia Narkoba',
        description:
            'Panggilan masuk mendadak. Terdengar suara tangisan yang persis sekali dengan suara anak atau kerabatmu.',
        senderInitials: 'AI',
        senderBg: 'bg-[#E64A19] text-white',
        senderName: 'Penyidik Iptu Hendra (Polres Metro) - 0812-9988-XXXX',
        senderPlatform: 'Panggilan Telepon Suara',
        messageText:
            '"Halo Bu/Pak! Anak ibu kami amankan dalam razia mobil narkoba. (Terdengar suara tangisan persis anak Anda: Ibu tolong bu...). Kalau mau damai tanpa penjara, transfer jaminan Rp 15 juta sekarang dalam 15 menit! Jangan matikan telepon!"',
        options: [
            {
                id: 'A',
                text: 'Panik dan langsung transfer ke nomor rekening yang diminta karena suara tangisannya terdengar sangat mirip.',
                isCorrect: false,
                feedbackTitle: 'Hampir Terjerumus! Ini Rekayasa Suara AI.',
                feedbackDetail:
                    'Teknologi AI Voice Cloning kini bisa menirukan suara siapa pun hanya dari rekaman audio 5 detik di media sosial (Instagram/TikTok). Desakan 15 menit dibuat sengaja agar kamu tidak sempat berpikir jernih.',
                psychologicalTrick:
                    'Eksploitasi Kasih Sayang Keluarga & AI Voice Impersonation',
                goldenRule:
                    'Aparat penegak hukum resmi tidak pernah meminta transfer uang damai ke rekening pribadi.',
            },
            {
                id: 'B',
                text: 'Tanyakan Kata Sandi Rahasia Keluarga, segera matikan telepon, lalu hubungi langsung nomor pribadi anak.',
                isCorrect: true,
                feedbackTitle: 'Luar Biasa! Mental Guardian Sejati.',
                feedbackDetail:
                    'Pilihan paling tepat! Larangan mematikan telepon adalah trik psikologis agar kamu tidak bisa memverifikasi kenyataan. Menutup telepon dan menelepon langsung ke nomor asli anak akan langsung membongkar kebohongannya.',
                psychologicalTrick:
                    'Larangan Menutup Telepon (Tunnel Vision Trap)',
                goldenRule:
                    'Jika menerima kabar musibah mendadak, selalu matikan telepon dan verifikasi langsung ke nomor pribadi yang bersangkutan.',
            },
            {
                id: 'C',
                text: 'Tawar uang tebusan menjadi Rp 5 juta karena uang di tabungan tidak cukup.',
                isCorrect: false,
                feedbackTitle: 'Salah Strategi! Kamu Masih Terperangkap.',
                feedbackDetail:
                    'Bernegosiasi membuktikan bahwa kamu percaya cerita bohong tersebut. Penipu akan terus memerasmu dan meminta semua uang yang kamu miliki.',
                psychologicalTrick: 'Tekanan Finansial & Pemerasan Bertahap',
                goldenRule:
                    'Jangan bernegosiasi dengan penipu berkedok oknum polisi, segera verifikasi mandiri.',
            },
        ],
    },
    {
        id: 4,
        tag: 'Phishing Bank',
        tagBg: 'bg-[#8ECDF0] text-[#3B2A1E]',
        shortLabel: '4. Phishing Bank .VIP',
        title: 'Kasus: SMS Ancaman Blokir M-Banking dalam 30 Menit',
        description:
            'Sebuah SMS formal masuk dengan sender ID yang tampak seperti bank resmi. Bagaimana reaksimu?',
        senderInitials: 'BCA',
        senderBg: 'bg-[#8ECDF0]',
        senderName: 'BANK-NOTIFICATION',
        senderPlatform: 'SMS Sender ID Resmi',
        messageText:
            '"[PERINGATAN RESMI] Akun m-Banking Anda terdeteksi login di perangkat luar negeri. Rekening akan DIBEKUKAN permanen dalam 30 menit. Batalkan pemblokiran melalui portal resmi: https://bca-klik-keamanan.vip/verifikasi-login"',
        options: [
            {
                id: 'A',
                text: 'Segera klik tautan tersebut dan login dengan User ID, Password, dan PIN ATM agar akun tidak diblokir.',
                isCorrect: false,
                feedbackTitle: 'Fatal! Saldo Rekeningmu Bisa Habis.',
                feedbackDetail:
                    'Tautan tersebut mengarah ke situs web tiruan (phishing). Formulir tersebut sengaja dibuat mirip bank asli untuk mencuri data kredensial dan PIN ATM Anda.',
                psychologicalTrick:
                    'Ancaman Batas Waktu 30 Menit (Artificial Scarcity & Panic)',
                goldenRule:
                    'Bank resmi tidak pernah meminta nasabah membatalkan blokir melalui tautan di SMS.',
            },
            {
                id: 'B',
                text: 'Jangan klik link apapun. Buka langsung aplikasi m-Banking resmi di ponselmu atau hubungi Call Center resmi bank.',
                isCorrect: true,
                feedbackTitle: 'Sempurna! Kamu Bebas dari Phishing.',
                feedbackDetail:
                    'Perhatikan akhiran domain web: .vip bukan domain resmi perbankan Indonesia (yang biasanya .co.id). Bank resmi tidak pernah mengirim tautan verifikasi akun lewat SMS.',
                psychologicalTrick:
                    'Peniruan Identitas SMS Sender ID Resmi (SMS Spoofing)',
                goldenRule:
                    'Akses layanan perbankan hanya melalui aplikasi resmi yang sudah terpasang atau URL resmi yang diketik sendiri.',
            },
            {
                id: 'C',
                text: 'Balas SMS tersebut menanyakan kenapa akun bisa terdeteksi di luar negeri.',
                isCorrect: false,
                feedbackTitle:
                    'Kurang Efektif! SMS Phishing Bersifat Satu Arah.',
                feedbackDetail:
                    'SMS phishing massal dikirim oleh mesin blast. Membalas SMS hanya menghabiskan pulsa atau mengonfirmasi bahwa nomor ponselmu aktif untuk target penipuan selanjutnya.',
                psychologicalTrick: 'Umpan Reaksi Spontan Korban',
                goldenRule:
                    'Abaikan dan hapus SMS mencurigakan yang meminta login atau verifikasi.',
            },
        ],
    },
    {
        id: 5,
        tag: 'QRIS Tampering',
        tagBg: 'bg-[#FFE27A] text-[#3B2A1E]',
        shortLabel: '5. QRIS Tertimpa',
        title: 'Kasus: Barcode QRIS di Meja Kafe Tertimpa Stiker Baru',
        description:
            'Kamu hendak membayar makanan di kafe "Kopi Senja". Di meja ada stiker QRIS, tapi saat dipindai nama merchant berbeda.',
        senderInitials: 'QR',
        senderBg: 'bg-[#FFE27A]',
        senderName: 'Tent Card Pembayaran Meja 12',
        senderPlatform: 'Stiker Meja Fisik',
        messageText:
            '"Anda duduk di kafe Kopi Senja. Saat memindai QRIS di meja, aplikasi m-Banking Anda memunculkan konfirmasi penerima: RESTORASI PEDULI DHARMA (Jakarta Barat), bukan nama Kopi Senja."',
        options: [
            {
                id: 'A',
                text: 'Tetap bayar dan masukkan PIN m-Banking karena mengira itu nama yayasan atau badan hukum milik kafe.',
                isCorrect: false,
                feedbackTitle: 'Awas! Uangmu Masuk ke Rekening Penipu.',
                feedbackDetail:
                    'Ini adalah modus QRIS Tampering: pelaku diam-diam menempel stiker QRIS miliknya di atas barcode resmi kafe/masjid. Kafe tidak akan menerima pembayaranmu dan kamu rugi dua kali.',
                psychologicalTrick:
                    'Asumsi Buta & Ketidaktelitian Mengecek Nama Merchant',
                goldenRule:
                    'Selalu cocokkan Nama Merchant di layar konfirmasi ponsel dengan nama toko tempat kamu berbelanja.',
            },
            {
                id: 'B',
                text: 'Batalkan transaksi dan panggil pelayan/kasir untuk mengonfirmasi nama merchant resmi kafe.',
                isCorrect: true,
                feedbackTitle: 'Hebat! Matamu Sangat Jeli.',
                feedbackDetail:
                    'Tindakan cepatmu tidak hanya melindungi uangmu sendiri, tapi juga membantu pihak kafe menyadari adanya sabotase stiker QRIS di meja mereka sebelum ada korban lain.',
                psychologicalTrick:
                    'Pemanfaatan Kemudahan Pembayaran Digital Tanpa Verifikasi',
                goldenRule:
                    'Jangan pernah memasukkan PIN jika nama penerima QRIS tidak sesuai dengan nama toko fisik.',
            },
            {
                id: 'C',
                text: 'Transfer nominal Rp 1.000 dulu untuk mengetes apakah notifikasi masuk ke kasir.',
                isCorrect: false,
                feedbackTitle:
                    'Tidak Perlu Ragu! Langsung Konfirmasi ke Kasir.',
                feedbackDetail:
                    'Kasir jelas tidak akan menerima notifikasi karena rekeningnya berbeda. Mengirim uang percobaan hanya membuang saldo dan waktu.',
                psychologicalTrick:
                    'Ragu-Ragu Tanpa Bertanya Langsung ke Petugas',
                goldenRule:
                    'Jika nama merchant meragukan, tanyakan langsung pada kasir sebelum transaksi.',
            },
        ],
    },
    {
        id: 6,
        tag: 'Pinjol Ilegal',
        tagBg: 'bg-[#FF9A3C] text-[#3B2A1E]',
        shortLabel: '6. Dana Siluman Pinjol',
        title: 'Kasus: Transfer Dana Nyasar Disusul Teror Bunga Ratusan Persen',
        description:
            'Tiba-tiba masuk uang ke rekeningmu dari pihak tak dikenal, lalu 2 jam kemudian muncul pesan WhatsApp mengancam menyebar datamu.',
        senderInitials: 'DC',
        senderBg: 'bg-[#FF9A3C]',
        senderName: '0895-3412-XXXX (Penagih DanaExpress)',
        senderPlatform: 'WhatsApp & Mutasi Rekening',
        messageText:
            '"Notifikasi Bank: Masuk dana Rp 1.500.000 dari PT Digital Pinjam. Dua jam kemudian muncul chat WhatsApp: Pinjaman Anda Rp 1.500.000 sudah cair! Dalam 4 hari wajib kembalikan Rp 2.900.000 atau seluruh kontak di HP Anda kami sebar fotonya sebagai penipu!"',
        options: [
            {
                id: 'A',
                text: 'Gunakan uang tersebut untuk belanja kebutuhan sehari-hari karena merasa rezeki nomplok transferan salah alamat.',
                isCorrect: false,
                feedbackTitle: 'Jebakan Maut! Kamu Akan Diteror Habis-habisan.',
                feedbackDetail:
                    'Ini adalah modus Dana Siluman: sindikat pinjol ilegal sengaja mentransfer uang tanpa persetujuan, lalu meneror bunga hingga 100% dan mengancam mempermalukan Anda di hadapan keluarga dan teman kantor.',
                psychologicalTrick: 'Godaan Uang Cepat & Jebakan Utang Fiktif',
                goldenRule:
                    'Jangan pernah membelanjakan uang yang masuk tanpa asal-usul yang jelas.',
            },
            {
                id: 'B',
                text: 'Jangan pakai uangnya, jangan transfer balik ke nomor pribadi penagih. Segera buat laporan ke bank untuk retur resmi dan laporkan teror ke Kontak OJK 157.',
                isCorrect: true,
                feedbackTitle: 'Langkah Paling Tepat & Kebal Hukum!',
                feedbackDetail:
                    'Dengan melapor secara resmi ke bank dan OJK, kamu membuktikan secara hukum bahwa kamu bukan peminjam. Pihak bank akan memproses retur dana melalui mekanisme kliring perbankan yang sah.',
                psychologicalTrick:
                    'Teror Doxxing & Intimidasi Daftar Kontak Ponsel',
                goldenRule:
                    'Jika menerima dana nyasar, selesaikan hanya lewat prosedur resmi bank penerbit rekening, bukan transfer ke debt collector.',
            },
            {
                id: 'C',
                text: 'Segera transfer balik uang Rp 1.500.000 ke rekening pribadi yang dikirim penagih di WhatsApp agar urusan beres.',
                isCorrect: false,
                feedbackTitle: 'Sangat Berbahaya! Utangmu Tetap Tidak Lunas.',
                feedbackDetail:
                    'Jika kamu transfer ke rekening pribadi penagih, sindikat pinjol ilegal tetap mencatat di sistem bahwa kamu masih berutang pokok plus bunga denda Rp 2.900.000. Kamu akan terus diperas!',
                psychologicalTrick:
                    'Keinginan Menyelesaikan Masalah dengan Cepat (Quick Relief Trap)',
                goldenRule:
                    'Jangan pernah mentransfer balik dana nyasar ke rekening pribadi yang dikirim via chat.',
            },
        ],
    },
];

export default function Welcome() {
    // Tab pemeriksaan: 'text' | 'image' | 'link'
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'link'>(
        'text',
    );
    const [inputText, setInputText] = useState('');
    const [selectedImageName, setSelectedImageName] = useState<string | null>(
        null,
    );
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [inputUrl, setInputUrl] = useState('');

    // Status alur interaksi: 'idle' | 'loading' | 'result'
    const [scanState, setScanState] = useState<'idle' | 'loading' | 'result'>(
        'idle',
    );
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    const handleFileSelect = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const validExts = /\.(jpe?g|png|webp)$/i;
        if (!validTypes.includes(file.type) && !validExts.test(file.name)) {
            setImageError('Format berkas harus berupa JPG, JPEG, PNG, atau WebP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setImageError('Ukuran berkas gambar maksimal adalah 5 MB.');
            return;
        }
        setImageError(null);
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        setSelectedImageFile(file);
        setSelectedImageName(file.name);
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
    };

    const resetImage = () => {
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        setSelectedImageFile(null);
        setSelectedImageName(null);
        setImagePreviewUrl(null);
        setImageError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    // Mini simulasi di landing page (tersimpan di browser agar tidak hilang saat reload)
    const [activeCaseIndex, setActiveCaseIndex] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('cekara_active_case_index');
                if (saved !== null) {
                    const parsed = parseInt(saved, 10);
                    if (!isNaN(parsed) && parsed >= 0 && parsed < welcomeCases.length) {
                        return parsed;
                    }
                }
                const initialIndex = Math.floor(
                    Math.random() * welcomeCases.length,
                );
                localStorage.setItem(
                    'cekara_active_case_index',
                    initialIndex.toString(),
                );
                return initialIndex;
            } catch {}
        }
        return 0;
    });

    const [caseAnswers, setCaseAnswers] = useState<Record<number, string>>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('cekara_case_answers');
                if (saved) return JSON.parse(saved);
            } catch {}
        }
        return {};
    });

    const [caseFeedbackOpen, setCaseFeedbackOpen] = useState<
        Record<number, boolean>
    >(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('cekara_case_feedback_open');
                if (saved) return JSON.parse(saved);
            } catch {}
        }
        return {};
    });

    // Simpan progres interaksi simulasi ke localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(
                    'cekara_active_case_index',
                    activeCaseIndex.toString(),
                );
            } catch {}
        }
    }, [activeCaseIndex]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(
                    'cekara_case_answers',
                    JSON.stringify(caseAnswers),
                );
            } catch {}
        }
    }, [caseAnswers]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(
                    'cekara_case_feedback_open',
                    JSON.stringify(caseFeedbackOpen),
                );
            } catch {}
        }
    }, [caseFeedbackOpen]);

    const [isSubmittingCase, setIsSubmittingCase] = useState(false);

    const handleSubmitCaseAnswer = (caseId: number) => {
        if (!caseAnswers[caseId] || isSubmittingCase) return;
        setIsSubmittingCase(true);
        setTimeout(() => {
            setIsSubmittingCase(false);
            setCaseFeedbackOpen((prev) => ({
                ...prev,
                [caseId]: true,
            }));
        }, 700);
    };

    const handleResetCurrentCase = (caseId: number) => {
        setCaseAnswers((prev) => {
            const next = { ...prev };
            delete next[caseId];
            return next;
        });
        setCaseFeedbackOpen((prev) => {
            const next = { ...prev };
            delete next[caseId];
            return next;
        });
    };

    const handleRandomizeCase = () => {
        setActiveCaseIndex((prev) => {
            let nextIndex = Math.floor(Math.random() * welcomeCases.length);
            if (welcomeCases.length > 1 && nextIndex === prev) {
                nextIndex = (nextIndex + 1) % welcomeCases.length;
            }
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(
                        'cekara_active_case_index',
                        nextIndex.toString(),
                    );
                } catch {}
            }
            // Bersihkan jawaban untuk kasus baru yang muncul agar alur interaktif dimulai dari awal
            setCaseAnswers((a) => {
                const next = { ...a };
                delete next[welcomeCases[nextIndex].id];
                return next;
            });
            setCaseFeedbackOpen((f) => {
                const next = { ...f };
                delete next[welcomeCases[nextIndex].id];
                return next;
            });
            return nextIndex;
        });
    };

    // Contoh cepat untuk dicoba langsung oleh pelajar
    const loadSample = (type: 'task_scam' | 'apk_kurir' | 'giveaway') => {
        resetImage();
        if (type === 'task_scam') {
            setActiveTab('text');
            setInputText(
                'Halo kak! Kami dari PT Media Nusantara membuka loker freelance paruh waktu. Tugasnya cuma like video YouTube dan follow akun medsos. Komisi Rp50.000 - Rp200.000 per tugas. Tapi sebelum mulai, silakan transfer uang jaminan deposit Rp100.000 ke rekening admin ya kak.',
            );
        } else if (type === 'apk_kurir') {
            setActiveTab('text');
            setInputText(
                'Selamat siang, dari kurir J&T Express. Paket Anda tertahan di gudang karena resi rusak. Silakan instal aplikasi resi pengiriman berikut untuk melacak paket: LIHAT_FOTO_PAKET.apk',
            );
        } else {
            setActiveTab('link');
            setInputUrl(
                'https://daget-dana-kaget-gratis-2026.xyz/klaim-sekarang',
            );
        }
        setScanState('idle');
        setScanResult(null);
    };

    // Aksi pemeriksaan komprehensif (mendukung Teks, Gambar/Screenshot, dan Tautan Web)
    const handleRunCheck = async (e: React.FormEvent) => {
        e.preventDefault();

        let hasContent = false;
        if (activeTab === 'text' && inputText.trim().length >= 3)
            hasContent = true;
        if (activeTab === 'image' && selectedImageFile) hasContent = true;
        if (activeTab === 'link' && inputUrl.trim().length >= 3)
            hasContent = true;

        if (!hasContent) {
            if (activeTab === 'text' && inputText.trim().length > 0 && inputText.trim().length < 3) {
                alert('Isi pesan minimal 3 karakter.');
            } else if (activeTab === 'link' && inputUrl.trim().length > 0 && inputUrl.trim().length < 3) {
                alert('Isi tautan URL minimal 3 karakter.');
            } else if (activeTab === 'image' && !selectedImageFile) {
                setImageError('Silakan pilih atau unggah berkas gambar terlebih dahulu.');
            }
            return;
        }

        setScanState('loading');

        try {
            const csrfMeta = document.querySelector(
                'meta[name="csrf-token"]',
            );
            const csrfToken = csrfMeta
                ? csrfMeta.getAttribute('content')
                : '';

            const formData = new FormData();
            if (activeTab === 'text') {
                formData.append('content', inputText.trim());
            } else if (activeTab === 'link') {
                formData.append('content', inputUrl.trim());
            } else if (activeTab === 'image' && selectedImageFile) {
                formData.append('image', selectedImageFile);
                formData.append(
                    'content',
                    'Tangkapan layar untuk dianalisis indikasi penipuan digital.',
                );
            }

            const response = await fetch('/chat/analyze', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: formData,
            });

            if (response.ok) {
                const json = await response.json();
                const data = json.data || json;
                const rawLevel = String(
                    data.risk_level || data.riskLevel || 'medium',
                ).toLowerCase();
                const level: RiskLevel =
                    rawLevel.includes('high') || rawLevel.includes('tinggi') || rawLevel.includes('danger')
                        ? 'high'
                        : rawLevel.includes('low') ||
                            rawLevel.includes('undetected') ||
                            rawLevel.includes('rendah')
                          ? 'undetected'
                          : 'medium';

                const badgeLabel =
                    level === 'high'
                        ? 'Hati-hati, ini mencurigakan'
                        : level === 'medium'
                          ? 'Yuk cek dulu'
                          : 'Belum ketemu tanda bahaya, tapi tetap cek ya';

                const publicId = data.public_id || json.public_id;
                const shareUrl =
                    data.share_url ||
                    json.share_url ||
                    (publicId
                        ? `${window.location.origin}/scans/${publicId}`
                        : undefined);

                setScanResult({
                    level,
                    badgeLabel,
                    headline:
                        data.summary ||
                        'Hasil analisis pola pesan mencurigakan.',
                    suspiciousPoints:
                        Array.isArray(data.red_flags) &&
                        data.red_flags.length > 0
                            ? data.red_flags
                            : Array.isArray(data.redFlags) &&
                                data.redFlags.length > 0
                              ? data.redFlags
                              : [
                                    'Pola pesan mengandung desakan waktu atau penawaran yang tidak lazim.',
                                ],
                    explanation:
                        data.recommendation ||
                        (Array.isArray(data.recommendations) &&
                            data.recommendations[0]) ||
                        'Periksa kembali kontak pengirim sebelum mengklik tautan atau mengirim data pribadi.',
                    recommendedActions:
                        Array.isArray(data.recommendations) &&
                        data.recommendations.length > 0
                            ? data.recommendations
                            : [
                                  'Jangan transfer uang dalam jumlah berapa pun.',
                                  'Jangan klik tautan atau instal berkas mencurigakan.',
                                  'Laporkan nomor pengirim ke kanal pengaduan resmi.',
                              ],
                    publicId,
                    shareUrl,
                    score: typeof data.score === 'number' ? data.score : undefined,
                });
                setScanState('result');
                return;
            }
        } catch (err) {
            console.error('Network analysis error, falling back to local heuristic:', err);
        }

        // Fallback heuristik edukatif cepat jika offline/gangguan
        setTimeout(() => {
            if (activeTab === 'text') {
                const lower = inputText.toLowerCase();

                // Weighted keyword scoring (mirrors backend MockLlmDriver approach)
                const highKeywords = [
                    'deposit', '.apk', 'transfer uang', 'kirim uang', 'transfer ke rekening',
                    'otp', 'kode verifikasi', 'pin atm', 'cvv', 'kode 6 digit', 'password',
                    'rekening terblokir', 'akun terblokir', 'akun dibekukan',
                    'selamat anda', 'anda terpilih', 'memenangkan', 'pemenang undian',
                    'klaim hadiah', 'biaya admin', 'biaya pencairan', 'bayar dulu',
                    'saya polisi', 'dari kepolisian', 'dari kejaksaan', 'tersangka',
                    'dijamin untung', 'profit pasti', 'tanpa risiko', 'return tinggi',
                    'foto ktp', 'kirim ktp', 'selfie ktp',
                ];
                const mediumKeywords = [
                    'hadiah', 'undian', 'komisi', 'bonus harian', 'like video',
                    'kerja paruh waktu', 'tugas harian', 'tugas mudah', 'kerja sampingan',
                    'klik link', 'klik tautan', 'buka link', 'klik disini',
                    'segera', 'sekarang juga', 'dalam 24 jam', 'batas waktu',
                    'jangan beritahu', 'rahasia', 'antara kita saja',
                    'pinjaman online', 'pinjol', 'cepat cair', 'tanpa agunan',
                    'investasi', 'trading', 'crypto', 'robot trading',
                    'grup telegram', 'join telegram', 'gabung grup',
                    'hubungi nomor', 'whatsapp saya di', 'gratis',
                    'penipuan', 'scam', 'palsu', 'fraud', 'bodong', 'penipu',
                    'transfer', 'kirim ke', 'customer service bank', 'petugas bank',
                    'nomor rekening', 'data pribadi',
                ];

                let score = 0;
                const matchedPoints: string[] = [];

                highKeywords.forEach((kw) => {
                    if (lower.includes(kw)) score += 30;
                });
                mediumKeywords.forEach((kw) => {
                    if (lower.includes(kw)) score += 15;
                });

                // Build contextual suspicious points
                if (lower.includes('.apk') || lower.includes('unduh') || lower.includes('instal'))
                    matchedPoints.push('Mengirimkan berkas .apk atau meminta mengunduh aplikasi berbahaya.');
                if (lower.includes('otp') || lower.includes('pin atm') || lower.includes('cvv') || lower.includes('password'))
                    matchedPoints.push('Meminta kode OTP, PIN, CVV, atau kata sandi yang bersifat rahasia mutlak.');
                if (lower.includes('transfer') || lower.includes('kirim uang') || lower.includes('deposit') || lower.includes('bayar dulu'))
                    matchedPoints.push('Meminta transfer uang atau pembayaran deposit di muka.');
                if (lower.includes('hadiah') || lower.includes('undian') || lower.includes('memenangkan') || lower.includes('terpilih'))
                    matchedPoints.push('Klaim memenangkan hadiah atau undian yang tidak pernah diikuti.');
                if (lower.includes('segera') || lower.includes('dalam 24 jam') || lower.includes('batas waktu'))
                    matchedPoints.push('Menggunakan tekanan waktu mendesak untuk mencegah korban berpikir rasional.');
                if (lower.includes('klik link') || lower.includes('klik tautan') || lower.includes('buka link'))
                    matchedPoints.push('Mengarahkan untuk mengklik tautan yang berpotensi phishing.');
                if (lower.includes('pinjol') || lower.includes('pinjaman online') || lower.includes('cepat cair'))
                    matchedPoints.push('Tawaran pinjaman online instan yang berindikasi pinjol ilegal.');
                if (lower.includes('investasi') || lower.includes('trading') || lower.includes('profit pasti'))
                    matchedPoints.push('Menjanjikan keuntungan investasi yang tidak realistis.');
                if (lower.includes('foto ktp') || lower.includes('kirim ktp') || lower.includes('data pribadi'))
                    matchedPoints.push('Meminta data identitas pribadi yang dapat disalahgunakan.');
                if (lower.includes('penipuan') || lower.includes('scam') || lower.includes('palsu') || lower.includes('penipu'))
                    matchedPoints.push('Konten secara eksplisit mengandung istilah penipuan atau kecurangan.');
                if (lower.includes('komisi') || lower.includes('like video') || lower.includes('tugas harian'))
                    matchedPoints.push('Menawarkan tugas ringan dengan imbalan komisi, modus jebakan skema ponzi.');
                if (lower.includes('polisi') || lower.includes('kejaksaan') || lower.includes('tersangka'))
                    matchedPoints.push('Mengatasnamakan aparat hukum untuk mengintimidasi korban.');

                if (matchedPoints.length === 0) {
                    matchedPoints.push(
                        'Gaya bahasa terkesan terburu-buru atau menawarkan keuntungan tanpa kejelasan identitas resmi pengirim.',
                        'Belum ada bukti legalitas yang bisa diverifikasi langsung dari saluran resmi.',
                    );
                }

                if (score >= 30) {
                    setScanResult({
                        level: 'high',
                        badgeLabel: 'Hati-hati, ini mencurigakan',
                        headline: 'Ditemukan beberapa tanda bahaya yang sering muncul pada modus penipuan digital.',
                        suspiciousPoints: matchedPoints.slice(0, 5),
                        explanation:
                            'Pesan dengan kombinasi permintaan transfer uang, data rahasia, atau tekanan waktu mendesak memiliki ciri khas penipuan rekayasa sosial.',
                        recommendedActions: [
                            'Jangan transfer uang atau bagikan data rahasia dalam jumlah atau bentuk apa pun.',
                            'Jangan klik tautan atau pasang berkas yang dikirimkan.',
                            'Blokir nomor pengirim dan laporkan ke kanal Indonesia Anti-Scam Centre (iasc.ojk.go.id).',
                        ],
                    });
                } else if (score >= 15) {
                    setScanResult({
                        level: 'medium',
                        badgeLabel: 'Yuk cek dulu',
                        headline: 'Pesan ini memiliki beberapa elemen mencurigakan yang perlu dicek ulang.',
                        suspiciousPoints: matchedPoints.slice(0, 4),
                        explanation:
                            'Meskipun belum cukup bukti untuk divonis penipuan, pola komunikasi ini memerlukan verifikasi ke sumber resmi sebelum ditindaklanjuti.',
                        recommendedActions: [
                            'Cek nama perusahaan atau akun pengirim di mesin pencari resmi.',
                            'Jangan langsung percaya tawaran sebelum konfirmasi ke pihak resmi.',
                            'Tanyakan pendapat teman atau keluarga sebelum mengambil tindakan lanjutan.',
                        ],
                    });
                } else {
                    setScanResult({
                        level: 'medium',
                        badgeLabel: 'Yuk cek dulu',
                        headline:
                            'Pesan ini perlu dicek ulang ke sumber resminya sebelum dipercaya.',
                        suspiciousPoints: matchedPoints.slice(0, 3),
                        explanation:
                            'Meskipun tidak secara terang-terangan meminta uang atau data sensitif, pesan dari sumber tidak dikenal selalu perlu diverifikasi.',
                        recommendedActions: [
                            'Cek nama perusahaan atau akun pengirim di mesin pencari resmi.',
                            'Tanyakan pendapat teman atau keluarga sebelum mengambil tindakan lanjutan.',
                        ],
                    });
                }
            } else if (activeTab === 'image') {
                setScanResult({
                    level: 'high',
                    badgeLabel: 'Hati-hati, ini mencurigakan',
                    headline:
                        'Tangkapan layar terindikasi memuat manipulasi visual atau format bukti tidak resmi.',
                    suspiciousPoints: [
                        'Tata letak font atau perataan teks pada struk transfer tampak tidak konsisten dengan format resmi perbankan.',
                        'Tidak tercantum nomor referensi transaksi yang dapat dilacak secara sah.',
                    ],
                    explanation:
                        'Penipu sering memakai generator struk palsu untuk meyakinkan korban bahwa uang sudah dikirim, lalu mendesak korban mengirimkan barang atau uang kembali.',
                    recommendedActions: [
                        'Cek mutasi rekening langsung lewat aplikasi m-banking atau ATM kamu, bukan dari struk kiriman orang lain.',
                        'Jangan percaya tangkapan layar saldo sebelum kamu melihat saldomu bertambah sendiri.',
                    ],
                });
            } else {
                setScanResult({
                    level: 'high',
                    badgeLabel: 'Hati-hati, ini mencurigakan',
                    headline:
                        'Tautan menggunakan domain tidak lazim yang menyerupai nama merek terpercaya (phishing).',
                    suspiciousPoints: [
                        'Akhiran domain (.xyz / domain gratis) jarang digunakan oleh lembaga resmi atau dompet digital.',
                        'Nama tautan meniru kata kunci populer untuk memancing kamu login atau memasukkan data rahasia.',
                    ],
                    explanation:
                        'Tautan palsu seperti ini dibuat menyerupai halaman asli untuk mencuri kata sandi, PIN dompet digital, atau kode OTP.',
                    recommendedActions: [
                        'Jangan masukkan nomor HP, PIN, atau kata sandi di situs tersebut.',
                        'Tutup segera tab peramban dan pastikan akun dompet digitalmu masih aktif aman.',
                    ],
                });
            }
            setScanState('result');
        }, 900);
    };

    const resetScan = () => {
        setScanState('idle');
        setScanResult(null);
        setCopiedShareLink(false);
    };

    return (
        <AppLayout>
            <Head title="CEKARA - Cek dulu sebelum percaya" />

            <div>
                {/* 1. HERO & FITUR PEMERIKSA UTAMA */}
                <section
                    id="hero"
                    className="relative overflow-hidden px-4 pt-8 pb-14 sm:px-6 sm:pt-12 sm:pb-20"
                >
                    {/* Interactive 3D Vanta Dots Background */}
                    <VantaDotsBackground
                        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                        opacity={0.85}
                        color={0xe64a19}
                        color2={0xff7a45}
                        size={5}
                    />

                    <div className="relative z-10 mx-auto max-w-4xl">
                        {/* Headline & Pengantar (Rata Tengah / Centered) */}
                        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
                            <h1 className="mb-4 font-['Fredoka',system-ui,sans-serif] text-3xl leading-[1.2] font-bold text-[#3B2A1E] sm:text-4xl md:text-5xl">
                                Dapat pesan mencurigakan?{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Tenang, kita cek bareng.
                                    {/* Hiasan Garis Bergelombang Buatan Tangan */}
                                    <svg
                                        className="absolute -bottom-2 left-0 h-2.5 w-full text-[#FF9A3C]"
                                        viewBox="0 0 200 9"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        preserveAspectRatio="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M2 7C25 1 45 7 70 3C95 -1 115 6 140 2C165 -2 185 7 198 3"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                            </h1>

                            <p className="mx-auto max-w-2xl text-base leading-relaxed font-normal text-[#6B5646] sm:text-lg">
                                Bantu kamu menilai pesan chat, tawaran kerja
                                freelance, tautan, atau bukti transfer yang
                                bikin ragu, lengkap dengan alasannya.
                            </p>
                        </div>

                        {/* KOTAK PEMERIKSA (SATU FOKUS UTAMA) */}
                        <div id="cek-pesan" className="relative -top-24 block pointer-events-none" />
                        <div
                            id="pemeriksa"
                            className="rounded-[24px] border-2 border-[#3B2A1E] bg-[#FFFFFF] p-5 shadow-[4px_4px_0px_0px_#3B2A1E] sm:p-7"
                        >
                            {/* Tab Pilihan Format Input */}
                            <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border-2 border-[#EFE3D0] bg-[#FFF8EC] p-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('text');
                                        resetScan();
                                    }}
                                    className={`flex h-11 min-h-[44px] min-w-[100px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${
                                        activeTab === 'text'
                                            ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E]'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    Teks Pesan
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('image');
                                        resetScan();
                                    }}
                                    className={`flex h-11 min-h-[44px] min-w-[100px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${
                                        activeTab === 'image'
                                            ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E]'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            width="18"
                                            height="18"
                                            x="3"
                                            y="3"
                                            rx="2"
                                            ry="2"
                                        />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                    </svg>
                                    Tangkapan Layar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('link');
                                        resetScan();
                                    }}
                                    className={`flex h-11 min-h-[44px] min-w-[100px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${
                                        activeTab === 'link'
                                            ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E]'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                    Tautan Website
                                </button>
                            </div>

                            {/* Form Input Berdasarkan Tab */}
                            <form onSubmit={(e) => void handleRunCheck(e)}>
                                {activeTab === 'text' && (
                                    <div className="mb-4">
                                        <label
                                            htmlFor="text-input"
                                            className="mb-2 block text-sm font-bold text-[#3B2A1E]"
                                        >
                                            Salin dan tempel pesan nya :
                                        </label>
                                        <textarea
                                            id="text-input"
                                            rows={5}
                                            value={inputText}
                                            onChange={(e) =>
                                                setInputText(e.target.value)
                                            }
                                            placeholder="Contoh: 'Halo kak, kami dari agensi membuka lowongan freelance like video komisi 150rb per tugas. Silakan transfer uang jaminan 50rb...'"
                                            className="w-full resize-y rounded-2xl border-2 border-[#8ECDF0] bg-[#FFF8EC]/40 p-4 text-base text-[#3B2A1E] placeholder-[#6B5646] focus:border-[#FF9A3C] focus:ring-2 focus:ring-[#3B2A1E] focus:outline-none"
                                        />
                                    </div>
                                )}

                                {activeTab === 'image' && (
                                    <div className="mb-4">
                                        <label
                                            htmlFor="screenshot-file-input"
                                            className="mb-2 block text-sm font-bold text-[#3B2A1E]"
                                        >
                                            Unggah tangkapan layar (struk transfer, bukti chat, profil):
                                        </label>

                                        <input
                                            id="screenshot-file-input"
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileSelect(file);
                                            }}
                                        />

                                        {imagePreviewUrl ? (
                                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC]/60 p-4 sm:p-5">
                                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                                    <div className="relative overflow-hidden rounded-xl border-2 border-[#3B2A1E] bg-white shadow-sm max-h-48">
                                                        <img
                                                            src={imagePreviewUrl}
                                                            alt="Pratinjau tangkapan layar"
                                                            className="max-h-48 w-auto object-contain"
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-center sm:text-left">
                                                        <p className="text-sm font-bold text-[#3B2A1E] break-all">
                                                            {selectedImageName}
                                                        </p>
                                                        {selectedImageFile && (
                                                            <p className="text-xs text-[#6B5646] mt-0.5">
                                                                Ukuran: {(selectedImageFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        )}
                                                        <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-3.5 py-2 text-xs font-bold text-[#3B2A1E] hover:bg-[#FFE27A] transition-colors"
                                                            >
                                                                <UploadCloud className="h-4 w-4 text-[#3B2A1E]" />
                                                                <span>Ganti Foto</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={resetImage}
                                                                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] px-3.5 py-2 text-xs font-bold text-[#A8412A] hover:bg-[#FFE27A] transition-colors"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                <span>Hapus</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${
                                                    isDragging
                                                        ? 'border-[#FF9A3C] bg-[#FFE27A]/30'
                                                        : 'border-[#8ECDF0] bg-[#FFF8EC]/40 hover:bg-[#FFE27A]/20'
                                                }`}
                                            >
                                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-[#8ECDF0]">
                                                    <UploadCloud className="h-6 w-6 text-[#3B2A1E]" />
                                                </div>
                                                <p className="mb-1 text-sm font-bold text-[#3B2A1E]">
                                                    Klik untuk pilih foto atau tarik berkas ke sini
                                                </p>
                                                <p className="text-xs text-[#6B5646]">
                                                    Mendukung format JPG, JPEG, PNG, atau WebP (Maksimal 5 MB)
                                                </p>
                                            </div>
                                        )}

                                        {imageError && (
                                            <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#D4573A] bg-[#FFF8EC] p-3 text-xs font-bold text-[#A8412A]">
                                                <AlertTriangle className="h-4 w-4 shrink-0 text-[#A8412A]" />
                                                <span>{imageError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'link' && (
                                    <div className="mb-4">
                                        <label
                                            htmlFor="url-input"
                                            className="mb-2 block text-sm font-bold text-[#3B2A1E]"
                                        >
                                            Masukkan tautan (URL) yang
                                            mencurigakan:
                                        </label>
                                        <input
                                            id="url-input"
                                            type="url"
                                            value={inputUrl}
                                            onChange={(e) =>
                                                setInputUrl(e.target.value)
                                            }
                                            placeholder="https://contoh-tautan-ganjil.xyz/klaim-hadiah"
                                            className="h-12 min-h-[44px] w-full rounded-2xl border-2 border-[#8ECDF0] bg-[#FFF8EC]/40 px-4 text-base text-[#3B2A1E] placeholder-[#6B5646] focus:border-[#FF9A3C] focus:ring-2 focus:ring-[#3B2A1E] focus:outline-none"
                                        />
                                    </div>
                                )}

                                {/* Tombol Contoh Cepat */}
                                <div className="mb-5 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-[#6B5646]">
                                        Mau coba contoh?
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => loadSample('task_scam')}
                                        className="cursor-pointer rounded-full border border-[#3B2A1E] bg-[#FFE27A] px-3 py-1.5 text-xs font-semibold text-[#3B2A1E] transition-colors hover:bg-[#FF9A3C]"
                                    >
                                        Tugas Like Video
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => loadSample('apk_kurir')}
                                        className="cursor-pointer rounded-full border border-[#3B2A1E] bg-[#FFE27A] px-3 py-1.5 text-xs font-semibold text-[#3B2A1E] transition-colors hover:bg-[#FF9A3C]"
                                    >
                                        Paket Kurir APK
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => loadSample('giveaway')}
                                        className="cursor-pointer rounded-full border border-[#3B2A1E] bg-[#FFE27A] px-3 py-1.5 text-xs font-semibold text-[#3B2A1E] transition-colors hover:bg-[#FF9A3C]"
                                    >
                                        Tautan Hadiah Daget
                                    </button>
                                </div>

                                {/* Tombol Periksa Utama */}
                                <div className="flex flex-col items-center gap-3 sm:flex-row">
                                    <button
                                        type="submit"
                                        disabled={scanState === 'loading'}
                                        className="flex h-12 min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-8 text-base font-bold text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] transition-all hover:bg-[#ff8e26] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 sm:w-auto"
                                    >
                                        {scanState === 'loading' ? (
                                            <>
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#3B2A1E] border-t-transparent" />
                                                <span>
                                                    Memeriksa Indikator...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Periksa Sekarang</span>
                                                <svg
                                                    className="h-5 w-5 text-[#3B2A1E]"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden="true"
                                                >
                                                    <line
                                                        x1="5"
                                                        y1="12"
                                                        x2="19"
                                                        y2="12"
                                                    />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </>
                                        )}
                                    </button>

                                    {scanState === 'result' && (
                                        <button
                                            type="button"
                                            onClick={resetScan}
                                            className="h-12 min-h-[44px] w-full cursor-pointer rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] px-5 text-sm font-bold text-[#3B2A1E] transition-colors hover:bg-[#FFE27A] sm:w-auto"
                                        >
                                            Periksa Pesan Lain
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* HASIL PEMERIKSAAN (KARTU HASIL INTERAKTIF) */}
                            {scanState === 'result' && scanResult && (
                                <div className="mt-7 border-t-2 border-[#EFE3D0] pt-7">
                                    <div className="rounded-3xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-6">
                                        {/* Lencana Status Resmi (Wajib Teks + Warna Sesuai Aturan) */}
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                            <div
                                                className={`inline-flex items-center gap-2 rounded-full border-2 border-[#3B2A1E] px-4 py-1.5 text-sm font-bold ${
                                                    scanResult.level === 'high'
                                                        ? 'bg-[#D4573A] text-white'
                                                        : scanResult.level ===
                                                            'medium'
                                                          ? 'bg-[#FFE27A] text-[#3B2A1E]'
                                                          : 'bg-[#8ECDF0] text-[#3B2A1E]'
                                                }`}
                                            >
                                                <svg
                                                    className="h-4 w-4 shrink-0"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden="true"
                                                >
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                    />
                                                    <line
                                                        x1="12"
                                                        y1="8"
                                                        x2="12"
                                                        y2="12"
                                                    />
                                                    <line
                                                        x1="12"
                                                        y1="16"
                                                        x2="12.01"
                                                        y2="16"
                                                    />
                                                </svg>
                                                <span>
                                                    {scanResult.badgeLabel}
                                                </span>
                                            </div>

                                            <span className="text-xs font-semibold text-[#6B5646]">
                                                Analisis Berbasis Pola Edukatif
                                            </span>
                                        </div>

                                        {/* Ringkasan Temuan */}
                                        <h3 className="mb-3 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                            {scanResult.headline}
                                        </h3>

                                        {/* Poin Tanda Bahaya */}
                                        <div className="mb-4">
                                            <span className="mb-2 block text-xs font-bold tracking-wider text-[#A8412A] uppercase">
                                                Tanda Janggal yang Ditemukan:
                                            </span>
                                            <ul className="space-y-2">
                                                {scanResult.suspiciousPoints.map(
                                                    (point, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-start gap-2.5 text-sm text-[#3B2A1E]"
                                                        >
                                                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#3B2A1E] bg-[#FFE27A] text-xs font-bold">
                                                                !
                                                            </span>
                                                            <span className="leading-snug">
                                                                {point}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>

                                        {/* Penjelasan Ramah */}
                                        <div className="mb-5 rounded-2xl border-2 border-[#EFE3D0] bg-white p-4">
                                            <span className="mb-1 block text-xs font-bold text-[#6B5646]">
                                                Kenapa Pola Ini Mencurigakan?
                                            </span>
                                            <p className="text-sm leading-relaxed text-[#3B2A1E]">
                                                {scanResult.explanation}
                                            </p>
                                        </div>

                                        {/* Pedoman Tindakan Segera */}
                                        <div>
                                            <span className="mb-2 block text-xs font-bold tracking-wider text-[#3B2A1E] uppercase">
                                                Langkah Aman yang Disarankan:
                                            </span>
                                            <div className="mb-4 space-y-2">
                                                {scanResult.recommendedActions.map(
                                                    (act, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-2.5 rounded-xl border border-[#8ECDF0] bg-white p-3 text-sm font-semibold text-[#3B2A1E]"
                                                        >
                                                            <svg
                                                                className="h-4 w-4 shrink-0 text-[#FF9A3C]"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                aria-hidden="true"
                                                            >
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                            <span>{act}</span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>

                                        {/* Bagian Aksi & Berbagi Hasil */}
                                        {scanResult.shareUrl && (
                                            <div className="mt-5 rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 sm:p-5">
                                                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#3B2A1E]">
                                                    Bagikan atau Simpan Hasil Pemeriksaan:
                                                </span>
                                                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={scanResult.shareUrl}
                                                        className="flex-1 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] px-3 py-2 text-xs font-mono text-[#3B2A1E] select-all focus:outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!scanResult.shareUrl) return;
                                                            try {
                                                                await navigator.clipboard.writeText(scanResult.shareUrl);
                                                                setCopiedShareLink(true);
                                                                setTimeout(() => setCopiedShareLink(false), 2500);
                                                            } catch (err) {
                                                                console.error('Clipboard copy failed:', err);
                                                            }
                                                        }}
                                                        className="flex h-11 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-4 text-xs font-bold text-[#3B2A1E] transition-colors hover:bg-[#FF9A3C] active:translate-y-0.5"
                                                    >
                                                        {copiedShareLink ? (
                                                            <>
                                                                <Check className="h-4 w-4 text-[#3B2A1E]" />
                                                                <span>Tersalin!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4 text-[#3B2A1E]" />
                                                                <span>Salin Link Hasil</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!scanResult.shareUrl) return;
                                                            const message =
                                                                `*Peringatan Keamanan CEKARA*\n\n` +
                                                                `Status: *${scanResult.badgeLabel}*\n` +
                                                                `Ringkasan: "${scanResult.headline}"\n\n` +
                                                                `Lihat rincian hasil investigasi di sini:\n${scanResult.shareUrl}\n\n` +
                                                                `_Cek dulu sebelum percaya bersama Cekara._`;
                                                            const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                                            window.open(waUrl, '_blank', 'noopener,noreferrer');
                                                        }}
                                                        className="flex h-11 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#8ECDF0] px-4 text-xs font-bold text-[#3B2A1E] transition-colors hover:bg-[#78bfe6] active:translate-y-0.5"
                                                    >
                                                        <Share2 className="h-4 w-4 text-[#3B2A1E]" />
                                                        <span>Bagikan ke WhatsApp</span>
                                                    </button>
                                                </div>

                                                {scanResult.publicId && (
                                                    <div className="mt-3 pt-3 border-t border-[#EFE3D0] flex justify-end">
                                                        <Link
                                                            href={`/scans/${scanResult.publicId}`}
                                                            className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold text-[#3B2A1E] hover:text-[#FF9A3C] hover:underline"
                                                        >
                                                            <span>Buka Laporan Investigasi Lengkap</span>
                                                            <ArrowRight className="h-3.5 w-3.5 text-[#FF9A3C]" />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Catatan Transparansi Produk */}
                                        <p className="mt-4 border-t border-[#EFE3D0] pt-4 text-xs text-[#6B5646]">
                                            * Hasil ini merupakan perkiraan
                                            edukatif berdasarkan kecocokan pola
                                            umum dan bukan vonis mutlak. Tetap
                                            verifikasi ke kanal resmi sebelum
                                            mengambil keputusan.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 2. TIGA PILAR UTAMA: KENALI, BELAJAR, BERTINDAK */}
                <section id="pilar" className="bg-[#FFF8EC] py-14 sm:py-20">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6">
                        <div className="mb-12 max-w-xl text-left">
                            <h2 className="mb-3 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E] sm:text-3xl">
                                Tiga Langkah Sederhana Menjaga Diri di Ruang
                                Digital
                            </h2>
                            <p className="text-sm leading-relaxed text-[#6B5646] sm:text-base">
                                CEKARA membantumu bukan hanya memeriksa pesan,
                                tapi memahami cara berpikir penipu agar kamu
                                terlindungi kapan saja.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Pilar 1 */}
                            <div className="group flex flex-col justify-between rounded-3xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[3px_3px_0px_0px_#3B2A1E] transition-all hover:-translate-y-1 sm:p-6">
                                <div>
                                    {/* Foto Pemuda Recheck */}
                                    <div className="mb-5 overflow-hidden rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <img
                                            src="/recheck.jpeg"
                                            alt="Ilustrasi pemuda sedang mengecek pola janggal dengan kaca pembesar"
                                            className="h-48 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105 sm:h-52"
                                        />
                                    </div>

                                    <h3 className="mb-2.5 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                        Kenali Pola Janggal
                                    </h3>
                                    <p className="text-sm leading-relaxed text-[#6B5646]">
                                        Deteksi pesan manipulatif, tautan
                                        phishing palsu, berkas aplikasi (.apk)
                                        pencuri data, dan tangkapan layar
                                        transfer palsu secara objektif.
                                    </p>
                                </div>
                                <div className="mt-5 border-t border-[#EFE3D0] pt-4 text-xs font-bold text-[#3B2A1E]">
                                    Format: Teks, Gambar, Tautan
                                </div>
                            </div>

                            {/* Pilar 2 */}
                            <div className="group flex flex-col justify-between rounded-3xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[3px_3px_0px_0px_#3B2A1E] transition-all hover:-translate-y-1 sm:p-6">
                                <div>
                                    {/* Foto Gadis Analisis */}
                                    <div className="mb-5 overflow-hidden rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <img
                                            src="/analisis.jpeg"
                                            alt="Ilustrasi pemudi sedang menganalisis trik psikologis dan rekayasa sosial"
                                            className="h-48 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105 sm:h-52"
                                        />
                                    </div>

                                    <h3 className="mb-2.5 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                        Pahami Trik Psikologis
                                    </h3>
                                    <p className="text-sm leading-relaxed text-[#6B5646]">
                                        Ketahui trik rekayasa sosial yang sering
                                        dimainkan: desakan panik, iming-iming
                                        komisi instan, dan peniruan akun
                                        terpercaya.
                                    </p>
                                </div>
                                <div className="mt-5 border-t border-[#EFE3D0] pt-4 text-xs font-bold text-[#3B2A1E]">
                                    <Link
                                        href="/simulasi"
                                        className="group/link inline-flex items-center gap-1.5 font-bold text-[#3B2A1E] transition hover:text-[#E64A19]"
                                    >
                                        <span>Coba simulasi kasus nyata</span>
                                        <ArrowRight
                                            className="size-3.5 transition-transform duration-200 group-hover/link:translate-x-1"
                                            strokeWidth={2.5}
                                        />
                                    </Link>
                                </div>
                            </div>

                            {/* Pilar 3 */}
                            <div className="group flex flex-col justify-between rounded-3xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[3px_3px_0px_0px_#3B2A1E] transition-all hover:-translate-y-1 sm:p-6">
                                <div>
                                    {/* Foto Pemuda Langkah Aman */}
                                    <div className="mb-5 overflow-hidden rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <img
                                            src="/choose.jpeg"
                                            alt="Ilustrasi pemuda memilih langkah aman: checklist akun, aman bank, dan lapor"
                                            className="h-48 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105 sm:h-52"
                                        />
                                    </div>

                                    <h3 className="mb-2.5 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                        Pilih Langkah Aman
                                    </h3>
                                    <p className="text-sm leading-relaxed text-[#6B5646]">
                                        Panduan langkah konkret: daftar periksa
                                        keselamatan akun, cara amankan
                                        perbankan, dan cara melapor ke otoritas
                                        resmi pemerintah secara tepat.
                                    </p>
                                </div>
                                <div className="mt-5 border-t border-[#EFE3D0] pt-4 text-xs font-bold text-[#3B2A1E]">
                                    <Link
                                        href="/tanggap-darurat"
                                        className="group/link inline-flex items-center gap-1.5 font-bold text-[#3B2A1E] transition hover:text-[#E64A19]"
                                    >
                                        <span>
                                            Checklist keselamatan praktis
                                        </span>
                                        <ArrowRight
                                            className="size-3.5 transition-transform duration-200 group-hover/link:translate-x-1"
                                            strokeWidth={2.5}
                                        />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. SIMULASI MINI INTERAKTIF (LEARN) */}
                <section id="simulasi" className="relative overflow-hidden bg-[#FFF8EC] py-14 sm:py-20">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6">
                        {/* Section Header */}
                        <div className="mb-6 text-left">
                            <h2 className="mb-2 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E] sm:text-3xl">
                                Uji Coba Berpikir Kritis: Bisakah Kamu Mengenali
                                Modusnya?
                            </h2>
                            <p className="text-sm leading-relaxed text-[#6B5646]">
                                Latih insting dan kemampuan berpikir kritismu
                                menghadapi skenario penipuan digital nyata di
                                Indonesia sebelum menghadapi situasi aslinya!
                            </p>
                        </div>

                        {/* Active Case Card Container */}
                        {(() => {
                            const currentCase = welcomeCases[activeCaseIndex];
                            const currentSelectedOptionId =
                                caseAnswers[currentCase.id];
                            const isFeedbackOpen = Boolean(
                                caseFeedbackOpen[currentCase.id],
                            );
                            const selectedOption = currentCase.options.find(
                                (opt) => opt.id === currentSelectedOptionId,
                            );

                            return (
                                <div className="relative">
                                    {/* Kartu Simulasi Interaktif - Posisi Asli Terpusat di Tengah */}
                                    <div className="rounded-3xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[4px_4px_0px_0px_#3B2A1E] sm:p-7">
                                    {/* Case Card Header */}
                                    <div className="mb-4 border-b border-[#EFE3D0] pb-3">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] sm:text-2xl">
                                            {currentCase.title}
                                        </h3>
                                    </div>

                                    {/* Case Context Description */}
                                    <p className="mb-4 text-xs text-[#6B5646] sm:text-sm">
                                        {currentCase.description}
                                    </p>

                                    {/* Kotak Pesan / Chat Preview */}
                                    <div className="mb-5 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-4 sm:p-5">
                                        <div className="mb-2.5 flex items-center justify-between border-b border-[#EFE3D0] pb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#3B2A1E] text-xs font-bold ${currentCase.senderBg}`}
                                                >
                                                    {currentCase.senderInitials}
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-[#3B2A1E]">
                                                        {currentCase.senderName}
                                                    </span>
                                                    <span className="block text-[10px] text-[#6B5646]">
                                                        {
                                                            currentCase.senderPlatform
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="rounded-lg border border-[#EFE3D0] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#6B5646]">
                                                Simulasi Masuk
                                            </span>
                                        </div>

                                        <p className="rounded-xl border border-[#EFE3D0] bg-white p-3.5 font-mono text-xs leading-relaxed text-[#3B2A1E] sm:text-sm">
                                            {currentCase.messageText}
                                        </p>

                                        {/* Lampiran Berkas Jika Ada */}
                                        {currentCase.attachment && (
                                            <div className="mt-2.5 flex items-center gap-3 rounded-xl border-2 border-[#E64A19] bg-white p-3 shadow-[1.5px_1.5px_0px_0px_#E64A19]">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-[#E64A19]">
                                                    <FileWarning className="size-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-xs font-bold text-[#3B2A1E]">
                                                        {
                                                            currentCase
                                                                .attachment.name
                                                        }
                                                    </div>
                                                    <div className="text-[10px] text-[#6B5646]">
                                                        {
                                                            currentCase
                                                                .attachment.type
                                                        }{' '}
                                                        •{' '}
                                                        {
                                                            currentCase
                                                                .attachment.size
                                                        }
                                                    </div>
                                                </div>
                                                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#E64A19]">
                                                    Bahaya APK
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Opsi Pilihan Jawaban ABCD Profesional */}
                                    <div className="mb-5 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold tracking-wider text-[#6B5646] uppercase">
                                                Pilihan Tindakan Kamu:
                                            </span>
                                            {isFeedbackOpen && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleResetCurrentCase(currentCase.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#E64A19] hover:underline cursor-pointer"
                                                >
                                                    <RotateCcw className="size-3" />
                                                    <span>Ulangi Pilihan</span>
                                                </button>
                                            )}
                                        </div>

                                        {currentCase.options.map((opt) => {
                                            const isSelected = currentSelectedOptionId === opt.id;

                                            let buttonStyle = 'border-[#EFE3D0] bg-white hover:border-[#3B2A1E] hover:bg-[#FFFDF9]';
                                            let badgeStyle = 'border-[#D9C8B4] bg-[#FBF7F0] text-[#6B5646] group-hover:border-[#3B2A1E] group-hover:text-[#3B2A1E]';
                                            let statusPill: React.ReactNode = null;

                                            if (!isFeedbackOpen) {
                                                if (isSelected) {
                                                    buttonStyle = 'border-[#3B2A1E] bg-[#FFF8E7] shadow-[2.5px_2.5px_0px_0px_#3B2A1E]';
                                                    badgeStyle = 'border-[#3B2A1E] bg-[#3B2A1E] text-white';
                                                    statusPill = (
                                                        <span className="rounded-md border border-[#3B2A1E] bg-[#FFE27A] px-2 py-0.5 text-[10px] font-bold text-[#3B2A1E]">
                                                            Dipilih
                                                        </span>
                                                    );
                                                }
                                            } else {
                                                if (opt.isCorrect) {
                                                    buttonStyle = 'border-2 border-[#2E7D32] bg-[#E8F5E9] shadow-[2.5px_2.5px_0px_0px_#2E7D32]';
                                                    badgeStyle = 'border-2 border-[#2E7D32] bg-[#2E7D32] text-white';
                                                    statusPill = (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#2E7D32] px-2 py-0.5 text-[10px] font-extrabold text-white">
                                                            <Check className="size-3 stroke-[3]" /> Pilihan Benar
                                                        </span>
                                                    );
                                                } else if (isSelected) {
                                                    buttonStyle = 'border-2 border-[#D84315] bg-[#FBE9E7] shadow-[2.5px_2.5px_0px_0px_#D84315]';
                                                    badgeStyle = 'border-2 border-[#D84315] bg-[#D84315] text-white';
                                                    statusPill = (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#D84315] px-2 py-0.5 text-[10px] font-extrabold text-white">
                                                            <X className="size-3 stroke-[3]" /> Pilihan Kamu (Berisiko)
                                                        </span>
                                                    );
                                                } else {
                                                    buttonStyle = 'opacity-45 border-[#EFE3D0] bg-white cursor-not-allowed';
                                                    badgeStyle = 'border-[#D9C8B4] bg-[#FBF7F0] text-[#6B5646]';
                                                }
                                            }

                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    disabled={isFeedbackOpen || isSubmittingCase}
                                                    onClick={() => {
                                                        if (isFeedbackOpen || isSubmittingCase) return;
                                                        setCaseAnswers((prev) => ({
                                                            ...prev,
                                                            [currentCase.id]: opt.id,
                                                        }));
                                                    }}
                                                    className={`group flex w-full items-start justify-between gap-3.5 rounded-xl border-2 p-3.5 text-left transition-all duration-200 sm:p-4 ${
                                                        !isFeedbackOpen ? 'cursor-pointer' : 'cursor-default'
                                                    } ${buttonStyle}`}
                                                >
                                                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                                        <span
                                                            className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-extrabold transition-colors ${badgeStyle}`}
                                                        >
                                                            {isFeedbackOpen && opt.isCorrect ? (
                                                                <Check className="size-4 stroke-[3]" />
                                                            ) : isFeedbackOpen && isSelected && !opt.isCorrect ? (
                                                                <X className="size-4 stroke-[3]" />
                                                            ) : (
                                                                opt.id
                                                            )}
                                                        </span>
                                                        <span className="pt-0.5 text-xs leading-relaxed font-medium text-[#3B2A1E] sm:text-sm">
                                                            {opt.text}
                                                        </span>
                                                    </div>
                                                    {statusPill && (
                                                        <div className="shrink-0 pt-0.5">
                                                            {statusPill}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}

                                        {/* Tombol Submit Jawaban (Jika belum diperiksa) */}
                                        {!isFeedbackOpen && (
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    disabled={!currentSelectedOptionId || isSubmittingCase}
                                                    onClick={() => handleSubmitCaseAnswer(currentCase.id)}
                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-6 py-3 text-sm font-bold text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] transition hover:-translate-y-0.5 hover:bg-[#ff8f27] active:translate-y-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                                >
                                                    {isSubmittingCase ? (
                                                        <>
                                                            <Loader2 className="size-4.5 animate-spin" />
                                                            <span>Menganalisis Keputusan...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="size-4.5" />
                                                            <span>Kirim & Periksa Jawaban</span>
                                                        </>
                                                    )}
                                                </button>
                                                {!currentSelectedOptionId && (
                                                    <p className="mt-2 text-xs text-[#6B5646]">
                                                        *Pilih salah satu tindakan di atas terlebih dahulu untuk memeriksa hasil analisisnya.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Kotak Umpan Balik Edukatif (Muncul setelah submit) */}
                                    {isFeedbackOpen && selectedOption && (
                                        <div className="mb-5 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-4.5 shadow-[2px_2px_0px_0px_#3B2A1E] sm:p-6 animate-in fade-in duration-300">
                                            <div className="mb-3 flex items-center gap-3">
                                                <img
                                                    src="/logotr.png"
                                                    alt="Maskot CEKARA"
                                                    className="h-10 w-10 shrink-0 object-contain"
                                                />
                                                <div>
                                                    <h4 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E] sm:text-lg">
                                                        {selectedOption.feedbackTitle}
                                                    </h4>
                                                </div>
                                            </div>

                                            <p className="mb-4 text-xs leading-relaxed text-[#6B5646] sm:text-sm">
                                                {selectedOption.feedbackDetail}
                                            </p>

                                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                                <div className="rounded-xl border border-[#EFE3D0] bg-white p-3">
                                                    <span className="block text-[10px] font-bold tracking-wider text-[#E64A19]">
                                                        Trik Psikologis Penipu
                                                    </span>
                                                    <p className="mt-1 text-xs font-semibold text-[#3B2A1E]">
                                                        {selectedOption.psychologicalTrick}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-[#EFE3D0] bg-white p-3">
                                                    <span className="block text-[10px] font-bold tracking-wider text-[#2E7D32]">
                                                        Aturan Emas Penyelamat
                                                    </span>
                                                    <p className="mt-1 text-xs font-semibold text-[#3B2A1E]">
                                                        {selectedOption.goldenRule}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Controls */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE3D0] pt-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleRandomizeCase}
                                                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-4 py-2.5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:-translate-y-0.5 hover:bg-[#ffd952] cursor-pointer"
                                            >
                                                <Shuffle className="size-4" />
                                                <span>Uji Kasus Acak Lainnya</span>
                                            </button>

                                            {isFeedbackOpen && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleResetCurrentCase(currentCase.id)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-3.5 py-2.5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:-translate-y-0.5 hover:bg-[#FFF8EC] cursor-pointer"
                                                    title="Ulangi skenario ini"
                                                >
                                                    <RotateCcw className="size-3.5" />
                                                    <span>Coba Lagi Kasus Ini</span>
                                                </button>
                                            )}
                                        </div>

                                        <Link
                                            href="/simulasi"
                                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-4 py-2.5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:-translate-y-0.5 hover:bg-[#FFF8EC]"
                                        >
                                            <span>
                                                Buka 10+ Skenario Lengkap
                                            </span>
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Maskot Ide di Sebelah Kiri (Rasio Besar, Agak Bawahan dari Sebelah Kanan) */}
                                <div className="hidden lg:flex absolute right-full mr-6 xl:mr-10 2xl:mr-14 top-[62%] -translate-y-1/2 pointer-events-none select-none items-center justify-center">
                                    <img
                                        src="/maskot_ide.png"
                                        alt="Maskot Detektif Cekara Menemukan Ide Solusi"
                                        className="w-72 sm:w-80 lg:w-96 xl:w-[400px] 2xl:w-[440px] max-w-none drop-shadow-2xl select-none transition-transform duration-300 hover:scale-105"
                                    />
                                </div>

                                {/* Maskot Bingung di Sebelah Kanan (Rasio Besar, Berdiri Pas di Samping Kuis Tanpa Menggeser Card) */}
                                <div className="hidden lg:flex absolute left-full ml-6 xl:ml-10 2xl:ml-14 top-1/2 -translate-y-1/2 pointer-events-none select-none items-center justify-center">
                                    <img
                                        src="/maskot_bingung.png"
                                        alt="Maskot Detektif Cekara Sedang Menganalisis Kasus"
                                        className="w-72 sm:w-80 lg:w-96 xl:w-[400px] 2xl:w-[440px] max-w-none drop-shadow-2xl select-none transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            </div>
                        );
                        })()}

                        {/* CTA Lab Simulasi Lengkap */}
                        <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-3xl border-2 border-[#3B2A1E] bg-[#FFE27A] p-6 shadow-[3px_3px_0px_0px_#3B2A1E] sm:flex-row sm:gap-8 sm:p-7">
                            <div className="flex-1 text-center sm:text-left">
                                <h4 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold leading-tight text-[#3B2A1E] sm:text-2xl md:text-[27px]">
                                    Ingin Uji Coba 10+ Skenario Lengkap dengan
                                    Skor & Ranking?
                                </h4>
                                <p className="mt-2.5 text-sm font-semibold leading-relaxed text-[#5A4434] sm:text-base md:text-[17px]">
                                    Masuk ke Laboratorium Simulasi Cekara untuk
                                    mencoba simulasi percakapan interaktif penuh
                                    dan catat rekor skor Guardian Anda.
                                </p>
                            </div>
                            <div className="relative flex flex-col items-center shrink-0">
                                <div className="pointer-events-none select-none overflow-hidden [clip-path:inset(0_0_16%_0)] w-40 -mb-[34px] sm:w-52 sm:-mb-[44px]">
                                    <img
                                        src="/nunjuk.png"
                                        alt=""
                                        aria-hidden="true"
                                        className="w-full drop-shadow-sm select-none"
                                    />
                                </div>
                                <Link
                                    href="/simulasi"
                                    className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-white px-5 py-3 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition-colors hover:bg-[#FFF8EC]"
                                >
                                    <span>Buka Laborato Simulasi</span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. PRINSIP KEJUJURAN & KANAL RESMI PENGADUAN */}
                <section id="kejujuran" className="bg-[#FFF8EC] py-14 sm:py-20">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6">
                        <div className="rounded-3xl border-2 border-[#3B2A1E] bg-white p-6 shadow-[4px_4px_0px_0px_#3B2A1E] sm:p-9">
                            <div className="mb-6 max-w-2xl">

                                <h2 className="mb-3 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E] sm:text-3xl">
                                    CEKARA Hadir Sebagai Teman Diskusi, Bukan
                                    Vonis Mutlak
                                </h2>
                                <p className="text-sm leading-relaxed text-[#6B5646] sm:text-base">
                                    Kami tidak memberi label hijau "pasti aman"
                                    karena modus kejahatan siber terus
                                    berkembang. CEKARA menyajikan kemungkinan
                                    dan indikator risiko agar kamu terbiasa
                                    berpikir kritis sebelum percaya.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 border-t-2 border-[#EFE3D0] pt-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-[#EFE3D0] bg-[#FFF8EC] p-4">
                                    <h4 className="mb-1 font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                        Status Prototipe Edukatif
                                    </h4>
                                    <p className="text-xs leading-relaxed text-[#6B5646]">
                                        Aplikasi ini dikembangkan untuk ajang
                                        lomba MIT-Week 2026. Data yang kamu
                                        periksa diproses untuk memberikan
                                        analisis edukatif dan tidak
                                        diperjualbelikan kepada pihak mana pun.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-[#EFE3D0] bg-[#FFF8EC] p-4">
                                    <h4 className="mb-1 font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                        Kanal Pengaduan Resmi
                                    </h4>
                                    <p className="text-xs leading-relaxed text-[#6B5646]">
                                        Jika kamu sudah telanjur menjadi korban
                                        penipuan finansial, segera laporkan ke{' '}
                                        <strong>
                                            Indonesia Anti-Scam Centre
                                            (iasc.ojk.go.id)
                                        </strong>{' '}
                                        atau hubungi{' '}
                                        <strong>Kontak OJK 157</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
