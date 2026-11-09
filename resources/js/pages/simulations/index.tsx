import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    const [isSubmittingContribution, setIsSubmittingContribution] =
        useState(false);
    const [contributionStatus, setContributionStatus] = useState<string | null>(
        null,
    );
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formTitle, setFormTitle] = useState('');
    const [formCategory, setFormCategory] = useState('apk_malware');
    const [formPlatform, setFormPlatform] = useState('WhatsApp');
    const [formDescription, setFormDescription] = useState('');
    const [formEvidence, setFormEvidence] = useState('');

    const filteredScenarios = scenarios.filter((s) => {
        if (selectedCategory === 'all') {
            return true;
        }
        if (s.category === selectedCategory) {
            return true;
        }
        if (selectedCategory === 'social_engineering') {
            return [
                'social_engineering',
                'ai_deepfake',
                'qris_fraud',
                'loan_scam',
            ].includes(s.category);
        }
        return false;
    });

    const getXsrfToken = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleContributionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingContribution(true);
        setContributionStatus(null);

        try {
            const res = await fetch('/simulasi/kontribusi', {
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
                    description: formDescription,
                    evidence_text: formEvidence,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setContributionStatus(
                    data.message ||
                        'Pola penipuan baru berhasil dikirim untuk dataset pelatihan.',
                );
                setFormTitle('');
                setFormDescription('');
                setFormEvidence('');
                setIsFormOpen(false);
            } else {
                setContributionStatus(
                    data.message ||
                        'Gagal mengirim pola. Periksa kembali isian formulir.',
                );
            }
        } catch {
            setContributionStatus(
                'Terjadi kesalahan jaringan saat mengirim laporan.',
            );
        } finally {
            setIsSubmittingContribution(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Simulasi Interaktif Rekayasa Sosial - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#FFF8EC] pt-10 pb-2 sm:pt-12 sm:pb-3">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="max-w-3xl">
                        <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl leading-tight font-bold tracking-tight text-[#3B2A1E] sm:text-4xl md:text-[40px]">
                            Simulasi Interaktif Rekayasa Sosial
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

            {/* Notification / Toast Message */}
            {contributionStatus && (
                <div className="mx-auto max-w-5xl px-6 pt-4">
                    <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/80 p-4 text-sm text-brand-900 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-200">
                        <CheckCircle2 className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{contributionStatus}</span>
                    </div>
                </div>
            )}

            {/* Filter Categories */}
            <section className="mx-auto max-w-5xl px-6 pt-4 sm:pt-6">
                <div className="flex flex-wrap gap-2 border-b-2 border-[#EFE3D0] pb-4">
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
            <section className="mx-auto max-w-5xl px-6 py-8">
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
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>

                {filteredScenarios.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200/80 py-12 text-center text-sm text-slate-500 dark:border-slate-800">
                        Tidak ada skenario yang sesuai dengan kategori ini.
                    </div>
                )}
            </section>

            {/* Feedback Loop to Dataset Section */}
            <section className="mx-auto mb-16 max-w-5xl px-6">
                <Card
                    variant="glass"
                    className="border-brand-200/80 bg-brand-50/30 p-6 sm:p-8 dark:border-brand-900/50 dark:bg-brand-950/20"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] sm:text-2xl">
                                Punya Temuan Modus Penipuan Baru?
                            </h2>
                            <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#6B5646] sm:text-sm">
                                Bantu lindungi sesama anak muda Indonesia.
                                Sumbangan contoh pesan mencurigakan yang Anda
                                temukan akan dikurasi sebagai dataset untuk
                                melatih sistem deteksi AI Cekara.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className={buttonClasses('outline')}
                        >
                            {isFormOpen ? 'Tutup Formulir' : 'Sumbang Kasus'}
                        </button>
                    </div>

                    {isFormOpen && (
                        <form
                            onSubmit={handleContributionSubmit}
                            className="mt-6 space-y-4 border-t border-brand-100 pt-6 dark:border-brand-900/50"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Judul / Nama Modus
                                    </label>
                                    <Input
                                        type="text"
                                        required
                                        value={formTitle}
                                        onChange={(e) =>
                                            setFormTitle(e.target.value)
                                        }
                                        placeholder="cth: Undangan Pernikahan APK via WA"
                                        className="mt-1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Kategori
                                        </label>
                                        <select
                                            value={formCategory}
                                            onChange={(e) =>
                                                setFormCategory(e.target.value)
                                            }
                                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            {categories
                                                .filter((c) => c.key !== 'all')
                                                .map((c) => (
                                                    <option
                                                        key={c.key}
                                                        value={c.key}
                                                    >
                                                        {c.label}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Platform
                                        </label>
                                        <select
                                            value={formPlatform}
                                            onChange={(e) =>
                                                setFormPlatform(e.target.value)
                                            }
                                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <option value="WhatsApp">
                                                WhatsApp
                                            </option>
                                            <option value="Telegram">
                                                Telegram
                                            </option>
                                            <option value="SMS">SMS</option>
                                            <option value="Instagram">
                                                Instagram
                                            </option>
                                            <option value="Lainnya">
                                                Lainnya
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Deskripsi Modus / Narasi Manipulasi
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formDescription}
                                    onChange={(e) =>
                                        setFormDescription(e.target.value)
                                    }
                                    placeholder="Jelaskan bagaimana penipu menghubungi dan alasan manipulasi yang digunakan..."
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Bukti Teks / Transkrip Percakapan (Hapus
                                    data pribadi rahasia)
                                </label>
                                <textarea
                                    rows={3}
                                    value={formEvidence}
                                    onChange={(e) =>
                                        setFormEvidence(e.target.value)
                                    }
                                    placeholder="Salin teks pesan mencurigakan atau nama file APK di sini..."
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className={buttonClasses('ghost')}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingContribution}
                                    className={buttonClasses('primary')}
                                >
                                    <Send className="mr-1.5 size-3.5" />
                                    {isSubmittingContribution
                                        ? 'Mengirim Pola...'
                                        : 'Kirim Pola Penipuan'}
                                </button>
                            </div>
                        </form>
                    )}
                </Card>
            </section>
        </AppLayout>
    );
}
