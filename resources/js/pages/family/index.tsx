import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    BookOpen,
    Check,
    CheckCircle2,
    Heart,
    HelpCircle,
    PhoneCall,
    Printer,
    RotateCcw,
    Share2,
    Shield,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface CheatSheetItem {
    id: number;
    title: string;
    category: string;
    summary: string;
    red_flags: string[];
    action_rule: string;
}

interface QuizOption {
    id: string;
    text: string;
    score: number;
}

interface QuizQuestion {
    id: number;
    question: string;
    options: QuizOption[];
}

interface Props {
    cheatSheets: CheatSheetItem[];
    quizQuestions: QuizQuestion[];
}

interface QuizResult {
    score: number;
    level: string;
    verdict: string;
    badgeColor: 'safe' | 'warn' | 'danger';
    share_url: string;
    share_text: string;
}

export default function FamilyGuardianIndex({ cheatSheets, quizQuestions }: Props) {
    const [activeTab, setActiveTab] = useState<'cheatsheet' | 'quiz'>('cheatsheet');
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [quizError, setQuizError] = useState<string | null>(null);

    const getXsrfToken = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleSelectOption = (questionId: number, optionId: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const handleQuizSubmit = async () => {
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < quizQuestions.length) {
            setQuizError(`Harap jawab seluruh ${quizQuestions.length} pertanyaan sebelum melihat hasil.`);
            return;
        }

        setIsSubmittingQuiz(true);
        setQuizError(null);

        try {
            const res = await fetch('/panduan-keluarga/kuis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ answers }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setQuizResult(data);
                window.scrollTo({ top: 300, behavior: 'smooth' });
            } else {
                setQuizError(data.message || 'Gagal mengevaluasi kuis.');
            }
        } catch {
            setQuizError('Terjadi kendala jaringan saat memproses kuis.');
        } finally {
            setIsSubmittingQuiz(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const familyShareWaText = encodeURIComponent(
        `🛡️ *PANDUAN WASPADA PENIPUAN HP UNTUK KELUARGA* (dari Cekara)\n\n` +
        `Keluarga tercinta, jika menerima pesan mencurigakan di WhatsApp/SMS, selalu ingat *ATURAN 3T*:\n` +
        `1. *TENANG* - Jangan panik jika ada kabar musibah atau rekening diblokir.\n` +
        `2. *TELEPON LANGSUNG* - Hubungi nomor biasa kerabat/anak sebelum transfer.\n` +
        `3. *TANYA ANAK/GUARDIAN* - Jangan pernah pasang file berekstensi .APK atau beri kode OTP.\n\n` +
        `Baca panduan lengkapnya di: https://cekara.id/panduan-keluarga`
    );

    return (
        <AppLayout>
            <Head title="Guardian Toolkit untuk Keluarga & Guru - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-b from-slate-50/80 to-white py-12 dark:border-slate-800 dark:from-slate-900/40 dark:to-slate-950">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Badge variant="brand">
                                    <Heart className="size-3 mr-1 text-rose-500 fill-rose-500" />
                                    Family & School Guardian
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Peduli Orang Tua & Kerabat
                                </span>
                            </div>
                            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                                Toolkit Guardian Keluarga & Guru
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                Bekali orang tua, kakek-nenek, dan adik di rumah dengan pemahaman sederhana menghadapi
                                penipuan digital. Jadilah Guardian pertama di lingkungan terdekat Anda.
                            </p>
                        </div>

                        {/* Fast CTA */}
                        <div className="flex flex-wrap gap-2.5">
                            <a
                                href={`https://wa.me/?text=${familyShareWaText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${buttonClasses('primary')} shadow-sm inline-flex items-center gap-1.5`}
                            >
                                <Share2 className="size-4" />
                                Bagikan Aturan 3T ke WA Keluarga
                            </a>
                            <Button variant="outline" onClick={handlePrint} className="print:hidden">
                                <Printer className="size-4 mr-1.5" />
                                Cetak Lembar Panduan
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-8 flex gap-6 border-b border-slate-200/80 print:hidden dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveTab('cheatsheet')}
                            className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${
                                activeTab === 'cheatsheet'
                                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                            }`}
                        >
                            <BookOpen className="size-4" />
                            Lembar Panduan Keluarga (Cheat Sheet)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('quiz')}
                            className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${
                                activeTab === 'quiz'
                                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                            }`}
                        >
                            <Award className="size-4" />
                            Tes Kerentanan Keluarga (5 Menit)
                        </button>
                    </div>
                </div>
            </section>

            {/* TAB 1: Family Cheat Sheet */}
            {activeTab === 'cheatsheet' && (
                <section className="mx-auto max-w-5xl px-6 py-10">
                    {/* 3T Golden Rules Banner */}
                    <Card variant="glass" className="mb-8 border-brand-200/80 bg-brand-50/40 p-6 sm:p-8 dark:border-brand-900/50 dark:bg-brand-950/20">
                        <div className="flex items-center gap-2">
                            <Badge variant="brand">
                                <ShieldCheck className="size-3 mr-1" />
                                Pedoman Emas
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Proteksi Cepat</span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                            Aturan Emas 3T untuk Anggota Keluarga di Rumah
                        </h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                                        <Shield className="size-5" />
                                    </span>
                                    <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">1. TENANG</span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Jangan buru-buru panik saat menerima kabar darurat, musibah, atau ancaman pemblokiran rekening. Penipu sengaja memanfaatkan kepanikan agar Anda tidak berpikir logis.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                        <PhoneCall className="size-5" />
                                    </span>
                                    <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">2. TELEPON</span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Selalu lakukan panggilan suara/video ke nomor lama orang yang bersangkutan sebelum mengirimkan uang. Jangan hanya percaya pada chat teks atau foto profil.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        <HelpCircle className="size-5" />
                                    </span>
                                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">3. TANYA</span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Tunjukkan pesan asing kepada anak, cucu, atau kerabat muda di rumah. Jadikan generasi muda sebagai Guardian Digital keluarga Anda.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Cheat Sheets List */}
                    <div className="space-y-6">
                        {cheatSheets.map((item) => (
                            <Card key={item.id} variant="floating" className="p-6">
                                <div className="flex items-center gap-2">
                                    <Badge variant="warn">{item.category}</Badge>
                                    <span className="text-xs text-slate-400">Panduan #{item.id}</span>
                                </div>

                                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {item.title}
                                </h3>

                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {item.summary}
                                </p>

                                <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Tanda-Tanda Bahaya:
                                    </span>
                                    <ul className="mt-2 space-y-1.5">
                                        {item.red_flags.map((flag, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <AlertTriangle className="size-3.5 shrink-0 text-red-500 mt-0.5" />
                                                <span>{flag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                    <div>
                                        <span className="font-bold">Aksi Aman: </span>
                                        <span>{item.action_rule}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* TAB 2: Family Vulnerability Assessment Quiz */}
            {activeTab === 'quiz' && (
                <section className="mx-auto max-w-5xl px-6 py-10">
                    {/* Quiz Result View */}
                    {quizResult && (
                        <Card variant="floating" className="mb-8 border-l-4 border-l-brand-600 bg-brand-50/20 p-6 sm:p-8 dark:bg-brand-950/20">
                            <div className="flex items-center justify-between">
                                <Badge variant={quizResult.badgeColor} withDot>
                                    Tingkat Kerentanan: {quizResult.level}
                                </Badge>
                                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                    Skor: {quizResult.score} / 100
                                </span>
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                                {quizResult.verdict}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800">
                                <a
                                    href={quizResult.share_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${buttonClasses('primary')} inline-flex items-center gap-1.5 shadow-sm`}
                                >
                                    <Share2 className="size-4" />
                                    Bagikan Hasil ke WhatsApp Keluarga
                                </a>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setQuizResult(null);
                                        setAnswers({});
                                    }}
                                >
                                    <RotateCcw className="size-4 mr-1.5" />
                                    Ulangi Tes
                                </Button>
                            </div>
                        </Card>
                    )}

                    {quizError && (
                        <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
                            <AlertTriangle className="size-4 shrink-0 text-red-600" />
                            <span>{quizError}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {quizQuestions.map((q, idx) => (
                            <Card key={q.id} variant="floating" className="p-6">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-brand-100 text-xs font-bold text-brand-800 dark:bg-brand-900/60 dark:text-brand-300">
                                        {idx + 1}
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 sm:text-base dark:text-slate-100">
                                        {q.question}
                                    </h3>
                                </div>

                                <div className="mt-4 space-y-2.5">
                                    {q.options.map((opt) => {
                                        const isSelected = answers[q.id] === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleSelectOption(q.id, opt.id)}
                                                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition-all ${
                                                    isSelected
                                                        ? 'border-brand-500 bg-brand-50/60 font-medium text-brand-900 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/40 dark:text-brand-200'
                                                        : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <span
                                                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                                        isSelected
                                                            ? 'bg-brand-600 text-white'
                                                            : 'border border-slate-300 text-slate-500 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {opt.id}
                                                </span>
                                                <span className="leading-relaxed">{opt.text}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button
                            variant="primary"
                            onClick={handleQuizSubmit}
                            disabled={isSubmittingQuiz}
                            className="min-w-44 shadow-sm"
                        >
                            <Sparkles className="size-4 mr-1.5" />
                            {isSubmittingQuiz ? 'Mengevaluasi...' : 'Lihat Hasil Asesmen Keluarga'}
                        </Button>
                    </div>
                </section>
            )}
        </AppLayout>
    );
}
