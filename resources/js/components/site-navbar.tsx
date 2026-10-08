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
import { Menu, User as UserIcon, Calendar, PlusCircle, List, ExternalLink, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildWaLink } from "@/lib/content";

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
    config?: {
        wa_admin_number?: string;
    };
    [key: string]: any;
}

export function SiteNavbar() {
    const { auth, config } = usePage<SharedProps>().props;
    const user = auth?.user;
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const waLink = buildWaLink(config?.wa_admin_number);

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
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="font-extrabold text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                        BIGI <span className="text-[var(--brand)]">BADMINTON</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                    <NavigationMenu>
                        <NavigationMenuList className="gap-1.5">
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href="/"
                                        className="px-4 py-2.5 text-base font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg transition-colors"
                                    >
                                        Beranda
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <a
                                        href="/#fasilitas"
                                        className="px-4 py-2.5 text-base font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg transition-colors"
                                    >
                                        Fasilitas
                                    </a>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="px-4 py-2.5 text-base font-medium h-auto rounded-lg">
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
                                                <div className="text-[15px] font-semibold text-foreground">Cari Jadwal</div>
                                                <div className="text-xs text-muted-foreground font-normal">Temukan jadwal main bareng</div>
                                            </div>
                                        </Link>
                                        <Link
                                            href={user ? "/open-mabar/create" : "/login?redirect=/open-mabar/create"}
                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                                        >
                                            <PlusCircle className="size-5 text-[var(--brand)] shrink-0" />
                                            <div>
                                                <div className="text-[15px] font-semibold text-foreground">Buat Jadwal</div>
                                                <div className="text-xs text-muted-foreground font-normal">Inisiasi mabar baru</div>
                                            </div>
                                        </Link>
                                        <Link
                                            href={user ? "/open-mabar/saya" : "/login?redirect=/open-mabar/saya"}
                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                                        >
                                            <List className="size-5 text-[var(--brand)] shrink-0" />
                                            <div>
                                                <div className="text-[15px] font-semibold text-foreground">Jadwal Saya</div>
                                                <div className="text-xs text-muted-foreground font-normal">Kelola jadwal yang Anda ikuti</div>
                                            </div>
                                        </Link>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Right / Auth Actions */}
                <div className="hidden lg:flex items-center gap-3">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="outline" className="h-11 px-4 gap-2.5 text-base font-medium rounded-lg">
                                        <UserIcon className="size-4.5 text-muted-foreground" />
                                        <span>{user.nama}</span>
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="p-2.5 border-b border-border">
                                    <p className="text-sm font-semibold truncate">{user.nama}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.no_whatsapp || user.email}</p>
                                </div>

                                {user.role === "user" && (
                                    <DropdownMenuItem>
                                        <Link href="/pengaturan/akun" className="w-full flex items-center gap-2">
                                            <Settings className="size-4" />
                                            <span>Pengaturan Akun</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                {user.role === "admin" && (
                                    <DropdownMenuItem>
                                        <Link href="/admin" className="w-full flex items-center gap-2 text-purple-400">
                                            <LayoutDashboard className="size-4" />
                                            <span>Panel Admin</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                {user.role === "kasir" && (
                                    <DropdownMenuItem>
                                        <Link href="/kasir" className="w-full flex items-center gap-2 text-emerald-400">
                                            <LayoutDashboard className="size-4" />
                                            <span>Panel Kasir</span>
                                        </Link>
                                    </DropdownMenuItem>
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

                {/* Mobile Menu Trigger */}
                <div className="flex lg:hidden items-center gap-2">
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
                                    <SheetTitle className="text-xl font-extrabold tracking-tight">
                                        BIGI <span className="text-[var(--brand)]">BADMINTON</span>
                                    </SheetTitle>
                                </SheetHeader>

                                <nav className="flex flex-col gap-1.5">
                                    <Link
                                        href="/"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 min-h-[44px] flex items-center rounded-lg hover:bg-accent text-sm font-medium transition-colors"
                                    >
                                        Beranda
                                    </Link>
                                    <a
                                        href="/#fasilitas"
                                        onClick={() => setMobileOpen(false)}
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
                                        className="px-3 pl-4 min-h-[44px] rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2.5 transition-colors"
                                    >
                                        <Calendar className="size-4 text-muted-foreground shrink-0" />
                                        <span>Cari Jadwal</span>
                                    </Link>
                                    <Link
                                        href={user ? "/open-mabar/create" : "/login?redirect=/open-mabar/create"}
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 pl-4 min-h-[44px] rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2.5 transition-colors"
                                    >
                                        <PlusCircle className="size-4 text-muted-foreground shrink-0" />
                                        <span>Buat Jadwal</span>
                                    </Link>
                                    <Link
                                        href={user ? "/open-mabar/saya" : "/login?redirect=/open-mabar/saya"}
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 pl-4 min-h-[44px] rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2.5 transition-colors"
                                    >
                                        <List className="size-4 text-muted-foreground shrink-0" />
                                        <span>Jadwal Saya</span>
                                    </Link>

                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 mx-1 min-h-[44px] inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                    >
                                        <span>Reservasi via WA</span>
                                        <ExternalLink className="size-4" />
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
                                                href="/pengaturan/akun"
                                                onClick={() => setMobileOpen(false)}
                                                className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium flex items-center gap-2"
                                            >
                                                <Settings className="size-4" />
                                                <span>Pengaturan Akun</span>
                                            </Link>
                                        )}
                                        {user.role === "admin" && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setMobileOpen(false)}
                                                className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium text-[var(--brand)] flex items-center gap-2"
                                            >
                                                <LayoutDashboard className="size-4" />
                                                <span>Panel Admin</span>
                                            </Link>
                                        )}
                                        {user.role === "kasir" && (
                                            <Link
                                                href="/kasir"
                                                onClick={() => setMobileOpen(false)}
                                                className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium text-emerald-700 flex items-center gap-2"
                                            >
                                                <LayoutDashboard className="size-4" />
                                                <span>Panel Kasir</span>
                                            </Link>
                                        )}
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
        </header>
    );
}