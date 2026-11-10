import type { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface VerifyEmailProps {
    status?: string;
    email?: string | null;
}

export default function VerifyEmail({ status, email }: VerifyEmailProps) {
    const { data, setData, post, processing } = useForm({
        email: email || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    const isLinkSent = status === 'verification-link-sent';

    return (
        <AppLayout>
            <Head title="Verifikasi Email" />

            <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
                <Card className="shadow-[4px_4px_0px_0px_#3B2A1E]">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <h1 className="font-['Fredoka',system-ui,sans-serif] text-2xl font-bold tracking-tight text-[#3B2A1E]">
                            Verifikasi Alamat Email
                        </h1>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-[#6B5646]">
                            Terima kasih telah mendaftar! Sebelum dapat masuk menggunakan akun Anda, silakan buka tautan halaman verifikasi yang telah kami kirimkan ke email{' '}
                            {email ? (
                                <span className="font-bold text-[#3B2A1E]">
                                    {email}
                                </span>
                            ) : (
                                'Anda'
                            )}{' '}
                            dan tekan tombol verifikasi di halaman tersebut.
                        </p>
                    </div>

                    {isLinkSent && (
                        <div className="mb-5 flex items-start gap-2.5 rounded-xl border-2 border-emerald-700 bg-emerald-50 p-3.5 text-xs font-semibold leading-relaxed text-emerald-900 shadow-[2px_2px_0px_0px_#047857]">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                            <span>
                                Tautan halaman verifikasi baru telah dikirimkan ke alamat email Anda. Silakan periksa kotak masuk atau folder Spam Anda.
                            </span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        {!email && (
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-bold text-[#3B2A1E]"
                                >
                                    Alamat Email Terdaftar
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1.5"
                                    placeholder="nama@email.com"
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full gap-2"
                            disabled={processing}
                        >
                            <RefreshCw
                                className={`size-4 ${processing ? 'animate-spin' : ''}`}
                            />
                            {processing
                                ? 'Mengirim ulang email...'
                                : 'Kirim Ulang Email Verifikasi'}
                        </Button>

                        <div className="pt-2 text-center text-sm font-medium text-[#6B5646]">
                            Sudah melakukan verifikasi?{' '}
                            <Link
                                href="/login"
                                className="font-bold text-[#E06812] hover:underline"
                            >
                                Masuk di sini
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}

