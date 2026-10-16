import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
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
import { Menu, User as UserIcon, Calendar, Users, PlusCircle, List, LogOut, Settings, Phone } from "lucide-react";
import { buildWaLink } from "@/lib/content";
import { cn } from "@/lib/utils";

interface AuthUser {
    id_user: number;
    nama: string;
    email?: string | null;
    no_whatsapp?: string;
    role: "user" | "admin" | "kasir";
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
        const checkHashAndScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }

            if (currentPath === "/") {
                if (window.location.hash === "#fasilitas") {
                    setActiveTab("fasilitas");
                } else if (window.scrollY < 200) {
                    setActiveTab("beranda");
                }
            } else if (currentPath.startsWith("/open-mabar")) {
                setActiveTab("mabar");
            }
        };

        checkHashAndScroll();
        window.addEventListener("scroll", checkHashAndScroll);
        window.addEventListener("hashchange", checkHashAndScroll);
        return () => {
            window.removeEventListener("scroll", checkHashAndScroll);
            window.removeEventListener("hashchange", checkHashAndScroll);
        };
    }, [currentPath]);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
                scrolled
                    ? "bg-background/85 backdrop-blur-md border-b border-border shadow-sm py-4"
                    : "bg-transparent py-6"
            )}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                
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
                            className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/15 group-hover:scale-105 transition-transform shrink-0"
                        />
                        <span className="font-unbounded font-extrabold text-xl sm:text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                            BIGI <span className="text-[var(--brand)]">BADMINTON</span>
                        </span>
                    </Link>
                </div>

                
                <div className="hidden lg:flex items-center justify-center shrink-0">
                    <NavigationMenu>
                        <NavigationMenuList className="relative flex items-center rounded-full border border-border/70 bg-card/75 p-1 backdrop-blur-md shadow-xs">
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
                                            "px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 select-none",
                                            activeTab === "beranda"
                                                ? "bg-[var(--brand)] text-white shadow-xs"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        Beranda
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

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
                                            "px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 select-none",
                                            activeTab === "fasilitas"
                                                ? "bg-[var(--brand)] text-white shadow-xs"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        Fasilitas
                                    </a>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuTrigger
                                    className={cn(
                                        "px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 select-none",
                                        activeTab === "mabar"
                                            ? "bg-[var(--brand)] text-white shadow-xs data-[popup-open]:text-white hover:bg-[var(--brand)]/90"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Open Mabar
                                </NavigationMenuTrigger>
                                <NavigationMenuContent width="w-72">
                                    <div className="flex flex-col gap-1.5 p-2.5">
                                        <Link
                                            href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                                        >
                                            <Calendar className="size-5 text-[var(--brand)] shrink-0" />
                                            <div>
                                                <div className="text-[15px] font-semibold text-foreground">Lihat Jadwal</div>
                                                <div className="text-xs text-muted-foreground font-normal">Lihat slot lapangan yang kosong</div>
                                            </div>
                                        </Link>
                                        <Link
                                            href={user ? "/open-mabar/mabar-bareng" : "/login?redirect=/open-mabar/mabar-bareng"}
                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
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
                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
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

                
                <div className="flex-1 flex items-center justify-end">
                    
                    <div className="hidden lg:flex items-center gap-3">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button variant="outline" className="h-10 px-3.5 gap-2 text-sm font-medium rounded-lg">
                                            <UserIcon className="size-4 text-muted-foreground" />
                                            <span>Akun</span>
                                        </Button>
                                    }
                                />
                                <DropdownMenuContent align="end" className="w-56">
                                    <div className="p-2.5 border-b border-border">
                                        <p className="text-sm font-semibold truncate">{user.nama}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.no_whatsapp || user.email}</p>
                                    </div>

                                    {user.role === "user" && (
                                        <>
                                            <DropdownMenuItem>
                                                <Link href="/open-mabar/saya" className="w-full flex items-center gap-2">
                                                    <List className="size-4 text-[var(--brand)]" />
                                                    <span>Jadwal Saya</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Link href="/pengaturan/akun" className="w-full flex items-center gap-2">
                                                    <Settings className="size-4" />
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
                            <div className="flex items-center gap-2.5">
                                <Link href="/login">
                                    <Button variant="ghost" className="h-11 px-5 text-base font-medium rounded-lg hover:text-foreground">
                                        Masuk
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="h-11 px-6 text-base font-semibold rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 shadow-xs">
                                        Daftar
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    
                    <div className="flex lg:hidden items-center">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger
                                render={
                                    <Button variant="ghost" className="size-11 p-0 flex items-center justify-center rounded-lg" aria-label="Buka navigasi mobile">
                                        <Menu className="size-6" />
                                    </Button>
                                }
                            />
                            <SheetContent side="right" className="w-[85vw] max-w-xs flex flex-col justify-between">
                                <div className="flex flex-col gap-6 mt-6">
                                    <SheetHeader className="text-left">
                                        <div className="flex items-center">
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
                                                    className="h-9 w-9 object-contain rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/15 shrink-0"
                                                />
                                                <span className="font-unbounded text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                                                    BIGI <span className="text-[var(--brand)]">BADMINTON</span>
                                                </span>
                                            </Link>
                                        </div>
                                        <SheetTitle className="sr-only">Bigi Badminton</SheetTitle>
                                    </SheetHeader>

                                    <nav className="flex flex-col gap-1.5">
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
                                            className="px-3 min-h-[44px] flex items-center rounded-lg hover:bg-accent text-sm font-medium transition-colors"
                                        >
                                            Beranda
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
                                            className="px-3 min-h-[44px] flex items-center rounded-lg hover:bg-accent text-sm font-medium transition-colors"
                                        >
                                            Fasilitas
                                        </a>

                                        <div className="pt-2 pb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Open Mabar
                                        </div>
                                        <Link
                                            href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                                            onClick={() => setMobileOpen(false)}
                                            className="px-3 pl-4 py-2 min-h-[44px] rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2.5 transition-colors"
                                        >
                                            <Calendar className="size-4 text-muted-foreground shrink-0" />
                                            <div className="flex flex-col text-left">
                                                <span className="text-foreground">Lihat Jadwal</span>
                                                <span className="text-xs text-muted-foreground font-normal">Lihat slot lapangan yang kosong</span>
                                            </div>
                                        </Link>
                                        <Link
                                            href={user ? "/open-mabar/mabar-bareng" : "/login?redirect=/open-mabar/mabar-bareng"}
                                            onClick={() => setMobileOpen(false)}
                                            className="px-3 pl-4 py-2 min-h-[44px] rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2.5 transition-colors"
                                        >
                                            <Users className="size-4 text-muted-foreground shrink-0" />
                                            <div className="flex flex-col text-left">
                                                <span className="text-foreground">Mabar Bareng</span>
                                                <span className="text-xs text-muted-foreground font-normal">Gabung mabar yang sudah tersedia</span>
                                            </div>
                                        </Link>
                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setMobileOpen(false)}
                                            className="px-3 pl-4 min-h-[44px] rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2.5 transition-colors text-[var(--brand)]"
                                        >
                                            <Phone className="size-4 shrink-0" />
                                            <span>Ingin booking lapangan hubungi kami</span>
                                        </a>
                                    </nav>
                                </div>

                                <div className="pt-6 border-t border-border flex flex-col gap-2">
                                    {user ? (
                                        <>
                                            <div className="px-2 pb-2">
                                                <p className="text-sm font-semibold truncate">{user.nama}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.no_whatsapp || user.email}</p>
                                            </div>
                                            {user.role === "user" && (
                                                <Link
                                                    href="/open-mabar/saya"
                                                    onClick={() => setMobileOpen(false)}
                                                    className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium flex items-center gap-2"
                                                >
                                                    <List className="size-4 text-[var(--brand)]" />
                                                    <span>Jadwal Saya</span>
                                                </Link>
                                            )}
                                            <Link
                                                href="/pengaturan/akun"
                                                onClick={() => setMobileOpen(false)}
                                                className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium flex items-center gap-2"
                                            >
                                                <Settings className="size-4" />
                                                <span>Pengaturan Akun</span>
                                            </Link>
                                            <Link
                                                href="/logout"
                                                method="post"
                                                as="button"
                                                onClick={() => setMobileOpen(false)}
                                                className="w-full px-3 py-2 rounded-md hover:bg-destructive/10 text-sm font-medium text-destructive flex items-center gap-2 text-left"
                                            >
                                                <LogOut className="size-4" />
                                                <span>Keluar</span>
                                            </Link>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Link
                                                href="/login"
                                                onClick={() => setMobileOpen(false)}
                                                className="w-full py-2 text-center rounded-md border border-input text-sm font-medium"
                                            >
                                                Masuk
                                            </Link>
                                            <Link
                                                href="/register"
                                                onClick={() => setMobileOpen(false)}
                                                className="w-full py-2 text-center rounded-md bg-[var(--brand)] text-white text-sm font-medium"
                                            >
                                                Daftar
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