import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
    neutral:
        'border-2 border-[#3B2A1E] bg-[#FFF8EC] text-[#3B2A1E]',
    brand:
        'border-2 border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E]',
    danger:
        'border-2 border-[#3B2A1E] bg-[#D4573A] text-white',
    warn:
        'border-2 border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E]',
    safe:
        'border-2 border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E]',
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
        neutral: 'bg-[#6B5646]',
        brand: 'bg-[#3B2A1E]',
        danger: 'bg-white',
        warn: 'bg-[#3B2A1E]',
        safe: 'bg-[#3B2A1E]',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-tight transition-colors',
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
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-tight transition-colors',
        variants[variant],
        className,
    );
}
