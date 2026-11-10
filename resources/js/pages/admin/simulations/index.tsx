import { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';

interface ChatMessageItem {
    sender: 'scammer' | 'system' | 'user';
    text: string;
    time: string;
    attachment?: {
        type: string;
        name: string;
        size: string;
        icon?: string;
    };
}

interface ScenarioOptionItem {
    id: string;
    text: string;
    is_safe: boolean;
    score: number;
    explanation: string;
}

interface ScenarioItem {
    id: number;
    title: string;
    slug: string;
    category: string;
    difficulty: string;
    context_description: string;
    sender_name: string;
    sender_avatar: string | null;
    chat_messages: ChatMessageItem[];
    options: ScenarioOptionItem[];
    psychological_tricks: string[];
    red_flags: string[];
    prevention_advice: string;
    order: number;
    is_active: boolean;
    attempts_count: number;
    average_score: number | null;
    created_at_human: string;
    created_at_date: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ScenariosPagination {
    data: ScenarioItem[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface AdminSimulationsProps {
    scenarios: ScenariosPagination;
    filters: {
        search: string;
        category: string;
        difficulty: string;
        status: string;
        per_page?: number;
    };
    stats?: {
        total_scenarios: number;
        active_scenarios: number;
        total_attempts: number;
        average_score: number;
    };
    flash?: {
        success?: string;
        error?: string;
        info?: string;
    };
}

const CATEGORY_MAP: Record<string, { label: string; badgeBg: string; text: string }> = {
    apk_malware: { label: 'Malware APK', badgeBg: 'bg-[#FF9A3C]/20 border-[#FF9A3C]', text: 'text-[#B84E00]' },
    phishing_banking: { label: 'Phishing Bank', badgeBg: 'bg-[#8ECDF0]/25 border-[#388EC7]', text: 'text-[#1D608F]' },
    fake_job: { label: 'Lowongan Palsu', badgeBg: 'bg-[#FFE27A]/35 border-[#D4A017]', text: 'text-[#8A6700]' },
    social_engineering: { label: 'Rekayasa Sosial', badgeBg: 'bg-[#A3E635]/25 border-[#65A30D]', text: 'text-[#3F6212]' },
    loan_scam: { label: 'Pinjol Ilegal', badgeBg: 'bg-[#F472B6]/25 border-[#DB2777]', text: 'text-[#9D174D]' },
    fake_giveaway: { label: 'Undian Palsu', badgeBg: 'bg-[#C084FC]/25 border-[#9333EA]', text: 'text-[#6B21A8]' },
};

const DIFFICULTY_MAP: Record<string, { label: string; badgeBg: string; text: string }> = {
    mudah: { label: 'Mudah', badgeBg: 'bg-[#A3E635]/30 border-[#4D7C0F]', text: 'text-[#365314]' },
    sedang: { label: 'Sedang', badgeBg: 'bg-[#FFE27A]/40 border-[#CA8A04]', text: 'text-[#713F12]' },
    sulit: { label: 'Sulit', badgeBg: 'bg-[#FCA5A5]/35 border-[#DC2626]', text: 'text-[#7F1D1D]' },
};

const INITIAL_FORM: {
    title: string;
    slug: string;
    category: string;
    difficulty: string;
    context_description: string;
    sender_name: string;
    sender_avatar: string;
    chat_messages: ChatMessageItem[];
    options: ScenarioOptionItem[];
    psychological_tricks: string[];
    red_flags: string[];
    prevention_advice: string;
    order: number;
    is_active: boolean;
} = {
    title: '',
    slug: '',
    category: 'apk_malware',
    difficulty: 'sedang',
    context_description: '',
    sender_name: '',
    sender_avatar: 'mail',
    chat_messages: [
        {
            sender: 'scammer',
            text: 'Halo Kak, ada dokumen penting yang perlu Kakak konfirmasi segera.',
            time: '10:15',
        },
    ],
    options: [
        {
            id: 'A',
            text: 'Langsung klik atau unduh file lampiran tersebut.',
            is_safe: false,
            score: 0,
            explanation: 'Sangat berbahaya! Mengunduh berkas asing tanpa verifikasi berisiko pencurian data atau malware.',
        },
        {
            id: 'B',
            text: 'Abaikan pesan dan verifikasi ke kanal resmi.',
            is_safe: true,
            score: 100,
            explanation: 'Keputusan tepat! Jangan pernah membuka berkas mencurigakan dari nomor tak dikenal.',
        },
    ],
    psychological_tricks: ['Rasa Penasaran & Kepanikan'],
    red_flags: ['Nomor kontak tidak dikenal', 'Ekstensi file mencurigakan (.apk/.exe)'],
    prevention_advice: 'Selalu verifikasi informasi ke kontak resmi sebelum merespons pesan asing.',
    order: 0,
    is_active: true,
};

export default function AdminSimulationsIndex({ scenarios, filters, stats, flash }: AdminSimulationsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [difficultyFilter, setDifficultyFilter] = useState(filters.difficulty || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [perPage, setPerPage] = useState<number>(filters.per_page || 10);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'chat' | 'options' | 'education'>('basic');
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation state
    const [scenarioToDelete, setScenarioToDelete] = useState<ScenarioItem | null>(null);

    // Temporary inputs for array items
    const [newTrickText, setNewTrickText] = useState('');
    const [newRedFlagText, setNewRedFlagText] = useState('');

    const isFirstRender = useRef(true);

    const applyFilters = (overrides?: Partial<typeof filters>) => {
        const nextFilters = {
            search,
            category: categoryFilter,
            difficulty: difficultyFilter,
            status: statusFilter,
            per_page: perPage,
            ...overrides,
        };

        const params: Record<string, string | number> = {};
        if (nextFilters.search) params.search = nextFilters.search;
        if (nextFilters.category && nextFilters.category !== 'all') params.category = nextFilters.category;
        if (nextFilters.difficulty && nextFilters.difficulty !== 'all') params.difficulty = nextFilters.difficulty;
        if (nextFilters.status && nextFilters.status !== 'all') params.status = nextFilters.status;
        if (nextFilters.per_page && nextFilters.per_page !== 10) params.per_page = nextFilters.per_page;

        router.get('/admin/simulasi', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Auto-filter on search input with debounce
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            applyFilters({ search });
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleResetFilters = () => {
        setSearch('');
        setCategoryFilter('all');
        setDifficultyFilter('all');
        setStatusFilter('all');
        setPerPage(10);
        router.get('/admin/simulasi', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openCreateModal = () => {
        setEditingScenarioId(null);
        setFormData({
            ...INITIAL_FORM,
            order: (scenarios.total || 0) + 1,
        });
        setFormErrors({});
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const openEditModal = (scenario: ScenarioItem) => {
        setEditingScenarioId(scenario.id);
        setFormData({
            title: scenario.title,
            slug: scenario.slug,
            category: scenario.category,
            difficulty: scenario.difficulty,
            context_description: scenario.context_description,
            sender_name: scenario.sender_name,
            sender_avatar: scenario.sender_avatar || 'mail',
            chat_messages: scenario.chat_messages && scenario.chat_messages.length > 0 ? scenario.chat_messages : INITIAL_FORM.chat_messages,
            options: scenario.options && scenario.options.length > 0 ? scenario.options : INITIAL_FORM.options,
            psychological_tricks: scenario.psychological_tricks || [],
            red_flags: scenario.red_flags || [],
            prevention_advice: scenario.prevention_advice || '',
            order: scenario.order ?? 0,
            is_active: scenario.is_active,
        });
        setFormErrors({});
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const handleToggleActive = (scenario: ScenarioItem) => {
        router.patch(`/admin/simulasi/${scenario.id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const handleDeleteScenario = () => {
        if (!scenarioToDelete) return;
        router.delete(`/admin/simulasi/${scenarioToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setScenarioToDelete(null);
            },
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        // Client-side quick checks
        if (!formData.title.trim()) {
            setFormErrors({ title: 'Judul modul simulasi wajib diisi.' });
            setActiveTab('basic');
            setIsSubmitting(false);
            return;
        }

        if (formData.chat_messages.length === 0) {
            setFormErrors({ chat_messages: 'Minimal sertakan 1 pesan chat simulasi.' });
            setActiveTab('chat');
            setIsSubmitting(false);
            return;
        }

        if (formData.options.length < 2) {
            setFormErrors({ options: 'Minimal harus ada 2 opsi pilihan keputusan.' });
            setActiveTab('options');
            setIsSubmitting(false);
            return;
        }

        if (editingScenarioId) {
            router.put(`/admin/simulasi/${editingScenarioId}`, formData as any, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setFormErrors(errors);
                    setIsSubmitting(false);
                },
            });
        } else {
            router.post('/admin/simulasi', formData as any, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setFormErrors(errors);
                    setIsSubmitting(false);
                },
            });
        }
    };

    // Chat Message helpers
    const addChatMessage = () => {
        setFormData({
            ...formData,
            chat_messages: [
                ...formData.chat_messages,
                {
                    sender: 'scammer',
                    text: '',
                    time: '10:16',
                },
            ],
        });
    };

    const updateChatMessage = (index: number, updated: Partial<ChatMessageItem>) => {
        const next = [...formData.chat_messages];
        next[index] = { ...next[index], ...updated };
        setFormData({ ...formData, chat_messages: next });
    };

    const removeChatMessage = (index: number) => {
        if (formData.chat_messages.length <= 1) return;
        setFormData({
            ...formData,
            chat_messages: formData.chat_messages.filter((_, i) => i !== index),
        });
    };

    // Options helpers
    const addOption = () => {
        const optionLetters = ['A', 'B', 'C', 'D', 'E'];
        const nextId = optionLetters[formData.options.length] || `Opt${formData.options.length + 1}`;
        setFormData({
            ...formData,
            options: [
                ...formData.options,
                {
                    id: nextId,
                    text: '',
                    is_safe: false,
                    score: 0,
                    explanation: '',
                },
            ],
        });
    };

    const updateOption = (index: number, updated: Partial<ScenarioOptionItem>) => {
        const next = [...formData.options];
        next[index] = { ...next[index], ...updated };
        setFormData({ ...formData, options: next });
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 2) return;
        setFormData({
            ...formData,
            options: formData.options.filter((_, i) => i !== index),
        });
    };

    // Array string helpers
    const addTrick = () => {
        if (!newTrickText.trim()) return;
        setFormData({
            ...formData,
            psychological_tricks: [...formData.psychological_tricks, newTrickText.trim()],
        });
        setNewTrickText('');
    };

    const removeTrick = (index: number) => {
        setFormData({
            ...formData,
            psychological_tricks: formData.psychological_tricks.filter((_, i) => i !== index),
        });
    };

    const addRedFlag = () => {
        if (!newRedFlagText.trim()) return;
        setFormData({
            ...formData,
            red_flags: [...formData.red_flags, newRedFlagText.trim()],
        });
        setNewRedFlagText('');
    };

    const removeRedFlag = (index: number) => {
        setFormData({
            ...formData,
            red_flags: formData.red_flags.filter((_, i) => i !== index),
        });
    };

    return (
        <AppLayout>
            <Head title="Kelola Modul Simulasi - Admin Cekara" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
                {/* Notification Banner */}
                {flash?.success && (
                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] p-4 font-bold text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E]">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FCA5A5] p-4 font-bold text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E]">
                        {flash.error}
                    </div>
                )}

                {/* Header & Quick Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="font-['Fredoka',system-ui,sans-serif] text-2xl sm:text-3xl font-bold text-[#3B2A1E]">
                            Kelola Modul Simulasi
                        </h1>
                        <p className="text-xs sm:text-sm font-semibold text-[#6B5646]">
                            Buat, perbarui, dan atur modul skenario penipuan interaktif untuk melatih kepekaan masyarakat.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className={buttonClasses('primary', 'md')}
                        >
                            <span>+ Tambah Modul Baru</span>
                        </button>
                    </div>
                </div>


                {/* Filter and Control Bar */}
                <div className="rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#3B2A1E] space-y-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
                        {/* Search input with magnifying glass icon */}
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#6B5646]" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari judul modul, nama pengirim, atau konteks penipuan..."
                                className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white pl-10 pr-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                            />
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Category Filter */}
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    applyFilters({ category: e.target.value });
                                }}
                                className="h-11 rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none cursor-pointer"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="apk_malware">Malware APK</option>
                                <option value="phishing_banking">Phishing Bank</option>
                                <option value="fake_job">Lowongan Palsu</option>
                                <option value="social_engineering">Rekayasa Sosial</option>
                                <option value="loan_scam">Pinjol Ilegal</option>
                                <option value="fake_giveaway">Undian Palsu</option>
                            </select>

                            {/* Difficulty Filter */}
                            <select
                                value={difficultyFilter}
                                onChange={(e) => {
                                    setDifficultyFilter(e.target.value);
                                    applyFilters({ difficulty: e.target.value });
                                }}
                                className="h-11 rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none cursor-pointer"
                            >
                                <option value="all">Semua Tingkat</option>
                                <option value="mudah">Mudah</option>
                                <option value="sedang">Sedang</option>
                                <option value="sulit">Sulit</option>
                            </select>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="h-11 rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none cursor-pointer"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>

                            {/* Per page */}
                            <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 h-11 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                <span className="text-xs font-bold text-[#6B5646]">Baris:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setPerPage(val);
                                        applyFilters({ per_page: val });
                                    }}
                                    className="bg-transparent text-xs font-bold text-[#3B2A1E] focus:outline-none cursor-pointer"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            {/* Reset Button */}
                            {(search || categoryFilter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all' || perPage !== 10) && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="h-11 rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-bold text-[#B84E00] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] hover:text-[#3B2A1E] transition cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Scenario List */}
                <div className="space-y-4">
                    {scenarios.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-3 border-dashed border-[#3B2A1E]/30 bg-white p-12 text-center shadow-[4px_4px_0px_0px_#3B2A1E]">
                            <p className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                Belum Ada Modul Skenario Simulasi
                            </p>
                            <p className="mt-1.5 max-w-md text-xs sm:text-sm font-semibold text-[#6B5646]">
                                Data skenario dummy telah dibersihkan. Anda dapat menambahkan modul skenario baru yang ingin dicoba oleh masyarakat.
                            </p>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className={`${buttonClasses('primary', 'md')} mt-5`}
                            >
                                <span>+ Buat Modul Simulasi Pertama</span>
                            </button>
                        </div>
                    ) : (
                        scenarios.data.map((scenario) => {
                            const cat = CATEGORY_MAP[scenario.category] || {
                                label: scenario.category,
                                badgeBg: 'bg-stone-100 border-stone-400',
                                text: 'text-stone-700',
                            };
                            return (
                                <div
                                    key={scenario.id}
                                    className="flex flex-col gap-4 rounded-3xl border-3 border-[#3B2A1E] bg-white p-5 sm:p-6 shadow-[5px_5px_0px_0px_#3B2A1E] transition hover:translate-y-[-1px]"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`rounded-lg border-2 px-2.5 py-0.5 text-xs font-bold ${cat.badgeBg} ${cat.text}`}
                                                >
                                                    {cat.label}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(scenario)}
                                                    className={`rounded-lg border-2 px-2.5 py-0.5 text-xs font-bold transition cursor-pointer ${
                                                        scenario.is_active
                                                            ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]'
                                                            : 'border-[#757575] bg-[#EEEEEE] text-[#616161] hover:bg-[#E0E0E0]'
                                                    }`}
                                                    title="Klik untuk mengubah status aktif"
                                                >
                                                    {scenario.is_active ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                            </div>

                                            <h2 className="font-['Fredoka',system-ui,sans-serif] text-lg sm:text-xl font-bold text-[#3B2A1E]">
                                                {scenario.title}
                                            </h2>

                                            <p className="text-xs sm:text-sm font-semibold text-[#6B5646] line-clamp-2">
                                                {scenario.context_description}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[#6B5646]">
                                                <span>Pengirim: <strong className="text-[#3B2A1E]">{scenario.sender_name}</strong></span>
                                                <span>•</span>
                                                <span>{scenario.chat_messages?.length || 0} Percakapan Chat</span>
                                                <span>•</span>
                                                <span>{scenario.options?.length || 0} Opsi Keputusan</span>
                                                <span>•</span>
                                                <span>Dicoba: <strong className="text-[#E06812]">{scenario.attempts_count}x</strong></span>
                                                {scenario.average_score !== null && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Rata-rata Skor: <strong className="text-[#1D608F]">{scenario.average_score}%</strong></span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                                            <Link
                                                href={`/simulasi/${scenario.slug}`}
                                                className="rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-3.5 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFD747] transition"
                                            >
                                                Uji Coba
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(scenario)}
                                                className="rounded-xl border-2 border-[#3B2A1E] bg-white px-3.5 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-stone-50 transition cursor-pointer"
                                            >
                                                Edit Modul
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setScenarioToDelete(scenario)}
                                                className="rounded-xl border-2 border-[#3B2A1E] bg-[#FCA5A5]/40 px-3.5 py-1.5 text-xs font-bold text-[#B91C1C] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FCA5A5] transition cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Numbered Pagination (Strictly avoiding icons) */}
                {scenarios.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] p-4 shadow-[4px_4px_0px_0px_#3B2A1E]">
                        <span className="text-xs sm:text-sm font-bold text-[#6B5646]">
                            Menampilkan {scenarios.from ?? 0} - {scenarios.to ?? 0} dari {scenarios.total} modul
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Previous Button */}
                            {scenarios.current_page > 1 ? (
                                <Link
                                    href={`/admin/simulasi?page=${scenarios.current_page - 1}&search=${encodeURIComponent(search)}&category=${categoryFilter}&difficulty=${difficultyFilter}&status=${statusFilter}&per_page=${perPage}`}
                                    preserveScroll
                                    className="rounded-xl border-2 border-[#3B2A1E] bg-white px-3 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                                >
                                    Sebelumnya
                                </Link>
                            ) : (
                                <span className="rounded-xl border-2 border-[#3B2A1E]/30 bg-stone-100 px-3 py-1.5 text-xs font-bold text-[#3B2A1E]/40 cursor-not-allowed">
                                    Sebelumnya
                                </span>
                            )}

                            {/* Numbered Buttons */}
                            {Array.from({ length: scenarios.last_page }, (_, i) => i + 1)
                                .filter((page) => {
                                    // Show first, last, and window around current
                                    return (
                                        page === 1 ||
                                        page === scenarios.last_page ||
                                        Math.abs(page - scenarios.current_page) <= 2
                                    );
                                })
                                .map((page, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    const hasGap = prev && page - prev > 1;

                                    return (
                                        <div key={page} className="flex items-center gap-1.5">
                                            {hasGap && (
                                                <span className="px-1 text-xs font-bold text-[#6B5646]">
                                                    ...
                                                </span>
                                            )}
                                            <Link
                                                href={`/admin/simulasi?page=${page}&search=${encodeURIComponent(search)}&category=${categoryFilter}&difficulty=${difficultyFilter}&status=${statusFilter}&per_page=${perPage}`}
                                                preserveScroll
                                                className={`size-8 flex items-center justify-center rounded-xl border-2 border-[#3B2A1E] text-xs font-bold transition shadow-[1.5px_1.5px_0px_0px_#3B2A1E] ${
                                                    page === scenarios.current_page
                                                        ? 'bg-[#FFE27A] text-[#3B2A1E]'
                                                        : 'bg-white text-[#3B2A1E] hover:bg-[#FFE27A]/50'
                                                }`}
                                            >
                                                {page}
                                            </Link>
                                        </div>
                                    );
                                })}

                            {/* Next Button */}
                            {scenarios.current_page < scenarios.last_page ? (
                                <Link
                                    href={`/admin/simulasi?page=${scenarios.current_page + 1}&search=${encodeURIComponent(search)}&category=${categoryFilter}&difficulty=${difficultyFilter}&status=${statusFilter}&per_page=${perPage}`}
                                    preserveScroll
                                    className="rounded-xl border-2 border-[#3B2A1E] bg-white px-3 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                                >
                                    Berikutnya
                                </Link>
                            ) : (
                                <span className="rounded-xl border-2 border-[#3B2A1E]/30 bg-stone-100 px-3 py-1.5 text-xs font-bold text-[#3B2A1E]/40 cursor-not-allowed">
                                    Berikutnya
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Scenario Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="relative z-10 flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[8px_8px_0px_0px_#3B2A1E]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <div>
                                <h2 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                    {editingScenarioId ? 'Edit Modul Simulasi' : 'Tambah Modul Simulasi Baru'}
                                </h2>
                                <p className="text-xs font-semibold text-[#6B5646]">
                                    Lengkapi informasi skenario, alur chat percakapan, dan pilihan opsi jawaban edukatif.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="size-9 rounded-xl border-2 border-[#3B2A1E] bg-white text-xs font-black text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition cursor-pointer"
                            >
                                X
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b-2 border-[#EFE3D0] bg-[#FFE27A]/30 px-6 pt-3 gap-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('basic')}
                                className={`rounded-t-xl border-2 border-b-0 border-[#3B2A1E] px-4 py-2 text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'basic'
                                        ? 'bg-white text-[#3B2A1E]'
                                        : 'bg-[#FFE27A]/50 text-[#6B5646] hover:bg-white/70'
                                }`}
                            >
                                1. Informasi Dasar
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('chat')}
                                className={`rounded-t-xl border-2 border-b-0 border-[#3B2A1E] px-4 py-2 text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'chat'
                                        ? 'bg-white text-[#3B2A1E]'
                                        : 'bg-[#FFE27A]/50 text-[#6B5646] hover:bg-white/70'
                                }`}
                            >
                                2. Percakapan Chat ({formData.chat_messages.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('options')}
                                className={`rounded-t-xl border-2 border-b-0 border-[#3B2A1E] px-4 py-2 text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'options'
                                        ? 'bg-white text-[#3B2A1E]'
                                        : 'bg-[#FFE27A]/50 text-[#6B5646] hover:bg-white/70'
                                }`}
                            >
                                3. Opsi Keputusan ({formData.options.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('education')}
                                className={`rounded-t-xl border-2 border-b-0 border-[#3B2A1E] px-4 py-2 text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'education'
                                        ? 'bg-white text-[#3B2A1E]'
                                        : 'bg-[#FFE27A]/50 text-[#6B5646] hover:bg-white/70'
                                }`}
                            >
                                4. Edukasi & Ciri Bahaya
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Errors banner */}
                            {Object.keys(formErrors).length > 0 && (
                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FCA5A5] p-3.5 text-xs font-bold text-[#3B2A1E] space-y-1">
                                    <p className="font-extrabold">Mohon perbaiki isian form berikut:</p>
                                    <ul className="list-disc pl-5 font-semibold">
                                        {Object.entries(formErrors).map(([key, msg]) => (
                                            <li key={key}>{msg}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* TAB 1: INFORMASI DASAR */}
                            {activeTab === 'basic' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                            Judul Skenario Modul *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Contoh: Surat Undangan Pernikahan Digital (.APK)"
                                            className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                                Kategori Kejahatan *
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                            >
                                                <option value="apk_malware">Malware APK</option>
                                                <option value="phishing_banking">Phishing Bank</option>
                                                <option value="fake_job">Lowongan Palsu</option>
                                                <option value="social_engineering">Rekayasa Sosial</option>
                                                <option value="loan_scam">Pinjol Ilegal</option>
                                                <option value="fake_giveaway">Undian Palsu</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                                Tingkat Kesulitan *
                                            </label>
                                            <select
                                                value={formData.difficulty}
                                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                                className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                            >
                                                <option value="mudah">Mudah</option>
                                                <option value="sedang">Sedang</option>
                                                <option value="sulit">Sulit</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                                Nama Kontak / Pengirim Pesan *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.sender_name}
                                                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                                                placeholder="Contoh: 0821-4471-XXXX (Kontak Tak Dikenal)"
                                                className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                                Urutan Tampilan
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                                className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                            Deskripsi Konteks / Skenario Awal *
                                        </label>
                                        <textarea
                                            required
                                            rows={3}
                                            value={formData.context_description}
                                            onChange={(e) => setFormData({ ...formData, context_description: e.target.value })}
                                            placeholder="Jelaskan situasi ketika pengguna pertama kali menerima pesan ini..."
                                            className="w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="size-4.5 rounded border-2 border-[#3B2A1E] text-[#FF9A3C] focus:ring-0"
                                            />
                                            <span className="text-xs sm:text-sm font-bold text-[#3B2A1E]">
                                                Publikasikan & Aktifkan Modul Ini
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PERCAKAPAN CHAT */}
                            {activeTab === 'chat' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-[#6B5646]">
                                            Daftar Balon Percakapan yang Ditampilkan ke Pengguna
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addChatMessage}
                                            className="rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-3 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFD747] transition cursor-pointer"
                                        >
                                            + Tambah Pesan Chat
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.chat_messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E] space-y-3"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="rounded-lg border border-[#3B2A1E] bg-[#FFE27A] px-2 py-0.5 text-xs font-black text-[#3B2A1E]">
                                                        Pesan #{idx + 1}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={msg.sender}
                                                            onChange={(e) => updateChatMessage(idx, { sender: e.target.value as any })}
                                                            className="rounded-lg border-2 border-[#3B2A1E] bg-stone-50 px-2 py-1 text-xs font-bold text-[#3B2A1E]"
                                                        >
                                                            <option value="scammer">Pengirim / Penipu</option>
                                                            <option value="user">Pengguna</option>
                                                            <option value="system">Pesan Sistem</option>
                                                        </select>

                                                        <input
                                                            type="text"
                                                            value={msg.time}
                                                            onChange={(e) => updateChatMessage(idx, { time: e.target.value })}
                                                            placeholder="Jam (10:14)"
                                                            className="w-20 rounded-lg border-2 border-[#3B2A1E] px-2 py-1 text-xs font-semibold text-[#3B2A1E]"
                                                        />

                                                        {formData.chat_messages.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeChatMessage(idx)}
                                                                className="rounded-lg border border-[#B91C1C] bg-[#FCA5A5]/30 px-2 py-1 text-xs font-bold text-[#B91C1C] hover:bg-[#FCA5A5]"
                                                            >
                                                                Hapus
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <textarea
                                                        rows={2}
                                                        required
                                                        value={msg.text}
                                                        onChange={(e) => updateChatMessage(idx, { text: e.target.value })}
                                                        placeholder="Tuliskan isi pesan percakapan di sini..."
                                                        className="w-full rounded-xl border border-[#3B2A1E] p-2.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] focus:outline-none"
                                                    />
                                                </div>

                                                {/* Optional Attachment */}
                                                <div className="rounded-xl border border-dashed border-[#3B2A1E]/40 bg-[#FFF8EC] p-3 text-xs space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-[#3B2A1E]">Lampiran Berkas (Opsional)</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (msg.attachment) {
                                                                    updateChatMessage(idx, { attachment: undefined });
                                                                } else {
                                                                    updateChatMessage(idx, {
                                                                        attachment: {
                                                                            type: 'file',
                                                                            name: 'Surat_Undangan.apk',
                                                                            size: '6.4 MB',
                                                                            icon: 'document',
                                                                        },
                                                                    });
                                                                }
                                                            }}
                                                            className="text-xs font-bold text-[#B84E00] hover:underline"
                                                        >
                                                            {msg.attachment ? 'Hapus Lampiran' : '+ Tambah Lampiran File'}
                                                        </button>
                                                    </div>

                                                    {msg.attachment && (
                                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                                            <input
                                                                type="text"
                                                                value={msg.attachment.name}
                                                                onChange={(e) =>
                                                                    updateChatMessage(idx, {
                                                                        attachment: {
                                                                            ...msg.attachment!,
                                                                            name: e.target.value,
                                                                        },
                                                                    })
                                                                }
                                                                placeholder="Nama file (contoh: Surat_Undangan.apk)"
                                                                className="rounded-lg border border-[#3B2A1E] bg-white px-2 py-1 text-xs font-semibold"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={msg.attachment.size}
                                                                onChange={(e) =>
                                                                    updateChatMessage(idx, {
                                                                        attachment: {
                                                                            ...msg.attachment!,
                                                                            size: e.target.value,
                                                                        },
                                                                    })
                                                                }
                                                                placeholder="Ukuran file (contoh: 6.4 MB)"
                                                                className="rounded-lg border border-[#3B2A1E] bg-white px-2 py-1 text-xs font-semibold"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: OPSI KEPUTUSAN */}
                            {activeTab === 'options' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-[#6B5646]">
                                            Tentukan pilihan tindakan yang harus diputuskan oleh pengguna
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-3 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFD747] transition cursor-pointer"
                                        >
                                            + Tambah Opsi Jawaban
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.options.map((opt, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E] space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="rounded-lg border border-[#3B2A1E] bg-[#FFE27A] px-2.5 py-0.5 text-xs font-black text-[#3B2A1E]">
                                                        Pilihan {opt.id}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={opt.is_safe ? 'aman' : 'bahaya'}
                                                            onChange={(e) => {
                                                                const isSafe = e.target.value === 'aman';
                                                                updateOption(idx, {
                                                                    is_safe: isSafe,
                                                                    score: isSafe ? 100 : 0,
                                                                });
                                                            }}
                                                            className={`rounded-lg border-2 border-[#3B2A1E] px-2.5 py-1 text-xs font-bold ${
                                                                opt.is_safe
                                                                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                                                    : 'bg-[#FFEBEE] text-[#C62828]'
                                                            }`}
                                                        >
                                                            <option value="aman">Tindakan Aman (Benar)</option>
                                                            <option value="bahaya">Tindakan Berisiko / Terjebak</option>
                                                        </select>

                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-bold text-[#6B5646]">Skor:</span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                value={opt.score}
                                                                onChange={(e) => updateOption(idx, { score: Number(e.target.value) })}
                                                                className="w-16 rounded-lg border-2 border-[#3B2A1E] px-2 py-1 text-xs font-bold text-center"
                                                            />
                                                        </div>

                                                        {formData.options.length > 2 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeOption(idx)}
                                                                className="rounded-lg border border-[#B91C1C] bg-[#FCA5A5]/30 px-2 py-1 text-xs font-bold text-[#B91C1C] hover:bg-[#FCA5A5]"
                                                            >
                                                                Hapus
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                                        Teks Pilihan Jawaban *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={opt.text}
                                                        onChange={(e) => updateOption(idx, { text: e.target.value })}
                                                        placeholder="Contoh: Abaikan pesan dan blokir nomor..."
                                                        className="h-10 w-full rounded-xl border border-[#3B2A1E] px-3 text-xs sm:text-sm font-semibold text-[#3B2A1E]"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                                        Penjelasan Konsekuensi & Edukasi *
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        required
                                                        value={opt.explanation}
                                                        onChange={(e) => updateOption(idx, { explanation: e.target.value })}
                                                        placeholder="Jelaskan mengapa pilihan ini aman atau berbahaya secara spesifik..."
                                                        className="w-full rounded-xl border border-[#3B2A1E] p-2.5 text-xs font-semibold text-[#3B2A1E]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: EDUKASI & CIRI BAHAYA */}
                            {activeTab === 'education' && (
                                <div className="space-y-5">
                                    {/* Red flags */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-[#3B2A1E]">
                                            Ciri-Ciri Bahaya (Red Flags)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newRedFlagText}
                                                onChange={(e) => setNewRedFlagText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addRedFlag();
                                                    }
                                                }}
                                                placeholder="Contoh: Nomor kontak tidak terdaftar di buku telepon"
                                                className="h-10 flex-1 rounded-xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-semibold"
                                            />
                                            <button
                                                type="button"
                                                onClick={addRedFlag}
                                                className="rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-3.5 text-xs font-bold text-[#3B2A1E]"
                                            >
                                                Tambah
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {formData.red_flags.map((flag, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-3 py-1 text-xs font-bold text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]"
                                                >
                                                    <span>{flag}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRedFlag(idx)}
                                                        className="text-[#B91C1C] hover:font-black ml-1 cursor-pointer"
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Psychological tricks */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-[#3B2A1E]">
                                            Trik Psikologis Pelaku
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTrickText}
                                                onChange={(e) => setNewTrickText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addTrick();
                                                    }
                                                }}
                                                placeholder="Contoh: Memanfaatkan rasa panik dan mendesak korban"
                                                className="h-10 flex-1 rounded-xl border-2 border-[#3B2A1E] bg-white px-3 text-xs font-semibold"
                                            />
                                            <button
                                                type="button"
                                                onClick={addTrick}
                                                className="rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-3.5 text-xs font-bold text-[#3B2A1E]"
                                            >
                                                Tambah
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {formData.psychological_tricks.map((trick, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-3 py-1 text-xs font-bold text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]"
                                                >
                                                    <span>{trick}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTrick(idx)}
                                                        className="text-[#B91C1C] hover:font-black ml-1 cursor-pointer"
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prevention advice */}
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-[#3B2A1E]">
                                            Saran Pencegahan Praktis *
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            value={formData.prevention_advice}
                                            onChange={(e) => setFormData({ ...formData, prevention_advice: e.target.value })}
                                            placeholder="Saran konkret apa yang harus dilakukan masyarakat agar terhindar dari modus ini..."
                                            className="w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Controls */}
                            <div className="flex items-center justify-between border-t-2 border-[#EFE3D0] pt-4 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </Button>

                                <div className="flex items-center gap-2">
                                    {activeTab !== 'education' ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (activeTab === 'basic') setActiveTab('chat');
                                                else if (activeTab === 'chat') setActiveTab('options');
                                                else if (activeTab === 'options') setActiveTab('education');
                                            }}
                                            className="group inline-flex items-center gap-1.5 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFD747] transition"
                                        >
                                            <span>Lanjut Tab Berikutnya</span>
                                            {/* Google Material Symbols: arrow_forward */}
                                            <svg
                                                viewBox="0 0 24 24"
                                                className="size-4 shrink-0 fill-current transition-transform duration-150 group-hover:translate-x-1"
                                                aria-hidden="true"
                                            >
                                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="md"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Menyimpan...' : editingScenarioId ? 'Perbarui Modul' : 'Simpan Modul'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {scenarioToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="relative z-10 w-full max-w-md rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] p-6 shadow-[6px_6px_0px_0px_#3B2A1E] space-y-4">
                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                            Hapus Modul Simulasi?
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-[#6B5646]">
                            Apakah Anda yakin ingin menghapus modul <strong className="text-[#3B2A1E]">"{scenarioToDelete.title}"</strong>? Seluruh data percobaan pengguna untuk skenario ini juga akan ikut terhapus secara permanen.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="md"
                                onClick={() => setScenarioToDelete(null)}
                            >
                                Batal
                            </Button>
                            <button
                                type="button"
                                onClick={handleDeleteScenario}
                                className="rounded-2xl border-2 border-[#3B2A1E] bg-[#DC2626] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#B91C1C] transition cursor-pointer"
                            >
                                Ya, Hapus Modul
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
