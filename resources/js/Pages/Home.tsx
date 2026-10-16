import { useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { APP_CONTENT, buildWaLink } from "@/lib/content";
import { motion, useReducedMotion } from "framer-motion";
import {
    Phone,
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

    useEffect(() => {
        const scrollToTarget = () => {
            if (typeof window !== "undefined" && window.location.hash === "#fasilitas") {
                const el = document.getElementById("fasilitas");
                if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
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
                  viewport: { once: false, margin: "-50px" },
                  transition: { duration: 0.5, delay, ease: "easeOut" as const },
              };

    return (
        <PublicLayout title="Beranda">
            <section className="relative pt-28 pb-8 min-[340px]:pt-30 min-[340px]:pb-10 sm:pt-36 sm:pb-12 lg:pt-40 lg:pb-16 px-4 sm:px-6">

                <div className="max-w-6xl mx-auto grid grid-cols-1 min-[340px]:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_auto] items-center gap-x-4 sm:gap-x-8 lg:gap-x-12 gap-y-4 sm:gap-y-5 lg:gap-y-0 text-left">
                    
                    <div className="col-start-1 row-start-1 text-left min-w-0 self-end lg:self-end">
                        
                        <motion.h1
                            {...(prefersReducedMotion
                                ? {}
                                : {
                                      initial: { opacity: 0, y: 16 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: { duration: 0.5, delay: 0.1 },
                                  })}
                            className="font-unbounded text-xl min-[360px]:text-[22px] min-[390px]:text-2xl sm:text-3xl md:text-[38px] lg:text-[44px] xl:text-[48px] font-extrabold tracking-[-0.01em] text-foreground leading-[1.3] sm:leading-[1.35] lg:leading-[1.38]"
                        >
                            Main Badminton Lebih Seru di{" "}
                            <span className="text-[var(--brand)] inline-block">
                                Bigi Badminton
                            </span>
                        </motion.h1>

                        
                        <motion.p
                            {...(prefersReducedMotion
                                ? {}
                                : {
                                      initial: { opacity: 0, y: 14 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: { duration: 0.5, delay: 0.2 },
                                  })}
                            className="font-sans font-normal mt-3.5 sm:mt-5 lg:mt-6 text-sm sm:text-base lg:text-[17px] text-muted-foreground/90 leading-relaxed sm:leading-loose max-w-xl"
                        >
                            {APP_CONTENT.tagline}
                        </motion.p>
                    </div>

                    
                    <motion.div
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        className="col-start-1 min-[340px]:col-start-2 row-start-2 min-[340px]:row-start-1 lg:row-span-2 flex items-end justify-center min-[340px]:justify-end shrink-0 w-full self-center relative"
                    >
                        
                        <div
                            className="absolute -inset-10 sm:-inset-16 pointer-events-none -z-10 flex items-center justify-center overflow-visible select-none"
                            aria-hidden="true"
                        >
                            <svg
                                viewBox="0 0 600 600"
                                className="w-full h-full max-w-[560px] lg:max-w-[620px] select-none"
                            >
                                <defs>
                                    
                                    <linearGradient id="bigiTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.30" />
                                        <stop offset="35%" stopColor="#8A8E95" stopOpacity="0.35" />
                                        <stop offset="70%" stopColor="#25406A" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#001D50" stopOpacity="0.08" />
                                    </linearGradient>

                                    
                                    <linearGradient id="bigiStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                                        <stop offset="45%" stopColor="#8A8E95" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.20" />
                                    </linearGradient>

                                    
                                    <linearGradient id="diagShapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8A8E95" stopOpacity="0.25" />
                                        <stop offset="50%" stopColor="#344C70" stopOpacity="0.20" />
                                        <stop offset="100%" stopColor="#001D50" stopOpacity="0.08" />
                                    </linearGradient>

                                    
                                    <linearGradient id="motionArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#173465" stopOpacity="0.20" />
                                        <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.80" />
                                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                    </linearGradient>

                                    
                                    <radialGradient id="auraGrad" cx="52%" cy="46%" r="50%">
                                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                                        <stop offset="50%" stopColor="#173465" stopOpacity="0.12" />
                                        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                                    </radialGradient>
                                </defs>

                                
                                <circle cx="330" cy="280" r="230" fill="url(#auraGrad)" />

                                
                                <polygon
                                    points="180,20 530,20 380,580 30,580"
                                    fill="url(#diagShapeGrad)"
                                />

                                
                                <line
                                    x1="210"
                                    y1="20"
                                    x2="60"
                                    y2="580"
                                    stroke="#8A8E95"
                                    strokeWidth="1.2"
                                    strokeOpacity="0.35"
                                    strokeDasharray="6 8"
                                />

                                
                                <text
                                    x="300"
                                    y="360"
                                    textAnchor="middle"
                                    className="font-unbounded font-black select-none pointer-events-none"
                                    fontSize="180"
                                    fontWeight="900"
                                    letterSpacing="-0.04em"
                                    fill="url(#bigiTextGrad)"
                                    stroke="url(#bigiStrokeGrad)"
                                    strokeWidth="1.5"
                                >
                                    BIGI
                                </text>

                                
                                <path
                                    d="M 60,470 C 220,480 390,380 500,120"
                                    fill="none"
                                    stroke="url(#motionArcGrad)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />

                                
                                <path
                                    d="M 120,500 C 260,500 420,410 520,170"
                                    fill="none"
                                    stroke="#60A5FA"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    strokeOpacity="0.4"
                                    strokeDasharray="4 8"
                                />
                            </svg>
                        </div>

                        
                        <img
                            src="/images/atlet-smash.png"
                            alt="Atlet bulu tangkis melayang melakukan smash di udara"
                            width={887}
                            height={1774}
                            className="h-[180px] min-[360px]:h-[210px] min-[390px]:h-[235px] sm:h-[300px] md:h-[360px] lg:h-[430px] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-none -translate-y-4 sm:-translate-y-5 lg:-translate-y-6 -translate-x-4 sm:-translate-x-5 lg:-translate-x-6 relative z-10"
                            style={{
                                maskImage: "linear-gradient(to bottom, black 84%, transparent 98%)",
                                WebkitMaskImage: "linear-gradient(to bottom, black 84%, transparent 98%)",
                            }}
                            loading="eager"
                        />
                    </motion.div>

                    
                    <motion.div
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, y: 14 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { duration: 0.5, delay: 0.3 },
                              })}
                        className="col-start-1 col-span-1 min-[340px]:col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-2 self-start lg:self-start flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 w-full lg:w-auto mt-4 sm:mt-6 lg:mt-7"
                    >
                        <motion.div
                            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                            className="w-full sm:w-auto"
                        >
                            <a
                                href={waReservationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto block"
                            >
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto h-11 min-h-[44px] px-6 font-unbounded text-xs sm:text-sm font-semibold tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all gap-2 shadow-xs hover:shadow-md flex items-center justify-center"
                                >
                                    <Phone className="size-4" />
                                    <span>Reservasi via WA</span>
                                </Button>
                            </a>
                        </motion.div>

                        <motion.div
                            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                            className="w-full sm:w-auto"
                        >
                            <Link
                                href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                                className="w-full sm:w-auto block"
                            >
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto h-11 min-h-[44px] px-6 font-unbounded text-xs sm:text-sm font-semibold tracking-wide border-border/80 bg-card hover:bg-muted/70 hover:text-foreground text-foreground gap-2 rounded-lg transition-all shadow-xs hover:shadow-md flex items-center justify-center"
                                >
                                    <Calendar className="size-4 text-[var(--brand)]" />
                                    <span>Lihat Open Mabar</span>
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            
            <section id="fasilitas" className="pt-8 sm:pt-12 lg:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 bg-muted/30 border-t border-border/70 scroll-mt-20 lg:scroll-mt-24">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...getAnimProps()} className="text-left max-w-3xl mb-10 sm:mb-12">
                        <span className="font-unbounded text-xs uppercase tracking-widest text-[var(--brand)] font-bold">
                            FASILITAS & PROFIL
                        </span>
                        <h2 className="mt-2 font-unbounded text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                            Kenyamanan Maksimal untuk Setiap Smash
                        </h2>
                        <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {APP_CONTENT.deskripsi}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {APP_CONTENT.fasilitas.map((item, idx) => {
                            const IconComponent = facilityIcons[idx % facilityIcons.length];
                            return (
                                <motion.div
                                    key={idx}
                                    {...getAnimProps(idx * 0.06)}
                                    whileHover={prefersReducedMotion ? {} : { y: -5, transition: { duration: 0.2 } }}
                                    className="p-5 sm:p-6 rounded-xl bg-card border border-border/80 hover:border-[var(--brand)]/40 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs text-left"
                                >
                                    <div>
                                        <div className="size-10 rounded-lg bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand)] mb-5 group-hover:scale-110 transition-transform">
                                            <IconComponent className="size-5" />
                                        </div>
                                        <h3 className="font-unbounded text-sm sm:text-base font-bold text-foreground transition-colors tracking-tight">
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

            
            <section className="py-14 sm:py-20 px-4 sm:px-6 border-t border-border/70">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        {...getAnimProps()}
                        className="rounded-2xl p-6 sm:p-10 lg:p-12 border border-border/80 bg-gradient-to-br from-card via-card to-[var(--brand)]/5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8 text-left"
                    >
                        <div className="max-w-2xl text-left">
                            <div className="size-12 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand)] mb-5">
                                <Users className="size-6" />
                            </div>

                            <h2 className="font-unbounded text-xl min-[360px]:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
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
                                        className="w-full sm:w-auto h-11 px-7 font-unbounded text-xs sm:text-sm font-semibold tracking-wide bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-lg transition-all shadow-xs hover:shadow-md"
                                    >
                                        <span>Buka Open Mabar</span>
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/login?redirect=/open-mabar" className="w-full sm:w-auto">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto h-11 px-7 font-unbounded text-xs sm:text-sm font-semibold tracking-wide bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-lg transition-all shadow-xs hover:shadow-md"
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
