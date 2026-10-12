import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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

interface PemainItem {
    key: string;
    id_user: number | null;
    nama: string;
    no_whatsapp: string | null;
    norm_wa: string;
    jenis_label: "Member" | "Reguler" | "Tanpa akun";
    sisa_sesi_paket: number | null;
    kunjungan_periode: number;
    open_mabar_dibuat: number;
    open_mabar_diikuti: number;
    kunjungan_terakhir: string | null;
    is_walkin: boolean;
}

interface RingkasanPemain {
    pemain_terdaftar_aktif: number;
    member_aktif: number;
    pemain_berkunjung_periode: number;
    total_kunjungan: number;
    total_sesi_paket_terpakai: number;
    jumlah_open_mabar: number;
}

interface RingkasanLapanganItem {
    id_lapangan: number;
    nama_lapangan: string;
    status_lapangan: string;
    tanggal_terakhir: string | null;
    diperiksa_oleh: string | null;
    komponen_tidak_baik: Array<{
        komponen: string;
        key: string;
        kondisi: string;
        kondisi_label: string;
    }>;
    pemeriksaan_terakhir: {
        id: number;
        tanggal_pemeriksaan: string;
        karpet_vinil: string;
        net: string;
        tiang: string;
        lampu: string;
        lantai: string;
        dinding: string;
        catatan: string | null;
    } | null;
}

interface RiwayatLapanganItem {
    id: number;
    id_lapangan: number;
    tanggal_pemeriksaan: string;
    diperiksa_oleh: number;
    karpet_vinil: string;
    net: string;
    tiang: string;
    lampu: string;
    lantai: string;
    dinding: string;
    catatan: string | null;
    lapangan?: {
        id_lapangan: number;
        nama_lapangan: string;
    };
    pemeriksa?: {
        id_user: number;
        nama: string;
    };
}

interface MasterLapanganItem {
    id_lapangan: number;
    nama_lapangan: string;
    status_lapangan: string;
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
    ringkasanPemain?: RingkasanPemain;
    daftarPemain?: PaginatedData<PemainItem>;
    ringkasanLapangan?: RingkasanLapanganItem[];
    riwayatLapangan?: PaginatedData<RiwayatLapanganItem>;
    masterLapangan?: MasterLapanganItem[];
    posHarian: PaginatedData<PosHarianItem>;
    rekapShift: PaginatedData<ShiftItem>;
    riwayatVoidRetur: PaginatedData<ReturVoidItem>;
    riwayatRestock: PaginatedData<RestockItem>;
    riwayatOpname: PaginatedData<OpnameItem>;
    stokMenipis: ProdukMenipisItem[];
    filters: {
        start_date: string;
        end_date: string;
        search_pemain?: string;
        id_lapangan?: string;
    };
}

export default function LaporanIndex({
    ringkasan,
    ringkasanPemain,
    daftarPemain,
    ringkasanLapangan = [],
    riwayatLapangan,
    masterLapangan = [],
    posHarian,
    rekapShift,
    riwayatVoidRetur,
    riwayatRestock,
    riwayatOpname,
    stokMenipis,
    filters,
}: Props) {
    const { auth } = usePage<{ auth: { user: { nama: string; role: string } } }>().props;
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [searchPemain, setSearchPemain] = useState(filters.search_pemain || "");
    const [filterLapangan, setFilterLapangan] = useState(filters.id_lapangan || "");
    const [dateError, setDateError] = useState("");

    // Form input pemeriksaan lapangan
    const todayStr = new Date().toISOString().split("T")[0];
    const [formLapanganId, setFormLapanganId] = useState<string>(
        masterLapangan.length > 0 ? String(masterLapangan[0].id_lapangan) : ""
    );
    const [formTanggal, setFormTanggal] = useState<string>(todayStr);
    const [formKarpet, setFormKarpet] = useState<string>("baik");
    const [formNet, setFormNet] = useState<string>("baik");
    const [formTiang, setFormTiang] = useState<string>("baik");
    const [formLampu, setFormLampu] = useState<string>("baik");
    const [formLantai, setFormLantai] = useState<string>("baik");
    const [formDinding, setFormDinding] = useState<string>("baik");
    const [formCatatan, setFormCatatan] = useState<string>("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
                search_pemain: searchPemain || undefined,
                id_lapangan: filterLapangan || undefined,
            },
            { preserveState: true }
        );
    };

    const handleSearchPemainSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/admin/laporan",
            {
                start_date: startDate,
                end_date: endDate,
                search_pemain: searchPemain || undefined,
                id_lapangan: filterLapangan || undefined,
            },
            { preserveState: true }
        );
    };

    const handleFilterLapanganChange = (val: string) => {
        setFilterLapangan(val);
        router.get(
            "/admin/laporan",
            {
                start_date: startDate,
                end_date: endDate,
                search_pemain: searchPemain || undefined,
                id_lapangan: val || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setDateError("");
        setStartDate("");
        setEndDate("");
        setSearchPemain("");
        setFilterLapangan("");
        router.get("/admin/laporan", {}, { preserveState: true });
    };

    const handleSubmitPemeriksaan = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        if (!formLapanganId) {
            setFormErrors((prev) => ({ ...prev, id_lapangan: "Lapangan wajib dipilih." }));
            return;
        }

        if (!formTanggal) {
            setFormErrors((prev) => ({ ...prev, tanggal_pemeriksaan: "Tanggal pemeriksaan wajib diisi." }));
            return;
        }

        setIsSubmitting(true);
        router.post(
            "/admin/laporan/pemeriksaan-lapangan",
            {
                id_lapangan: formLapanganId,
                tanggal_pemeriksaan: formTanggal,
                karpet_vinil: formKarpet,
                net: formNet,
                tiang: formTiang,
                lampu: formLampu,
                lantai: formLantai,
                dinding: formDinding,
                catatan: formCatatan || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Catatan pemeriksaan kondisi lapangan berhasil disimpan.");
                    setFormCatatan("");
                    setFormKarpet("baik");
                    setFormNet("baik");
                    setFormTiang("baik");
                    setFormLampu("baik");
                    setFormLantai("baik");
                    setFormDinding("baik");
                    setFormErrors({});
                },
                onError: (errs) => {
                    setFormErrors(errs);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
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
                                href={`/admin/laporan/ekspor?start_date=${encodeURIComponent(filters.start_date || "")}&end_date=${encodeURIComponent(filters.end_date || "")}${filterLapangan ? `&id_lapangan=${encodeURIComponent(filterLapangan)}` : ""}`}
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

                    <TabsContent value="pemain" className="space-y-10 pt-4">
                        <div className="border border-border p-5 sm:p-6 bg-card">
                            <div className="border-b border-border pb-3 mb-4">
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Ringkasan Aktivitas Pemain
                                </h2>
                            </div>

                            <div className="space-y-3 text-xs divide-y divide-border/40">
                                <div className="flex justify-between py-2 items-center">
                                    <span className="text-foreground">Jumlah Pemain Terdaftar Aktif</span>
                                    <span className="tabular-nums font-medium text-foreground">
                                        {ringkasanPemain?.pemain_terdaftar_aktif ?? 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                    <span className="text-foreground">Member Aktif</span>
                                    <span className="tabular-nums font-medium text-foreground">
                                        {ringkasanPemain?.member_aktif ?? 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                    <span className="text-foreground">Pemain yang Berkunjung pada Periode</span>
                                    <span className="tabular-nums font-medium text-foreground">
                                        {ringkasanPemain?.pemain_berkunjung_periode ?? 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                    <span className="text-foreground">Total Kunjungan</span>
                                    <span className="tabular-nums font-medium text-foreground">
                                        {ringkasanPemain?.total_kunjungan ?? 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                    <span className="text-foreground">Total Sesi Paket Terpakai pada Periode</span>
                                    <span className="tabular-nums font-medium text-foreground">
                                        {ringkasanPemain?.total_sesi_paket_terpakai ?? 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                    <span className="text-foreground">Jumlah Open Mabar pada Periode</span>
                                    <span className="tabular-nums font-medium text-foreground">
                                        {ringkasanPemain?.jumlah_open_mabar ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Daftar Kunjungan & Aktivitas Pemain
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {daftarPemain?.total ?? 0} entri terdaftar & walk-in
                                    </span>
                                </div>

                                <form onSubmit={handleSearchPemainSubmit} className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Cari nama atau nomor..."
                                        value={searchPemain}
                                        onChange={(e) => setSearchPemain(e.target.value)}
                                        className="h-10 text-xs w-48 sm:w-64"
                                        aria-label="Pencarian nama atau nomor WhatsApp pemain"
                                    />
                                    <Button
                                        type="submit"
                                        variant="default"
                                        className="h-10 text-xs font-medium cursor-pointer"
                                    >
                                        Cari
                                    </Button>
                                    {filters.search_pemain && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setSearchPemain("");
                                                router.get(
                                                    "/admin/laporan",
                                                    {
                                                        start_date: startDate,
                                                        end_date: endDate,
                                                    },
                                                    { preserveState: true }
                                                );
                                            }}
                                            className="h-10 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </form>
                            </div>

                            <div className="overflow-x-auto max-w-full border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-muted/30">
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">Nama</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold">WhatsApp</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Jenis</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Sisa Sesi Paket</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Kunjungan</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Mabar Dibuat</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-right">Mabar Diikuti</TableHead>
                                            <TableHead className="whitespace-nowrap text-xs text-muted-foreground font-semibold text-center">Kunjungan Terakhir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!daftarPemain || daftarPemain.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                                                    Tidak ada data pemain pada periode ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            daftarPemain.data.map((item) => (
                                                <TableRow key={item.key} className="border-b border-border/60">
                                                    <TableCell className="text-xs whitespace-nowrap font-medium text-foreground">
                                                        {item.nama}
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap tabular-nums text-foreground">
                                                        {item.no_whatsapp ? item.no_whatsapp : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap text-xs">
                                                        {item.jenis_label === "Member" ? (
                                                            <span className="font-medium text-foreground">
                                                                Member
                                                            </span>
                                                        ) : item.jenis_label === "Reguler" ? (
                                                            <span className="text-muted-foreground">
                                                                Reguler
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground/80">
                                                                Tanpa akun
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                        {item.sisa_sesi_paket !== null ? item.sisa_sesi_paket : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground">
                                                        {item.kunjungan_periode}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                        {item.open_mabar_dibuat}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground">
                                                        {item.open_mabar_diikuti}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-center whitespace-nowrap text-foreground">
                                                        {item.kunjungan_terakhir ? formatTanggal(item.kunjungan_terakhir) : "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {daftarPemain && daftarPemain.last_page > 1 && (
                                <div className="print:hidden flex items-center justify-between pt-2 text-xs">
                                    <span className="text-muted-foreground text-[11px]">
                                        Halaman {daftarPemain.current_page} dari {daftarPemain.last_page}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!daftarPemain.prev_page_url}
                                            onClick={() => daftarPemain.prev_page_url && router.get(daftarPemain.prev_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!daftarPemain.next_page_url}
                                            onClick={() => daftarPemain.next_page_url && router.get(daftarPemain.next_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="lapangan" className="space-y-10 pt-4">
                        {/* 1. Ringkasan Kondisi Terakhir Lapangan */}
                        <div className="border border-border p-5 sm:p-6 bg-card rounded-md">
                            <div className="border-b border-border pb-3 mb-4">
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Ringkasan Kondisi Terakhir Lapangan
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Lapangan</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Status</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Pemeriksaan Terakhir</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Komponen Perlu Perhatian</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Pemeriksa</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ringkasanLapangan.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                                                    Belum ada data lapangan.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            ringkasanLapangan.map((item) => (
                                                <TableRow key={item.id_lapangan} className="border-border text-xs">
                                                    <TableCell className="font-medium text-foreground">
                                                        {item.nama_lapangan}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground capitalize">
                                                        {item.status_lapangan}
                                                    </TableCell>
                                                    <TableCell className="tabular-nums text-muted-foreground">
                                                        {item.tanggal_terakhir ? formatTanggal(item.tanggal_terakhir) : "Belum diperiksa"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.komponen_tidak_baik.length === 0 ? (
                                                            <span className="text-muted-foreground">Semua kondisi baik</span>
                                                        ) : (
                                                            <span className="text-destructive font-medium">
                                                                {item.komponen_tidak_baik
                                                                    .map((k) => `${k.komponen} (${k.kondisi_label})`)
                                                                    .join(", ")}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.diperiksa_oleh || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* 2. Form Input Pemeriksaan Rutin */}
                        <div className="border border-border p-5 sm:p-6 bg-card rounded-md">
                            <div className="border-b border-border pb-3 mb-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Catat Pemeriksaan Kondisi Lapangan
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Formulir pencatatan riwayat kondisi fisik lapangan. Catatan ini murni riwayat dan tidak mengubah status lapangan secara otomatis.
                                </p>
                            </div>

                            <form onSubmit={handleSubmitPemeriksaan} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="lapangan_id" className="text-xs font-medium text-foreground">
                                            Pilih Lapangan <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            id="lapangan_id"
                                            value={formLapanganId}
                                            onChange={(e) => setFormLapanganId(e.target.value)}
                                            error={!!formErrors.id_lapangan}
                                            className="text-xs rounded-md"
                                        >
                                            <option value="">-- Pilih Lapangan --</option>
                                            {masterLapangan.map((lap) => (
                                                <option key={lap.id_lapangan} value={lap.id_lapangan}>
                                                    {lap.nama_lapangan} ({lap.status_lapangan})
                                                </option>
                                            ))}
                                        </Select>
                                        {formErrors.id_lapangan && (
                                            <p className="text-[11px] text-destructive">{formErrors.id_lapangan}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="tgl_periksa" className="text-xs font-medium text-foreground">
                                            Tanggal Pemeriksaan <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="tgl_periksa"
                                            type="date"
                                            max={todayStr}
                                            value={formTanggal}
                                            onChange={(e) => setFormTanggal(e.target.value)}
                                            className="h-9 text-xs rounded-md"
                                        />
                                        {formErrors.tanggal_pemeriksaan && (
                                            <p className="text-[11px] text-destructive">{formErrors.tanggal_pemeriksaan}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-border/50 pt-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                                        Kondisi Komponen
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="karpet_vinil" className="text-xs text-foreground">
                                                Karpet / Vinil <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                id="karpet_vinil"
                                                value={formKarpet}
                                                onChange={(e) => setFormKarpet(e.target.value)}
                                                className="text-xs rounded-md"
                                            >
                                                <option value="baik">Baik</option>
                                                <option value="rusak_ringan">Rusak Ringan</option>
                                                <option value="rusak_sedang">Rusak Sedang</option>
                                                <option value="rusak_berat">Rusak Berat</option>
                                            </Select>
                                            {formErrors.karpet_vinil && (
                                                <p className="text-[11px] text-destructive">{formErrors.karpet_vinil}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="net" className="text-xs text-foreground">
                                                Net <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                id="net"
                                                value={formNet}
                                                onChange={(e) => setFormNet(e.target.value)}
                                                className="text-xs rounded-md"
                                            >
                                                <option value="baik">Baik</option>
                                                <option value="rusak_ringan">Rusak Ringan</option>
                                                <option value="rusak_sedang">Rusak Sedang</option>
                                                <option value="rusak_berat">Rusak Berat</option>
                                            </Select>
                                            {formErrors.net && (
                                                <p className="text-[11px] text-destructive">{formErrors.net}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="tiang" className="text-xs text-foreground">
                                                Tiang <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                id="tiang"
                                                value={formTiang}
                                                onChange={(e) => setFormTiang(e.target.value)}
                                                className="text-xs rounded-md"
                                            >
                                                <option value="baik">Baik</option>
                                                <option value="rusak_ringan">Rusak Ringan</option>
                                                <option value="rusak_sedang">Rusak Sedang</option>
                                                <option value="rusak_berat">Rusak Berat</option>
                                            </Select>
                                            {formErrors.tiang && (
                                                <p className="text-[11px] text-destructive">{formErrors.tiang}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="lampu" className="text-xs text-foreground">
                                                Lampu <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                id="lampu"
                                                value={formLampu}
                                                onChange={(e) => setFormLampu(e.target.value)}
                                                className="text-xs rounded-md"
                                            >
                                                <option value="baik">Baik</option>
                                                <option value="rusak_ringan">Rusak Ringan</option>
                                                <option value="rusak_sedang">Rusak Sedang</option>
                                                <option value="rusak_berat">Rusak Berat</option>
                                            </Select>
                                            {formErrors.lampu && (
                                                <p className="text-[11px] text-destructive">{formErrors.lampu}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="lantai" className="text-xs text-foreground">
                                                Lantai <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                id="lantai"
                                                value={formLantai}
                                                onChange={(e) => setFormLantai(e.target.value)}
                                                className="text-xs rounded-md"
                                            >
                                                <option value="baik">Baik</option>
                                                <option value="rusak_ringan">Rusak Ringan</option>
                                                <option value="rusak_sedang">Rusak Sedang</option>
                                                <option value="rusak_berat">Rusak Berat</option>
                                            </Select>
                                            {formErrors.lantai && (
                                                <p className="text-[11px] text-destructive">{formErrors.lantai}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="dinding" className="text-xs text-foreground">
                                                Dinding <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                id="dinding"
                                                value={formDinding}
                                                onChange={(e) => setFormDinding(e.target.value)}
                                                className="text-xs rounded-md"
                                            >
                                                <option value="baik">Baik</option>
                                                <option value="rusak_ringan">Rusak Ringan</option>
                                                <option value="rusak_sedang">Rusak Sedang</option>
                                                <option value="rusak_berat">Rusak Berat</option>
                                            </Select>
                                            {formErrors.dinding && (
                                                <p className="text-[11px] text-destructive">{formErrors.dinding}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 pt-1">
                                    <Label htmlFor="catatan" className="text-xs text-foreground">
                                        Catatan Pemeriksaan (Opsional)
                                    </Label>
                                    <Textarea
                                        id="catatan"
                                        rows={3}
                                        value={formCatatan}
                                        onChange={(e) => setFormCatatan(e.target.value)}
                                        placeholder="Tuliskan catatan khusus terkait kerusakan, perbaikan yang dibutuhkan, dll."
                                        maxLength={1000}
                                        className="text-xs rounded-md"
                                    />
                                    {formErrors.catatan && (
                                        <p className="text-[11px] text-destructive">{formErrors.catatan}</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-9 px-4 text-xs font-medium cursor-pointer rounded-md"
                                    >
                                        {isSubmitting ? "Menyimpan..." : "Simpan Pemeriksaan"}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* 3. Tabel Riwayat Pemeriksaan */}
                        <div className="border border-border p-5 sm:p-6 bg-card rounded-md">
                            <div className="border-b border-border pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Riwayat Pemeriksaan Lapangan
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {riwayatLapangan?.total ?? 0} catatan pemeriksaan
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="filter_lapangan" className="text-xs text-muted-foreground shrink-0">
                                        Filter Lapangan:
                                    </Label>
                                    <Select
                                        id="filter_lapangan"
                                        value={filterLapangan}
                                        onChange={(e) => handleFilterLapanganChange(e.target.value)}
                                        className="h-8 text-xs w-44 rounded-md"
                                    >
                                        <option value="">Semua Lapangan</option>
                                        {masterLapangan.map((lap) => (
                                            <option key={lap.id_lapangan} value={lap.id_lapangan}>
                                                {lap.nama_lapangan}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Tanggal</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Lapangan</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Karpet/Vinil</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Net</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Tiang</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Lampu</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Lantai</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Dinding</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Catatan</TableHead>
                                            <TableHead className="text-xs font-semibold text-muted-foreground h-9">Pemeriksa</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!riwayatLapangan || riwayatLapangan.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-center py-6 text-xs text-muted-foreground">
                                                    Tidak ada riwayat pemeriksaan pada periode dan filter ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            riwayatLapangan.data.map((item) => {
                                                const renderKondisi = (val: string) => {
                                                    const labelMap: Record<string, string> = {
                                                        baik: "Baik",
                                                        rusak_ringan: "Rusak Ringan",
                                                        rusak_sedang: "Rusak Sedang",
                                                        rusak_berat: "Rusak Berat",
                                                    };
                                                    const label = labelMap[val] || val;
                                                    if (val === "baik") {
                                                        return <span className="text-muted-foreground">{label}</span>;
                                                    }
                                                    return <span className="text-destructive font-medium">{label}</span>;
                                                };

                                                return (
                                                    <TableRow key={item.id} className="border-border text-xs">
                                                        <TableCell className="tabular-nums text-foreground whitespace-nowrap">
                                                            {formatTanggal(item.tanggal_pemeriksaan)}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-foreground whitespace-nowrap">
                                                            {item.lapangan?.nama_lapangan ?? `Lapangan #${item.id_lapangan}`}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{renderKondisi(item.karpet_vinil)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{renderKondisi(item.net)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{renderKondisi(item.tiang)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{renderKondisi(item.lampu)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{renderKondisi(item.lantai)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{renderKondisi(item.dinding)}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.catatan || ""}>
                                                            {item.catatan || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                                            {item.pemeriksa?.nama ?? "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Paginasi Riwayat Lapangan */}
                            {riwayatLapangan && riwayatLapangan.last_page > 1 && (
                                <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Halaman {riwayatLapangan.current_page} dari {riwayatLapangan.last_page}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!riwayatLapangan.prev_page_url}
                                            onClick={() => riwayatLapangan.prev_page_url && router.get(riwayatLapangan.prev_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer rounded-md"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!riwayatLapangan.next_page_url}
                                            onClick={() => riwayatLapangan.next_page_url && router.get(riwayatLapangan.next_page_url)}
                                            className="h-7 px-2 text-xs cursor-pointer rounded-md"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
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
