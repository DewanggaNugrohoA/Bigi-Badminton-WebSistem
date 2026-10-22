import { cn } from "@/lib/utils";

interface ShuttlecockSilhouetteProps {
    className?: string;
}

/**
 * Dekorasi siluet shuttlecock samar untuk area judul/header halaman user.
 * Diposisikan absolut di kanan atas, di belakang konten (pointer-events-none).
 */
export function ShuttlecockSilhouette({ className }: ShuttlecockSilhouetteProps) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none select-none absolute -top-3 -right-3 sm:-top-5 sm:-right-4 md:-top-6 md:-right-6 z-0 overflow-hidden",
                "text-slate-300/40",
                className
            )}
        >
            <svg
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-20 h-20 min-[380px]:w-24 min-[380px]:h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-44 lg:h-44 -rotate-12 transform"
            >
                {/* Kepala gabus (cork base) */}
                <path
                    d="M62 118 C62 134 71 144 80 144 C89 144 98 134 98 118 Z"
                    fill="currentColor"
                />
                {/* Pita pembungkus gabus */}
                <rect
                    x="61"
                    y="112"
                    width="38"
                    height="5"
                    rx="1.5"
                    fill="currentColor"
                />

                {/* Badan bulu shuttlecock (siluet isi) */}
                <path
                    d="M26 30 C30 27 40 25 50 24 C60 23 70 23 80 23 C90 23 100 23 110 24 C120 25 130 27 134 30 L97 108 L63 108 Z"
                    fill="currentColor"
                    fillOpacity="0.4"
                />

                {/* Garis tepi luar bulu */}
                <path
                    d="M26 30 L63 108 M134 30 L97 108"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Batang bulu (rachis) di bagian dalam */}
                <path
                    d="M38 27 L67 108 M51 25 L71 108 M65 23.5 L76 108 M80 23 L80 108 M95 23.5 L84 108 M109 25 L89 108 M122 27 L93 108"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeOpacity="0.8"
                />

                {/* Lengkungan ujung mahkota bulu */}
                <path
                    d="M26 30 Q32 25 38 27 Q44.5 23 51 25 Q58 21.5 65 23.5 Q72.5 21 80 23 Q87.5 21 95 23.5 Q102 21.5 109 25 Q115.5 23 122 27 Q128 25 134 30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Tali pengikat bulu atas */}
                <path
                    d="M39 56 C50 60 70 62 80 62 C90 62 110 60 121 56"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                />
                {/* Tali pengikat bulu bawah */}
                <path
                    d="M49 80 C58 83 70 84.5 80 84.5 C90 84.5 102 83 111 80"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                />
            </svg>
        </div>
    );
}
