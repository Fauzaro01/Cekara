import type { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface VerifyEmailConfirmProps {
    userName: string;
    userEmail: string;
    alreadyVerified: boolean;
    actionUrl: string;
}

export default function VerifyEmailConfirm({
    userName,
    userEmail,
    alreadyVerified,
    actionUrl,
}: VerifyEmailConfirmProps) {
    const { post, processing } = useForm({});

    const handleVerify: FormEventHandler = (e) => {
        e.preventDefault();
        post(actionUrl);
    };

    return (
        <AppLayout>
            <Head title="Konfirmasi Verifikasi Email" />

            <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
                <Card className="shadow-[4px_4px_0px_0px_#3B2A1E]">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF3DC] text-[#E06812] shadow-[3px_3px_0px_0px_#3B2A1E]">
                            <ShieldCheck className="size-7" />
                        </div>
                        <h1 className="font-['Fredoka',system-ui,sans-serif] text-2xl font-bold tracking-tight text-[#3B2A1E]">
                            Konfirmasi Verifikasi Email
                        </h1>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-[#6B5646]">
                            Tekan tombol di bawah ini untuk memverifikasi alamat email dan mengaktifkan akun Cekara Anda.
                        </p>
                    </div>

                    <div className="mb-6 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                            Detail Akun Guardian
                        </div>
                        <div className="mt-1 font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                            {userName}
                        </div>
                        <div className="text-sm font-semibold text-[#E06812]">
                            {userEmail}
                        </div>
                    </div>

                    {alreadyVerified ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 rounded-xl border-2 border-emerald-700 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-900">
                                <CheckCircle2 className="size-5 shrink-0 text-emerald-700" />
                                <span>
                                    Alamat email Anda sudah terverifikasi. Akun Anda telah aktif!
                                </span>
                            </div>
                            <Link href="/login" className="block">
                                <Button type="button" className="w-full">
                                    Lanjut ke Halaman Masuk
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-4">
                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={processing}
                            >
                                <CheckCircle2 className="size-4" />
                                {processing
                                    ? 'Memverifikasi akun...'
                                    : 'Verifikasi Email Sekarang'}
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

