import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            className={cn(
                'inline-flex h-11 min-h-[44px] w-11 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] transition-colors hover:bg-[#FFE27A] focus-visible:ring-2 focus-visible:ring-[#3B2A1E] focus-visible:outline-none',
                className,
            )}
        >
            {isDark ? (
                // Sun Icon for Dark Mode (click to switch to light)
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                </svg>
            ) : (
                // Moon Icon for Light Mode (click to switch to dark)
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
            )}
        </button>
    );
}
