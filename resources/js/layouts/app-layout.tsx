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
    const [termsModal, setTermsModal] = useState<'terms' | 'privacy' | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setTermsModal(null);
            }
        };
        if (termsModal) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            window.lenisInstance?.stop();
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            window.lenisInstance?.start();
        };
    }, [termsModal]);

    const isActive = (path: string) => {
        if (path === '/') {
            return url === '/';
        }
        return url.startsWith(path);
    };

    const navLinks = [
        { href: '/', label: 'Beranda', icon: Home },
        { href: '/simulasi', label: 'Belajar', icon: BookOpen },
        { href: '/tanggap-darurat', label: 'Bertindak', icon: LifeBuoy },
        { href: '/radar', label: 'Komunitas', icon: Radio },
        { href: '/panduan-keluarga', label: 'Panduan Keluarga', icon: Users },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#FFF8EC] font-['Nunito',system-ui,sans-serif] text-[#3B2A1E]">
            {/* Warm School Canteen Sticky Header - Enriched & Generous Ratio */}
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
                            {navLinks.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
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

                            {user && (
                                <Link
                                    href="/dashboard"
                                    className={`inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] px-3.5 text-sm font-bold transition-colors duration-150 sm:h-12 sm:px-4 sm:text-[15px] ${
                                        isActive('/dashboard')
                                            ? 'bg-[#8ECDF0] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                            : 'bg-[#FFE27A]/60 text-[#3B2A1E] hover:bg-[#FFE27A]'
                                    }`}
                                >
                                    <LayoutDashboard
                                        className="size-[18px] opacity-80"
                                        strokeWidth={2}
                                    />
                                    <span>Dashboard</span>
                                </Link>
                            )}

                            {user?.is_admin && (
                                <Link
                                    href="/admin/llm-providers"
                                    className="inline-flex h-11 items-center gap-1.5 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-3.5 text-sm font-bold text-[#3B2A1E] transition hover:bg-[#FF9A3C] sm:h-12 sm:text-[15px]"
                                >
                                    <Settings
                                        className="size-4 opacity-80"
                                        strokeWidth={2}
                                    />
                                    <span>Admin</span>
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* Right Toolbar */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {user ? (
                            <div className="hidden items-center gap-3 text-sm font-bold sm:flex">
                                <Link
                                    href="/profile"
                                    className="flex h-11 min-h-[44px] items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 py-2 text-[#3B2A1E] transition hover:bg-[#FFE27A]"
                                    title="Pengaturan Profil"
                                >
                                    <User
                                        className="size-4 opacity-80"
                                        strokeWidth={2}
                                    />
                                    <span className="max-w-36 truncate">
                                        {user.name}
                                    </span>
                                </Link>

                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="flex h-11 min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-[#D4573A] bg-white px-3.5 py-2 text-sm font-bold text-[#D4573A] transition hover:bg-[#D4573A] hover:text-white"
                                    title="Keluar Akun"
                                >
                                    <LogOut
                                        className="size-4"
                                        strokeWidth={2}
                                    />
                                    <span className="hidden md:inline">
                                        Keluar
                                    </span>
                                </Link>
                            </div>
                        ) : (
                            <div className="hidden items-center sm:flex">
                                <AuthSwitchToggle variant="header" />
                            </div>
                        )}

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

                {/* Mobile Drawer */}
                {mobileMenuOpen && (
                    <div className="border-t-2 border-[#EFE3D0] bg-[#FFF8EC] px-5 py-5 lg:hidden">
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
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

                            {user && (
                                <Link
                                    href="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold transition-all ${
                                        isActive('/dashboard')
                                            ? 'border-2 border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E]'
                                            : 'border-2 border-[#3B2A1E] bg-[#FFE27A]/60 text-[#3B2A1E]'
                                    }`}
                                >
                                    <LayoutDashboard
                                        className="size-5"
                                        strokeWidth={2}
                                    />
                                    <span>Dashboard Pelindung</span>
                                </Link>
                            )}

                            {user?.is_admin && (
                                <Link
                                    href="/admin/llm-providers"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-4 py-3 text-base font-bold text-[#3B2A1E]"
                                >
                                    <Settings
                                        className="size-5"
                                        strokeWidth={2}
                                    />
                                    <span>Manajemen LLM Admin</span>
                                </Link>
                            )}
                        </nav>

                        {/* Mobile Auth Actions */}
                        <div className="mt-5 border-t-2 border-[#EFE3D0] pt-5">
                            {user ? (
                                <div className="flex flex-col gap-2.5">
                                    <Link
                                        href="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 py-3 text-base font-bold text-[#3B2A1E]"
                                    >
                                        <User
                                            className="size-5"
                                            strokeWidth={2}
                                        />
                                        <span>Profil ({user.name})</span>
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#D4573A] bg-white px-4 py-3 text-left text-base font-bold text-[#D4573A] hover:bg-[#D4573A] hover:text-white"
                                    >
                                        <LogOut
                                            className="size-5"
                                            strokeWidth={2}
                                        />
                                        <span>Keluar</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="w-full pt-1">
                                    <AuthSwitchToggle variant="mobile" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1">{children}</main>

            {/* Sky Blue Footer with Ocean Wave Divider & Centered Brand */}
            <footer className="relative bg-transparent text-[#3B2A1E]">
                {/* Garis Gelombang Laut Organik yang Naik-Turun */}
                <OceanWaveDivider fillColor="#D6EDFC" />

                <div className="bg-[#D6EDFC] dark:bg-[#0c1f2e] transition-colors">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
                        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-8">
                            {/* Left Navlinks: Eksplorasi & Edukasi (Hanya Teks Bersih) */}
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

                            {/* Right Navlinks: Aksi Aman & Kanal Pengaduan Resmi (Seragam dengan Icon) */}
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

            {/* Modal Ketentuan Layanan & Kebijakan Privasi */}
            {termsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2A1E]/50 backdrop-blur-xs animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="legal-modal-title"
                    onClick={() => setTermsModal(null)}
                >
                    <div
                        className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#3B2A1E] text-[#3B2A1E]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header & Close */}
                        <div className="flex items-start justify-between gap-4 border-b-2 border-[#EFE3D0] pb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                    {termsModal === 'terms' ? (
                                        <FileText
                                            className="size-6 text-[#3B2A1E]"
                                            strokeWidth={2}
                                        />
                                    ) : (
                                        <ShieldCheck
                                            className="size-6 text-[#3B2A1E]"
                                            strokeWidth={2}
                                        />
                                    )}
                                </div>
                                <div>
                                    <h2
                                        id="legal-modal-title"
                                        className="font-['Fredoka',system-ui,sans-serif] text-xl sm:text-2xl font-bold tracking-tight text-[#3B2A1E]"
                                    >
                                        {termsModal === 'terms'
                                            ? 'Ketentuan Layanan'
                                            : 'Kebijakan Privasi'}
                                    </h2>
                                    <p className="text-xs font-semibold text-[#6B5646]">
                                        Pedoman transparansi & perlindungan pengguna CEKARA
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTermsModal(null)}
                                className="inline-flex size-10 min-h-[40px] items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] transition hover:bg-[#FFE27A] cursor-pointer"
                                aria-label="Tutup jendela"
                            >
                                <X className="size-5" strokeWidth={2} />
                            </button>
                        </div>

                        {/* Switcher Tab */}
                        <div className="mt-5 flex gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-[#EFE3D0]/60 p-1.5">
                            <button
                                type="button"
                                onClick={() => setTermsModal('terms')}
                                className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                                    termsModal === 'terms'
                                        ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                                        : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                }`}
                            >
                                Ketentuan Layanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setTermsModal('privacy')}
                                className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                                    termsModal === 'privacy'
                                        ? 'border-2 border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                                        : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                }`}
                            >
                                Kebijakan Privasi
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="mt-5 space-y-4 text-xs sm:text-sm leading-relaxed text-[#3B2A1E]">
                            {termsModal === 'terms' ? (
                                <>
                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#E64A19]">
                                            1. Tujuan Edukasi & Literasi
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            CEKARA hadir sebagai platform edukasi interaktif untuk meningkatkan kewaspadaan masyarakat terhadap beragam modus penipuan siber (phishing, social engineering, malware APK tilang, dan pinjol ilegal).
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#E64A19]">
                                            2. Batasan Tanggung Jawab (Disclaimer)
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            Hasil deteksi, simulasi skenario, dan rekomendasi tindakan bersifat asistensi edukatif awal. CEKARA bukan lembaga perbankan, kepolisian, ataupun otoritas keuangan resmi.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#E64A19]">
                                            3. Prosedur Darurat Penipuan Nyata
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            Jika kamu atau keluargamu telah mengalami kerugian finansial nyata, segera hubungi call center resmi bank terkait, ajukan pemblokiran rekening ke IASC OJK (iasc.ojk.go.id), dan buat laporan ke kepolisian setempat.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                        <h3 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#E64A19]">
                                            4. Layanan Terbuka & Nirlaba
                                        </h3>
                                        <p className="mt-1 text-[#6B5646]">
                                            Seluruh fitur simulasi dan materi panduan keluarga dapat diakses gratis oleh masyarakat tanpa dipungut biaya langganan apa pun.
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
                        <div className="mt-6 flex justify-end border-t-2 border-[#EFE3D0] pt-4">
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
        </div>
    );
}
