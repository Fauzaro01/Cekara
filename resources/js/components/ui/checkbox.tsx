import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, checked, id, ...props }, ref) => {
        return (
            <label
                htmlFor={id}
                className={cn(
                    'group inline-flex items-center gap-2.5 cursor-pointer select-none',
                    className,
                )}
            >
                <div className="relative flex items-center justify-center">
                    <input
                        ref={ref}
                        id={id}
                        type="checkbox"
                        checked={checked}
                        className="peer sr-only"
                        {...props}
                    />
                    <div
                        className={cn(
                            'size-5 rounded-md border-2 border-[#3B2A1E] bg-white transition-all duration-150',
                            'shadow-[2px_2px_0px_0px_#3B2A1E] group-hover:bg-[#FFF8EC]',
                            'peer-checked:bg-[#FF9A3C] peer-checked:shadow-[1px_1px_0px_0px_#3B2A1E] peer-checked:translate-x-[0.5px] peer-checked:translate-y-[0.5px]',
                            'peer-focus-visible:ring-2 peer-focus-visible:ring-[#3B2A1E] peer-focus-visible:ring-offset-1',
                            'flex items-center justify-center',
                        )}
                        aria-hidden="true"
                    >
                        <Check
                            className={cn(
                                'size-3.5 stroke-[3.5] text-[#3B2A1E] transition-all duration-150',
                                checked
                                    ? 'scale-100 opacity-100'
                                    : 'scale-0 opacity-0',
                            )}
                        />
                    </div>
                </div>
                {label && (
                    <span className="text-sm font-semibold text-[#3B2A1E] group-hover:text-[#E06812] transition-colors leading-none">
                        {label}
                    </span>
                )}
            </label>
        );
    },
);

Checkbox.displayName = 'Checkbox';
