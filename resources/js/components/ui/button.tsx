import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
    primary:
        'bg-brand-600 text-white shadow-sm hover:bg-brand-500 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-400',
    secondary:
        'border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    outline:
        'border border-slate-200/90 bg-white/60 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    ghost:
        'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
    danger:
        'bg-rose-600 text-white shadow-sm hover:bg-rose-500 active:scale-[0.98] dark:bg-rose-600 dark:hover:bg-rose-500',
} as const;

const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
    return cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none',
        variants[variant],
        sizes[size],
    );
}

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
}) {
    return (
        <button
            className={cn(buttonClasses(variant, size), className)}
            {...props}
        />
    );
}
