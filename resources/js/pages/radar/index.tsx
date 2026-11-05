import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    MapPin,
    Plus,
    Radio,
    Search,
    Send,
    Share2,
    ThumbsUp,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    stats: Stats;
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
    stats,
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
    const [isReporting, setIsReporting] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // Form states
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

    const handleUpvote = async (alertId: number) => {
        if (upvotedIds.includes(alertId)) {
            return;
        }

        try {
            const res = await fetch(`/radar/${alertId}/upvote`, {
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
                setNotification(data.message);
                setTimeout(() => setNotification(null), 4000);
            }
        } catch {
            setNotification('Gagal menambahkan konfirmasi.');
        }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/radar', {
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
                    location: formLocation,
                    description: formDescription,
                    evidence_text: formEvidence,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setNotification(data.message);
                setFormTitle('');
                setFormLocation('');
                setFormDescription('');
                setFormEvidence('');
                setIsReporting(false);
            } else {
                setNotification(data.message || 'Gagal mengirim laporan.');
            }
        } catch {
            setNotification('Terjadi kendala jaringan saat mengirim laporan.');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setNotification(null), 5000);
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
            <Head title="Radar Ancaman Komunitas - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-b from-slate-50/80 to-white py-12 dark:border-slate-800 dark:from-slate-900/40 dark:to-slate-950">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Badge variant="brand">
                                    <Radio className="mr-1 size-3" />
                                    Sistem Peringatan Dini
                                </Badge>
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                                    Live Community Radar
                                </span>
                            </div>
                            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                                Radar Ancaman Komunitas
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                Pantau modus kejahatan siber terkini di
                                Indonesia. Laporan nyata yang dikurasi dan
                                divalidasi langsung oleh komunitas Guardian
                                untuk melindungi ruang digital bersama.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => setIsReporting(!isReporting)}
                            className="shrink-0 shadow-sm"
                        >
                            {isReporting ? (
                                <>
                                    <X className="mr-1.5 size-4" />
                                    Tutup Formulir
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-1.5 size-4" />
                                    Laporkan Modus Baru
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Stats Highlights */}
                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <Card variant="floating" className="p-4">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Modus Terverifikasi
                            </span>
                            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                                {stats.total_alerts} Pola
                            </div>
                        </Card>
                        <Card variant="floating" className="p-4">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Konfirmasi Warga
                            </span>
                            <div className="mt-1 text-2xl font-extrabold text-brand-600 dark:text-brand-400">
                                {stats.total_confirmed_cases}+ Korban
                            </div>
                        </Card>
                        <Card
                            variant="floating"
                            className="col-span-2 p-4 sm:col-span-1"
                        >
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Platform Paling Rawan
                            </span>
                            <div className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                                {stats.top_targeted_platform}
                            </div>
                        </Card>
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

            {/* Report Form Modal / Collapse */}
            {isReporting && (
                <section className="mx-auto max-w-5xl px-6 pt-6">
                    <Card
                        variant="glass"
                        className="border-brand-200/80 bg-brand-50/20 p-6 sm:p-8 dark:border-brand-900/50 dark:bg-brand-950/20"
                    >
                        <div className="flex items-center gap-2">
                            <Badge variant="brand">Formulir Pelaporan</Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Pola Baru
                            </span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                            Laporkan Temuan Modus Penipuan Baru
                        </h2>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Laporan Anda akan dianalisis dan diterbitkan pada
                            Radar Komunitas agar masyarakat luas lebih waspada.
                        </p>

                        <form
                            onSubmit={handleReportSubmit}
                            className="mt-6 space-y-4"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Judul / Nama Modus *
                                    </label>
                                    <Input
                                        value={formTitle}
                                        onChange={(e) =>
                                            setFormTitle(e.target.value)
                                        }
                                        placeholder="Contoh: Modus QRIS Tempelan di Kafe XYZ"
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Kota / Wilayah Kejadian
                                    </label>
                                    <Input
                                        value={formLocation}
                                        onChange={(e) =>
                                            setFormLocation(e.target.value)
                                        }
                                        placeholder="Contoh: Bandung, Jawa Barat"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Kategori *
                                    </label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) =>
                                            setFormCategory(e.target.value)
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
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
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Platform / Media *
                                    </label>
                                    <select
                                        value={formPlatform}
                                        onChange={(e) =>
                                            setFormPlatform(e.target.value)
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
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
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
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
                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Bukti Pesan / Teks Percakapan (Opsional)
                                </label>
                                <textarea
                                    value={formEvidence}
                                    onChange={(e) =>
                                        setFormEvidence(e.target.value)
                                    }
                                    placeholder="Kutipan pesan teks atau ciri khas nomor pengirim..."
                                    rows={2}
                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsReporting(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting}
                                >
                                    <Send className="mr-1.5 size-3.5" />
                                    {isSubmitting
                                        ? 'Mengirim...'
                                        : 'Kirim Laporan Modus'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </section>
            )}

            {/* Filter & Search Bar */}
            <section className="mx-auto max-w-5xl px-6 pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kata kunci atau kota..."
                            className="pl-9"
                        />
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Urutkan:
                        </span>
                        <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/60">
                            <button
                                type="button"
                                onClick={() => setSortBy('trending')}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                    sortBy === 'trending'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Paling Marak
                            </button>
                            <button
                                type="button"
                                onClick={() => setSortBy('latest')}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                    sortBy === 'latest'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Terbaru
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200/80 pb-4 dark:border-slate-800">
                    {categories.map((c) => (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => setSelectedCategory(c.key)}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                                selectedCategory === c.key
                                    ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
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
                            }\nModus: ${alert.description}\n\nPantau radar selengkapnya di Cekara: https://cekara.id/radar`,
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
                        <div className="rounded-2xl border border-dashed border-slate-200/80 py-16 text-center text-sm text-slate-500 dark:border-slate-800">
                            Tidak ada laporan penipuan yang cocok dengan
                            pencarian Anda.
                        </div>
                    )}
                </div>
            </section>
        </AppLayout>
    );
}
