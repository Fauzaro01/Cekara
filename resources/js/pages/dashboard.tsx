import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import { useSkeletonMount, UserDashboardSkeleton } from '@/components/ui/skeleton';
import type { Auth } from '@/types/auth';

interface GuardianStatus {
    rank: string;
    alertness_score: number;
    alertness_label: string;
    completed_simulations: number;
    total_simulations: number;
    simulation_completion_rate: number;
    average_score: number;
    total_scans: number;
    threats_detected: number;
    safe_scans: number;
}

interface ScanItem {
    id: number;
    scan_type: string;
    content: string;
    risk_level: string;
    score: number;
    summary: string;
    red_flags: string[];
    recommendations: string[];
    provider_used: string | null;
    model_used: string | null;
    is_mock: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string | null;
    relative_time: string;
}

interface SimulationItem {
    id: number;
    scenario_title: string;
    scenario_slug: string | null;
    is_safe: boolean;
    score: number;
    created_at: string | null;
    relative_time: string;
}

interface Props {
    guardianStatus: GuardianStatus;
    recentScans: ScanItem[];
    recentSimulations: SimulationItem[];
}

export default function Dashboard({
    guardianStatus,
    recentScans,
    recentSimulations,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const isInitialLoading = useSkeletonMount(280);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Threat report modal state & form
    const [isReporting, setIsReporting] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formCategory, setFormCategory] = useState('apk_malware');
    const [formPlatform, setFormPlatform] = useState('WhatsApp');
    const [formLocation, setFormLocation] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formEvidence, setFormEvidence] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getXsrfToken = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/komunitas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title: formTitle,
                    category: formCategory,
                    platform: formPlatform,
                    location: formLocation || null,
                    description: formDescription,
                    evidence_text: formEvidence || null,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Laporan modus penipuan berhasil dikirim!');
                setIsReporting(false);
                setFormTitle('');
                setFormLocation('');
                setFormDescription('');
                setFormEvidence('');
            } else {
                toast.error(
                    data.message ||
                        'Gagal mengirim laporan. Pastikan semua kolom terisi dengan benar.',
                );
            }
        } catch {
            toast.error('Terjadi kendala jaringan saat mengirim laporan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteScan = (id: number) => {
        if (
            confirm('Apakah Anda yakin ingin menghapus riwayat pemindaian ini?')
        ) {
            setDeletingId(id);
            router.delete(`/scans/${id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Riwayat pemindaian berhasil dihapus.');
                },
                onError: () => {
                    toast.error('Gagal menghapus riwayat pemindaian.');
                },
                onFinish: () => setDeletingId(null),
            });
        }
    };

    const getRiskBadge = (level: string) => {
        const normalized = level.toUpperCase();
        if (
            normalized === 'HIGH' ||
            normalized === 'DANGER' ||
            normalized === 'TINGGI'
        ) {
            return (
                <Badge variant="danger" withDot>
                    Tinggi / Berbahaya
                </Badge>
            );
        }
        if (
            normalized === 'MEDIUM' ||
            normalized === 'WARN' ||
            normalized === 'SEDANG'
        ) {
            return (
                <Badge variant="warn" withDot>
                    Sedang / Waspada
                </Badge>
            );
        }
        return (
            <Badge variant="safe" withDot>
                Rendah / Aman
            </Badge>
        );
    };

    if (isInitialLoading) {
        return (
            <AppLayout>
                <Head title="Dashboard Pengguna - Cekara" />
                <UserDashboardSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Dashboard Pengguna - Cekara" />

            <div className="mx-auto max-w-5xl px-6 py-8">
                {/* User Greeting & Header Banner */}
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-brand-50/20 to-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:from-slate-900/60 dark:via-brand-950/20 dark:to-slate-900/40">
                    {/* Abstract Geometric Orange Squares Line-art (Behind text, subtle opacity) */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-6 -left-6 z-0 h-[120%] w-[420px] max-w-[85%] select-none opacity-[0.14] sm:w-[500px] dark:opacity-[0.22]"
                    >
                        <svg
                            viewBox="0 0 520 260"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-full w-full text-[#E06812]"
                        >
                            {/* Connecting lines */}
                            <path d="M210 200 L210 260" />
                            <path d="M80 140 L80 180" />
                            <path d="M270 140 L340 140 L340 260" />
                            <path d="M155 85 L200 85" />
                            <path d="M310 52 L260 52" />

                            {/* Abstract outline squares */}
                            <rect x="35" y="25" width="120" height="120" rx="16" />
                            <rect x="135" y="70" width="135" height="135" rx="18" />
                            <rect x="310" y="30" width="46" height="46" rx="10" />
                            <rect x="45" y="180" width="60" height="60" rx="12" />
                            <rect x="290" y="115" width="110" height="110" rx="16" />
                        </svg>
                    </div>

                    {/* Abstract Geometric Orange Squares Line-art (Top-Right / Behind mascot) */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-4 -right-6 z-0 h-[115%] w-[260px] select-none opacity-[0.14] sm:w-[320px] dark:opacity-[0.22]"
                    >
                        <svg
                            viewBox="0 0 320 220"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-full w-full text-[#E06812]"
                        >
                            {/* Connecting lines */}
                            <path d="M220 0 L220 130" />
                            <path d="M90 40 L270 40" />
                            <path d="M160 100 L160 180" />
                            <path d="M250 85 L295 85" />

                            {/* Abstract outline squares */}
                            <rect x="175" y="15" width="80" height="80" rx="14" />
                            <rect x="110" y="45" width="90" height="90" rx="14" />
                            <rect x="255" y="55" width="45" height="45" rx="8" />
                            <rect x="65" y="95" width="60" height="60" rx="10" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                        <div className="max-w-xl py-2">
                            <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl sm:text-4xl md:text-[40px] font-bold tracking-tight text-[#3B2A1E] leading-tight">
                                Halo, {user?.name ?? 'Guardian'}!
                            </h1>
                            <p className="mt-2.5 sm:mt-3 text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#6B5646] font-semibold">
                                Pusat kendali kesiapsiagaan siber dan riwayat
                                proteksi digital pribadi Anda. Pantau skor
                                kewaspadaan dan latih insting keamanan secara
                                berkala.
                            </p>
                        </div>

                        <div className="flex shrink-0 items-end justify-center sm:justify-end sm:mr-8 md:mr-16 lg:mr-20 -mb-6 sm:-mb-8 self-end">
                            <img
                                src="/maskot_gaya.png"
                                alt="Maskot Cekara"
                                className="h-40 w-auto object-contain select-none drop-shadow-md sm:h-52 md:h-60"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Toast */}
                {notification && (
                    <div className="mb-8 flex items-center justify-between gap-3 rounded-2xl border-2 border-[#3B2A1E] bg-[#8ECDF0] p-4 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]">
                        <span>{notification}</span>
                        <Link
                            href="/komunitas"
                            className="shrink-0 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] px-3 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E] transition hover:bg-[#FFE27A]"
                        >
                            Buka Komunitas
                        </Link>
                    </div>
                )}

                {/* Quick Actions (3 Action Cards - Clean text without icons) */}
                <div className="mb-10">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Action 1: Cek Pesan Baru (Pemindai Langsung) */}
                        <Link
                            href="/#pemeriksa"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-brand-600"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                                    Cek Pesan Baru
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Analisis teks, URL mencurigakan, atau
                                    unggah screenshot chat berisiko secara langsung.
                                </p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-400">
                                Buka Pemindai
                            </div>
                        </Link>

                        {/* Action 2: Latihan Simulasi */}
                        <Link
                            href="/simulasi"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8ECDF0] hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-sky-500"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-[#0284C7] dark:text-slate-100 dark:group-hover:text-sky-400">
                                    Latihan Simulasi
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Asah insting pertahanan dengan simulasi
                                    keputusan modus penipuan nyata.
                                </p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-[#0284C7] transition-transform group-hover:translate-x-1 dark:text-sky-400">
                                Mulai Latihan
                            </div>
                        </Link>

                        {/* Action 3: Komunitas */}
                        <Link
                            href="/komunitas"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-emerald-600"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                                    Komunitas 
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Pantau laporan modus penipuan terbaru dari
                                    warga dan bagikan temuan mencurigakan Anda.
                                </p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-emerald-600 transition-transform group-hover:translate-x-1 dark:text-emerald-400">
                                Buka Komunitas
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Scan History Section */}
                <div className="mb-10">
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Riwayat Pemindaian Penipuan Terbaru
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Daftar analisis tangkapan layar dari CEKARA yang mengakses tab browser Anda.
                        </p>
                    </div>

                    {recentScans.length === 0 ? (
                        <Card
                            variant="glass"
                            className="flex flex-col items-center justify-center px-6 py-8 sm:px-8 sm:py-10 text-center"
                        >
                            <img
                                src="/empty_state.png"
                                alt="Belum ada riwayat pemindaian"
                                className="mb-3 w-28 sm:w-32 h-auto object-contain select-none opacity-90"
                            />
                            <h3 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                Belum ada riwayat pemindaian
                            </h3>
                            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#6B5646]">
                                Tempelkan pesan, masukkan link mencurigakan,
                                atau unggah tangkapan layar chat untuk melihat
                                hasil analisis di sini.
                            </p>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {recentScans.slice(0, 4).map((scan) => (
                                <Card
                                    key={scan.id}
                                    variant="floating"
                                    className="p-5 transition-all"
                                >
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {getRiskBadge(scan.risk_level)}
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                Skor Risiko: {scan.score}%
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>{scan.relative_time}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteScan(scan.id)
                                                }
                                                disabled={
                                                    deletingId === scan.id
                                                }
                                                className="inline-flex items-center text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                                                title="Hapus riwayat pemindaian"
                                            >
                                                {deletingId === scan.id
                                                    ? 'Menghapus...'
                                                    : 'Hapus'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Snippet / Content */}
                                    <div className="mt-3 line-clamp-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                        {scan.content}
                                    </div>

                                    {/* Summary */}
                                    <div className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {scan.summary}
                                    </div>

                                    {/* Red Flags / Highlights if any */}
                                    {scan.red_flags &&
                                        scan.red_flags.length > 0 && (
                                            <div className="mt-3 rounded-xl border border-red-100 bg-red-50/40 p-3 dark:border-red-950/40 dark:bg-red-950/20">
                                                <div className="text-xs font-semibold text-danger">
                                                    Indikasi Mencurigakan:
                                                </div>
                                                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                                                    {scan.red_flags
                                                        .slice(0, 3)
                                                        .map((flag, idx) => (
                                                            <li key={idx}>
                                                                {flag}
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        )}

                                    {/* Recommendations */}
                                    {scan.recommendations &&
                                        scan.recommendations.length > 0 && (
                                            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-950/40 dark:bg-emerald-950/20">
                                                <div>
                                                    <div className="text-xs font-semibold text-safe">
                                                        Rekomendasi Tindakan:
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                                                        {
                                                            scan
                                                                .recommendations[0]
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Simulations Journey */}
                <div className="mb-8">
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Simulasi Pembelajaran yang Baru Diikuti
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Progres dan hasil skor skenario latihan interaktif yang telah Anda ikuti.
                        </p>
                    </div>

                    {recentSimulations.length === 0 ? (
                        <Card
                            variant="glass"
                            className="flex flex-col items-center justify-center px-6 py-8 sm:px-8 sm:py-10 text-center"
                        >
                            <img
                                src="/empty_state.png"
                                alt="Belum ada simulasi yang diikuti"
                                className="mb-3 w-28 sm:w-32 h-auto object-contain select-none opacity-90"
                            />
                            <h3 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                Belum ada simulasi yang diikuti
                            </h3>
                            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#6B5646]">
                                Anda belum mencoba modul latihan simulasi interaktif. Jelajahi skenario untuk menguji kewaspadaan menghadapi penipuan digital.
                            </p>
                            <Link
                                href="/simulasi"
                                className={`${buttonClasses('primary', 'sm')} group mt-4 inline-flex items-center gap-2 text-xs font-bold shadow-sm`}
                            >
                                <span>Mulai Pelajari Simulasi</span>
                                <svg
                                    className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                </svg>
                            </Link>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {recentSimulations.map((attempt) => (
                                <Card
                                    key={attempt.id}
                                    variant="floating"
                                    className="p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        {attempt.is_safe ? (
                                            <Badge variant="safe" withDot>
                                                Lulus
                                            </Badge>
                                        ) : (
                                            <Badge variant="danger" withDot>
                                                Terjebak
                                            </Badge>
                                        )}
                                        <span className="text-xs text-slate-400">
                                            {attempt.relative_time}
                                        </span>
                                    </div>
                                    <div className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {attempt.scenario_title}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Skor Akhir:{' '}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {attempt.score}/100
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Laporkan Modus Baru */}
            {isReporting && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0 bg-[#3B2A1E]/50 backdrop-blur-xs transition-opacity"
                        onClick={() => !isSubmitting && setIsReporting(false)}
                    />
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] p-6 shadow-[6px_6px_0px_0px_#3B2A1E] sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Badge variant="brand">
                                    Formulir Pelaporan • Komunitas
                                </Badge>
                                <h2 className="mt-2 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] sm:text-2xl">
                                    Laporkan Temuan Modus Penipuan Baru
                                </h2>
                                <p className="mt-1 text-xs text-[#6B5646] sm:text-sm">
                                    Laporan dari akun Anda akan dianalisis dan diterbitkan pada Komunitas agar masyarakat luas lebih waspada.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReporting(false)}
                                className="rounded-xl border-2 border-transparent p-1.5 text-[#6B5646] transition hover:border-[#3B2A1E] hover:bg-[#FFE27A] hover:text-[#3B2A1E]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReportSubmit} className="mt-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-[#3B2A1E]">
                                        Judul / Nama Modus *
                                    </label>
                                    <Input
                                        value={formTitle}
                                        onChange={(e) =>
                                            setFormTitle(e.target.value)
                                        }
                                        placeholder="Contoh: Modus QRIS Tempelan di Kafe XYZ"
                                        required
                                        className="mt-1 border-2 border-[#3B2A1E] bg-white font-medium focus:ring-[#3B2A1E]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#3B2A1E]">
                                        Kota / Wilayah Kejadian
                                    </label>
                                    <Input
                                        value={formLocation}
                                        onChange={(e) =>
                                            setFormLocation(e.target.value)
                                        }
                                        placeholder="Contoh: Bandung, Jawa Barat"
                                        className="mt-1 border-2 border-[#3B2A1E] bg-white font-medium focus:ring-[#3B2A1E]"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-[#3B2A1E]">
                                        Kategori *
                                    </label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) =>
                                            setFormCategory(e.target.value)
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-semibold text-[#3B2A1E] focus:outline-none focus:ring-2 focus:ring-[#3B2A1E]"
                                    >
                                        <option value="apk_malware">
                                            Malware APK
                                        </option>
                                        <option value="phishing_banking">
                                            Phishing Bank
                                        </option>
                                        <option value="fake_job">
                                            Lowongan Palsu
                                        </option>
                                        <option value="social_engineering">
                                            Rekayasa Sosial
                                        </option>
                                        <option value="fake_giveaway">
                                            Undian Palsu
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#3B2A1E]">
                                        Platform / Media *
                                    </label>
                                    <select
                                        value={formPlatform}
                                        onChange={(e) =>
                                            setFormPlatform(e.target.value)
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-semibold text-[#3B2A1E] focus:outline-none focus:ring-2 focus:ring-[#3B2A1E]"
                                    >
                                        <option value="WhatsApp">
                                            WhatsApp
                                        </option>
                                        <option value="Telegram">
                                            Telegram
                                        </option>
                                        <option value="Instagram">
                                            Instagram
                                        </option>
                                        <option value="SMS / Telepon">
                                            SMS / Telepon
                                        </option>
                                        <option value="QRIS Fisik / Offline">
                                            QRIS Fisik / Offline
                                        </option>
                                        <option value="Situs Web Phishing">
                                            Situs Web Phishing
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#3B2A1E]">
                                    Kronologi & Cara Kerja Penipuan *
                                </label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) =>
                                        setFormDescription(e.target.value)
                                    }
                                    placeholder="Jelaskan secara singkat bagaimana pelaku mendekati korban dan apa yang mereka minta..."
                                    rows={3}
                                    required
                                    className="mt-1 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3 text-xs font-medium text-[#3B2A1E] focus:outline-none focus:ring-2 focus:ring-[#3B2A1E]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#3B2A1E]">
                                    Bukti Pesan / Teks Percakapan (Opsional)
                                </label>
                                <textarea
                                    value={formEvidence}
                                    onChange={(e) =>
                                        setFormEvidence(e.target.value)
                                    }
                                    placeholder="Kutipan pesan teks atau ciri khas nomor pengirim..."
                                    rows={2}
                                    className="mt-1 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3 font-mono text-xs text-[#3B2A1E] focus:outline-none focus:ring-2 focus:ring-[#3B2A1E]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsReporting(false)}
                                    className={buttonClasses('outline')}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={buttonClasses('primary')}
                                >
                                    {isSubmitting
                                        ? 'Mengirim...'
                                        : 'Kirim Laporan Modus'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
