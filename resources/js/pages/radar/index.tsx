import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Globe,
    Layers,
    MapPin,
    MessageCircle,
    Plus,
    Search,
    Share2,
    ShieldAlert,
    Sparkles,
    ThumbsUp,
    Users,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';

interface ThreatAlert {
    id: number;
    title: string;
    category: string;
    platform: string;
    location: string | null;
    description: string;
    evidence_text: string | null;
    upvotes_count: number;
    created_at_human: string;
}

interface Stats {
    total_alerts: number;
    total_confirmed_cases: number;
    top_targeted_platform: string;
}

interface Props {
    alerts: ThreatAlert[];
    filters: {
        category: string;
        platform: string;
        sort: string;
        search: string;
    };
    stats?: Stats;
}

const categories = [
    { key: 'all', label: 'Semua Kategori' },
    { key: 'apk_malware', label: 'Malware APK' },
    { key: 'phishing_banking', label: 'Phishing Bank' },
    { key: 'fake_job', label: 'Lowongan Palsu' },
    { key: 'social_engineering', label: 'Rekayasa Sosial' },
    { key: 'fake_giveaway', label: 'Undian Palsu' },
];

export default function CommunityRadarIndex({
    alerts: initialAlerts,
    filters,
}: Props) {
    const [alerts, setAlerts] = useState<ThreatAlert[]>(initialAlerts);
    const [selectedCategory, setSelectedCategory] = useState<string>(
        filters.category || 'all',
    );
    const [searchQuery, setSearchQuery] = useState<string>(
        filters.search || '',
    );
    const [sortBy, setSortBy] = useState<string>(filters.sort || 'trending');
    const [upvotedIds, setUpvotedIds] = useState<number[]>([]);
    const [notification, setNotification] = useState<string | null>(null);

    // Modal Buat Laporan Baru State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [reportForm, setReportForm] = useState({
        title: '',
        category: 'apk_malware',
        platform: '',
        location: '',
        description: '',
        evidence_text: '',
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isReportModalOpen) {
                setIsReportModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isReportModalOpen]);

    const getXsrfToken = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleUpvote = async (alertId: number) => {
        if (upvotedIds.includes(alertId)) {
            return;
        }

        try {
            const res = await fetch(`/komunitas/${alertId}/upvote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setUpvotedIds((prev) => [...prev, alertId]);
                setAlerts((prev) =>
                    prev.map((a) =>
                        a.id === alertId
                            ? { ...a, upvotes_count: data.new_count }
                            : a,
                    ),
                );
                toast.success(data.message || 'Berhasil memberikan konfirmasi pada laporan ini.');
            } else {
                toast.error(data.message || 'Gagal menambahkan konfirmasi.');
            }
        } catch {
            toast.error('Gagal menambahkan konfirmasi. Periksa koneksi internet Anda.');
        }
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setIsSubmittingReport(true);

        try {
            const res = await fetch('/komunitas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify(reportForm),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(
                    data.message || 'Laporan modus kejahatan berhasil dikirim.'
                );
                setIsReportModalOpen(false);
                setReportForm({
                    title: '',
                    category: 'apk_malware',
                    platform: '',
                    location: '',
                    description: '',
                    evidence_text: '',
                });
                router.reload({ only: ['alerts', 'stats'] });
            } else {
                setFormError(
                    data.message ||
                        'Gagal mengirim laporan. Pastikan seluruh kolom wajib telah diisi dengan benar.'
                );
            }
        } catch {
            setFormError(
                'Terjadi kesalahan saat mengirim laporan. Silakan coba beberapa saat lagi.'
            );
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const filteredAlerts = alerts
        .filter((item) => {
            if (
                selectedCategory !== 'all' &&
                item.category !== selectedCategory
            ) {
                return false;
            }
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchDesc = item.description.toLowerCase().includes(q);
                const matchLoc =
                    item.location?.toLowerCase().includes(q) ?? false;
                if (!matchTitle && !matchDesc && !matchLoc) {
                    return false;
                }
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'latest') {
                return b.id - a.id;
            }
            return b.upvotes_count - a.upvotes_count;
        });

    return (
        <AppLayout>
            <Head title="Komunitas Pemberantas Kejahatan - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#FFF8EC] pt-8 pb-4 sm:pt-12 sm:pb-6">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl leading-tight font-bold tracking-tight text-[#3B2A1E] sm:text-4xl md:text-[40px]">
                                Komunitas Pemberantas Kejahatan
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6B5646] sm:text-base">
                                Pantau modus kejahatan siber terkini di
                                Indonesia. Laporan nyata yang dikurasi dan
                                divalidasi langsung oleh komunitas Guardian
                                untuk melindungi ruang digital bersama.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notification Toast */}
            {notification && (
                <div className="mx-auto max-w-5xl px-6 pt-6">
                    <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/90 p-4 text-xs font-medium text-brand-900 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-brand-200">
                        <CheckCircle2 className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{notification}</span>
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <section className="mx-auto max-w-5xl px-6 pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    {/* Search */}
                    <div className="relative w-full sm:max-w-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <Search className="size-4 text-[#6B5646]" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kata kunci atau kota..."
                            className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white pl-10 pr-9 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] transition-all focus:border-[#FF9A3C] focus:bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#FF9A3C]/40"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6B5646]/70 hover:text-[#3B2A1E] transition-colors cursor-pointer"
                                title="Hapus pencarian"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Right: Buat Laporan Baru Button on top & Sort controls below */}
                    <div className="flex flex-col items-start sm:items-end gap-2.5">
                        <button
                            type="button"
                            onClick={() => setIsReportModalOpen(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-4 py-2 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[2.5px_2.5px_0px_0px_#3B2A1E] transition hover:bg-[#FFE27A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#3B2A1E]"
                        >
                            <Plus className="size-4 shrink-0" strokeWidth={2.5} />
                            <span>Buat Laporan Baru</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B5646]">
                                Urutkan:
                            </span>
                            <div className="flex rounded-xl border-2 border-[#EFE3D0] bg-white p-1">
                                <button
                                    type="button"
                                    onClick={() => setSortBy('trending')}
                                    className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        sortBy === 'trending'
                                            ? 'border border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E]'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    Paling Marak
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSortBy('latest')}
                                    className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        sortBy === 'latest'
                                            ? 'border border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E]'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    Terbaru
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="mt-4 flex flex-wrap gap-2 border-b-2 border-[#EFE3D0] pb-4">
                    {categories.map((c) => (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => setSelectedCategory(c.key)}
                            className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                selectedCategory === c.key
                                    ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                    : 'border-2 border-transparent text-[#6B5646] hover:bg-[#FFE27A]/40 hover:text-[#3B2A1E]'
                            }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Alert Cards Feed */}
            <section className="mx-auto max-w-5xl px-6 py-8">
                <div className="grid gap-6">
                    {filteredAlerts.map((alert) => {
                        const hasUpvoted = upvotedIds.includes(alert.id);
                        const shareUrl = `https://wa.me/?text=${encodeURIComponent(
                            `⚠️ WASPADA PENIPUAN BARU: ${alert.title}\n\nPlatform: ${alert.platform}\nLokasi: ${
                                alert.location || 'Indonesia'
                            }\nModus: ${alert.description}\n\nPantau selengkapnya di Cekara: https://cekara.id/komunitas`,
                        )}`;

                        return (
                            <Card
                                key={alert.id}
                                variant="floating"
                                className="p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="warn">
                                                {alert.platform}
                                            </Badge>
                                            {alert.location && (
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <MapPin className="size-3 text-slate-400" />
                                                    {alert.location}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                                <Clock className="size-3" />
                                                {alert.created_at_human}
                                            </span>
                                        </div>

                                        <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                                            {alert.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                            {alert.description}
                                        </p>

                                        {alert.evidence_text && (
                                            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    Ciri Percakapan / Bukti:
                                                </span>{' '}
                                                <span className="font-mono italic">
                                                    {alert.evidence_text}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUpvote(alert.id)
                                            }
                                            disabled={hasUpvoted}
                                            className={`inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition-all ${
                                                hasUpvoted
                                                    ? 'border border-brand-200 bg-brand-50 text-brand-700 shadow-xs dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300'
                                                    : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <ThumbsUp className="size-3.5" />
                                            <span>Saya Mengalami Ini</span>
                                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                {alert.upvotes_count}
                                            </span>
                                        </button>

                                        <a
                                            href={shareUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${buttonClasses('ghost')} inline-flex items-center gap-1.5 text-xs`}
                                            title="Bagikan peringatan ini ke grup WhatsApp"
                                        >
                                            <Share2 className="size-3.5" />
                                            Bagikan ke WA
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {filteredAlerts.length === 0 && (
                        <Card
                            variant="glass"
                            className="col-span-full flex flex-col items-center justify-center px-6 py-8 sm:px-8 sm:py-10 text-center"
                        >
                            <img
                                src="/empty_state.png"
                                alt="Belum ada laporan"
                                className="mb-3 w-28 sm:w-32 h-auto object-contain select-none opacity-90"
                            />
                            <h3 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                {alerts.length === 0
                                    ? 'Belum Ada Laporan Komunitas'
                                    : 'Belum Ada Laporan Ditemukan'}
                            </h3>
                            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#6B5646]">
                                {alerts.length === 0
                                    ? 'Belum ada modus kejahatan yang dilaporkan. Laporkan modus penipuan baru untuk melindungi sesama!'
                                    : 'Tidak ada laporan penipuan yang cocok dengan pencarian atau filter kategori Anda.'}
                            </p>
                        </Card>
                    )}
                </div>
            </section>

            {/* Modal Buat Laporan Baru */}
            {isReportModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2A1E]/50 backdrop-blur-xs animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="report-modal-title"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsReportModalOpen(false)}
                    />

                    <div className="relative w-full max-w-lg rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] p-6 sm:p-7 shadow-[6px_6px_0px_0px_#3B2A1E] z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] pb-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                    <ShieldAlert className="size-5" />
                                </div>
                                <div>
                                    <h2
                                        id="report-modal-title"
                                        className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]"
                                    >
                                        Buat Laporan Baru
                                    </h2>
                                    <p className="text-xs text-[#6B5646]">
                                        Laporkan modus penipuan untuk melindungi sesama
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReportModalOpen(false)}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                                aria-label="Tutup jendela modal"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Error Notice */}
                        {formError && (
                            <div className="mb-4 rounded-xl border-2 border-[#D4573A] bg-[#FFEDE8] p-3 text-xs font-bold text-[#D4573A]">
                                {formError}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#3B2A1E] mb-1">
                                    Judul Modus / Kasus <span className="text-[#D4573A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={reportForm.title}
                                    onChange={(e) =>
                                        setReportForm({ ...reportForm, title: e.target.value })
                                    }
                                    placeholder="Contoh: Undian Kupon Palsu Catut Bank BUMN"
                                    className="h-10 w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#3B2A1E] mb-1">
                                        Kategori <span className="text-[#D4573A]">*</span>
                                    </label>
                                    <select
                                        value={reportForm.category}
                                        onChange={(e) =>
                                            setReportForm({ ...reportForm, category: e.target.value })
                                        }
                                        className="h-10 w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                    >
                                        <option value="apk_malware">Malware APK</option>
                                        <option value="phishing_banking">Phishing Bank</option>
                                        <option value="fake_job">Lowongan Palsu</option>
                                        <option value="social_engineering">Rekayasa Sosial</option>
                                        <option value="fake_giveaway">Undian Palsu</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#3B2A1E] mb-1">
                                        Platform Terkait <span className="text-[#D4573A]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={reportForm.platform}
                                        onChange={(e) =>
                                            setReportForm({ ...reportForm, platform: e.target.value })
                                        }
                                        placeholder="Contoh: WhatsApp, Telegram, IG"
                                        className="h-10 w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#3B2A1E] mb-1">
                                    Lokasi / Kota (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={reportForm.location}
                                    onChange={(e) =>
                                        setReportForm({ ...reportForm, location: e.target.value })
                                    }
                                    placeholder="Contoh: Jakarta Selatan, Surabaya, Nasional"
                                    className="h-10 w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#3B2A1E] mb-1">
                                    Kronologi / Ciri-Ciri Modus <span className="text-[#D4573A]">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={reportForm.description}
                                    onChange={(e) =>
                                        setReportForm({ ...reportForm, description: e.target.value })
                                    }
                                    placeholder="Jelaskan secara singkat bagaimana penipuan dijalankan dan bahaya yang dihadapi..."
                                    className="w-full rounded-xl border-2 border-[#3B2A1E] bg-white p-3 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#3B2A1E] mb-1">
                                    Bukti Teks / Nomor / Tautan Mencurigakan (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={reportForm.evidence_text}
                                    onChange={(e) =>
                                        setReportForm({ ...reportForm, evidence_text: e.target.value })
                                    }
                                    placeholder="Contoh: +62812xxxx atau link phish-bank.com"
                                    className="h-10 w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-[#EFE3D0]">
                                <button
                                    type="button"
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="cursor-pointer rounded-xl border-2 border-[#3B2A1E] bg-white px-4 py-2 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReport}
                                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-5 py-2 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition disabled:opacity-50"
                                >
                                    {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
