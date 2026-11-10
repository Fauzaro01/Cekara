import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    PhoneCall,
    Printer,
    Share2,
} from 'lucide-react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useSkeletonMount, FamilySkeleton } from '@/components/ui/skeleton';

function CalmIcon({ className = 'size-5' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 10c.8-1.2 2.2-1.2 3 0" />
            <path d="M13 10c.8-1.2 2.2-1.2 3 0" />
            <path d="M8.5 14.5c1 1.8 6 1.8 7 0" />
        </svg>
    );
}

interface CheatSheetItem {
    id: number;
    title: string;
    category: string;
    summary: string;
    red_flags: string[];
    action_rule: string;
}

interface Props {
    cheatSheets: CheatSheetItem[];
    quizQuestions?: unknown[];
}

export default function FamilyGuardianIndex({
    cheatSheets,
}: Props) {
    const isInitialLoading = useSkeletonMount(280);

    const handlePrint = () => {
        window.print();
    };

    const familyShareWaText = encodeURIComponent(
        ` *PANDUAN WASPADA PENIPUAN HP UNTUK KELUARGA* (dari Cekara)\n\n` +
            `Keluarga tercinta, jika menerima pesan mencurigakan di WhatsApp/SMS, selalu ingat *ATURAN 3T*:\n` +
            `1. *TENANG* - Jangan panik jika ada kabar musibah atau rekening diblokir.\n` +
            `2. *TELEPON LANGSUNG* - Hubungi nomor biasa kerabat/anak sebelum transfer.\n` +
            `3. *TANYA ANAK/GUARDIAN* - Jangan pernah pasang file berekstensi .APK atau beri kode OTP.\n\n` +
            `Baca panduan lengkapnya di: https://cekara.id/panduan-keluarga`,
    );

    if (isInitialLoading) {
        return (
            <AppLayout>
                <Head title="Panduan Literasi Keluarga - Cekara" />
                <FamilySkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Guardian Toolkit untuk Keluarga & Guru - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#FFF8EC] pt-8 pb-4 sm:pt-12 sm:pb-6">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl">
                            <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl leading-tight font-bold tracking-tight text-[#3B2A1E] sm:text-4xl md:text-[40px]">
                                Panduan Waspada Penipuan Digital untuk Keluarga
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-[#6B5646] sm:text-base">
                                Bekali orang tua, kakek-nenek, dan adik di rumah
                                dengan pemahaman sederhana menghadapi penipuan
                                digital. Jadilah Guardian pertama di lingkungan
                                terdekat Anda.
                            </p>
                        </div>

                        {/* Fast CTA */}
                        <div className="flex flex-col items-stretch sm:items-end gap-2.5 shrink-0 md:ml-auto">
                            <a
                                href={`https://wa.me/?text=${familyShareWaText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${buttonClasses('primary')} inline-flex w-full sm:w-[285px] items-center justify-center gap-2 shadow-sm text-center`}
                            >
                                <Share2 className="size-4 shrink-0" />
                                <span>Bagikan Aturan 3T</span>
                            </a>
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="print:hidden inline-flex w-full sm:w-[285px] items-center justify-center gap-2 text-center"
                            >
                                <Printer className="size-4 shrink-0" />
                                <span>Cetak Lembar Panduan</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Family Cheat Sheet */}
            <section className="mx-auto max-w-5xl px-6 py-10">
                    {/* 3T Golden Rules Banner */}
                    <Card
                        variant="glass"
                        className="mb-8 border-brand-200/80 bg-brand-50/40 p-6 sm:p-8 dark:border-brand-900/50 dark:bg-brand-950/20"
                    >
                        <h2 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E] sm:text-2xl">
                            Aturan Emas 3T untuk Anggota Keluarga di Rumah
                        </h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[3px_3px_0px_0px_#3B2A1E] transition-all">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-9 items-center justify-center rounded-xl border border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E]">
                                        <CalmIcon className="size-5" />
                                    </span>
                                    <span className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                        1. TENANG
                                    </span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-[#6B5646]">
                                    Jangan buru-buru panik saat menerima kabar
                                    darurat, musibah, atau ancaman pemblokiran
                                    rekening. Penipu sengaja memanfaatkan
                                    kepanikan agar Anda tidak berpikir logis.
                                </p>
                            </div>
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[3px_3px_0px_0px_#3B2A1E] transition-all">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-9 items-center justify-center rounded-xl border border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E]">
                                        <PhoneCall className="size-5" />
                                    </span>
                                    <span className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                        2. TELEPON
                                    </span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-[#6B5646]">
                                    Selalu lakukan panggilan suara/video ke
                                    nomor lama orang yang bersangkutan sebelum
                                    mengirimkan uang. Jangan hanya percaya pada
                                    chat teks atau foto profil.
                                </p>
                            </div>
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-5 shadow-[3px_3px_0px_0px_#3B2A1E] transition-all">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-9 items-center justify-center rounded-xl border border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E]">
                                        <HelpCircle className="size-5" />
                                    </span>
                                    <span className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                        3. TANYA
                                    </span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-[#6B5646]">
                                    Tunjukkan pesan asing kepada anak, cucu,
                                    atau kerabat muda di rumah. Jadikan generasi
                                    muda sebagai Guardian Digital keluarga Anda.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Cheat Sheets List */}
                    <div className="space-y-6">
                        {cheatSheets.map((item) => (
                            <Card
                                key={item.id}
                                variant="floating"
                                className="p-6"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#6B5646]">
                                        Panduan #{item.id}
                                    </span>
                                </div>

                                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {item.title}
                                </h3>

                                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {item.summary}
                                </p>

                                <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Tanda-Tanda Bahaya:
                                    </span>
                                    <ul className="mt-2 space-y-1.5">
                                        {item.red_flags.map((flag, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                                            >
                                                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                                                <span>{flag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <div>
                                        <span className="font-bold">
                                            Aksi Aman:{' '}
                                        </span>
                                        <span>{item.action_rule}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
        </AppLayout>
    );
}
