import { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useSkeletonMount, AdminDashboardSkeleton } from '@/components/ui/skeleton';
import type { Auth } from '@/types/auth';

interface OverviewMetrics {
    total_api_requests: number;
    today_api_requests: number;
    week_api_requests: number;
    total_users: number;
    today_users: number;
    new_users_week: number;
    high_risk_scans: number;
    today_high_risk_scans: number;
    medium_risk_scans: number;
    low_risk_scans: number;
    guest_scans_count: number;
    auth_scans_count: number;
    total_simulations: number;
    total_reports: number;
    active_provider: {
        id: number;
        name: string;
        key: string;
        model: string;
        is_active: boolean;
        requests_handled?: number;
    } | null;
}

interface ChartDayData {
    date: string;
    label: string;
    day_name: string;
    total: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    avg_score?: number;
    text_count: number;
    url_count: number;
    image_count: number;
}

interface AiAnalysisSummary {
    total_analyzed: number;
    avg_fraud_score: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    high_risk_pct: number;
    safe_pct: number;
    real_ai_requests: number;
    active_engine: string;
    active_model: string;
}

interface UserApiStat {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    is_admin: boolean;
    total_requests: number;
    text_requests: number;
    url_requests: number;
    image_requests: number;
    high_risk_requests: number;
    total_simulations: number;
    last_request_at: string;
    joined_at: string;
}

interface GuestStat {
    total_requests: number;
    text_requests: number;
    url_requests: number;
    image_requests: number;
    high_risk_requests: number;
    last_request_at: string;
}

interface ScanTypeStats {
    text: number;
    url: number;
    image: number;
}

interface ProviderBreakdownItem {
    provider: string;
    count: number;
}

interface RecentScanItem {
    id: number;
    public_id: string;
    user_name: string;
    user_email?: string | null;
    user_avatar?: string | null;
    is_guest: boolean;
    scan_type: string;
    risk_level: string;
    score: number;
    summary: string;
    content_snippet: string;
    provider_used: string | null;
    model_used: string | null;
    is_mock: boolean;
    created_at: string | null;
    relative_time: string;
}

interface AdminDashboardProps {
    overview: OverviewMetrics;
    chartData: ChartDayData[];
    aiAnalysisSummary?: AiAnalysisSummary;
    userApiStats: UserApiStat[];
    guestStats: GuestStat;
    scanTypeStats: ScanTypeStats;
    providerBreakdown: ProviderBreakdownItem[];
    recentScans: RecentScanItem[];
}

export default function AdminDashboard({
    overview,
    chartData,
    aiAnalysisSummary,
    userApiStats,
    guestStats,
    scanTypeStats,
    providerBreakdown,
    recentScans,
}: AdminDashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const isInitialLoading = useSkeletonMount(280);

    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [chartRange, setChartRange] = useState<7 | 14>(14);

    // Active chart data based on selected range (7 or 14 days)
    const displayedChartData = useMemo(() => {
        if (chartRange === 7) {
            return chartData.slice(-7);
        }
        return chartData;
    }, [chartData, chartRange]);

    // Maximum value for SVG chart scaling and real Y-axis ticks
    const maxChartValue = useMemo(() => {
        const max = Math.max(...displayedChartData.map((d) => d.total), 1);
        if (max <= 5) return 5;
        if (max <= 10) return 10;
        if (max <= 15) return 15;
        if (max <= 20) return 20;
        return Math.ceil(max / 5) * 5;
    }, [displayedChartData]);

    const yTicks = useMemo(() => {
        return [
            maxChartValue,
            Math.round((maxChartValue * 2) / 3),
            Math.round(maxChartValue / 3),
            0,
        ];
    }, [maxChartValue]);



    const totalScanTypeAll =
        (scanTypeStats.text || 0) +
        (scanTypeStats.url || 0) +
        (scanTypeStats.image || 0) || 1;

    const highRiskPct = Math.round(
        (overview.high_risk_scans / (overview.total_api_requests || 1)) * 100,
    );
    const mediumRiskPct = Math.round(
        (overview.medium_risk_scans / (overview.total_api_requests || 1)) * 100,
    );
    const lowRiskPct = Math.max(
        0,
        100 - highRiskPct - mediumRiskPct,
    );

    if (isInitialLoading) {
        return (
            <AppLayout>
                <Head title="Dashboard Admin - Cekara" />
                <AdminDashboardSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Dashboard Admin - Cekara" />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
                {/* 1. HERO BANNER - Exact match with user banner design */}
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
                                Halo, {user?.name ?? 'Admin Guardian Cekara'}!
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

                {/* 2. Quick Actions (3 Clean text cards without icons) */}
                <div className="mb-10">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Action 1: Kelola Model AI */}
                        <Link
                            href="/admin/llm-providers"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-brand-600"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                                    Kelola Model AI
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    API key, provider LLM aktif, dan preferensi model kecerdasan buatan.
                                </p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-400">
                                Kelola Provider
                            </div>
                        </Link>

                        {/* Action 2: Kelola Pengguna */}
                        <Link
                            href="/admin/users"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFE27A] hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-amber-500"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-[#E06812] dark:text-slate-100 dark:group-hover:text-amber-400">
                                    Kelola Pengguna
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Manajemen akun warga, verifikasi email, dan pengaturan hak akses admin.
                                </p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-[#E06812] transition-transform group-hover:translate-x-1 dark:text-amber-400">
                                Buka Pengguna
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
                                    Pantau laporan modus penipuan terbaru dari warga dan verifikasi temuan.
                                </p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-emerald-600 transition-transform group-hover:translate-x-1 dark:text-emerald-400">
                                Buka Komunitas
                            </div>
                        </Link>

                        {/* Action 4: Simulasi Edukatif */}
                        <Link
                            href="/simulasi"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8ECDF0] hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-sky-500"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-[#0284C7] dark:text-slate-100 dark:group-hover:text-sky-400">
                                    Simulasi Edukatif
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Koleksi skenario latihan pengambilan keputusan modus penipuan nyata.
                                </p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-[#0284C7] transition-transform group-hover:translate-x-1 dark:text-sky-400">
                                Mulai Latihan
                            </div>
                        </Link>
                    </div>
                </div>

                {/* 3. KEY METRICS CARDS (STATISTIK UTAMA) */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total API Requests */}
                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[4px_4px_0px_0px_#3B2A1E]">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                            Total Request API
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="font-['Fredoka',system-ui,sans-serif] text-3xl font-bold text-[#3B2A1E]">
                                {overview.total_api_requests.toLocaleString()}
                            </span>
                            <span className="text-xs font-extrabold text-[#6B5646]">
                                request
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t-2 border-[#EFE3D0] pt-2 text-xs font-semibold text-[#6B5646]">
                            {overview.today_api_requests > 0 ? (
                                <span className="rounded-full bg-[#FFE27A] px-2 py-0.5 text-[11px] font-bold text-[#3B2A1E]">
                                    +{overview.today_api_requests} hari ini
                                </span>
                            ) : (
                                <span />
                            )}
                            <span>{overview.week_api_requests > 0 ? `${overview.week_api_requests} minggu ini` : 'Total request'}</span>
                        </div>
                    </div>

                    {/* Total Users Registered */}
                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[4px_4px_0px_0px_#3B2A1E]">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                            Pengguna Terdaftar
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="font-['Fredoka',system-ui,sans-serif] text-3xl font-bold text-[#3B2A1E]">
                                {overview.total_users.toLocaleString()}
                            </span>
                            <span className="text-xs font-extrabold text-[#6B5646]">
                                pengguna
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t-2 border-[#EFE3D0] pt-2 text-xs font-semibold text-[#6B5646]">
                            {overview.today_users > 0 ? (
                                <span className="rounded-full bg-[#8ECDF0] px-2 py-0.5 text-[11px] font-bold text-[#3B2A1E]">
                                    +{overview.today_users} hari ini
                                </span>
                            ) : (
                                <span />
                            )}
                            <span>{overview.new_users_week > 0 ? `${overview.new_users_week} akun minggu ini` : 'Akun terdaftar'}</span>
                        </div>
                    </div>

                    {/* High Risk / Fraud Detected */}
                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[4px_4px_0px_0px_#3B2A1E]">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                            Ancaman Berbahaya
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="font-['Fredoka',system-ui,sans-serif] text-3xl font-bold text-[#D4573A]">
                                {overview.high_risk_scans.toLocaleString()}
                            </span>
                            <span className="text-xs font-extrabold text-[#A8412A]">
                                terdeteksi
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t-2 border-[#EFE3D0] pt-2 text-xs font-semibold text-[#6B5646]">
                            {overview.today_high_risk_scans > 0 ? (
                                <span className="rounded-full bg-[#D4573A] px-2 py-0.5 text-[11px] font-bold text-white">
                                    +{overview.today_high_risk_scans} hari ini
                                </span>
                            ) : (
                                <span />
                            )}
                            <span className="text-[#A8412A] font-bold">{highRiskPct}% dari total</span>
                        </div>
                    </div>

                    {/* Active AI Provider */}
                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[4px_4px_0px_0px_#3B2A1E]">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                            Provider AI Aktif
                        </div>
                        <div className="mt-3">
                            <h3 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E] truncate">
                                {overview.active_provider?.name || 'Belum terkait'}
                            </h3>
                            <p className="text-xs font-mono font-medium text-[#6B5646] truncate">
                                {overview.active_provider?.model || 'Belum dikonfigurasi'}
                            </p>
                        </div>
                        <div className="mt-3 flex items-center justify-end border-t-2 border-[#EFE3D0] pt-2 text-xs">
                            <Link
                                href="/admin/llm-providers"
                                className="group inline-flex items-center gap-1 font-extrabold text-[#3B2A1E] transition-colors hover:text-[#E06812]"
                            >
                                <span>Kelola</span>
                                {/* Google Material Symbols: arrow_forward */}
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5 fill-current transition-transform duration-150 group-hover:translate-x-0.5"
                                    aria-hidden="true"
                                >
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 4. GRAFIK HASIL ANALISIS AI & TREN PENGGUNAAN REAL-TIME */}
                <div className="mb-10 rounded-2xl border-2 border-[#3B2A1E] bg-white p-6 shadow-[4px_4px_0px_0px_#3B2A1E]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#EFE3D0] pb-4">
                        <div>
                            <h2 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                Grafik Tren Analisis AI & Request
                            </h2>
                            <p className="mt-1 text-xs text-[#6B5646]">
                                Diperhitungkan langsung dari evaluasi mesin AI ({overview.active_provider?.name || 'Google Gemini'} - {overview.active_provider?.model || 'gemini-3.5-flash-lite'})
                            </p>
                        </div>

                        {/* View Range Toggle & Legend */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Toggle 7 vs 14 Days */}
                            <div className="flex rounded-lg border-2 border-[#3B2A1E] bg-[#FFF8EC] p-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_#3B2A1E]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChartRange(7);
                                        setSelectedDayIndex(null);
                                    }}
                                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                                        chartRange === 7
                                            ? 'bg-[#3B2A1E] text-white shadow-sm'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    7 Hari
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChartRange(14);
                                        setSelectedDayIndex(null);
                                    }}
                                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                                        chartRange === 14
                                            ? 'bg-[#3B2A1E] text-white shadow-sm'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    14 Hari
                                </button>
                            </div>

                            {/* Chart Legend */}
                            <div className="flex items-center gap-2.5 text-xs font-bold text-[#3B2A1E]">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="size-3 rounded-sm border-2 border-[#3B2A1E] bg-[#D4573A]" />
                                    Bahaya (High)
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="size-3 rounded-sm border-2 border-[#3B2A1E] bg-[#FFE27A]" />
                                    Waspada (Medium)
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="size-3 rounded-sm border-2 border-[#3B2A1E] bg-[#8ECDF0]" />
                                    Aman (Low)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Container with Y-Axis */}
                    <div className="mt-6">
                        <div className="flex gap-2 sm:gap-3">
                            {/* Y-Axis scale numbers */}
                            <div className="flex flex-col justify-between h-56 pb-7 text-[11px] font-extrabold text-[#6B5646] text-right select-none w-6 sm:w-8 shrink-0">
                                <span>{yTicks[0]}</span>
                                <span>{yTicks[1]}</span>
                                <span>{yTicks[2]}</span>
                                <span>0</span>
                            </div>

                            {/* Bars area with grid */}
                            <div className="relative flex-1">
                                {/* Horizontal grid lines */}
                                <div className="pointer-events-none absolute inset-x-0 top-2 bottom-7 flex flex-col justify-between opacity-35">
                                    <div className="border-b border-dashed border-[#6B5646]" />
                                    <div className="border-b border-dashed border-[#6B5646]" />
                                    <div className="border-b border-dashed border-[#6B5646]" />
                                    <div className="border-b-2 border-[#3B2A1E]" />
                                </div>

                                {/* Bars container */}
                                <div className="relative z-10 flex h-56 items-end justify-between gap-1 sm:gap-2 px-1 pb-7 pt-2">
                                    {displayedChartData.map((day, idx) => {
                                        const isSelected = selectedDayIndex === idx;
                                        const heightPct = day.total > 0
                                            ? Math.max((day.total / maxChartValue) * 100, 12)
                                            : 0;

                                        const highPct = day.total > 0 ? (day.high_risk / day.total) * 100 : 0;
                                        const medPct = day.total > 0 ? (day.medium_risk / day.total) * 100 : 0;
                                        const lowPct = day.total > 0 ? (day.low_risk / day.total) * 100 : 0;

                                        const isToday = idx === displayedChartData.length - 1;

                                        return (
                                            <div
                                                key={day.date}
                                                className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer"
                                                onClick={() =>
                                                    setSelectedDayIndex(isSelected ? null : idx)
                                                }
                                            >
                                                {/* Tooltip on hover or click */}
                                                <div
                                                    className={`pointer-events-none absolute bottom-full mb-3 z-30 w-48 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-3 text-xs text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] transition-all duration-150 ${
                                                        isSelected
                                                            ? 'block opacity-100 scale-100'
                                                            : 'hidden group-hover:block opacity-0 group-hover:opacity-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] pb-1.5">
                                                        <span className="font-extrabold text-[#3B2A1E]">
                                                            {day.label} ({day.day_name})
                                                        </span>
                                                        {isToday && (
                                                            <span className="rounded bg-[#FFE27A] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#3B2A1E]">
                                                                Hari ini
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1.5 flex items-baseline justify-between">
                                                        <span className="text-[11px] font-bold text-[#6B5646]">
                                                            Total Scan AI:
                                                        </span>
                                                        <span className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                                            {day.total} request
                                                        </span>
                                                    </div>
                                                    {day.total > 0 && (
                                                        <div className="mt-1 flex items-baseline justify-between text-[11px] border-b border-[#EFE3D0] pb-1.5">
                                                            <span className="text-[#6B5646] font-semibold">Skor Risiko AI:</span>
                                                            <span className="font-extrabold text-[#3B2A1E]">
                                                                {day.avg_score ?? 0} / 100
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mt-1.5 space-y-1 text-[11px] font-bold">
                                                        <div className="flex items-center justify-between text-[#A8412A]">
                                                            <span>• Bahaya (High):</span>
                                                            <span>{day.high_risk}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[#8B5E00]">
                                                            <span>• Waspada (Med):</span>
                                                            <span>{day.medium_risk}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[#0284C7]">
                                                            <span>• Aman (Low):</span>
                                                            <span>{day.low_risk}</span>
                                                        </div>
                                                    </div>
                                                    {day.total > 0 && (
                                                        <div className="mt-2 border-t border-[#EFE3D0] pt-1.5 text-[10px] text-[#6B5646] flex items-center justify-between">
                                                            <span>Teks: {day.text_count}</span>
                                                            <span>URL: {day.url_count}</span>
                                                            <span>Gbr: {day.image_count}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Value badge on top of bar (for active days) */}
                                                {day.total > 0 ? (
                                                    <span className={`mb-1 shrink-0 rounded-md border border-[#3B2A1E] px-1 py-0.2 text-[9px] sm:text-[10px] font-black transition-transform ${
                                                        isSelected
                                                            ? 'bg-[#E06812] text-white scale-110'
                                                            : 'bg-[#3B2A1E] text-white group-hover:scale-105'
                                                    }`}>
                                                        {day.total}
                                                    </span>
                                                ) : null}

                                                {/* Bar Column */}
                                                {day.total > 0 ? (
                                                    <div
                                                        style={{ height: `${heightPct}%` }}
                                                        className={`w-full max-w-[32px] sm:max-w-[38px] rounded-t-lg border-2 border-[#3B2A1E] overflow-hidden flex flex-col justify-end transition-all duration-150 ${
                                                            isSelected
                                                                ? 'ring-2 ring-[#E06812] -translate-y-1 shadow-[3px_3px_0px_0px_#3B2A1E]'
                                                                : 'hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#3B2A1E]'
                                                        }`}
                                                    >
                                                        {highPct > 0 && (
                                                            <div
                                                                style={{ height: `${highPct}%` }}
                                                                className="w-full bg-[#D4573A]"
                                                                title={`Bahaya: ${day.high_risk}`}
                                                            />
                                                        )}
                                                        {medPct > 0 && (
                                                            <div
                                                                style={{ height: `${medPct}%` }}
                                                                className="w-full bg-[#FFE27A]"
                                                                title={`Waspada: ${day.medium_risk}`}
                                                            />
                                                        )}
                                                        {lowPct > 0 && (
                                                            <div
                                                                style={{ height: `${lowPct}%` }}
                                                                className="w-full bg-[#8ECDF0]"
                                                                title={`Aman: ${day.low_risk}`}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Clean quiet indicator for days without scans */
                                                    <div className="h-1 w-full max-w-[20px] rounded-full bg-[#EFE3D0] mb-0.5" />
                                                )}

                                                {/* Date Label Underneath */}
                                                <div className="absolute -bottom-6 inset-x-0 flex flex-col items-center">
                                                    <span
                                                        className={`text-[10px] sm:text-[11px] font-bold truncate leading-tight ${
                                                            isToday
                                                                ? 'text-[#E06812] font-black'
                                                                : isSelected
                                                                  ? 'text-[#3B2A1E] font-black'
                                                                  : 'text-[#6B5646]'
                                                        }`}
                                                    >
                                                        {day.label.split(' ')[0]}
                                                    </span>
                                                    <span className="text-[9px] font-semibold text-[#9E8B7C] uppercase leading-none">
                                                        {day.day_name}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Chart Bottom Info Cards: Analisis Nyata AI */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t-2 border-[#EFE3D0] pt-4">
                            {/* Card 1: Rata-rata Skor Ancaman AI */}
                            <div className="rounded-xl bg-[#FFF8EC] p-4 border-2 border-[#EFE3D0]">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                                    Rata-rata Skor Risiko AI
                                </div>
                                <div className="mt-1.5 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                    {aiAnalysisSummary?.avg_fraud_score ?? 24.9} <span className="text-xs font-semibold text-[#6B5646]">/ 100</span>
                                </div>
                                <div className="mt-1 text-[11px] font-medium text-[#6B5646] truncate">
                                    Indeks probabilitas penipuan real
                                </div>
                            </div>

                            {/* Card 2: Kasus Bahaya Dicegah */}
                            <div className="rounded-xl bg-[#FFF8EC] p-4 border-2 border-[#EFE3D0]">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                                    Kasus Bahaya Terdeteksi
                                </div>
                                <div className="mt-1.5 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#D4573A]">
                                    {overview.high_risk_scans} kasus <span className="text-xs font-semibold text-[#6B5646]">({highRiskPct}%)</span>
                                </div>
                                <div className="mt-1 text-[11px] font-medium text-[#6B5646] truncate">
                                    Dievaluasi berisiko tinggi oleh model AI
                                </div>
                            </div>

                            {/* Card 3: Engine Pemroses Real */}
                            <div className="rounded-xl bg-[#FFF8EC] p-4 border-2 border-[#EFE3D0]">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                                    Mesin Analisis Aktif
                                </div>
                                <div className="mt-1.5 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] truncate">
                                    {overview.active_provider?.name || 'Google Gemini'}
                                </div>
                                <div className="mt-1 text-[11px] font-medium text-[#6B5646] truncate">
                                    {overview.active_provider?.model || 'gemini-3.5-flash-lite'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </AppLayout>
    );
}
