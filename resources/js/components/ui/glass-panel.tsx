import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
}

export function GlassPanel({
    className,
    hoverEffect = false,
    ...props
}: GlassPanelProps) {
    return (
        <div
            className={cn(
                'glass-panel rounded-card p-6 shadow-sm transition-all duration-200',
                hoverEffect && 'floating-card',
                className,
            )}
            {...props}
        />
    );
}

