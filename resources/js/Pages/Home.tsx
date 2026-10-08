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
            <section className="relative isolate overflow-hidden pt-32 pb-36 sm:pt-36 sm:pb-44 lg:pt-44 lg:pb-56 px-4 sm:px-6">
                {/* Dynamic Ambient Background Animation */}
                <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 [background-image:radial-gradient(rgba(100,116,139,0.18)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_70%_at_40%_40%,#000_60%,transparent_100%)] opacity-75" />

                    <motion.div
                        animate={
                            prefersReducedMotion
                                ? {}
                                : {
                                      x: [-20, 20, -20],
                                      y: [-15, 15, -15],
                                      scale: [1, 1.06, 1],
                                  }
                        }
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-24 left-1/4 w-[540px] h-[340px] bg-[var(--brand)]/12 rounded-full blur-3xl"
                    />

                    <motion.div
                        animate={
                            prefersReducedMotion
                                ? {}
                                : {
                                      x: [20, -20, 20],
                                      y: [15, -15, 15],
                                      scale: [1.05, 0.95, 1.05],
                                  }
                        }
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-36 right-1/4 w-[440px] h-[280px] bg-emerald-500/10 rounded-full blur-3xl"
                    />
                </div>

                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-14 text-left">
                    {/* Left Column: Headline, Tagline, & CTAs (Left-aligned & Neat) */}
                    <div className="flex-1 max-w-2xl text-left">
                        {/* Main Headline (Left-aligned) */}
                        <motion.h1
                            {...(prefersReducedMotion
                                ? {}
                                : {
                                      initial: { opacity: 0, y: 16 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: { duration: 0.5, delay: 0.1 },
                                  })}
                            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]"
                        >
                            Main Badminton Lebih Seru di{" "}
                            <span className="text-[var(--brand)] inline-block">
                                Bigi Badminton
                            </span>
                        </motion.h1>

                        {/* Tagline (Left-aligned) */}
                        <motion.p
                            {...(prefersReducedMotion
                                ? {}
                                : {
                                      initial: { opacity: 0, y: 14 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: { duration: 0.5, delay: 0.2 },
                                  })}
                            className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed"
                        >
                            {APP_CONTENT.tagline}
                        </motion.p>

                        {/* CTA Buttons (Left-aligned) */}
                        <motion.div
                            {...(prefersReducedMotion
                                ? {}
                                : {
                                      initial: { opacity: 0, y: 14 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: { duration: 0.5, delay: 0.3 },
                                  })}
                            className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3.5 w-full sm:w-auto"
                        >
                            <motion.div
                                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                            >
                                <a
                                    href={waReservationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto block"
                                >
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto h-11 px-6 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all gap-2 shadow-xs hover:shadow-md"
                                    >
                                        <Phone className="size-4" />
                                        <span>Reservasi via WA</span>
                                        <ExternalLink className="size-3.5 opacity-80" />
                                    </Button>
                                </a>
                            </motion.div>

                            <motion.div
                                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                            >
                                <Link
                                    href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                                    className="w-full sm:w-auto block"
                                >
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full sm:w-auto h-11 px-6 text-sm font-semibold border-border/80 bg-card hover:bg-muted/70 hover:text-foreground text-foreground gap-2 rounded-lg transition-all shadow-xs hover:shadow-md"
                                    >
                                        <Calendar className="size-4 text-[var(--brand)]" />
                                        <span>Lihat Open Mabar</span>
                                    </Button>
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Right Column: Hero Badminton Athlete Image */}
                    <motion.div
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        className="relative flex items-center justify-center lg:justify-end shrink-0 w-full lg:w-80 max-w-md mt-6 lg:mt-0"
                    >
                        <img
                            src="/images/atlet-smash.png"
                            alt="Atlet bulu tangkis melayang melakukan smash di udara"
                            width={887}
                            height={1774}
                            className="h-[340px] sm:h-[390px] lg:h-[430px] w-auto max-w-full object-contain select-none pointer-events-none mx-auto lg:ml-auto"
                            style={{
                                maskImage: "linear-gradient(to bottom, black 82%, transparent 98%)",
                                WebkitMaskImage: "linear-gradient(to bottom, black 82%, transparent 98%)",
                            }}
                            loading="eager"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Facilities Section with Hover Lift Animation */}
            <section id="fasilitas" className="py-20 px-4 sm:px-6 bg-muted/30 border-t border-border/70">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...getAnimProps()} className="text-left max-w-3xl mb-12">
                        <span className="text-xs uppercase tracking-widest text-[var(--brand)] font-semibold">
                            FASILITAS & PROFIL
                        </span>
                        <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                            Kenyamanan Maksimal untuk Setiap Smash
                        </h2>
                        <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {APP_CONTENT.deskripsi}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {APP_CONTENT.fasilitas.map((item, idx) => {
                            const IconComponent = facilityIcons[idx % facilityIcons.length];
                            return (
                                <motion.div
                                    key={idx}
                                    {...getAnimProps(idx * 0.06)}
                                    whileHover={prefersReducedMotion ? {} : { y: -5, transition: { duration: 0.2 } }}
                                    className="p-6 rounded-xl bg-card border border-border/80 hover:border-[var(--brand)]/40 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs text-left"
                                >
                                    <div>
                                        <div className="size-10 rounded-lg bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand)] mb-5 group-hover:scale-110 transition-transform">
                                            <IconComponent className="size-5" />
                                        </div>
                                        <h3 className="text-base font-bold text-foreground transition-colors">
                                            {item.judul}
                                        </h3>
                                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            {item.deskripsi}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Community CTA Section */}
            <section className="py-20 px-4 sm:px-6 border-t border-border/70">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        {...getAnimProps()}
                        className="rounded-2xl p-8 sm:p-12 border border-border/80 bg-gradient-to-br from-card via-card to-[var(--brand)]/5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 text-left"
                    >
                        <div className="max-w-2xl text-left">
                            <div className="size-12 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand)] mb-5">
                                <Users className="size-6" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                                Gabung Komunitas Open Mabar Bigi
                            </h2>

                            <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                                Cari lawan tanding atau teman main bareng badminton dengan mudah. Pilih jadwal, daftar, dan mulai bertanding bersama komunitas badminton Bengkulu!
                            </p>
                        </div>

                        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            {user ? (
                                <Link href="/open-mabar" className="w-full sm:w-auto">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto h-11 px-7 text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-lg transition-all shadow-xs hover:shadow-md"
                                    >
                                        <span>Buka Open Mabar</span>
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/login?redirect=/open-mabar" className="w-full sm:w-auto">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto h-11 px-7 text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-lg transition-all shadow-xs hover:shadow-md"
                                    >
                                        <span>Masuk untuk melihat jadwal</span>
                                        <ArrowRight className="size-4" />
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
