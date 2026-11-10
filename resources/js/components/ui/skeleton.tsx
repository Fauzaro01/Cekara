import React, { useState, useEffect } from 'react';

/**
 * Hook to provide a smooth sparkling skeleton animation during page mount / data display
 */
export function useSkeletonMount(durationMs = 280) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, durationMs);

        return () => clearTimeout(timer);
    }, [durationMs]);

    return isLoading;
}

/**
 * Base shimmering skeleton block
 */
export function Skeleton({
    className = '',
    style,
}: {
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}

/**
 * Retro-style card with sparkling beam skeleton effect
 */
export function SkeletonCard({
    className = '',
    children,
    style,
}: {
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={`skeleton-card p-5 sm:p-6 ${className}`}
            style={style}
            aria-hidden="true"
        >
            {children}
        </div>
    );
}

/**
 * Stat Metric Cards Skeleton (used across dashboards & admin panels)
 */
export function StatCardsSkeleton({ count = 4, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 ${className}`} aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton-card p-4 sm:p-5"
                >
                    <Skeleton className="h-3.5 w-24 rounded-md mb-3" />
                    <Skeleton className="h-8 w-16 rounded-xl mb-2.5" />
                    <Skeleton className="h-2.5 w-32 rounded-md opacity-80" />
                </div>
            ))}
        </div>
    );
}

/**
 * Admin Dashboard Skeleton (Metrics + Chart + Provider Card + Recent Activity)
 */
export function AdminDashboardSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200" aria-label="Memuat data dashboard admin...">
            {/* Header Greeting Skeleton */}
            <div className="skeleton-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#FFF8EC]">
                <div className="flex-1 space-y-3 w-full">
                    <Skeleton className="h-4 w-36 rounded-full" />
                    <Skeleton className="h-8 sm:h-10 w-72 rounded-2xl" />
                    <Skeleton className="h-3.5 w-full max-w-md rounded-lg" />
                </div>
                <Skeleton className="size-24 sm:size-28 rounded-full shrink-0" />
            </div>

            {/* Quick Action Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card p-5 space-y-3">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-3 w-full rounded-md" />
                        <Skeleton className="h-3 w-3/4 rounded-md" />
                        <div className="pt-2">
                            <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Metrics Skeleton */}
            <StatCardsSkeleton count={4} />

            {/* Chart Area Skeleton */}
            <div className="skeleton-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFE3D0] pb-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-52 rounded-lg" />
                        <Skeleton className="h-3 w-40 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-28 rounded-xl" />
                </div>
                {/* Bar chart placeholder columns */}
                <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 px-4">
                    {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <Skeleton
                                className="w-full rounded-t-lg"
                                style={{ height: `${25 + (i * 17) % 70}%` }}
                            />
                            <Skeleton className="h-2 w-full rounded-sm" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Scans Table Skeleton */}
            <div className="skeleton-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFE3D0] pb-4">
                    <Skeleton className="h-5 w-48 rounded-lg" />
                    <Skeleton className="h-7 w-24 rounded-xl" />
                </div>
                <div className="space-y-3 pt-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-[#EFE3D0] bg-[#FFF8EC]/50">
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-10 rounded-full shrink-0" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-36 rounded-md" />
                                    <Skeleton className="h-2.5 w-48 rounded-md" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Users Management Table Skeleton (Admin)
 */
export function UsersTableSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200" aria-label="Memuat data pengguna...">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64 rounded-2xl" />
                <Skeleton className="h-4 w-96 rounded-lg max-w-full" />
            </div>

            {/* Stat Cards Skeleton */}
            <StatCardsSkeleton count={4} />

            {/* Search and Filter Toolbar Skeleton */}
            <div className="skeleton-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
                <div className="flex gap-2 w-full sm:w-auto">
                    <Skeleton className="h-9 w-32 rounded-xl" />
                    <Skeleton className="h-9 w-32 rounded-xl" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="skeleton-card overflow-hidden p-0">
                <div className="border-b-2 border-[#3B2A1E] bg-[#FFF8EC] p-4 flex items-center justify-between">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                </div>
                <div className="divide-y divide-[#EFE3D0]">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <Skeleton className="size-9 rounded-full shrink-0" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-36 rounded-md" />
                                    <Skeleton className="h-2.5 w-44 rounded-md" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-lg" />
                            <Skeleton className="h-5 w-24 rounded-lg" />
                            <Skeleton className="h-3.5 w-24 rounded-md" />
                            <Skeleton className="h-8 w-28 rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * LLM Providers Skeleton (Admin)
 */
export function LlmProvidersSkeleton() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-8 animate-in fade-in duration-200" aria-label="Memuat konfigurasi provider AI...">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-60 rounded-2xl" />
                <Skeleton className="h-4 w-96 rounded-lg max-w-full" />
            </div>

            {/* Fallback Notice Card Skeleton */}
            <div className="skeleton-card p-5 flex items-start gap-3">
                <Skeleton className="size-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-48 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                </div>
            </div>

            {/* 3 Provider Cards Skeleton */}
            <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton-card p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-[#EFE3D0] pb-3">
                            <div className="flex items-center gap-2.5">
                                <Skeleton className="h-6 w-32 rounded-lg" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-7 w-28 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-20 rounded-md" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-28 rounded-md" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Skeleton className="h-9 w-24 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * User Dashboard Skeleton (Guardian Warga)
 */
export function UserDashboardSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200" aria-label="Memuat dashboard warga...">
            {/* Guardian Status Hero Skeleton */}
            <div className="skeleton-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#FFF8EC]">
                <div className="flex-1 space-y-3 w-full">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-8 sm:h-10 w-80 rounded-2xl" />
                    <Skeleton className="h-3.5 w-full max-w-lg rounded-lg" />
                    <div className="flex gap-3 pt-2">
                        <Skeleton className="h-9 w-32 rounded-xl" />
                        <Skeleton className="h-9 w-36 rounded-xl" />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <Skeleton className="size-28 sm:size-32 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                </div>
            </div>

            {/* Stat Cards */}
            <StatCardsSkeleton count={4} />

            {/* Split Grid: Recent Scans & Simulations */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Scans Skeleton */}
                <div className="skeleton-card p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EFE3D0] pb-3">
                        <Skeleton className="h-5 w-44 rounded-lg" />
                        <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-[#EFE3D0] bg-[#FFF8EC]/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-28 rounded-md" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-full rounded-md" />
                                <Skeleton className="h-2.5 w-32 rounded-md opacity-75" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Simulation Attempts Skeleton */}
                <div className="skeleton-card p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EFE3D0] pb-3">
                        <Skeleton className="h-5 w-44 rounded-lg" />
                        <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-[#EFE3D0] bg-[#FFF8EC]/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-36 rounded-md" />
                                    <Skeleton className="h-5 w-14 rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-4/5 rounded-md" />
                                <Skeleton className="h-2.5 w-24 rounded-md opacity-75" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Simulations List Skeleton (Laboratorium Simulasi)
 */
export function SimulationsSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200" aria-label="Memuat simulasi Cekara...">
            {/* Header Hero Banner Skeleton */}
            <div className="skeleton-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#FFE27A]/40">
                <div className="space-y-3 flex-1 w-full">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-8 sm:h-10 w-72 rounded-2xl" />
                    <Skeleton className="h-3.5 w-full max-w-md rounded-lg" />
                </div>
                <Skeleton className="size-24 rounded-full shrink-0" />
            </div>

            {/* Filter Tabs Skeleton */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-28 rounded-xl shrink-0" />
                ))}
            </div>

            {/* Grid of Simulation Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-24 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-4/5 rounded-lg" />
                        <Skeleton className="h-3.5 w-full rounded-md" />
                        <Skeleton className="h-3.5 w-3/4 rounded-md" />
                        <div className="pt-3 border-t border-[#EFE3D0] flex items-center justify-between">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-9 w-28 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Radar / Komunitas Skeleton
 */
export function RadarSkeleton() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-8 space-y-8 animate-in fade-in duration-200" aria-label="Memuat radar komunitas...">
            {/* Header & Tabs Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-60 rounded-2xl" />
                <Skeleton className="h-4 w-96 rounded-lg max-w-full" />
                <div className="flex gap-3 pt-2">
                    <Skeleton className="h-10 w-48 rounded-2xl" />
                    <Skeleton className="h-10 w-48 rounded-2xl" />
                </div>
            </div>

            {/* Search & Sort Toolbar Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Skeleton className="h-11 w-full sm:max-w-md rounded-2xl" />
                <Skeleton className="h-9 w-36 rounded-xl" />
            </div>

            {/* List of Discussion / Alert Cards Skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Skeleton className="size-8 rounded-full" />
                                <Skeleton className="h-4 w-32 rounded-md" />
                                <Skeleton className="h-4 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-5 w-24 rounded-md" />
                        </div>
                        <Skeleton className="h-6 w-3/4 rounded-lg" />
                        <Skeleton className="h-3.5 w-full rounded-md" />
                        <Skeleton className="h-3.5 w-2/3 rounded-md" />
                        <div className="flex items-center justify-between pt-2 border-t border-[#EFE3D0]">
                            <div className="flex gap-2">
                                <Skeleton className="h-7 w-16 rounded-lg" />
                                <Skeleton className="h-7 w-16 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-28 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Tanggap Darurat / Emergency Skeleton
 */
export function EmergencySkeleton() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-8 animate-in fade-in duration-200" aria-label="Memuat panduan darurat...">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64 rounded-2xl" />
                <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
            </div>

            {/* Progress Card Skeleton */}
            <div className="skeleton-card p-6 space-y-3 bg-[#FFE27A]/30">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-44 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-full rounded-full" />
            </div>

            {/* Contact Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton-card p-5 space-y-2.5">
                        <Skeleton className="size-9 rounded-xl" />
                        <Skeleton className="h-5 w-28 rounded-md" />
                        <Skeleton className="h-3 w-full rounded-md" />
                        <Skeleton className="h-7 w-24 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Steps Checklist Skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card p-5 flex items-start gap-4">
                        <Skeleton className="size-6 rounded-lg shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48 rounded-md" />
                            <Skeleton className="h-3 w-full rounded-md" />
                            <Skeleton className="h-3 w-3/4 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Family Guide Skeleton
 */
export function FamilySkeleton() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-8 animate-in fade-in duration-200" aria-label="Memuat modul literasi keluarga...">
            {/* Hero Banner Skeleton */}
            <div className="skeleton-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#8ECDF0]/30">
                <div className="space-y-3 flex-1 w-full">
                    <Skeleton className="h-4 w-36 rounded-full" />
                    <Skeleton className="h-8 sm:h-10 w-72 rounded-2xl" />
                    <Skeleton className="h-3.5 w-full max-w-md rounded-lg" />
                </div>
                <Skeleton className="size-24 rounded-full shrink-0" />
            </div>

            {/* Family Module Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-11 rounded-2xl shrink-0" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-5 w-36 rounded-lg" />
                                <Skeleton className="h-3 w-24 rounded-md" />
                            </div>
                        </div>
                        <Skeleton className="h-3.5 w-full rounded-md" />
                        <Skeleton className="h-3.5 w-4/5 rounded-md" />
                        <div className="pt-2 flex justify-end">
                            <Skeleton className="h-9 w-28 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Profile Edit Skeleton
 */
export function ProfileSkeleton() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200" aria-label="Memuat pengaturan profil...">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-2xl" />
                <Skeleton className="h-4 w-72 rounded-lg" />
            </div>

            <div className="skeleton-card p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-[#EFE3D0] pb-6">
                    <Skeleton className="size-20 rounded-full shrink-0" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-36 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-xl" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
