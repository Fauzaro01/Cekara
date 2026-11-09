import { createInertiaApp } from '@inertiajs/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

declare global {
    interface Window {
        lenisInstance?: Lenis;
    }
}

if (typeof window !== 'undefined') {
    // Inisialisasi Lenis Smooth Scroll
    const lenis = new Lenis({
        autoRaf: true,
        anchors: true,
        smoothWheel: true,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    window.lenisInstance = lenis;

    const removeShield = () => {
        document.documentElement.classList.remove('is-restoring-scroll');
    };

    // Lepas perisai & perbarui ukuran kalkulasi Lenis saat Inertia selesai bernavigasi
    document.addEventListener('inertia:navigate', () => {
        requestAnimationFrame(() => {
            lenis.resize();
            requestAnimationFrame(removeShield);
        });
    });

    document.addEventListener('inertia:finish', () => {
        requestAnimationFrame(() => {
            lenis.resize();
        });
    });

    // Cadangan waktu agar perisai selalu terbuka
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setTimeout(removeShield, 80);
        });
    });

    let scrollDebounce: ReturnType<typeof setTimeout> | null = null;
    const saveScroll = () => {
        try {
            sessionStorage.setItem(
                'cekara_scroll_' + window.location.pathname,
                String(Math.round(lenis.scroll)),
            );
        } catch (_) {}
    };

    lenis.on('scroll', () => {
        if (!scrollDebounce) {
            scrollDebounce = setTimeout(() => {
                scrollDebounce = null;
                saveScroll();
            }, 50);
        }
    });

    window.addEventListener('beforeunload', saveScroll, { capture: true });
    window.addEventListener('pagehide', saveScroll, { capture: true });

    // Pulihkan posisi scroll saat halaman dimuat jika ada data tersimpan
    const path = window.location.pathname;
    const savedScroll = sessionStorage.getItem('cekara_scroll_' + path);
    const scrollY = savedScroll ? parseInt(savedScroll, 10) : 0;
    if (scrollY > 50) {
        lenis.scrollTo(scrollY, { immediate: true });
    }
}

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },
});
