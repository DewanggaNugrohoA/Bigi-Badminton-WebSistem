import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, User as UserIcon, Calendar, Users, PlusCircle, List, LogOut, Settings, Phone, Home as HomeIcon, Trophy } from "lucide-react";
import { buildWaLink } from "@/lib/content";
import { cn } from "@/lib/utils";

interface AuthUser {
    id_user: number;
    nama: string;
    email?: string | null;
    no_whatsapp?: string;
    role: "user" | "admin" | "kasir";
    foto?: string | null;
}

interface SharedProps {
    auth?: {
        user?: AuthUser | null;
    };
    [key: string]: any;
}

export function SiteNavbar() {
    const { auth, config } = usePage<SharedProps>().props;
    const { url } = usePage();
    const currentPath = url.split("?")[0] || "/";
    const isHome = currentPath === "/";
    const user = auth?.user;
    const waLink = buildWaLink(config?.wa_admin_number);
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"beranda" | "fasilitas" | "mabar">(() => {
        if (typeof window !== "undefined" && window.location.hash === "#fasilitas") return "fasilitas";
        if (currentPath.startsWith("/open-mabar")) return "mabar";
        return "beranda";
    });

    useEffect(() => {
        let ticking = false;

        const checkHashAndScroll = () => {
            const currentScrollY = window.scrollY;

            // Transisi halus saat scroll melewati batas atas (30px)
            if (currentScrollY > 30) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }

            if (currentPath === "/") {
                const fasilitasEl = document.getElementById("fasilitas");
                const fasilitasTop = fasilitasEl ? fasilitasEl.offsetTop - 220 : 550;

                if (currentScrollY < fasilitasTop) {
                    setActiveTab("beranda");
                    if (currentScrollY < 60 && window.location.hash) {
                        window.history.replaceState(null, "", window.location.pathname);
                    }
                } else {
                    setActiveTab("fasilitas");
                }
            } else if (currentPath.startsWith("/open-mabar")) {
                setActiveTab("mabar");
            }
        };

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    checkHashAndScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        checkHashAndScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("hashchange", checkHashAndScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("hashchange", checkHashAndScroll);
        };
    }, [currentPath]);

    const isFloatingTransparent = isHome && !scrolled;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 py-3.5 sm:py-4">
            {/* Silky smooth GPU-accelerated background layer */}
            <div
                className={cn(
                    "absolute inset-0 -z-10 transition-opacity duration-300 ease-in-out pointer-events-none",
                    isFloatingTransparent
                        ? "opacity-0"
                        : "opacity-100 bg-background/85 backdrop-blur-md border-b border-border shadow-xs"
                )}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                
                {/* Logo & Brand Name */}
                <div className="flex-1 flex items-center justify-start">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                        aria-label="Bigi Badminton - Beranda"
                    >
                        <img
                            src="/images/logo-sm.png"
                            alt="Logo Bigi Badminton"
                            width={120}
                            height={120}
                            className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-full shadow-sm ring-1 ring-white/20 group-hover:scale-105 transition-transform shrink-0"
                        />
                        <span className={cn(
                            "font-unbounded font-extrabold text-lg sm:text-xl tracking-tight transition-colors duration-300",
                            isFloatingTransparent ? "text-white" : "text-foreground group-hover:text-primary"
                        )}>
                            BIGI <span className={cn("transition-colors duration-300", isFloatingTransparent ? "text-sky-300" : "text-[var(--brand)]")}>BADMINTON</span>
                        </span>
                    </Link>
                </div>

                {/* Floating Pill Center Dock Menu — Tetap 100% Fitur Beranda, Fasilitas, Open Mabar */}
                <div className="hidden lg:flex items-center justify-center shrink-0">
                    <NavigationMenu>
                        <NavigationMenuList className={cn(
                            "relative flex items-center rounded-full p-1 transition-all duration-300 ease-in-out shadow-sm",
                            isFloatingTransparent
                                ? "border border-white/20 bg-white/10 backdrop-blur-md"
                                : "border border-border/70 bg-card/85 backdrop-blur-md shadow-xs"
                        )}>
                            {/* Beranda */}
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href="/"
                                        onClick={(e) => {
                                            setActiveTab("beranda");
                                            if (typeof window !== 'undefined' && window.location.pathname === '/' && window.location.hash) {
                                                e.preventDefault();
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                window.history.pushState(null, '', '/');
                                            }
                                        }}
                                        className={cn(
                                            "relative px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold rounded-full select-none transition-colors duration-200",
                                            activeTab === "beranda"
                                                ? (isFloatingTransparent ? "text-white font-bold" : "text-background font-bold")
                                                : (isFloatingTransparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground")
                                        )}
                                    >
                                        <span className="relative z-10">Beranda</span>
                                        {activeTab === "beranda" && (
                                            <motion.span
                                                layoutId="activeNavIndicator"
                                                className={cn(
                                                    "absolute inset-0 rounded-full",
                                                    isFloatingTransparent
                                                        ? "bg-white/20 backdrop-blur-xs ring-1 ring-white/30 shadow-xs"
                                                        : "bg-foreground shadow-xs"
                                                )}
                                                transition={{ type: "spring", stiffness: 420, damping: 35 }}
                                            />
                                        )}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            {/* Fasilitas */}
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <a
                                        href="/#fasilitas"
                                        onClick={(e) => {
                                            setActiveTab("fasilitas");
                                            if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
                                                e.preventDefault();
                                                const el = document.getElementById('fasilitas');
                                                if (el) {
                                                    el.scrollIntoView({ behavior: 'smooth' });
                                                    window.history.pushState(null, '', '#fasilitas');
                                                }
                                            }
                                        }}
                                        className={cn(
                                            "relative px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold rounded-full select-none transition-colors duration-200",
                                            activeTab === "fasilitas"
                                                ? (isFloatingTransparent ? "text-white font-bold" : "text-background font-bold")
                                                : (isFloatingTransparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground")
                                        )}
                                    >
                                        <span className="relative z-10">Fasilitas</span>
                                        {activeTab === "fasilitas" && (
                                            <motion.span
                                                layoutId="activeNavIndicator"
                                                className={cn(
                                                    "absolute inset-0 rounded-full",
                                                    isFloatingTransparent
                                                        ? "bg-white/20 backdrop-blur-xs ring-1 ring-white/30 shadow-xs"
                                                        : "bg-foreground shadow-xs"
                                                )}
                                                transition={{ type: "spring", stiffness: 420, damping: 35 }}
                                            />
                                        )}
                                    </a>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            {/* Open Mabar (Dropdown) */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger
                                    className={cn(
                                        "relative px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold rounded-full select-none transition-colors duration-200",
                                        activeTab === "mabar"
                                            ? (isFloatingTransparent ? "text-white font-bold data-[popup-open]:text-white" : "text-background font-bold data-[popup-open]:text-background")
                                            : (isFloatingTransparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground")
                                    )}
                                >
                                    <span className="relative z-10">Open Mabar</span>
                                    {activeTab === "mabar" && (
                                        <motion.span
                                            layoutId="activeNavIndicator"
                                            className={cn(
                                                "absolute inset-0 rounded-full pointer-events-none",
                                                isFloatingTransparent
                                                    ? "bg-white/20 backdrop-blur-xs ring-1 ring-white/30 shadow-xs"
                                                    : "bg-foreground shadow-xs"
                                            )}
                                            transition={{ type: "spring", stiffness: 420, damping: 35 }}
                                        />
                                    )}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent width="w-72">
                                    <div className="flex flex-col gap-1.5 p-2.5">
                                        <Link
                                            href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors group"
                                        >
                                            <Calendar className="size-5 text-[var(--brand)] shrink-0" />
                                            <div>
                                                <div className="text-[15px] font-semibold text-foreground">Lihat Jadwal</div>
                                                <div className="text-xs text-muted-foreground font-normal">Lihat slot lapangan yang kosong</div>
                                            </div>
                                        </Link>
                                        <Link
                                            href={user ? "/open-mabar/mabar-bareng" : "/login?redirect=/open-mabar/mabar-bareng"}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors group"
                                        >
                                            <Users className="size-5 text-[var(--brand)] shrink-0" />
                                            <div>
                                                <div className="text-[15px] font-semibold text-foreground">Mabar Bareng</div>
                                                <div className="text-xs text-muted-foreground font-normal">Gabung mabar yang sudah tersedia</div>
                                            </div>
                                        </Link>
                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors group"
                                        >
                                            <Phone className="size-5 text-[var(--brand)] shrink-0" />
                                            <div>
                                                <div className="text-[15px] font-semibold text-foreground">Booking Lapangan</div>
                                                <div className="text-xs text-muted-foreground font-normal">Ingin booking lapangan hubungi kami</div>
                                            </div>
                                        </a>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Right Action: Auth / User Profile */}
                <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
                    <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <button
                                            type="button"
                                            title={user.nama}
                                            aria-label={`Menu Akun: ${user.nama}`}
                                            className={cn(
                                                "size-9 sm:size-10 rounded-full border flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out shadow-xs shrink-0 select-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                                                isFloatingTransparent
                                                    ? "bg-white/15 hover:bg-white/25 border-white/30 text-white ring-1 ring-white/20"
                                                    : "bg-card hover:bg-muted border-border text-foreground ring-1 ring-black/5"
                                            )}
                                        >
                                            {user.foto ? (
                                                <img
                                                    src={user.foto}
                                                    alt={user.nama}
                                                    className="size-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <UserIcon className="size-4 sm:size-4.5" />
                                            )}
                                        </button>
                                    }
                                />
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                                    <div className="p-2.5 border-b border-border flex items-center gap-3">
                                        <div className="size-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                            {user.foto ? (
                                                <img
                                                    src={user.foto}
                                                    alt={user.nama}
                                                    className="size-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <UserIcon className="size-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate">{user.nama}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.no_whatsapp || user.email}</p>
                                        </div>
                                    </div>

                                    {user.role === "user" && (
                                        <>
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Link href="/open-mabar/saya" className="w-full flex items-center gap-2">
                                                    <List className="size-4 text-muted-foreground" />
                                                    <span>Jadwal Saya</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Link href="/pengaturan/akun" className="w-full flex items-center gap-2">
                                                    <Settings className="size-4 text-muted-foreground" />
                                                    <span>Pengaturan Akun</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive">
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full flex items-center gap-2 text-destructive text-left"
                                        >
                                            <LogOut className="size-4" />
                                            <span>Keluar</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "h-9 px-4 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 ease-in-out",
                                            isFloatingTransparent
                                                ? "text-white hover:bg-white/15"
                                                : "text-foreground hover:bg-muted"
                                        )}
                                    >
                                        Masuk
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button
                                        className="h-9 px-4 text-xs sm:text-sm font-semibold rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 shadow-sm"
                                    >
                                        Daftar
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Drawer Trigger */}
                    <div className="flex lg:hidden items-center">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "size-10 p-0 flex items-center justify-center rounded-lg transition-colors duration-300 ease-in-out",
                                            isFloatingTransparent ? "text-white hover:bg-white/15" : "text-foreground"
                                        )}
                                        aria-label="Buka navigasi mobile"
                                    >
                                        <Menu className="size-6" />
                                    </Button>
                                }
                            />
                            <SheetContent side="right" className="w-[88vw] max-w-xs p-5 flex flex-col justify-between overflow-y-auto">
                                <div className="flex flex-col gap-4">
                                    <SheetHeader className="text-left pb-3 border-b border-border/70">
                                        <div className="flex items-center justify-between">
                                            <Link
                                                href="/"
                                                onClick={() => setMobileOpen(false)}
                                                className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                                                aria-label="Bigi Badminton - Beranda"
                                            >
                                                <img
                                                    src="/images/logo-sm.png"
                                                    alt="Logo Bigi Badminton"
                                                    width={120}
                                                    height={120}
                                                    className="size-8 object-contain rounded-full shadow-sm ring-1 ring-black/10 shrink-0"
                                                />
                                                <span className="font-unbounded text-base font-extrabold tracking-tight text-foreground">
                                                    BIGI <span className="text-[var(--brand)]">BADMINTON</span>
                                                </span>
                                            </Link>
                                        </div>
                                        <SheetTitle className="sr-only">Navigasi Bigi Badminton</SheetTitle>
                                    </SheetHeader>

                                    {/* User Profile Card (Jika Login) */}
                                    {user && (
                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {user.foto ? (
                                                        <img
                                                            src={user.foto}
                                                            alt={user.nama}
                                                            className="size-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <UserIcon className="size-5 text-slate-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{user.nama}</p>
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">
                                                            {user.role === "admin" ? "Admin" : user.role === "kasir" ? "Kasir" : "Member"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{user.no_whatsapp || user.email}</p>
                                                </div>
                                            </div>

                                            {user.role === "user" && (
                                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70">
                                                    <Link
                                                        href="/open-mabar/saya"
                                                        onClick={() => setMobileOpen(false)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-2xs"
                                                    >
                                                        <List className="size-3.5 text-[var(--brand)]" />
                                                        <span>Jadwal Saya</span>
                                                    </Link>
                                                    <Link
                                                        href="/pengaturan/akun"
                                                        onClick={() => setMobileOpen(false)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-2xs"
                                                    >
                                                        <Settings className="size-3.5 text-slate-500" />
                                                        <span>Pengaturan</span>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Navigasi Menu */}
                                    <nav className="flex flex-col gap-1">
                                        <p className="px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            Menu Utama
                                        </p>

                                        <Link
                                            href="/"
                                            onClick={(e) => {
                                                setMobileOpen(false);
                                                if (typeof window !== 'undefined' && window.location.pathname === '/' && window.location.hash) {
                                                    e.preventDefault();
                                                    setTimeout(() => {
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        window.history.pushState(null, '', '/');
                                                    }, 150);
                                                }
                                            }}
                                            className={cn(
                                                "px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors",
                                                activeTab === "beranda" && !window.location.hash
                                                    ? "bg-slate-100 text-slate-900"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                            )}
                                        >
                                            <HomeIcon className="size-4 text-slate-500 shrink-0" />
                                            <span>Beranda</span>
                                        </Link>

                                        <a
                                            href="/#fasilitas"
                                            onClick={(e) => {
                                                setMobileOpen(false);
                                                if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
                                                    e.preventDefault();
                                                    setTimeout(() => {
                                                        const el = document.getElementById('fasilitas');
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth' });
                                                            window.history.pushState(null, '', '#fasilitas');
                                                        }
                                                    }, 150);
                                                }
                                            }}
                                            className="px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                        >
                                            <Trophy className="size-4 text-slate-500 shrink-0" />
                                            <span>Fasilitas & Lapangan</span>
                                        </a>

                                        <div className="pt-3 pb-1">
                                            <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                Open Mabar & Booking
                                            </p>
                                        </div>

                                        <Link
                                            href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                                            onClick={() => setMobileOpen(false)}
                                            className="px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold flex items-start gap-3 transition-colors group"
                                        >
                                            <Calendar className="size-4 text-[var(--brand)] mt-0.5 shrink-0" />
                                            <div className="flex flex-col text-left">
                                                <span className="text-slate-800 group-hover:text-slate-950 font-semibold">Lihat Jadwal</span>
                                                <span className="text-xs text-slate-500 font-normal">Cek slot lapangan & jadwal main</span>
                                            </div>
                                        </Link>

                                        <Link
                                            href={user ? "/open-mabar/mabar-bareng" : "/login?redirect=/open-mabar/mabar-bareng"}
                                            onClick={() => setMobileOpen(false)}
                                            className="px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold flex items-start gap-3 transition-colors group"
                                        >
                                            <Users className="size-4 text-[var(--brand)] mt-0.5 shrink-0" />
                                            <div className="flex flex-col text-left">
                                                <span className="text-slate-800 group-hover:text-slate-950 font-semibold">Mabar Bareng</span>
                                                <span className="text-xs text-slate-500 font-normal">Gabung sesi mabar yang tersedia</span>
                                            </div>
                                        </Link>

                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setMobileOpen(false)}
                                            className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-sm font-semibold flex items-start gap-3 transition-colors group border border-emerald-100/80 bg-emerald-50/40 mt-1"
                                        >
                                            <Phone className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <div className="flex flex-col text-left">
                                                <span className="text-emerald-950 font-semibold">Reservasi Lapangan</span>
                                                <span className="text-xs text-emerald-700/80 font-normal">Booking via Admin WhatsApp</span>
                                            </div>
                                        </a>
                                    </nav>
                                </div>

                                {/* Drawer Footer */}
                                <div className="pt-4 border-t border-slate-200/80 flex flex-col gap-2 mt-4">
                                    {user ? (
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            onClick={() => setMobileOpen(false)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-sm font-semibold text-rose-700 flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200/60"
                                        >
                                            <LogOut className="size-4" />
                                            <span>Keluar dari Akun</span>
                                        </Link>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Link
                                                href="/login"
                                                onClick={() => setMobileOpen(false)}
                                                className="w-full py-2.5 text-center rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-800 transition-colors"
                                            >
                                                Masuk
                                            </Link>
                                            <Link
                                                href="/register"
                                                onClick={() => setMobileOpen(false)}
                                                className="w-full py-2.5 text-center rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-sm font-semibold shadow-sm transition-colors"
                                            >
                                                Daftar Akun Baru
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    </header>
);
}