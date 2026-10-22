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

    // Mode filter grafik (Total, Sewa Lapangan, POS Kasir)
    const [chartMode, setChartMode] = useState<"total" | "rental" | "pos">("total");

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

    // Skala maksimum untuk grafik bulanan sesuai mode filter aktif
    const maxMonthlyVolume = useMemo(() => {
        let highest = 0;
        for (const m of rekapBulanan) {
            const val = chartMode === "rental" ? m.rental : chartMode === "pos" ? m.pos : m.total;
            if (val > highest) highest = val;
        }
        return Math.max(highest, 1200000);
    }, [rekapBulanan, chartMode]);

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

    // Nilai aktif yang tampil di header grafik
    const displayedVolume = useMemo(() => {
        if (!activeMonth) return kpi?.pendapatan_bulan_ini || 0;
        if (chartMode === "rental") return activeMonth.rental;
        if (chartMode === "pos") return activeMonth.pos;
        return activeMonth.total;
    }, [activeMonth, chartMode, kpi]);

    // Label singkat bulan Indonesia
    const labelBulanIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    // Koordinat titik untuk kurva area SVG (Spline Area)
    const chartPoints = useMemo(() => {
        if (!rekapBulanan.length) return [];
        const count = rekapBulanan.length;
        const paddingLeft = 54;
        const paddingRight = 18;
        const baselineY = 152;
        const topY = 22;
        const usableW = 560 - paddingLeft - paddingRight;
        const usableH = baselineY - topY;

        return rekapBulanan.map((item, idx) => {
            const x = paddingLeft + (idx / Math.max(1, count - 1)) * usableW;
            const val = chartMode === "rental" ? item.rental : chartMode === "pos" ? item.pos : item.total;
            const norm = maxMonthlyVolume > 0 ? Math.min(1, Math.max(0, val / maxMonthlyVolume)) : 0;
            const y = baselineY - norm * usableH;
            return {
                x,
                y,
                val,
                item,
                index: idx,
                label: labelBulanIndo[idx] || item.label,
            };
        });
    }, [rekapBulanan, chartMode, maxMonthlyVolume]);

    // Menghasilkan SVG cubic bezier path yang mulus untuk Area & Garis
    const { linePath, areaPath } = useMemo(() => {
        if (chartPoints.length < 2) return { linePath: "", areaPath: "" };
        const baselineY = 152;
        let d = `M ${chartPoints[0].x.toFixed(1)} ${chartPoints[0].y.toFixed(1)}`;

        for (let i = 0; i < chartPoints.length - 1; i++) {
            const p0 = chartPoints[i];
            const p1 = chartPoints[i + 1];
            const pPrev = chartPoints[Math.max(0, i - 1)];
            const pNext = chartPoints[Math.min(chartPoints.length - 1, i + 2)];

            let cp1x = p0.x + (p1.x - pPrev.x) / 5;
            let cp1y = p0.y + (p1.y - pPrev.y) / 5;
            let cp2x = p1.x - (pNext.x - p0.x) / 5;
            let cp2y = p1.y - (pNext.y - p0.y) / 5;

            // Jika kedua titik bernilai 0 di baseline, kunci control points tetap horizontal
            if (p0.y >= baselineY - 0.5 && p1.y >= baselineY - 0.5) {
                cp1y = baselineY;
                cp2y = baselineY;
            }

            cp1y = Math.min(baselineY, Math.max(12, cp1y));
            cp2y = Math.min(baselineY, Math.max(12, cp2y));

            d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
        }

        const area = `${d} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${baselineY} L ${chartPoints[0].x.toFixed(1)} ${baselineY} Z`;
        return { linePath: d, areaPath: area };
    }, [chartPoints]);

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

                {/* Bagian Atas: Grafik Area Tren Mulus (Kiri) + 4 Metrik Minimalis (Kanan) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                    {/* Kartu Grafik Area Tren Mulus (12 Bulan Sepanjang Tahun) */}
                    <div className="lg:col-span-7 xl:col-span-7 p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between">
                        {/* Header Kartu: Filter Kategori (Kiri) + Volume Bulan Terpilih & Rincian (Kanan) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/40 gap-3">
                            <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/50 text-xs self-start">
                                <button
                                    type="button"
                                    onClick={() => setChartMode("total")}
                                    className={cn(
                                        "px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer",
                                        chartMode === "total"
                                            ? "bg-background text-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Total Pendapatan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartMode("rental")}
                                    className={cn(
                                        "px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer",
                                        chartMode === "rental"
                                            ? "bg-background text-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Sewa Lapangan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartMode("pos")}
                                    className={cn(
                                        "px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer",
                                        chartMode === "pos"
                                            ? "bg-background text-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    POS Kasir
                                </button>
                            </div>

                            <div className="text-left sm:text-right min-h-[58px] flex flex-col justify-center">
                                <div className="flex items-center sm:justify-end h-5">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-200 font-semibold">
                                        {activeMonth ? activeMonth.nama_lengkap : "Volume"}
                                    </span>
                                </div>
                                <div className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground font-heading mt-0.5">
                                    {formatRupiah(displayedVolume)}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center sm:justify-end gap-2 h-4">
                                    {activeMonth && (
                                        <>
                                            <span>Sewa: <strong className="text-foreground">{formatRupiah(activeMonth.rental)}</strong></span>
                                            <span>•</span>
                                            <span>POS: <strong className="text-foreground">{formatRupiah(activeMonth.pos)}</strong></span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Area Grafik SVG Spline Area */}
                        <div className="relative pt-5 pb-1">
                            <div className="w-full h-52 relative">
                                <svg
                                    viewBox="0 0 560 190"
                                    className="w-full h-full overflow-visible"
                                    preserveAspectRatio="none"
                                    onMouseLeave={() => setHoveredMonthIndex(null)}
                                >
                                    <defs>
                                        <linearGradient id="revenue-area-grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.4" />
                                            <stop offset="60%" stopColor="var(--brand)" stopOpacity="0.1" />
                                            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Garis Horizontal dan Label Sumbu Y */}
                                    <g className="opacity-60">
                                        <line x1="50" y1="22" x2="550" y2="22" stroke="currentColor" strokeDasharray="3 3" className="text-border/40" />
                                        <text x="44" y="25" textAnchor="end" className="text-[9.5px] fill-muted-foreground font-mono">
                                            {formatYAxis(maxMonthlyVolume)}
                                        </text>

                                        <line x1="50" y1="65" x2="550" y2="65" stroke="currentColor" strokeDasharray="3 3" className="text-border/30" />
                                        <text x="44" y="68" textAnchor="end" className="text-[9.5px] fill-muted-foreground font-mono">
                                            {formatYAxis(maxMonthlyVolume * 0.66)}
                                        </text>

                                        <line x1="50" y1="108" x2="550" y2="108" stroke="currentColor" strokeDasharray="3 3" className="text-border/30" />
                                        <text x="44" y="111" textAnchor="end" className="text-[9.5px] fill-muted-foreground font-mono">
                                            {formatYAxis(maxMonthlyVolume * 0.33)}
                                        </text>

                                        <line x1="50" y1="152" x2="550" y2="152" stroke="currentColor" className="text-border/50" />
                                        <text x="44" y="155" textAnchor="end" className="text-[9.5px] fill-muted-foreground font-mono">
                                            Rp 0
                                        </text>
                                    </g>

                                    {/* Area Gradien di Bawah Kurva */}
                                    {areaPath && (
                                        <path
                                            d={areaPath}
                                            fill="url(#revenue-area-grad)"
                                            className="transition-all duration-300 ease-out"
                                        />
                                    )}

                                    {/* Garis Tren Kurva Mulus */}
                                    {linePath && (
                                        <path
                                            d={linePath}
                                            fill="none"
                                            stroke="var(--brand)"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-all duration-300 ease-out"
                                        />
                                    )}

                                    {/* Sumbu X Label Bulan & Indikator Titik */}
                                    {chartPoints.map((pt, idx) => {
                                        const isSelected = idx === activeIndex;
                                        const step = chartPoints.length > 1 ? 488 / (chartPoints.length - 1) : 40;
                                        let rectX = 0;
                                        let rectW = 0;

                                        if (idx === 0) {
                                            rectX = 0;
                                            rectW = pt.x + step / 2;
                                        } else if (idx === chartPoints.length - 1) {
                                            rectX = pt.x - step / 2;
                                            rectW = 560 - rectX;
                                        } else {
                                            rectX = pt.x - step / 2;
                                            rectW = step;
                                        }

                                        return (
                                            <g key={pt.item.bulan}>
                                                {/* Garis Vertikal Penunjuk saat Aktif */}
                                                {isSelected && (
                                                    <line
                                                        x1={pt.x}
                                                        y1="22"
                                                        x2={pt.x}
                                                        y2="152"
                                                        stroke="var(--brand)"
                                                        strokeDasharray="3 3"
                                                        strokeWidth="1.5"
                                                        className="opacity-60"
                                                    />
                                                )}

                                                {/* Titik Data pada Kurva (Tanpa animasi ping/bola nembak) */}
                                                {isSelected ? (
                                                    <g>
                                                        <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r="6"
                                                            className="fill-[var(--brand)]/25"
                                                        />
                                                        <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r="4"
                                                            className="fill-background stroke-[var(--brand)] stroke-[2.5]"
                                                        />
                                                    </g>
                                                ) : pt.val > 0 ? (
                                                    <circle
                                                        cx={pt.x}
                                                        cy={pt.y}
                                                        r="3.5"
                                                        className="fill-[var(--brand)]/70 hover:fill-[var(--brand)] transition-colors"
                                                    />
                                                ) : (
                                                    <circle
                                                        cx={pt.x}
                                                        cy={pt.y}
                                                        r="2"
                                                        className="fill-muted-foreground/30"
                                                    />
                                                )}

                                                {/* Label Bulan (Jan - Des) */}
                                                <text
                                                    x={pt.x}
                                                    y="174"
                                                    textAnchor="middle"
                                                    className={cn(
                                                        "text-[11px] transition-colors select-none",
                                                        isSelected
                                                            ? "fill-foreground font-bold text-xs"
                                                            : "fill-muted-foreground/80 font-medium"
                                                    )}
                                                >
                                                    {pt.label}
                                                </text>

                                                {/* Hitbox Area Hover per Bulan (Rapat berdampingan tanpa celah jeda) */}
                                                <rect
                                                    x={rectX}
                                                    y="0"
                                                    width={rectW}
                                                    height="190"
                                                    fill="transparent"
                                                    className="cursor-pointer"
                                                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Sisi Kanan: 4 Kartu Metrik Minimalis (Grid 2x2 Rapih & Proporsional Tanpa Gap Tengah) */}
                    <div className="lg:col-span-5 xl:col-span-5 grid grid-cols-2 grid-rows-2 gap-3.5 sm:gap-4">
                        {/* Metrik 1: Total Pendapatan Bulan Ini */}
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between h-full hover:border-border transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="size-6 sm:size-7 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0">
                                    <TrendingUp className="size-3.5 sm:size-4" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-snug">
                                    Total Pendapatan
                                </span>
                            </div>
                            <div className="mt-2.5">
                                <div className="text-sm sm:text-base xl:text-lg font-bold tracking-tight text-foreground font-mono tabular-nums">
                                    {formatRupiah(kpi?.pendapatan_bulan_ini || 0)}
                                </div>
                            </div>
                        </div>

                        {/* Metrik 2: Open Mabar Menunggu Persetujuan */}
                        <Link
                            href="/admin/open-mabar?status=menunggu"
                            className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between h-full hover:border-amber-500/40 transition-colors group"
                        >
                            <div className="flex items-center gap-2 min-w-0 text-muted-foreground group-hover:text-foreground">
                                <div className="size-6 sm:size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Users className="size-3.5 sm:size-4" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground leading-snug">
                                    Mabar Menunggu
                                </span>
                            </div>
                            <div className="mt-2.5 flex items-baseline gap-1.5">
                                <span className="text-sm sm:text-base xl:text-lg font-bold tracking-tight text-foreground font-mono tabular-nums">
                                    {kpi?.open_mabar_menunggu ?? 0}
                                </span>
                                <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                                    Pengajuan
                                </span>
                            </div>
                        </Link>

                        {/* Metrik 3: Reservasi Bulan Ini */}
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between h-full hover:border-border transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="size-6 sm:size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <CalendarCheck className="size-3.5 sm:size-4" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-snug">
                                    Reservasi Bulan Ini
                                </span>
                            </div>
                            <div className="mt-2.5 flex items-baseline gap-1.5">
                                <span className="text-sm sm:text-base xl:text-lg font-bold tracking-tight text-foreground font-mono tabular-nums">
                                    {kpi?.reservasi_bulan_ini ?? 0}
                                </span>
                                <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                                    Terjadwal
                                </span>
                            </div>
                        </div>

                        {/* Metrik 4: Rata-rata per Reservasi */}
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between h-full hover:border-border transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="size-6 sm:size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Receipt className="size-3.5 sm:size-4" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-snug">
                                    Rata-rata Transaksi
                                </span>
                            </div>
                            <div className="mt-2.5">
                                <div className="text-sm sm:text-base xl:text-lg font-bold tracking-tight text-foreground font-mono tabular-nums">
                                    {formatRupiah(kpi?.rata_rata_transaksi || 0)}
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
