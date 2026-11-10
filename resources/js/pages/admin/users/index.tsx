import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useSkeletonMount, UsersTableSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import {
    Users,
    UserCheck,
    ShieldCheck,
    Search,
    Mail,
    Calendar,
    Activity,
    CheckCircle2,
    XCircle,
    UserX,
    Filter,
    ArrowUpDown,
    RotateCcw,
    Pencil,
    Trash2,
    X,
    Loader2,
} from 'lucide-react';

interface UserItem {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    is_admin: boolean;
    is_verified: boolean;
    scans_count: number;
    simulations_count: number;
    last_active: string;
    created_at_human: string;
    created_at_date: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UsersPagination {
    data: UserItem[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface AdminUsersProps {
    users: UsersPagination;
    filters: {
        search: string;
        role: string;
        status: string;
        period?: string;
        per_page?: number;
    };
    stats: {
        total_users: number;
        total_admins: number;
        total_verified: number;
        new_this_week: number;
    };
}

function getPaginationLabel(label: string): string {
    if (label.includes('&laquo;') || label.toLowerCase().includes('previous') || label.includes('«')) {
        return 'Sebelumnya';
    }
    if (label.includes('&raquo;') || label.toLowerCase().includes('next') || label.includes('»')) {
        return 'Berikutnya';
    }
    return label.replace('&laquo;', '').replace('&raquo;', '').trim();
}

export default function AdminUsersPage({
    users,
    filters,
    stats,
}: AdminUsersProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || 'all');
    const [selectedPerPage, setSelectedPerPage] = useState<number>(filters.per_page || 5);
    const [processingUserId, setProcessingUserId] = useState<number | null>(null);
    const isInitialLoading = useSkeletonMount(280);

    const { auth } = usePage<{ auth?: { user?: { id: number; name: string } } }>().props;
    const currentUserId = auth?.user?.id;

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        is_admin: false,
    });
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/users',
            {
                search: searchTerm.trim() || undefined,
                role: selectedRole !== 'all' ? selectedRole : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
                per_page: selectedPerPage,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (role: string, status: string, period = 'all') => {
        setSelectedRole(role);
        setSelectedStatus(status);
        setSelectedPeriod(period);
        router.get(
            '/admin/users',
            {
                search: searchTerm || undefined,
                role: role !== 'all' ? role : undefined,
                status: status !== 'all' ? status : undefined,
                period: period !== 'all' ? period : undefined,
                per_page: selectedPerPage,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePerPageChange = (newPerPage: number) => {
        setSelectedPerPage(newPerPage);
        router.get(
            '/admin/users',
            {
                search: searchTerm || undefined,
                role: selectedRole !== 'all' ? selectedRole : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
                per_page: newPerPage,
                page: 1,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilter = () => {
        setSearchTerm('');
        setSelectedRole('all');
        setSelectedStatus('all');
        setSelectedPeriod('all');
        setSelectedPerPage(5);
        router.get('/admin/users', { per_page: 5 }, { preserveState: true, preserveScroll: true });
    };

    const handleOpenEditModal = (user: UserItem) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            is_admin: user.is_admin,
        });
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        if (!editForm.name.trim() || !editForm.email.trim()) {
            setEditError('Nama lengkap dan email wajib diisi.');
            return;
        }

        setIsSubmittingEdit(true);
        setEditError(null);

        router.put(
            `/admin/users/${editingUser.id}`,
            {
                name: editForm.name.trim(),
                email: editForm.email.trim(),
                is_admin: editForm.is_admin,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Data pengguna ${editForm.name} berhasil diperbarui.`);
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                },
                onError: (errors) => {
                    setEditError(
                        (errors as Record<string, string>).name ||
                        (errors as Record<string, string>).email ||
                        (errors as Record<string, string>).is_admin ||
                        'Gagal memperbarui pengguna. Periksa kembali input Anda.'
                    );
                    toast.error('Gagal memperbarui data pengguna.');
                },
                onFinish: () => {
                    setIsSubmittingEdit(false);
                },
            }
        );
    };

    const handleOpenDeleteModal = (user: UserItem) => {
        if (currentUserId === user.id) {
            toast.error('Anda tidak dapat menghapus akun Anda sendiri.');
            return;
        }
        setDeletingUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingUser) return;

        setIsSubmittingDelete(true);

        router.delete(`/admin/users/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Pengguna ${deletingUser.name} berhasil dihapus.`);
                setIsDeleteModalOpen(false);
                setDeletingUser(null);
            },
            onError: () => {
                toast.error('Gagal menghapus pengguna.');
            },
            onFinish: () => {
                setIsSubmittingDelete(false);
            },
        });
    };

    const isNewWeekActive = selectedPeriod === 'new_7_days';

    if (isInitialLoading) {
        return (
            <AppLayout>
                <Head title="Kelola Pengguna - Panel Admin Cekara" />
                <UsersTableSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Kelola Pengguna - Panel Admin Cekara" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="font-['Fredoka',system-ui,sans-serif] text-2xl sm:text-3xl font-bold text-[#3B2A1E]">
                                Manajemen & Kelola Pengguna
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-[#6B5646]">
                                Pantau aktivitas akun warga, status verifikasi email, serta kelola hak akses administrator sistem Cekara.
                            </p>
                        </div>
                    </div>

                    {/* Stats Metric Cards (Only 'Akun Baru 7 Hari' is clickable) */}
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <div
                            className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 text-left shadow-[3px_3px_0px_0px_#3B2A1E]"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-[#6B5646] block">
                                Total Pengguna
                            </span>
                            <div className="mt-2 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E]">
                                {stats.total_users}
                            </div>
                            <span className="text-[11px] font-semibold text-[#6B5646] block">
                                Seluruh akun terdaftar
                            </span>
                        </div>

                        <div
                            className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] p-4 text-left shadow-[3px_3px_0px_0px_#3B2A1E]"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-[#3B2A1E] block">
                                Administrator
                            </span>
                            <div className="mt-2 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E]">
                                {stats.total_admins}
                            </div>
                            <span className="text-[11px] font-bold text-[#3B2A1E]/80 block">
                                Pengelola & Verifikator
                            </span>
                        </div>

                        <div
                            className="rounded-2xl border-2 border-[#3B2A1E] bg-[#8ECDF0] p-4 text-left shadow-[3px_3px_0px_0px_#3B2A1E]"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-[#3B2A1E] block">
                                Terverifikasi
                            </span>
                            <div className="mt-2 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E]">
                                {stats.total_verified}
                            </div>
                            <span className="text-[11px] font-bold text-[#3B2A1E]/80 block">
                                Email telah tervalidasi
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('all', 'all', isNewWeekActive ? 'all' : 'new_7_days')}
                            className={`group rounded-2xl border-2 border-[#3B2A1E] bg-[#FF9A3C] p-4 text-left transition-all duration-150 cursor-pointer ${
                                isNewWeekActive
                                    ? 'ring-2 ring-[#3B2A1E] ring-offset-2 shadow-[4px_4px_0px_0px_#3B2A1E] -translate-y-0.5'
                                    : 'shadow-[3px_3px_0px_0px_#3B2A1E] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#3B2A1E]'
                            }`}
                            title="Filter akun baru yang terdaftar 7 hari terakhir"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-[#3B2A1E] block">
                                Akun Baru 7 Hari
                            </span>
                            <div className="mt-2 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold text-[#3B2A1E]">
                                {stats.new_this_week}
                            </div>
                            <span className="text-[11px] font-bold text-[#3B2A1E]/80 block">
                                Pertumbuhan mingguan
                            </span>
                        </button>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="mb-6 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-4 shadow-[4px_4px_0px_0px_#3B2A1E]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search form */}
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#6B5646]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari nama atau email pengguna... (Tekan Enter)"
                                className="w-full rounded-xl border-2 border-[#3B2A1E] bg-white py-2 pl-10 pr-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 focus:bg-[#FFF8EC] focus:outline-none"
                            />
                        </form>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Role Filter */}
                            <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-2.5 py-1.5 text-xs font-bold text-[#3B2A1E]">
                                <Filter className="size-3.5 text-[#6B5646]" />
                                <select
                                    value={selectedRole}
                                    onChange={(e) => handleFilterChange(e.target.value, selectedStatus, selectedPeriod)}
                                    className="bg-transparent font-bold text-[#3B2A1E] outline-none cursor-pointer"
                                >
                                    <option value="all">Semua Peran</option>
                                    <option value="admin">Administrator</option>
                                    <option value="user">Pengguna</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-2.5 py-1.5 text-xs font-bold text-[#3B2A1E]">
                                <CheckCircle2 className="size-3.5 text-[#6B5646]" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => handleFilterChange(selectedRole, e.target.value, selectedPeriod)}
                                    className="bg-transparent font-bold text-[#3B2A1E] outline-none cursor-pointer"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="verified">Terverifikasi</option>
                                    <option value="unverified">Belum Verifikasi</option>
                                </select>
                            </div>

                            {/* Active Period Badge */}
                            {selectedPeriod === 'new_7_days' && (
                                <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-2.5 py-1 text-xs font-bold text-[#3B2A1E]">
                                    <span>Akun 7 Hari</span>
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange(selectedRole, selectedStatus, 'all')}
                                        className="hover:text-white transition cursor-pointer font-extrabold"
                                        title="Hapus filter waktu"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}

                            {/* Reset filter button */}
                            {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedPeriod !== 'all') && (
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="inline-flex items-center gap-1 rounded-xl border-2 border-[#3B2A1E] bg-white px-2.5 py-1.5 text-xs font-bold text-[#D4573A] hover:bg-[#FFE27A] transition cursor-pointer"
                                    title="Reset Filter"
                                >
                                    <RotateCcw className="size-3" />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Users Table Card */}
                <div className="overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-white shadow-[6px_6px_0px_0px_#3B2A1E]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b-2 border-[#3B2A1E] bg-[#FFF8EC] font-['Fredoka',system-ui,sans-serif] text-[#3B2A1E]">
                                    <th className="py-3.5 px-4 font-bold">Pengguna</th>
                                    <th className="py-3.5 px-4 font-bold">Peran</th>
                                    <th className="py-3.5 px-4 font-bold">Verifikasi Email</th>
                                    <th className="py-3.5 px-4 font-bold">Bergabung</th>
                                    <th className="py-3.5 px-4 font-bold text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EFE3D0] font-semibold text-[#3B2A1E]">
                                {users.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-[#FFF8EC]/60"
                                    >
                                        {/* User Info */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                {item.avatar ? (
                                                    <img
                                                        src={item.avatar}
                                                        alt={item.name}
                                                        className="size-9 rounded-full object-cover border-2 border-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]"
                                                    />
                                                ) : (
                                                    <div className="flex size-9 items-center justify-center rounded-full border-2 border-[#3B2A1E] bg-[#FFE27A] text-xs font-black text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]">
                                                        {item.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="font-bold text-[#3B2A1E] truncate max-w-[200px]">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-[11px] text-[#6B5646] font-medium truncate max-w-[200px]">
                                                        {item.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="py-3.5 px-4">
                                            {item.is_admin ? (
                                                <span className="inline-flex items-center rounded-lg border border-[#3B2A1E] bg-[#FFE27A] px-2 py-0.5 text-[10px] font-black uppercase text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-lg border border-[#3B2A1E] bg-[#FFF8EC] px-2 py-0.5 text-[10px] font-bold text-[#6B5646]">
                                                    Pengguna
                                                </span>
                                            )}
                                        </td>

                                        {/* Email Verification */}
                                        <td className="py-3.5 px-4">
                                            {item.is_verified ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2A7E4B]">
                                                    <CheckCircle2 className="size-3.5" />
                                                    Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A8412A]">
                                                    <XCircle className="size-3.5" />
                                                    Belum
                                                </span>
                                            )}
                                        </td>

                                        {/* Joined Date */}
                                        <td className="py-3.5 px-4">
                                            <div className="text-xs text-[#3B2A1E] font-bold">
                                                {item.created_at_date}
                                            </div>
                                            <div className="text-[10px] text-[#6B5646]">
                                                {item.created_at_human}
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(item)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-3 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                                                    title={`Edit data & peran ${item.name}`}
                                                >
                                                    <Pencil className="size-3" />
                                                    <span>Edit</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDeleteModal(item)}
                                                    disabled={currentUserId === item.id}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-[#FFF8EC] px-3 py-1.5 text-xs font-bold text-[#D4573A] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#D4573A] hover:text-white transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title={
                                                        currentUserId === item.id
                                                            ? 'Anda tidak dapat menghapus akun Anda sendiri'
                                                            : `Hapus pengguna ${item.name}`
                                                    }
                                                >
                                                    <Trash2 className="size-3" />
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-[#6B5646]">
                                            <img
                                                src="/empty_state.png"
                                                alt="Tidak ada pengguna"
                                                className="mx-auto mb-2.5 w-24 sm:w-28 h-auto object-contain select-none opacity-90"
                                            />
                                            <p className="font-['Fredoka',system-ui,sans-serif] font-bold text-base text-[#3B2A1E]">
                                                Tidak Ada Pengguna Ditemukan
                                            </p>
                                            <p className="text-xs font-semibold text-[#6B5646] mt-0.5">
                                                Coba sesuaikan kata kunci pencarian atau filter yang dipilih.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination & Per-Page Controls (Strictly No Icons) */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t-2 border-[#3B2A1E] bg-[#FFF8EC] px-4 py-3.5 sm:px-6">
                        {/* Summary & Per-Page Customizer */}
                        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-[#6B5646]">
                            <span>
                                Menampilkan <strong className="text-[#3B2A1E]">{users.from ?? 0}</strong> - <strong className="text-[#3B2A1E]">{users.to ?? 0}</strong> dari <strong className="text-[#3B2A1E]">{users.total}</strong> pengguna
                            </span>

                            <span className="text-[#3B2A1E]/30 hidden sm:inline">•</span>

                            <div className="flex items-center gap-1.5">
                                <span>Tampilkan:</span>
                                <select
                                    value={selectedPerPage}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                    className="h-8 rounded-xl border-2 border-[#3B2A1E] bg-white px-2.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] focus:outline-none cursor-pointer"
                                    title="Pilih jumlah baris data per halaman"
                                >
                                    <option value={5}>5 per halaman</option>
                                    <option value={10}>10 per halaman</option>
                                    <option value={20}>20 per halaman</option>
                                    <option value={50}>50 per halaman</option>
                                </select>
                            </div>
                        </div>

                        {/* Numbered Page Buttons: 1, 2, 3, 4, etc. (No Icons) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {users.links && users.links.length > 3 ? (
                                users.links.map((link, idx) => {
                                    const labelText = getPaginationLabel(link.label);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.get(
                                                    link.url,
                                                    {},
                                                    { preserveState: true, preserveScroll: true }
                                                )
                                            }
                                            className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition shadow-[1.5px_1.5px_0px_0px_#3B2A1E] active:translate-x-0.5 active:translate-y-0.5 ${
                                                link.active
                                                    ? 'border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E]'
                                                    : link.url
                                                      ? 'border-[#3B2A1E] bg-white text-[#3B2A1E] hover:bg-[#FFE27A] cursor-pointer'
                                                      : 'border-[#D9C8B4] bg-[#FFF8EC] text-[#6B5646]/40 cursor-not-allowed opacity-60 shadow-none'
                                            }`}
                                        >
                                            {labelText}
                                        </button>
                                    );
                                })
                            ) : (
                                <span className="rounded-xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-3.5 py-1.5 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]">
                                    Halaman 1
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Edit Pengguna */}
            {isEditModalOpen && editingUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => {
                            if (!isSubmittingEdit) {
                                setIsEditModalOpen(false);
                                setEditingUser(null);
                            }
                        }}
                    />
                    <div className="relative z-10 flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <div>
                                <h3 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                    Edit Data Pengguna
                                </h3>
                                <p className="text-[11px] font-semibold text-[#6B5646]">
                                    ID Pengguna #{editingUser.id}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmittingEdit) {
                                        setIsEditModalOpen(false);
                                        setEditingUser(null);
                                    }
                                }}
                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSaveEdit}
                            className="space-y-4 p-6 overflow-y-auto"
                        >
                            {editError && (
                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#D4573A] p-3.5 text-xs font-bold text-white shadow-[2px_2px_0px_0px_#3B2A1E]">
                                    {editError}
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={255}
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Raditya Pratama"
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Alamat Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    maxLength={255}
                                    value={editForm.email}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="nama@email.com"
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            {/* Jadikan Admin Card */}
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FFFDF9] p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <span className="text-xs font-bold text-[#3B2A1E]">
                                            Peran & Hak Akses Administrator
                                        </span>
                                        <p className="mt-1 text-[11px] leading-relaxed text-[#6B5646]">
                                            Aktifkan untuk memberikan akses penuh ke panel admin (Kelola AI, Kelola Pengguna, Simulasi, dan Kurasi Radar).
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_admin}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    is_admin: e.target.checked,
                                                })
                                            }
                                            disabled={
                                                currentUserId === editingUser.id &&
                                                editForm.is_admin
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-[#E5E0D8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#3B2A1E] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-[#3B2A1E] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFE27A] border-2 border-[#3B2A1E]"></div>
                                    </label>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-[#EFE3D0] pt-2.5">
                                    <span className="text-[11px] font-bold text-[#6B5646]">
                                        Status Peran:
                                    </span>
                                    {editForm.is_admin ? (
                                        <span className="inline-flex items-center rounded-md border border-[#3B2A1E] bg-[#FFE27A] px-2.5 py-0.5 text-[11px] font-black text-[#3B2A1E]">
                                            Administrator
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md border border-[#3B2A1E] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#6B5646]">
                                            Pengguna Biasa
                                        </span>
                                    )}
                                </div>

                                {currentUserId === editingUser.id && (
                                    <p className="mt-2 text-[10px] font-bold text-[#D4573A]">
                                        * Anda sedang mengedit akun Anda sendiri. Hak akses admin tidak dapat dicabut sendiri.
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingUser(null);
                                    }}
                                    className="cursor-pointer rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 py-2 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFF8EC] transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmittingEdit ||
                                        !editForm.name.trim() ||
                                        !editForm.email.trim()
                                    }
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-5 py-2 text-xs font-black text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FF9A3C] transition disabled:opacity-50"
                                >
                                    {isSubmittingEdit && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                    <span>Simpan Perubahan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Konfirmasi Hapus Pengguna */}
            {isDeleteModalOpen && deletingUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => {
                            if (!isSubmittingDelete) {
                                setIsDeleteModalOpen(false);
                                setDeletingUser(null);
                            }
                        }}
                    />
                    <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E]">
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <h3 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                Hapus Pengguna
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmittingDelete) {
                                        setIsDeleteModalOpen(false);
                                        setDeletingUser(null);
                                    }
                                }}
                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-[#3B2A1E]">
                                Apakah Anda yakin ingin menghapus akun pengguna{' '}
                                <strong className="text-[#3B2A1E] underline decoration-[#D4573A] decoration-2">
                                    {deletingUser.name}
                                </strong>{' '}
                                ({deletingUser.email})?
                            </p>
                            <p className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-3 text-xs font-semibold text-[#6B5646] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                Seluruh riwayat pemindaian, aktivitas, dan data akun ini akan dihapus secara permanen dari basis data.
                            </p>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setDeletingUser(null);
                                    }}
                                    className="cursor-pointer rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 py-2 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFF8EC] transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isSubmittingDelete}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-[#D4573A] px-5 py-2 text-xs font-black text-white shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#B73D22] transition disabled:opacity-50"
                                >
                                    {isSubmittingDelete && (
                                        <Loader2 className="size-4 animate-spin text-white" />
                                    )}
                                    <span>Hapus Pengguna</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
