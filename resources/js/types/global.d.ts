import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

export interface Grecaptcha {
    ready(callback: () => void): void;
    render(container: string | HTMLElement, parameters: {
        sitekey: string;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
        tabindex?: number;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        hl?: string;
    }): number;
    reset(widgetId?: number): void;
    getResponse(widgetId?: number): string;
}

declare global {
    interface Window {
        grecaptcha?: Grecaptcha;
        onRecaptchaLoad?: () => void;
    }
}

