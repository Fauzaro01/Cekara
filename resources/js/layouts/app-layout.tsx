import { useState, useEffect, useRef, type PropsWithChildren } from 'react';
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
    ChevronDown,
    ChevronUp,
    ArrowUpRight,
} from 'lucide-react';
import OceanWaveDivider from '@/components/ocean-wave-divider';
import AuthSwitchToggle from '@/components/auth-switch-toggle';
import { ToastContainer } from '@/components/ui/toast';
import type { Auth } from '@/types/auth';

interface SharedProps {
    auth: Auth;
    [key: string]: unknown;
}

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<SharedProps>().props;
    const { url } = usePage();
    const user = auth?.user;
    const isInitialMount = useRef(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isBottomBarOpen, setIsBottomBarOpen] = useState(true);
    const [accountDrawerOpen, setAccountDrawerOpen] = useState(() => {
        if (typeof window === 'undefined') return false;
        return (
            sessionStorage.getItem('cekara_account_drawer_open') === 'true' ||
            window.location.hash === '#akun'
        );
    });
    const [termsModal, setTermsModal] = useState<'terms' | 'privacy' | null>(() => {
        if (typeof window === 'undefined') return null;
        const stored = sessionStorage.getItem('cekara_terms_modal');
        if (stored === 'terms' || stored === 'privacy') return stored;
        if (window.location.hash === '#terms') return 'terms';
        if (window.location.hash === '#privacy') return 'privacy';
        return null;
    });

    // Close drawers on route change (ignore initial mount/reload)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setAccountDrawerOpen(false);
        setTermsModal(null);
        setMobileMenuOpen(false);
    }, [url]);

    // Keep sessionStorage and URL hash in sync with accountDrawerOpen
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (accountDrawerOpen) {
            sessionStorage.setItem('cekara_account_drawer_open', 'true');
            if (window.location.hash !== '#akun') {
                window.history.replaceState(
                    null,
                    '',
                    window.location.pathname + window.location.search + '#akun'
                );
            }
        } else {
            sessionStorage.removeItem('cekara_account_drawer_open');
            if (window.location.hash === '#akun') {
                window.history.replaceState(
                    null,
                    '',
                    window.location.pathname + window.location.search
                );
            }
        }
    }, [accountDrawerOpen]);

    // Keep sessionStorage and URL hash in sync with termsModal
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (termsModal) {
            sessionStorage.setItem('cekara_terms_modal', termsModal);
            if (window.location.hash !== `#${termsModal}`) {
                window.history.replaceState(
                    null,
                    '',
                    window.location.pathname + window.location.search + `#${termsModal}`
                );
            }
        } else {
            sessionStorage.removeItem('cekara_terms_modal');
            if (window.location.hash === '#terms' || window.location.hash === '#privacy') {
                window.history.replaceState(
                    null,
                    '',
                    window.location.pathname + window.location.search
                );
            }
        }
    }, [termsModal]);

    // Handle browser back/forward history navigation for modal hash
    useEffect(() => {
        const handlePopState = () => {
            const hasAkunHash = window.location.hash === '#akun';
            if (hasAkunHash !== accountDrawerOpen) {
                setAccountDrawerOpen(hasAkunHash);
            }

            const currentHash = window.location.hash;
            if (currentHash === '#terms' && termsModal !== 'terms') {
                setTermsModal('terms');
            } else if (currentHash === '#privacy' && termsModal !== 'privacy') {
                setTermsModal('privacy');
            } else if (!currentHash.includes('terms') && !currentHash.includes('privacy') && termsModal !== null) {
                setTermsModal(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [accountDrawerOpen, termsModal]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setTermsModal(null);
                setAccountDrawerOpen(false);
            }
        };
        if (termsModal || accountDrawerOpen) {
            window.addEventListener('keydown', handleKeyDown);
            window.lenisInstance?.stop();
        } else {
            window.lenisInstance?.start();
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.lenisInstance?.start();
        };
    }, [termsModal, accountDrawerOpen]);

    const isLandingPage = url === '/' || url.startsWith('/?');

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
        return url.startsWith(path);
    };

    const guestNavLinks = [
        { href: '/', label: 'Beranda', icon: Home },
        { href: '/simulasi', label: 'Belajar', icon: BookOpen },
        { href: '/tanggap-darurat', label: 'Bertindak', icon: LifeBuoy },
        { href: '/komunitas', label: 'Komunitas', icon: Users },
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
            href: '/simulasi',
            label: 'Latihan Simulasi',
            icon: BookOpen,
            badge: 'Praktik',
            badgeColor: 'bg-[#FFE27A] text-[#3B2A1E]',
        },
        {
            href: '/komunitas',
            label: 'Komunitas',
            icon: Users,
            badge: 'Live',
            badgeColor: 'bg-[#FF9A3C] text-[#3B2A1E]',
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

    // Account Drawer Modal
    const renderAccountDrawer = () => {
        if (!user || !accountDrawerOpen) return null;

        return (
            <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#3B2A1E]/50 animate-in fade-in duration-150"
                role="dialog"
                aria-modal="true"
                aria-labelledby="account-drawer-title"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
            >
                <div
                    className="fixed inset-0"
                    onClick={() => setAccountDrawerOpen(false)}
                />

                <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] p-6 shadow-[6px_6px_0px_0px_#3B2A1E] z-10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150">
                    {/* Header Profile */}
                    <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="size-12 rounded-full object-cover border-2 border-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]"
                                    />
                                ) : (
                                    <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#3B2A1E] bg-[#FFE27A] text-lg font-black text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3
                                    id="account-drawer-title"
                                    className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E] truncate max-w-[200px]"
                                >
                                    {user.name}
                                </h3>
                                <p className="text-xs text-[#6B5646] font-medium truncate max-w-[200px]">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAccountDrawerOpen(false)}
                            className="flex size-8 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            aria-label="Tutup menu akun"
                        >
                            <X className="size-4" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Navigation links inside Drawer */}
                    <div className="space-y-2 mb-5">
                        <Link
                            href="/profile"
                            onClick={() => setAccountDrawerOpen(false)}
                            className={`group flex items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                                isAuthActive('/profile')
                                    ? 'border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                    : 'border-[#3B2A1E] bg-white text-[#3B2A1E] hover:bg-[#FFE27A] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <User className="size-4.5" />
                                <span>Pengaturan Profil</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#6B5646]">
                                Buka
                                <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                            </span>
                        </Link>

                        <Link
                            href="/panduan-keluarga"
                            onClick={() => setAccountDrawerOpen(false)}
                            className={`group flex items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                                isAuthActive('/panduan-keluarga')
                                    ? 'border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                    : 'border-[#3B2A1E] bg-white text-[#3B2A1E] hover:bg-[#FFE27A] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Users className="size-4.5" />
                                <span>Panduan Literasi Keluarga</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#6B5646]">
                                Buka
                                <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                setAccountDrawerOpen(false);
                                setTermsModal('privacy');
                            }}
                            className="group flex w-full items-center justify-between rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 py-2.5 text-sm font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] transition-all duration-150 hover:bg-[#FFE27A] cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="size-4.5" />
                                <span>Pengaturan Privasi dan Keamanan</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#6B5646]">
                                Buka
                                <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                            </span>
                        </button>

                        {user.is_admin && (
                            <Link
                                href="/admin/llm-providers"
                                onClick={() => setAccountDrawerOpen(false)}
                                className={`flex items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                                    isAuthActive('/admin/llm-providers')
                                        ? 'border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                        : 'border-[#3B2A1E] bg-white text-[#3B2A1E] hover:bg-[#FFE27A] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="size-4.5" />
                                    <span>Kelola AI / LLM</span>
                                </div>
                                <span className="rounded-lg border border-[#3B2A1E] bg-[#FFE27A] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#3B2A1E]">
                                    Admin
                                </span>
                            </Link>
                        )}
                    </div>

                    {/* Logout Button */}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        onClick={() => setAccountDrawerOpen(false)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#D4573A] bg-white py-2.5 text-sm font-bold text-[#D4573A] shadow-[2px_2px_0px_0px_#D4573A] transition hover:bg-[#D4573A] hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                        <LogOut className="size-4" strokeWidth={2} />
                        <span>Keluar Akun</span>
                    </Link>

                    {/* Footer Legal Links inside Drawer */}
                    <div className="mt-4 pt-3 border-t-2 border-[#EFE3D0] flex items-center justify-end text-[11px] font-bold text-[#6B5646]">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAccountDrawerOpen(false);
                                    setTermsModal('terms');
                                }}
                                className="hover:text-[#E06812] transition cursor-pointer"
                            >
                                Ketentuan Layanan
                            </button>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setAccountDrawerOpen(false);
                                    setTermsModal('privacy');
                                }}
                                className="hover:text-[#E06812] transition cursor-pointer"
                            >
                                Kebijakan Privasi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modern Bottom Bar Navigation
    const renderBottomBar = () => {
        if (!user) return null;

        return (
            <>
                {/* Floating Tab When Minimized / Closed */}
                {!isBottomBarOpen && (
                    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
                        <button
                            type="button"
                            onClick={() => setIsBottomBarOpen(true)}
                            className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-[#3B2A1E] bg-[#FFE27A] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E] transition-all hover:bg-[#FF9A3C] hover:scale-105 active:translate-y-0.5 cursor-pointer animate-in fade-in zoom-in-95 duration-200"
                            title="Buka Navigasi"
                        >
                            <ChevronUp className="size-4" strokeWidth={3} />
                            <span>Buka Navigasi</span>
                        </button>
                    </div>
                )}

                {/* Main Bottom Bar When Open */}
                {isBottomBarOpen && (
                    <div className="fixed bottom-3 sm:bottom-4 inset-x-0 z-40 flex flex-col items-center pointer-events-none px-3 sm:px-4">
                        {/* Toggle Tab on top of bar */}
                        <button
                            type="button"
                            onClick={() => setIsBottomBarOpen(false)}
                            className="pointer-events-auto mb-1 flex items-center gap-1 rounded-full border-2 border-[#3B2A1E] bg-[#FFF8EC] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#6B5646] shadow-[1px_1px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] hover:text-[#3B2A1E] transition active:scale-95 cursor-pointer"
                            title="Sembunyikan Navigasi"
                        >
                            <ChevronDown className="size-3" strokeWidth={2.5} />
                            <span>Tutup</span>
                        </button>

                        {/* Navigation Dock */}
                        <nav
                            aria-label="Navigasi Guardian"
                            className="pointer-events-auto flex w-full max-w-md items-center justify-around gap-1 sm:gap-2 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-[#3B2A1E] bg-[#FFF8EC]/95 p-1.5 sm:p-2 shadow-[4px_4px_0px_0px_#3B2A1E] backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200"
                        >
                            {/* Dashboard */}
                            <Link
                                href="/dashboard"
                                className={`flex flex-1 flex-col items-center justify-center rounded-xl sm:rounded-2xl py-1.5 px-1 transition-all duration-150 ${
                                    isAuthActive('/dashboard')
                                        ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                        : 'border-2 border-transparent text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                }`}
                            >
                                <LayoutDashboard className="size-5 shrink-0" strokeWidth={2.2} />
                                <span className="mt-0.5 text-[11px] font-bold leading-tight">
                                    Dashboard
                                </span>
                            </Link>


                            {/* Latihan Simulasi */}
                            <Link
                                href="/simulasi"
                                className={`relative flex flex-1 flex-col items-center justify-center rounded-xl sm:rounded-2xl py-1.5 px-1 transition-all duration-150 ${
                                    isAuthActive('/simulasi')
                                        ? 'border-2 border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                        : 'border-2 border-transparent text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                }`}
                            >
                                <div className="relative">
                                    <BookOpen className="size-5 shrink-0" strokeWidth={2.2} />
                                    <span className="absolute -top-1 -right-1.5 size-2 rounded-full border border-[#3B2A1E] bg-[#FF9A3C]" />
                                </div>
                                <span className="mt-0.5 text-[11px] font-bold leading-tight">
                                    Simulasi
                                </span>
                            </Link>

                            {/* Komunitas */}
                            <Link
                                href="/komunitas"
                                className={`relative flex flex-1 flex-col items-center justify-center rounded-xl sm:rounded-2xl py-1.5 px-1 transition-all duration-150 ${
                                    isAuthActive('/komunitas')
                                        ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                        : 'border-2 border-transparent text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                }`}
                            >
                                <div className="relative">
                                    <Users className="size-5 shrink-0" strokeWidth={2.2} />
                                    <span className="absolute -top-1 -right-1.5 flex size-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4573A] opacity-75" />
                                        <span className="relative inline-flex size-2 rounded-full border border-[#3B2A1E] bg-[#D4573A]" />
                                    </span>
                                </div>
                                <span className="mt-0.5 text-[11px] font-bold leading-tight">
                                    Komunitas
                                </span>
                            </Link>

                            {/* Akun / Menu */}
                            <button
                                type="button"
                                onClick={() => setAccountDrawerOpen(true)}
                                className={`flex flex-1 flex-col items-center justify-center rounded-xl sm:rounded-2xl py-1.5 px-1 transition-all duration-150 cursor-pointer ${
                                    accountDrawerOpen || isAuthActive('/profile')
                                        ? 'border-2 border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                        : 'border-2 border-transparent text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                }`}
                            >
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="size-5 rounded-full object-cover border border-[#3B2A1E]"
                                    />
                                ) : (
                                    <div className="flex size-5 items-center justify-center rounded-full border border-[#3B2A1E] bg-[#FFE27A] text-[10px] font-black text-[#3B2A1E]">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="mt-0.5 text-[11px] font-bold leading-tight">
                                    Akun
                                </span>
                            </button>
                        </nav>
                    </div>
                )}
            </>
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
                                        href="/komunitas"
                                        className="text-[#3B2A1E]/85 transition hover:text-[#E06812]"
                                    >
                                        Komunitas Pemberantas Kejahatan
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
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2A1E]/50 animate-in fade-in duration-150"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="terms-modal-title"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
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
    // CASE 1: LOGGED IN USER (Bottom Bar & Clean Full-Width Layout - ZERO Top Navbar)
    // =========================================================================
    if (user) {
        return (
            <div className="flex min-h-screen flex-col bg-[#FFF8EC] font-['Nunito',system-ui,sans-serif] text-[#3B2A1E]">
                {/* Main Content Area with Bottom Padding for floating dock */}
                <div
                    className={`flex flex-1 flex-col min-w-0 transition-all duration-200 ${
                        isBottomBarOpen ? 'pb-24 sm:pb-28' : 'pb-10'
                    }`}
                >
                    <main className="flex-1 min-w-0">{children}</main>
                    {/* Halaman in-app setelah login (dashboard, simulasi, komunitas, profil, dll) tidak menampilkan footer marketing */}
                    {isLandingPage && renderFooter()}
                </div>

                {/* Account Drawer Modal */}
                {renderAccountDrawer()}

                {/* Bottom Bar Navigation */}
                {renderBottomBar()}

                {renderTermsModal()}

                <ToastContainer />
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

            <ToastContainer />
        </div>
    );
}
