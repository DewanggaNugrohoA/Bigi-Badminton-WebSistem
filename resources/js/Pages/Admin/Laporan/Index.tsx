import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

interface PosHarianItem {
    tgl: string;
    total_transaksi: number;
    tunai: number;
    qris: number;
    total: number;
}

interface ShiftItem {
    id_shift: number;
    id_user: number;
    waktu_buka: string;
    waktu_tutup: string | null;
    modal_awal: number;
    kas_sistem: number | null;
    kas_fisik: number | null;
    selisih: number | null;
    status: "terbuka" | "ditutup";
    user?: {
        nama: string;
    };
}

interface RestockItem {
    id_restock: number;
    tanggal: string;
    jumlah: number;
    keterangan: string | null;
    produk?: {
        nama_produk: string;
    };
    user?: {
        nama: string;
    };
}

interface OpnameItem {
    id_opname: number;
    tanggal: string;
    stok_sistem: number;
    stok_fisik: number;
    selisih: number;
    keterangan: string | null;
    produk?: {
        nama_produk: string;
    };
    user?: {
        nama: string;
    };
}

interface ProdukMenipisItem {
    id_produk: number;
    nama_produk: string;
    kategori: string;
    stok: number;
    stok_minimum: number;
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
        pos_tunai: number;
        pos_qris: number;
        pendapatan_sewa_lapangan: number;
        dp_reservasi_batal: number;
        sisa_tagihan_belum_lunas: number;
        total_nominal_void_retur: number;
        jumlah_void_retur: number;
        total_selisih_kas_shift: number;
        pembayaran_sewa_breakdown: {
            transfer: number;
            tunai: number;
            qris: number;
            dp: number;
            lunas: number;
        };
    };
    posHarian: PaginatedData<PosHarianItem>;
    rekapShift: PaginatedData<ShiftItem>;
    riwayatVoidRetur: PaginatedData<ReturVoidItem>;
    riwayatRestock: PaginatedData<RestockItem>;
    riwayatOpname: PaginatedData<OpnameItem>;
    stokMenipis: ProdukMenipisItem[];
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function LaporanIndex({
    ringkasan,
    posHarian,
    rekapShift,
    riwayatVoidRetur,
    riwayatRestock,
    riwayatOpname,
    stokMenipis,
    filters,
}: Props) {
    const { auth } = usePage<{ auth: { user: { nama: string } } }>().props;
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [dateError, setDateError] = useState("");

    const totalPendapatan = (ringkasan?.pendapatan_pos || 0) + (ringkasan?.pendapatan_sewa_lapangan || 0);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        setDateError("");

        if (startDate && endDate && endDate < startDate) {
            setDateError("Tanggal akhir harus sama dengan atau setelah tanggal awal.");
            return;
        }

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
        setDateError("");
        setStartDate("");
        setEndDate("");
        router.get("/admin/laporan", {}, { preserveState: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const printTimestamp = new Intl.DateTimeFormat("id-ID", {
        dateStyle: "full",
        timeStyle: "medium",
    }).format(new Date());

    return (
        <AdminLayout
            title="Laporan Eksekutif"
            breadcrumb={[{ label: "Laporan" }, { label: "Keuangan" }]}
        >
            <Head title="Laporan - Bigi Badminton" />

            <div className="hidden print:block mb-6 border-b border-border pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Bigi Badminton - Laporan Eksekutif
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Periode: {formatTanggal(filters.start_date)} s.d. {formatTanggal(filters.end_date)}
                        </p>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                        <p>Dicetak oleh: {auth?.user?.nama || "Admin"}</p>
                        <p>Waktu cetak: {printTimestamp}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 max-w-6xl">
                <div className="print:hidden flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-foreground">
                                Laporan Operasional & Keuangan
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Konsolidasi penerimaan POS kasir, pembayaran sewa lapangan, rekap shift, dan logistik stok.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <a
                                href={`/admin/laporan/ekspor?start_date=${encodeURIComponent(filters.start_date || "")}&end_date=${encodeURIComponent(filters.end_date || "")}`}
                                className="inline-flex items-center justify-center border border-border bg-transparent text-foreground hover:bg-secondary/40 h-9 px-3 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                                aria-label="Unduh Laporan Format Excel"
                            >
                                Unduh Excel
                            </a>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrint}
                                className="h-9 px-3 text-xs font-medium cursor-pointer"
                                aria-label="Cetak Laporan Halaman Ini"
                            >
                                Cetak Laporan
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 pt-1">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="start_date" className="text-xs font-medium text-muted-foreground">
                                Tanggal Mulai
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 text-xs w-36 sm:w-40"
                                aria-label="Pilih tanggal mulai laporan"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="end_date" className="text-xs font-medium text-muted-foreground">
                                Tanggal Selesai
                            </Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 text-xs w-36 sm:w-40"
                                aria-label="Pilih tanggal selesai laporan"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="default"
                            className="h-10 text-xs font-medium cursor-pointer"
                        >
                            Terapkan Periode
                        </Button>

                        {(startDate !== filters.start_date || endDate !== filters.end_date) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleReset}
                                className="h-10 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Reset
                            </Button>
                        )}
                    </form>

                    {dateError && (
                        <p className="text-xs text-rose-500 font-medium">{dateError}</p>
                    )}
                </div>

                <Tabs defaultValue="keuangan" className="w-full">
                    <TabsList className="print:hidden w-full sm:w-auto self-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-4">
                        <TabsTrigger
                            value="keuangan"
                            className="cursor-pointer px-1 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent shadow-none"
                        >
                            Keuangan
                        </TabsTrigger>
                        <TabsTrigger
                            value="pemain"
                            className="cursor-pointer px-1 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent shadow-none"
                        >
                            Pemain
                        </TabsTrigger>
                        <TabsTrigger
                            value="lapangan"
                            className="cursor-pointer px-1 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent shadow-none"
                        >
                            Lapangan
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pemain" className="pt-6">
                        <div className="py-12 text-center border-t border-border">
                            <p className="text-xs text-muted-foreground">Segera hadir</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="lapangan" className="pt-6">
                        <div className="py-12 text-center border-t border-border">
                            <p className="text-xs text-muted-foreground">Segera hadir</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="keuangan" className="space-y-10 pt-4">
                        <div className="border border-border p-5 sm:p-6 bg-card">
                            <div className="border-b border-border pb-3 mb-4">
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Ringkasan Keuangan
                                </h2>
                            </div>

                            <div className="space-y-6 text-xs">
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-1 mb-2 border-b border-border/40">
                                        Pendapatan
                                    </div>
                                    <div className="divide-y divide-border/40">
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground">Pendapatan POS</span>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {formatRupiah(ringkasan.pendapatan_pos)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center pl-4 text-muted-foreground">
                                            <span>Tunai</span>
                                            <span className="tabular-nums">
                                                {formatRupiah(ringkasan.pos_tunai)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center pl-4 text-muted-foreground">
                                            <span>QRIS</span>
                                            <span className="tabular-nums">
                                                {formatRupiah(ringkasan.pos_qris)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 items-center pt-3">
                                            <span className="text-foreground">Pendapatan Sewa Lapangan</span>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {formatRupiah(ringkasan.pendapatan_sewa_lapangan)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center pl-4 text-muted-foreground">
                                            <span>DP</span>
                                            <span className="tabular-nums">
                                                {formatRupiah(ringkasan.pembayaran_sewa_breakdown?.dp || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center pl-4 text-muted-foreground">
                                            <span>Lunas</span>
                                            <span className="tabular-nums">
                                                {formatRupiah(ringkasan.pembayaran_sewa_breakdown?.lunas || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-3 items-center border-t-2 border-foreground/30 mt-2 font-semibold">
                                            <span className="text-foreground text-sm">Total Pendapatan (POS + Sewa)</span>
                                            <span className="tabular-nums text-sm text-foreground">
                                                {formatRupiah(totalPendapatan)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-1 mb-2 border-b border-border/40">
                                        Koreksi Kas
                                    </div>
                                    <div className="divide-y divide-border/40">
                                        <div className="flex justify-between py-2 items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-foreground">Total Nilai Void / Retur</span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    ({ringkasan.jumlah_void_retur} kasus)
                                                </span>
                                            </div>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {formatRupiah(ringkasan.total_nominal_void_retur)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground">Total Selisih Kas Shift</span>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {formatRupiah(ringkasan.total_selisih_kas_shift)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-1 mb-2 border-b border-border/40">
                                        Di Luar Total Pendapatan
                                    </div>
                                    <div className="divide-y divide-border/40">
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground">Piutang Sewa (Belum Lunas)</span>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {formatRupiah(ringkasan.sisa_tagihan_belum_lunas)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground">DP Reservasi Batal</span>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {formatRupiah(ringkasan.dp_reservasi_batal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-3 border-t border-border">
                                <p className="text-[11px] text-muted-foreground">
                                    Catatan: Piutang sewa belum lunas dan DP reservasi batal tidak termasuk ke dalam kalkulasi total pendapatan.
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Rincian Metode Pembayaran Sewa Lapangan
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border border-border bg-card">
                                <div className="p-4">
                                    <div className="text-[11px] text-muted-foreground">Transfer Bank</div>
                                    <div className="text-sm font-semibold text-foreground mt-1 tabular-nums">
                                        {formatRupiah(ringkasan.pembayaran_sewa_breakdown?.transfer || 0)}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="text-[11px] text-muted-foreground">Tunai</div>
                                    <div className="text-sm font-semibold text-foreground mt-1 tabular-nums">
                                        {formatRupiah(ringkasan.pembayaran_sewa_breakdown?.tunai || 0)}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="text-[11px] text-muted-foreground">QRIS</div>
                                    <div className="text-sm font-semibold text-foreground mt-1 tabular-nums">
                                        {formatRupiah(ringkasan.pembayaran_sewa_breakdown?.qris || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Pendapatan POS per Hari
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {posHarian.total} entri
                                </span>
                            </div>

                            <div className="overflow-x-auto max-w-full border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-muted/30">
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Tanggal</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Jumlah Transaksi</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Tunai</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">QRIS</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Total Pendapatan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {posHarian.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                                                    Tidak ada data penjualan POS pada periode ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            posHarian.data.map((item) => (
                                                <TableRow key={item.tgl} className="border-b border-border/60">
                                                    <TableCell className="text-xs whitespace-nowrap font-medium text-foreground">
                                                        {formatTanggal(item.tgl)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-center tabular-nums text-foreground">
                                                        {item.total_transaksi}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                        {formatRupiah(item.tunai)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                        {formatRupiah(item.qris)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right font-semibold text-foreground tabular-nums">
                                                        {formatRupiah(item.total)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {posHarian.last_page > 1 && (
                                <div className="print:hidden flex items-center justify-between pt-2 text-xs">
                                    <span className="text-muted-foreground text-[11px]">
                                        Halaman {posHarian.current_page} dari {posHarian.last_page}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!posHarian.prev_page_url}
                                            onClick={() => posHarian.prev_page_url && router.get(posHarian.prev_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!posHarian.next_page_url}
                                            onClick={() => posHarian.next_page_url && router.get(posHarian.next_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Rekapitulasi Shift Kasir & Selisih Kas
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {rekapShift.total} shift
                                </span>
                            </div>

                            <div className="overflow-x-auto max-w-full border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-muted/30">
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Kasir</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Waktu Buka</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Waktu Tutup</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Modal Awal</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Kas Sistem</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Kas Hitung</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Selisih</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rekapShift.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                                                    Tidak ada data shift kasir pada periode ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rekapShift.data.map((shift) => {
                                                const selisih = shift.selisih ?? 0;
                                                let badgeVariant: "danger" | "warning" | "success" = "success";
                                                let badgeLabel = "Pas";

                                                if (selisih < 0) {
                                                    badgeVariant = "danger";
                                                    badgeLabel = `Kurang (${formatRupiah(Math.abs(selisih))})`;
                                                } else if (selisih > 0) {
                                                    badgeVariant = "warning";
                                                    badgeLabel = `Lebih (+${formatRupiah(selisih)})`;
                                                }

                                                return (
                                                    <TableRow key={shift.id_shift} className="border-b border-border/60">
                                                        <TableCell className="text-xs font-medium whitespace-nowrap text-foreground">
                                                            {shift.user?.nama || "Kasir"}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap text-foreground">
                                                            {formatTanggal(shift.waktu_buka)} {formatJam(shift.waktu_buka.substring(11, 16))}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap text-foreground">
                                                            {shift.waktu_tutup
                                                                ? `${formatTanggal(shift.waktu_tutup)} ${formatJam(shift.waktu_tutup.substring(11, 16))}`
                                                                : "Masih Terbuka"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                            {formatRupiah(shift.modal_awal)}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                            {shift.kas_sistem !== null ? formatRupiah(shift.kas_sistem) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground">
                                                            {shift.kas_fisik !== null ? formatRupiah(shift.kas_fisik) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-center whitespace-nowrap">
                                                            {shift.status === "ditutup" ? (
                                                                <Badge variant={badgeVariant} className="text-[11px] py-0 px-2 font-mono">
                                                                    {badgeLabel}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center whitespace-nowrap">
                                                            <Badge
                                                                variant={shift.status === "ditutup" ? "neutral" : "info"}
                                                                className="text-[11px] py-0 px-2 uppercase"
                                                            >
                                                                {shift.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {rekapShift.last_page > 1 && (
                                <div className="print:hidden flex items-center justify-between pt-2 text-xs">
                                    <span className="text-muted-foreground text-[11px]">
                                        Halaman {rekapShift.current_page} dari {rekapShift.last_page}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!rekapShift.prev_page_url}
                                            onClick={() => rekapShift.prev_page_url && router.get(rekapShift.prev_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!rekapShift.next_page_url}
                                            onClick={() => rekapShift.next_page_url && router.get(rekapShift.next_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Monitoring Void & Retur
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {riwayatVoidRetur.total} entri
                                </span>
                            </div>

                            <div className="overflow-x-auto max-w-full border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-muted/30">
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Nomor Transaksi</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Kasir</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Jenis</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Alasan</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Total Nilai</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Waktu Catat</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {riwayatVoidRetur.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                                                    Tidak ada data void atau retur pada periode ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            riwayatVoidRetur.data.map((item) => (
                                                <TableRow key={item.id_retur} className="border-b border-border/60">
                                                    <TableCell className="text-xs font-mono font-medium whitespace-nowrap text-foreground">
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
                                                    <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap text-foreground">
                                                        {formatRupiah(item.transaksi_pos?.total || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap text-foreground">
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
                                <div className="print:hidden flex items-center justify-between pt-2 text-xs">
                                    <span className="text-muted-foreground text-[11px]">
                                        Halaman {riwayatVoidRetur.current_page} dari {riwayatVoidRetur.last_page}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!riwayatVoidRetur.prev_page_url}
                                            onClick={() => riwayatVoidRetur.prev_page_url && router.get(riwayatVoidRetur.prev_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!riwayatVoidRetur.next_page_url}
                                            onClick={() => riwayatVoidRetur.next_page_url && router.get(riwayatVoidRetur.next_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Riwayat Restock Barang
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {riwayatRestock.total} log
                                    </span>
                                </div>

                                <div className="overflow-x-auto max-w-full border border-border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-border bg-muted/30">
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Tanggal</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Produk</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Jumlah</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Kasir</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Keterangan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {riwayatRestock.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                                                        Tidak ada data restock pada periode ini.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                riwayatRestock.data.map((item) => (
                                                    <TableRow key={item.id_restock} className="border-b border-border/60">
                                                        <TableCell className="text-xs whitespace-nowrap text-foreground">
                                                            {formatTanggal(item.tanggal)}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-medium whitespace-nowrap text-foreground">
                                                            {item.produk?.nama_produk || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground">
                                                            +{item.jumlah}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap text-foreground">
                                                            {item.user?.nama || "Kasir"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                                                            {item.keterangan || "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {riwayatRestock.last_page > 1 && (
                                    <div className="print:hidden flex items-center justify-between pt-2 text-xs">
                                        <span className="text-muted-foreground text-[11px]">
                                            Halaman {riwayatRestock.current_page} dari {riwayatRestock.last_page}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!riwayatRestock.prev_page_url}
                                                onClick={() => riwayatRestock.prev_page_url && router.get(riwayatRestock.prev_page_url)}
                                                className="h-7 px-2 text-xs cursor-pointer"
                                            >
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!riwayatRestock.next_page_url}
                                                onClick={() => riwayatRestock.next_page_url && router.get(riwayatRestock.next_page_url)}
                                                className="h-7 px-2 text-xs cursor-pointer"
                                            >
                                                Berikutnya
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Riwayat Stok Opname
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {riwayatOpname.total} log
                                    </span>
                                </div>

                                <div className="overflow-x-auto max-w-full border border-border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-border bg-muted/30">
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Tanggal</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Produk</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Sistem</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Fisik</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Selisih</TableHead>
                                                <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Kasir</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {riwayatOpname.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                                                        Tidak ada data stok opname pada periode ini.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                riwayatOpname.data.map((item) => (
                                                    <TableRow key={item.id_opname} className="border-b border-border/60">
                                                        <TableCell className="text-xs whitespace-nowrap text-foreground">
                                                            {formatTanggal(item.tanggal)}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-medium whitespace-nowrap text-foreground">
                                                            {item.produk?.nama_produk || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                            {item.stok_sistem}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground">
                                                            {item.stok_fisik}
                                                        </TableCell>
                                                        <TableCell className="text-center whitespace-nowrap">
                                                            <Badge
                                                                variant={item.selisih === 0 ? "success" : item.selisih < 0 ? "danger" : "warning"}
                                                                className="text-[11px] py-0 px-2 font-mono"
                                                            >
                                                                {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap text-foreground">
                                                            {item.user?.nama || "Kasir"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {riwayatOpname.last_page > 1 && (
                                    <div className="print:hidden flex items-center justify-between pt-2 text-xs">
                                        <span className="text-muted-foreground text-[11px]">
                                            Halaman {riwayatOpname.current_page} dari {riwayatOpname.last_page}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!riwayatOpname.prev_page_url}
                                                onClick={() => riwayatOpname.prev_page_url && router.get(riwayatOpname.prev_page_url)}
                                                className="h-7 px-2 text-xs cursor-pointer"
                                            >
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!riwayatOpname.next_page_url}
                                                onClick={() => riwayatOpname.next_page_url && router.get(riwayatOpname.next_page_url)}
                                                className="h-7 px-2 text-xs cursor-pointer"
                                            >
                                                Berikutnya
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Peringatan Stok Produk Menipis
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {stokMenipis.length} produk butuh restock
                                </span>
                            </div>

                            <div className="overflow-x-auto max-w-full border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-muted/30">
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Nama Produk</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Kategori</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Stok Saat Ini</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Batas Minimum</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stokMenipis.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                                                    Semua stok produk berada di atas batas minimum.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            stokMenipis.map((item) => (
                                                <TableRow key={item.id_produk} className="border-b border-border/60">
                                                    <TableCell className="text-xs font-medium whitespace-nowrap text-foreground">
                                                        {item.nama_produk}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {item.kategori}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground">
                                                        {item.stok}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">
                                                        {item.stok_minimum}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap">
                                                        <Badge
                                                            variant={item.stok === 0 ? "danger" : "warning"}
                                                            className="text-[11px] py-0 px-2"
                                                        >
                                                            {item.stok === 0 ? "Habis" : "Menipis"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
