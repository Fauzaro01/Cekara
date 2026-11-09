import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    AlertTriangle,
    ShieldCheck,
    CheckCircle2,
    Copy,
    Check,
    Share2,
    RotateCcw,
    Calendar,
    FileText,
    Image as ImageIcon,
    Globe,
    LifeBuoy,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

export interface ScanDetail {
    id?: number;
    public_id: string;
    scan_type: 'text' | 'url' | 'image' | string;
    risk_level: string;
    score: number;
    summary: string;
    red_flags: string[];
    recommendations: string[];
    content: string;
    image_url?: string | null;
    share_url?: string;
    created_at?: string;
    formatted_date?: string;
    relative_time?: string;
    provider_used?: string | null;
    model_used?: string | null;
    is_mock?: boolean;
    metadata?: Record<string, unknown> | null;
}

export interface ScanShowProps {
    scan: ScanDetail;
    share_url?: string;
}

export default function ScanShow({ scan, share_url }: ScanShowProps) {
    const [copied, setCopied] = useState(false);

    // Normalize risk level
    const rawLevel = String(scan.risk_level || 'MEDIUM').toUpperCase();
    const isHigh =
        rawLevel.includes('HIGH') ||
        rawLevel.includes('TINGGI') ||
        rawLevel.includes('DANGER');
    const isMedium =
        !isHigh &&
        (rawLevel.includes('MED') ||
            rawLevel.includes('SEDANG') ||
            rawLevel.includes('WARN'));

    const levelBadge = isHigh
        ? {
              label: 'Hati-hati, ini mencurigakan',
              bgClass: 'bg-[#D4573A] text-white',
              barColor: 'bg-[#D4573A]',
              icon: AlertTriangle,
          }
        : isMedium
          ? {
                label: 'Yuk cek dulu',
                bgClass: 'bg-[#FFE27A] text-[#3B2A1E]',
                barColor: 'bg-[#FFE27A]',
                icon: AlertTriangle,
            }
          : {
                label: 'Belum ketemu tanda bahaya, tapi tetap cek ya',
                bgClass: 'bg-[#8ECDF0] text-[#3B2A1E]',
                barColor: 'bg-[#8ECDF0]',
                icon: ShieldCheck,
            };

    const typeMeta = (() => {
        switch (scan.scan_type) {
            case 'image':
                return { label: 'Tangkapan Layar', icon: ImageIcon };
            case 'url':
                return { label: 'Tautan Web', icon: Globe };
            case 'text':
            default:
                return { label: 'Pesan Teks', icon: FileText };
        }
    })();

    const resolvedShareUrl =
        share_url ||
        scan.share_url ||
        (typeof window !== 'undefined'
            ? `${window.location.origin}/scans/${scan.public_id}`
            : `/scans/${scan.public_id}`);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(resolvedShareUrl);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = resolvedShareUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy share link:', err);
        }
    };

    const handleWhatsAppShare = () => {
        const message =
            `*Peringatan Keamanan CEKARA*\n\n` +
            `Status: *${levelBadge.label}*\n` +
            `Ringkasan: "${scan.summary}"\n\n` +
            `Lihat rincian hasil investigasi di sini:\n${resolvedShareUrl}\n\n` +
            `_Cek dulu sebelum percaya bersama Cekara._`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const displayDate =
        scan.formatted_date ||
        (scan.created_at
            ? new Date(scan.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : 'Tanggal tidak tercatat');

    const displayRelative = scan.relative_time ? ` (${scan.relative_time})` : '';

    return (
        <AppLayout>
            <Head
                title={`Hasil Pemeriksaan #${scan.public_id ? scan.public_id.slice(0, 8) : 'Scan'} - CEKARA`}
            />

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
                {/* Header & Breadcrumb */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/"
                        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-[#6B5646] transition-colors hover:text-[#3B2A1E]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Kembali ke Beranda</span>
                    </Link>

                    <div className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border-2 border-[#3B2A1E] bg-[#FFF8EC] px-3.5 py-1 text-xs font-bold text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#FF9A3C]" />
                        <span>Arsip Investigasi Publik CEKARA</span>
                    </div>
                </div>

                {/* Main Scan Card */}
                <article className="rounded-[24px] border-2 border-[#3B2A1E] bg-white p-6 shadow-[4px_4px_0px_0px_#3B2A1E] sm:p-8">
                    {/* Status & Metadata Bar */}
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#EFE3D0] pb-5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Official Risk Status Badge */}
                            <div
                                className={`inline-flex min-h-[32px] items-center gap-2 rounded-full border-2 border-[#3B2A1E] px-4 py-1 text-sm font-bold ${levelBadge.bgClass}`}
                            >
                                <levelBadge.icon className="h-4 w-4 shrink-0" />
                                <span>{levelBadge.label}</span>
                            </div>

                            {/* Scan Type Badge */}
                            <span className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border-2 border-[#3B2A1E] bg-[#FFF8EC] px-3 py-1 text-xs font-bold text-[#3B2A1E]">
                                <typeMeta.icon className="h-3.5 w-3.5 text-[#6B5646]" />
                                <span>{typeMeta.label}</span>
                            </span>
                        </div>

                        {/* Date Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B5646]">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                                {displayDate}
                                {displayRelative}
                            </span>
                        </div>
                    </div>

                    {/* Headline / Summary */}
                    <h1 className="mb-4 font-['Fredoka',system-ui,sans-serif] text-2xl font-bold leading-snug text-[#3B2A1E] sm:text-3xl">
                        {scan.summary}
                    </h1>

                    {/* Risk Score Indicator */}
                    <div className="mb-6 rounded-2xl border-2 border-[#EFE3D0] bg-[#FFF8EC]/60 p-4">
                        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#3B2A1E]">
                            <span>Indikator Tingkat Risiko</span>
                            <span className="font-mono text-sm">{scan.score} / 100</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full border border-[#3B2A1E] bg-[#EFE3D0]">
                            <div
                                className={`h-full transition-all duration-500 ${levelBadge.barColor}`}
                                style={{
                                    width: `${Math.min(100, Math.max(0, scan.score))}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Analyzed Content (Screenshot or Text/URL) */}
                    <div className="mb-6">
                        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6B5646]">
                            Konten yang Diperiksa:
                        </h2>
                        {scan.scan_type === 'image' && scan.image_url ? (
                            <div className="overflow-hidden rounded-2xl border-2 border-[#8ECDF0] bg-[#FFF8EC]/40 p-4 text-center">
                                <img
                                    src={scan.image_url}
                                    alt="Tangkapan layar yang diperiksa"
                                    className="max-h-96 w-auto object-contain mx-auto rounded-xl border border-[#3B2A1E] shadow-sm"
                                />
                                {scan.content &&
                                    scan.content !==
                                        'Tangkapan layar untuk dianalisis indikasi penipuan digital.' && (
                                        <p className="mt-3 text-xs font-mono text-[#6B5646] italic">
                                            Catatan: {scan.content}
                                        </p>
                                    )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-[#8ECDF0] bg-[#FFF8EC]/40 p-4 font-mono text-xs sm:text-sm text-[#3B2A1E] whitespace-pre-wrap break-words">
                                {scan.content || 'Konten tidak tersedia.'}
                            </div>
                        )}
                    </div>

                    {/* Red Flags / Temuan Mencurigakan */}
                    <div className="mb-6">
                        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#A8412A]">
                            Tanda Janggal yang Ditemukan:
                        </h2>
                        {scan.red_flags && scan.red_flags.length > 0 ? (
                            <ul className="space-y-2.5">
                                {scan.red_flags.map((flag, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-3 rounded-xl border-2 border-[#EFE3D0] bg-white p-3.5 text-sm text-[#3B2A1E] shadow-[1px_1px_0px_0px_#3B2A1E]"
                                    >
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#3B2A1E] bg-[#FFE27A] text-xs font-bold text-[#3B2A1E]">
                                            !
                                        </span>
                                        <span className="leading-snug">{flag}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="rounded-xl border-2 border-[#EFE3D0] bg-[#FFF8EC]/40 p-3.5 text-xs italic text-[#6B5646]">
                                Belum ditemukan indikasi janggal yang mencolok pada konten ini.
                            </p>
                        )}
                    </div>

                    {/* Recommendations / Langkah Aman yang Disarankan */}
                    <div className="mb-8">
                        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#3B2A1E]">
                            Langkah Aman yang Disarankan:
                        </h2>
                        {scan.recommendations && scan.recommendations.length > 0 ? (
                            <div className="space-y-2.5">
                                {scan.recommendations.map((rec, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 rounded-xl border-2 border-[#8ECDF0] bg-white p-3.5 text-sm font-semibold text-[#3B2A1E] shadow-[1px_1px_0px_0px_#8ECDF0]"
                                    >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF9A3C]" />
                                        <span className="leading-snug">{rec}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl border-2 border-[#EFE3D0] bg-[#FFF8EC]/40 p-3.5 text-xs italic text-[#6B5646]">
                                Tetap waspada dan jangan terburu-buru memberikan data pribadi atau mentransfer uang.
                            </p>
                        )}
                    </div>

                    {/* Action Bar: Share & CTAs */}
                    <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-5 shadow-[2px_2px_0px_0px_#3B2A1E]">
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#3B2A1E]">
                            Bagikan Hasil Pemeriksaan Ini:
                        </h3>

                        {/* Copy Link Input */}
                        <div className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <label htmlFor="share-link-input" className="sr-only">
                                Tautan Hasil Pemeriksaan
                            </label>
                            <input
                                id="share-link-input"
                                type="text"
                                readOnly
                                value={resolvedShareUrl}
                                className="flex-1 min-h-[44px] rounded-xl border-2 border-[#3B2A1E] bg-white px-3 py-2 text-xs font-mono text-[#3B2A1E] select-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B2A1E]"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="flex h-11 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-5 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:bg-[#FF9A3C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 text-[#3B2A1E]" />
                                        <span>Tersalin!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 text-[#3B2A1E]" />
                                        <span>Salin Tautan</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* WhatsApp Share Button */}
                        <button
                            type="button"
                            onClick={handleWhatsAppShare}
                            className="mb-4 flex h-11 min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#8ECDF0] px-4 text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:bg-[#78bfe6] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >
                            <Share2 className="h-4 w-4 text-[#3B2A1E]" />
                            <span>Bagikan ke WhatsApp</span>
                        </button>

                        {/* Navigation CTAs */}
                        <div className="grid gap-2.5 sm:grid-cols-2 pt-3 border-t-2 border-[#EFE3D0]">
                            <Link
                                href="/#pemeriksa"
                                className="flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-4 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:bg-[#ff8e26] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Periksa Pesan / Gambar Lain</span>
                            </Link>

                            <Link
                                href="/tanggap-darurat"
                                className="flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-white px-4 text-xs font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] transition hover:bg-[#FFE27A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            >
                                <LifeBuoy className="h-3.5 w-3.5 text-[#FF9A3C]" />
                                <span>Panduan Tanggap Darurat</span>
                            </Link>
                        </div>
                    </div>

                    {/* Product Transparency Disclaimer */}
                    <p className="mt-5 border-t border-[#EFE3D0] pt-4 text-xs text-[#6B5646]">
                        * Hasil ini merupakan perkiraan edukatif berdasarkan kecocokan pola umum dan bukan vonis mutlak.
                        Tetap verifikasi ke kanal resmi sebelum mengambil keputusan.
                    </p>
                </article>
            </div>
        </AppLayout>
    );
}

