import { useEffect, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import gsap from 'gsap';
import {
    AlertTriangle,
    CheckCircle2,
    Search,
    Image as ImageIcon,
    UploadCloud,
    X,
    ArrowRight,
    Sparkles,
    FileText,
    BookOpen,
    LifeBuoy,
    Zap,
    Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface FraudAnalysisResponse {
    risk_level: string;
    score?: number;
    summary: string;
    red_flags: string[];
    indicators?: string[];
    recommendations: string[];
    recommendation?: string;
    action_steps?: string[];
    provider_name?: string;
    provider_used?: string;
    model?: string;
    is_mock?: boolean;
    is_fallback?: boolean;
}

const exampleScenarios = [
    {
        label: 'Undangan APK',
        text: 'Surat Undangan Pernikahan Kami.apk Kami mengundang Bapak/Ibu untuk hadir di acara kami. Mohon klik dan instal file surat undangan pernikahan digital berikut untuk membuka kartu undangan.',
    },
    {
        label: 'Paket Kurir APK',
        text: 'Paket J&T Express Anda tertahan di gudang pusat sortir karena kendala alamat. Silakan unduh dan pasang aplikasi Lihat_Foto_Paket.apk untuk verifikasi dan konfirmasi penerimaan paket Anda segera.',
    },
    {
        label: 'Bank Minta OTP',
        text: 'Selamat anda memenangkan hadiah 50 juta dari Bank BRI. Masukkan kode OTP 6 digit yang dikirimkan ke HP Anda sekarang untuk klaim saldo.',
    },
    {
        label: 'Tautan Phishing Bank',
        text: 'Pemberitahuan: Rekening BCA Anda dinonaktifkan sementara. Segera lakukan verifikasi data nasabah melalui https://bca-verifikasi-keamanan-akun.com/login sebelum 24 jam.',
    },
    {
        label: 'Kerja Like Video',
        text: 'Peluang kerja paruh waktu online! Cukup like video TikTok dan follow akun, dapatkan komisi Rp 500.000 - Rp 2.000.000 per hari. Hubungi admin via Telegram.',
    },
    {
        label: 'Percakapan Normal',
        text: 'Halo selamat siang Mas Andi, apakah jadwal rapat koordinasi tim marketing besok jam 10 pagi jadi dilaksanakan di ruang pertemuan lantai 2? Terima kasih informasinya.',
    },
];

const pillars = [
    {
        title: 'Kenali',
        icon: Search,
        description:
            'Nilai pesan teks, tautan phishing, dan berkas lampiran .APK berbahaya secara otomatis dengan indikator tanda bahaya terjelaskan.',
    },
    {
        title: 'Belajar',
        icon: BookOpen,
        description:
            'Latih ketajaman naluri Anda menghadapi skenario simulasi rekayasa sosial nyata di Indonesia dan dapatkan bedah trik psikologis penipu.',
    },
    {
        title: 'Bertindak',
        icon: LifeBuoy,
        description:
            'Ikuti protokol tindakan darurat untuk menyelamatkan rekening, laporkan nomor penipu, dan peringatkan keluarga melalui WhatsApp.',
    },
];

export default function Welcome() {
    const [modality, setModality] = useState<'text' | 'image'>('text');
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<FraudAnalysisResponse | null>(null);

    const heroRef = useRef<HTMLDivElement>(null);
    const analyzerCardRef = useRef<HTMLDivElement>(null);
    const pillarsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // GSAP Staggered Entrance Animation
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            gsap.from('.gsap-hero-item', {
                opacity: 0,
                y: 20,
                duration: 0.7,
                stagger: 0.12,
                ease: 'power2.out',
            });

            gsap.from('.gsap-analyzer', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                delay: 0.35,
                ease: 'power3.out',
            });

            gsap.from('.gsap-pillar-card', {
                opacity: 0,
                y: 25,
                duration: 0.6,
                stagger: 0.15,
                delay: 0.5,
                ease: 'power2.out',
            });
        }, [heroRef, analyzerCardRef, pillarsRef]);

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const getXsrfToken = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const validateAndSetImage = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            setErrorMessage(
                'Format berkas tidak didukung. Harap unggah tangkapan layar berformat JPG atau PNG.',
            );
            return false;
        }

        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeInBytes) {
            setErrorMessage(
                'Ukuran gambar terlalu besar. Maksimal ukuran berkas adalah 5MB.',
            );
            return false;
        }

        setSelectedImage(file);
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        setImagePreviewUrl(URL.createObjectURL(file));
        setErrorMessage(null);
        return true;
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetImage(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetImage(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
            setImagePreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClearAll = () => {
        setInputText('');
        handleRemoveImage();
        setResult(null);
        setErrorMessage(null);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const handleAnalyze = async (textToAnalyze?: string) => {
        const text = (textToAnalyze ?? inputText).trim();

        if (modality === 'image' || selectedImage) {
            if (!selectedImage && !text) {
                setErrorMessage(
                    'Silakan pilih berkas gambar tangkapan layar atau masukkan teks pesan untuk dianalisis.',
                );
                return;
            }
        } else {
            if (!text) {
                setErrorMessage(
                    'Silakan masukkan atau tempel teks pesan yang ingin dianalisis.',
                );
                return;
            }

            if (text.length < 3) {
                setErrorMessage(
                    'Teks terlalu pendek. Masukkan minimal 3 karakter.',
                );
                return;
            }
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            let response: Response;

            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);
                if (text) {
                    formData.append('content', text);
                }

                response = await fetch('/chat/analyze', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    body: formData,
                });
            } else {
                response = await fetch('/chat/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    body: JSON.stringify({ content: text }),
                });
            }

            if (response.status === 419) {
                setErrorMessage(
                    'Sesi Anda telah kedaluwarsa. Silakan muat ulang halaman.',
                );
                return;
            }

            if (response.status === 429) {
                setErrorMessage(
                    'Terlalu banyak permintaan analisis. Silakan tunggu beberapa saat.',
                );
                return;
            }

            let data: any = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                const validationErrors =
                    data?.errors?.content || data?.errors?.image;
                if (validationErrors && validationErrors.length > 0) {
                    setErrorMessage(
                        Array.isArray(validationErrors)
                            ? validationErrors.join(' ')
                            : String(validationErrors),
                    );
                } else {
                    setErrorMessage(
                        data?.message ||
                            'Terjadi kesalahan saat memproses analisis.',
                    );
                }
                return;
            }

            const analysisData: FraudAnalysisResponse = data.data || data;
            setResult(analysisData);
        } catch {
            setErrorMessage(
                'Gagal menghubungi server analisis. Periksa koneksi internet Anda.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleExampleClick = (exampleText: string) => {
        setModality('text');
        setInputText(exampleText);
        setErrorMessage(null);
        void handleAnalyze(exampleText);
    };

    const getRiskBadge = (level: string) => {
        const norm = level.toLowerCase();
        if (norm === 'high' || norm === 'danger' || norm === 'tinggi') {
            return {
                variant: 'danger' as const,
                label: 'Risiko Tinggi / Berbahaya',
                borderClass:
                    'border-rose-500/30 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20',
            };
        }
        if (norm === 'medium' || norm === 'sedang') {
            return {
                variant: 'warn' as const,
                label: 'Risiko Sedang / Waspada',
                borderClass:
                    'border-amber-500/30 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20',
            };
        }
        return {
            variant: 'safe' as const,
            label: 'Risiko Rendah / Relatif Aman',
            borderClass:
                'border-emerald-500/30 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20',
        };
    };

    const flagsList = result?.red_flags || result?.indicators || [];
    const recsList =
        result?.recommendations ||
        (result?.recommendation
            ? [result.recommendation]
            : result?.action_steps || []);
    const riskBadgeInfo = result ? getRiskBadge(result.risk_level) : null;

    return (
        <AppLayout>
            <Head title="Cekara — Cek dulu sebelum percaya" />

            {/* Hero Section with Spatial Mesh Backdrop */}
            <section
                ref={heroRef}
                className="hero-glow-bg border-b border-slate-200/60 pt-16 pb-12 dark:border-slate-800/60"
            >
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <div className="gsap-hero-item inline-flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="Logo Cekara"
                            className="size-6 object-contain"
                        />
                        <Badge
                            variant="brand"
                            dot
                            className="px-3 py-1 text-xs"
                        >
                            Cek dulu sebelum percaya
                        </Badge>
                    </div>

                    <h1 className="gsap-hero-item mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-100">
                        Dapat pesan mencurigakan?{' '}
                        <span className="bg-gradient-to-r from-brand-600 to-sky-400 bg-clip-text text-transparent dark:from-brand-400 dark:to-sky-300">
                            Tenang, kita cek bareng.
                        </span>
                    </h1>

                    <p className="gsap-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
                        Deteksi pesan mencurigakan, tangkapan layar chat, dan
                        tautan phishing bank secara otomatis sebelum Anda atau
                        keluarga menjadi korban berikutnya.
                    </p>

                    <div className="gsap-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
                        <a
                            href="#cek-pesan"
                            className={buttonClasses('primary', 'md')}
                        >
                            <span>Mulai Cek Pesan</span>
                            <ArrowRight className="size-4" />
                        </a>
                        <Link
                            href="/simulasi"
                            className={buttonClasses('outline', 'md')}
                        >
                            <span>Latihan Simulasi Kasus</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Interactive Fraud Analyzer Tool (Floating Glass Container) */}
            <section
                id="cek-pesan"
                ref={analyzerCardRef}
                className="mx-auto -mt-6 max-w-4xl px-6 pb-16"
            >
                <div className="gsap-analyzer rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition dark:border-slate-800/90 dark:bg-slate-900/80">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-brand-500" />
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    Kenali Modus: Analisis Pesan & Screenshot
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Tempel teks pesan WhatsApp, tautan URL, atau
                                unggah tangkapan layar percakapan untuk evaluasi
                                risiko seketika.
                            </p>
                        </div>
                        <Badge
                            variant="neutral"
                            className="self-start text-[11px] sm:self-auto"
                        >
                            Multi-Modal Vision & Heuristik URL
                        </Badge>
                    </div>

                    {/* Modality Selector Tabs */}
                    <div className="mt-6 flex items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800/80">
                        <button
                            type="button"
                            onClick={() => setModality('text')}
                            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                modality === 'text'
                                    ? 'bg-brand-50 text-brand-700 shadow-xs dark:bg-brand-950/60 dark:text-brand-300'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <FileText className="size-3.5" />
                            <span>Teks / Tautan URL</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setModality('image')}
                            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                modality === 'image'
                                    ? 'bg-brand-50 text-brand-700 shadow-xs dark:bg-brand-950/60 dark:text-brand-300'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <ImageIcon className="size-3.5" />
                            <span>Unggah Screenshot (JPG/PNG)</span>
                            {selectedImage && (
                                <span className="size-2 animate-pulse rounded-full bg-brand-500" />
                            )}
                        </button>
                    </div>

                    {/* Example Prompts (Visible in Text Mode) */}
                    {modality === 'text' && (
                        <div className="mt-4">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Contoh Kasus Nyata:
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {exampleScenarios.map((ex) => (
                                    <button
                                        key={ex.label}
                                        type="button"
                                        onClick={() =>
                                            handleExampleClick(ex.text)
                                        }
                                        className="rounded-full border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
                                    >
                                        {ex.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mode 1: Text Input */}
                    {modality === 'text' && (
                        <div className="mt-4">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Salin dan tempel pesan mencurigakan, SMS kurir, tawaran loker Telegram, atau tautan URL di sini..."
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 bg-white/70 p-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-400"
                            />
                            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                                <span>
                                    Mendukung teks percakapan, SMS perbankan,
                                    dan tautan URL.
                                </span>
                                <span>
                                    {inputText.length} / 10.000 karakter
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Mode 2: Multi-Modal Screenshot Upload */}
                    {modality === 'image' && (
                        <div className="mt-4 space-y-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            {!selectedImage ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                                        isDragging
                                            ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20'
                                            : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                                        <UploadCloud className="size-6" />
                                    </div>
                                    <p className="mt-3 text-xs font-semibold text-slate-700 sm:text-sm dark:text-slate-300">
                                        Klik untuk memilih atau seret gambar ke
                                        sini
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Format JPG atau PNG (Maksimal 5MB).
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between rounded-xl border border-brand-200/80 bg-brand-50/40 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {imagePreviewUrl && (
                                            <img
                                                src={imagePreviewUrl}
                                                alt="Pratinjau"
                                                className="size-14 rounded-lg border border-slate-200 object-cover dark:border-slate-800"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1 text-left">
                                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                {selectedImage.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {formatFileSize(
                                                    selectedImage.size,
                                                )}{' '}
                                                • Siap dianalisis
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveImage}
                                        className="text-slate-500 hover:text-rose-600"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            )}

                            <div>
                                <textarea
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    placeholder="Keterangan tambahan terkait gambar (opsional)..."
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    )}

                    {/* Privacy Warning */}
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-400">
                        <Lock className="size-3.5 shrink-0 text-brand-500" />
                        <span>
                            <strong className="text-slate-700 dark:text-slate-300">
                                Jaga rahasia pribadi:
                            </strong>{' '}
                            Demi keamanan Anda, jangan tempel kode OTP, kata
                            sandi, PIN, nomor kartu, atau nomor rekening bank di
                            sini.
                        </span>
                    </div>

                    {/* Error Feedback */}
                    {errorMessage && (
                        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                            <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAll}
                            disabled={
                                isLoading ||
                                (!inputText && !selectedImage && !result)
                            }
                        >
                            Reset
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            disabled={isLoading}
                            onClick={() => handleAnalyze()}
                            className="min-w-44"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    <span>Menganalisis...</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <span>Analisis Keamanan Sekarang</span>
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Results Display */}
                    {result && riskBadgeInfo && (
                        <div
                            className={`mt-6 rounded-2xl border p-6 transition-all duration-300 ${riskBadgeInfo.borderClass}`}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Badge variant={riskBadgeInfo.variant} dot>
                                        {riskBadgeInfo.label}
                                    </Badge>
                                    {typeof result.score === 'number' && (
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Skor Keamanan: {result.score}/100
                                        </span>
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Dianalisis oleh:{' '}
                                    {result.provider_used ||
                                        result.provider_name ||
                                        'Guardian Engine'}
                                </div>
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                                {result.summary}
                            </p>

                            {/* Red Flags List */}
                            {flagsList.length > 0 && (
                                <div className="mt-5">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Tanda Bahaya Utama (Red Flags):
                                    </span>
                                    <ul className="mt-2 space-y-1.5">
                                        {flagsList.map((flag, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                                            >
                                                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                                                <span>{flag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations & Action Steps */}
                            {recsList.length > 0 && (
                                <div className="mt-5 border-t border-slate-200/60 pt-4 dark:border-slate-800/60">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Langkah Perlindungan yang Disarankan:
                                    </span>
                                    <ul className="mt-2 space-y-1.5">
                                        {recsList.map((rec, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                                            >
                                                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Quick CTA to Action Center */}
                            <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200/60 pt-4 dark:border-slate-800/60">
                                <Link
                                    href="/tanggap-darurat"
                                    className={buttonClasses('outline', 'sm')}
                                >
                                    <span>Buka Protokol Tanggap Darurat</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                                <Link
                                    href="/simulasi"
                                    className={buttonClasses('ghost', 'sm')}
                                >
                                    <span>Latih Refleks di Simulasi</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 3 Pillars Section (Hover Floating Cards) */}
            <section
                id="pilar"
                ref={pillarsRef}
                className="mx-auto max-w-5xl px-6 pb-24"
            >
                <div className="mb-10 text-center">
                    <Badge variant="brand" className="mb-2">
                        Tiga Pendekatan
                    </Badge>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                        Tiga Pilar Perlindungan Cekara
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Ekosistem terintegrasi yang membekali masyarakat dari
                        mengenali, melatih naluri, hingga bertindak nyata.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    {pillars.map((pillar) => {
                        const Icon = pillar.icon;
                        return (
                            <Card
                                key={pillar.title}
                                variant="floating"
                                className="gsap-pillar-card flex flex-col justify-between p-6 transition"
                            >
                                <div>
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300">
                                        <Icon
                                            className="size-5"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {pillar.title}
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                        {pillar.description}
                                    </p>
                                </div>

                                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                    {pillar.title === 'Belajar' ? (
                                        <Link
                                            href="/simulasi"
                                            className={`w-full ${buttonClasses('outline', 'sm')}`}
                                        >
                                            <span>Mulai Latihan Simulasi</span>
                                            <ArrowRight className="size-3.5" />
                                        </Link>
                                    ) : pillar.title === 'Kenali' ? (
                                        <a
                                            href="#cek-pesan"
                                            className={`w-full ${buttonClasses('outline', 'sm')}`}
                                        >
                                            <span>Gunakan Detektor Pesan</span>
                                            <ArrowRight className="size-3.5" />
                                        </a>
                                    ) : (
                                        <Link
                                            href="/tanggap-darurat"
                                            className={`w-full ${buttonClasses('outline', 'sm')}`}
                                        >
                                            <span>Panduan Tanggap Darurat</span>
                                            <ArrowRight className="size-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </AppLayout>
    );
}
