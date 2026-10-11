import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    ShoppingBag,
    Clock,
    ReceiptText,
    Package,
    Boxes,
    ClipboardCheck,
    Ban,
    Menu,
    LogOut,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageProps } from "@inertiajs/core";

interface KasirLayoutProps {
    children: ReactNode;
    title?: string;
    shiftAktif?: {
        id_shift: number;
        status: string;
        waktu_buka: string;
        modal_awal: number;
    } | null;
}

interface SharedProps extends PageProps {
    auth?: {
        user?: {
            id_user: number;
            nama: string;
            email?: string | null;
            role: string;
        } | null;
    };
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    errors: Record<string, string>;
    [key: string]: unknown;
}

interface MenuItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItem[] = [
    { title: "Kasir", href: "/kasir", icon: ShoppingBag },
    { title: "Shift", href: "/kasir/shift", icon: Clock },
    { title: "Riwayat", href: "/kasir/riwayat", icon: ReceiptText },
    { title: "Produk", href: "/kasir/produk", icon: Package },
    { title: "Restock", href: "/kasir/restock", icon: Boxes },
    { title: "Stok Opname", href: "/kasir/opname", icon: ClipboardCheck },
    { title: "Void/Retur", href: "/kasir/void", icon: Ban },
];

export default function KasirLayout({
    children,
    title = "Panel Kasir",
    shiftAktif,
}: KasirLayoutProps) {
    const { auth, flash } = usePage<SharedProps>().props;
    const user = auth?.user;
    const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(true);

    const lastFlash = useRef<{ success?: string | null; error?: string | null }>({});

    useEffect(() => {
        if (flash?.success && flash.success !== lastFlash.current.success) {
            toast.success(flash.success);
            lastFlash.current.success = flash.success;
        }
        if (flash?.error && flash.error !== lastFlash.current.error) {
            toast.error(flash.error);
            lastFlash.current.error = flash.error;
        }
    }, [flash]);

    useEffect(() => {
        const root = document.documentElement;
        setIsDark(root.classList.contains("dark"));

        const observer = new MutationObserver(() => {
            setIsDark(root.classList.contains("dark"));
        });
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        if (root.classList.contains("dark")) {
            root.classList.remove("dark");
            try {
                localStorage.setItem("theme", "light");
            } catch {}
            setIsDark(false);
        } else {
            root.classList.add("dark");
            try {
                localStorage.setItem("theme", "dark");
            } catch {}
            setIsDark(true);
        }
    };

    const isItemActive = (href: string) => {
        if (href === "/kasir") {
            return currentUrl === "/kasir";
        }
        return currentUrl === href || currentUrl.startsWith(href + "/");
    };

    const renderNavItems = (isDrawer = false) => (
        <nav className="flex flex-col gap-1 py-3" aria-label="Menu Kasir">
            {MENU_ITEMS.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                            if (isDrawer) setMobileOpen(false);
                        }}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative min-h-[40px] select-none",
                            active
                                ? "bg-[var(--brand)] text-white shadow-xs"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                            collapsed && !isDrawer && "justify-center px-2"
                        )}
                        title={collapsed && !isDrawer ? item.title : undefined}
                    >
                        <Icon
                            className={cn(
                                "size-4.5 shrink-0 transition-transform group-hover:scale-105",
                                active ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                            )}
                        />
                        {(!collapsed || isDrawer) && (
                            <span className="truncate">{item.title}</span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen flex bg-background text-foreground antialiased selection:bg-[var(--brand)] selection:text-white">
            <aside
                className={cn(
                    "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
                    <Link
                        href="/kasir"
                        className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg overflow-hidden"
                        aria-label="Panel Kasir Bigi Badminton"
                    >
                        <img
                            src="/images/logo-sm.png"
                            alt="Logo Bigi Badminton"
                            width={40}
                            height={40}
                            className="size-9 object-contain rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/15 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="font-unbounded font-extrabold text-sm tracking-tight text-sidebar-foreground group-hover:text-primary transition-colors leading-tight">
                                    BIGI <span className="text-[var(--brand)]">KASIR</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">Panel Kasir POS</span>
                            </div>
                        )}
                    </Link>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                    >
                        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
                    {renderNavItems(false)}
                </div>

                <div className="p-3 border-t border-sidebar-border bg-sidebar/50 shrink-0">
                    {!collapsed ? (
                        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-card/60 border border-border/50">
                            <div className="size-8 rounded-full bg-[var(--brand)]/15 text-[var(--brand)] flex items-center justify-center font-bold text-xs shrink-0">
                                {user?.nama ? user.nama.charAt(0).toUpperCase() : "K"}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-foreground truncate">{user?.nama || "Kasir"}</span>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    Staf Kasir
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="size-8 rounded-full bg-[var(--brand)]/15 text-[var(--brand)] flex items-center justify-center font-bold text-xs shrink-0" title={user?.nama || "Kasir"}>
                                {user?.nama ? user.nama.charAt(0).toUpperCase() : "K"}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-72 p-0 bg-sidebar border-r border-sidebar-border flex flex-col">
                    <SheetHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-sidebar-border">
                        <Link
                            href="/kasir"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3"
                            aria-label="Panel Kasir Bigi Badminton"
                        >
                            <img
                                src="/images/logo-sm.png"
                                alt="Logo Bigi Badminton"
                                width={40}
                                height={40}
                                className="size-9 object-contain rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/15 shrink-0"
                            />
                            <div className="flex flex-col text-left">
                                <SheetTitle className="font-unbounded font-extrabold text-sm tracking-tight text-sidebar-foreground leading-tight p-0">
                                    BIGI <span className="text-[var(--brand)]">KASIR</span>
                                </SheetTitle>
                                <span className="text-[10px] text-muted-foreground font-medium">Panel Kasir POS</span>
                            </div>
                        </Link>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-4 py-2">
                        {renderNavItems(true)}
                    </div>
                </SheetContent>
            </Sheet>

            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
                    collapsed ? "lg:pl-20" : "lg:pl-64"
                )}
            >
                <header className="sticky top-0 z-30 h-16 bg-background/85 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden shrink-0"
                            aria-label="Buka menu navigasi"
                        >
                            <Menu className="size-5" />
                        </Button>

                        <div className="flex items-center gap-2.5 truncate">
                            <span className="text-sm font-semibold text-foreground truncate">{title}</span>
                            {shiftAktif ? (
                                <Badge variant="success" className="text-xs py-0.5">
                                    Shift terbuka
                                </Badge>
                            ) : (
                                <Badge variant="neutral" className="text-xs py-0.5">
                                    Belum ada shift
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={toggleTheme}
                            className="size-9 sm:size-10"
                            aria-label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
                        >
                            {isDark ? (
                                <Sun className="size-4.5 text-amber-400" />
                            ) : (
                                <Moon className="size-4.5 text-slate-700" />
                            )}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant="outline"
                                        className="h-9 sm:h-10 px-2.5 sm:px-3 gap-2 rounded-lg border-border hover:bg-muted"
                                        aria-label="Menu profil kasir"
                                    >
                                        <div className="size-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                            {user?.nama ? user.nama.charAt(0).toUpperCase() : "K"}
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium hidden md:inline-block max-w-[120px] truncate">
                                            {user?.nama || "Kasir"}
                                        </span>
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end" className="w-56 p-1">
                                <DropdownMenuLabel className="p-2">
                                    <div className="font-semibold text-sm text-foreground truncate">{user?.nama || "Kasir"}</div>
                                    <div className="text-xs text-muted-foreground truncate">{user?.email || "Staf Internal"}</div>
                                    <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                        Peran: {user?.role || "kasir"}
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive">
                                    <Link
                                        href="/staff/logout"
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-2 cursor-pointer w-full text-destructive text-left"
                                    >
                                        <LogOut className="size-4" />
                                        <span>Keluar</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>

            <Toaster position="top-right" richColors />
        </div>
    );
}
