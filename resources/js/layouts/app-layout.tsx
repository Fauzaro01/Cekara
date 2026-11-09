import { useState, useEffect, type PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Home,
    BookOpen,
    LifeBuoy,
    Radio,
    Users,
    LayoutDashboard,
    Settings,
    User,
    LogOut,
    Menu,
    X,
    ExternalLink,
    FileText,
    Shield,
    ShieldCheck,
} from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';
import OceanWaveDivider from '@/components/ocean-wave-divider';
import AuthSwitchToggle from '@/components/auth-switch-toggle';
import type { Auth } from '@/types/auth';

interface SharedProps {
    auth: Auth;
    [key: string]: unknown;
}

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<SharedProps>().props;
    const { url } = usePage();
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
    const [termsModal, setTermsModal] = useState<'terms' | 'privacy' | null>(null);

    // Close drawers on route change
    useEffect(() => {
        setSidebarMobileOpen(false);
        setMobileMenuOpen(false);
    }, [url]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setTermsModal(null);
                setSidebarMobileOpen(false);
            }
        };
        if (termsModal || sidebarMobileOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            window.lenisInstance?.stop();
        } else {
            document.body.style.overflow = '';
            window.lenisInstance?.start();
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            window.lenisInstance?.start();
        };
    }, [termsModal, sidebarMobileOpen]);

    const isGuestActive = (path: string) => {
        if (path === '/') {
            return url === '/';
        }
        return url.startsWith(path);
    };

    const isAuthActive = (path: string) => {
        if (path === '/dashboard') {
            return url === '/dashboard' || url.startsWith('/dashboard');
        }
        if (path === '/#cek-pesan') {
            return url === '/' || url.startsWith('/#cek-pesan');
        }
        return url.startsWith(path);
    };

    const guestNavLinks = [
        { href: '/', label: 'Beranda', icon: Home },
        { href: '/simulasi', label: 'Belajar', icon: BookOpen },
        { href: '/tanggap-darurat', label: 'Bertindak', icon: LifeBuoy },
        { href: '/radar', label: 'Komunitas', icon: Radio },
        { href: '/panduan-keluarga', label: 'Panduan Keluarga', icon: Users },
    ];

    const authNavItems = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            badge: null,
            badgeColor: null,
        },
        {
            href: '/#cek-pesan',
            label: 'Cek Pesan',
            icon: Shield,
            badge: 'AI',
            badgeColor: 'bg-[#8ECDF0] text-[#3B2A1E]',
        },
        {
            href: '/simulasi',
            label: 'Latihan Simulasi',
            icon: BookOpen,
            badge: 'Praktik',
            badgeColor: 'bg-[#FFE27A] text-[#3B2A1E]',
        },
        {
            href: '/radar',
            label: 'Radar Komunitas',
            icon: Radio,
            badge: 'Live',
            badgeColor: 'bg-[#FF9A3C] text-[#3B2A1E]',
        },
        {
            href: '/panduan-keluarga',
            label: 'Panduan Keluarga',
            icon: Users,
            badge: null,
            badgeColor: null,
        },
        {
            href: '/tanggap-darurat',
            label: 'Tanggap Darurat',
            icon: LifeBuoy,
            badge: 'Siaga',
            badgeColor: 'bg-[#D4573A] text-white',
        },
    ];

    const adminNavItems = [
        {
            href: '/admin/llm-providers',
            label: 'Kelola AI / LLM',
            icon: Settings,
            badge: 'Admin',
            badgeColor: 'bg-[#FFE27A] text-[#3B2A1E]',
        },
    ];

    // Shared Sidebar Component for Logged-In User
    const renderSidebarContent = (onNavigate?: () => void) => {
        if (!user) return null;
        return (
            <div className="flex h-full flex-col justify-between overflow-y-auto">
                <div>
                    {/* Brand Header */}
                    <div className="border-b-2 border-[#EFE3D0] p-6 pb-5">
                        <Link
                            href="/dashboard"
                            onClick={onNavigate}
                            className="group flex items-center gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-[#3B2A1E]"
                        >
                            <img
                                src="/logotr.png"
                                alt="Logo Cekara"
                                className="size-11 shrink-0 object-contain transition group-hover:scale-105 sm:size-12"
                            />
                            <div>
                                <span className="block font-['Fredoka',system-ui,sans-serif] text-2xl leading-none font-bold tracking-tight text-[#3B2A1E]">
                                    CEKARA
                                </span>
                                <span className="mt-1 block text-xs leading-tight font-bold text-[#6B5646]">
                                    Cek dulu sebelum percaya
                                </span>
                            </div>
                        </Link>

                        {/* Guardian Status Pill */}
                        <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A]/60 px-3.5 py-2 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]">
                            <ShieldCheck className="size-4 shrink-0 text-[#3B2A1E]" />
                            <span className="truncate">Guardian Anti-Scam</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="px-4 py-4 space-y-1.5">
                        <div className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#6B5646]/80 font-['Fredoka',system-ui,sans-serif]">
                            Navigasi Guardian
                        </div>

                        {authNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isAuthActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={`flex items-center justify-between rounded-2xl border-2 px-3.5 py-2.5 text-sm font-bold transition-all duration-150 ${
                                        active
                                            ? 'border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                            : 'border-transparent text-[#6B5646] hover:border-[#3B2A1E] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon
                                            className={`size-5 shrink-0 ${
                                                active ? 'opacity-100' : 'opacity-80'
                                            }`}
                                            strokeWidth={2}
                                        />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span
                                            className={`rounded-lg border border-[#3B2A1E] px-1.5 py-0.5 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#3B2A1E] ${
                                                item.badgeColor || 'bg-[#8ECDF0] text-[#3B2A1E]'
                                            }`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Admin Navigation */}
                        {user.is_admin && (
                            <>
                                <div className="pt-4 px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#6B5646]/80 font-['Fredoka',system-ui,sans-serif]">
                                    Administrasi
                                </div>
                                {adminNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isAuthActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={`flex items-center justify-between rounded-2xl border-2 px-3.5 py-2.5 text-sm font-bold transition-all duration-150 ${
                                                active
                                                    ? 'border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                                    : 'border-transparent text-[#6B5646] hover:border-[#3B2A1E] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon
                                                    className="size-5 shrink-0 opacity-80"
                                                    strokeWidth={2}
                                                />
                                                <span>{item.label}</span>
                                            </div>
                                            <span className="rounded-lg border border-[#3B2A1E] bg-[#FFE27A] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]">
                                                {item.badge}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom User Profile Card & Logout */}
                <div className="border-t-2 border-[#EFE3D0] bg-[#FFF8EC] p-4 space-y-2">
                    <Link
                        href="/profile"
                        onClick={onNavigate}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 transition-all duration-150 ${
                            isAuthActive('/profile')
                                ? 'border-[#3B2A1E] bg-[#8ECDF0] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                : 'border-[#3B2A1E] bg-white hover:bg-[#FFE27A] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                        }`}
                        title="Pengaturan Profil Akun"
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] font-extrabold text-[#3B2A1E]">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-[#3B2A1E]">
                                {user.name}
                            </div>
                            <div className="truncate text-xs font-semibold text-[#6B5646]">
                                {user.email}
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        onClick={onNavigate}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#D4573A] bg-white py-2.5 text-xs font-bold text-[#D4573A] shadow-[2px_2px_0px_0px_#D4573A] transition hover:bg-[#D4573A] hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        title="Keluar dari akun Anda"
                    >
                        <LogOut className="size-4" strokeWidth={2} />
                        <span>Keluar Akun</span>
                    </Link>
                </div>
            </div>
        );
    };

    // Shared Footer
    const renderFooter = () => (
        <footer className="relative bg-transparent text-[#3B2A1E]">
            {/* Garis Gelombang Laut Organik yang Naik-Turun */}
            <OceanWaveDivider fillColor="#D6EDFC" />

            <div className="bg-[#D6EDFC] dark:bg-[#0c1f2e] transition-colors">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
                    <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-8">
                        {/* Left Navlinks: Eksplorasi & Edukasi */}
                        <div className="space-y-4 md:col-span-4 md:text-left">
                            <span className="block font-['Fredoka',system-ui,sans-serif] text-sm sm:text-base font-extrabold tracking-wider text-[#3B2A1E] uppercase">
                                Navigasi Cepat
                            </span>
                            <ul className="space-y-3.5 text-[15px] sm:text-base font-bold">
                                <li>
                                    <Link
                                        href="/"
                                        className="text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                    >
                                        Pemeriksa Pesan (Beranda)
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/simulasi"
                                        className="text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                    >
                                        Simulasi Interaktif (Belajar)
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/radar"
                                        className="text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                    >
                                        Radar Modus (Komunitas)
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/panduan-keluarga"
                                        className="text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                    >
                                        Panduan Lindungi Keluarga
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Center Brand: Logo, App Name, Tagline & Info */}
                        <div className="flex flex-col items-center text-center md:col-span-4">
                            <Link
                                href="/"
                                className="group inline-flex flex-col items-center transition focus:outline-none"
                            >
                                <div className="mb-3 flex size-18 items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] shadow-[3.5px_3.5px_0px_0px_#3B2A1E] transition-transform group-hover:scale-105">
                                    <img
                                        src="/logotr.png"
                                        alt="Logo Cekara"
                                        className="size-13 object-contain"
                                    />
                                </div>
                                <span className="font-['Fredoka',system-ui,sans-serif] text-3xl font-extrabold tracking-tight text-[#3B2A1E] sm:text-4xl">
                                    CEKARA
                                </span>
                                <span className="mt-1 text-sm sm:text-base font-extrabold text-[#E06812]">
                                    Cek dulu sebelum percaya
                                </span>
                            </Link>

                            <p className="mt-3.5 max-w-sm text-sm sm:text-[15px] leading-relaxed font-semibold text-[#4A3B32]">
                                Platform edukasi anti-scam & perlindungan
                                digital cerdas untuk pelajar, keluarga, dan
                                masyarakat Indonesia.
                            </p>

                            <div className="mt-4.5 inline-flex items-center rounded-full border-2 border-[#3B2A1E] bg-[#FFF8EC] px-4 py-1.5 text-xs sm:text-sm font-extrabold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                <span>Inisiatif MIT-Week 2026</span>
                            </div>
                        </div>

                        {/* Right Navlinks: Aksi Aman & Kanal Pengaduan Resmi */}
                        <div className="space-y-4 md:col-span-4 md:text-right">
                            <span className="block font-['Fredoka',system-ui,sans-serif] text-sm sm:text-base font-extrabold tracking-wider text-[#3B2A1E] uppercase">
                                Tanggap & Bantuan Resmi
                            </span>
                            <ul className="space-y-3.5 text-[15px] sm:text-base font-bold md:flex md:flex-col md:items-end">
                                <li>
                                    <Link
                                        href="/tanggap-darurat"
                                        className="inline-flex items-center gap-2 text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                    >
                                        <span>Tanggap Darurat Akun</span>
                                        <ExternalLink className="size-4 opacity-80" />
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="https://iasc.ojk.go.id"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                        title="Indonesia Anti-Scam Centre"
                                    >
                                        <span>
                                            Lapor IASC OJK (iasc.ojk.go.id)
                                        </span>
                                        <ExternalLink className="size-4 opacity-80" />
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://cekrekening.id"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                        title="Portal Resmi Cek Rekening Kominfo"
                                    >
                                        <span>
                                            Cek Rekening Resmi Kominfo
                                        </span>
                                        <ExternalLink className="size-4 opacity-80" />
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="tel:157"
                                        className="inline-flex items-center gap-2 text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                        title="Kontak Layanan Otoritas Jasa Keuangan"
                                    >
                                        <span>
                                            Kontak OJK 157 (Bebas Pulsa)
                                        </span>
                                        <ExternalLink className="size-4 opacity-80" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Sub-footer */}
                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t-2 border-[#3B2A1E]/15 pt-8 text-xs sm:text-sm font-semibold text-[#4A3B32] sm:flex-row">
                        <div>
                            © {new Date().getFullYear()}{' '}
                            <strong className="text-[#3B2A1E] font-bold">
                                CEKARA
                            </strong>
                            . Seluruh hak cipta dilindungi.
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-bold text-[#3B2A1E]/80">
                            <Link
                                href="/panduan-keluarga"
                                className="hover:text-[#E06812] transition"
                            >
                                Literasi Keluarga
                            </Link>
                            <span>•</span>
                            <Link
                                href="/tanggap-darurat"
                                className="hover:text-[#E06812] transition"
                            >
                                Panduan Keamanan
                            </Link>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={() => setTermsModal('terms')}
                                className="cursor-pointer hover:text-[#E06812] transition underline-offset-4 hover:underline"
                            >
                                Ketentuan Layanan
                            </button>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={() => setTermsModal('privacy')}
                                className="cursor-pointer hover:text-[#E06812] transition underline-offset-4 hover:underline"
                            >
                                Kebijakan Privasi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );

    // Shared Terms & Privacy Modal
    const renderTermsModal = () => (
        <>
            {termsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2A1E]/50 backdrop-blur-xs animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="terms-modal-title"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setTermsModal(null)}
                    />

                    <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] px-6 py-4 bg-[#FFF8EC]">
                            <div className="flex items-center gap-2.5">
                                <FileText className="size-5 text-[#E06812]" />
                                <h2
                                    id="terms-modal-title"
                                    className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]"
                                >
                                    {termsModal === 'terms'
                                        ? 'Ketentuan Layanan CEKARA'
                                        : 'Kebijakan Privasi CEKARA'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTermsModal(null)}
                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                                aria-label="Tutup jendela modal"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Modal Tabs Switcher */}
                        <div className="flex border-b-2 border-[#EFE3D0] bg-[#FFF8EC]/60 px-6 pt-2">
                            <button
                                type="button"
                                onClick={() => setTermsModal('terms')}
                                className={`cursor-pointer px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                                    termsModal === 'terms'
                                        ? 'border-[#3B2A1E] text-[#3B2A1E] bg-white rounded-t-xl border-t-2 border-x-2'
                                        : 'border-transparent text-[#6B5646] hover:text-[#3B2A1E]'
                                }`}
                            >
                                Ketentuan Layanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setTermsModal('privacy')}
                                className={`cursor-pointer px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                                    termsModal === 'privacy'
                                        ? 'border-[#3B2A1E] text-[#3B2A1E] bg-white rounded-t-xl border-t-2 border-x-2'
                                        : 'border-transparent text-[#6B5646] hover:text-[#3B2A1E]'
                                }`}
                            >
                                Kebijakan Privasi
                            </button>
                        </div>

                        {/* Modal Body Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-[#3B2A1E]">
                            {termsModal === 'terms' ? (
                                <>
                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#E06812]">
                                            1. Tujuan Edukasi & Bantuan Cepat
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            CEKARA hadir sebagai platform literasi dan asistensi perlindungan penipuan digital. Hasil analisis kecerdasan buatan (AI) merupakan indikasi awal untuk membantu kewaspadaan dan bukan merupakan nasihat hukum formal.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#E06812]">
                                            2. Tanggung Jawab Pengguna
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            Pengguna bertanggung jawab penuh atas segala tindakan transaksi finansial, panggilan, atau verifikasi data pribadi yang dilakukan di luar platform CEKARA.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#E06812]">
                                            3. Partisipasi Komunitas Guardian
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            Data laporan modus pada Radar Komunitas ditinjau secara berkala. Pengguna dilarang mengirimkan tuduhan palsu, konten kebencian, atau informasi pribadi pihak ketiga tanpa izin.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#0284C7]">
                                            1. Privasi Analisis Pesan
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            Teks pesan, tangkapan layar, atau tautan yang kamu periksa hanya diproses sementara untuk deteksi risiko instan dan tidak dikomersialkan kepada pihak ketiga.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#0284C7]">
                                            2. Tanpa Kredensial Rahasia
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            CEKARA tidak pernah meminta, merekam, atau menyimpan informasi rahasia seperti PIN ATM/e-wallet, kata sandi m-banking, CVV kartu debit/kredit, atau kode OTP.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#0284C7]">
                                            3. Anonimitas Laporan Komunitas
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            Laporan modus penipuan yang dibagikan pada Radar Komunitas ditampilkan secara anonim untuk melindungi privasi dan identitas pelapor.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer Button */}
                        <div className="mt-6 flex justify-end border-t-2 border-[#EFE3D0] p-6 pt-4">
                            <button
                                type="button"
                                onClick={() => setTermsModal(null)}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-6 py-2.5 text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:bg-[#FFE27A] cursor-pointer"
                            >
                                Saya Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    // =========================================================================
    // CASE 1: LOGGED IN USER (Dedicated Sidebar Layout - No Top Header Nav)
    // =========================================================================
    if (user) {
        return (
            <div className="flex min-h-screen flex-col lg:flex-row bg-[#FFF8EC] font-['Nunito',system-ui,sans-serif] text-[#3B2A1E]">
                {/* Mobile Top Navigation Bar (Only on small screens) */}
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC]/95 px-4 backdrop-blur-md lg:hidden">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <img
                            src="/logotr.png"
                            alt="Logo Cekara"
                            className="size-9 object-contain"
                        />
                        <span className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold tracking-tight text-[#3B2A1E]">
                            CEKARA
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/profile"
                            className="flex size-10 items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-xs font-extrabold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            title="Profil Akun"
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </Link>
                        <button
                            type="button"
                            onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
                            className="flex size-10 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            aria-label="Buka navigasi sidebar"
                        >
                            {sidebarMobileOpen ? (
                                <X className="size-5" strokeWidth={2.5} />
                            ) : (
                                <Menu className="size-5" strokeWidth={2.5} />
                            )}
                        </button>
                    </div>
                </header>

                {/* Mobile Drawer Overlay */}
                {sidebarMobileOpen && (
                    <div
                        className="fixed inset-0 z-50 flex lg:hidden"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            className="fixed inset-0 bg-[#3B2A1E]/50 backdrop-blur-xs transition-opacity animate-in fade-in"
                            onClick={() => setSidebarMobileOpen(false)}
                        />
                        <aside className="relative flex w-72 max-w-[85vw] flex-col justify-between border-r-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_0px_0px_0px_#3B2A1E] animate-in slide-in-from-left duration-200 z-10">
                            {renderSidebarContent(() => setSidebarMobileOpen(false))}
                        </aside>
                    </div>
                )}

                {/* Desktop Sticky Sidebar */}
                <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r-2 border-[#EFE3D0] bg-[#FFF8EC] lg:flex flex-col justify-between">
                    {renderSidebarContent()}
                </aside>

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col min-w-0">
                    <main className="flex-1 min-w-0">{children}</main>
                    {renderFooter()}
                </div>

                {renderTermsModal()}
            </div>
        );
    }

    // =========================================================================
    // CASE 2: GUEST / PUBLIC VISITOR (Top Sticky Header Navigation)
    // =========================================================================
    return (
        <div className="flex min-h-screen flex-col bg-[#FFF8EC] font-['Nunito',system-ui,sans-serif] text-[#3B2A1E]">
            {/* Warm School Canteen Sticky Header */}
            <header className="sticky top-0 z-40 border-b-2 border-[#EFE3D0] bg-[#FFF8EC]/95 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:h-22 sm:px-8">
                    {/* Brand Logo & Desktop Nav */}
                    <div className="flex items-center gap-6 lg:gap-10">
                        <Link
                            href="/"
                            className="group flex items-center gap-3 rounded-2xl p-1 font-bold tracking-tight text-[#3B2A1E] transition focus-visible:outline-2 focus-visible:outline-[#3B2A1E]"
                        >
                            <img
                                src="/logotr.png"
                                alt="Logo Cekara"
                                className="size-11 shrink-0 object-contain transition group-hover:scale-105 sm:size-12"
                            />
                            <div>
                                <span className="block font-['Fredoka',system-ui,sans-serif] text-2xl leading-none font-bold tracking-tight text-[#3B2A1E] sm:text-3xl">
                                    CEKARA
                                </span>
                                <span className="mt-1 hidden text-xs leading-tight font-semibold text-[#6B5646] sm:block sm:text-[13px]">
                                    Cek dulu sebelum percaya
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-1.5 sm:gap-2 lg:flex">
                            {guestNavLinks.map((item) => {
                                const Icon = item.icon;
                                const active = isGuestActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex h-11 items-center gap-2 rounded-2xl border-2 px-3.5 text-sm font-bold transition-colors duration-150 sm:h-12 sm:px-4 sm:text-[15px] ${
                                            active
                                                ? 'border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                                : 'border-transparent text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                        }`}
                                    >
                                        <Icon
                                            className={`size-[18px] ${
                                                active
                                                    ? 'opacity-100'
                                                    : 'opacity-75'
                                            }`}
                                            strokeWidth={2}
                                        />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right Toolbar */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="hidden items-center sm:flex">
                            <AuthSwitchToggle variant="header" />
                        </div>

                        {/* Mobile Hamburger Toggle */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex size-11 min-h-[44px] cursor-pointer items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] transition hover:bg-[#FFE27A] lg:hidden"
                            aria-label="Toggle navigation menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="size-6" strokeWidth={2} />
                            ) : (
                                <Menu className="size-6" strokeWidth={2} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer for Guests */}
                {mobileMenuOpen && (
                    <div className="border-t-2 border-[#EFE3D0] bg-[#FFF8EC] px-5 py-5 lg:hidden">
                        <nav className="flex flex-col gap-2">
                            {guestNavLinks.map((item) => {
                                const Icon = item.icon;
                                const active = isGuestActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold transition-all ${
                                            active
                                                ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                                : 'text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                        }`}
                                    >
                                        <Icon
                                            className="size-5 opacity-80"
                                            strokeWidth={2}
                                        />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Mobile Auth Actions */}
                        <div className="mt-5 border-t-2 border-[#EFE3D0] pt-5">
                            <div className="w-full pt-1">
                                <AuthSwitchToggle variant="mobile" />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1">{children}</main>

            {renderFooter()}

            {renderTermsModal()}
        </div>
    );
}
