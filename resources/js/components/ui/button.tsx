import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
    primary:
        'bg-[#FF9A3C] text-[#3B2A1E] font-bold border-2 border-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#ff8e26] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    secondary:
        'border-2 border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E] font-bold shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#7bc2e8] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    outline:
        'border-2 border-[#3B2A1E] bg-[#FFF8EC] text-[#3B2A1E] font-bold hover:bg-[#FFE27A] active:scale-[0.98]',
    ghost:
        'text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E] font-semibold',
    danger:
        'bg-[#D4573A] text-white font-bold border-2 border-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#c44b30] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
} as const;

const sizes = {
    sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-xl',
    md: 'min-h-[44px] h-11 px-5 text-sm gap-2 rounded-2xl',
    lg: 'min-h-[48px] h-12 px-6 text-base gap-2.5 rounded-2xl',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses(
    variant: ButtonVariant = 'primary',
    size: ButtonSize = 'md',
) {
    return cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B2A1E] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
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
