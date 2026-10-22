import { useState, useMemo } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import {
    CalendarDays,
    ChevronDown,
    Receipt,
    CalendarCheck,
    Users,
    TrendingUp,
    Clock,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    User,
    Activity,
} from "lucide-react";
import { formatRupiah, STATUS_RESERVASI_MAP } from "@/lib/admin-format";
import { cn } from "@/lib/utils";
import { PageProps } from "@inertiajs/core";

interface KpiData {
    pendapatan_hari_ini?: number;
    pendapatan_bulan_ini: number;
    persen_perubahan_bulan?: number;
    pendapatan_rental_bulan?: number;
    pendapatan_pos_bulan?: number;
    reservasi_mendatang?: number;
    reservasi_bulan_ini?: number;
    open_mabar_menunggu: number;
    rata_rata_transaksi?: number;
}

interface RekapBulanItem {
    bulan: number;
    label: string;
    nama_lengkap: string;
    rental: number;
    pos: number;
    total: number;
    is_current?: boolean;
}

interface JadwalItem {
    id_detail: number;
    nama_lapangan: string;
    jam_mulai: string;
    jam_selesai: string;
    durasi: number;
    nama_pemesan: string;
    status_reservasi: "terkonfirmasi" | "selesai" | "batal" | string;
}

interface DashboardProps {
    kpi: KpiData;
    rekapBulanan?: RekapBulanItem[];
    jadwalHariIni?: JadwalItem[];
    dbConnected?: boolean;
    tanggalSekarang?: string;
    bulanSekarang?: string;
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
}

export default function AdminDashboard({
    kpi,
    rekapBulanan = [],
    jadwalHariIni = [],
    dbConnected = true,
    tanggalSekarang = "Hari Ini",
    bulanSekarang = "Bulan Ini",
}: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;
    const adminFirstName = auth?.user?.nama ? auth.user.nama.split(" ")[0] : "Admin";

    // Mode tab grafik (Total Pendapatan vs Rata-rata)
    const [chartMode, setChartMode] = useState<"total" | "avg">("total");

    // Bulan yang sedang dipilih/di-hover di grafik (default bulan berjalan)
    const currentMonthIndex = rekapBulanan.findIndex((m) => m.is_current);
    const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

    const activeIndex =
        hoveredMonthIndex !== null
            ? hoveredMonthIndex
            : currentMonthIndex >= 0
            ? currentMonthIndex
            : rekapBulanan.length - 1;

    const activeMonth = rekapBulanan[activeIndex] || null;

    // Skala maksimum untuk grafik bulanan
    const maxMonthlyVolume = useMemo(() => {
        const highest = Math.max(...rekapBulanan.map((m) => m.total), 0);
        return Math.max(highest, 1500000);
    }, [rekapBulanan]);

    // Format nilai Y-Axis dalam satuan Ringkas (K / Jt)
    const formatYAxis = (val: number) => {
        if (val >= 1000000) {
            return `Rp ${(val / 1000000).toFixed(1).replace(".0", "")}Jt`;
        }
        if (val >= 1000) {
            return `Rp ${(val / 1000).toFixed(0)}K`;
        }
        return `Rp ${val}`;
    };

    // Nilai yang tampil di header grafik
    const displayedVolume = useMemo(() => {
        if (!activeMonth) return kpi?.pendapatan_bulan_ini || 0;
        if (chartMode === "avg") {
            const resCount = kpi?.reservasi_bulan_ini || 1;
            return Math.round(activeMonth.total / (resCount > 0 ? resCount : 1));
        }
        return activeMonth.total;
    }, [activeMonth, chartMode, kpi]);

    const getStatusBadge = (status: string) => {
        const item = STATUS_RESERVASI_MAP[status];
        if (item) {
            return <Badge variant={item.variant}>{item.label}</Badge>;
        }
        return <Badge variant="neutral">{status}</Badge>;
    };

    return (
        <AdminLayout
            title="Dashboard"
            breadcrumb={[{ label: "Ringkasan" }, { label: "Dashboard" }]}
        >
            <Head title="Dashboard - Admin Bigi Badminton" />

            <div className="space-y-7 pb-10">
                {/* Header Sambutan & Dropdown Periode (Mirip Welcome back, Joshua!) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                            Welcome back, {adminFirstName}!
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Rekapitulasi pendapatan bulanan dan performa operasional Bigi Badminton
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border/80 bg-card shadow-xs text-xs font-medium text-foreground">
                            <CalendarDays className="size-3.5 text-muted-foreground" />
                            <span>{bulanSekarang}</span>
                            <ChevronDown className="size-3 text-muted-foreground ml-1" />
                        </div>
                    </div>
                </div>

                {!dbConnected && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-500">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>Koneksi database MySQL lokal tidak aktif. Data riil tidak dapat dimuat.</span>
                    </div>
                )}

                {/* Bagian Atas: Grafik Batang Bulanan (Kiri) + 4 Metrik Minimalis (Kanan) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                    {/* Kartu Grafik Batang Minimalis (12 Bulan Sepanjang Tahun) */}
                    <div className="lg:col-span-7 xl:col-span-7 p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between">
                        {/* Header Kartu: Segmented Control (Kiri) + Volume Bulan Terpilih (Kanan) */}
                        <div className="flex items-center justify-between pb-4 border-b border-border/40 gap-3">
                            <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/50 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setChartMode("total")}
                                    className={cn(
                                        "px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all text-xs",
                                        chartMode === "total"
                                            ? "bg-background text-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Total Pendapatan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartMode("avg")}
                                    className={cn(
                                        "px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all text-xs",
                                        chartMode === "avg"
                                            ? "bg-background text-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Rata-rata Transaksi
                                </button>
                            </div>

                            <div className="text-right">
                                <span className="text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-200 block font-semibold">
                                    {activeMonth ? activeMonth.nama_lengkap : "Volume"}
                                </span>
                                <div className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground font-heading">
                                    {formatRupiah(displayedVolume)}
                                </div>
                            </div>
                        </div>

                        {/* Area Grafik Batang 12 Bulan */}
                        <div className="relative pt-6 pb-2">
                            {/* Grid Garis Horizontal dan Label Sumbu Y */}
                            <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
                                <div className="flex items-center w-full">
                                    <span className="text-[10px] text-muted-foreground/60 w-12 font-mono shrink-0">
                                        {formatYAxis(maxMonthlyVolume)}
                                    </span>
                                    <div className="flex-1 border-b border-border/20" />
                                </div>
                                <div className="flex items-center w-full">
                                    <span className="text-[10px] text-muted-foreground/60 w-12 font-mono shrink-0">
                                        {formatYAxis(maxMonthlyVolume * 0.66)}
                                    </span>
                                    <div className="flex-1 border-b border-border/20" />
                                </div>
                                <div className="flex items-center w-full">
                                    <span className="text-[10px] text-muted-foreground/60 w-12 font-mono shrink-0">
                                        {formatYAxis(maxMonthlyVolume * 0.33)}
                                    </span>
                                    <div className="flex-1 border-b border-border/20" />
                                </div>
                                <div className="flex items-center w-full">
                                    <span className="text-[10px] text-muted-foreground/60 w-12 font-mono shrink-0">
                                        Rp 0
                                    </span>
                                    <div className="flex-1 border-b border-border/30" />
                                </div>
                            </div>

                            {/* Batang 12 Bulan */}
                            <div className="h-48 flex items-end justify-between gap-1.5 sm:gap-3 pl-12 pr-1">
                                {rekapBulanan.map((item, idx) => {
                                    const heightPercent =
                                        maxMonthlyVolume > 0
                                            ? Math.max(10, Math.round((item.total / maxMonthlyVolume) * 100))
                                            : 10;
                                    const isSelected = idx === activeIndex;

                                    return (
                                        <div
                                            key={item.bulan}
                                            className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                                            onMouseEnter={() => setHoveredMonthIndex(idx)}
                                            onMouseLeave={() => setHoveredMonthIndex(null)}
                                        >
                                            {/* Batang Minimalis */}
                                            <div
                                                className={cn(
                                                    "w-full max-w-[28px] rounded-t-sm transition-all duration-200",
                                                    isSelected
                                                        ? "bg-[var(--brand)] shadow-sm ring-2 ring-[var(--brand)]/20"
                                                        : "bg-muted-foreground/15 hover:bg-muted-foreground/35 group-hover:scale-y-105"
                                                )}
                                                style={{ height: `${heightPercent}%` }}
                                            />

                                            {/* Label Bulan (Jan - Des) */}
                                            <span
                                                className={cn(
                                                    "mt-3 text-[11px] transition-colors leading-none",
                                                    isSelected
                                                        ? "font-bold text-foreground"
                                                        : "text-muted-foreground font-medium"
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sisi Kanan: 4 Kartu Metrik Minimalis (Grid 2x2 Rapih & Proporsional) */}
                    <div className="lg:col-span-5 xl:col-span-5 grid grid-cols-2 gap-3.5 sm:gap-4 content-between">
                        {/* Metrik 1: Total Pendapatan Bulan Ini */}
                        <div className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between gap-2.5 min-h-[120px]">
                            <div className="flex items-center gap-2 min-w-0">
                                <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                                <span className="text-xs font-semibold text-foreground leading-tight">
                                    Total Pendapatan
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground font-heading whitespace-nowrap">
                                    {formatRupiah(kpi?.pendapatan_bulan_ini || 0)}
                                </div>
                                <div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        +{kpi?.persen_perubahan_bulan ?? 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Metrik 2: Open Mabar Menunggu Persetujuan */}
                        <Link
                            href="/admin/open-mabar?status=menunggu"
                            className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between gap-2.5 min-h-[120px] hover:border-amber-500/40 transition-colors group"
                        >
                            <div className="flex items-center gap-2 min-w-0 text-muted-foreground group-hover:text-foreground">
                                <Users className="size-4 shrink-0 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                                <span className="text-xs font-semibold text-foreground leading-tight">
                                    Mabar Menunggu
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground font-heading">
                                        {kpi?.open_mabar_menunggu ?? 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        Pengajuan
                                    </span>
                                </div>
                                <div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        Verifikasi &rarr;
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {/* Metrik 3: Reservasi Bulan Ini */}
                        <div className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between gap-2.5 min-h-[120px]">
                            <div className="flex items-center gap-2 min-w-0">
                                <CalendarCheck className="size-4 shrink-0 text-muted-foreground" />
                                <span className="text-xs font-semibold text-foreground leading-tight">
                                    Reservasi Bulan Ini
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground font-heading">
                                        {kpi?.reservasi_bulan_ini ?? 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        Terjadwal
                                    </span>
                                </div>
                                <div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        Aktif
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Metrik 4: Rata-rata per Reservasi */}
                        <div className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between gap-2.5 min-h-[120px]">
                            <div className="flex items-center gap-2 min-w-0">
                                <Receipt className="size-4 shrink-0 text-muted-foreground" />
                                <span className="text-xs font-semibold text-foreground leading-tight">
                                    Rata-rata Transaksi
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground font-heading whitespace-nowrap">
                                    {formatRupiah(kpi?.rata_rata_transaksi || 0)}
                                </div>
                                <div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        Per Reservasi
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bagian Bawah: Tabel Jadwal Lapangan Hari Ini (Format Asli / Semula) */}
                <div className="w-full">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                                    <Activity className="size-4.5 text-[var(--brand)]" />
                                    Jadwal Lapangan Hari Ini
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Pemanfaatan slot Lapangan 1 & Lapangan 2
                                </p>
                            </div>
                            <Link
                                href="/admin/reservasi"
                                className="text-xs font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1"
                            >
                                <span>Lihat Semua</span>
                                <ArrowUpRight className="size-3.5" />
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            {jadwalHariIni.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lapangan</TableHead>
                                            <TableHead>Jam Main</TableHead>
                                            <TableHead>Pemesan</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jadwalHariIni.map((jadwal) => (
                                            <TableRow key={jadwal.id_detail}>
                                                <TableCell className="font-semibold text-foreground">
                                                    <span>{jadwal.nama_lapangan}</span>
                                                </TableCell>
                                                <TableCell className="text-slate-600 dark:text-slate-300 text-xs font-mono">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="size-3 text-slate-400 dark:text-slate-400" />
                                                        {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-foreground">
                                                        <User className="size-3.5 text-muted-foreground shrink-0" />
                                                        <span className="truncate max-w-[200px] font-medium">{jadwal.nama_pemesan}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {getStatusBadge(jadwal.status_reservasi)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                                    <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                                        <Calendar className="size-6" />
                                    </div>
                                    <h4 className="font-semibold text-sm text-foreground">Belum ada jadwal hari ini</h4>
                                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                        Belum ada slot reservasi lapangan yang terjadwal untuk hari ini.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
