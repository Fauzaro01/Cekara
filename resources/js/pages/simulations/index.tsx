import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    CheckCircle2,
    CreditCard,
    Gamepad2,
    GraduationCap,
    Landmark,
    Layers,
    Send,
    ShieldAlert,
    Sparkles,
    Users,
} from 'lucide-react';
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

const categoryIcons: Record<string, typeof Layers> = {
    all: Layers,
    apk_malware: ShieldAlert,
    fake_job: Briefcase,
    phishing_banking: Landmark,
    social_engineering: Users,
    loan_scam: CreditCard,
};

const categoryLabels: Record<string, string> = {
    all: 'Semua Kategori',
    apk_malware: 'Malware APK',
    fake_job: 'Lowongan Palsu',
    phishing_banking: 'Phishing Bank',
    social_engineering: 'Rekayasa Sosial',
    loan_scam: 'Pinjol Ilegal',
};

export default function SimulationIndex({ scenarios, userStats }: Props) {
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
        return s.category === selectedCategory;
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

    const getDifficultyBadge = (difficulty: string) => {
        switch (difficulty) {
            case 'mudah':
                return (
                    <Badge variant="safe" withDot>
                        Mudah
                    </Badge>
                );
            case 'sulit':
                return (
                    <Badge variant="danger" withDot>
                        Sulit
                    </Badge>
                );
            default:
                return (
                    <Badge variant="warn" withDot>
                        Sedang
                    </Badge>
                );
        }
    };

    return (
        <AppLayout>
            <Head title="Simulasi Interaktif Rekayasa Sosial - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-b from-slate-50/80 to-white py-12 dark:border-slate-800 dark:from-slate-900/40 dark:to-slate-950">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-2xl">
                            <Badge
                                variant="brand"
                                className="mb-3 px-2.5 py-0.5"
                            >
                                <GraduationCap className="mr-1 size-3" />
                                Pilar Belajar (Learn)
                            </Badge>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                                Simulasi Interaktif Rekayasa Sosial
                            </h1>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                                Latih kemampuan mengambil keputusan Anda
                                menghadapi skenario penipuan digital nyata di
                                Indonesia. Kenali manipulasi psikologis penipu
                                sebelum Anda menjadi korban berikutnya.
                            </p>
                        </div>

                        {/* Guardian Stats Box */}
                        <Card
                            variant="floating"
                            className="flex flex-col gap-3 p-5 sm:min-w-64"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Pangkat Guardian
                                </span>
                                <Badge variant="brand">
                                    <Award className="mr-1 size-3" />
                                    {userStats.guardian_rank}
                                </Badge>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">
                                    Penyelesaian
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {userStats.completed_count} dari{' '}
                                    {userStats.total_scenarios} Skenario
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-brand-500 to-indigo-500 transition-all duration-500"
                                    style={{
                                        width: `${(userStats.completed_count / (userStats.total_scenarios || 1)) * 100}%`,
                                    }}
                                />
                            </div>
                            {userStats.completed_count > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">
                                        Rata-rata Skor
                                    </span>
                                    <span className="flex items-center gap-1 font-semibold text-safe">
                                        <CheckCircle2 className="size-3" />
                                        {userStats.average_score} / 100
                                    </span>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </section>

            {/* Notification / Toast Message */}
            {contributionStatus && (
                <div className="mx-auto max-w-5xl px-6 pt-6">
                    <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/80 p-4 text-sm text-brand-900 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-200">
                        <CheckCircle2 className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{contributionStatus}</span>
                    </div>
                </div>
            )}

            {/* Filter Categories */}
            <section className="mx-auto max-w-5xl px-6 pt-8">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-4 dark:border-slate-800">
                    {Object.entries(categoryLabels).map(
                        ([catKey, catLabel]) => {
                            const IconComponent =
                                categoryIcons[catKey] || Layers;
                            const isSelected = selectedCategory === catKey;
                            return (
                                <button
                                    key={catKey}
                                    type="button"
                                    onClick={() => setSelectedCategory(catKey)}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                                        isSelected
                                            ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <IconComponent className="size-3.5" />
                                    {catLabel}
                                </button>
                            );
                        },
                    )}
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
                                <div className="flex items-center justify-between gap-2">
                                    {getDifficultyBadge(scenario.difficulty)}
                                    {scenario.has_attempted && (
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
                                    )}
                                </div>

                                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
                                    {scenario.title}
                                </h3>

                                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    {scenario.context_description}
                                </p>

                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span>Pengirim:</span>
                                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                                        {scenario.sender_name}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <Link
                                    href={`/simulasi/${scenario.slug}`}
                                    className={`w-full ${buttonClasses(
                                        scenario.has_attempted
                                            ? 'outline'
                                            : 'primary',
                                    )}`}
                                >
                                    <Gamepad2 className="mr-1.5 size-4" />
                                    {scenario.has_attempted
                                        ? 'Ulangi Simulasi'
                                        : 'Mulai Latihan'}
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
                            <div className="flex items-center gap-2">
                                <Badge variant="brand">
                                    <Sparkles className="mr-1 size-3" />
                                    Dataset Loop Komunitas
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Pola Nyata dari Guardian
                                </span>
                            </div>
                            <h2 className="mt-2.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                                Punya Temuan Modus Penipuan Baru?
                            </h2>
                            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
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
                                            <option value="apk_malware">
                                                Malware APK
                                            </option>
                                            <option value="fake_job">
                                                Lowongan Palsu
                                            </option>
                                            <option value="phishing_banking">
                                                Phishing Bank
                                            </option>
                                            <option value="social_engineering">
                                                Rekayasa Sosial
                                            </option>
                                            <option value="loan_scam">
                                                Pinjol Ilegal
                                            </option>
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
