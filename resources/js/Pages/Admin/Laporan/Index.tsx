import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";

interface ReturVoidItem {
    id_retur: number;
    id_transaksi: number;
    jenis: "void" | "retur";
    alasan: string;
    status: string;
    tanggal: string;
    transaksi_pos?: {
        no_transaksi: string;
        total: number;
        metode_bayar: string;
    };
    pengaju?: {
        nama: string;
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

interface Props {
    ringkasan: {
        pendapatan_pos: number;
        total_nominal_void_retur: number;
        jumlah_void_retur: number;
    };
    riwayatVoidRetur: PaginatedData<ReturVoidItem>;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function LaporanIndex({
    ringkasan,
    riwayatVoidRetur,
    filters,
}: Props) {
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/admin/laporan",
            {
                start_date: startDate,
                end_date: endDate,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        router.get("/admin/laporan", {}, { preserveState: true });
    };

    return (
        <AdminLayout title="Monitoring POS & Pembatalan" breadcrumb={[{ label: "Laporan" }, { label: "Monitoring POS" }]}>
            <Head title="Monitoring POS & Pembatalan - Bigi Badminton" />

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Laporan Penjualan POS & Pembatalan</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Ringkasan pendapatan kasir murni transaksi selesai dan daftar monitoring void/retur yang dicatat kasir.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                        <div>
                            <Label htmlFor="start_date" className="text-xs font-medium">Tanggal Mulai</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 text-xs w-40 mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="end_date" className="text-xs font-medium">Tanggal Selesai</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 text-xs w-40 mt-1"
                            />
                        </div>

                        <Button type="submit" variant="outline" className="h-10 text-xs font-medium">
                            Terapkan Periode
                        </Button>

                        {(startDate !== filters.start_date || endDate !== filters.end_date) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleReset}
                                className="h-10 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Reset
                            </Button>
                        )}
                    </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                        <span className="text-xs text-muted-foreground font-medium">Pendapatan Bersih POS (Selesai)</span>
                        <div className="text-xl font-bold text-foreground mt-1.5 tabular-nums">
                            {formatRupiah(ringkasan.pendapatan_pos)}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Mengecualikan seluruh transaksi void & retur.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                        <span className="text-xs text-muted-foreground font-medium">Total Nilai Void / Retur</span>
                        <div className="text-xl font-bold text-destructive mt-1.5 tabular-nums">
                            {formatRupiah(ringkasan.total_nominal_void_retur)}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Akumulasi nominal transaksi yang dibatalkan.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                        <span className="text-xs text-muted-foreground font-medium">Jumlah Kasus Dibatalkan</span>
                        <div className="text-xl font-bold text-foreground mt-1.5 tabular-nums">
                            {ringkasan.jumlah_void_retur} transaksi
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Frekuensi pembatalan transaksi oleh kasir.
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
                    <div className="border-b border-border pb-4 mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Daftar Monitoring Void & Retur</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Catatan pembatalan langsung oleh staf kasir (read-only).
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Total {riwayatVoidRetur.total} entri
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">Nomor Transaksi</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Kasir</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Jenis</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Alasan Pembatalan</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Total Nilai</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Waktu Catat</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {riwayatVoidRetur.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                                            Tidak ada data void atau retur pada periode yang dipilih.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    riwayatVoidRetur.data.map((item) => (
                                        <TableRow key={item.id_retur}>
                                            <TableCell className="text-xs font-mono font-medium whitespace-nowrap">
                                                {item.transaksi_pos?.no_transaksi || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                                                {item.pengaju?.nama || "-"}
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">
                                                <Badge
                                                    variant={item.jenis === "void" ? "danger" : "warning"}
                                                    className="text-[11px] py-0 px-2 uppercase font-mono"
                                                >
                                                    {item.jenis}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-foreground max-w-[260px] truncate">
                                                {item.alasan}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap">
                                                {formatRupiah(item.transaksi_pos?.total || 0)}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {formatTanggal(item.tanggal)} {formatJam(item.tanggal.substring(11, 16))}
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">
                                                <Badge variant="neutral" className="text-[11px] py-0 px-2">
                                                    Dicatat kasir
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {riwayatVoidRetur.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
                            <span className="text-muted-foreground">
                                Halaman {riwayatVoidRetur.current_page} dari {riwayatVoidRetur.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!riwayatVoidRetur.prev_page_url}
                                    onClick={() => riwayatVoidRetur.prev_page_url && router.get(riwayatVoidRetur.prev_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!riwayatVoidRetur.next_page_url}
                                    onClick={() => riwayatVoidRetur.next_page_url && router.get(riwayatVoidRetur.next_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
