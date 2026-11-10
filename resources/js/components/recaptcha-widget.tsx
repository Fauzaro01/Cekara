import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import { useTheme } from '@/hooks/use-theme';

export interface RecaptchaWidgetRef {
    reset: () => void;
    getResponse: () => string;
}

export type RecaptchaRef = RecaptchaWidgetRef;

export interface RecaptchaWidgetProps {
    siteKey: string;
    onChange?: (token: string) => void;
    onVerify?: (token: string) => void;
    onExpired?: () => void;
    onExpire?: () => void;
    onError?: () => void;
    theme?: 'light' | 'dark';
    size?: 'normal' | 'compact';
    tabindex?: number;
    className?: string;
}

let scriptPromise: Promise<void> | null = null;

export function loadRecaptchaScript(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        return Promise.resolve();
    }

    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise<void>((resolve, reject) => {
        const prevCallback = window.onRecaptchaLoad;
        window.onRecaptchaLoad = () => {
            if (typeof prevCallback === 'function') {
                prevCallback();
            }
            resolve();
        };

        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[src*="google.com/recaptcha/api.js"]',
        );

        if (existingScript) {
            if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
                resolve();
                return;
            }
            const prevOnload = existingScript.onload;
            existingScript.onload = (e) => {
                if (typeof prevOnload === 'function') {
                    prevOnload.call(existingScript, e);
                }
                if (window.grecaptcha) {
                    window.grecaptcha.ready(() => resolve());
                } else {
                    resolve();
                }
            };
            existingScript.onerror = (e) => {
                scriptPromise = null;
                reject(e);
            };
            return;
        }

        const script = document.createElement('script');
        script.src =
            'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit&hl=id';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.grecaptcha) {
                window.grecaptcha.ready(() => resolve());
            } else {
                resolve();
            }
        };
        script.onerror = (err) => {
            scriptPromise = null;
            reject(err);
        };
        document.head.appendChild(script);
    });

    return scriptPromise;
}

export const RecaptchaWidget = forwardRef<
    RecaptchaWidgetRef,
    RecaptchaWidgetProps
>(function RecaptchaWidget(
    {
        siteKey,
        onChange,
        onVerify,
        onExpired,
        onExpire,
        onError,
        theme,
        size,
        tabindex,
        className,
    },
    ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const { isDark } = useTheme();
    const currentTheme = theme || (isDark ? 'dark' : 'light');

    useImperativeHandle(
        ref,
        () => ({
            reset: () => {
                if (widgetIdRef.current !== null && window.grecaptcha) {
                    try {
                        window.grecaptcha.reset(widgetIdRef.current);
                    } catch (e) {
                        console.warn('reCAPTCHA reset warning:', e);
                    }
                }
            },
            getResponse: () => {
                if (widgetIdRef.current !== null && window.grecaptcha) {
                    try {
                        return window.grecaptcha.getResponse(widgetIdRef.current);
                    } catch {
                        return '';
                    }
                }
                return '';
            },
        }),
        [],
    );

    useEffect(() => {
        let isMounted = true;

        loadRecaptchaScript()
            .then(() => {
                if (!isMounted || !containerRef.current || !window.grecaptcha) {
                    return;
                }
                if (widgetIdRef.current !== null) {
                    return;
                }

                window.grecaptcha.ready(() => {
                    if (
                        !isMounted ||
                        !containerRef.current ||
                        !window.grecaptcha
                    ) {
                        return;
                    }
                    if (widgetIdRef.current !== null) {
                        return;
                    }

                    try {
                        containerRef.current.innerHTML = '';
                        const id = window.grecaptcha.render(
                            containerRef.current,
                            {
                                sitekey: siteKey,
                                theme: currentTheme,
                                size,
                                tabindex,
                                callback: (token: string) => {
                                    if (isMounted) {
                                        onChange?.(token);
                                        onVerify?.(token);
                                    }
                                },
                                'expired-callback': () => {
                                    if (isMounted) {
                                        onExpired?.();
                                        onExpire?.();
                                        onChange?.('');
                                        onVerify?.('');
                                    }
                                },
                                'error-callback': () => {
                                    if (isMounted) {
                                        onError?.();
                                        onChange?.('');
                                        onVerify?.('');
                                    }
                                },
                                hl: 'id',
                            },
                        );
                        widgetIdRef.current = id;
                    } catch (err) {
                        console.error('Error rendering reCAPTCHA widget:', err);
                    }
                });
            })
            .catch((err) => {
                if (isMounted) {
                    console.error('Failed to load Google reCAPTCHA script:', err);
                }
            });

        return () => {
            isMounted = false;
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            widgetIdRef.current = null;
        };
    }, [siteKey, currentTheme, size, tabindex, onChange, onVerify, onExpired, onExpire, onError]);

    const wrapperClasses = [
        'flex justify-center my-3 min-h-[78px] overflow-x-auto',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={wrapperClasses}>
            <div
                ref={containerRef}
                className="inline-block min-h-[78px] min-w-[304px]"
            />
        </div>
    );
});

export default RecaptchaWidget;
