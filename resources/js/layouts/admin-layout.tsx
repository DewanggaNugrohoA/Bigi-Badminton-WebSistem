import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { useEcho } from "@laravel/echo-react";
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    BadgePercent,
    FileSpreadsheet,
    Settings,
    Menu,
    LogOut,
    Sun,
    Moon,
    PanelLeftClose,
    PanelLeft,
    Bell,
    BellRing,
    Volume2,
    VolumeX,
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
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageProps } from "@inertiajs/core";
import {
    playWaNotificationSound,
    isNotificationSoundEnabled,
    setNotificationSoundEnabled,
} from "@/lib/sound";

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: Array<{ label: string; href?: string }>;
    fullWidth?: boolean;
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

interface MabarNotificationPayload {
    id_mabar: number;
    judul: string;
    nama_pemohon: string;
    no_hp?: string;
    nama_lapangan?: string;
    tanggal?: string;
    jam_mulai?: string;
    jam_selesai?: string;
    created_at?: string;
}

interface MenuItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
    title?: string;
    items: MenuItem[];
}

/**
 * Definisi grup navigasi sidebar Panel Admin:
 * - Utama: Ringkasan KPI dan jadwal harian
 * - Operasional: Pengelolaan jadwal lapangan reservasi dan persetujuan mabar
 * - Data: Keanggotaan paket member dan pelaporan rekapitulasi/ekspor Excel
 */
const MENU_GROUPS: MenuGroup[] = [
    {
        items: [
            { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
        ],
    },
    {
        title: "Operasional",
        items: [
            { title: "Reservasi", href: "/admin/reservasi", icon: CalendarDays },
            { title: "Open Mabar", href: "/admin/open-mabar", icon: Users },
        ],
    },
    {
        title: "Data",
        items: [
            { title: "Member", href: "/admin/member", icon: BadgePercent },
            { title: "Laporan", href: "/admin/laporan", icon: FileSpreadsheet },
        ],
    },
];

const SIDEBAR_STORAGE_KEY = "admin_sidebar_open";

/**
 * Layout kerangka utama untuk seluruh halaman Panel Admin.
 * Dirancang selaras dengan Panel Kasir dengan sidebar hide/toggle yang mulus.
 */
export default function AdminLayout({
    children,
    title = "Panel Admin",
    fullWidth = false,
}: AdminLayoutProps) {
    const { auth, flash } = usePage<SharedProps>().props;
    const { url } = usePage();
    const user = auth?.user;
    const pathname = url.split("?")[0].split("#")[0];

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        try {
            const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            if (saved !== null) {
                return saved === "true";
            }
            return window.innerWidth >= 768;
        } catch {
            return true;
        }
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [pendingMabarCount, setPendingMabarCount] = useState<number>(0);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isNotificationSoundEnabled());
    const lastKnownIdRef = useRef<number | null>(null);

    const handleNewMabarNotification = useCallback((data: MabarNotificationPayload) => {
        playWaNotificationSound();
        toast.info("Pengajuan Open Mabar Baru!", {
            description: `${data.nama_pemohon} mengajukan "${data.judul}" (${data.tanggal || ""} ${data.jam_mulai || ""})`,
            duration: 9000,
            action: {
                label: "Tinjau",
                onClick: () => router.visit("/admin/open-mabar?status=menunggu"),
            },
        });
    }, []);

    useEcho<MabarNotificationPayload>(
        "admin.notifikasi",
        "MabarDiajukan",
        (payload) => {
            if (payload && payload.id_mabar) {
                if (lastKnownIdRef.current === null || payload.id_mabar > lastKnownIdRef.current) {
                    lastKnownIdRef.current = payload.id_mabar;
                    setPendingMabarCount((prev) => prev + 1);
                    handleNewMabarNotification(payload);
                }
            }
        },
        [handleNewMabarNotification],
        "private"
    );

    useEffect(() => {
        let isMounted = true;

        const checkPendingMabar = async (isInitial = false) => {
            try {
                const res = await fetch("/admin/open-mabar/notifikasi", {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                });
                if (!res.ok) return;
                const data: { pending_count: number; latest: MabarNotificationPayload | null } = await res.json();
                if (!isMounted) return;

                setPendingMabarCount(data.pending_count);

                if (data.latest && data.latest.id_mabar) {
                    if (isInitial) {
                        lastKnownIdRef.current = data.latest.id_mabar;
                    } else if (lastKnownIdRef.current !== null && data.latest.id_mabar > lastKnownIdRef.current) {
                        lastKnownIdRef.current = data.latest.id_mabar;
                        handleNewMabarNotification(data.latest);
                    } else if (lastKnownIdRef.current === null) {
                        lastKnownIdRef.current = data.latest.id_mabar;
                    }
                }
            } catch {
                // Ignore network hiccup during background polling
            }
        };

        checkPendingMabar(true);

        const interval = setInterval(() => {
            if (typeof document !== "undefined" && document.visibilityState === "visible") {
                checkPendingMabar(false);
            }
        }, 7000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [handleNewMabarNotification]);

    const toggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        setNotificationSoundEnabled(next);
        toast(next ? "Suara Notifikasi Diaktifkan" : "Suara Notifikasi Dimatikan");
    };

    const lastFlash = useRef<{ success?: string | null; error?: string | null }>({});

    const toggleSidebar = () => {
        setSidebarOpen((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
            } catch {
                
            }
            return next;
        });
    };

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
        if (href === "/admin") {
            return pathname === "/admin";
        }
        return pathname === href || pathname.startsWith(href + "/");
    };

    const renderNavItems = (isMobile = false) => (
        <nav className="py-2 space-y-4" aria-label="Menu Utama">
            {MENU_GROUPS.map((group, groupIndex) => (
                <div key={group.title || `group-${groupIndex}`} className={cn(groupIndex > 0 && "mt-4 sm:mt-5")}>
                    {group.title && (
                        <div className="px-3 mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground select-none">
                            {group.title}
                        </div>
                    )}
                    <div className="space-y-1">
                        {group.items.map((item) => {
                            const isActive = isItemActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                        if (isMobile) setMobileOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                                        isActive
                                            ? "bg-[var(--brand)] text-white shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                    )}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <Icon className="size-4.5 shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                    {item.href === "/admin/open-mabar" && pendingMabarCount > 0 && (
                                        <span
                                            className={cn(
                                                "ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none",
                                                isActive
                                                    ? "bg-white text-[var(--brand)]"
                                                    : "bg-amber-500 text-white animate-pulse"
                                            )}
                                        >
                                            {pendingMabarCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-transparent text-foreground flex flex-col antialiased print:min-h-0 print:bg-white print:text-slate-900">
            <aside
                aria-label="Sidebar Admin"
                className={cn(
                    "fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col transition-all duration-300 ease-in-out print:hidden",
                    sidebarOpen ? "w-60 translate-x-0" : "-translate-x-full w-60"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 min-w-0"
                        aria-label="Panel Admin Bigi Badminton"
                    >
                        <img
                            src="/images/logo-sm.png"
                            alt="Logo Bigi Badminton"
                            width={36}
                            height={36}
                            className="size-8 object-contain rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/15 shrink-0"
                        />
                        <div className="flex flex-col text-left truncate">
                            <span className="font-unbounded font-extrabold text-xs tracking-tight text-sidebar-foreground leading-tight">
                                BIGI <span className="text-[var(--brand)]">ADMIN</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">Panel Pengelola</span>
                        </div>
                    </Link>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label="Sembunyikan sidebar navigasi"
                    >
                        <PanelLeftClose className="size-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2">
                    {renderNavItems(false)}
                </div>

                <div className="p-3 border-t border-sidebar-border shrink-0">
                    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-muted/40">
                        <div className="size-7 rounded-full bg-[var(--brand)]/15 text-[var(--brand)] flex items-center justify-center font-bold text-xs shrink-0">
                            {user?.nama ? user.nama.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">{user?.nama || "Admin Bigi"}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Administrator
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border flex flex-col">
                    <SheetHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-sidebar-border">
                        <Link
                            href="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3"
                            aria-label="Panel Admin Bigi Badminton"
                        >
                            <img
                                src="/images/logo-sm.png"
                                alt="Logo Bigi Badminton"
                                width={36}
                                height={36}
                                className="size-8 object-contain rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/15 shrink-0"
                            />
                            <div className="flex flex-col text-left">
                                <SheetTitle className="font-unbounded font-extrabold text-xs tracking-tight text-sidebar-foreground leading-tight p-0">
                                    BIGI <span className="text-[var(--brand)]">ADMIN</span>
                                </SheetTitle>
                                <span className="text-[10px] text-muted-foreground font-medium">Panel Pengelola</span>
                            </div>
                        </Link>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-3 py-2">
                        {renderNavItems(true)}
                    </div>
                </SheetContent>
            </Sheet>

            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out print:!pl-0 print:!p-0 print:!m-0 print:!w-full print:!max-w-full",
                    sidebarOpen ? "md:pl-60" : "md:pl-0"
                )}
            >
                <header className="sticky top-0 z-30 h-16 bg-card/85 backdrop-blur-md border-b border-border flex items-center justify-between px-3 sm:px-4 print:hidden">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden shrink-0 size-9"
                            aria-label="Buka menu navigasi admin"
                        >
                            <Menu className="size-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={toggleSidebar}
                            className="hidden md:inline-flex shrink-0 size-9"
                            aria-label={sidebarOpen ? "Sembunyikan menu navigasi" : "Buka menu navigasi"}
                            aria-expanded={sidebarOpen}
                        >
                            {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
                        </Button>

                        <div className="flex items-center gap-2 truncate">
                            <span className="text-sm font-semibold text-foreground truncate">{title}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Tombol & Menu Notifikasi Open Mabar */}
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="relative size-9"
                                        aria-label="Notifikasi Pengajuan Open Mabar"
                                    >
                                        {pendingMabarCount > 0 ? (
                                            <BellRing className="size-4 text-amber-500 animate-pulse" />
                                        ) : (
                                            <Bell className="size-4 text-muted-foreground" />
                                        )}
                                        {pendingMabarCount > 0 && (
                                            <span className="absolute -top-1 -right-1 size-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                                                {pendingMabarCount > 9 ? "9+" : pendingMabarCount}
                                            </span>
                                        )}
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end" className="w-72 p-2">
                                <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60 pb-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                                        <Bell className="size-3.5 text-[var(--brand)]" />
                                        <span>Notifikasi Mabar</span>
                                    </div>
                                    {pendingMabarCount > 0 && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                            {pendingMabarCount} Menunggu
                                        </span>
                                    )}
                                </div>

                                <div className="py-2.5 px-2">
                                    {pendingMabarCount > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-xs text-foreground">
                                                Ada <span className="font-bold text-amber-600 dark:text-amber-400">{pendingMabarCount}</span> jadwal open mabar baru yang menunggu persetujuan admin.
                                            </p>
                                            <Link
                                                href="/admin/open-mabar?status=menunggu"
                                                className="inline-flex items-center justify-center w-full px-2.5 py-1.5 text-xs font-semibold rounded-md bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
                                            >
                                                Tinjau Pengajuan
                                            </Link>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-1">
                                            Tidak ada pengajuan mabar yang menunggu.
                                        </p>
                                    )}
                                </div>

                                <DropdownMenuSeparator />

                                <div className="pt-1.5 px-1">
                                    <button
                                        type="button"
                                        onClick={toggleSound}
                                        className="flex items-center justify-between w-full px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            {soundEnabled ? <Volume2 className="size-3.5 text-emerald-500" /> : <VolumeX className="size-3.5 text-destructive" />}
                                            <span>Suara Notifikasi</span>
                                        </span>
                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                            {soundEnabled ? "Aktif" : "Mati"}
                                        </span>
                                    </button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={toggleTheme}
                            className="size-9"
                            aria-label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
                        >
                            {isDark ? (
                                <Sun className="size-4 text-amber-400" />
                            ) : (
                                <Moon className="size-4 text-slate-700" />
                            )}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant="outline"
                                        className="h-9 px-2 sm:px-2.5 gap-1.5 rounded-lg border-border hover:bg-muted"
                                        aria-label="Menu profil admin"
                                    >
                                        <div className="size-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                             {user?.nama ? user.nama.charAt(0).toUpperCase() : "A"}
                                        </div>
                                        <span className="text-xs font-medium hidden sm:inline-block max-w-[100px] truncate">
                                            {user?.nama || "Admin"}
                                        </span>
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end" className="w-52 p-1">
                                <DropdownMenuLabel className="p-2">
                                    <div className="font-semibold text-xs text-foreground truncate">{user?.nama || "Administrator"}</div>
                                    <div className="text-[11px] text-muted-foreground truncate">{user?.email || "Staf Internal"}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                        Peran: {user?.role || "admin"}
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Link href="/admin/pengaturan" className="flex items-center gap-2 cursor-pointer w-full text-xs">
                                        <Settings className="size-3.5 text-muted-foreground" />
                                        <span>Pengaturan Akun</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive">
                                    <Link
                                        href="/staff/logout"
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-2 cursor-pointer w-full text-destructive text-left text-xs"
                                    >
                                        <LogOut className="size-3.5" />
                                        <span>Keluar</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 w-full min-w-0 print:!w-full print:!max-w-full print:!p-0 print:!m-0">
                    {fullWidth ? (
                        children
                    ) : (
                        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 print:!p-0 print:!m-0 print:!max-w-none print:!w-full">
                            {children}
                        </div>
                    )}
                </main>
            </div>

            <Toaster position="top-right" richColors />
        </div>
    );
}
