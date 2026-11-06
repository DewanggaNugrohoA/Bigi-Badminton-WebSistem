import { Link, usePage } from "@inertiajs/react";
import { ArrowUpRight } from "lucide-react";
import { useState, useMemo } from "react";

interface SharedAuthProps {
    auth?: {
        user?: {
            id_user: number;
            nama: string;
            role: string;
        } | null;
    };
    [key: string]: any;
}

export interface CommunityMemberData {
    id_user?: number;
    name: string;
    role?: string;
    img: string;
}

interface OrbitMember {
    id_user?: number;
    name: string;
    role: string;
    img: string;
    initials: string;
    color: string;
    left: string;
    top: string;
}

interface CommunityCtaCardProps {
    communityMembers?: CommunityMemberData[];
}

const DEFAULT_SLOT_MEMBERS: Array<{
    name: string;
    role: string;
    img: string;
    initials: string;
    color: string;
}> = [
    {
        name: "Maya",
        role: "Pemain Ganda",
        img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        initials: "MY",
        color: "bg-purple-500",
    },
    {
        name: "Kevin",
        role: "Tunggal Putra",
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        initials: "KV",
        color: "bg-blue-500",
    },
    {
        name: "Reza",
        role: "Pemain All-Round",
        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
        initials: "RZ",
        color: "bg-emerald-500",
    },
    {
        name: "Daniel",
        role: "Pemain Ganda",
        img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
        initials: "DN",
        color: "bg-sky-500",
    },
    {
        name: "Siska",
        role: "Ganda Campuran",
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        initials: "SK",
        color: "bg-rose-500",
    },
    {
        name: "Aris",
        role: "Pemain Regular",
        img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
        initials: "AR",
        color: "bg-amber-500",
    },
];

const AVATAR_COLORS = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-rose-600",
    "bg-amber-600",
];

function getInitials(name: string): string {
    if (!name) return "BB";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function OrbitAvatar({
    member,
    counterClass,
}: {
    member: OrbitMember;
    counterClass: string;
}) {
    const [imgError, setImgError] = useState(false);

    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{ left: member.left, top: member.top }}
        >
            <div className={`transition-transform duration-300 hover:scale-125 group relative cursor-pointer ${counterClass}`}>
                <div className="size-8 sm:size-9 lg:size-10 rounded-full border-2 border-white shadow-md overflow-hidden flex items-center justify-center bg-white text-slate-900 text-xs font-bold select-none">
                    {!imgError && member.img ? (
                        <img
                            src={member.img}
                            alt={member.name}
                            onError={() => setImgError(true)}
                            className="size-full object-cover rounded-full"
                            loading="lazy"
                        />
                    ) : (
                        <span className={`size-full flex items-center justify-center text-white font-semibold text-[11px] ${member.color}`}>
                            {member.initials}
                        </span>
                    )}
                </div>

                {/* Tooltip nama saat hover */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/95 text-white text-[11px] font-medium px-2 py-0.5 rounded-md shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 border border-white/10">
                    <span>{member.name}</span>
                    <span className="text-[9px] text-slate-400 block -mt-0.5">{member.role}</span>
                </div>
            </div>
        </div>
    );
}

export function CommunityCtaCard({ communityMembers = [] }: CommunityCtaCardProps) {
    const { auth } = usePage<SharedAuthProps>().props;
    const user = auth?.user;

    const targetUrl = user ? "/open-mabar" : "/login?redirect=/open-mabar";
    const buttonText = user ? "Buka Open Mabar" : "Masuk untuk melihat jadwal";

    // Gabungkan data akun terdaftar (yang sudah upload foto profil) ke masing-masing slot orbit
    const ring1Member = useMemo<OrbitMember>(() => {
        const custom = communityMembers[0];
        if (custom) {
            return {
                id_user: custom.id_user,
                name: custom.name,
                role: custom.role || "Member Komunitas",
                img: custom.img,
                initials: getInitials(custom.name),
                color: AVATAR_COLORS[0],
                left: "85.3%",
                top: "14.7%",
            };
        }
        const def = DEFAULT_SLOT_MEMBERS[0];
        return {
            ...def,
            left: "85.3%",
            top: "14.7%",
        };
    }, [communityMembers]);

    const ring2Members = useMemo<OrbitMember[]>(() => {
        const positions = [
            { left: "50%", top: "0%" },
            { left: "9%", top: "78.6%" },
        ];

        return positions.map((pos, idx) => {
            const memberIdx = idx + 1; // index 1 dan 2
            const custom = communityMembers[memberIdx];
            if (custom) {
                return {
                    id_user: custom.id_user,
                    name: custom.name,
                    role: custom.role || "Member Komunitas",
                    img: custom.img,
                    initials: getInitials(custom.name),
                    color: AVATAR_COLORS[memberIdx % AVATAR_COLORS.length],
                    left: pos.left,
                    top: pos.top,
                };
            }
            const def = DEFAULT_SLOT_MEMBERS[memberIdx];
            return {
                ...def,
                left: pos.left,
                top: pos.top,
            };
        });
    }, [communityMembers]);

    const ring3Members = useMemo<OrbitMember[]>(() => {
        const positions = [
            { left: "88.3%", top: "17.9%" },
            { left: "99.2%", top: "58.7%" },
            { left: "50%", top: "100%" },
        ];

        return positions.map((pos, idx) => {
            const memberIdx = idx + 3; // index 3, 4, 5
            const custom = communityMembers[memberIdx];
            if (custom) {
                return {
                    id_user: custom.id_user,
                    name: custom.name,
                    role: custom.role || "Member Komunitas",
                    img: custom.img,
                    initials: getInitials(custom.name),
                    color: AVATAR_COLORS[memberIdx % AVATAR_COLORS.length],
                    left: pos.left,
                    top: pos.top,
                };
            }
            const def = DEFAULT_SLOT_MEMBERS[memberIdx];
            return {
                ...def,
                left: pos.left,
                top: pos.top,
            };
        });
    }, [communityMembers]);

    return (
        <div className="w-full">
            <style>{`
                @keyframes orbit-spin-cw {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes orbit-spin-ccw {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(-360deg); }
                }
                @keyframes counter-spin-cw {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes counter-spin-ccw {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                @keyframes center-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.35; }
                    50% { transform: scale(1.15); opacity: 0.75; }
                }

                .orbit-ring-1 {
                    animation: orbit-spin-cw 24s linear infinite;
                }
                .orbit-counter-1 {
                    animation: counter-spin-ccw 24s linear infinite;
                }

                .orbit-ring-2 {
                    animation: orbit-spin-ccw 36s linear infinite;
                }
                .orbit-counter-2 {
                    animation: counter-spin-cw 36s linear infinite;
                }

                .orbit-ring-3 {
                    animation: orbit-spin-cw 48s linear infinite;
                }
                .orbit-counter-3 {
                    animation: counter-spin-ccw 48s linear infinite;
                }

                .orbit-center-glow {
                    animation: center-pulse 4s ease-in-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .orbit-ring-1, .orbit-counter-1,
                    .orbit-ring-2, .orbit-counter-2,
                    .orbit-ring-3, .orbit-counter-3,
                    .orbit-center-glow {
                        animation: none !important;
                    }
                }
            `}</style>

            <div className="relative rounded-3xl sm:rounded-[36px] border border-sky-500/30 bg-gradient-to-br from-slate-950 via-[#0b172e] to-[#070d1d] text-white shadow-2xl shadow-slate-950/40 overflow-hidden p-6 sm:p-10 lg:p-14">
                
                {/* Background glow ambient */}
                <div
                    className="absolute -top-24 -left-24 size-[400px] bg-sky-500/20 rounded-full blur-3xl pointer-events-none -z-10"
                    aria-hidden="true"
                />
                <div
                    className="absolute -bottom-24 -right-24 size-[420px] bg-indigo-500/25 rounded-full blur-3xl pointer-events-none -z-10"
                    aria-hidden="true"
                />
                <div
                    className="absolute top-1/2 right-1/4 -translate-y-1/2 size-[350px] bg-sky-400/15 rounded-full blur-3xl pointer-events-none -z-10"
                    aria-hidden="true"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* Sisi Kiri: Teks & Aksi */}
                    <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
                        <h2 className="font-heading font-extrabold text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-[40px] text-white tracking-tight leading-[1.2] drop-shadow-md">
                            Gabung Komunitas{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">
                                Open Mabar Bigi
                            </span>
                        </h2>

                        <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed max-w-xl drop-shadow-sm font-normal">
                            Cari lawan tanding atau teman main bareng badminton dengan mudah. Pilih jadwal, daftar, dan mulai bertanding bersama komunitas badminton Bengkulu!
                        </p>

                        <div className="mt-7 sm:mt-8">
                            <Link
                                href={targetUrl}
                                className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold transition-all shadow-xl shadow-sky-500/10 active:scale-95"
                            >
                                <span className="text-xs sm:text-sm font-bold tracking-wide">
                                    {buttonText}
                                </span>
                                <span className="size-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                                    <ArrowUpRight className="size-4" />
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Sisi Kanan: Arena Orbit Konsentris Animasi Berputar */}
                    <div className="lg:col-span-5 flex items-center justify-center relative w-full aspect-square max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto select-none orbit-arena">
                        
                        {/* Lingkaran Orbit 1 (Dalam, Diameter ~140px) */}
                        <div className="orbit-ring-1 absolute top-1/2 left-1/2 size-[130px] sm:size-[144px] rounded-full border border-dashed border-sky-400/40">
                            <OrbitAvatar
                                member={ring1Member}
                                counterClass="orbit-counter-1"
                            />
                        </div>

                        {/* Lingkaran Orbit 2 (Tengah, Diameter ~230px) */}
                        <div className="orbit-ring-2 absolute top-1/2 left-1/2 size-[220px] sm:size-[244px] rounded-full border border-dashed border-sky-400/25">
                            {ring2Members.map((member) => (
                                <OrbitAvatar
                                    key={member.name}
                                    member={member}
                                    counterClass="orbit-counter-2"
                                />
                            ))}
                        </div>

                        {/* Lingkaran Orbit 3 (Luar, Diameter ~330px) */}
                        <div className="orbit-ring-3 absolute top-1/2 left-1/2 size-[310px] sm:size-[344px] rounded-full border border-dashed border-indigo-400/20">
                            {ring3Members.map((member) => (
                                <OrbitAvatar
                                    key={member.name}
                                    member={member}
                                    counterClass="orbit-counter-3"
                                />
                            ))}
                        </div>

                        {/* Pusat Orbit: Center Glow + Icon Box */}
                        <div className="relative z-20 flex items-center justify-center pointer-events-none">
                            {/* Pulse Glow Lingkaran Pusat */}
                            <div
                                className="orbit-center-glow absolute size-28 rounded-full bg-sky-400/30 blur-2xl pointer-events-none"
                                aria-hidden="true"
                            />

                            {/* Kotak Ikon Pusat (Logo Bigi Badminton) */}
                            <div className="relative size-12 sm:size-14 rounded-2xl bg-white border border-sky-300 shadow-xl flex items-center justify-center p-2 overflow-hidden">
                                <img
                                    src="/images/logo-sm.png"
                                    alt="Logo Bigi Badminton"
                                    className="size-full object-contain"
                                />
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
