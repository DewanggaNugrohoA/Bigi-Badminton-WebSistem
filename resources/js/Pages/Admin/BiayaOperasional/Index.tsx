import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { formatRupiah, formatTanggal } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Plus,
    Receipt,
    Pencil,
    Trash2,
    Calendar,
    Wallet,
    Search,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface BiayaItem {
    id_biaya: number;
    id_user: number;
    jenis_pengeluaran: string;
    tanggal_biaya: string;
    keterangan: string | null;
    jumlah: number;
    created_at: string;
    user?: {
        id_user: number;
        nama: string;
        role: string;
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
    biayaList: PaginatedData<BiayaItem>;
    totalBiaya: number;
    kategoriList: string[];
    filters: {
        start_date: string;
        end_date: string;
        jenis_pengeluaran: string;
        search: string;
    };
}

const PRESET_JENIS = [
    "Listrik",
    "WiFi / Internet",
    "Air / PDAM",
    "Gas",
    "Perlengkapan GOR",
    "Perawatan Lapangan",
    "Kebersihan",
    "Gaji Karyawan",
    "Lainnya",
];

export default function BiayaOperasionalIndex({
    biayaList,
    totalBiaya,
    kategoriList,
    filters,
}: Props) {
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [jenisFilter, setJenisFilter] = useState(filters.jenis_pengeluaran || "");
    const [search, setSearch] = useState(filters.search || "");

    // Modal Form State (Tambah & Edit)
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BiayaItem | null>(null);
    const [formTanggal, setFormTanggal] = useState("");
    const [formJenis, setFormJenis] = useState("");
    const [formNominal, setFormNominal] = useState("");
    const [formKeterangan, setFormKeterangan] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Modal Konfirmasi Hapus
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<BiayaItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/admin/biaya-operasional",
            {
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                jenis_pengeluaran: jenisFilter || undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        setJenisFilter("");
        setSearch("");
        router.get("/admin/biaya-operasional", {}, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormTanggal(new Date().toISOString().split("T")[0]);
        setFormJenis("Listrik");
        setFormNominal("");
        setFormKeterangan("");
        setFormErrors({});
        setModalOpen(true);
    };

    const openEditModal = (item: BiayaItem) => {
        setEditingItem(item);
        setFormTanggal(item.tanggal_biaya);
        setFormJenis(item.jenis_pengeluaran);
        setFormNominal(String(item.jumlah));
        setFormKeterangan(item.keterangan || "");
        setFormErrors({});
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        if (!formJenis.trim()) {
            setFormErrors({ jenis_pengeluaran: "Jenis pengeluaran wajib diisi." });
            return;
        }

        const nominalNum = Number(formNominal);
        if (!formNominal || isNaN(nominalNum) || nominalNum <= 0) {
            setFormErrors({ nominal: "Nominal harus berupa angka lebih dari 0." });
            return;
        }

        setSubmitting(true);

        const payload = {
            tanggal_biaya: formTanggal,
            jenis_pengeluaran: formJenis.trim(),
            jumlah: nominalNum,
            keterangan: formKeterangan.trim(),
        };

        if (editingItem) {
            router.put(`/admin/biaya-operasional/${editingItem.id_biaya}`, payload, {
                onSuccess: () => {
                    setModalOpen(false);
                    toast.success("Biaya operasional berhasil diperbarui.");
                },
                onError: (errs) => {
                    setFormErrors(errs);
                    toast.error("Gagal memperbarui biaya operasional.");
                },
                onFinish: () => setSubmitting(false),
            });
        } else {
            router.post("/admin/biaya-operasional", payload, {
                onSuccess: () => {
                    setModalOpen(false);
                    toast.success("Biaya operasional berhasil dicatat.");
                },
                onError: (errs) => {
                    setFormErrors(errs);
                    toast.error("Gagal mencatat biaya operasional.");
                },
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const openDeleteModal = (item: BiayaItem) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        setDeleting(true);

        router.delete(`/admin/biaya-operasional/${itemToDelete.id_biaya}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setItemToDelete(null);
                toast.success("Catatan biaya operasional berhasil dihapus.");
            },
            onError: () => {
                toast.error("Gagal menghapus biaya operasional.");
            },
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AdminLayout
            title="Biaya Operasional"
            breadcrumb={[{ label: "Operasional" }, { label: "Biaya Operasional" }]}
        >
            <Head title="Biaya Operasional - Bigi Badminton" />

            <div className="flex flex-col gap-6 w-full max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Receipt className="size-5 text-primary" />
                            Biaya Operasional
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pencatatan pengeluaran rutin GOR seperti listrik, WiFi, gas, kebersihan, dan perlengkapan.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreateModal}
                        className="h-10 px-4 text-xs font-medium cursor-pointer self-start sm:self-auto"
                    >
                        <Plus className="size-4 mr-1.5" />
                        Tambah Pengeluaran
                    </Button>
                </div>

                {/* KPI Card Ringkasan Total Biaya */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Pengeluaran Periode</span>
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Wallet className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {formatRupiah(totalBiaya)}
                            </h2>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="size-3" />
                                {filters.start_date && filters.end_date
                                    ? `${formatTanggal(filters.start_date)} - ${formatTanggal(filters.end_date)}`
                                    : "Bulan Berjalan"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Catatan Biaya</span>
                            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Receipt className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {biayaList.total}
                            </h2>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Transaksi pengeluaran tercatat
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Rata-rata per Catatan</span>
                            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Wallet className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {formatRupiah(biayaList.total > 0 ? totalBiaya / biayaList.total : 0)}
                            </h2>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Rata-rata nominal pengeluaran
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="start_date" className="text-xs font-medium text-muted-foreground">
                                Tanggal Mulai
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 text-xs w-36 sm:w-40"
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
                                className="h-9 text-xs w-36 sm:w-40"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="jenis_filter" className="text-xs font-medium text-muted-foreground">
                                Jenis Pengeluaran
                            </Label>
                            <select
                                id="jenis_filter"
                                value={jenisFilter}
                                onChange={(e) => setJenisFilter(e.target.value)}
                                className="h-9 text-xs px-3 rounded-md bg-background border border-border text-foreground"
                            >
                                <option value="">Semua Jenis</option>
                                {PRESET_JENIS.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                            <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
                                Cari Keterangan
                            </Label>
                            <div className="relative">
                                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="Cari keterangan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 text-xs pl-8 w-full"
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="default" className="h-9 text-xs font-medium cursor-pointer">
                            Terapkan Filter
                        </Button>

                        {(startDate || endDate || jenisFilter || search) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleReset}
                                className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <RotateCcw className="size-3.5 mr-1" />
                                Reset
                            </Button>
                        )}
                    </form>
                </div>

                {/* Tabel Data Biaya Operasional */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                    <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Daftar Pengeluaran Operasional</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Riwayat transaksi biaya operasional yang tercatat di sistem.
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Total {biayaList.total} catatan
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">Tanggal</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Jenis Pengeluaran</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Keterangan</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Dicatat Oleh</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Nominal</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {biayaList.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                                            Belum ada catatan biaya operasional pada periode ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    biayaList.data.map((item) => (
                                        <TableRow key={item.id_biaya}>
                                            <TableCell className="text-xs whitespace-nowrap font-medium">
                                                {formatTanggal(item.tanggal_biaya)}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                <Badge variant="outline" className="text-[11px] font-normal py-0.5 px-2">
                                                    {item.jenis_pengeluaran}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                                                {item.keterangan || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                                {item.user?.nama || "Admin"}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right font-semibold text-foreground whitespace-nowrap">
                                                {formatRupiah(item.jumlah)}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(item)}
                                                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                                        aria-label="Edit biaya"
                                                    >
                                                        <Pencil className="size-3.5 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openDeleteModal(item)}
                                                        className="h-8 px-2 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                                        aria-label="Hapus biaya"
                                                    >
                                                        <Trash2 className="size-3.5 mr-1" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {biayaList.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
                            <span className="text-muted-foreground">
                                Halaman {biayaList.current_page} dari {biayaList.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                {biayaList.prev_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(biayaList.prev_page_url!)}
                                        className="h-8 text-xs cursor-pointer"
                                    >
                                        Sebelumnya
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 text-xs">
                                        Sebelumnya
                                    </Button>
                                )}
                                {biayaList.next_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(biayaList.next_page_url!)}
                                        className="h-8 text-xs cursor-pointer"
                                    >
                                        Berikutnya
                                    </Button>
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

            {/* Modal Tambah / Edit Biaya */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md bg-card border border-border">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            {editingItem ? "Edit Biaya Operasional" : "Catat Biaya Operasional Baru"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {editingItem
                                ? "Perbarui informasi rincian pengeluaran operasional yang sudah tercatat."
                                : "Masukkan rincian pengeluaran operasional GOR seperti listrik, WiFi, atau perlengkapan."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="formTanggal" className="text-xs font-medium text-foreground">
                                Tanggal Pengeluaran *
                            </Label>
                            <Input
                                id="formTanggal"
                                type="date"
                                required
                                value={formTanggal}
                                onChange={(e) => setFormTanggal(e.target.value)}
                                className="h-9 text-xs"
                            />
                            {formErrors.tanggal_biaya && (
                                <p className="text-[11px] text-rose-500">{formErrors.tanggal_biaya}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="formJenis" className="text-xs font-medium text-foreground">
                                Jenis Pengeluaran *
                            </Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="formJenis"
                                    type="text"
                                    required
                                    placeholder="Contoh: Tagihan Listrik PLN"
                                    value={formJenis}
                                    onChange={(e) => setFormJenis(e.target.value)}
                                    className="h-9 text-xs"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {PRESET_JENIS.slice(0, 6).map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setFormJenis(preset)}
                                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                                                formJenis === preset
                                                    ? "bg-primary text-white border-primary"
                                                    : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {formErrors.jenis_pengeluaran && (
                                <p className="text-[11px] text-rose-500">{formErrors.jenis_pengeluaran}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="formNominal" className="text-xs font-medium text-foreground">
                                Nominal (Rp) *
                            </Label>
                            <Input
                                id="formNominal"
                                type="number"
                                required
                                min="1"
                                placeholder="Contoh: 500000"
                                value={formNominal}
                                onChange={(e) => setFormNominal(e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                            {formNominal && Number(formNominal) > 0 && (
                                <p className="text-[11px] text-muted-foreground tabular-nums">
                                    Terbilang: {formatRupiah(Number(formNominal))}
                                </p>
                            )}
                            {formErrors.nominal && (
                                <p className="text-[11px] text-rose-500">{formErrors.nominal}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="formKeterangan" className="text-xs font-medium text-foreground">
                                Keterangan / Catatan Tambahan
                            </Label>
                            <textarea
                                id="formKeterangan"
                                rows={3}
                                placeholder="Catatan nomor invoice, ID pelanggan listrik, atau keterangan vendor..."
                                value={formKeterangan}
                                onChange={(e) => setFormKeterangan(e.target.value)}
                                className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {formErrors.keterangan && (
                                <p className="text-[11px] text-rose-500">{formErrors.keterangan}</p>
                            )}
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                className="h-9 text-xs cursor-pointer"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="h-9 text-xs font-medium cursor-pointer"
                            >
                                {submitting ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Simpan Pengeluaran"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="max-w-sm bg-card border border-border">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Hapus Biaya Operasional?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Anda yakin ingin menghapus catatan biaya{" "}
                            <span className="font-semibold text-foreground">
                                {itemToDelete?.jenis_pengeluaran}
                            </span>{" "}
                            senilai{" "}
                            <span className="font-semibold text-foreground">
                                {formatRupiah(itemToDelete?.jumlah || 0)}
                            </span>
                            ? Tindakan ini akan dicatat ke dalam audit log dan tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            className="h-9 text-xs cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleting}
                            onClick={handleDelete}
                            className="h-9 text-xs font-medium cursor-pointer"
                        >
                            {deleting ? "Menghapus..." : "Ya, Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
