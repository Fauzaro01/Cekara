import React, { useState, useRef, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';

interface AuthSwitchToggleProps {
    className?: string;
    variant?: 'header' | 'mobile';
}

export default function AuthSwitchToggle({
    className = '',
    variant = 'header',
}: AuthSwitchToggleProps) {
    const { url } = usePage();

    // Deteksi route aktif saat ini
    const isLoginRoute = url.startsWith('/login');
    const isRegisterRoute = url.startsWith('/register');

    // Default posisi: jika di /login maka 'login', jika di /register atau halaman lain default 'register' (CTA utama)
    const initialTab: 'login' | 'register' = isLoginRoute ? 'login' : 'register';

    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPercent, setDragPercent] = useState<number | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const trackRef = useRef<HTMLDivElement>(null);
    const dragStartXRef = useRef<number>(0);
    const dragStartTabRef = useRef<'login' | 'register'>('login');
    const hasDraggedRef = useRef<boolean>(false);

    // Sinkronisasi posisi jika route berpindah via navigasi lain
    useEffect(() => {
        if (url.startsWith('/login')) {
            setActiveTab('login');
        } else if (url.startsWith('/register')) {
            setActiveTab('register');
        }
    }, [url]);

    // Hitung jarak geser maksimum dalam piksel
    const getMaxTranslatePx = useCallback(() => {
        if (!trackRef.current) return 92;
        const trackWidth = trackRef.current.clientWidth;
        return (trackWidth - 8) / 2;
    }, []);

    // Jalankan navigasi Inertia dengan jeda halus agar animasi saklar terlihat
    const triggerNavigation = useCallback(
        (target: 'login' | 'register') => {
            const targetUrl = target === 'login' ? '/login' : '/register';
            if (url === targetUrl) return;

            setIsNavigating(true);
            // Beri jeda 140ms agar saklar terlihat meluncur secara nyata seperti saklar fisik
            setTimeout(() => {
                router.visit(targetUrl, {
                    preserveScroll: true,
                    onFinish: () => setIsNavigating(false),
                });
            }, 140);
        },
        [url],
    );

    // Handler klik langsung pada salah satu opsi
    const handleSelectTab = (tab: 'login' | 'register') => {
        if (isNavigating) return;
        setActiveTab(tab);
        triggerNavigation(tab);
    };

    // Pointer Event Handlers untuk gesture geser (Drag / Swipe saklar)
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isNavigating) return;

        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        dragStartXRef.current = e.clientX;
        dragStartTabRef.current = activeTab;
        hasDraggedRef.current = false;
        setDragPercent(activeTab === 'login' ? 0 : 100);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartXRef.current;
        if (Math.abs(deltaX) > 4) {
            hasDraggedRef.current = true;
        }

        const maxPx = getMaxTranslatePx();
        const startPercent = dragStartTabRef.current === 'login' ? 0 : 100;
        const deltaPercent = (deltaX / maxPx) * 100;

        // Batasi rentang persentase 0% s/d 100%
        const clampedPercent = Math.max(0, Math.min(100, startPercent + deltaPercent));
        setDragPercent(clampedPercent);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // Abaikan jika pointer capture telah dilepas
        }

        setIsDragging(false);

        // Jika hanya klik biasa (tanpa gesture geser yang signifikan)
        if (!hasDraggedRef.current && trackRef.current) {
            const rect = trackRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const targetTab = clickX < rect.width / 2 ? 'login' : 'register';
            setDragPercent(null);
            handleSelectTab(targetTab);
            return;
        }

        // Jika gesture geser selesai, tentukan posisi terdekat (ambang 50%)
        if (dragPercent !== null) {
            const targetTab = dragPercent < 50 ? 'login' : 'register';
            setDragPercent(null);
            setActiveTab(targetTab);
            triggerNavigation(targetTab);
        } else {
            setDragPercent(null);
        }
    };

    const handlePointerCancel = () => {
        setIsDragging(false);
        setDragPercent(null);
    };

    // Hitung posisi transform transform3d
    let currentTranslatePercent = 0;
    if (isDragging && dragPercent !== null) {
        currentTranslatePercent = dragPercent;
    } else {
        currentTranslatePercent = activeTab === 'login' ? 0 : 100;
    }

    const isLoginActive = activeTab === 'login';
    const isRegisterActive = activeTab === 'register';

    return (
        <div
            className={`flex flex-col items-center select-none ${className}`}
            title="Saklar Masuk / Daftar: Geser atau klik untuk beralih"
        >
            {/* Saklar Segmented Track */}
            <div
                ref={trackRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                role="switch"
                aria-checked={isRegisterActive}
                aria-label="Beralih antara Masuk dan Daftar akun"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        handleSelectTab('login');
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        handleSelectTab('register');
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectTab(activeTab === 'login' ? 'register' : 'login');
                    }
                }}
                className={`group relative flex items-center rounded-full border-2 border-[#3B2A1E] bg-[#F7EEDB] p-1 shadow-[2.5px_2.5px_0px_0px_#3B2A1E] touch-none transition-all ${
                    isDragging
                        ? 'cursor-grabbing scale-[0.99] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                        : 'cursor-grab hover:shadow-[3.5px_3.5px_0px_0px_#3B2A1E] hover:-translate-y-0.5'
                } ${
                    variant === 'mobile'
                        ? 'h-12 w-full'
                        : 'h-11 w-[188px] sm:w-[196px]'
                }`}
                style={{
                    touchAction: 'none',
                }}
            >
                {/* Background Track Guide Texture (Garis pemisah tengah) */}
                <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none opacity-25">
                    <div className="h-4 w-[1px] bg-[#3B2A1E]" />
                </div>

                {/* Saklar Knob / Slider Thumb Bergerak */}
                <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full border-2 border-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] pointer-events-none flex items-center justify-center ${
                        isLoginActive
                            ? 'bg-[#FFE27A]' // Warna kuning mentega hangat saat Masuk
                            : 'bg-[#FF9A3C]' // Warna oranye ceria khas Cekara saat Daftar
                    }`}
                    style={{
                        left: 4,
                        transform: `translate3d(${currentTranslatePercent}%, 0, 0)`,
                        transition: isDragging
                            ? 'none'
                            : 'transform 0.34s cubic-bezier(0.34, 1.45, 0.64, 1), background-color 0.22s ease',
                    }}
                >
                    {/* Tekstur Tactile Grip pada Knob (3 garis aksen retro saklar fisik) */}
                    <div className="flex items-center gap-[2.5px] opacity-35">
                        <div className="h-2.5 w-[1.5px] rounded-full bg-[#3B2A1E]" />
                        <div className="h-3.5 w-[1.5px] rounded-full bg-[#3B2A1E]" />
                        <div className="h-2.5 w-[1.5px] rounded-full bg-[#3B2A1E]" />
                    </div>
                </div>

                {/* Label Kiri: MASUK */}
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTab('login');
                    }}
                    className={`relative z-10 flex h-full w-1/2 items-center justify-center px-2 font-['Fredoka',system-ui,sans-serif] text-xs font-bold transition-all duration-200 sm:text-sm cursor-pointer ${
                        isLoginActive
                            ? 'text-[#3B2A1E] font-extrabold scale-[1.03]'
                            : 'text-[#7A6453] hover:text-[#3B2A1E]'
                    }`}
                >
                    <span>Masuk</span>
                </button>

                {/* Label Kanan: DAFTAR */}
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTab('register');
                    }}
                    className={`relative z-10 flex h-full w-1/2 items-center justify-center px-2 font-['Fredoka',system-ui,sans-serif] text-xs font-bold transition-all duration-200 sm:text-sm cursor-pointer ${
                        isRegisterActive
                            ? 'text-[#3B2A1E] font-extrabold scale-[1.03]'
                            : 'text-[#7A6453] hover:text-[#3B2A1E]'
                    }`}
                >
                    <span>Daftar</span>
                </button>
            </div>
        </div>
    );
}
