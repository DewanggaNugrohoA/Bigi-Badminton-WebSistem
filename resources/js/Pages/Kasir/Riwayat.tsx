import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Printer } from "lucide-react";

interface TransaksiItem {
    id_transaksi: number;
    no_transaksi: string;
    tanggal: string;
    subtotal: number;
    diskon: number;
    total: number;
    metode_bayar: "tunai" | "qris";
    status_transaksi: "selesai" | "void" | "retur";
    detail_transaksi_pos_count: number;
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
    transaksi: PaginatedData<TransaksiItem>;
    tanggalFilter: string;
}

export default function RiwayatIndex({ transaksi, tanggalFilter }: Props) {
    const [tanggal, setTanggal] = useState(tanggalFilter || "");

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get("/kasir/riwayat", { tanggal }, { preserveState: true });
    };

    const handleReset = () => {
        setTanggal("");
        router.get("/kasir/riwayat", {}, { preserveState: true });
    };

    return (
        <KasirLayout title="Riwayat Penjualan">
            <Head title="Riwayat Penjualan - Bigi Badminton" />

            <div className="flex flex-col gap-6">
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="tanggal" className="text-xs font-medium text-foreground">
                                Filter Tanggal
                            </label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="h-10 text-xs w-44"
                            />
                        </div>

                        <Button type="submit" variant="outline" className="h-10 text-xs font-medium">
                            Terapkan
                        </Button>

                        {tanggal && (
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

                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="border-b border-border pb-4 mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Daftar Transaksi Saya</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Riwayat transaksi penjualan yang ditangani oleh akun kasir Anda.
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Total {transaksi.total} transaksi
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">Nomor Transaksi</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Waktu</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Jumlah Item</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Total</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Metode</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Status</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transaksi.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                                            Tidak ada riwayat transaksi pada tanggal ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transaksi.data.map((item) => (
                                        <TableRow key={item.id_transaksi}>
                                            <TableCell className="text-xs font-mono font-medium whitespace-nowrap">
                                                {item.no_transaksi}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {formatTanggal(item.tanggal)} {formatJam(item.tanggal.substring(11, 16))}
                                            </TableCell>
                                            <TableCell className="text-xs text-center tabular-nums whitespace-nowrap">
                                                {item.detail_transaksi_pos_count}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap">
                                                {formatRupiah(item.total)}
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">
                                                <Badge variant="neutral" className="text-[11px] py-0 px-2 uppercase font-mono">
                                                    {item.metode_bayar}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">
                                                <Badge
                                                    variant={item.status_transaksi === "selesai" ? "success" : "danger"}
                                                    className="text-[11px] py-0 px-2"
                                                >
                                                    {item.status_transaksi}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <Link href={`/kasir/struk/${item.id_transaksi}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                                        aria-label={`Lihat struk ${item.no_transaksi}`}
                                                    >
                                                        <Printer className="size-3.5 mr-1" />
                                                        Struk
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {transaksi.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
                            <span className="text-muted-foreground">
                                Halaman {transaksi.current_page} dari {transaksi.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                {transaksi.prev_page_url ? (
                                    <Link href={transaksi.prev_page_url}>
                                        <Button variant="outline" size="sm" className="h-8 text-xs">
                                            Sebelumnya
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 text-xs">
                                        Sebelumnya
                                    </Button>
                                )}
                                {transaksi.next_page_url ? (
                                    <Link href={transaksi.next_page_url}>
                                        <Button variant="outline" size="sm" className="h-8 text-xs">
                                            Berikutnya
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 text-xs">
                                        Berikutnya
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </KasirLayout>
    );
}
