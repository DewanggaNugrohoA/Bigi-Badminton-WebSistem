import { useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { CommunityCtaCard } from "@/components/community-cta-card";
import { APP_CONTENT, buildWaLink } from "@/lib/content";
import { motion, useReducedMotion } from "framer-motion";
import {
    Phone,
    Users,
    Trophy,
    Sparkles,
    Coffee,
    ShieldCheck,
    Wifi,
    ArrowUpRight,
} from "lucide-react";

interface SharedProps {
    auth?: {
        user?: {
            id_user: number;
            nama: string;
            email: string;
            role: string;
        } | null;
    };
    config?: {
        wa_admin_number?: string;
    };
    [key: string]: any;
}

const facilityIcons = [
    Trophy,
    Sparkles,
    Coffee,
    ShieldCheck,
    Users,
    Wifi,
];

interface BigiMember {
    id_user: number;
    nama: string;
    foto?: string | null;
}

interface HomeProps {
    communityMembers?: Array<{
        id_user: number;
        name: string;
        role: string;
        img: string;
    }>;
    bigiMembers?: BigiMember[];
    totalMemberCount?: number;
}

const getInitials = (name?: string) => {
    if (!name) return "M";
    return name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

export default function Home({ communityMembers, bigiMembers = [], totalMemberCount = 50 }: HomeProps) {
    const { auth, config } = usePage<SharedProps>().props;
    const user = auth?.user;
    const waReservationLink = buildWaLink(config?.wa_admin_number);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const scrollToTarget = () => {
            if (typeof window !== "undefined") {
                const hash = window.location.hash;
                if (hash) {
                    const el = document.querySelector(hash);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                    }
                }
            }
        };

        const timer = setTimeout(scrollToTarget, 150);
        window.addEventListener("hashchange", scrollToTarget);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("hashchange", scrollToTarget);
        };
    }, []);

    const getAnimProps = (delay = 0) =>
        prefersReducedMotion
            ? {}
            : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: "-40px" },
                  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
              };

    return (
        <PublicLayout title="Beranda">
            {/* =========================================================================
                HERO SECTION — Mengadaptasi UI Victory Badminton Court (Sesuai Referensi)
                ========================================================================= */}
            <section className="relative min-h-[100dvh] h-auto lg:h-screen lg:min-h-[640px] lg:max-h-[960px] w-full flex flex-col justify-end overflow-hidden bg-slate-950 px-5 sm:px-8 lg:px-14 pt-20 sm:pt-28 pb-20 min-[390px]:pb-24 sm:pb-12 lg:pb-10">
                {/* Background Image: Lapangan Biru Terang & Cerah dengan Animasi Slow Ambient Ken Burns */}
                <div className="absolute inset-0 size-full overflow-hidden select-none pointer-events-none z-0">
                    <motion.div
                        className="size-full"
                        animate={
                            prefersReducedMotion
                                ? {}
                                : {
                                      scale: [1.04, 1.09, 1.05, 1.08, 1.04],
                                      x: [0, -10, 6, -5, 0],
                                      y: [0, -6, -2, -8, 0],
                                  }
                        }
                        transition={{
                            duration: 24,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                        }}
                    >
                        <img
                            src="/images/hero-bright-court.jpg"
                            alt="Bigi Badminton Arena - Lapangan Karpet Standar BWF"
                            className="size-full object-cover object-[center_25%] sm:object-center transform-gpu brightness-105"
                            loading="eager"
                        />
                    </motion.div>

                    {/* Subtle warm spotlight glow pada area raket & shuttlecock */}
                    <motion.div
                        className="absolute top-1/4 right-1/4 size-[480px] rounded-full bg-amber-400/[0.12] blur-3xl pointer-events-none"
                        animate={
                            prefersReducedMotion
                                ? {}
                                : {
                                      opacity: [0.2, 0.45, 0.2],
                                      scale: [0.95, 1.15, 0.95],
                                  }
                        }
                        transition={{
                            duration: 9,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Cool daylight sky blue ambient glow */}
                    <motion.div
                        className="absolute -top-10 -left-10 size-[540px] rounded-full bg-sky-500/[0.16] blur-3xl pointer-events-none"
                        animate={
                            prefersReducedMotion
                                ? {}
                                : {
                                      opacity: [0.25, 0.5, 0.25],
                                      scale: [1, 1.2, 1],
                                  }
                        }
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Gradien lembut terarah: Menjaga warna biru lapangan tetap cerah dan hidup */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/25 to-transparent pointer-events-none" />
                </div>

                {/* Konten Hero (Bottom-aligned proporsional di mobile & desktop) */}
                <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 lg:gap-8">
                    
                    {/* Kolom Kiri: Headline, Deskripsi, & Tombol CTA */}
                    <div className="max-w-2xl space-y-3.5 sm:space-y-4 text-left">
                        {/* Judul Utama Hero */}
                        <motion.h1
                            {...getAnimProps(0.05)}
                            className="font-heading font-extrabold text-[26px] min-[390px]:text-[30px] sm:text-4xl md:text-[44px] lg:text-[48px] xl:text-[54px] text-white tracking-tight leading-[1.18] drop-shadow-md"
                        >
                            Maksimalkan Potensimu di{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">
                                Lapangan Eksklusif
                            </span>
                        </motion.h1>

                        {/* Deskripsi Singkat */}
                        <motion.p
                            {...getAnimProps(0.1)}
                            className="text-xs sm:text-sm text-white/85 max-w-lg font-normal leading-relaxed drop-shadow-sm"
                        >
                            Main seru bareng komunitas, booking slot mudah, karpet vinyl standar internasional BWF, dan pencahayaan terang bebas silau di Kota Bengkulu.
                        </motion.p>

                        {/* Tombol Aksi CTA (Gabung Mabar + Reservasi WhatsApp) */}
                        <motion.div {...getAnimProps(0.18)} className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                            {/* Tombol Utama: Gabung Mabar Sekarang */}
                            <Link
                                href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                                className="group inline-flex items-center justify-between sm:justify-start gap-3 pl-5 pr-2 py-2 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all"
                            >
                                <span className="tracking-wide">
                                    Gabung Mabar Sekarang
                                </span>
                                <span className="size-7 sm:size-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform shrink-0">
                                    <ArrowUpRight className="size-3.5 sm:size-4" />
                                </span>
                            </Link>

                            {/* Tombol Sekunder: Reservasi WhatsApp */}
                            <a
                                href={waReservationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/25 transition-all text-xs sm:text-sm font-semibold shadow-md active:scale-95"
                            >
                                <Phone className="size-3.5 text-emerald-400 shrink-0" />
                                <span>Reservasi Lapangan</span>
                            </a>
                        </motion.div>
                    </div>

                    {/* Kolom Kanan: Floating Frosted Card (Hanya Tampil di Layar Desktop lg:) */}
                    <motion.div
                        {...getAnimProps(0.25)}
                        className="hidden lg:block w-auto max-w-[310px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-xl text-left shrink-0"
                    >
                        {/* Stacked Circular Avatars Member */}
                        <div className="flex -space-x-2 items-center mb-3 pt-1 pl-1 overflow-visible">
                            {bigiMembers.slice(0, 3).map((member, idx) => (
                                <div
                                    key={member.id_user || idx}
                                    title={member.nama}
                                    className="relative size-8 sm:size-9 rounded-full border-2 border-amber-400 shadow-sm shrink-0 overflow-hidden bg-slate-800"
                                >
                                    {member.foto ? (
                                        <img
                                            src={member.foto}
                                            alt={member.nama}
                                            className="size-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <div className="size-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700 text-white text-[11px] font-bold rounded-full">
                                            {getInitials(member.nama)}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="inline-flex size-8 sm:size-9 items-center justify-center rounded-full bg-slate-900/90 border-2 border-white/60 text-[11px] font-bold text-white shadow-sm shrink-0">
                                +{totalMemberCount}
                            </div>
                        </div>

                        {/* Tulisan Teks Menarik untuk Member Bigi */}
                        <p className="text-[11px] sm:text-xs text-white/90 leading-snug font-medium">
                            Telah bergabung bersama puluhan member aktif Bigi Badminton. Nikmati prioritas booking dan jadwal mabar eksklusif setiap minggu.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 2: FASILITAS & PROFIL GOR BIGI BADMINTON (UI Bersih, Cerah & Terang)
                ========================================================================= */}
            <section id="fasilitas" className="pt-20 sm:pt-24 lg:pt-28 pb-20 sm:pb-28 px-4 sm:px-6 bg-slate-50 border-t border-slate-200/80 scroll-mt-20 relative overflow-hidden">
                {/* Subtle soft ambient light decorations */}
                <div
                    className="absolute top-0 right-1/4 size-[600px] bg-sky-100/60 rounded-full blur-3xl pointer-events-none -z-10"
                    aria-hidden="true"
                />
                <div
                    className="absolute bottom-0 left-1/4 size-[600px] bg-amber-50/80 rounded-full blur-3xl pointer-events-none -z-10"
                    aria-hidden="true"
                />

                <div id="tentang" className="max-w-6xl mx-auto scroll-mt-20">
                    <motion.div
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                        whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.25 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="text-left max-w-3xl mb-12 sm:mb-16"
                    >
                        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Kenyamanan Maksimal untuk{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600">
                                Setiap Smash
                            </span>
                        </h2>
                        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                            {APP_CONTENT.deskripsi}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                        {APP_CONTENT.fasilitas.map((item, idx) => {
                            const IconComponent = facilityIcons[idx % facilityIcons.length];
                            return (
                                <motion.div
                                    key={idx}
                                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 45, scale: 0.95 }}
                                    whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: false, amount: 0.2 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: prefersReducedMotion ? 0 : (idx % 3) * 0.1,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.015, transition: { duration: 0.25, ease: "easeOut" } }}
                                    whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                                    className="p-7 sm:p-8 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between group shadow-sm text-left cursor-default"
                                >
                                    <div>
                                        <div className="mb-4 text-slate-700 group-hover:text-blue-600 transition-colors">
                                            <IconComponent className="size-6 stroke-[1.75]" />
                                        </div>
                                        <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                                            {item.judul}
                                        </h3>
                                        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                            {item.deskripsi}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 3: CTA KOMUNITAS OPEN MABAR
                ========================================================================= */}
            <section className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-100/70 border-t border-slate-200 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 50, scale: 0.96 }}
                        whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: false, amount: 0.15 }}
                        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <CommunityCtaCard communityMembers={communityMembers} />
                    </motion.div>
                </div>
            </section>
        </PublicLayout>
    );
}
