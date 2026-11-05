import { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Award,
    CheckCircle2,
    FileText,
    Gamepad2,
    Image as ImageIcon,
    Link2,
    MessageSquare,
    Shield,
    ShieldAlert,
    Trash2,
    Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
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

    const [activeTab, setActiveTab] = useState<
        'all' | 'text' | 'image' | 'url'
    >('all');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const filteredScans = useMemo(() => {
        if (activeTab === 'all') {
            return recentScans;
        }
        return recentScans.filter(
            (s) => s.scan_type.toLowerCase() === activeTab,
        );
    }, [recentScans, activeTab]);

    const handleDeleteScan = (id: number) => {
        if (
            confirm('Apakah Anda yakin ingin menghapus riwayat pemindaian ini?')
        ) {
            setDeletingId(id);
            router.delete(`/scans/${id}`, {
                preserveScroll: true,
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

    const getScanTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'image':
                return <ImageIcon className="size-3.5" />;
            case 'url':
                return <Link2 className="size-3.5" />;
            default:
                return <MessageSquare className="size-3.5" />;
        }
    };

    const getScanTypeLabel = (type: string) => {
        switch (type.toLowerCase()) {
            case 'image':
                return 'Screenshot Chat';
            case 'url':
                return 'Tautan URL';
            default:
                return 'Teks Pesan';
        }
    };

    return (
        <AppLayout>
            <Head title="Dashboard Pengguna - Cekara" />

            <div className="mx-auto max-w-5xl px-6 py-8">
                {/* User Greeting & Header Banner */}
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-brand-50/20 to-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:from-slate-900/60 dark:via-brand-950/20 dark:to-slate-900/40">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                                    Halo, {user?.name ?? 'Guardian'}!
                                </h1>
                                <Badge
                                    variant="brand"
                                    className="px-2.5 py-0.5 text-xs font-semibold"
                                >
                                    <Award className="mr-1 size-3" />
                                    {guardianStatus.rank}
                                </Badge>
                            </div>
                            <p className="mt-1.5 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                                Pusat kendali kesiapsiagaan siber dan riwayat
                                proteksi digital pribadi Anda. Pantau skor
                                kewaspadaan dan latih insting keamanan secara
                                berkala.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/#cek-pesan"
                                className={`${buttonClasses('primary')} shadow-sm`}
                            >
                                <Zap className="mr-1.5 size-4 text-brand-200" />
                                Analisis Pesan
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Guardian Metrics (4 Cards Grid) */}
                <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Pangkat Guardian */}
                    <Card
                        variant="floating"
                        className="flex flex-col justify-between p-5"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Pangkat Guardian
                            </span>
                            <span className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                                <Award className="size-4" />
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="text-lg font-bold text-slate-900 sm:text-xl dark:text-slate-100">
                                {guardianStatus.rank}
                            </div>
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {guardianStatus.rank === 'Master Guardian' ? (
                                    <span className="flex items-center gap-1 font-medium text-safe">
                                        <CheckCircle2 className="size-3" />{' '}
                                        Tingkat Tertinggi
                                    </span>
                                ) : (
                                    <span>
                                        Tingkatkan skor & simulasi untuk naik
                                        pangkat
                                    </span>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Skor Kewaspadaan */}
                    <Card
                        variant="floating"
                        className="flex flex-col justify-between p-5"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Skor Kewaspadaan
                            </span>
                            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <Activity className="size-4" />
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {guardianStatus.alertness_score}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    / 100
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {guardianStatus.alertness_label}
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, guardianStatus.alertness_score)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Card 3: Statistik Simulasi */}
                    <Card
                        variant="floating"
                        className="flex flex-col justify-between p-5"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Latihan Simulasi
                            </span>
                            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                <Gamepad2 className="size-4" />
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {guardianStatus.completed_simulations}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    / {guardianStatus.total_simulations}{' '}
                                    Skenario
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Tingkat Selesai:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {guardianStatus.simulation_completion_rate}%
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, guardianStatus.simulation_completion_rate)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Card 4: Total Riwayat Pemindaian */}
                    <Card
                        variant="floating"
                        className="flex flex-col justify-between p-5"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Riwayat Cek
                            </span>
                            <span className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                <ShieldAlert className="size-4" />
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {guardianStatus.total_scans}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Pemindaian
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="font-medium text-danger">
                                    {guardianStatus.threats_detected} Bahaya
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">
                                    •
                                </span>
                                <span className="font-medium text-safe">
                                    {guardianStatus.safe_scans} Aman
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Tersimpan permanen di akun Anda
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions (3 Action Cards) */}
                <div className="mb-10">
                    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                        <Zap className="size-4 text-brand-600 dark:text-brand-400" />
                        Aksi Cepat Guardian
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Action 1: Cek Pesan Baru */}
                        <Link
                            href="/#cek-pesan"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-brand-600"
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform group-hover:scale-105 dark:bg-brand-950/50 dark:text-brand-400">
                                    <Shield className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                                        Cek Pesan Baru
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        Analisis teks, URL mencurigakan, atau
                                        unggah screenshot chat berisiko.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-400">
                                Buka Detektor{' '}
                                <ArrowRight className="size-3.5" />
                            </div>
                        </Link>

                        {/* Action 2: Latihan Simulasi */}
                        <Link
                            href="/simulasi"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-indigo-600"
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105 dark:bg-indigo-950/50 dark:text-indigo-400">
                                    <Gamepad2 className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                        Latihan Simulasi
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        Asah insting pertahanan dengan simulasi
                                        keputusan modus penipuan nyata.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-transform group-hover:translate-x-1 dark:text-indigo-400">
                                Mulai Latihan{' '}
                                <ArrowRight className="size-3.5" />
                            </div>
                        </Link>

                        {/* Action 3: Pusat Tindakan Darurat */}
                        <Link
                            href="/tanggap-darurat"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-red-600"
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger transition-transform group-hover:scale-105 dark:bg-red-950/50 dark:text-red-400">
                                    <ShieldAlert className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-danger dark:text-slate-100 dark:group-hover:text-red-400">
                                        Pusat Tindakan Darurat
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        Panduan cepat jika terlanjur instal APK,
                                        transfer uang, atau KTP tersebar.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-danger transition-transform group-hover:translate-x-1 dark:text-red-400">
                                Tangani Insiden{' '}
                                <ArrowRight className="size-3.5" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Scan History Section ('Recent Tabs') */}
                <div className="mb-10">
                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                <FileText className="size-4 text-brand-600 dark:text-brand-400" />
                                Riwayat Pemindaian Penipuan
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Daftar analisis pesan, tangkapan layar, dan URL
                                yang telah Anda pindai.
                            </p>
                        </div>

                        {/* Recent Tabs Filter */}
                        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/60">
                            <button
                                type="button"
                                onClick={() => setActiveTab('all')}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                                    activeTab === 'all'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Semua ({recentScans.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('text')}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                                    activeTab === 'text'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Teks Pesan
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('image')}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                                    activeTab === 'image'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Screenshot Chat
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('url')}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                                    activeTab === 'url'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Tautan URL
                            </button>
                        </div>
                    </div>

                    {filteredScans.length === 0 ? (
                        <Card
                            variant="glass"
                            className="flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                                <FileText className="size-6" />
                            </div>
                            <h3 className="mt-3.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Belum ada riwayat pemindaian
                            </h3>
                            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Tempelkan pesan, masukkan link mencurigakan,
                                atau unggah tangkapan layar chat untuk melihat
                                hasil analisis di sini.
                            </p>
                            <Link
                                href="/#cek-pesan"
                                className={`${buttonClasses('primary')} mt-5 text-xs shadow-sm`}
                            >
                                <Zap className="mr-1.5 size-3.5" />
                                Pindai Pesan Sekarang
                            </Link>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredScans.map((scan) => (
                                <Card
                                    key={scan.id}
                                    variant="floating"
                                    className="p-5 transition-all"
                                >
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {getScanTypeIcon(
                                                    scan.scan_type,
                                                )}
                                                {getScanTypeLabel(
                                                    scan.scan_type,
                                                )}
                                            </span>
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
                                                className="inline-flex items-center gap-1 text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                                                title="Hapus riwayat pemindaian"
                                            >
                                                <Trash2 className="size-3.5" />
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
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                                                    <AlertTriangle className="size-3.5" />
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
                                            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-950/40 dark:bg-emerald-950/20">
                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
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

                {/* Recent Simulations Journey (Secondary Section) */}
                {recentSimulations.length > 0 && (
                    <div className="mb-8">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                <Gamepad2 className="size-4 text-indigo-600 dark:text-indigo-400" />
                                Riwayat Latihan Simulasi Terbaru
                            </h2>
                            <Link
                                href="/simulasi"
                                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                            >
                                Lihat Semua Skenario{' '}
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
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
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
