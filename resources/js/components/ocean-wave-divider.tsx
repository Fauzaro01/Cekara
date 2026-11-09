import React from 'react';

interface OceanWaveDividerProps {
    className?: string;
    fillColor?: string;
}

/**
 * OceanWaveDivider
 *
 * Menggantikan garis lurus pembatas footer dengan gelombang ombak laut
 * berirama naik-turun (5 puncak & lembah berkesinambungan).
 * Menampilkan multi-layer (ombak biru laut, buih krem pantai, dan ombak warna langit utama)
 * dengan garis kontur tegas dan animasi undulasi tenang.
 */
export default function OceanWaveDivider({
    className = '',
    fillColor = '#D6EDFC',
}: OceanWaveDividerProps) {
    return (
        <div
            className={`pointer-events-none relative w-full overflow-hidden leading-none select-none ${className}`}
            aria-hidden="true"
        >
            <style>{`
                @keyframes ocean-wave-bob-1 {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }
                @keyframes ocean-wave-bob-2 {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(4px);
                    }
                }
                @keyframes ocean-wave-bob-3 {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-3px);
                    }
                }
                .anim-ocean-layer-1 {
                    animation: ocean-wave-bob-1 8s ease-in-out infinite;
                    will-change: transform;
                }
                .anim-ocean-layer-2 {
                    animation: ocean-wave-bob-2 11s ease-in-out infinite;
                    will-change: transform;
                }
                .anim-ocean-layer-3 {
                    animation: ocean-wave-bob-3 6.5s ease-in-out infinite;
                    will-change: transform;
                }
                @media (prefers-reduced-motion: reduce) {
                    .anim-ocean-layer-1,
                    .anim-ocean-layer-2,
                    .anim-ocean-layer-3 {
                        animation: none !important;
                    }
                }
            `}</style>

            <svg
                viewBox="0 0 1440 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                className="-mb-[1px] block h-14 w-full sm:h-20 md:h-24 lg:h-28"
            >
                {/* LAPISAN 1: Air Laut Dalam (Aksen Biru Laut Lembut Cekara #8ECDF0) */}
                <g className="anim-ocean-layer-1">
                    <path
                        d="M 0,55 C 60,35 120,30 190,30 C 270,30 330,68 410,68 C 490,68 550,28 630,28 C 710,28 770,66 850,66 C 930,66 990,26 1070,26 C 1150,26 1210,65 1290,65 C 1350,65 1400,50 1440,42 L 1440,140 L 0,140 Z"
                        fill="rgba(142, 205, 240, 0.35)"
                    />
                    <path
                        d="M 0,55 C 60,35 120,30 190,30 C 270,30 330,68 410,68 C 490,68 550,28 630,28 C 710,28 770,66 850,66 C 930,66 990,26 1070,26 C 1150,26 1210,65 1290,65 C 1350,65 1400,50 1440,42"
                        fill="none"
                        stroke="#8ECDF0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </g>

                {/* LAPISAN 2: Buih Ombak Pasir Pantai (Aksen Krem Hangat #FFEEDB) */}
                <g className="anim-ocean-layer-2">
                    <path
                        d="M 0,45 C 50,68 110,72 170,55 C 230,38 290,34 360,52 C 430,70 490,74 560,56 C 630,38 690,34 760,50 C 830,66 890,72 960,54 C 1030,36 1090,34 1160,50 C 1230,66 1290,72 1360,52 C 1390,44 1420,40 1440,42 L 1440,140 L 0,140 Z"
                        fill="rgba(255, 238, 219, 0.85)"
                    />
                    <path
                        d="M 0,45 C 50,68 110,72 170,55 C 230,38 290,34 360,52 C 430,70 490,74 560,56 C 630,38 690,34 760,50 C 830,66 890,72 960,54 C 1030,36 1090,34 1160,50 C 1230,66 1290,72 1360,52 C 1390,44 1420,40 1440,42"
                        fill="none"
                        stroke="#E2CCA8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </g>

                {/* LAPISAN 3: Ombak Putih Utama (Solid White & Garis Kontur Gelombang Naik-Turun) */}
                <g className="anim-ocean-layer-3">
                    <path
                        d="M 0,65 C 50,42 80,25 125,25 C 175,25 210,72 260,72 C 310,72 360,20 410,20 C 465,20 505,75 560,75 C 610,75 650,24 700,24 C 750,24 790,68 840,68 C 890,68 935,18 995,18 C 1055,18 1095,72 1150,72 C 1205,72 1245,26 1295,26 C 1345,26 1390,65 1440,65 L 1440,140 L 0,140 Z"
                        fill={fillColor}
                    />
                    {/* Garis Gelombang Laut Utama yang Tegas & Naik Turun */}
                    <path
                        d="M 0,65 C 50,42 80,25 125,25 C 175,25 210,72 260,72 C 310,72 360,20 410,20 C 465,20 505,75 560,75 C 610,75 650,24 700,24 C 750,24 790,68 840,68 C 890,68 935,18 995,18 C 1055,18 1095,72 1150,72 C 1205,72 1245,26 1295,26 C 1345,26 1390,65 1440,65"
                        fill="none"
                        stroke="#3B2A1E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </g>
            </svg>
        </div>
    );
}
