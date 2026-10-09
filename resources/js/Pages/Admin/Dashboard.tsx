import { Head, Link } from "@inertiajs/react";
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
    DollarSign,
    CalendarCheck,
    Users,
    UserCheck,
    Calendar,
    ArrowUpRight,
    History,
    AlertCircle,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Activity,
} from "lucide-react";

interface KpiData {
    pendapatan_hari_ini: number;
    reservasi_mendatang: number;
    open_mabar_menunggu: number;
    kasir_aktif: number;
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

interface AktivitasItem {
    id_log: number;
    waktu: string;
    waktu_lengkap: string;
    pengguna: string;
    role: string;
    aksi: string;
    objek: string;
    keterangan: string;
}

interface DashboardProps {
    kpi: KpiData;
    jadwalHariIni: JadwalItem[];
    aktivitasTerbaru: AktivitasItem[];
    dbConnected: boolean;
    tanggalSekarang: string;
}

export default function AdminDashboard({
    kpi,
    jadwalHariIni = [],
    aktivitasTerbaru = [],
    dbConnected = true,
    tanggalSekarang,
}: DashboardProps) {
    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "terkonfirmasi":
                return <Badge variant="success">Terkonfirmasi</Badge>;
            case "selesai":
                return <Badge variant="neutral">Selesai</Badge>;
            case "batal":
                return <Badge variant="danger">Batal</Badge>;
            default:
                return <Badge variant="neutral">{status}</Badge>;
        }
    };

    return (
        <AdminLayout
            title="Dashboard"
            breadcrumb={[{ label: "Ringkasan" }, { label: "Dashboard" }]}
        >
            <Head title="Dashboard - Admin" />

            <div className="space-y-6 sm:space-y-8">
                {/* Header Welcome Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/70">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                            Ringkasan Operasional
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-[var(--brand)] shrink-0" />
                            <span>{tanggalSekarang}</span>
                        </p>
                    </div>

                    {!dbConnected && (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-500">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>Koneksi database MySQL lokal tidak aktif. Data riil tidak dapat dimuat.</span>
                        </div>
                    )}
                </div>

                {/* 4 KPI Cards (Struktur visual CoreUI stat cards diadaptasi ke Tailwind) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* Card 1: Pendapatan Hari Ini */}
                    <Card className="relative overflow-hidden border-border/80 hover:border-[var(--brand)]/40 transition-all">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--brand)]" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Pendapatan Hari Ini
                            </CardTitle>
                            <div className="size-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
                                <DollarSign className="size-4.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                                {formatRupiah(kpi?.pendapatan_hari_ini || 0)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="font-medium text-emerald-500">Rental Lapangan</span>
                                <span>+</span>
                                <span className="font-medium text-sky-500">POS Kasir</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Reservasi Mendatang */}
                    <Card className="relative overflow-hidden border-border/80 hover:border-emerald-500/40 transition-all">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Reservasi Mendatang
                            </CardTitle>
                            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <CalendarCheck className="size-4.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {kpi?.reservasi_mendatang ?? 0}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Status terkonfirmasi aktif
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Open Mabar Menunggu Persetujuan */}
                    <Card className="relative overflow-hidden border-border/80 hover:border-amber-500/40 transition-all">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Open Mabar Menunggu
                            </CardTitle>
                            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Users className="size-4.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {kpi?.open_mabar_menunggu ?? 0}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Menunggu verifikasi admin
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Kasir Aktif */}
                    <Card className="relative overflow-hidden border-border/80 hover:border-sky-500/40 transition-all">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Kasir Aktif
                            </CardTitle>
                            <div className="size-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                                <UserCheck className="size-4.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {kpi?.kasir_aktif ?? 0}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Akun staf kasir siap dinas
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Grid 2 Kolom: Jadwal Lapangan Hari Ini & Aktivitas Terbaru */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    {/* Tabel 1: Jadwal Lapangan Hari Ini (lg:col-span-7) */}
                    <div className="lg:col-span-7 flex flex-col">
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
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-2 rounded-full bg-[var(--brand)]" />
                                                            <span>{jadwal.nama_lapangan}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs font-mono">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock className="size-3 text-muted-foreground/70" />
                                                            {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-foreground">
                                                            <User className="size-3.5 text-muted-foreground shrink-0" />
                                                            <span className="truncate max-w-[140px] font-medium">{jadwal.nama_pemesan}</span>
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

                    {/* Tabel 2: Aktivitas Terbaru (lg:col-span-5) */}
                    <div className="lg:col-span-5 flex flex-col">
                        <Card className="flex-1 flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                                        <History className="size-4.5 text-[var(--brand)]" />
                                        Aktivitas Terbaru
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Catatan peristiwa sistem & audit log
                                    </p>
                                </div>
                                <Link
                                    href="/admin/audit-log"
                                    className="text-xs font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1"
                                >
                                    <span>Audit Log</span>
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                {aktivitasTerbaru.length > 0 ? (
                                    <div className="divide-y divide-border/60">
                                        {aktivitasTerbaru.map((log) => (
                                            <div
                                                key={log.id_log}
                                                className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors flex items-start justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-xs text-foreground truncate max-w-[120px]">
                                                            {log.pengguna}
                                                        </span>
                                                        <Badge variant="neutral" className="text-[10px] px-1.5 py-0 h-4">
                                                            {log.aksi}
                                                        </Badge>
                                                        <span className="text-[11px] text-muted-foreground truncate">
                                                            pada {log.objek}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {log.keterangan}
                                                    </p>
                                                </div>
                                                <span
                                                    className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5"
                                                    title={log.waktu_lengkap}
                                                >
                                                    {log.waktu}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                                        <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                                            <History className="size-6" />
                                        </div>
                                        <h4 className="font-semibold text-sm text-foreground">Tidak ada aktivitas</h4>
                                        <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                            Belum ada catatan log aktivitas yang tersimpan di sistem.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
