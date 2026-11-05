import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'floating' | 'subtle';
}

export function Card({
    className,
    variant = 'default',
    ...props
}: CardProps) {
    const variantStyles = {
        default: 'border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60',
        glass: 'glass-card border border-white/40 dark:border-slate-800/80',
        floating: 'floating-card border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60',
        subtle: 'border border-slate-100 bg-slate-50/60 dark:border-slate-800/50 dark:bg-slate-900/30',
    };

    return (
        <div
            className={cn(
                'rounded-card p-6 transition-colors',
                variantStyles[variant],
                className,
            )}
            {...props}
        />
    );
}
