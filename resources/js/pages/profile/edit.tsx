import { type FormEventHandler, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

export default function ProfileEdit({
    mustVerifyEmail,
}: {
    mustVerifyEmail?: boolean;
    status?: string;
}) {
    const user = usePage().props.auth.user!;

    // Profile Information Form
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch('/profile');
    };

    // Password Update Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put('/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    // Delete Account Form
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const deleteForm = useForm({
        password: '',
    });

    const deleteAccount: FormEventHandler = (e) => {
        e.preventDefault();
        deleteForm.delete('/profile', {
            preserveScroll: true,
            onSuccess: () => setConfirmingDeletion(false),
            onFinish: () => deleteForm.reset(),
        });
    };

    return (
        <AppLayout>
            <Head title="Profil Akun" />

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Profil Akun
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Kelola informasi akun dan pengaturan keamanan Cekara
                        Anda.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Profile Information */}
                    <Card>
                        <header className="mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Informasi Profil
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Perbarui informasi profil dan alamat email akun
                                Anda.
                            </p>
                        </header>

                        <form
                            onSubmit={submitProfile}
                            className="max-w-xl space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="profile_name"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Nama Lengkap
                                </label>
                                <Input
                                    id="profile_name"
                                    type="text"
                                    value={profileForm.data.name}
                                    className="mt-1"
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {profileForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {profileForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="profile_email"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Alamat Email
                                </label>
                                <Input
                                    id="profile_email"
                                    type="email"
                                    value={profileForm.data.email}
                                    className="mt-1"
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {profileForm.errors.email && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {profileForm.errors.email}
                                    </p>
                                )}
                            </div>

                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                        Alamat email Anda belum diverifikasi.
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={profileForm.processing}
                                >
                                    {profileForm.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan'}
                                </Button>

                                {profileForm.recentlySuccessful && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                        Tersimpan.
                                    </p>
                                )}
                            </div>
                        </form>
                    </Card>

                    {/* Update Password */}
                    <Card>
                        <header className="mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Perbarui Kata Sandi
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Pastikan akun Anda menggunakan kata sandi yang
                                kuat dan aman.
                            </p>
                        </header>

                        <form
                            onSubmit={submitPassword}
                            className="max-w-xl space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="current_password"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Kata Sandi Saat Ini
                                </label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    className="mt-1"
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'current_password',
                                            e.target.value,
                                        )
                                    }
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {passwordForm.errors.current_password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="new_password"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Kata Sandi Baru
                                </label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    className="mt-1"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                                {passwordForm.errors.password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {passwordForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Konfirmasi Kata Sandi
                                </label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    className="mt-1"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {
                                            passwordForm.errors
                                                .password_confirmation
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                >
                                    {passwordForm.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan'}
                                </Button>

                                {passwordForm.recentlySuccessful && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                        Tersimpan.
                                    </p>
                                )}
                            </div>
                        </form>
                    </Card>

                    {/* Delete Account */}
                    <Card className="border-red-200 dark:border-red-900/50">
                        <header className="mb-6">
                            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
                                Hapus Akun
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Setelah akun dihapus, seluruh sumber daya dan
                                data di dalamnya akan dihapus secara permanen.
                            </p>
                        </header>

                        {!confirmingDeletion ? (
                            <Button
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                                onClick={() => setConfirmingDeletion(true)}
                            >
                                Hapus Akun
                            </Button>
                        ) : (
                            <form
                                onSubmit={deleteAccount}
                                className="max-w-xl space-y-4"
                            >
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    Masukkan kata sandi Anda untuk mengonfirmasi
                                    bahwa Anda ingin menghapus akun ini secara
                                    permanen.
                                </p>

                                <div>
                                    <label
                                        htmlFor="delete_password"
                                        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Kata Sandi
                                    </label>
                                    <Input
                                        id="delete_password"
                                        type="password"
                                        value={deleteForm.data.password}
                                        className="mt-1"
                                        placeholder="Kata Sandi Anda"
                                        autoFocus
                                        onChange={(e) =>
                                            deleteForm.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {deleteForm.errors.password && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {deleteForm.errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setConfirmingDeletion(false)
                                        }
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                        disabled={deleteForm.processing}
                                    >
                                        {deleteForm.processing
                                            ? 'Menghapus...'
                                            : 'Konfirmasi Hapus Akun'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
