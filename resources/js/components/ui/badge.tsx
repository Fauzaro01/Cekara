import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
    neutral:
        'border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300',
    brand:
        'border-brand-200/90 bg-brand-50/80 text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-300',
    danger:
        'border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300',
    warn:
        'border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
    safe:
        'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: keyof typeof variants;
    dot?: boolean;
    withDot?: boolean;
}

export function Badge({
    variant = 'neutral',
    dot = false,
    withDot = false,
    className,
    children,
    ...props
}: BadgeProps) {
    const showDot = dot || withDot;

    const dotColors = {
        neutral: 'bg-slate-400',
        brand: 'bg-brand-500',
        danger: 'bg-rose-500',
        warn: 'bg-amber-500',
        safe: 'bg-emerald-500',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors',
                variants[variant],
                className,
            )}
            {...props}
        >
            {showDot && (
                <span
                    className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        dotColors[variant],
                    )}
                />
            )}
            {children}
        </span>
    );
}

export function badgeClasses(
    variant: keyof typeof variants = 'neutral',
    className?: string,
) {
    return cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors',
        variants[variant],
        className,
    );
}
