import { useState, type PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ShieldCheck,
    Search,
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
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button, buttonClasses } from '@/components/ui/button';
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

    const isActive = (path: string) => {
        if (path === '/') {
            return url === '/';
        }
        return url.startsWith(path);
    };

    const navLinks = [
        { href: '/', label: 'Kenali', icon: Search },
        { href: '/simulasi', label: 'Belajar', icon: BookOpen },
        { href: '/tanggap-darurat', label: 'Bertindak', icon: LifeBuoy },
        { href: '/radar', label: 'Radar Komunitas', icon: Radio },
        { href: '/panduan-keluarga', label: 'Panduan Keluarga', icon: Users },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-50/50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            {/* Glassmorphic Sticky Header */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/75 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/75">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    {/* Brand Logo & Desktop Nav */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/"
                            className="group flex items-center gap-2.5 font-bold tracking-tight text-slate-900 transition dark:text-slate-100"
                        >
                            <img
                                src="/logo.png"
                                alt="Logo Cekara"
                                className="size-8 object-contain transition group-hover:scale-105"
                            />
                            <span className="text-base font-semibold tracking-tight">Cekara</span>
                        </Link>

                        <nav className="hidden items-center gap-1 lg:flex">
                            {navLinks.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                                            active
                                                ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                                        }`}
                                    >
                                        <Icon className="size-3.5 opacity-70" strokeWidth={1.75} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            {user && (
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                        isActive('/dashboard')
                                            ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                                            : 'text-brand-600 hover:bg-brand-50/70 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-950/40'
                                    }`}
                                >
                                    <LayoutDashboard className="size-3.5" strokeWidth={1.75} />
                                    <span>Dashboard</span>
                                </Link>
                            )}

                            {user?.is_admin && (
                                <Link
                                    href="/admin/llm-providers"
                                    className="flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/50"
                                >
                                    <Settings className="size-3" strokeWidth={2} />
                                    <span>Admin</span>
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* Right Toolbar */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />

                        {user ? (
                            <div className="hidden items-center gap-2.5 text-xs font-medium sm:flex">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    title="Pengaturan Profil"
                                >
                                    <User className="size-3.5 opacity-70" strokeWidth={1.75} />
                                    <span className="max-w-28 truncate">{user.name}</span>
                                </Link>

                                <span className="text-slate-300 dark:text-slate-700">|</span>

                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="flex items-center gap-1 text-slate-500 transition hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                                >
                                    <LogOut className="size-3.5" strokeWidth={1.75} />
                                    <span>Keluar</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link
                                    href="/login"
                                    className={buttonClasses('ghost', 'sm')}
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className={buttonClasses('primary', 'sm')}
                                >
                                    Daftar
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 lg:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="size-5" strokeWidth={1.75} />
                            ) : (
                                <Menu className="size-5" strokeWidth={1.75} />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Drawer */}
                {mobileMenuOpen && (
                    <div className="border-t border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur-md lg:hidden dark:border-slate-800/80 dark:bg-slate-950/95">
                        <div className="flex flex-col gap-1.5">
                            {navLinks.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                            active
                                                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon className="size-4" strokeWidth={1.75} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            {user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                                    >
                                        <LayoutDashboard className="size-4" strokeWidth={1.75} />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link
                                        href="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <User className="size-4" strokeWidth={1.75} />
                                        <span>Profil ({user.name})</span>
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                    >
                                        <LogOut className="size-4" strokeWidth={1.75} />
                                        <span>Keluar</span>
                                    </Link>
                                </>
                            ) : (
                                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <Link
                                        href="/login"
                                        className={`flex-1 ${buttonClasses('outline', 'sm')}`}
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href="/register"
                                        className={`flex-1 ${buttonClasses('primary', 'sm')}`}
                                    >
                                        Daftar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1">{children}</main>

            {/* Polished Minimalist Footer */}
            <footer className="border-t border-slate-200/80 bg-white/40 py-8 dark:border-slate-800/80 dark:bg-slate-950/40">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo Cekara" className="size-5 object-contain" />
                        <span>© {new Date().getFullYear()} Cekara — Cek dulu sebelum percaya.</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                        <Link href="/" className="transition hover:text-slate-900 dark:hover:text-slate-100">
                            Kenali
                        </Link>
                        <span>•</span>
                        <Link href="/simulasi" className="transition hover:text-slate-900 dark:hover:text-slate-100">
                            Belajar
                        </Link>
                        <span>•</span>
                        <Link href="/tanggap-darurat" className="transition hover:text-slate-900 dark:hover:text-slate-100">
                            Bertindak
                        </Link>
                        <span>•</span>
                        <Link href="/radar" className="transition hover:text-slate-900 dark:hover:text-slate-100">
                            Radar Komunitas
                        </Link>
                        <span>•</span>
                        <Link href="/panduan-keluarga" className="transition hover:text-slate-900 dark:hover:text-slate-100">
                            Panduan Keluarga
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
