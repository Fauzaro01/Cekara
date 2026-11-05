import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    Briefcase,
    Building2,
    CheckCircle2,
    Download,
    FileWarning,
    Gamepad2,
    HelpCircle,
    Mail,
    RefreshCw,
    RotateCcw,
    Send,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    User,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface ChatMessage {
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

interface ScenarioOption {
    id: string;
    text: string;
    is_safe: boolean;
    score: number;
    explanation: string;
}

interface ScenarioDetail {
    id: number;
    title: string;
    slug: string;
    category: string;
    difficulty: string;
    context_description: string;
    sender_name: string;
    sender_avatar: string | null;
    chat_messages: ChatMessage[];
    options: ScenarioOption[];
    psychological_tricks: string[];
    red_flags: string[];
    prevention_advice: string;
}

interface LatestAttempt {
    selected_option: string;
    is_safe: boolean;
    score: number;
    feedback_notes: string | null;
}

interface Props {
    scenario: ScenarioDetail;
    latestAttempt: LatestAttempt | null;
}

interface EvaluationResult {
    selected_option: string;
    is_safe: boolean;
    score: number;
    explanation: string;
    psychological_tricks: string[];
    red_flags: string[];
    prevention_advice: string;
}

export default function SimulationShow({ scenario, latestAttempt }: Props) {
    const [selectedOption, setSelectedOption] = useState<string>(
        latestAttempt?.selected_option || ''
    );
    const [feedbackNotes, setFeedbackNotes] = useState<string>(
        latestAttempt?.feedback_notes || ''
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initial evaluation state if already attempted
    const initialEvaluation: EvaluationResult | null = latestAttempt
        ? {
              selected_option: latestAttempt.selected_option,
              is_safe: latestAttempt.is_safe,
              score: latestAttempt.score,
              explanation:
                  scenario.options.find((o) => o.id === latestAttempt.selected_option)
                      ?.explanation || '',
              psychological_tricks: scenario.psychological_tricks,
              red_flags: scenario.red_flags,
              prevention_advice: scenario.prevention_advice,
          }
        : null;

    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(initialEvaluation);

    const getXsrfToken = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleSubmitDecision = async () => {
        if (!selectedOption) {
            setErrorMessage('Silakan pilih salah satu opsi tindakan sebelum konfirmasi.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await fetch(`/simulasi/${scenario.slug}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    selected_option: selectedOption,
                    feedback_notes: feedbackNotes,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setEvaluation(data.evaluation);
            } else {
                setErrorMessage(data.message || 'Gagal mengevaluasi jawaban.');
            }
        } catch {
            setErrorMessage('Terjadi kendala jaringan saat mengirim keputusan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        setEvaluation(null);
        setSelectedOption('');
    };

    const renderSenderAvatar = (avatar: string | null) => {
        switch (avatar) {
            case 'mail':
                return <Mail className="size-4.5 text-slate-600 dark:text-slate-300" />;
            case 'briefcase':
                return <Briefcase className="size-4.5 text-slate-600 dark:text-slate-300" />;
            case 'building':
                return <Building2 className="size-4.5 text-slate-600 dark:text-slate-300" />;
            case 'banknote':
                return <Banknote className="size-4.5 text-slate-600 dark:text-slate-300" />;
            default:
                return <User className="size-4.5 text-slate-600 dark:text-slate-300" />;
        }
    };

    return (
        <AppLayout>
            <Head title={`Simulasi: ${scenario.title} - Cekara`} />

            <div className="mx-auto max-w-5xl px-6 py-8">
                {/* Back Button & Breadcrumbs */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/simulasi"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-100"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali ke Daftar Skenario
                    </Link>
                    <Badge variant="brand">
                        <Gamepad2 className="size-3 mr-1" />
                        Simulasi Interaktif
                    </Badge>
                </div>

                {/* Scenario Header Card */}
                <Card variant="floating" className="mb-8 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="neutral">Kategori: {scenario.category.replace('_', ' ')}</Badge>
                        <Badge variant="warn" withDot>Tingkat: {scenario.difficulty}</Badge>
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                        {scenario.title}
                    </h1>
                    <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-700 sm:text-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            Situasi:
                        </span>{' '}
                        {scenario.context_description}
                    </div>
                </Card>

                {/* Split View: Chat Simulator & Decision Area */}
                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Simulated Chat Interface (Left Column - 6 Cols) */}
                    <div className="lg:col-span-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100/90 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                                        {renderSenderAvatar(scenario.sender_avatar)}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                            {scenario.sender_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Online
                                        </div>
                                    </div>
                                </div>
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    Simulasi Pesan
                                </span>
                            </div>

                            {/* Warning Banner */}
                            <div className="flex items-center gap-2 border-b border-amber-200/60 bg-amber-50/90 px-4 py-2 text-[11px] font-medium text-amber-900 dark:border-amber-950 dark:bg-amber-950/40 dark:text-amber-300">
                                <AlertTriangle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>Pengirim tidak ada di kontak tersimpan ponsel Anda.</span>
                            </div>

                            {/* Message Stream */}
                            <div className="space-y-4 p-4 min-h-[340px]">
                                {scenario.chat_messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex flex-col ${
                                            msg.sender === 'user' ? 'items-end' : 'items-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                                                msg.sender === 'user'
                                                    ? 'rounded-br-xs bg-brand-600 text-white shadow-xs'
                                                    : 'rounded-bl-xs border border-slate-200/90 bg-white text-slate-800 shadow-xs dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-100'
                                            }`}
                                        >
                                            <p className="whitespace-pre-line leading-relaxed">
                                                {msg.text}
                                            </p>

                                            {/* File Attachment Mockup */}
                                            {msg.attachment && (
                                                <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/80 p-2.5 dark:border-red-900/50 dark:bg-red-950/40">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-700 dark:bg-red-900/60 dark:text-red-300">
                                                        <FileWarning className="size-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-bold text-red-900 dark:text-red-200">
                                                            {msg.attachment.name}
                                                        </p>
                                                        <p className="text-[10px] text-red-600/80 dark:text-red-400">
                                                            {msg.attachment.size} • Aplikasi Android (.apk)
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div
                                                className={`mt-1 text-right text-[10px] ${
                                                    msg.sender === 'user'
                                                        ? 'text-white/70'
                                                        : 'text-slate-400 dark:text-slate-500'
                                                }`}
                                            >
                                                {msg.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Decision & Evaluation Panel (Right Column - 6 Cols) */}
                    <div className="lg:col-span-6">
                        {!evaluation ? (
                            /* Phase 1: Thinking & Decision Choices */
                            <Card variant="floating" className="p-6">
                                <div className="flex items-center gap-2">
                                    <Badge variant="brand">
                                        <Sparkles className="size-3 mr-1" />
                                        Tahap Berpikir
                                    </Badge>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Pilih Keputusan Anda
                                    </span>
                                </div>

                                <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Apa tindakan terbaik yang akan Anda ambil?
                                </h2>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Pertimbangkan tanda bahaya dan alasan di balik respon Anda sebelum memutuskan.
                                </p>

                                {errorMessage && (
                                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300">
                                        <AlertTriangle className="size-4 shrink-0 text-red-600" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="mt-6 space-y-3">
                                    {scenario.options.map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSelectedOption(opt.id)}
                                            className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                                                selectedOption === opt.id
                                                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/30'
                                                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                                    selectedOption === opt.id
                                                        ? 'bg-brand-600 text-white'
                                                        : 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                                                }`}
                                            >
                                                {opt.id}
                                            </span>
                                            <span className="text-xs leading-relaxed text-slate-800 sm:text-sm dark:text-slate-200">
                                                {opt.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-5">
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Catatan Naluri / Alasan Anda (Opsional):
                                    </label>
                                    <textarea
                                        value={feedbackNotes}
                                        onChange={(e) => setFeedbackNotes(e.target.value)}
                                        placeholder="Tuliskan mengapa Anda mencurigai pesan ini..."
                                        rows={2}
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                    />
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="button"
                                        disabled={isSubmitting || !selectedOption}
                                        onClick={handleSubmitDecision}
                                        className={`w-full ${buttonClasses('primary')} shadow-sm`}
                                    >
                                        <ShieldCheck className="size-4 mr-1.5" />
                                        {isSubmitting ? 'Mengevaluasi Keputusan...' : 'Konfirmasi Keputusan Guardian'}
                                    </button>
                                </div>
                            </Card>
                        ) : (
                            /* Phase 2: Feedback & Psychological Breakdown */
                            <div className="space-y-6">
                                {/* Score & Verdict Header */}
                                <Card
                                    variant="floating"
                                    className={`p-6 border-l-4 ${
                                        evaluation.is_safe
                                            ? 'border-l-safe bg-emerald-50/20 dark:bg-emerald-950/10'
                                            : 'border-l-danger bg-red-50/20 dark:bg-red-950/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant={evaluation.is_safe ? 'safe' : 'danger'}
                                            withDot
                                        >
                                            {evaluation.is_safe
                                                ? 'Keputusan Tepat & Aman'
                                                : 'Keputusan Berisiko Tinggi'}
                                        </Badge>
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            Skor: {evaluation.score} / 100
                                        </span>
                                    </div>

                                    <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
                                        Hasil Evaluasi Keputusan Anda (Opsi {evaluation.selected_option})
                                    </h3>

                                    <p className="mt-2 text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
                                        {evaluation.explanation}
                                    </p>

                                    <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={handleRetry}
                                            className={buttonClasses('outline')}
                                        >
                                            <RotateCcw className="size-3.5 mr-1.5" />
                                            Ulangi Skenario
                                        </button>
                                        <Link
                                            href="/simulasi"
                                            className={buttonClasses('primary')}
                                        >
                                            <Gamepad2 className="size-3.5 mr-1.5" />
                                            Skenario Lainnya
                                        </Link>
                                    </div>
                                </Card>

                                {/* Psychological Manipulation Breakdown */}
                                <Card variant="floating" className="p-6">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="warn" withDot>Bedah Rekayasa Sosial</Badge>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Trik Psikologis Penipu
                                        </span>
                                    </div>
                                    <ul className="mt-3.5 space-y-2.5">
                                        {evaluation.psychological_tricks.map((trick, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed dark:text-slate-300"
                                            >
                                                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                                                <span>{trick}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>

                                {/* Red Flags Checklist */}
                                <Card variant="floating" className="p-6">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="danger" withDot>Tanda Bahaya Utama</Badge>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Indikator Red Flags
                                        </span>
                                    </div>
                                    <ul className="mt-3.5 space-y-2.5">
                                        {evaluation.red_flags.map((flag, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed dark:text-slate-300"
                                            >
                                                <AlertTriangle className="size-3.5 shrink-0 text-red-500 mt-0.5" />
                                                <span>{flag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>

                                {/* Prevention Advice */}
                                <Card variant="glass" className="border-brand-200/80 bg-brand-50/40 p-6 dark:border-brand-900/50 dark:bg-brand-950/20">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="brand">
                                            <ShieldCheck className="size-3 mr-1" />
                                            Aturan Emas Guardian
                                        </Badge>
                                        <span className="text-xs font-bold text-brand-900 dark:text-brand-300">
                                            Panduan Pencegahan
                                        </span>
                                    </div>
                                    <p className="mt-2.5 text-xs leading-relaxed text-slate-800 sm:text-sm dark:text-slate-200">
                                        {evaluation.prevention_advice}
                                    </p>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
