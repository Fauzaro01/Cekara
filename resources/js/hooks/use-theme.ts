import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system';
        try {
            return (localStorage.getItem('theme') as Theme) || 'system';
        } catch {
            return 'system';
        }
    });

    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.classList.contains('dark');
    });

    const applyTheme = useCallback((targetTheme: Theme) => {
        try {
            localStorage.setItem('theme', targetTheme);
        } catch {}

        const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)',
        ).matches;
        const shouldBeDark =
            targetTheme === 'dark' || (targetTheme === 'system' && prefersDark);

        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setIsDark(shouldBeDark);
        setThemeState(targetTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        applyTheme(isDark ? 'light' : 'dark');
    }, [isDark, applyTheme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            let currentStored: Theme | null = null;
            try {
                currentStored = localStorage.getItem('theme') as Theme | null;
            } catch {}

            if (!currentStored || currentStored === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [applyTheme]);

    return {
        theme,
        isDark,
        setTheme: applyTheme,
        toggleTheme,
    };
}
