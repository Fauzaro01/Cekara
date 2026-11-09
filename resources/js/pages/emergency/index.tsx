import { useEffect, useMemo, useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    ArrowRightLeft,
    CheckCircle2,
    Copy,
    Eye,
    Globe,
    Loader2,
    MessageCircle,
    Monitor,
    RotateCcw,
    Scan,
    Share2,
    ShieldAlert,
    ShieldCheck,
    UploadCloud,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface StepLink {
    label: string;
    url: string;
}

interface ScenarioStep {
    key: string;
    order: number;
    urgency: string;
    title: string;
    instruction: string;
    callout?: string | null;
    action_type?: string | null;
    action_target?: string | null;
    links?: StepLink[];
}

interface Scenario {
    key: string;
    title: string;
    subtitle: string;
    severity_label: string;
    golden_time: string;
    icon: string;
    summary: string;
    steps: ScenarioStep[];
}

interface WhatsAppPreset {
    category: string;
    title: string;
    default_impersonation: string;
    warning_template: string;
    prevention_advice: string;
}

interface Props {
    scenarios?: Scenario[];
    whatsappPresets?: WhatsAppPreset[];
    userProgress?: Record<string, Record<string, boolean>>;
    isGuest?: boolean;
}

type AudienceTone = 'family' | 'community' | 'public';
type EmergencyTab = 'live_tab' | 'whatsapp';

interface TabScanResult {
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    score: number;
    summary: string;
    redFlags: string[];
    recommendations: string[];
    providerName?: string;
    model?: string;
    capturedAt: string;
    tabTitle?: string;
    imagePreviewUrl?: string;
}

export default function EmergencyIndex({
    whatsappPresets = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<EmergencyTab>('live_tab');

    // AI Live Tab Inspector State
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [tabScanResult, setTabScanResult] = useState<TabScanResult | null>(null);
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // WhatsApp Form State
    const [selectedPresetCategory, setSelectedPresetCategory] =
        useState<string>(whatsappPresets[0]?.category ?? 'apk_malware');
    const [waScamTitle, setWaScamTitle] = useState<string>('');
    const [waImpersonated, setWaImpersonated] = useState<string>('');
    const [waSuspectContact, setWaSuspectContact] = useState<string>('');
    const [waDetails, setWaDetails] = useState<string>('');
    const [waAdvice, setWaAdvice] = useState<string>('');
    const [waTone, setWaTone] = useState<AudienceTone>('family');
    const [isCopied, setIsCopied] = useState<boolean>(false);

    // Initialize WhatsApp form when preset changes
    useEffect(() => {
        const preset = whatsappPresets.find(
            (p) => p.category === selectedPresetCategory,
        );
        if (preset) {
            setWaScamTitle(preset.title);
            setWaImpersonated(preset.default_impersonation);
            setWaAdvice(preset.prevention_advice);
            if (!waDetails || waDetails.trim() === '') {
                setWaDetails(preset.warning_template);
            }
        }
    }, [selectedPresetCategory, whatsappPresets]);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Format WhatsApp Message with proper Markdown & Tone
    const generatedWhatsAppMessage = useMemo(() => {
        let toneHeader = '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨';
        let greeting =
            'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:';

        if (waTone === 'community') {
            toneHeader = '📢 *INFORMASI WASPADA KOMUNITAS & WARGA* 📢';
            greeting =
                'Bapak/Ibu/Rekan-rekan warga sekalian, mohon berhati-hati terhadap modus kejahatan siber berikut:';
        } else if (waTone === 'public') {
            toneHeader = '⚠️ *PERINGATAN PUBLIK: WASPADA PENIPUAN SIBER* ⚠️';
            greeting =
                'Pemberitahuan kepada seluruh kontak dan rekan untuk mewaspadai indikasi penipuan berikut:';
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
    }, [
        waTone,
        waScamTitle,
        waImpersonated,
        waSuspectContact,
        waDetails,
        waAdvice,
    ]);

    // Copy to clipboard
    const handleCopyWhatsAppMessage = async () => {
        try {
            await navigator.clipboard.writeText(generatedWhatsAppMessage);
            setIsCopied(true);
            showToast('Pesan peringatan berhasil disalin ke papan klip!');
            setTimeout(() => setIsCopied(false), 3000);
        } catch {
            showToast('Gagal menyalin teks ke papan klip.');
        }
    };

    // Open WhatsApp Web / App via wa.me URL
    const handleShareToWhatsApp = () => {
        const encoded = encodeURIComponent(generatedWhatsAppMessage);
        const url = `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Capture & Analyze Browser Tab via getDisplayMedia (Option 1)
    const handleCaptureAndAnalyzeTab = async () => {
        if (typeof window === 'undefined') return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            setScanError(
                'Peramban atau gawai Anda saat ini belum mendukung izin tangkapan tab langsung. Silakan gunakan tombol "Unggah Screenshot Manual" di bawah ini.',
            );
            return;
        }

        setScanError(null);
        setIsCapturing(true);

        try {
            // Minta izin ke browser untuk memilih Tab
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                },
                audio: false,
            });

            const videoTrack = stream.getVideoTracks()[0];
            const tabTitle = videoTrack?.label || 'Tab Browser Aktif';

            // Elemen video sementara di memori untuk capture frame
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            await video.play();

            // Tunggu 300ms agar frame video stabil
            await new Promise((resolve) => setTimeout(resolve, 300));

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            // Hentikan stream segera demi privasi pengguna
            stream.getTracks().forEach((track) => track.stop());

            const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedPreview(previewUrl);
            setIsCapturing(false);
            setIsAnalyzing(true);

            // Convert canvas ke blob untuk dikirim ke API
            canvas.toBlob(
                async (blob) => {
                    if (!blob) {
                        setIsAnalyzing(false);
                        setScanError('Gagal memproses tangkapan layar tab.');
                        return;
                    }

                    try {
                        const csrfMeta = document.querySelector(
                            'meta[name="csrf-token"]',
                        );
                        const csrfToken = csrfMeta
                            ? csrfMeta.getAttribute('content')
                            : '';

                        const formData = new FormData();
                        const file = new File([blob], 'tab_snapshot.jpg', {
                            type: 'image/jpeg',
                        });
                        formData.append('image', file);
                        formData.append(
                            'content',
                            `Tangkapan layar langsung dari tab peramban pengguna: "${tabTitle}". Mohon lakukan audit keamanan siber: apakah halaman web ini memuat indikasi phishing, rekayasa sosial, manipulasi logo bank/e-wallet resmi, atau skema penipuan online?`,
                        );

                        const response = await fetch('/chat/analyze', {
                            method: 'POST',
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                                Accept: 'application/json',
                                ...(csrfToken
                                    ? { 'X-CSRF-TOKEN': csrfToken }
                                    : {}),
                            },
                            body: formData,
                        });

                        if (!response.ok) {
                            throw new Error(
                                'Layanan analisis AI sedang sibuk, silakan coba beberapa saat lagi.',
                            );
                        }

                        const json = await response.json();
                        const data = json.data || json;

                        const rawLevel = String(
                            data.riskLevel || data.risk_level || 'HIGH',
                        ).toUpperCase();
                        const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
                            rawLevel.includes('HIGH') ||
                            rawLevel.includes('TINGGI') ||
                            rawLevel.includes('DANGER')
                                ? 'HIGH'
                                : rawLevel.includes('LOW') ||
                                    rawLevel.includes('RENDAH') ||
                                    rawLevel.includes('AMAN')
                                  ? 'LOW'
                                  : 'MEDIUM';

                        setTabScanResult({
                            riskLevel,
                            score:
                                typeof data.score === 'number'
                                    ? data.score
                                    : riskLevel === 'HIGH'
                                      ? 85
                                      : 45,
                            summary:
                                data.summary ||
                                'Halaman web ini terindikasi memiliki pola atau elemen manipulatif yang tidak lazim.',
                            redFlags: Array.isArray(data.redFlags)
                                ? data.redFlags
                                : data.red_flags || [],
                            recommendations: Array.isArray(data.recommendations)
                                ? data.recommendations
                                : [],
                            providerName:
                                data.providerName || data.provider_used,
                            model: data.model || data.model_used,
                            capturedAt: new Date().toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                            }),
                            tabTitle,
                            imagePreviewUrl: previewUrl,
                        });
                        showToast(
                            'Audit tab berhasil diselesaikan oleh AI Agent!',
                        );
                    } catch (err: any) {
                        setScanError(
                            err.message || 'Gagal menganalisis tab.',
                        );
                    } finally {
                        setIsAnalyzing(false);
                    }
                },
                'image/jpeg',
                0.85,
            );
        } catch (err: any) {
            setIsCapturing(false);
            setIsAnalyzing(false);
            if (
                err.name === 'NotAllowedError' ||
                err.name === 'PermissionDeniedError'
            ) {
                showToast('Izin berbagi tab dibatalkan.');
            } else {
                setScanError(
                    'Tidak dapat mengakses tab: ' +
                        (err.message || 'Izin ditolak'),
                );
            }
        }
    };

    const handleManualImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanError(null);
        setIsAnalyzing(true);

        const reader = new FileReader();
        reader.onload = async () => {
            const previewUrl = reader.result as string;
            setCapturedPreview(previewUrl);

            try {
                const csrfMeta = document.querySelector(
                    'meta[name="csrf-token"]',
                );
                const csrfToken = csrfMeta
                    ? csrfMeta.getAttribute('content')
                    : '';

                const formData = new FormData();
                formData.append('image', file);
                formData.append(
                    'content',
                    `Tangkapan layar halaman web: "${file.name}". Mohon analisis apakah memuat indikasi phishing atau penipuan.`,
                );

                const response = await fetch('/chat/analyze', {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Layanan analisis AI sedang sibuk.');
                }

                const json = await response.json();
                const data = json.data || json;

                const rawLevel = String(
                    data.riskLevel || data.risk_level || 'HIGH',
                ).toUpperCase();
                const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
                    rawLevel.includes('HIGH') || rawLevel.includes('TINGGI')
                        ? 'HIGH'
                        : rawLevel.includes('LOW') || rawLevel.includes('RENDAH')
                          ? 'LOW'
                          : 'MEDIUM';

                setTabScanResult({
                    riskLevel,
                    score: typeof data.score === 'number' ? data.score : 80,
                    summary:
                        data.summary ||
                        'Hasil analisis tangkapan layar berkas.',
                    redFlags: Array.isArray(data.redFlags)
                        ? data.redFlags
                        : data.red_flags || [],
                    recommendations: Array.isArray(data.recommendations)
                        ? data.recommendations
                        : [],
                    providerName: data.providerName || data.provider_used,
                    model: data.model || data.model_used,
                    capturedAt: new Date().toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    tabTitle: file.name,
                    imagePreviewUrl: previewUrl,
                });
                showToast('Audit screenshot berhasil diselesaikan!');
            } catch (err: any) {
                setScanError(err.message || 'Gagal menganalisis gambar.');
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleTransferToWhatsApp = () => {
        if (!tabScanResult) return;
        setWaScamTitle(tabScanResult.tabTitle || 'Situs Phishing / Halaman Palsu');
        setWaImpersonated('Situs / Layanan Mengatasnamakan Pihak Resmi');
        setWaDetails(
            `${tabScanResult.summary}\n\nIndikasi Bahaya Ditemukan:\n- ${
                tabScanResult.redFlags.length
                    ? tabScanResult.redFlags.join('\n- ')
                    : 'Manipulasi visual halaman'
            }`,
        );
        setWaAdvice(
            tabScanResult.recommendations.length
                ? tabScanResult.recommendations.join('\n- ')
                : 'Tutup segera tab tersebut dan jangan pernah memasukkan kode OTP atau password.',
        );
        setActiveTab('whatsapp');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AppLayout>
            <Head title="Pusat Tanggap Darurat & Peringatan Keluarga - Cekara" />

            {/* Notification Toast */}
            {toastMessage && (
                <div className="animate-in fade-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3 text-sm text-emerald-200 shadow-2xl backdrop-blur-md">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="mx-auto max-w-5xl px-6 py-10">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                        Pusat Tanggap Darurat & Peringatan Keluarga
                    </h1>
                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
                        Panduan tindakan terstruktur untuk membatasi kerugian
                        saat Anda atau keluarga terindikasi terkena kejahatan
                        siber, serta generator pesan instan untuk melindungi
                        kerabat terdekat.
                    </p>
                </div>

                {/* Primary Tabs */}
                <div className="mb-8 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex flex-wrap gap-4 sm:gap-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('live_tab')}
                            className={cn(
                                'border-b-2 pb-4 text-sm font-bold transition-all cursor-pointer',
                                activeTab === 'live_tab'
                                    ? 'border-[#FF9A3C] text-[#E06812]'
                                    : 'border-transparent text-slate-500 hover:text-slate-800',
                            )}
                        >
                            Investigasi Tab Langsung (AI Live Agent)
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('whatsapp')}
                            className={cn(
                                'border-b-2 pb-4 text-sm font-bold transition-all cursor-pointer',
                                activeTab === 'whatsapp'
                                    ? 'border-[#FF9A3C] text-[#E06812]'
                                    : 'border-transparent text-slate-500 hover:text-slate-800',
                            )}
                        >
                            Generator Pesan Peringatan WhatsApp
                        </button>
                    </div>
                </div>

                {/* TAB: AI LIVE TAB INSPECTOR */}
                {activeTab === 'live_tab' && (
                    <div className="space-y-6">
                        {/* Hero Introduction Card */}
                        <div className="rounded-3xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-6 sm:p-8 shadow-[4px_4px_0px_0px_#3B2A1E]">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-2 max-w-2xl">
                                    <h2 className="font-['Fredoka',system-ui,sans-serif] text-2xl sm:text-3xl font-bold text-[#3B2A1E]">
                                        Sedang Buka Web yang Mencurigakan? Biarkan AI Memeriksanya!
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[#6B5646] leading-relaxed">
                                        Pilih tab browser yang sedang kamu ragukan (toko online aneh, tawaran undian berhadiah, formulir klaim bansos, atau situs yang meniru bank). AI Agent Cekara akan mengambil tangkapan layar aman dari tab tersebut dan mendeteksi apakah itu jebakan penipuan (*phishing*).
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                                    <button
                                        type="button"
                                        disabled={isCapturing || isAnalyzing}
                                        onClick={handleCaptureAndAnalyzeTab}
                                        className="inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-6 py-3.5 text-sm font-bold text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] transition hover:-translate-y-0.5 hover:bg-[#ff8f27] active:translate-y-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCapturing ? (
                                            <>
                                                <Loader2 className="size-4.5 animate-spin" />
                                                <span>Menghubungkan Tab...</span>
                                            </>
                                        ) : isAnalyzing ? (
                                            <>
                                                <Loader2 className="size-4.5 animate-spin" />
                                                <span>AI Sedang Menganalisis...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Monitor className="size-4.5" />
                                                <span>Pilih & Periksa Tab Browser</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3B2A1E] bg-white px-4 py-2.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] transition hover:bg-[#FFF8EC] cursor-pointer"
                                    >
                                        <UploadCloud className="size-4 text-[#6B5646]" />
                                        <span>Atau Unggah Screenshot Manual</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={handleManualImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Privacy Notice Banner */}
                            <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-[#EFE3D0] bg-white px-4 py-2.5 text-xs text-[#6B5646]">
                                <ShieldCheck className="size-4 text-[#2E7D32] shrink-0" />
                                <span>
                                    <strong>Privasi 100% Aman:</strong> Koneksi tab hanya mengambil 1 kali tangkapan layar sesaat untuk dianalisis dan langsung diputuskan. Cekara tidak pernah merekam aktivitas penjelajahan pribadimu.
                                </span>
                            </div>
                        </div>

                        {/* Error Message */}
                        {scanError && (
                            <div className="rounded-2xl border-2 border-[#D84315] bg-[#FBE9E7] p-4 text-xs sm:text-sm font-semibold text-[#D84315] shadow-[2px_2px_0px_0px_#D84315] flex items-center gap-3">
                                <AlertTriangle className="size-5 shrink-0 text-[#D84315]" />
                                <span className="flex-1">{scanError}</span>
                                <button
                                    type="button"
                                    onClick={() => setScanError(null)}
                                    className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
                                >
                                    Tutup
                                </button>
                            </div>
                        )}

                        {/* Loading State Animation */}
                        {isAnalyzing && (
                            <div className="rounded-3xl border-2 border-[#3B2A1E] bg-white p-8 text-center shadow-[4px_4px_0px_0px_#3B2A1E]">
                                <div className="inline-flex size-16 items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] shadow-[2px_2px_0px_0px_#3B2A1E] mb-4">
                                    <Loader2 className="size-8 text-[#3B2A1E] animate-spin" />
                                </div>
                                <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                    AI Agent Sedang Menginvestigasi Tab...
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-[#6B5646] max-w-md mx-auto leading-relaxed">
                                    Memeriksa struktur visual, tipografi, domain tersembunyi, serta pola manipulasi psikologis penipuan siber.
                                </p>
                            </div>
                        )}

                        {/* Result Section */}
                        {tabScanResult && !isAnalyzing && (
                            <div className="rounded-3xl border-2 border-[#3B2A1E] bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_#3B2A1E] space-y-6">
                                {/* Header Result with Risk Badge */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EFE3D0] pb-5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                                                Hasil Audit Tab:
                                            </span>
                                            <span className="text-xs font-semibold text-[#6B5646]">
                                                {tabScanResult.tabTitle} • {tabScanResult.capturedAt}
                                            </span>
                                        </div>
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl sm:text-2xl font-bold text-[#3B2A1E]">
                                            {tabScanResult.riskLevel === 'HIGH'
                                                ? '🚨 Hati-hati! Tab Ini Terindikasi Sangat Berbahaya'
                                                : tabScanResult.riskLevel === 'MEDIUM'
                                                  ? '⚠️ Waspada! Terdapat Pola Mencurigakan di Tab Ini'
                                                  : '🛡️ Tab Ini Terindikasi Normal & Aman'}
                                        </h3>
                                    </div>

                                    {/* Risk Score Pill */}
                                    <div
                                        className={cn(
                                            'inline-flex shrink-0 items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] px-4 py-2 font-bold shadow-[2px_2px_0px_0px_#3B2A1E]',
                                            tabScanResult.riskLevel === 'HIGH'
                                                ? 'bg-[#FBE9E7] text-[#D84315]'
                                                : tabScanResult.riskLevel === 'MEDIUM'
                                                  ? 'bg-[#FFF8E7] text-[#BA4F10]'
                                                  : 'bg-[#E8F5E9] text-[#2E7D32]',
                                        )}
                                    >
                                        <span className="text-xs">Tingkat Risiko:</span>
                                        <span className="text-base font-extrabold">{tabScanResult.score}%</span>
                                    </div>
                                </div>

                                {/* Content Grid: Snapshot Preview & Evaluation Details */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    {/* Left: Captured Snapshot Preview */}
                                    {tabScanResult.imagePreviewUrl && (
                                        <div className="lg:col-span-5 space-y-2">
                                            <span className="text-xs font-bold text-[#6B5646]">
                                                Tangkapan Layar Tab yang Diperiksa:
                                            </span>
                                            <div className="overflow-hidden rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                                <img
                                                    src={tabScanResult.imagePreviewUrl}
                                                    alt="Snapshot Tab Browser"
                                                    className="w-full max-h-72 object-cover object-top"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Right: AI Analysis Details */}
                                    <div className={cn(tabScanResult.imagePreviewUrl ? 'lg:col-span-7' : 'lg:col-span-12', 'space-y-4')}>
                                        {/* Summary Box */}
                                        <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                            <span className="block text-[11px] font-bold text-[#E64A19] uppercase tracking-wider mb-1">
                                                Ringkasan Analisis AI
                                            </span>
                                            <p className="text-xs sm:text-sm text-[#3B2A1E] leading-relaxed font-semibold">
                                                {tabScanResult.summary}
                                            </p>
                                        </div>

                                        {/* Red Flags if any */}
                                        {tabScanResult.redFlags && tabScanResult.redFlags.length > 0 && (
                                            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
                                                <h4 className="text-xs font-bold text-[#D84315] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <AlertTriangle className="size-4" />
                                                    <span>Tanda-Tanda Bahaya (*Red Flags*):</span>
                                                </h4>
                                                <ul className="space-y-1.5">
                                                    {tabScanResult.redFlags.map((flag, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-xs text-[#3B2A1E]">
                                                            <span className="mt-1 size-1.5 rounded-full bg-[#D84315] shrink-0" />
                                                            <span>{flag}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommendations */}
                                        {tabScanResult.recommendations && tabScanResult.recommendations.length > 0 && (
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                                <h4 className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <CheckCircle2 className="size-4" />
                                                    <span>Rekomendasi Tindakan Cepat:</span>
                                                </h4>
                                                <ul className="space-y-1.5">
                                                    {tabScanResult.recommendations.map((rec, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-xs text-[#3B2A1E]">
                                                            <span className="mt-1 size-1.5 rounded-full bg-[#2E7D32] shrink-0" />
                                                            <span>{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Next Action Buttons */}
                                <div className="border-t border-[#EFE3D0] pt-5 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {tabScanResult.riskLevel !== 'LOW' && (
                                            <button
                                                type="button"
                                                onClick={handleTransferToWhatsApp}
                                                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-4 py-2.5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:-translate-y-0.5 hover:bg-[#ffd952] cursor-pointer"
                                            >
                                                <MessageCircle className="size-4 text-[#2E7D32]" />
                                                <span>Sebarkan Peringatan ke WhatsApp Keluarga</span>
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTabScanResult(null);
                                            setCapturedPreview(null);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B5646] hover:text-[#3B2A1E] hover:underline cursor-pointer"
                                    >
                                        <RotateCcw className="size-3.5" />
                                        <span>Periksa Tab Lainnya</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3 Panduan Cepat Investigasi Tab */}
                        {!tabScanResult && !isAnalyzing && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                    <span className="flex size-7 items-center justify-center rounded-lg border-2 border-[#3B2A1E] bg-[#FFE27A] text-xs font-extrabold text-[#3B2A1E] mb-2.5">
                                        1
                                    </span>
                                    <h4 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#3B2A1E]">
                                        Buka Tab yang Dicurigai
                                    </h4>
                                    <p className="mt-1 text-xs text-[#6B5646] leading-relaxed">
                                        Pastikan tab situs web yang ingin diperiksa sudah aktif terbuka di jendela peramban kamu.
                                    </p>
                                </div>

                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                    <span className="flex size-7 items-center justify-center rounded-lg border-2 border-[#3B2A1E] bg-[#8ECDF0] text-xs font-extrabold text-[#3B2A1E] mb-2.5">
                                        2
                                    </span>
                                    <h4 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#3B2A1E]">
                                        Izinkan Berbagi Tab
                                    </h4>
                                    <p className="mt-1 text-xs text-[#6B5646] leading-relaxed">
                                        Pilih opsi "Tab Chrome / Edge" pada jendela pop-up browser, lalu pilih tab tersebut.
                                    </p>
                                </div>

                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                    <span className="flex size-7 items-center justify-center rounded-lg border-2 border-[#3B2A1E] bg-[#FF9A3C] text-xs font-extrabold text-[#3B2A1E] mb-2.5">
                                        3
                                    </span>
                                    <h4 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#3B2A1E]">
                                        Terima Analisis AI
                                    </h4>
                                    <p className="mt-1 text-xs text-[#6B5646] leading-relaxed">
                                        AI Agent mendeteksi manipulasi visual, indikasi phishing, dan panduan tindakan yang wajib diambil.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: WHATSAPP ALERT GENERATOR */}
                {activeTab === 'whatsapp' && (
                    <div className="space-y-8">
                        {/* Intro banner */}
                        <Card variant="floating" className="p-6">
                            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-slate-100">
                                Generator Pesan Peringatan WhatsApp
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                Saat Anda mendeteksi modus penipuan atau menjadi
                                korban, sebarkan peringatan ini ke grup WhatsApp
                                keluarga atau komunitas agar kerabat tidak mudah
                                terperdaya.
                            </p>
                        </Card>

                        {/* Presets selector chips */}
                        <div>
                            <label className="mb-2.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Pilih Template Modus Cepat:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {whatsappPresets.map((preset) => (
                                    <button
                                        key={preset.category}
                                        type="button"
                                        onClick={() =>
                                            setSelectedPresetCategory(
                                                preset.category,
                                            )
                                        }
                                        className={cn(
                                            'rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all',
                                            selectedPresetCategory ===
                                                preset.category
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                                                : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                        )}
                                    >
                                        {preset.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Two-column layout: Form & Live Preview */}
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Left Column: Form Controls */}
                            <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
                                <h3 className="text-sm font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Detail Modus Penipuan
                                </h3>

                                {/* Tone selection */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Target Audiens & Nada Pesan:
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setWaTone('family')}
                                            className={cn(
                                                'rounded-xl border p-2.5 text-center text-xs font-medium transition-all',
                                                waTone === 'family'
                                                    ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                                                    : 'border-slate-200/80 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                            )}
                                        >
                                            Grup Keluarga
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWaTone('community')
                                            }
                                            className={cn(
                                                'rounded-xl border p-2.5 text-center text-xs font-medium transition-all',
                                                waTone === 'community'
                                                    ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                                                    : 'border-slate-200/80 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                            )}
                                        >
                                            Warga / Komunitas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWaTone('public')}
                                            className={cn(
                                                'rounded-xl border p-2.5 text-center text-xs font-medium transition-all',
                                                waTone === 'public'
                                                    ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                                                    : 'border-slate-200/80 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                            )}
                                        >
                                            Publik / Teman
                                        </button>
                                    </div>
                                </div>

                                {/* Field 1: Title */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Judul Modus Penipuan:
                                    </label>
                                    <input
                                        type="text"
                                        value={waScamTitle}
                                        onChange={(e) =>
                                            setWaScamTitle(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: Modus Undangan Pernikahan File APK"
                                    />
                                </div>

                                {/* Field 2: Impersonated */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Mengatasnamakan (Pihak yang Dicatut):
                                    </label>
                                    <input
                                        type="text"
                                        value={waImpersonated}
                                        onChange={(e) =>
                                            setWaImpersonated(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: Kurir J&T / Customer Service Bank BRI"
                                    />
                                </div>

                                {/* Field 3: Suspect Contact */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Kontak / Nomor Rekening Terduga:
                                    </label>
                                    <input
                                        type="text"
                                        value={waSuspectContact}
                                        onChange={(e) =>
                                            setWaSuspectContact(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: +62 812-9876-5432 / BCA 1234567890 a.n. Sindikat"
                                    />
                                </div>

                                {/* Field 4: Chronology Details */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Ciri-Ciri Modus & Kronologi Singkat:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={waDetails}
                                        onChange={(e) =>
                                            setWaDetails(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Jelaskan cara kerja penipuan atau isi pesan yang dikirimkan penipu..."
                                    />
                                </div>

                                {/* Field 5: Advice */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Langkah Pencegahan untuk Pembaca:
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={waAdvice}
                                        onChange={(e) =>
                                            setWaAdvice(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: Jangan pernah menginstal berkas APK dan jangan kirim uang..."
                                    />
                                </div>
                            </div>

                            {/* Right Column: WhatsApp Live Preview & Actions */}
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        <MessageCircle className="size-4 text-emerald-600" />
                                        Pratinjau Pesan WhatsApp
                                    </h3>
                                    <span className="font-mono text-xs text-slate-500">
                                        {generatedWhatsAppMessage.length}{' '}
                                        karakter
                                    </span>
                                </div>

                                {/* WhatsApp Chat Bubble Container */}
                                <div className="flex flex-1 flex-col justify-between rounded-2xl border border-emerald-900/20 bg-slate-100/90 p-5 dark:border-emerald-800/20 dark:bg-slate-950/60">
                                    <div className="relative rounded-2xl rounded-tl-none border border-emerald-200 bg-[#e7fedb] p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-slate-900 shadow-xs select-all dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                                        {generatedWhatsAppMessage}
                                        <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                            <span>Baru saja</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                ✓✓
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            type="button"
                                            onClick={handleCopyWhatsAppMessage}
                                            variant="outline"
                                            className={cn(
                                                'h-11 flex-1 text-xs',
                                                isCopied &&
                                                    'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
                                            )}
                                        >
                                            {isCopied ? (
                                                <>
                                                    <CheckCircle2 className="mr-1.5 size-4 text-emerald-600 dark:text-emerald-400" />
                                                    Tersalin ke Papan Klip!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-1.5 size-4" />
                                                    Salin Pesan
                                                </>
                                            )}
                                        </Button>

                                        <button
                                            type="button"
                                            onClick={handleShareToWhatsApp}
                                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95"
                                        >
                                            <Share2 className="size-4" />
                                            Kirim ke WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
