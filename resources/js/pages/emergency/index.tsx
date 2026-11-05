import { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    MessageCircle,
    PhoneCall,
    Printer,
    RotateCcw,
    Share2,
    ShieldAlert,
    Smartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface StepLink {
    label: string;
    url: string;
}

interface ScenarioStep {
    key: string;
    order: number;
    urgency: string;
    title: string;
    instruction: string;
    callout?: string | null;
    action_type?: string | null;
    action_target?: string | null;
    links?: StepLink[];
}

interface Scenario {
    key: string;
    title: string;
    subtitle: string;
    severity_label: string;
    golden_time: string;
    icon: string;
    summary: string;
    steps: ScenarioStep[];
}

interface WhatsAppPreset {
    category: string;
    title: string;
    default_impersonation: string;
    warning_template: string;
    prevention_advice: string;
}

interface Props {
    scenarios: Scenario[];
    whatsappPresets: WhatsAppPreset[];
    userProgress: Record<string, Record<string, boolean>>;
    isGuest: boolean;
}

type AudienceTone = 'family' | 'community' | 'public';

export default function EmergencyIndex({
    scenarios,
    whatsappPresets,
    userProgress,
    isGuest,
}: Props) {
    const [activeTab, setActiveTab] = useState<'checklist' | 'whatsapp'>(
        'checklist',
    );
    const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>(
        scenarios[0]?.key ?? 'apk_malware',
    );

    // Local checklist progress state (initialized from server props)
    const [checkedItems, setCheckedItems] =
        useState<Record<string, Record<string, boolean>>>(userProgress);
    const [isResetting, setIsResetting] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // WhatsApp Form State
    const [selectedPresetCategory, setSelectedPresetCategory] =
        useState<string>(whatsappPresets[0]?.category ?? 'apk_malware');
    const [waScamTitle, setWaScamTitle] = useState<string>('');
    const [waImpersonated, setWaImpersonated] = useState<string>('');
    const [waSuspectContact, setWaSuspectContact] = useState<string>('');
    const [waDetails, setWaDetails] = useState<string>('');
    const [waAdvice, setWaAdvice] = useState<string>('');
    const [waTone, setWaTone] = useState<AudienceTone>('family');
    const [isCopied, setIsCopied] = useState<boolean>(false);

    // Initialize WhatsApp form when preset changes
    useEffect(() => {
        const preset = whatsappPresets.find(
            (p) => p.category === selectedPresetCategory,
        );
        if (preset) {
            setWaScamTitle(preset.title);
            setWaImpersonated(preset.default_impersonation);
            setWaAdvice(preset.prevention_advice);
            if (!waDetails || waDetails.trim() === '') {
                setWaDetails(preset.warning_template);
            }
        }
    }, [selectedPresetCategory, whatsappPresets]);

    // Read XSRF token for secure mutation
    const getXsrfToken = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Current selected scenario
    const currentScenario = useMemo(() => {
        return (
            scenarios.find((s) => s.key === selectedScenarioKey) ?? scenarios[0]
        );
    }, [scenarios, selectedScenarioKey]);

    // Progress metrics for current scenario
    const currentScenarioProgress = useMemo(() => {
        if (!currentScenario || !currentScenario.steps) {
            return { completed: 0, total: 0, percentage: 0 };
        }
        const scenarioChecked = checkedItems[currentScenario.key] || {};
        const completed = currentScenario.steps.filter(
            (s) => scenarioChecked[s.key],
        ).length;
        const total = currentScenario.steps.length;
        const percentage =
            total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    }, [currentScenario, checkedItems]);

    // Toggle checklist step
    const handleToggleStep = async (stepKey: string) => {
        if (!currentScenario) {
            return;
        }

        const scenarioKey = currentScenario.key;
        const currentScenarioState = checkedItems[scenarioKey] || {};
        const willBeCompleted = !currentScenarioState[stepKey];

        // Optimistic UI update
        setCheckedItems((prev) => ({
            ...prev,
            [scenarioKey]: {
                ...prev[scenarioKey],
                [stepKey]: willBeCompleted,
            },
        }));

        // If authenticated, persist to server
        if (!isGuest) {
            try {
                const response = await fetch(
                    '/tanggap-darurat/checklist/toggle',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-XSRF-TOKEN': getXsrfToken(),
                        },
                        body: JSON.stringify({
                            scenario_key: scenarioKey,
                            step_key: stepKey,
                            is_completed: willBeCompleted,
                        }),
                    },
                );

                if (!response.ok) {
                    showToast('Gagal menyinkronkan status ke akun.');
                }
            } catch {
                showToast('Gagal menghubungi server.');
            }
        }
    };

    // Reset current scenario progress
    const handleResetCurrentScenario = async () => {
        if (!currentScenario) {
            return;
        }

        const scenarioKey = currentScenario.key;
        setIsResetting(true);

        // Clear local state
        setCheckedItems((prev) => ({
            ...prev,
            [scenarioKey]: {},
        }));

        if (!isGuest) {
            try {
                const response = await fetch(
                    '/tanggap-darurat/checklist/reset',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-XSRF-TOKEN': getXsrfToken(),
                        },
                        body: JSON.stringify({
                            scenario_key: scenarioKey,
                        }),
                    },
                );

                if (response.ok) {
                    showToast(
                        'Progres checklist untuk skenario ini berhasil direset.',
                    );
                }
            } catch {
                showToast('Gagal mereset progres di server.');
            } finally {
                setIsResetting(false);
            }
        } else {
            setIsResetting(false);
            showToast('Checklist sesi tamu berhasil dibersihkan.');
        }
    };

    // Format WhatsApp Message with proper Markdown & Tone
    const generatedWhatsAppMessage = useMemo(() => {
        let toneHeader = '🚨 *PERINGATAN KEAMANAN SIBER KELUARGA* 🚨';
        let greeting =
            'Keluarga sekalian, mohon perhatiannya terkait modus penipuan siber yang baru saja ditemukan:';

        if (waTone === 'community') {
            toneHeader = '📢 *INFORMASI WASPADA KOMUNITAS & WARGA* 📢';
            greeting =
                'Bapak/Ibu/Rekan-rekan warga sekalian, mohon berhati-hati terhadap modus kejahatan siber berikut:';
        } else if (waTone === 'public') {
            toneHeader = '⚠️ *PERINGATAN PUBLIK: WASPADA PENIPUAN SIBER* ⚠️';
            greeting =
                'Pemberitahuan kepada seluruh kontak dan rekan untuk mewaspadai indikasi penipuan berikut:';
        }

        const lines = [
            toneHeader,
            greeting,
            `*Modus:* ${waScamTitle || 'Penipuan Siber Mencurigakan'}`,
            `*Mengatasnamakan:* ${waImpersonated || 'Pihak Asing / Tidak Dikenal'}`,
            `*Kontak/No. Terduga:* ${waSuspectContact || '(Nomor / Rekening Tidak Diketahui)'}`,
            `*Ciri-Ciri Modus:*\n${waDetails || 'Harap waspada terhadap permintaan kode OTP, tautan berkas APK, atau permintaan transfer mencurigakan.'}`,
            `*Langkah Pencegahan:*\n${waAdvice || 'Jangan berikan data pribadi, jangan unduh file mencurigakan, dan segera hubungi pihak resmi untuk konfirmasi.'}`,
            '_Pesan ini dibuat otomatis melalui Cekara (Pusat Edukasi & Tanggap Darurat Penipuan Siber) - https://cekara.id_',
        ];

        return lines.join('\n\n');
    }, [
        waTone,
        waScamTitle,
        waImpersonated,
        waSuspectContact,
        waDetails,
        waAdvice,
    ]);

    // Copy to clipboard
    const handleCopyWhatsAppMessage = async () => {
        try {
            await navigator.clipboard.writeText(generatedWhatsAppMessage);
            setIsCopied(true);
            showToast('Pesan peringatan berhasil disalin ke papan klip!');
            setTimeout(() => setIsCopied(false), 3000);
        } catch {
            showToast('Gagal menyalin teks ke papan klip.');
        }
    };

    // Open WhatsApp Web / App via wa.me URL
    const handleShareToWhatsApp = () => {
        const encoded = encodeURIComponent(generatedWhatsAppMessage);
        const url = `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Switch to WhatsApp tab with preselected category
    const handleSwitchToWhatsAppWithCategory = (category: string) => {
        setSelectedPresetCategory(category);
        setActiveTab('whatsapp');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AppLayout>
            <Head title="Pusat Tanggap Darurat & Peringatan Keluarga - Cekara" />

            {/* Notification Toast */}
            {toastMessage && (
                <div className="animate-in fade-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3 text-sm text-emerald-200 shadow-2xl backdrop-blur-md">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="mx-auto max-w-5xl px-6 py-10">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-rose-600 uppercase dark:text-rose-400">
                        <span className="flex size-2 animate-pulse rounded-full bg-rose-500" />
                        Pilar Bertindak (Action Center)
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                        Pusat Tanggap Darurat & Peringatan Keluarga
                    </h1>
                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
                        Panduan tindakan terstruktur untuk membatasi kerugian
                        saat Anda atau keluarga terindikasi terkena kejahatan
                        siber, serta generator pesan instan untuk melindungi
                        kerabat terdekat.
                    </p>
                </div>

                {/* Primary Tabs */}
                <div className="mb-8 border-b border-slate-200/80 dark:border-slate-800 print:hidden">
                    <div className="flex gap-4 sm:gap-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('checklist')}
                            className={cn(
                                'flex items-center gap-2 border-b-2 pb-4 text-sm font-semibold transition-all',
                                activeTab === 'checklist'
                                    ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                            )}
                        >
                            <ShieldAlert className="size-4.5" />
                            Panduan Langkah Darurat (Checklist)
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('whatsapp')}
                            className={cn(
                                'flex items-center gap-2 border-b-2 pb-4 text-sm font-semibold transition-all',
                                activeTab === 'whatsapp'
                                    ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                            )}
                        >
                            <MessageCircle className="size-4.5" />
                            Generator Pesan Peringatan WhatsApp
                        </button>
                    </div>
                </div>

                {/* TAB 1: EMERGENCY CHECKLIST */}
                {activeTab === 'checklist' && (
                    <div className="space-y-8">
                        {/* Guest Banner */}
                        {isGuest && (
                            <div className="flex flex-col gap-4 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30 print:hidden">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                            Mode Akses Tamu (Simulasi Lokal)
                                        </p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                                            Anda dapat membaca panduan dan
                                            mencentang langkah secara interaktif
                                            di sesi ini. Masuk akun agar
                                            checklist tanggap darurat Anda
                                            tersimpan permanen.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/login"
                                    className={cn(
                                        buttonClasses('primary'),
                                        'shrink-0 text-xs whitespace-nowrap shadow-xs',
                                    )}
                                >
                                    Masuk Akun{' '}
                                    <ArrowRight className="ml-1 size-3.5" />
                                </Link>
                            </div>
                        )}

                        {/* Scenario Selector Pills */}
                        <div className="print:hidden">
                            <label className="mb-3 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Pilih Skenario Insiden:
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {scenarios.map((scenario) => {
                                    const isSelected =
                                        scenario.key === selectedScenarioKey;
                                    const scenarioProgress =
                                        checkedItems[scenario.key] || {};
                                    const completedCount =
                                        scenario.steps.filter(
                                            (s) => scenarioProgress[s.key],
                                        ).length;

                                    return (
                                        <button
                                            key={scenario.key}
                                            type="button"
                                            onClick={() =>
                                                setSelectedScenarioKey(
                                                    scenario.key,
                                                )
                                            }
                                            className={cn(
                                                'flex flex-col rounded-2xl border p-4 text-left transition-all duration-200',
                                                isSelected
                                                    ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-500/30 dark:border-rose-500/80 dark:bg-rose-950/20'
                                                    : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700',
                                            )}
                                        >
                                            <div className="mb-2 flex w-full items-center justify-between">
                                                <span
                                                    className={cn(
                                                        'rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                                                        scenario.key ===
                                                            'apk_malware'
                                                            ? 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-300'
                                                            : scenario.key ===
                                                                'fraud_transfer'
                                                              ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-300'
                                                              : 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300',
                                                    )}
                                                >
                                                    {scenario.severity_label}
                                                </span>
                                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                                    {completedCount}/
                                                    {scenario.steps.length}{' '}
                                                    selesai
                                                </span>
                                            </div>

                                            <h3 className="text-sm leading-snug font-bold text-slate-900 dark:text-slate-100">
                                                {scenario.title}
                                            </h3>
                                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                {scenario.subtitle}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Scenario Detail & Checklist */}
                        {currentScenario && (
                            <div className="space-y-6">
                                {/* Scenario Banner & Progress */}
                                <Card variant="floating" className="p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="danger" withDot>
                                                    {
                                                        currentScenario.severity_label
                                                    }
                                                </Badge>
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    <Clock className="size-3.5 text-slate-400" />
                                                    Waktu Kritis:{' '}
                                                    <strong className="text-slate-800 dark:text-slate-200">
                                                        {
                                                            currentScenario.golden_time
                                                        }
                                                    </strong>
                                                </span>
                                            </div>
                                            <h2 className="pt-1 text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-slate-100">
                                                {currentScenario.title}
                                            </h2>
                                            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                {currentScenario.summary}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2 self-start print:hidden">
                                            <Button
                                                variant="outline"
                                                onClick={() => window.print()}
                                                className="h-9 px-3 text-xs text-slate-600 dark:text-slate-300"
                                            >
                                                <Printer className="mr-1.5 size-3.5" />
                                                Cetak Panduan
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={
                                                    handleResetCurrentScenario
                                                }
                                                disabled={
                                                    isResetting ||
                                                    currentScenarioProgress.completed ===
                                                        0
                                                }
                                                className="h-9 px-3 text-xs text-slate-600 dark:text-slate-300"
                                            >
                                                <RotateCcw className="mr-1.5 size-3.5" />
                                                Reset Checklist
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800/80">
                                        <div className="mb-2 flex items-center justify-between text-xs font-medium">
                                            <span className="text-slate-700 dark:text-slate-300">
                                                Langkah Tindakan Terselesaikan:
                                            </span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                                {
                                                    currentScenarioProgress.completed
                                                }{' '}
                                                dari{' '}
                                                {currentScenarioProgress.total}{' '}
                                                (
                                                {
                                                    currentScenarioProgress.percentage
                                                }
                                                %)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-linear-to-r from-rose-500 to-emerald-500 transition-all duration-300"
                                                style={{
                                                    width: `${currentScenarioProgress.percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Step Cards */}
                                <div className="space-y-4">
                                    {currentScenario.steps.map((step) => {
                                        const isChecked =
                                            !!checkedItems[
                                                currentScenario.key
                                            ]?.[step.key];

                                        return (
                                            <div
                                                key={step.key}
                                                className={cn(
                                                    'group relative rounded-2xl border p-5 transition-all duration-200',
                                                    isChecked
                                                        ? 'border-emerald-300/80 bg-emerald-50/30 dark:border-emerald-800/50 dark:bg-emerald-950/10'
                                                        : 'border-slate-200/80 bg-white shadow-xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700',
                                                )}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Custom Checkbox */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleStep(
                                                                step.key,
                                                            )
                                                        }
                                                        className={cn(
                                                            'mt-1 flex size-6 shrink-0 items-center justify-center rounded-lg border text-white transition-all focus:ring-2 focus:ring-rose-500 focus:outline-none',
                                                            isChecked
                                                                ? 'border-emerald-600 bg-emerald-600 shadow-xs dark:border-emerald-500 dark:bg-emerald-500'
                                                                : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800',
                                                        )}
                                                        aria-label={`Tandai langkah ${step.order}`}
                                                    >
                                                        {isChecked && (
                                                            <Check className="size-4 stroke-[3]" />
                                                        )}
                                                    </button>

                                                    {/* Content */}
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                                Langkah{' '}
                                                                {step.order}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                                                    step.urgency ===
                                                                        'Kritis'
                                                                        ? 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-300'
                                                                        : step.urgency ===
                                                                            'Segera'
                                                                          ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-300'
                                                                          : 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300',
                                                                )}
                                                            >
                                                                {step.urgency}
                                                            </span>
                                                        </div>

                                                        <h4
                                                            onClick={() =>
                                                                handleToggleStep(
                                                                    step.key,
                                                                )
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-base font-bold text-slate-900 transition-colors dark:text-slate-100',
                                                                isChecked &&
                                                                    'text-emerald-900 dark:text-emerald-200',
                                                            )}
                                                        >
                                                            {step.title}
                                                        </h4>

                                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                            {step.instruction}
                                                        </p>

                                                        {/* Callout box */}
                                                        {step.callout && (
                                                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                                                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                                                                    Tips
                                                                    Cepat:{' '}
                                                                </strong>
                                                                {step.callout}
                                                            </div>
                                                        )}

                                                        {/* Action Buttons & Links */}
                                                        <div className="flex flex-wrap items-center gap-3 pt-1">
                                                            {step.action_type ===
                                                                'phone' &&
                                                                step.action_target && (
                                                                    <a
                                                                        href={
                                                                            step.action_target
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700"
                                                                    >
                                                                        <PhoneCall className="size-3.5" />
                                                                        Hubungi
                                                                        Call
                                                                        Center
                                                                        Sekarang
                                                                    </a>
                                                                )}

                                                            {step.action_type ===
                                                                'ussd' &&
                                                                step.action_target && (
                                                                    <a
                                                                        href={
                                                                            step.action_target
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-amber-700"
                                                                    >
                                                                        <Smartphone className="size-3.5" />
                                                                        Jalankan
                                                                        Kode
                                                                        USSD
                                                                        (##002#)
                                                                    </a>
                                                                )}

                                                            {step.action_type ===
                                                                'link' &&
                                                                step.action_target && (
                                                                    <a
                                                                        href={
                                                                            step.action_target
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
                                                                    >
                                                                        <ExternalLink className="size-3.5" />
                                                                        Kunjungi
                                                                        Portal
                                                                        Resmi
                                                                    </a>
                                                                )}

                                                            {step.links &&
                                                                step.links
                                                                    .length >
                                                                    0 && (
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {step.links.map(
                                                                            (
                                                                                link,
                                                                                idx,
                                                                            ) => (
                                                                                <a
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    href={
                                                                                        link.url
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                                                                                >
                                                                                    <span>
                                                                                        {
                                                                                            link.label
                                                                                        }
                                                                                    </span>
                                                                                    <ExternalLink className="size-3" />
                                                                                </a>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Cross-tab CTA: Warn family via WhatsApp */}
                                <Card
                                    variant="glass"
                                    className="border-emerald-500/30 bg-emerald-50/50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-1">
                                            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                <MessageCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                                                Perlu memperingatkan keluarga
                                                atau kerabat sekarang?
                                            </h4>
                                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                                Jangan biarkan sindikat
                                                menghubungi orang terdekat Anda.
                                                Buat template pesan WhatsApp
                                                resmi yang sudah terformat rapi
                                                dengan 1 klik.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() =>
                                                handleSwitchToWhatsAppWithCategory(
                                                    currentScenario.key,
                                                )
                                            }
                                            className="h-10 bg-emerald-600 px-4 text-xs whitespace-nowrap text-white shadow-sm hover:bg-emerald-700"
                                        >
                                            Buat Pesan WhatsApp{' '}
                                            <ArrowRight className="ml-1 size-3.5" />
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: WHATSAPP ALERT GENERATOR */}
                {activeTab === 'whatsapp' && (
                    <div className="space-y-8">
                        {/* Intro banner */}
                        <Card variant="floating" className="p-6">
                            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-slate-100">
                                Generator Pesan Peringatan WhatsApp
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                Saat Anda mendeteksi modus penipuan atau menjadi
                                korban, sebarkan peringatan ini ke grup WhatsApp
                                keluarga atau komunitas agar kerabat tidak mudah
                                terperdaya.
                            </p>
                        </Card>

                        {/* Presets selector chips */}
                        <div>
                            <label className="mb-2.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Pilih Template Modus Cepat:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {whatsappPresets.map((preset) => (
                                    <button
                                        key={preset.category}
                                        type="button"
                                        onClick={() =>
                                            setSelectedPresetCategory(
                                                preset.category,
                                            )
                                        }
                                        className={cn(
                                            'rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all',
                                            selectedPresetCategory ===
                                                preset.category
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                                                : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                        )}
                                    >
                                        {preset.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Two-column layout: Form & Live Preview */}
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Left Column: Form Controls */}
                            <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
                                <h3 className="text-sm font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Detail Modus Penipuan
                                </h3>

                                {/* Tone selection */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Target Audiens & Nada Pesan:
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setWaTone('family')}
                                            className={cn(
                                                'rounded-xl border p-2.5 text-center text-xs font-medium transition-all',
                                                waTone === 'family'
                                                    ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                                                    : 'border-slate-200/80 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                            )}
                                        >
                                            Grup Keluarga
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWaTone('community')
                                            }
                                            className={cn(
                                                'rounded-xl border p-2.5 text-center text-xs font-medium transition-all',
                                                waTone === 'community'
                                                    ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                                                    : 'border-slate-200/80 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                            )}
                                        >
                                            Warga / Komunitas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWaTone('public')}
                                            className={cn(
                                                'rounded-xl border p-2.5 text-center text-xs font-medium transition-all',
                                                waTone === 'public'
                                                    ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                                                    : 'border-slate-200/80 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                                            )}
                                        >
                                            Publik / Teman
                                        </button>
                                    </div>
                                </div>

                                {/* Field 1: Title */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Judul Modus Penipuan:
                                    </label>
                                    <input
                                        type="text"
                                        value={waScamTitle}
                                        onChange={(e) =>
                                            setWaScamTitle(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: Modus Undangan Pernikahan File APK"
                                    />
                                </div>

                                {/* Field 2: Impersonated */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Mengatasnamakan (Pihak yang Dicatut):
                                    </label>
                                    <input
                                        type="text"
                                        value={waImpersonated}
                                        onChange={(e) =>
                                            setWaImpersonated(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: Kurir J&T / Customer Service Bank BRI"
                                    />
                                </div>

                                {/* Field 3: Suspect Contact */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Kontak / Nomor Rekening Terduga:
                                    </label>
                                    <input
                                        type="text"
                                        value={waSuspectContact}
                                        onChange={(e) =>
                                            setWaSuspectContact(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: +62 812-9876-5432 / BCA 1234567890 a.n. Sindikat"
                                    />
                                </div>

                                {/* Field 4: Chronology Details */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Ciri-Ciri Modus & Kronologi Singkat:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={waDetails}
                                        onChange={(e) =>
                                            setWaDetails(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Jelaskan cara kerja penipuan atau isi pesan yang dikirimkan penipu..."
                                    />
                                </div>

                                {/* Field 5: Advice */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Langkah Pencegahan untuk Pembaca:
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={waAdvice}
                                        onChange={(e) =>
                                            setWaAdvice(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Contoh: Jangan pernah menginstal berkas APK dan jangan kirim uang..."
                                    />
                                </div>
                            </div>

                            {/* Right Column: WhatsApp Live Preview & Actions */}
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        <MessageCircle className="size-4 text-emerald-600" />
                                        Pratinjau Pesan WhatsApp
                                    </h3>
                                    <span className="font-mono text-xs text-slate-500">
                                        {generatedWhatsAppMessage.length}{' '}
                                        karakter
                                    </span>
                                </div>

                                {/* WhatsApp Chat Bubble Container */}
                                <div className="flex flex-1 flex-col justify-between rounded-2xl border border-emerald-900/20 bg-slate-100/90 p-5 dark:border-emerald-800/20 dark:bg-slate-950/60">
                                    <div className="relative rounded-2xl rounded-tl-none border border-emerald-200 bg-[#e7fedb] p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-slate-900 shadow-xs select-all dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                                        {generatedWhatsAppMessage}
                                        <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                            <span>Baru saja</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                ✓✓
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            type="button"
                                            onClick={handleCopyWhatsAppMessage}
                                            variant="outline"
                                            className={cn(
                                                'h-11 flex-1 text-xs',
                                                isCopied &&
                                                    'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
                                            )}
                                        >
                                            {isCopied ? (
                                                <>
                                                    <CheckCircle2 className="mr-1.5 size-4 text-emerald-600 dark:text-emerald-400" />
                                                    Tersalin ke Papan Klip!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-1.5 size-4" />
                                                    Salin Pesan
                                                </>
                                            )}
                                        </Button>

                                        <button
                                            type="button"
                                            onClick={handleShareToWhatsApp}
                                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95"
                                        >
                                            <Share2 className="size-4" />
                                            Kirim ke WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
