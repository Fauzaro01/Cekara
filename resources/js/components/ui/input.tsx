import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({
    className,
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                'h-10 w-full rounded-lg border bg-transparent px-3 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
                className,
            )}
            {...props}
        />
    );
}

