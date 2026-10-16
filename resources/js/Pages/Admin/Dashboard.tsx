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
    Calendar,
    ArrowUpRight,
    Clock,
    User,
    Activity,
    AlertCircle,
} from "lucide-react";
import { formatRupiah, STATUS_RESERVASI_MAP } from "@/lib/admin-format";

interface KpiData {
    pendapatan_hari_ini: number;
    reservasi_mendatang: number;
    open_mabar_menunggu: number;
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
    jadwalHariIni: JadwalItem[];
    dbConnected: boolean;
    tanggalSekarang: string;
}

export default function AdminDashboard({
    kpi,
    jadwalHariIni = [],
    dbConnected = true,
    tanggalSekarang,
}: DashboardProps) {
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
            <Head title="Dashboard - Admin" />

            <div className="space-y-6 sm:space-y-8">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/70">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                            Ringkasan Operasional
                        </h1>
                    </div>

                    {!dbConnected && (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-500">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>Koneksi database MySQL lokal tidak aktif. Data riil tidak dapat dimuat.</span>
                        </div>
                    )}
                </div>

                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    
                    <Card className="flex flex-col justify-between h-full border-border/80 hover:border-border transition-colors">
                        <CardHeader className="pb-2 space-y-0 p-4 sm:p-5">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center leading-snug">
                                Pendapatan Hari Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 space-y-1">
                            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums truncate">
                                {formatRupiah(kpi?.pendapatan_hari_ini || 0)}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                                Rental Lapangan + POS Kasir
                            </p>
                        </CardContent>
                    </Card>

                    
                    <Card className="flex flex-col justify-between h-full border-border/80 hover:border-border transition-colors">
                        <CardHeader className="pb-2 space-y-0 p-4 sm:p-5">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center leading-snug">
                                Reservasi Mendatang
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 space-y-1">
                            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums truncate">
                                {kpi?.reservasi_mendatang ?? 0}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                                Status terkonfirmasi aktif
                            </p>
                        </CardContent>
                    </Card>

                    
                    <Link
                        href="/admin/open-mabar?status=menunggu"
                        className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                    >
                        <Card className="flex flex-col justify-between h-full border-border/80 hover:border-border group-hover:border-amber-500/40 transition-colors">
                            <CardHeader className="pb-2 space-y-0 p-4 sm:p-5">
                                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center leading-snug">
                                    Open Mabar Menunggu Persetujuan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 space-y-1">
                                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums truncate">
                                    {kpi?.open_mabar_menunggu ?? 0}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    Menunggu verifikasi admin &rarr;
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                
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
                                                <TableCell className="text-muted-foreground text-xs font-mono">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="size-3 text-muted-foreground/70" />
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
