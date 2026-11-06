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
import { APP_CONTENT, buildWaLink } from "@/lib/content";

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
        wa_admin_number_secondary?: string;
        maps_url?: string;
        maps_embed_url?: string;
        instagram?: string;
        instagram_url?: string;
        alamat?: string;
    };
    [key: string]: any;
}

export function SiteFooter() {
    const { auth, config } = usePage<SharedProps>().props;
    const user = auth?.user;

    const waPrimary = config?.wa_admin_number || "6285664943141";
    const waSecondary = config?.wa_admin_number_secondary || "6282374236585";
    const mapsUrl = config?.maps_url || APP_CONTENT.maps_url;
    const mapsEmbedUrl = config?.maps_embed_url || APP_CONTENT.maps_embed_url;
    const instagramUsername = config?.instagram || APP_CONTENT.instagram;
    const instagramUrl = config?.instagram_url || APP_CONTENT.instagram_url;

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
    };

    return (
        <footer className="relative z-10 w-full border-t border-slate-200 bg-white text-slate-600 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-8">
                
                {/* 5 Kolom Grid:
                    - Mobile: 1 kolom (Brand -> Navigasi -> Open Mabar -> Kontak -> Peta)
                    - Tablet: Brand full-width (col-span-12), Navigasi (6) & Open Mabar (6), Kontak (6) & Peta (6)
                    - Desktop: Brand (3) | Navigasi (2) | Open Mabar (2) | Kontak (2) | Peta (3)
                */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 lg:gap-8 pb-12 border-b border-slate-200">
                    
                    {/* Kolom 1: Brand & Tagline (Desktop 3, Tablet 12, Mobile 1) */}
                    <div className="sm:col-span-12 lg:col-span-3 flex flex-col items-start text-left">
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

                        <p className="mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                            Pusat reservasi lapangan badminton modern dan wadah mabar komunitas di Kota Bengkulu. Booking mudah, main makin seru!
                        </p>
                    </div>

                    {/* Kolom 2: Navigasi (Desktop 2, Tablet 6, Mobile 1) */}
                    <div className="sm:col-span-6 lg:col-span-2 flex flex-col items-start text-left">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase">
                            Navigasi
                        </h3>
                        <ul className="mt-3.5 space-y-2 text-xs sm:text-sm">
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

                    {/* Kolom 3: Open Mabar (Desktop 2, Tablet 6, Mobile 1) */}
                    <div className="sm:col-span-6 lg:col-span-2 flex flex-col items-start text-left">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase">
                            Open Mabar
                        </h3>
                        <ul className="mt-3.5 space-y-2 text-xs sm:text-sm">
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

                    {/* Kolom 4: Kontak (Desktop 2, Tablet 6, Mobile 1 - digeser ke kiri persis di samping Open Mabar) */}
                    <div className="sm:col-span-6 lg:col-span-2 flex flex-col items-start text-left">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase">
                            Kontak
                        </h3>
                        <ul className="mt-3.5 space-y-2.5 text-xs sm:text-sm">
                            {/* WA 1 */}
                            <li>
                                <a
                                    href={buildWaLink(waPrimary)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                    title="Hubungi Admin Reservasi 1 via WhatsApp"
                                >
                                    <MessageCircle className="size-3.5 sm:size-4 shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    <span>WA 1: 085664943141</span>
                                    <ArrowUpRight className="size-3 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </li>

                            {/* WA 2 */}
                            <li>
                                <a
                                    href={buildWaLink(waSecondary)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                    title="Hubungi Admin Reservasi 2 via WhatsApp"
                                >
                                    <MessageCircle className="size-3.5 sm:size-4 shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    <span>WA 2: 082374236585</span>
                                    <ArrowUpRight className="size-3 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </li>

                            {/* Instagram */}
                            <li>
                                <a
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                    title="Kunjungi Instagram Resmi Bigi Badminton"
                                >
                                    <svg
                                        className="size-3.5 sm:size-4 shrink-0 text-pink-500 group-hover:scale-110 transition-transform"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                    </svg>
                                    <span>{instagramUsername}</span>
                                    <ArrowUpRight className="size-3 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </li>

                            {/* Alamat menaut ke peta */}
                            <li>
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2 py-0.5 group"
                                    title="Lihat lokasi GOR Bigi Badminton di Google Maps"
                                >
                                    <MapPin className="size-3.5 sm:size-4 shrink-0 text-rose-500 group-hover:scale-110 transition-transform" />
                                    <span className="underline underline-offset-2">Lihat lokasi di peta</span>
                                    <ArrowUpRight className="size-3 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </li>

                            {/* Jam Buka */}
                            <li className="text-slate-500 py-0.5 inline-flex items-center gap-2">
                                <Clock className="size-3.5 sm:size-4 shrink-0 text-slate-400" />
                                <span>Buka: {APP_CONTENT.jam_operasional}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 5: Peta Google Maps Embed (Desktop 3, Tablet 6, Mobile 1 - paling kanan) */}
                    <div className="sm:col-span-6 lg:col-span-3 flex flex-col items-start text-left w-full">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase">
                            Lokasi GOR
                        </h3>
                        <div className="mt-3.5 w-full flex flex-col gap-2">
                            <div className="w-full h-36 sm:h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs relative">
                                <iframe
                                    src={mapsEmbedUrl}
                                    title="Peta Lokasi Bigi Badminton"
                                    className="w-full h-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 group self-start"
                            >
                                <span>Buka di Google Maps</span>
                                <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </a>
                        </div>
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
