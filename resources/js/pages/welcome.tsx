import { Head } from '@inertiajs/react';
import { useState } from 'react';

// Tipe data untuk status hasil pengecekan sesuai ATURAN-DESAIN.md
type RiskLevel = 'high' | 'medium' | 'undetected';

interface ScanResult {
    level: RiskLevel;
    badgeLabel: string;
    headline: string;
    suspiciousPoints: string[];
    explanation: string;
    recommendedActions: string[];
}

export default function Welcome() {
    // Tab pemeriksaan: 'text' | 'image' | 'link'
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'link'>('text');
    const [inputText, setInputText] = useState('');
    const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
    const [inputUrl, setInputUrl] = useState('');
    
    // Status alur interaksi: 'idle' | 'loading' | 'result'
    const [scanState, setScanState] = useState<'idle' | 'loading' | 'result'>('idle');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    // Mini simulasi di landing page
    const [simAnswer, setSimAnswer] = useState<number | null>(null);
    const [simFeedbackOpen, setSimFeedbackOpen] = useState(false);

    // Contoh cepat untuk dicoba langsung oleh pelajar
    const loadSample = (type: 'task_scam' | 'apk_kurir' | 'giveaway') => {
        if (type === 'task_scam') {
            setActiveTab('text');
            setInputText(
                'Halo kak! Kami dari PT Media Nusantara membuka loker freelance paruh waktu. Tugasnya cuma like video YouTube dan follow akun medsos. Komisi Rp50.000 - Rp200.000 per tugas. Tapi sebelum mulai, silakan transfer uang jaminan deposit Rp100.000 ke rekening admin ya kak.'
            );
        } else if (type === 'apk_kurir') {
            setActiveTab('text');
            setInputText(
                'Selamat siang, dari kurir J&T Express. Paket Anda tertahan di gudang karena resi rusak. Silakan instal aplikasi resi pengiriman berikut untuk melacak paket: LIHAT_FOTO_PAKET.apk'
            );
        } else {
            setActiveTab('link');
            setInputUrl('https://daget-dana-kaget-gratis-2026.xyz/klaim-sekarang');
        }
        setScanState('idle');
        setScanResult(null);
    };

    // Simulasi aksi pemeriksaan
    const handleRunCheck = (e: React.FormEvent) => {
        e.preventDefault();
        
        let hasContent = false;
        if (activeTab === 'text' && inputText.trim().length > 0) hasContent = true;
        if (activeTab === 'image' && selectedImageName) hasContent = true;
        if (activeTab === 'link' && inputUrl.trim().length > 0) hasContent = true;

        if (!hasContent) return;

        setScanState('loading');

        setTimeout(() => {
            if (activeTab === 'text') {
                const lower = inputText.toLowerCase();
                if (lower.includes('deposit') || lower.includes('.apk') || lower.includes('transfer uang') || lower.includes('otp')) {
                    setScanResult({
                        level: 'high',
                        badgeLabel: 'Hati-hati, ini mencurigakan',
                        headline: 'Ditemukan tanda bahaya yang sering muncul pada modus penipuan tugas berbayar & berkas berbahaya.',
                        suspiciousPoints: [
                            'Meminta transfer uang muka / deposit jaminan sebelum kamu mulai bekerja.',
                            'Menawarkan imbalan uang yang tidak masuk akal untuk tugas yang sangat ringan (like video/follow).',
                            lower.includes('.apk') ? 'Mengirimkan berkas berekstensi .apk yang berpotensi mencuri SMS & kode perbankan.' : 'Pola manipulasi mendesak pengguna untuk segera mengirim uang.'
                        ],
                        explanation: 'Di dunia kerja nyata, perusahaan yang membayar karyawan, bukan karyawan yang membayar perusahaan. Tawaran seperti ini biasanya memancing di awal dengan uang kecil, lalu meminta setoran yang makin besar hingga uangmu lenyap.',
                        recommendedActions: [
                            'Jangan transfer uang dalam jumlah berapa pun.',
                            'Jangan klik tautan atau pasang berkas yang dikirimkan.',
                            'Blokir nomor pengirim dan laporkan ke kanal Indonesia Anti-Scam Centre (iasc.ojk.go.id).'
                        ]
                    });
                } else {
                    setScanResult({
                        level: 'medium',
                        badgeLabel: 'Yuk cek dulu',
                        headline: 'Pesan ini perlu dicek ulang ke sumber resminya sebelum dipercaya.',
                        suspiciousPoints: [
                            'Gaya bahasa terkesan terburu-buru atau menawarkan keuntungan tanpa kejelasan identitas resmi pengirim.',
                            'Belum ada bukti legalitas yang bisa diverifikasi langsung dari saluran resmi.'
                        ],
                        explanation: 'Meskipun tidak secara terang-terangan meminta uang atau data sensitif, tawaran tanpa kejelasan kontak resmi perusahaan berisiko mengarahkanmu ke obrolan privat berbahaya.',
                        recommendedActions: [
                            'Cek nama perusahaan atau akun pengirim di mesin pencari resmi.',
                            'Tanyakan pendapat teman atau keluarga sebelum mengambil tindakan lanjutan.'
                        ]
                    });
                }
            } else if (activeTab === 'image') {
                setScanResult({
                    level: 'high',
                    badgeLabel: 'Hati-hati, ini mencurigakan',
                    headline: 'Tangkapan layar terindikasi memuat manipulasi visual atau format bukti tidak resmi.',
                    suspiciousPoints: [
                        'Tata letak font atau perataan teks pada struk transfer tampak tidak konsisten dengan format resmi perbankan.',
                        'Tidak tercantum nomor referensi transaksi yang dapat dilacak secara sah.'
                    ],
                    explanation: 'Penipu sering memakai generator struk palsu untuk meyakinkan korban bahwa uang sudah dikirim, lalu mendesak korban mengirimkan barang atau uang kembali.',
                    recommendedActions: [
                        'Cek mutasi rekening langsung lewat aplikasi m-banking atau ATM kamu, bukan dari struk kiriman orang lain.',
                        'Jangan percaya tangkapan layar saldo sebelum kamu melihat saldomu bertambah sendiri.'
                    ]
                });
            } else {
                setScanResult({
                    level: 'high',
                    badgeLabel: 'Hati-hati, ini mencurigakan',
                    headline: 'Tautan menggunakan domain tidak lazim yang menyerupai nama merek terpercaya (phishing).',
                    suspiciousPoints: [
                        'Akhiran domain (.xyz / domain gratis) jarang digunakan oleh lembaga resmi atau dompet digital.',
                        'Nama tautan meniru kata kunci populer untuk memancing kamu login atau memasukkan data rahasia.'
                    ],
                    explanation: 'Tautan palsu seperti ini dibuat menyerupai halaman asli untuk mencuri kata sandi, PIN dompet digital, atau kode OTP.',
                    recommendedActions: [
                        'Jangan masukkan nomor HP, PIN, atau kata sandi di situs tersebut.',
                        'Tutup segera tab peramban dan pastikan akun dompet digitalmu masih aktif aman.'
                    ]
                });
            }
            setScanState('result');
        }, 1200);
    };

    const resetScan = () => {
        setScanState('idle');
        setScanResult(null);
    };

    return (
        <>
            <Head title="CEKARA - Cek dulu sebelum percaya" />

            <div className="min-h-screen bg-[#FFF8EC] text-[#3B2A1E] font-['Nunito',system-ui,sans-serif] selection:bg-[#FFE27A] selection:text-[#3B2A1E]">
                
                {/* 1. HEADER / NAVIGASI */}
                <header className="sticky top-0 z-30 bg-[#FFF8EC] border-b-2 border-[#EFE3D0]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                        
                        {/* Logo Brand */}
                        <a href="#hero" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-[#3B2A1E] rounded-xl p-1">
                            <img 
                                src="/logo.png" 
                                alt="Logo Maskot CEKARA" 
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0" 
                            />
                            <div>
                                <span className="font-['Fredoka',system-ui,sans-serif] text-2xl font-bold tracking-tight text-[#3B2A1E] block leading-none">
                                    CEKARA
                                </span>
                                <span className="text-[12px] text-[#6B5646] font-semibold block leading-tight mt-0.5">
                                    Cek dulu sebelum percaya
                                </span>
                            </div>
                        </a>

                        {/* Navigasi Menu */}
                        <nav className="hidden md:flex items-center gap-7 text-[15px] font-bold text-[#6B5646]">
                            <a href="#pemeriksa" className="hover:text-[#3B2A1E] transition-colors">
                                Pemeriksa
                            </a>
                            <a href="#pilar" className="hover:text-[#3B2A1E] transition-colors">
                                Cara Kerja
                            </a>
                            <a href="#simulasi" className="hover:text-[#3B2A1E] transition-colors">
                                Simulasi Kasus
                            </a>
                            <a href="#kejujuran" className="hover:text-[#3B2A1E] transition-colors">
                                Pedoman & Etika
                            </a>
                        </nav>

                        {/* Tombol Aksi Masuk / Akun */}
                        <div className="flex items-center gap-3">
                            <a
                                href="#login"
                                className="inline-flex items-center justify-center h-11 px-5 rounded-[20px] border-2 border-[#3B2A1E] bg-[#FFF8EC] text-[#3B2A1E] font-bold text-sm hover:bg-[#FFE27A] transition-colors focus-visible:outline-2 focus-visible:outline-[#3B2A1E]"
                            >
                                Masuk Akun
                            </a>
                        </div>
                    </div>
                </header>

                <main>
                    {/* 2. HERO & FITUR PEMERIKSA UTAMA */}
                    <section id="hero" className="pt-8 pb-14 sm:pt-12 sm:pb-20 px-4 sm:px-6">
                        <div className="max-w-4xl mx-auto">
                            
                            {/* Headline & Pengantar (Ramah, Rapi, Sejajar) */}
                            <div className="mb-8 sm:mb-10 text-left max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8ECDF0] border-2 border-[#3B2A1E] text-xs font-bold text-[#3B2A1E] mb-4">
                                    <span>Ruang Aman Belajar Digital Pelajar & Mahasiswa</span>
                                </div>
                                
                                <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl sm:text-4xl md:text-5xl font-bold text-[#3B2A1E] leading-[1.2] mb-4">
                                    Dapat pesan mencurigakan?{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Tenang, kita cek bareng.
                                        {/* Hiasan Garis Bergelombang Buatan Tangan (SVG hemat) */}
                                        <svg 
                                            className="absolute -bottom-2 left-0 w-full h-2.5 text-[#FF9A3C]" 
                                            viewBox="0 0 200 9" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                            preserveAspectRatio="none"
                                            aria-hidden="true"
                                        >
                                            <path d="M2 7C25 1 45 7 70 3C95 -1 115 6 140 2C165 -2 185 7 198 3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                </h1>

                                <p className="text-base sm:text-lg text-[#6B5646] font-normal leading-relaxed">
                                    Bantu kamu menilai pesan chat, tawaran kerja freelance, tautan, atau bukti transfer yang bikin ragu—tanpa menghakimi, lengkap dengan alasannya.
                                </p>
                            </div>

                            {/* KOTAK PEMERIKSA (SATU FOKUS UTAMA) */}
                            <div id="pemeriksa" className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#3B2A1E] p-5 sm:p-7 shadow-[4px_4px_0px_0px_#3B2A1E]">
                                
                                {/* Tab Pilihan Format Input */}
                                <div className="flex flex-wrap gap-2 p-1.5 bg-[#FFF8EC] rounded-2xl border-2 border-[#EFE3D0] mb-5">
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('text'); resetScan(); }}
                                        className={`flex-1 min-w-[100px] h-11 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                                            activeTab === 'text'
                                                ? 'bg-[#FF9A3C] text-[#3B2A1E] border-2 border-[#3B2A1E]'
                                                : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Pesan Teks
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('image'); resetScan(); }}
                                        className={`flex-1 min-w-[100px] h-11 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                                            activeTab === 'image'
                                                ? 'bg-[#FF9A3C] text-[#3B2A1E] border-2 border-[#3B2A1E]'
                                                : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                            <circle cx="9" cy="9" r="2" />
                                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                        </svg>
                                        Tangkapan Layar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('link'); resetScan(); }}
                                        className={`flex-1 min-w-[100px] h-11 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                                            activeTab === 'link'
                                                ? 'bg-[#FF9A3C] text-[#3B2A1E] border-2 border-[#3B2A1E]'
                                                : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                        Tautan Website
                                    </button>
                                </div>

                                {/* Form Input Berdasarkan Tab */}
                                <form onSubmit={handleRunCheck}>
                                    {activeTab === 'text' && (
                                        <div className="mb-4">
                                            <label htmlFor="text-input" className="block text-sm font-bold text-[#3B2A1E] mb-2">
                                                Salin dan tempel pesan yang bikin kamu ragu:
                                            </label>
                                            <textarea
                                                id="text-input"
                                                rows={5}
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                placeholder="Contoh: 'Halo kak, kami dari agensi membuka lowongan freelance like video komisi 150rb per tugas. Silakan transfer uang jaminan 50rb...'"
                                                className="w-full p-4 rounded-2xl border-2 border-[#8ECDF0] focus:border-[#FF9A3C] focus:outline-none focus:ring-2 focus:ring-[#3B2A1E] bg-[#FFF8EC]/40 text-[#3B2A1E] text-base placeholder-[#6B5646] resize-y"
                                            />
                                        </div>
                                    )}

                                    {activeTab === 'image' && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-bold text-[#3B2A1E] mb-2">
                                                Unggah tangkapan layar (struk transfer, bukti chat, profil):
                                            </label>
                                            <div 
                                                className="border-2 border-dashed border-[#8ECDF0] rounded-2xl p-6 sm:p-8 text-center bg-[#FFF8EC]/40 hover:bg-[#FFE27A]/20 transition-colors cursor-pointer"
                                                onClick={() => setSelectedImageName('bukti_transfer_palsu.png')}
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-[#8ECDF0] border-2 border-[#3B2A1E] mx-auto flex items-center justify-center mb-3">
                                                    <svg className="w-6 h-6 text-[#3B2A1E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" x2="12" y1="3" y2="15" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-bold text-[#3B2A1E] mb-1">
                                                    {selectedImageName ? `Berkas terpilih: ${selectedImageName}` : 'Klik untuk pilih foto atau tarik berkas ke sini'}
                                                </p>
                                                <p className="text-xs text-[#6B5646]">
                                                    Mendukung format JPG atau PNG (Maksimal 5 MB)
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'link' && (
                                        <div className="mb-4">
                                            <label htmlFor="url-input" className="block text-sm font-bold text-[#3B2A1E] mb-2">
                                                Masukkan tautan (URL) yang mencurigakan:
                                            </label>
                                            <input
                                                id="url-input"
                                                type="url"
                                                value={inputUrl}
                                                onChange={(e) => setInputUrl(e.target.value)}
                                                placeholder="https://contoh-tautan-ganjil.xyz/klaim-hadiah"
                                                className="w-full h-12 px-4 rounded-2xl border-2 border-[#8ECDF0] focus:border-[#FF9A3C] focus:outline-none focus:ring-2 focus:ring-[#3B2A1E] bg-[#FFF8EC]/40 text-[#3B2A1E] text-base placeholder-[#6B5646]"
                                            />
                                        </div>
                                    )}

                                    {/* Tombol Contoh Cepat */}
                                    <div className="flex flex-wrap items-center gap-2 mb-5">
                                        <span className="text-xs font-bold text-[#6B5646]">Mau coba contoh?</span>
                                        <button
                                            type="button"
                                            onClick={() => loadSample('task_scam')}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FFE27A] border border-[#3B2A1E] text-[#3B2A1E] hover:bg-[#FF9A3C] transition-colors"
                                        >
                                            Tawaran Like Video
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => loadSample('apk_kurir')}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FFE27A] border border-[#3B2A1E] text-[#3B2A1E] hover:bg-[#FF9A3C] transition-colors"
                                        >
                                            Resi Paket .APK
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => loadSample('giveaway')}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FFE27A] border border-[#3B2A1E] text-[#3B2A1E] hover:bg-[#FF9A3C] transition-colors"
                                        >
                                            Link Saldo Kaget
                                        </button>
                                    </div>

                                    {/* Peringatan Privasi (Wajib di dekat input sesuai panduan) */}
                                    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#EFE3D0] mb-5">
                                        <svg className="w-5 h-5 text-[#FF9A3C] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        <p className="text-xs text-[#6B5646] leading-relaxed">
                                            <strong className="text-[#3B2A1E]">Jaga rahasia pribadi:</strong> Demi keamananmu, jangan tempel kode OTP, kata sandi, PIN, nomor kartu, atau nomor rekening bank di sini ya.
                                        </p>
                                    </div>

                                    {/* Tombol Aksi Pemeriksa */}
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={scanState === 'loading'}
                                            className="w-full sm:w-auto h-12 px-8 rounded-[20px] bg-[#FF9A3C] hover:bg-[#F28A27] text-[#3B2A1E] font-['Fredoka',system-ui,sans-serif] font-bold text-base border-2 border-[#3B2A1E] transition-all shadow-[2px_2px_0px_0px_#3B2A1E] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {scanState === 'loading' ? (
                                                <>
                                                    <svg className="w-5 h-5 animate-spin text-[#3B2A1E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <line x1="12" x2="12" y1="2" y2="6" />
                                                        <line x1="12" x2="12" y1="18" y2="22" />
                                                        <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
                                                        <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
                                                        <line x1="2" x2="6" y1="12" y2="12" />
                                                        <line x1="18" x2="22" y1="12" y2="12" />
                                                        <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
                                                        <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
                                                    </svg>
                                                    Sedang memeriksa...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <circle cx="11" cy="11" r="7" />
                                                        <path d="m21 21-4.35-4.35" />
                                                    </svg>
                                                    Cek Pesan Sekarang
                                                </>
                                            )}
                                        </button>

                                        {scanState === 'result' && (
                                            <button
                                                type="button"
                                                onClick={resetScan}
                                                className="w-full sm:w-auto h-12 px-6 rounded-[20px] bg-transparent hover:bg-[#FFF8EC] text-[#3B2A1E] font-bold text-sm border-2 border-[#3B2A1E] transition-colors"
                                            >
                                                Periksa Pesan Lain
                                            </button>
                                        )}
                                    </div>
                                </form>

                                {/* HASIL PEMERIKSAAN (KARTU HASIL INTERAKTIF) */}
                                {scanState === 'result' && scanResult && (
                                    <div className="mt-7 pt-7 border-t-2 border-[#EFE3D0] animate-fadeIn">
                                        <div className="rounded-3xl border-2 border-[#3B2A1E] p-6 bg-[#FFF8EC]">
                                            
                                            {/* Lencana Status Resmi (Wajib Teks + Warna Sesuai Aturan) */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                                <div 
                                                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border-2 border-[#3B2A1E] ${
                                                        scanResult.level === 'high'
                                                            ? 'bg-[#D4573A] text-white'
                                                            : scanResult.level === 'medium'
                                                            ? 'bg-[#FFE27A] text-[#3B2A1E]'
                                                            : 'bg-[#8ECDF0] text-[#3B2A1E]'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" x2="12" y1="8" y2="12" />
                                                        <line x1="12" x2="12.01" y1="16" y2="16" />
                                                    </svg>
                                                    <span>{scanResult.badgeLabel}</span>
                                                </div>

                                                <span className="text-xs text-[#6B5646] font-semibold">
                                                    Analisis Berbasis Pola Umum
                                                </span>
                                            </div>

                                            {/* Ringkasan Temuan */}
                                            <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] mb-3">
                                                {scanResult.headline}
                                            </h3>

                                            {/* Poin Tanda Bahaya (Tanda Kuning Mentega) */}
                                            <div className="mb-4">
                                                <span className="text-xs font-bold text-[#A8412A] uppercase tracking-wider block mb-2">
                                                    Tanda Janggal yang Ditemukan:
                                                </span>
                                                <ul className="space-y-2">
                                                    {scanResult.suspiciousPoints.map((point, idx) => (
                                                        <li key={idx} className="flex items-start gap-2.5 text-sm text-[#3B2A1E]">
                                                            <span className="w-5 h-5 rounded-full bg-[#FFE27A] border border-[#3B2A1E] flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                                                !
                                                            </span>
                                                            <span className="leading-snug">{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Penjelasan Ramah (Explainability) */}
                                            <div className="p-4 rounded-2xl bg-white border border-[#EFE3D0] mb-5">
                                                <span className="text-xs font-bold text-[#6B5646] block mb-1">
                                                    Kenapa Pola Ini Mencurigakan?
                                                </span>
                                                <p className="text-sm text-[#3B2A1E] leading-relaxed">
                                                    {scanResult.explanation}
                                                </p>
                                            </div>

                                            {/* Pedoman Tindakan Segera (Act) */}
                                            <div>
                                                <span className="text-xs font-bold text-[#3B2A1E] uppercase tracking-wider block mb-2">
                                                    Langkah Aman yang Disarankan:
                                                </span>
                                                <div className="space-y-2 mb-4">
                                                    {scanResult.recommendedActions.map((act, idx) => (
                                                        <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#8ECDF0] text-sm text-[#3B2A1E] font-semibold">
                                                            <svg className="w-4 h-4 text-[#FF9A3C] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                            <span>{act}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Catatan Transparansi Produk */}
                                            <p className="text-xs text-[#6B5646] mt-4 pt-4 border-t border-[#EFE3D0]">
                                                * Hasil ini merupakan perkiraan berdasarkan kecocokan pola umum dan bukan vonis hukum final. Tetap verifikasi ke kanal resmi sebelum mengambil keputusan.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 3. TIGA PILAR UTAMA: KENALI, BELAJAR, BERTINDAK */}
                    <section id="pilar" className="py-14 sm:py-20 border-t-2 border-[#EFE3D0] bg-[#FFF8EC]">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6">
                            
                            <div className="text-left max-w-xl mb-12">
                                <h2 className="font-['Fredoka',system-ui,sans-serif] text-2xl sm:text-3xl font-bold text-[#3B2A1E] mb-3">
                                    Tiga Langkah Sederhana Menjaga Diri di Ruang Digital
                                </h2>
                                <p className="text-base text-[#6B5646]">
                                    CEKARA bukan cuma alat pemindai pesan, tapi ruang belajar biar kamu makin peka membaca gelagat bahaya.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Pilar 1: Kenali */}
                                <div className="bg-white rounded-3xl p-6 border-2 border-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-[#8ECDF0] border-2 border-[#3B2A1E] flex items-center justify-center mb-4">
                                            <svg className="w-6 h-6 text-[#3B2A1E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <circle cx="11" cy="11" r="8" />
                                                <line x1="21" x2="16.65" y1="21" y2="16.65" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-[#6B5646] tracking-wider uppercase block mb-1">
                                            Pilar 1: Recognize
                                        </span>
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] mb-3">
                                            Kenali Polanya
                                        </h3>
                                        <p className="text-sm text-[#6B5646] leading-relaxed">
                                            Menilai pesan, tautan, atau profil yang mencurigakan dengan menunjukkan tanda bahaya (*red flags*) dan membeberkan alasannya secara masuk akal.
                                        </p>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-[#EFE3D0] text-xs font-bold text-[#3B2A1E]">
                                        Pendekatan berbasis penjelasan
                                    </div>
                                </div>

                                {/* Pilar 2: Belajar */}
                                <div className="bg-white rounded-3xl p-6 border-2 border-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-[#FFE27A] border-2 border-[#3B2A1E] flex items-center justify-center mb-4">
                                            <svg className="w-6 h-6 text-[#3B2A1E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-[#6B5646] tracking-wider uppercase block mb-1">
                                            Pilar 2: Learn
                                        </span>
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] mb-3">
                                            Latih Keputusan
                                        </h3>
                                        <p className="text-sm text-[#6B5646] leading-relaxed">
                                            Melatih nalarmu lewat simulasi interaktif berdasarkan skenario nyata yang sering dihadapi pelajar (loker bodong, APK kurir, phishing game).
                                        </p>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-[#EFE3D0] text-xs font-bold text-[#3B2A1E]">
                                        Umpan balik langsung & tanpa vonis
                                    </div>
                                </div>

                                {/* Pilar 3: Bertindak */}
                                <div className="bg-white rounded-3xl p-6 border-2 border-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF9A3C] border-2 border-[#3B2A1E] flex items-center justify-center mb-4">
                                            <svg className="w-6 h-6 text-[#3B2A1E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-[#6B5646] tracking-wider uppercase block mb-1">
                                            Pilar 3: Act
                                        </span>
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] mb-3">
                                            Pilih Langkah Aman
                                        </h3>
                                        <p className="text-sm text-[#6B5646] leading-relaxed">
                                            Panduan langkah konkret: daftar periksa keselamatan akun, cara amankan perbankan, dan cara melapor ke otoritas resmi pemerintah secara tepat.
                                        </p>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-[#EFE3D0] text-xs font-bold text-[#3B2A1E]">
                                        Checklist keselamatan praktis
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. CONTOH SIMULASI MINI INTERAKTIF (LEARN) */}
                    <section id="simulasi" className="py-14 sm:py-20 border-t-2 border-[#EFE3D0] bg-[#FFFFFF]">
                        <div className="max-w-3xl mx-auto px-4 sm:px-6">
                            
                            <div className="text-left mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE27A] border border-[#3B2A1E] text-xs font-bold text-[#3B2A1E] mb-3">
                                    <span>Coba Skenario Simulasi Singkat</span>
                                </div>
                                <h2 className="font-['Fredoka',system-ui,sans-serif] text-2xl sm:text-3xl font-bold text-[#3B2A1E] mb-2">
                                    Kasus: Tawaran Freelance Berkedok Like & Subscribe
                                </h2>
                                <p className="text-sm text-[#6B5646]">
                                    Bayangkan kamu dapat pesan chat di Telegram seperti ini. Apa langkah yang bakal kamu ambil?
                                </p>
                            </div>

                            {/* Kotak Pesan Simulasi */}
                            <div className="bg-[#FFF8EC] rounded-2xl border-2 border-[#3B2A1E] p-5 mb-6">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#EFE3D0]">
                                    <div className="w-7 h-7 rounded-full bg-[#8ECDF0] border border-[#3B2A1E] flex items-center justify-center text-xs font-bold">
                                        HR
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-[#3B2A1E] block">Recruiter_Dewi (Nomor Luar Negeri +628...)</span>
                                    </div>
                                </div>
                                <p className="text-sm text-[#3B2A1E] leading-relaxed font-mono bg-white p-3.5 rounded-xl border border-[#EFE3D0]">
                                    "Halo kak, kami mencari partner remote. Tugas pertama: like 3 video YouTube di link berikut, langsung dapat komisi Rp30.000 via e-wallet. Untuk tugas selanjutnya dengan komisi Rp500.000, kakak wajib setor uang deposit jaminan tugas Rp150.000 ya."
                                </p>
                            </div>

                            {/* Opsi Pilihan Jawaban */}
                            <div className="space-y-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => { setSimAnswer(1); setSimFeedbackOpen(true); }}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                                        simAnswer === 1
                                            ? 'bg-[#FFE27A] border-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                            : 'bg-[#FFF8EC]/60 border-[#EFE3D0] hover:border-[#3B2A1E]'
                                    }`}
                                >
                                    <span className="w-6 h-6 rounded-full bg-white border border-[#3B2A1E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                        A
                                    </span>
                                    <span className="text-sm font-semibold text-[#3B2A1E]">
                                        Ambil uang Rp30.000 pertama, terus langsung transfer deposit Rp150.000 biar komisinya cepat cair banyak.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setSimAnswer(2); setSimFeedbackOpen(true); }}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                                        simAnswer === 2
                                            ? 'bg-[#FFE27A] border-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                            : 'bg-[#FFF8EC]/60 border-[#EFE3D0] hover:border-[#3B2A1E]'
                                    }`}
                                >
                                    <span className="w-6 h-6 rounded-full bg-white border border-[#3B2A1E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                        B
                                    </span>
                                    <span className="text-sm font-semibold text-[#3B2A1E]">
                                        Tunggu dulu. Pekerjaan asli tidak pernah meminta pelamar mentransfer deposit jaminan. Tolak dan blokir nomornya.
                                    </span>
                                </button>
                            </div>

                            {/* Kotak Umpan Balik Simulasi */}
                            {simFeedbackOpen && (
                                <div className="p-5 rounded-2xl bg-[#FFF8EC] border-2 border-[#3B2A1E] animate-fadeIn">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <img 
                                            src="/logo.png" 
                                            alt="Maskot CEKARA" 
                                            className="w-9 h-9 object-contain shrink-0" 
                                        />
                                        <h4 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                            {simAnswer === 2 ? 'Pilihan Tepat! Instingmu Tajam.' : 'Hampir Terkecoh! Yuk Pahami Polanya.'}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-[#6B5646] leading-relaxed">
                                        {simAnswer === 2
                                            ? 'Uang kecil Rp30.000 sengaja diberikan penipu sebagai umpan untuk membangun rasa percaya. Begitu kamu transfer uang deposit Rp150.000, mereka akan meminta setoran jutaan rupiah berikutnya dengan alasan kode error, hingga seluruh tabunganmu habis.'
                                            : 'Penipu memang sengaja mentransfer uang kecil di tugas pertama supaya kamu percaya ini asli. Tapi begitu kamu mengirimkan uang deposit, dana tersebut tidak akan pernah kembali. Ingat prinsip emas: kerja beneran itu yang membayar kamu, bukan kamu yang membayar.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 5. PRINSIP KEJUJURAN & KANAL RESMI PENGADUAN */}
                    <section id="kejujuran" className="py-14 sm:py-20 border-t-2 border-[#EFE3D0] bg-[#FFF8EC]">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6">
                            
                            <div className="bg-white rounded-3xl border-2 border-[#3B2A1E] p-6 sm:p-9 shadow-[4px_4px_0px_0px_#3B2A1E]">
                                <div className="max-w-2xl mb-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8ECDF0] border border-[#3B2A1E] text-xs font-bold text-[#3B2A1E] mb-3">
                                        <span>Prinsip Kejujuran Produk</span>
                                    </div>
                                    <h2 className="font-['Fredoka',system-ui,sans-serif] text-2xl sm:text-3xl font-bold text-[#3B2A1E] mb-3">
                                        CEKARA Hadir Sebagai Teman Diskusi, Bukan Vonis Mutlak
                                    </h2>
                                    <p className="text-sm sm:text-base text-[#6B5646] leading-relaxed">
                                        Kami tidak memberi label hijau "pasti aman" karena modus kejahatan siber terus berkembang. CEKARA menyajikan kemungkinan dan indikator risiko agar kamu terbiasa berpikir kritis sebelum percaya.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-[#EFE3D0]">
                                    <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#EFE3D0]">
                                        <h4 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E] mb-1">
                                            Status Prototipe Lomba
                                        </h4>
                                        <p className="text-xs text-[#6B5646] leading-relaxed">
                                            Aplikasi ini dikembangkan untuk ajang lomba MIT-Week 2026. Data yang kamu periksa diproses untuk memberikan analisis edukatif dan tidak dijual kepada pihak ketiga.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#EFE3D0]">
                                        <h4 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E] mb-1">
                                            Kanal Pengaduan Resmi
                                        </h4>
                                        <p className="text-xs text-[#6B5646] leading-relaxed">
                                            Jika kamu sudah telanjur menjadi korban penipuan finansial, segera laporkan ke <strong>Indonesia Anti-Scam Centre (iasc.ojk.go.id)</strong> atau hubungi <strong>Kontak OJK 157</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* 6. FOOTER */}
                <footer className="border-t-2 border-[#EFE3D0] bg-[#FFF8EC] py-10 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <img 
                                    src="/logo.png" 
                                    alt="Logo Maskot CEKARA" 
                                    className="w-8 h-8 object-contain shrink-0" 
                                />
                                <span className="font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E] block">
                                    CEKARA
                                </span>
                            </div>
                            <p className="text-xs text-[#6B5646]">
                                Cek dulu sebelum percaya — Ruang belajar dan deteksi risiko digital untuk pelajar Indonesia.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-[#6B5646]">
                            <a href="#pemeriksa" className="hover:text-[#3B2A1E] transition-colors">
                                Pemeriksa
                            </a>
                            <a href="#simulasi" className="hover:text-[#3B2A1E] transition-colors">
                                Simulasi Kasus
                            </a>
                            <a href="/terms" className="hover:text-[#3B2A1E] transition-colors">
                                Ketentuan Penggunaan
                            </a>
                            <a href="/privacy" className="hover:text-[#3B2A1E] transition-colors">
                                Privasi Data
                            </a>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#EFE3D0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B5646]">
                        <span>© 2026 CEKARA. Prototipe Edukasi Digital.</span>
                        <span>Dibuat dengan kepedulian untuk generasi muda.</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
