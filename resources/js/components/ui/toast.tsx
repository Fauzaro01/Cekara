import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { usePage } from '@inertiajs/react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    message: string;
    description?: string;
    type: ToastType;
    duration?: number;
    createdAt?: number;
}

export interface ToastProps {
    message: string;
    description?: string;
    type?: ToastType;
    duration?: number;
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
}

// Global Store for programmatic toast dispatch (toast.success, toast.error, etc.)
type Listener = () => void;
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

// Track recent toasts to deduplicate identical triggers (e.g. Inertia flash + client onSuccess)
let lastToastMessage = '';
let lastToastTime = 0;

function emitChange() {
    listeners.forEach((listener) => listener());
}

export const toast = {
    show: (message: string, options?: { type?: ToastType; description?: string; duration?: number }) => {
        const now = Date.now();
        // Cegah penumpukan pesan yang sama dalam selang waktu 1.5 detik
        if (message === lastToastMessage && now - lastToastTime < 1500) {
            return toasts[0]?.id || '';
        }
        lastToastMessage = message;
        lastToastTime = now;

        const id = Math.random().toString(36).substring(2, 9);
        const newItem: ToastItem = {
            id,
            message,
            description: options?.description,
            type: options?.type || 'success',
            duration: options?.duration ?? 3500,
            createdAt: now,
        };
        // Menjaga maksimal tepat 1 pop up aktif agar tidak bertumpuk
        toasts = [newItem];
        emitChange();
        return id;
    },
    success: (message: string, options?: { description?: string; duration?: number }) => {
        return toast.show(message, { ...options, type: 'success' });
    },
    error: (message: string, options?: { description?: string; duration?: number }) => {
        return toast.show(message, { ...options, type: 'error' });
    },
    warning: (message: string, options?: { description?: string; duration?: number }) => {
        return toast.show(message, { ...options, type: 'warning' });
    },
    info: (message: string, options?: { description?: string; duration?: number }) => {
        return toast.show(message, { ...options, type: 'info' });
    },
    dismiss: (id?: string) => {
        if (id) {
            toasts = toasts.filter((t) => t.id !== id);
        } else {
            toasts = [];
        }
        emitChange();
    },
};

function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return toasts;
}

/**
 * Styling palet gendut neo-brutalisme tanpa icon sesuai permintaan:
 * - Sukses: Fill hijau palet gendut
 * - Gagal: Fill merah palet gendut
 * - Peringatan: Fill kuning palet gendut
 * - Info: Fill biru palet gendut
 */
const paletteStyles: Record<ToastType, string> = {
    success:
        'bg-[#86EFAC] text-[#14532D] border-2 sm:border-3 border-[#3B2A1E] shadow-[4px_4px_0px_0px_#3B2A1E]',
    error:
        'bg-[#FCA5A5] text-[#7F1D1D] border-2 sm:border-3 border-[#3B2A1E] shadow-[4px_4px_0px_0px_#3B2A1E]',
    warning:
        'bg-[#FFE27A] text-[#3B2A1E] border-2 sm:border-3 border-[#3B2A1E] shadow-[4px_4px_0px_0px_#3B2A1E]',
    info:
        'bg-[#8ECDF0] text-[#3B2A1E] border-2 sm:border-3 border-[#3B2A1E] shadow-[4px_4px_0px_0px_#3B2A1E]',
};

/**
 * Single Toast Item dengan animasi masuk dari tengah atas
 * dan animasi keluar kembali meluncur ke atas secara smooth & profesional.
 */
export function ToastCard({
    item,
    onDismiss,
}: {
    item: ToastItem;
    onDismiss: (id: string) => void;
}) {
    const age = item.createdAt ? Date.now() - item.createdAt : 0;
    const isAlreadyActive = age > 300;
    const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting'>(
        isAlreadyActive ? 'entered' : 'entering',
    );

    const handleDismiss = useCallback(() => {
        if (animationState === 'exiting') return;
        setAnimationState('exiting');
        // Tunggu animasi meluncur ke atas selesai (300ms) sebelum unmount
        setTimeout(() => {
            onDismiss(item.id);
        }, 300);
    }, [animationState, item.id, onDismiss]);

    // Masuk (entering -> entered) jika baru dibuat
    useEffect(() => {
        if (isAlreadyActive) return;
        const frame = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setAnimationState('entered');
            });
        });
        return () => cancelAnimationFrame(frame);
    }, [isAlreadyActive]);

    // Otomatis keluar setelah sisa durasi selesai (tidak reset dari 0)
    useEffect(() => {
        const elapsed = item.createdAt ? Date.now() - item.createdAt : 0;
        const totalDuration = item.duration ?? 3500;
        const remaining = Math.max(100, totalDuration - elapsed);

        const timer = setTimeout(() => {
            handleDismiss();
        }, remaining);

        return () => clearTimeout(timer);
    }, [item.duration, item.createdAt, handleDismiss]);

    // Transform & Opacity untuk animasi masuk & keluar
    const isExiting = animationState === 'exiting';
    const isEntered = animationState === 'entered';

    return (
        <div
            onClick={handleDismiss}
            role="alert"
            aria-live="polite"
            className={`cursor-pointer select-none rounded-2xl sm:rounded-3xl pl-5 pr-3 py-2.5 sm:pl-6 sm:pr-3.5 sm:py-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between gap-3 sm:gap-4 w-full ${
                paletteStyles[item.type]
            } ${
                isEntered && !isExiting
                    ? 'translate-y-0 opacity-100 scale-100'
                    : '-translate-y-16 opacity-0 scale-95 pointer-events-none'
            }`}
        >
            <div className="flex flex-col text-left pr-1 min-w-0 flex-1">
                <span className="font-['Fredoka',system-ui,sans-serif] text-sm sm:text-base font-bold leading-snug tracking-tight break-words">
                    {item.message}
                </span>
                {item.description && (
                    <span className="mt-0.5 text-xs font-semibold opacity-90 leading-tight break-words">
                        {item.description}
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                }}
                className="flex size-7 sm:size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl sm:rounded-2xl border-2 border-[#3B2A1E] bg-white/90 text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Tutup notifikasi"
                aria-label="Tutup notifikasi"
            >
                <X className="size-3.5 sm:size-4" strokeWidth={2.5} />
            </button>
        </div>
    );
}

// Melacak rute halaman terakhir dan pesan flash yang sedang/sudah aktif
let lastActivePathname = typeof window !== 'undefined' ? window.location.pathname : '';
let lastHandledMessage = '';

/**
 * Toast Container yang dipasang di tengah atas layar.
 * Menampung popup toast aktif dan mendengarkan flash message Inertia.
 */
export function ToastContainer() {
    const activeToasts = useSyncExternalStore(subscribe, getSnapshot, () => []);
    const { props } = usePage<{
        flash?: {
            success?: string | null;
            error?: string | null;
            message?: string | null;
            warning?: string | null;
        };
        message?: string | null;
    }>();

    // Hapus pop-up aktif lama jika pengguna bernavigasi ke rute/halaman berbeda
    useEffect(() => {
        const currentPath = window.location.pathname;
        if (lastActivePathname && lastActivePathname !== currentPath) {
            toast.dismiss();
        }
        lastActivePathname = currentPath;
    }, []);

    // Otomatis trigger toast jika ada pesan flash dari controller Laravel
    useEffect(() => {
        const flash = props.flash;
        const currentMsg = flash?.success || flash?.error || flash?.warning || flash?.message || props.message;

        if (!currentMsg) {
            lastHandledMessage = '';
            return;
        }

        // Hindari re-trigger untuk pesan yang sama di halaman yang sama
        if (currentMsg === lastHandledMessage) {
            return;
        }
        lastHandledMessage = currentMsg;

        if (flash?.success) {
            toast.success(flash.success);
        } else if (flash?.error) {
            toast.error(flash.error);
        } else if (flash?.warning) {
            toast.warning(flash.warning);
        } else if (flash?.message) {
            toast.info(flash.message);
        } else if (props.message) {
            toast.info(props.message);
        }
    }, [props.flash, props.message]);

    if (activeToasts.length === 0) {
        return null;
    }

    return (
        <div
            aria-label="Notifikasi Pop-up"
            className="fixed top-5 sm:top-7 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 w-full max-w-[92vw] sm:max-w-md pointer-events-none"
        >
            {activeToasts.map((item) => (
                <div key={item.id} className="pointer-events-auto">
                    <ToastCard item={item} onDismiss={(id) => toast.dismiss(id)} />
                </div>
            ))}
        </div>
    );
}

/**
 * Standalone Toast Component untuk digunakan secara deklaratif jika dibutuhkan
 */
export function Toast({
    message,
    description,
    type = 'success',
    duration = 3500,
    isOpen = true,
    onClose,
    className = '',
}: ToastProps) {
    const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting'>('entering');

    const handleClose = useCallback(() => {
        if (animationState === 'exiting') return;
        setAnimationState('exiting');
        setTimeout(() => {
            onClose?.();
        }, 300);
    }, [animationState, onClose]);

    useEffect(() => {
        if (!isOpen) {
            handleClose();
            return;
        }

        const frame = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setAnimationState('entered');
            });
        });

        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timer);
        };
    }, [isOpen, duration, handleClose]);

    if (!isOpen && animationState === 'exiting') {
        // Biarkan animasi keluar selesai
    } else if (!isOpen) {
        return null;
    }

    const isEntered = animationState === 'entered';

    return (
        <div className="fixed top-5 sm:top-7 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-[92vw] sm:max-w-md pointer-events-none flex justify-center">
            <div
                onClick={handleClose}
                role="alert"
                className={`pointer-events-auto cursor-pointer select-none rounded-2xl sm:rounded-3xl pl-5 pr-3 py-2.5 sm:pl-6 sm:pr-3.5 sm:py-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between gap-3 sm:gap-4 w-full ${
                    paletteStyles[type]
                } ${
                    isEntered
                        ? 'translate-y-0 opacity-100 scale-100'
                        : '-translate-y-16 opacity-0 scale-95 pointer-events-none'
                } ${className}`}
            >
                <div className="flex flex-col text-left pr-1 min-w-0 flex-1">
                    <span className="font-['Fredoka',system-ui,sans-serif] text-sm sm:text-base font-bold leading-snug tracking-tight break-words">
                        {message}
                    </span>
                    {description && (
                        <span className="mt-0.5 text-xs font-semibold opacity-90 leading-tight break-words">
                            {description}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                    }}
                    className="flex size-7 sm:size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl sm:rounded-2xl border-2 border-[#3B2A1E] bg-white/90 text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    title="Tutup notifikasi"
                    aria-label="Tutup notifikasi"
                >
                    <X className="size-3.5 sm:size-4" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

export default Toast;
