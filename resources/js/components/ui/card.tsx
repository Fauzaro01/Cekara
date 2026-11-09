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
        default:
            'border-2 border-[#3B2A1E] bg-white rounded-[20px] p-6 shadow-[4px_4px_0px_0px_#3B2A1E]',
        glass:
            'border-2 border-[#3B2A1E] bg-[#FFF8EC] rounded-[20px] p-6 shadow-[4px_4px_0px_0px_#3B2A1E]',
        floating:
            'border-2 border-[#3B2A1E] bg-white rounded-[20px] p-6 shadow-[4px_4px_0px_0px_#3B2A1E] hover:translate-y-[-2px] transition-transform',
        subtle:
            'border-2 border-[#EFE3D0] bg-[#FFF8EC] rounded-[20px] p-6',
    };

    return (
        <div
            className={cn(
                'transition-colors',
                variantStyles[variant],
                className,
            )}
            {...props}
        />
    );
}
