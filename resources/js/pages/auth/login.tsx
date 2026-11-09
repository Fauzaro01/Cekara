import type { FormEventHandler } from 'react';
import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeClosed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
    const redirectParam = urlParams?.get('redirect') || '';

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        redirect: redirectParam,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(
            redirectParam
                ? `/login?redirect=${encodeURIComponent(redirectParam)}`
                : '/login',
            {
                onFinish: () => reset('password'),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Masuk" />

            <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
                <Card className="shadow-[4px_4px_0px_0px_#3B2A1E]">
                    <div className="mb-6 text-center">
                        <h1 className="font-['Fredoka',system-ui,sans-serif] text-2xl font-bold tracking-tight text-[#3B2A1E]">
                            Masuk
                        </h1>
                        <p className="mt-1.5 text-sm font-semibold text-[#6B5646]">
                            Masuk ke akun guardian Cekara Anda
                        </p>
                    </div>

                    {redirectParam && (
                        <div className="mb-4 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-3 text-xs font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]">
                            Silakan masuk terlebih dahulu untuk memulai sesi latihan simulasi Anda.
                        </div>
                    )}

                    {status && (
                        <div className="mb-4 rounded-xl border-2 border-emerald-600 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-bold text-[#3B2A1E]"
                            >
                                Alamat Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1.5"
                                autoComplete="username"
                                autoFocus
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                            />
                            {errors.email && (
                                <div className="mt-1 space-y-1.5">
                                    <p className="text-sm font-medium text-red-600">
                                        {errors.email}
                                    </p>
                                    {errors.email.includes('belum diverifikasi') && (
                                        <Link
                                            href="/verify-email"
                                            className="inline-block text-xs font-bold text-[#E06812] hover:underline"
                                        >
                                            Belum menerima email? Kirim ulang tautan verifikasi &rarr;
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-bold text-[#3B2A1E]"
                            >
                                Kata Sandi
                            </label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className="pr-11"
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#6B5646] hover:text-[#3B2A1E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B2A1E] transition-colors"
                                    aria-label={
                                        showPassword
                                            ? 'Sembunyikan kata sandi'
                                            : 'Tampilkan kata sandi'
                                    }
                                    title={
                                        showPassword
                                            ? 'Sembunyikan kata sandi'
                                            : 'Tampilkan kata sandi'
                                    }
                                >
                                    {showPassword ? (
                                        <Eye className="size-5" />
                                    ) : (
                                        <EyeClosed className="size-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm font-medium text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <Checkbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked)
                                }
                                label="Ingat saya"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing ? 'Sedang masuk...' : 'Masuk'}
                        </Button>

                        <div className="text-center text-sm font-medium text-[#6B5646]">
                            Belum punya akun?{' '}
                            <Link
                                href={
                                    redirectParam
                                        ? `/register?redirect=${encodeURIComponent(redirectParam)}`
                                        : '/register'
                                }
                                className="font-bold text-[#E06812] hover:underline"
                            >
                                Daftar
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
