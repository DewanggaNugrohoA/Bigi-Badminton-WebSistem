import { Link, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { APP_CONTENT, buildWaLink } from "@/lib/content";
import { motion, useReducedMotion } from "framer-motion";
import {
    Phone,
    ExternalLink,
    Calendar,
    Users,
    Trophy,
    Sparkles,
    Coffee,
    ShieldCheck,
    Wifi,
    ArrowRight,
    Clock,
    MapPin,
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

export default function Home() {
    const { auth, config } = usePage<SharedProps>().props;
    const user = auth?.user;
    const waReservationLink = buildWaLink(config?.wa_admin_number);
    const prefersReducedMotion = useReducedMotion();

    const getAnimProps = (delay = 0) =>
        prefersReducedMotion
            ? {}
            : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: "-50px" },
                  transition: { duration: 0.5, delay, ease: "easeOut" as const },
              };

    return (
        <PublicLayout title="Beranda">
            {/* 1. Hero Section */}
            <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-36 px-4 sm:px-6">
                {/* Background Pattern dari referensi tailwind-css-background-snippet */}
                <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,var(--brand)_100%)] opacity-85 pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
                    <motion.div
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, scale: 0.95 },
                                  animate: { opacity: 1, scale: 1 },
                                  transition: { duration: 0.5 },
                              })}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs sm:text-sm font-medium mb-6"
                    >
                        <Trophy className="size-4 text-[var(--brand)]" />
                        <span>2 Lapangan Karpet Vinyl Standar Turnamen</span>
                    </motion.div>

                    <motion.h1
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, y: 16 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { duration: 0.6, delay: 0.1 },
                              })}
                        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight"
                    >
                        Main Badminton Lebih Seru di{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[var(--brand)]">
                            Bigi Badminton
                        </span>
                    </motion.h1>

                    <motion.p
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, y: 16 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { duration: 0.6, delay: 0.2 },
                              })}
                        className="mt-6 text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl leading-relaxed"
                    >
                        {APP_CONTENT.tagline}
                    </motion.p>

                    <motion.div
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, y: 16 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { duration: 0.6, delay: 0.3 },
                              })}
                        className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
                    >
                        <a
                            href={waReservationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                        >
                            <Button
                                size="lg"
                                className="w-full sm:w-auto h-12 px-7 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 gap-2 rounded-xl transition-all"
                            >
                                <Phone className="size-5" />
                                <span>Reservasi via WA</span>
                                <ExternalLink className="size-4 opacity-75" />
                            </Button>
                        </a>

                        <Link
                            href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                            className="w-full sm:w-auto"
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto h-12 px-7 text-base font-semibold border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100 gap-2 rounded-xl transition-all"
                            >
                                <Calendar className="size-5 text-[var(--brand)]" />
                                <span>Lihat Open Mabar</span>
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0 },
                                  animate: { opacity: 1 },
                                  transition: { duration: 0.6, delay: 0.4 },
                              })}
                        className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-zinc-400"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-purple-400" />
                            <span>Buka Setiap Hari: {APP_CONTENT.jam_operasional}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-purple-400" />
                            <span>{APP_CONTENT.alamat}</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. Profil & Fasilitas Section */}
            <section id="fasilitas" className="py-20 px-4 sm:px-6 bg-zinc-950/80 border-t border-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...getAnimProps()} className="text-center max-w-3xl mx-auto mb-14">
                        <span className="text-xs uppercase tracking-widest text-[var(--brand)] font-bold">
                            FASILITAS & PROFIL
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Kenyamanan Maksimal untuk Setiap Smash
                        </h2>
                        <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
                            {APP_CONTENT.deskripsi}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {APP_CONTENT.fasilitas.map((item, idx) => {
                            const IconComponent = facilityIcons[idx % facilityIcons.length];
                            return (
                                <motion.div
                                    key={idx}
                                    {...getAnimProps(idx * 0.08)}
                                    className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="size-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[var(--brand)] mb-5 group-hover:scale-105 transition-transform">
                                            <IconComponent className="size-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                                            {item.judul}
                                        </h3>
                                        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                            {item.deskripsi}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. Open Mabar Banner Section */}
            <section className="py-20 px-4 sm:px-6 bg-zinc-950/80 border-t border-zinc-900 relative isolate overflow-hidden">
                <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 border border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/30 shadow-2xl relative">
                    <motion.div {...getAnimProps()} className="text-center flex flex-col items-center">
                        <div className="size-14 rounded-2xl bg-[var(--brand)]/20 border border-[var(--brand)]/30 flex items-center justify-center text-[var(--brand)] mb-6 shadow-inner">
                            <Users className="size-7" />
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Gabung Komunitas Open Mabar Bigi
                        </h2>

                        <p className="mt-4 text-zinc-300 text-sm sm:text-base max-w-xl leading-relaxed">
                            Cari lawan tanding atau teman main bareng badminton dengan mudah. Pilih jadwal, daftar, dan mulai bertanding bersama komunitas badminton Bengkulu!
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                            {user ? (
                                <Link href="/open-mabar">
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 text-base font-semibold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-xl shadow-lg shadow-purple-950/50"
                                    >
                                        <span>Buka Open Mabar</span>
                                        <ArrowRight className="size-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/login?redirect=/open-mabar">
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 text-base font-semibold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-xl shadow-lg shadow-purple-950/50"
                                    >
                                        <span>Masuk untuk melihat jadwal</span>
                                        <ArrowRight className="size-5" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </PublicLayout>
    );
}
