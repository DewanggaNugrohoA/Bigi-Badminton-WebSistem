import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { formatRupiah, formatTanggal, formatTanggalRingkas, formatJam } from "@/lib/admin-format";
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

interface SewaHarianItem {
    tgl: string;
    hari?: string;
    total_sesi?: number;
    sesi_lap1?: number;
    sesi_lap2?: number;
    sesi_member?: number;
    sesi_reguler?: number;
    total_jam?: number;
    total_transaksi: number;
    dp: number;
    lunas: number;
    tunai: number;
    transfer: number;
    qris: number;
    total: number;
    pendapatan_sewa?: number;
    pendapatan_pos?: number;
    total_pendapatan?: number;
    pengeluaran_operasional?: number;
    laba_bersih?: number;
    ada_aktivitas?: boolean;
}

interface SesiPemakaianItem {
    id_detail: number;
    tanggal_main: string;
    nama_lapangan: string;
    jam_mulai: string;
    jam_selesai: string;
    durasi_jam: number;
    nama_pemain: string;
    no_whatsapp: string;
    is_member: boolean;
    tipe_label: string;
    status_reservasi: string;
    status_bayar: string;
    total_biaya: number;
    sudah_dibayar: number;
    metode_bayar: string;
    catatan: string;
}

interface PembayaranSewaItem {
    id_pembayaran: number;
    id_reservasi: number | null;
    id_paket: number | null;
    tanggal_pembayaran: string | null;
    nama_pemesan: string;
    no_whatsapp: string;
    is_member: boolean;
    item_label: string;
    jenis_pembayaran: "DP" | "Lunas";
    metode_pembayaran: "tunai" | "transfer" | "qris";
    jumlah: number;
    status_pembayaran: string;
    status_reservasi: string;
    keterangan: string;
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
        total_pendapatan_kotor?: number;
        total_biaya_operasional?: number;
        laba_bersih?: number;
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
    sewaHarian?: PaginatedData<SewaHarianItem>;
    sesiPemakaianLapangan?: PaginatedData<SesiPemakaianItem>;
    riwayatPembayaranSewa?: PaginatedData<PembayaranSewaItem>;
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

/**
 * Halaman pusat Laporan & Analitik Operasional GOR (Panel Admin).
 * Menyediakan empat tab analitik:
 * 1. Ringkasan Keuangan: Total omset sewa lapangan + penjualan POS, profit bersih, breakdown metode bayar.
 * 2. Kasir POS & Inventori: Rekap kas harian, selisih kas shift kasir, restock, opname, dan void/retur.
 * 3. Analitik Lapangan: Jam sibuk pemakaian lapangan, utilisasi lapangan 1 & 2, serta form pemeriksaan kondisi sarana.
 * 4. Pemain & Komunitas: Statistik member aktif vs reguler, riwayat main, dan partisipasi open mabar.
 * Ekspor Excel multi-sheet tersedia lewat tombol unduh sesuai rentang tanggal yang dipilih.
 */
export default function LaporanIndex({
    ringkasan,
    ringkasanPemain,
    daftarPemain,
    ringkasanLapangan = [],
    riwayatLapangan,
    masterLapangan = [],
    sewaHarian,
    sesiPemakaianLapangan,
    riwayatPembayaranSewa,
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

    const totalPendapatan = ringkasan?.total_pendapatan_kotor ?? ((ringkasan?.pendapatan_pos || 0) + (ringkasan?.pendapatan_sewa_lapangan || 0));
    const totalBiayaOperasional = ringkasan?.total_biaya_operasional || 0;
    const labaBersih = ringkasan?.laba_bersih ?? (totalPendapatan - totalBiayaOperasional);

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

            <div className="hidden print:block mb-4 border-b-2 border-black pb-3 w-full">
                <div className="flex justify-between items-start gap-4 w-full">
                    <div className="shrink-0">
                        <h1 className="text-lg font-bold tracking-tight text-black">
                            BIGI BADMINTON - LAPORAN EKSEKUTIF
                        </h1>
                        <p className="text-xs text-black mt-0.5 font-medium">
                            Periode: {formatTanggal(filters.start_date)} s.d. {formatTanggal(filters.end_date)}
                        </p>
                    </div>
                    <div className="text-right text-[10px] text-black shrink-0">
                        <p className="font-semibold">Dicetak oleh: {auth?.user?.nama || "Admin"}</p>
                        <p>Waktu cetak: {printTimestamp}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-6xl print:max-w-none print:w-full print:gap-4">
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
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
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
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
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

                            <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Nama</TableHead>
                                            <TableHead className="w-[14%] print:w-[14%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">WhatsApp</TableHead>
                                            <TableHead className="w-[10%] print:w-[10%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Jenis</TableHead>
                                            <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Sisa Sesi Paket</TableHead>
                                            <TableHead className="w-[11%] print:w-[11%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Kunjungan</TableHead>
                                            <TableHead className="w-[11%] print:w-[11%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Mabar Dibuat</TableHead>
                                            <TableHead className="w-[11%] print:w-[11%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Mabar Diikuti</TableHead>
                                            <TableHead className="w-[13%] print:w-[13%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Kunjungan Terakhir</TableHead>
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
                                                    <TableCell className="text-xs whitespace-nowrap print:whitespace-normal font-medium text-foreground">
                                                        {item.nama}
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap print:whitespace-normal tabular-nums text-foreground">
                                                        {item.no_whatsapp ? item.no_whatsapp : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap print:whitespace-normal text-xs">
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
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                        {item.sisa_sesi_paket !== null ? item.sisa_sesi_paket : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground print:whitespace-normal">
                                                        {item.kunjungan_periode}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                        {item.open_mabar_dibuat}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                        {item.open_mabar_diikuti}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-center whitespace-nowrap print:whitespace-normal text-foreground">
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
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                    Ringkasan Kondisi Terakhir Lapangan
                                </h2>
                            </div>

                            <div className="overflow-x-auto print:overflow-visible">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-100 h-9">Lapangan</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-100 h-9">Status</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-100 h-9">Pemeriksaan Terakhir</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-100 h-9">Komponen Perlu Perhatian</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-100 h-9">Pemeriksa</TableHead>
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
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
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
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
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

                            <div className="overflow-x-auto print:overflow-visible">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="w-[12%] print:w-[12%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Tanggal</TableHead>
                                            <TableHead className="w-[14%] print:w-[14%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Lapangan</TableHead>
                                            <TableHead className="w-[8%] print:w-[8%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Karpet/Vinil</TableHead>
                                            <TableHead className="w-[7%] print:w-[7%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Net</TableHead>
                                            <TableHead className="w-[7%] print:w-[7%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Tiang</TableHead>
                                            <TableHead className="w-[7%] print:w-[7%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Lampu</TableHead>
                                            <TableHead className="w-[7%] print:w-[7%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Lantai</TableHead>
                                            <TableHead className="w-[7%] print:w-[7%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Dinding</TableHead>
                                            <TableHead className="w-[18%] print:w-[18%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Catatan</TableHead>
                                            <TableHead className="w-[13%] print:w-[13%] text-xs font-semibold text-slate-700 dark:text-slate-100 h-9 whitespace-nowrap print:whitespace-normal">Pemeriksa</TableHead>
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
                                                        <TableCell className="tabular-nums text-foreground whitespace-nowrap print:whitespace-normal">
                                                            {formatTanggal(item.tanggal_pemeriksaan)}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-foreground whitespace-nowrap print:whitespace-normal">
                                                            {item.lapangan?.nama_lapangan ?? `Lapangan #${item.id_lapangan}`}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap print:whitespace-normal">{renderKondisi(item.karpet_vinil)}</TableCell>
                                                        <TableCell className="whitespace-nowrap print:whitespace-normal">{renderKondisi(item.net)}</TableCell>
                                                        <TableCell className="whitespace-nowrap print:whitespace-normal">{renderKondisi(item.tiang)}</TableCell>
                                                        <TableCell className="whitespace-nowrap print:whitespace-normal">{renderKondisi(item.lampu)}</TableCell>
                                                        <TableCell className="whitespace-nowrap print:whitespace-normal">{renderKondisi(item.lantai)}</TableCell>
                                                        <TableCell className="whitespace-nowrap print:whitespace-normal">{renderKondisi(item.dinding)}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate text-muted-foreground print:max-w-none print:whitespace-normal" title={item.catatan || ""}>
                                                            {item.catatan || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap print:whitespace-normal">
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


                    <TabsContent value="keuangan" className="space-y-8 pt-4">
                        {/* 3 Kartu KPI Ringkasan Laba Bersih */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
                            <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                                <span className="text-xs font-medium text-muted-foreground">Total Pendapatan Kotor</span>
                                <h3 className="text-xl font-bold tracking-tight text-foreground tabular-nums mt-2">
                                    {formatRupiah(totalPendapatan)}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    POS: {formatRupiah(ringkasan.pendapatan_pos)} + Sewa: {formatRupiah(ringkasan.pendapatan_sewa_lapangan)}
                                </p>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                                <span className="text-xs font-medium text-muted-foreground">Biaya Operasional</span>
                                <h3 className="text-xl font-bold tracking-tight text-rose-500 tabular-nums mt-2">
                                    {formatRupiah(totalBiayaOperasional)}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Total pengeluaran operasional periode
                                </p>
                            </div>

                            <div className="bg-card border border-primary/30 rounded-xl p-5 shadow-xs bg-primary/5">
                                <span className="text-xs font-bold text-primary">Laba Bersih (Netto)</span>
                                <h3 className={`text-xl font-extrabold tracking-tight tabular-nums mt-2 ${labaBersih >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500"}`}>
                                    {formatRupiah(labaBersih)}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Pendapatan kotor dikurangi biaya operasional
                                </p>
                            </div>
                        </div>

                        <div className="border border-border p-5 sm:p-6 bg-card print:border-black print:border print:bg-white print:p-4">
                            <div className="border-b border-border pb-3 mb-4 print:border-b-2 print:border-black">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground print:text-black">
                                    Ringkasan Keuangan
                                </h2>
                            </div>

                            <div className="space-y-6 text-xs">
                                <div>
                                    <div className="text-xs font-bold text-foreground print:text-black uppercase tracking-wider pb-1 mb-2 border-b border-border/60 print:border-b print:border-black">
                                        Pendapatan
                                    </div>
                                    <div className="divide-y divide-border/40 print:divide-slate-300">
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground font-medium print:text-black">Pendapatan POS</span>
                                            <span className="tabular-nums font-semibold text-foreground print:text-black">
                                                {formatRupiah(ringkasan.pendapatan_pos)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center pl-4 text-foreground/80 print:text-black">
                                            <span>Tunai</span>
                                            <span className="tabular-nums font-medium">
                                                {formatRupiah(ringkasan.pos_tunai)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center pl-4 text-foreground/80 print:text-black">
                                            <span>QRIS</span>
                                            <span className="tabular-nums font-medium">
                                                {formatRupiah(ringkasan.pos_qris)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 items-center pt-3">
                                            <span className="text-foreground font-medium print:text-black">Pendapatan Sewa Lapangan</span>
                                            <span className="tabular-nums font-semibold text-foreground print:text-black">
                                                {formatRupiah(ringkasan.pendapatan_sewa_lapangan)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-3 items-center border-t-2 border-foreground/30 print:border-black mt-2 font-bold text-sm">
                                            <span className="text-foreground print:text-black">Total Pendapatan (POS + Sewa)</span>
                                            <span className="tabular-nums text-foreground print:text-black font-extrabold">
                                                {formatRupiah(totalPendapatan)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 items-center pt-3 text-foreground">
                                            <div className="flex flex-col">
                                                <span className="font-medium print:text-black">Pengeluaran Operasional</span>
                                                <span className="text-[11px] text-muted-foreground print:text-black">Listrik, WiFi, gas, dll (dari menu Biaya Operasional)</span>
                                            </div>
                                            <span className="tabular-nums font-semibold text-rose-500 print:text-black">
                                                -{formatRupiah(totalBiayaOperasional)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-3 items-center border-t-2 border-primary/50 print:border-black mt-2 font-bold text-sm bg-primary/5 p-2 rounded-lg print:bg-transparent">
                                            <div>
                                                <span className="text-foreground print:text-black font-bold">LABA BERSIH (NETTO)</span>
                                                <p className="text-[10px] text-muted-foreground font-normal print:text-black">Total Pendapatan Kotor dikurangi Biaya Operasional</p>
                                            </div>
                                            <span className={`tabular-nums font-extrabold text-base ${labaBersih >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500"} print:text-black`}>
                                                {formatRupiah(labaBersih)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-foreground print:text-black uppercase tracking-wider pb-1 mb-2 border-b border-border/60 print:border-b print:border-black">
                                        Koreksi Kas
                                    </div>
                                    <div className="divide-y divide-border/40 print:divide-slate-300">
                                        <div className="flex justify-between py-2 items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-foreground font-medium print:text-black">Total Nilai Void / Retur</span>
                                                <span className="text-[11px] text-foreground/70 print:text-black">
                                                    ({ringkasan.jumlah_void_retur} kasus)
                                                </span>
                                            </div>
                                            <span className="tabular-nums font-semibold text-foreground print:text-black">
                                                {formatRupiah(ringkasan.total_nominal_void_retur)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground font-medium print:text-black">Total Selisih Kas Shift</span>
                                            <span className="tabular-nums font-semibold text-foreground print:text-black">
                                                {formatRupiah(ringkasan.total_selisih_kas_shift)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-foreground print:text-black uppercase tracking-wider pb-1 mb-2 border-b border-border/60 print:border-b print:border-black">
                                        Di Luar Total Pendapatan
                                    </div>
                                    <div className="divide-y divide-border/40 print:divide-slate-300">
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground font-medium print:text-black">Piutang Sewa (Belum Lunas)</span>
                                            <span className="tabular-nums font-semibold text-foreground print:text-black">
                                                {formatRupiah(ringkasan.sisa_tagihan_belum_lunas)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 items-center">
                                            <span className="text-foreground font-medium print:text-black">DP Reservasi Batal</span>
                                            <span className="tabular-nums font-semibold text-foreground print:text-black">
                                                {formatRupiah(ringkasan.dp_reservasi_batal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-3 border-t border-border print:border-black">
                                <p className="text-[11px] text-foreground/80 print:text-black">
                                    Catatan: Piutang sewa belum lunas dan DP reservasi batal tidak termasuk ke dalam kalkulasi total pendapatan.
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 print:border-b-2 print:border-black">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                                        Rekapitulasi Arus Kas Harian (Pendapatan & Pengeluaran)
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground print:text-black">
                                        Rincian per tanggal untuk penerimaan sewa lapangan, penjualan kasir POS, pengeluaran operasional, dan laba bersih.
                                    </p>
                                </div>
                                <span className="text-[11px] text-muted-foreground tabular-nums print:text-black font-semibold shrink-0">
                                    {sewaHarian?.total ?? 0} hari dalam periode
                                </span>
                            </div>

                            <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="w-[20%] print:w-[20%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Tanggal & Hari</TableHead>
                                            <TableHead className="w-[16%] print:w-[16%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Pendapatan Sewa</TableHead>
                                            <TableHead className="w-[16%] print:w-[16%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Pendapatan POS</TableHead>
                                            <TableHead className="w-[16%] print:w-[16%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Total Pendapatan</TableHead>
                                            <TableHead className="w-[16%] print:w-[16%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Pengeluaran Operasional</TableHead>
                                            <TableHead className="w-[16%] print:w-[16%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Laba Bersih</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!sewaHarian || sewaHarian.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                                                    Tidak ada data keuangan pada periode ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            sewaHarian.data.map((item) => {
                                                const pendapatanSewa = item.pendapatan_sewa ?? item.total ?? 0;
                                                const pendapatanPos = item.pendapatan_pos ?? 0;
                                                const totalPendapatanHarian = item.total_pendapatan ?? (pendapatanSewa + pendapatanPos);
                                                const pengeluaranOperasional = item.pengeluaran_operasional ?? 0;
                                                const labaBersihHarian = item.laba_bersih ?? (totalPendapatanHarian - pengeluaranOperasional);
                                                const hasData = totalPendapatanHarian > 0 || pengeluaranOperasional > 0;

                                                return (
                                                    <TableRow key={item.tgl} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                                                        <TableCell className="text-xs whitespace-nowrap print:whitespace-normal font-medium text-foreground">
                                                            <div className="font-semibold">
                                                                {item.hari ? `${item.hari}, ${formatTanggalRingkas(item.tgl)}` : formatTanggal(item.tgl)}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground font-mono">{item.tgl}</div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                            {pendapatanSewa > 0 ? (
                                                                formatRupiah(pendapatanSewa)
                                                            ) : (
                                                                <span className="text-muted-foreground/60">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                            {pendapatanPos > 0 ? (
                                                                formatRupiah(pendapatanPos)
                                                            ) : (
                                                                <span className="text-muted-foreground/60">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right font-medium tabular-nums text-foreground print:whitespace-normal">
                                                            {totalPendapatanHarian > 0 ? (
                                                                formatRupiah(totalPendapatanHarian)
                                                            ) : (
                                                                <span className="text-muted-foreground/60">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-rose-500 font-medium print:whitespace-normal">
                                                            {pengeluaranOperasional > 0 ? (
                                                                `-${formatRupiah(pengeluaranOperasional)}`
                                                            ) : (
                                                                <span className="text-muted-foreground/60">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right font-bold tabular-nums print:whitespace-normal">
                                                            {!hasData ? (
                                                                <span className="text-muted-foreground/60">-</span>
                                                            ) : (
                                                                <span className={labaBersihHarian >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500"}>
                                                                    {formatRupiah(labaBersihHarian)}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                    {sewaHarian && sewaHarian.data.length > 0 && (
                                        <tfoot>
                                            <TableRow className="border-t-2 border-foreground/30 bg-muted/30 font-bold text-xs">
                                                <TableCell className="text-foreground">
                                                    Total Periode ({sewaHarian.total} Hari)
                                                </TableCell>
                                                <TableCell className="text-right text-foreground tabular-nums">
                                                    {formatRupiah(ringkasan.pendapatan_sewa_lapangan)}
                                                </TableCell>
                                                <TableCell className="text-right text-foreground tabular-nums">
                                                    {formatRupiah(ringkasan.pendapatan_pos)}
                                                </TableCell>
                                                <TableCell className="text-right text-foreground tabular-nums font-extrabold">
                                                    {formatRupiah(totalPendapatan)}
                                                </TableCell>
                                                <TableCell className="text-right text-rose-500 tabular-nums">
                                                    -{formatRupiah(totalBiayaOperasional)}
                                                </TableCell>
                                                <TableCell className={`text-right tabular-nums font-extrabold ${labaBersih >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500"}`}>
                                                    {formatRupiah(labaBersih)}
                                                </TableCell>
                                            </TableRow>
                                        </tfoot>
                                    )}
                                </Table>
                            </div>

                            {sewaHarian && sewaHarian.last_page > 1 && (
                                <div className="print:hidden flex items-center justify-between pt-2 text-xs">
                                    <span className="text-muted-foreground text-[11px]">
                                        Halaman {sewaHarian.current_page} dari {sewaHarian.last_page} ({sewaHarian.total} hari)
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!sewaHarian.prev_page_url}
                                            onClick={() => sewaHarian.prev_page_url && router.get(sewaHarian.prev_page_url, {}, { preserveState: true })}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!sewaHarian.next_page_url}
                                            onClick={() => sewaHarian.next_page_url && router.get(sewaHarian.next_page_url, {}, { preserveState: true })}
                                            className="h-7 px-2 text-xs cursor-pointer"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between print:border-b-2 print:border-black">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                                    Pendapatan POS per Hari
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums print:text-black font-semibold">
                                    {posHarian.total} entri
                                </span>
                            </div>

                            <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="w-[24%] print:w-[24%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Tanggal</TableHead>
                                            <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Jumlah Transaksi</TableHead>
                                            <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Tunai</TableHead>
                                            <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">QRIS</TableHead>
                                            <TableHead className="w-[22%] print:w-[22%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Total Pendapatan</TableHead>
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
                                                    <TableCell className="text-xs whitespace-nowrap print:whitespace-normal font-medium text-foreground">
                                                        {formatTanggal(item.tgl)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-center tabular-nums text-foreground print:whitespace-normal">
                                                        {item.total_transaksi}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                        {formatRupiah(item.tunai)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                        {formatRupiah(item.qris)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right font-semibold text-foreground tabular-nums print:whitespace-normal">
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
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between print:border-b-2 print:border-black">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                                    Rekapitulasi Shift Kasir & Selisih Kas
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums print:text-black font-semibold">
                                    {rekapShift.total} shift
                                </span>
                            </div>

                            <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="w-[14%] print:w-[14%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Kasir</TableHead>
                                            <TableHead className="w-[15%] print:w-[15%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Waktu Buka</TableHead>
                                            <TableHead className="w-[15%] print:w-[15%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Waktu Tutup</TableHead>
                                            <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Modal Awal</TableHead>
                                            <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Kas Sistem</TableHead>
                                            <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Kas Hitung</TableHead>
                                            <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Selisih</TableHead>
                                            <TableHead className="w-[8%] print:w-[8%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Status</TableHead>
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
                                                        <TableCell className="text-xs font-medium whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {shift.user?.nama || "Kasir"}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {formatTanggalRingkas(shift.waktu_buka)} {formatJam(shift.waktu_buka.substring(11, 16))}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {shift.waktu_tutup
                                                                ? `${formatTanggalRingkas(shift.waktu_tutup)} ${formatJam(shift.waktu_tutup.substring(11, 16))}`
                                                                : "Masih Terbuka"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                            {formatRupiah(shift.modal_awal)}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                            {shift.kas_sistem !== null ? formatRupiah(shift.kas_sistem) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground print:whitespace-normal">
                                                            {shift.kas_fisik !== null ? formatRupiah(shift.kas_fisik) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-center whitespace-nowrap print:whitespace-normal">
                                                            {shift.status === "ditutup" ? (
                                                                <Badge variant="outline" className="text-[11px] print:text-[7pt] py-0 px-1.5 font-mono font-semibold border-border text-foreground print:whitespace-normal">
                                                                    {badgeLabel}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center whitespace-nowrap print:whitespace-normal">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[11px] print:text-[7pt] py-0 px-1.5 uppercase font-medium border-border text-foreground print:whitespace-normal"
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
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between print:border-b-2 print:border-black">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                                    Monitoring Void & Retur
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums print:text-black font-semibold">
                                    {riwayatVoidRetur.total} entri
                                </span>
                            </div>

                            <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Nomor Transaksi</TableHead>
                                            <TableHead className="w-[14%] print:w-[14%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Kasir</TableHead>
                                            <TableHead className="w-[10%] print:w-[10%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Jenis</TableHead>
                                            <TableHead className="w-[22%] print:w-[22%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Alasan</TableHead>
                                            <TableHead className="w-[14%] print:w-[14%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Total Nilai</TableHead>
                                            <TableHead className="w-[13%] print:w-[13%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Waktu Catat</TableHead>
                                            <TableHead className="w-[9%] print:w-[9%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Status</TableHead>
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
                                                    <TableCell className="text-xs font-mono font-medium whitespace-nowrap print:whitespace-normal text-foreground">
                                                        {item.transaksi_pos?.no_transaksi || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium text-foreground whitespace-nowrap print:whitespace-normal">
                                                        {item.pengaju?.nama || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap print:whitespace-normal">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[11px] print:text-[7pt] py-0 px-1.5 uppercase font-mono font-bold border-border text-foreground print:whitespace-normal"
                                                        >
                                                            {item.jenis}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-foreground max-w-[260px] truncate print:max-w-none print:whitespace-normal">
                                                        {item.alasan}
                                                    </TableCell>
                                                    <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap print:whitespace-normal text-foreground">
                                                        {formatRupiah(item.transaksi_pos?.total || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap print:whitespace-normal text-foreground">
                                                        {formatTanggal(item.tanggal)} {formatJam(item.tanggal.substring(11, 16))}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap print:whitespace-normal">
                                                        <Badge variant="outline" className="text-[11px] print:text-[7pt] py-0 px-1.5 border-border text-foreground print:whitespace-normal">
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

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1 print:gap-6">
                            <div>
                                <div className="border-b border-border pb-2 mb-3 flex items-center justify-between print:border-b-2 print:border-black">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                                        Riwayat Restock Barang
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground tabular-nums print:text-black font-semibold">
                                        {riwayatRestock.total} log
                                    </span>
                                </div>

                                <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                                <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Tanggal</TableHead>
                                                <TableHead className="w-[25%] print:w-[25%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Produk</TableHead>
                                                <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Jumlah</TableHead>
                                                <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Kasir</TableHead>
                                                <TableHead className="w-[27%] print:w-[27%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Keterangan</TableHead>
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
                                                        <TableCell className="text-xs whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {formatTanggal(item.tanggal)}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-medium whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {item.produk?.nama_produk || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground print:whitespace-normal">
                                                            +{item.jumlah}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {item.user?.nama || "Kasir"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate print:max-w-none print:whitespace-normal">
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
                                <div className="border-b border-border pb-2 mb-3 flex items-center justify-between print:border-b-2 print:border-black">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                                        Riwayat Stok Opname
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground tabular-nums print:text-black font-semibold">
                                        {riwayatOpname.total} log
                                    </span>
                                </div>

                                <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                                <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Tanggal</TableHead>
                                                <TableHead className="w-[26%] print:w-[26%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Produk</TableHead>
                                                <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Sistem</TableHead>
                                                <TableHead className="w-[12%] print:w-[12%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Fisik</TableHead>
                                                <TableHead className="w-[14%] print:w-[14%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Selisih</TableHead>
                                                <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Kasir</TableHead>
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
                                                        <TableCell className="text-xs whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {formatTanggal(item.tanggal)}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-medium whitespace-nowrap print:whitespace-normal text-foreground">
                                                            {item.produk?.nama_produk || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums text-foreground print:whitespace-normal">
                                                            {item.stok_sistem}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground print:whitespace-normal">
                                                            {item.stok_fisik}
                                                        </TableCell>
                                                        <TableCell className="text-center whitespace-nowrap print:whitespace-normal">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[11px] print:text-[7pt] py-0 px-1.5 font-mono font-semibold border-border text-foreground print:whitespace-normal"
                                                            >
                                                                {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap print:whitespace-normal text-foreground">
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
                            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between print:border-b-2 print:border-black">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                                    Peringatan Stok Produk Menipis
                                </h3>
                                <span className="text-[11px] text-muted-foreground tabular-nums print:text-black font-semibold">
                                    {stokMenipis.length} produk butuh restock
                                </span>
                            </div>

                            <div className="overflow-x-auto print:overflow-visible max-w-full border border-border print:border-black">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableHead className="w-[30%] print:w-[30%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Nama Produk</TableHead>
                                            <TableHead className="w-[20%] print:w-[20%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold">Kategori</TableHead>
                                            <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Stok Saat Ini</TableHead>
                                            <TableHead className="w-[18%] print:w-[18%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-right">Batas Minimum</TableHead>
                                            <TableHead className="w-[14%] print:w-[14%] whitespace-nowrap print:whitespace-normal text-xs text-slate-700 dark:text-slate-100 font-semibold text-center">Status</TableHead>
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
                                                    <TableCell className="text-xs font-medium whitespace-nowrap print:whitespace-normal text-foreground">
                                                        {item.nama_produk}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap print:whitespace-normal">
                                                        {item.kategori}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums font-semibold text-foreground print:whitespace-normal">
                                                        {item.stok}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground print:whitespace-normal">
                                                        {item.stok_minimum}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap print:whitespace-normal">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[11px] print:text-[7pt] py-0 px-1.5 border-border text-foreground font-semibold print:whitespace-normal"
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
