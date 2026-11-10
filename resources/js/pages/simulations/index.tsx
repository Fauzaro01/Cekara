import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface ScenarioItem {
    id: number;
    title: string;
    slug: string;
    category: string;
    difficulty: string;
    context_description: string;
    sender_name: string;
    sender_avatar: string | null;
    order: number;
    has_attempted: boolean;
    latest_score: number | null;
    is_safe: boolean | null;
}

interface UserStats {
    total_scenarios: number;
    completed_count: number;
    average_score: number;
    guardian_rank: string;
}

interface Props {
    scenarios: ScenarioItem[];
    userStats: UserStats;
}

const categories = [
    { key: 'all', label: 'Semua Kategori' },
    { key: 'apk_malware', label: 'Malware APK' },
    { key: 'phishing_banking', label: 'Phishing Bank' },
    { key: 'fake_job', label: 'Lowongan Palsu' },
    { key: 'social_engineering', label: 'Rekayasa Sosial' },
    { key: 'fake_giveaway', label: 'Undian Palsu' },
];

export default function SimulationIndex({ scenarios, userStats }: Props) {
    const { auth } = usePage<{
        auth?: {
            user?: { id: number; name: string; email: string } | null;
        };
    }>().props;
    const user = auth?.user;
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<'trending' | 'latest'>('trending');

    const filteredScenarios = scenarios
        .filter((s) => {
            if (selectedCategory !== 'all') {
                if (selectedCategory === 'social_engineering') {
                    if (
                        ![
                            'social_engineering',
                            'ai_deepfake',
                            'qris_fraud',
                            'loan_scam',
                        ].includes(s.category)
                    ) {
                        return false;
                    }
                } else if (s.category !== selectedCategory) {
                    return false;
                }
            }

            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchTitle = s.title.toLowerCase().includes(q);
                const matchDesc = s.context_description.toLowerCase().includes(q);
                const matchSender = s.sender_name.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchSender) {
                    return false;
                }
            }

            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'latest') {
                return b.id - a.id;
            }
            return a.order - b.order;
        });

    return (
        <AppLayout>
            <Head title="Simulasi Interaktif Rekayasa Sosial - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#FFF8EC] pt-10 pb-2 sm:pt-12 sm:pb-3">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="max-w-3xl">
                        <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl leading-tight font-bold tracking-tight text-[#3B2A1E] sm:text-4xl md:text-[40px]">
                            Belajar melalui Simulasi secara interaktif! 
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-[#6B5646] sm:text-base">
                            Latih kemampuan mengambil keputusan Anda menghadapi
                            skenario penipuan digital nyata di Indonesia. Kenali
                            manipulasi psikologis penipu sebelum Anda menjadi
                            korban berikutnya.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filter & Search Bar */}
            <section className="mx-auto max-w-5xl px-6 pt-6 sm:pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative w-full sm:max-w-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <Search className="size-4 text-[#6B5646]" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari skenario atau kata kunci..."
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

                    {/* Sort */}
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

            {/* Scenario Grid */}
            <section className="mx-auto mb-16 max-w-5xl px-6 py-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredScenarios.map((scenario) => (
                        <Card
                            key={scenario.id}
                            variant="floating"
                            className="flex flex-col justify-between p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-700"
                        >
                            <div>
                                {scenario.has_attempted && (
                                    <div className="mb-3 flex items-center justify-end">
                                        <Badge
                                            variant={
                                                scenario.is_safe
                                                    ? 'safe'
                                                    : 'danger'
                                            }
                                            withDot
                                        >
                                            {scenario.is_safe
                                                ? 'Aman'
                                                : 'Terkecoh'}{' '}
                                            ({scenario.latest_score})
                                        </Badge>
                                    </div>
                                )}

                                <h3 className="text-base font-bold text-[#3B2A1E]">
                                    {scenario.title}
                                </h3>

                                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#6B5646]">
                                    {scenario.context_description}
                                </p>

                                <div className="mt-4 flex items-center gap-2 text-xs text-[#6B5646]">
                                    <span>Pengirim:</span>
                                    <span className="truncate font-semibold text-[#3B2A1E]">
                                        {scenario.sender_name}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <Link
                                    href={
                                        user
                                            ? `/simulasi/${scenario.slug}`
                                            : `/login?redirect=${encodeURIComponent(`/simulasi/${scenario.slug}`)}`
                                    }
                                    className={`group w-full ${buttonClasses(
                                        scenario.has_attempted
                                            ? 'outline'
                                            : 'primary',
                                    )}`}
                                >
                                    <span>
                                        {scenario.has_attempted
                                            ? 'Ulangi Simulasi'
                                            : 'Mulai Latihan'}
                                    </span>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>

                {filteredScenarios.length === 0 && (
                    <Card
                        variant="glass"
                        className="flex flex-col items-center justify-center px-6 py-8 sm:px-8 sm:py-10 text-center"
                    >
                        <img
                            src="/empty_state.png"
                            alt="Belum ada modul simulasi"
                            className="mb-3 w-28 sm:w-32 h-auto object-contain select-none opacity-90"
                        />
                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                            {searchQuery.trim() !== ''
                                ? 'Tidak Ada Skenario Ditemukan'
                                : 'Belum Ada Modul Simulasi'}
                        </h3>
                        <p className="mt-1 max-w-md text-xs leading-relaxed text-[#6B5646]">
                            {searchQuery.trim() !== ''
                                ? 'Tidak ada modul simulasi yang cocok dengan kata kunci pencarian Anda.'
                                : selectedCategory === 'all'
                                ? 'Modul latihan simulasi saat ini sedang disiapkan dan akan ditambahkan langsung oleh administrator.'
                                : 'Tidak ada modul simulasi pada kategori ini. Silakan pilih kategori lain atau periksa kembali nanti.'}
                        </p>
                    </Card>
                )}
            </section>
        </AppLayout>
    );
}
