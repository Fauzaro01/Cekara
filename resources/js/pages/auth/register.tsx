import type { FormEventHandler } from 'react';
import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeClosed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
    const redirectParam = urlParams?.get('redirect') || '';

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        redirect: redirectParam,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(
            redirectParam
                ? `/register?redirect=${encodeURIComponent(redirectParam)}`
                : '/register',
            {
                onFinish: () => reset('password', 'password_confirmation'),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Daftar Akun" />

            <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
                <Card className="shadow-[4px_4px_0px_0px_#3B2A1E]">
                    <div className="mb-6 text-center">
                        <h1 className="font-['Fredoka',system-ui,sans-serif] text-2xl font-bold tracking-tight text-[#3B2A1E]">
                            Daftar Akun
                        </h1>
                        <p className="mt-1.5 text-sm font-semibold text-[#6B5646]">
                            Buat akun guardian Cekara Anda
                        </p>
                    </div>

                    {redirectParam && (
                        <div className="mb-4 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-3 text-xs font-semibold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]">
                            Silakan daftar terlebih dahulu untuk memulai sesi latihan simulasi Anda.
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-bold text-[#3B2A1E]"
                            >
                                Nama Lengkap
                            </label>
                            <Input
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className="mt-1.5"
                                autoComplete="name"
                                autoFocus
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm font-medium text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

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
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm font-medium text-red-600">
                                    {errors.email}
                                </p>
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
                                    autoComplete="new-password"
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

                        <div>
                            <label
                                htmlFor="password_confirmation"
                                className="block text-sm font-bold text-[#3B2A1E]"
                            >
                                Konfirmasi Kata Sandi
                            </label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="password_confirmation"
                                    type={
                                        showConfirmPassword ? 'text' : 'password'
                                    }
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="pr-11"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#6B5646] hover:text-[#3B2A1E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B2A1E] transition-colors"
                                    aria-label={
                                        showConfirmPassword
                                            ? 'Sembunyikan kata sandi'
                                            : 'Tampilkan kata sandi'
                                    }
                                    title={
                                        showConfirmPassword
                                            ? 'Sembunyikan kata sandi'
                                            : 'Tampilkan kata sandi'
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <Eye className="size-5" />
                                    ) : (
                                        <EyeClosed className="size-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm font-medium text-red-600">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing ? 'Sedang mendaftarkan...' : 'Daftar'}
                        </Button>

                        <div className="text-center text-sm font-medium text-[#6B5646]">
                            Sudah memiliki akun?{' '}
                            <Link
                                href={
                                    redirectParam
                                        ? `/login?redirect=${encodeURIComponent(redirectParam)}`
                                        : '/login'
                                }
                                className="font-bold text-[#E06812] hover:underline"
                            >
                                Masuk
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
