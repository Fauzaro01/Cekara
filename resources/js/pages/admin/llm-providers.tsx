import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import { useSkeletonMount, LlmProvidersSkeleton } from '@/components/ui/skeleton';

export interface LlmProviderItem {
    id: number;
    key: string;
    name: string;
    model: string;
    base_url?: string | null;
    is_active: boolean;
    has_api_key?: boolean;
}

interface LlmProvidersPageProps {
    providers?: LlmProviderItem[];
}

const defaultProvidersList: LlmProviderItem[] = [
    {
        id: 1,
        key: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-1.5-flash',
        base_url: 'https://generativelanguage.googleapis.com/v1beta',
        is_active: true,
        has_api_key: false,
    },
    {
        id: 2,
        key: 'openai',
        name: 'OpenAI',
        model: 'gpt-4o-mini',
        base_url: 'https://api.openai.com/v1',
        is_active: false,
        has_api_key: false,
    },
    {
        id: 3,
        key: 'custom',
        name: 'Custom Router API',
        model: 'custom-model',
        base_url: 'https://api.custom-router.example/v1',
        is_active: false,
        has_api_key: false,
    },
];

export default function LlmProvidersPage({
    providers = defaultProvidersList,
}: LlmProvidersPageProps) {
    const list = providers.length > 0 ? providers : defaultProvidersList;
    const isInitialLoading = useSkeletonMount(280);

    const [providerStates, setProviderStates] = useState(
        list.map((p) => ({
            ...p,
            apiKeyInput: '',
            isSubmitting: false,
        })),
    );

    useEffect(() => {
        const currentList =
            providers.length > 0 ? providers : defaultProvidersList;
        setProviderStates((prev) =>
            currentList.map((p) => {
                const existing = prev.find((item) => item.id === p.id);
                return {
                    ...p,
                    apiKeyInput: existing ? existing.apiKeyInput : '',
                    isSubmitting: false,
                };
            }),
        );
    }, [providers]);

    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleActivate = (id: number, name: string) => {
        router.post(
            `/admin/llm-providers/${id}/activate`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProviderStates((prev) =>
                        prev.map((item) => ({
                             ...item,
                             is_active: item.id === id,
                        })),
                    );
                    toast.success(`Provider ${name} berhasil diaktifkan sebagai provider utama.`);
                    setStatusMessage(null);
                    setErrorMessage(null);
                },
                onError: () => {
                    toast.error('Gagal mengaktifkan provider. Silakan coba lagi.');
                    setStatusMessage(null);
                },
            },
        );
    };

    const handleSave = (id: number, index: number) => {
        const item = providerStates[index];
        if (!item) return;

        setProviderStates((prev) =>
            prev.map((p, idx) =>
                idx === index ? { ...p, isSubmitting: true } : p,
            ),
        );

        router.put(
            `/admin/llm-providers/${id}`,
            {
                name: item.name,
                model: item.model,
                base_url: item.base_url,
                api_key: item.apiKeyInput || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProviderStates((prev) =>
                        prev.map((p, idx) =>
                            idx === index
                                ? {
                                      ...p,
                                      has_api_key: Boolean(
                                          p.apiKeyInput || p.has_api_key,
                                      ),
                                      apiKeyInput: '',
                                  }
                                : p,
                        ),
                    );
                    toast.success(`Konfigurasi provider ${item.name} berhasil disimpan.`);
                    setStatusMessage(null);
                    setErrorMessage(null);
                },
                onError: () => {
                    toast.error(`Gagal menyimpan konfigurasi provider ${item.name}. Silakan periksa kembali data Anda.`);
                    setStatusMessage(null);
                },
                onFinish: () => {
                    setProviderStates((prev) =>
                        prev.map((p, idx) =>
                            idx === index
                                ? {
                                      ...p,
                                      isSubmitting: false,
                                  }
                                : p,
                        ),
                    );
                },
            },
        );
    };

    if (isInitialLoading) {
        return (
            <AppLayout>
                <Head title="Manajemen Provider LLM" />
                <LlmProvidersSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Manajemen Provider LLM" />

            <div className="mx-auto max-w-5xl px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                            Manajemen Provider LLM
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Kelola kunci API, model, endpoint kustom, dan
                            tentukan provider aktif yang digunakan chatbot
                            Cekara.
                        </p>
                    </div>
                </div>

                {/* Status Alert */}
                {statusMessage && (
                    <div className="mb-6 rounded-lg border border-safe/30 bg-safe/10 p-4 text-sm text-safe dark:border-safe/40 dark:bg-safe/20">
                        {statusMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger dark:border-danger/40 dark:bg-danger/20">
                        {errorMessage}
                    </div>
                )}

                {/* Mock Fallback Notice Card */}
                <Card className="mb-8 border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900 dark:bg-brand-950/20">
                    <div className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                            i
                        </span>
                        <div className="text-xs text-slate-700 sm:text-sm dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                Mode Keandalan Tinggi (Fallback Mock Otomatis):
                            </span>{' '}
                            Apabila kredensial API provider aktif belum
                            dikonfigurasi, kuota habis, atau terjadi kendala
                            jaringan eksternal, mesin Cekara secara cerdas
                            beralih ke engine deteksi heuristik mock tanpa
                            menghentikan layanan bagi pengguna akhir.
                        </div>
                    </div>
                </Card>

                {/* Providers Responsive Grid */}
                <div className="grid gap-6">
                    {providerStates.map((provider, index) => (
                        <Card
                            key={provider.id || provider.key}
                            className={`p-6 transition-all ${
                                provider.is_active
                                    ? 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-400 dark:ring-brand-400/20'
                                    : 'border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {provider.name}
                                    </h2>
                                    <Badge
                                        variant="neutral"
                                        className="font-mono text-[10px] uppercase"
                                    >
                                        {provider.key}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                    {provider.is_active ? (
                                        <Badge
                                            variant="safe"
                                            className="gap-1.5 font-semibold"
                                        >
                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                            Provider Aktif
                                        </Badge>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-8 text-xs font-medium"
                                            onClick={() =>
                                                handleActivate(
                                                    provider.id,
                                                    provider.name,
                                                )
                                            }
                                        >
                                            Jadikan Aktif
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Model ID
                                    </label>
                                    <Input
                                        type="text"
                                        value={provider.model}
                                        onChange={(e) =>
                                            setProviderStates((prev) =>
                                                prev.map((p, idx) =>
                                                    idx === index
                                                        ? {
                                                              ...p,
                                                              model: e.target
                                                                  .value,
                                                          }
                                                        : p,
                                                ),
                                            )
                                        }
                                        placeholder="cth. gemini-1.5-flash atau gpt-4o"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Base URL / Endpoint
                                    </label>
                                    <Input
                                        type="text"
                                        value={provider.base_url || ''}
                                        onChange={(e) =>
                                            setProviderStates((prev) =>
                                                prev.map((p, idx) =>
                                                    idx === index
                                                        ? {
                                                              ...p,
                                                              base_url:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : p,
                                                ),
                                            )
                                        }
                                        placeholder="https://api..."
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Kunci API (Terenkripsi Saat Disimpan)
                                </label>
                                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        type="password"
                                        value={provider.apiKeyInput}
                                        onChange={(e) =>
                                            setProviderStates((prev) =>
                                                prev.map((p, idx) =>
                                                    idx === index
                                                        ? {
                                                              ...p,
                                                              apiKeyInput:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : p,
                                                ),
                                            )
                                        }
                                        placeholder={
                                            provider.has_api_key
                                                ? '•••••••••••••••• (Kunci tersimpan aman, isi untuk mengganti)'
                                                : 'Masukkan kunci API rahasia (cth. sk-...)'
                                        }
                                        className="grow"
                                    />
                                    <Button
                                        type="button"
                                        variant="primary"
                                        disabled={provider.isSubmitting}
                                        onClick={() =>
                                            handleSave(provider.id, index)
                                        }
                                        className="h-10 text-xs font-semibold sm:w-auto"
                                    >
                                        {provider.isSubmitting
                                            ? 'Menyimpan...'
                                            : 'Simpan'}
                                    </Button>
                                </div>
                                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    {provider.has_api_key
                                        ? 'Status: Kunci API terpasang dan dienkripsi AES-256 di basis data.'
                                        : 'Status: Belum ada kunci API yang dikonfigurasi. Fallback otomatis aktif.'}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
