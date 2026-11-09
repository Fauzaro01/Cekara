import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({
    className,
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                'min-h-[44px] h-11 w-full rounded-2xl border-2 border-[#8ECDF0] bg-white px-4 text-sm text-[#3B2A1E] placeholder:text-[#6B5646]/70 focus-visible:border-[#FF9A3C] focus-visible:ring-2 focus-visible:ring-[#3B2A1E] focus-visible:outline-none transition-colors',
                className,
            )}
            {...props}
        />
    );
}
