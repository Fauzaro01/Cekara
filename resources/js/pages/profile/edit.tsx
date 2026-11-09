import { type FormEventHandler, useState, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Trash2, Save, Lock } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';

export default function ProfileEdit({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail?: boolean;
    status?: string;
}) {
    const user = usePage().props.auth.user!;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.avatar || null,
    );
    const [deleteAvatar, setDeleteAvatar] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Profile Information Form
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                toast.error('Ukuran foto profil maksimal 3MB.');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
                toast.error('Format foto harus berupa JPG, PNG, atau WEBP.');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setAvatarFile(file);
            setDeleteAvatar(false);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            toast.info('Foto profil baru siap disimpan.');
        }
    };

    const onAvatarDelete = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setDeleteAvatar(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.warning('Foto profil akan dihapus setelah menekan tombol Simpan.');
    };

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        router.post(
            '/profile',
            {
                _method: 'patch',
                name: profileForm.data.name,
                email: profileForm.data.email,
                avatar: avatarFile || undefined,
                delete_avatar: deleteAvatar ? '1' : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAvatarFile(null);
                    setDeleteAvatar(false);
                    setIsUpdatingProfile(false);
                    toast.success('Informasi profil berhasil diperbarui!');
                },
                onError: (errors) => {
                    profileForm.setError(errors as Record<string, string>);
                    setIsUpdatingProfile(false);
                    const firstError = Object.values(errors)[0] as string | undefined;
                    toast.error(firstError || 'Gagal memperbarui profil. Periksa kembali data Anda.');
                },
                onFinish: () => {
                    setIsUpdatingProfile(false);
                },
            },
        );
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
            onSuccess: () => {
                passwordForm.reset();
                toast.success('Kata sandi berhasil diperbarui!');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string | undefined;
                toast.error(firstError || 'Gagal memperbarui kata sandi. Periksa kata sandi saat ini.');
            },
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
            onSuccess: () => {
                setConfirmingDeletion(false);
                toast.success('Akun Anda berhasil dihapus.');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string | undefined;
                toast.error(firstError || 'Gagal menghapus akun. Kata sandi tidak sesuai.');
            },
            onFinish: () => deleteForm.reset(),
        });
    };

    return (
        <AppLayout>
            <Head title="Profil Akun" />

            <div className="mx-auto max-w-xl px-4 pt-10 pb-28 sm:pt-12 sm:pb-32">
                <div className="mb-8 text-center">
                    <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl sm:text-4xl font-bold tracking-tight text-[#3B2A1E] dark:text-slate-100">
                        Profil Akun
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-[#6B5646] dark:text-slate-400 max-w-md mx-auto">
                        Kelola informasi akun dan pengaturan keamanan Cekara
                        Anda.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Profile Information */}
                    <Card>
                        <header className="mb-5">
                            <h2 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E] dark:text-slate-100">
                                Informasi Profil
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-[#6B5646] dark:text-slate-400">
                                Perbarui informasi nama dan foto profil akun Anda.
                            </p>
                        </header>

                        <form
                            onSubmit={submitProfile}
                            className="w-full space-y-5"
                        >
                            {/* Foto Profil Section (Center dengan tombol di sebelah kanan foto) */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 pb-6 border-b-2 border-[#EFE3D0]">
                                {/* Avatar Display */}
                                <div className="relative shrink-0">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={profileForm.data.name || user.name}
                                            className="size-24 sm:size-28 rounded-full object-cover border-2 sm:border-3 border-[#3B2A1E] shadow-[3.5px_3.5px_0px_0px_#3B2A1E]"
                                        />
                                    ) : (
                                        <div className="flex size-24 sm:size-28 items-center justify-center rounded-full border-2 sm:border-3 border-[#3B2A1E] bg-[#FFE27A] text-3xl sm:text-4xl font-black text-[#3B2A1E] shadow-[3.5px_3.5px_0px_0px_#3B2A1E]">
                                            {(profileForm.data.name || user.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons to the Right of Photo */}
                                <div className="flex flex-col items-center sm:items-start gap-2.5">
                                    <span className="text-xs font-bold text-[#3B2A1E]">
                                        Foto Profil
                                    </span>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                        {/* Hidden File Input */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={onAvatarChange}
                                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                            className="hidden"
                                            id="avatar_input"
                                        />

                                        {/* Ganti / Unggah Button */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-3.5 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:bg-[#FFE27A] active:translate-x-0.5 active:translate-y-0.5"
                                        >
                                            <Camera className="size-3.5" strokeWidth={2.5} />
                                            <span>{avatarPreview ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                        </button>

                                        {/* Hapus Button */}
                                        {avatarPreview && (
                                            <button
                                                type="button"
                                                onClick={onAvatarDelete}
                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#D4573A] bg-white px-3 py-1.5 text-xs font-bold text-[#D4573A] shadow-[2px_2px_0px_0px_#D4573A] transition hover:bg-[#D4573A] hover:text-white active:translate-x-0.5 active:translate-y-0.5"
                                                title="Hapus Foto Profil"
                                            >
                                                <Trash2 className="size-3.5" strokeWidth={2.5} />
                                                <span>Hapus</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-semibold text-[#6B5646] text-center sm:text-left">
                                        Format JPG, PNG, atau WEBP. Maksimal 3MB.
                                    </p>
                                </div>
                            </div>

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
                                <div className="relative mt-1">
                                    <Input
                                        id="profile_email"
                                        type="email"
                                        value={profileForm.data.email}
                                        readOnly
                                        tabIndex={-1}
                                        aria-readonly="true"
                                        className="pr-10 cursor-not-allowed bg-[#F5EFE6] border-[#D4C3B3] text-[#7A685A] select-none focus-visible:border-[#D4C3B3] focus-visible:ring-0 shadow-none font-medium"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8C7A6B]">
                                        <Lock className="size-4" strokeWidth={2.2} />
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-[#8C7A6B]">
                                    Alamat email tertaut permanen dengan akun Anda dan tidak dapat diubah.
                                </p>
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

                            <div className="flex items-center justify-end gap-3 pt-2">
                                {profileForm.recentlySuccessful && (
                                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        Tersimpan.
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isUpdatingProfile || profileForm.processing}
                                    className="inline-flex items-center gap-1.5"
                                >
                                    <Save className="size-4 shrink-0" strokeWidth={2.2} />
                                    <span>
                                        {isUpdatingProfile || profileForm.processing
                                            ? 'Menyimpan...'
                                            : 'Simpan'}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Update Password */}
                    <Card>
                        <header className="mb-5">
                            <h2 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E] dark:text-slate-100">
                                Perbarui Kata Sandi
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-[#6B5646] dark:text-slate-400">
                                Pastikan akun Anda menggunakan kata sandi yang
                                kuat dan aman.
                            </p>
                        </header>

                        <form
                            onSubmit={submitPassword}
                            className="w-full space-y-4"
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

                            <div className="flex items-center justify-end gap-3 pt-2">
                                {passwordForm.recentlySuccessful && (
                                     <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                         Tersimpan.
                                     </p>
                                 )}

                                <Button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="inline-flex items-center gap-1.5"
                                >
                                    <Save className="size-4 shrink-0" strokeWidth={2.2} />
                                    <span>
                                        {passwordForm.processing
                                            ? 'Menyimpan...'
                                            : 'Simpan'}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Delete Account */}
                    <Card className="border-red-200 dark:border-red-900/50">
                        <header className="mb-5">
                            <h2 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-red-700 dark:text-red-400">
                                Hapus Akun
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-[#6B5646] dark:text-slate-400">
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
                                className="w-full space-y-4"
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
