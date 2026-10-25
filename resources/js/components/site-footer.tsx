import { Link, usePage } from "@inertiajs/react";
import {
    ArrowUp,
    ArrowUpRight,
    Home,
    Sparkles,
    Users,
    User as UserIcon,
    LogIn,
    Calendar,
    CalendarCheck,
    MessageCircle,
    MapPin,
    Clock,
} from "lucide-react";
import { APP_CONTENT, buildWaLink, cleanWaNumber } from "@/lib/content";

interface SharedProps {
    auth?: {
        user?: {
            id_user: number;
            nama: string;
            role: string;
        } | null;
    };
    config?: {
        wa_admin_number?: string;
    };
    [key: string]: any;
}

export function SiteFooter() {
    const { auth, config } = usePage<SharedProps>().props;
    const user = auth?.user;

    const waNumber = config?.wa_admin_number ? cleanWaNumber(config.wa_admin_number) : "";
    const waReservationLink = buildWaLink(config?.wa_admin_number);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
    };

    return (
        <footer className="relative z-10 w-full border-t border-slate-200 bg-white text-slate-600 shadow-xs">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-8">
                
                {/* 4 Kolom Navigasi Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 pb-12 sm:pb-14 border-b border-slate-200">
                    
                    {/* Kolom 1: Brand & Tagline */}
                    <div className="sm:col-span-2 lg:col-span-4 flex flex-col items-start text-left">
                        <Link href="/" className="inline-flex items-center gap-2.5 group">
                            <img
                                src="/images/logo-sm.png"
                                alt="Logo Bigi Badminton"
                                className="size-8 sm:size-9 object-contain rounded-full shrink-0 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                                {APP_CONTENT.nama}
                            </span>
                        </Link>

                        <p className="mt-3.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                            Pusat reservasi lapangan badminton modern dan wadah mabar komunitas di Kota Bengkulu. Booking mudah, main makin seru!
                        </p>
                    </div>

                    {/* Kolom 2: Navigasi */}
                    <div className="lg:col-span-2 flex flex-col items-start text-left">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase">
                            Navigasi
                        </h3>
                        <ul className="mt-4 space-y-2.5 text-xs sm:text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                >
                                    <Home className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <span>Beranda</span>
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="/#fasilitas"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                >
                                    <Sparkles className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <span>Fasilitas</span>
                                </a>
                            </li>
                            <li>
                                <Link
                                    href="/open-mabar"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                >
                                    <Users className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <span>Open Mabar</span>
                                </Link>
                            </li>
                            <li>
                                {user ? (
                                    <Link
                                        href="/pengaturan/akun"
                                        className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                    >
                                        <UserIcon className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                        <span>Akun Saya</span>
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                    >
                                        <LogIn className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                        <span>Masuk</span>
                                    </Link>
                                )}
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 3: Open Mabar */}
                    <div className="lg:col-span-3 flex flex-col items-start text-left">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase">
                            Open Mabar
                        </h3>
                        <ul className="mt-4 space-y-2.5 text-xs sm:text-sm">
                            <li>
                                <Link
                                    href="/open-mabar"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                >
                                    <Calendar className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <span>Lihat Jadwal</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/open-mabar/mabar-bareng"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                >
                                    <Users className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <span>Mabar Bareng</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={user ? "/open-mabar/saya" : "/login?redirect=/open-mabar/saya"}
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                >
                                    <CalendarCheck className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <span>Jadwal Saya</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 4: Kontak */}
                    <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-start text-left">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase">
                            Kontak
                        </h3>
                        <ul className="mt-4 space-y-2.5 text-xs sm:text-sm">
                            <li>
                                <a
                                    href={waReservationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                >
                                    <MessageCircle className="size-3.5 sm:size-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <span>WhatsApp: {waNumber || "081234567890"}</span>
                                    <ArrowUpRight className="size-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </li>
                            <li className="text-slate-500 leading-relaxed py-0.5 inline-flex items-start gap-2">
                                <MapPin className="size-3.5 sm:size-4 shrink-0 mt-0.5 text-slate-400" />
                                <span>{APP_CONTENT.alamat}</span>
                            </li>
                            <li className="text-slate-500 py-0.5 inline-flex items-center gap-2">
                                <Clock className="size-3.5 sm:size-4 shrink-0 text-slate-400" />
                                <span>Buka: {APP_CONTENT.jam_operasional}</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar: Copyright & Kembali ke atas */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p className="order-2 sm:order-1">
                        © {new Date().getFullYear()} {APP_CONTENT.nama}.
                    </p>

                    <button
                        type="button"
                        onClick={scrollToTop}
                        className="order-1 sm:order-2 inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-full hover:bg-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <span>Kembali ke atas</span>
                        <ArrowUp className="size-3.5" />
                    </button>
                </div>

            </div>
        </footer>
    );
}
