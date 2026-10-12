import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatRupiah } from "@/lib/admin-format";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Edit2 } from "lucide-react";

interface ProdukItem {
    id_produk: number;
    nama_produk: string;
    kategori: string;
    harga: number;
    stok: number;
    stok_minimum: number;
    status_produk: "aktif" | "nonaktif";
    gambar?: string | null;
    url_gambar?: string | null;
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
    produkList: PaginatedData<ProdukItem>;
    kategoriList: string[];
    filters: {
        search: string;
        kategori: string;
        status: string;
    };
}

export default function ProdukIndex({ produkList, kategoriList, filters }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [selectedKategori, setSelectedKategori] = useState(filters.kategori || "semua");
    const [selectedStatus, setSelectedStatus] = useState(filters.status || "semua");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduk, setEditingProduk] = useState<ProdukItem | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm({
        nama_produk: "",
        kategori: "",
        harga: "",
        stok_minimum: "0",
        status_produk: "aktif" as "aktif" | "nonaktif",
        gambar: null as File | null,
        hapus_gambar: false,
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/kasir/produk",
            {
                search,
                kategori: selectedKategori,
                status: selectedStatus,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch("");
        setSelectedKategori("semua");
        setSelectedStatus("semua");
        router.get("/kasir/produk", {}, { preserveState: true });
    };

    const openAddDialog = () => {
        setEditingProduk(null);
        setPreviewUrl(null);
        form.setData({
            nama_produk: "",
            kategori: kategoriList.length > 0 ? kategoriList[0] : "",
            harga: "",
            stok_minimum: "0",
            status_produk: "aktif",
            gambar: null,
            hapus_gambar: false,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const openEditDialog = (item: ProdukItem) => {
        setEditingProduk(item);
        setPreviewUrl(item.url_gambar || null);
        form.setData({
            nama_produk: item.nama_produk,
            kategori: item.kategori,
            harga: String(item.harga),
            stok_minimum: String(item.stok_minimum),
            status_produk: item.status_produk,
            gambar: null,
            hapus_gambar: false,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedHarga = form.data.harga.replace(/\D/g, "");
        const cleanedStokMin = form.data.stok_minimum.replace(/\D/g, "");

        form.transform((data) => ({
            ...data,
            harga: cleanedHarga,
            stok_minimum: cleanedStokMin,
            ...(editingProduk ? { _method: "put" } : {}),
        }));

        if (editingProduk) {
            form.post(`/kasir/produk/${editingProduk.id_produk}`, {
                forceFormData: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                    setPreviewUrl(null);
                },
            });
        } else {
            form.post("/kasir/produk", {
                forceFormData: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                    setPreviewUrl(null);
                },
            });
        }
    };

    return (
        <KasirLayout title="Katalog Produk">
            <Head title="Katalog Produk - Bigi Badminton" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Produk POS</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kelola data barang, harga jual, dan status ketersediaan di kasir.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openAddDialog}
                        className="h-10 px-4 text-xs font-medium bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white self-start sm:self-auto"
                    >
                        <Plus className="size-4 mr-1.5" />
                        Tambah Produk
                    </Button>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="search" className="text-xs font-medium">Cari Produk</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="Cari nama produk..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 text-xs"
                                />
                            </div>
                        </div>

                        <div className="w-40">
                            <Label htmlFor="kategori" className="text-xs font-medium">Kategori</Label>
                            <select
                                id="kategori"
                                value={selectedKategori}
                                onChange={(e) => setSelectedKategori(e.target.value)}
                                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="semua">Semua Kategori</option>
                                {kategoriList.map((kat) => (
                                    <option key={kat} value={kat}>{kat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-36">
                            <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                            <select
                                id="status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="semua">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </div>

                        <Button type="submit" variant="outline" className="h-10 text-xs font-medium">
                            Filter
                        </Button>

                        {(search || selectedKategori !== "semua" || selectedStatus !== "semua") && (
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
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Total {produkList.total} produk terdaftar
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">Nama Produk</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Kategori</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Harga</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Stok Saat Ini</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Stok Min</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {produkList.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                            Tidak ada produk yang sesuai kriteria pencarian.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    produkList.data.map((item) => {
                                        const isLowStock = item.stok <= item.stok_minimum;
                                        return (
                                            <TableRow key={item.id_produk}>
                                                <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {item.url_gambar ? (
                                                            <img
                                                                src={item.url_gambar}
                                                                alt={item.nama_produk}
                                                                className="size-10 rounded-md object-cover border border-border shrink-0 bg-muted/20"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="size-10 rounded-md bg-muted/60 text-muted-foreground border border-border/60 flex items-center justify-center text-xs font-semibold shrink-0 select-none uppercase">
                                                                {item.nama_produk.slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span>{item.nama_produk}</span>
                                                            {item.status_produk === "nonaktif" && (
                                                                <span className="text-[11px] text-muted-foreground font-normal">
                                                                    (Nonaktif)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {item.kategori}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap">
                                                    {formatRupiah(item.harga)}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums text-right whitespace-nowrap">
                                                    {isLowStock ? (
                                                        <Badge variant="warning" className="text-[11px] py-0 px-1.5 tabular-nums">
                                                            {item.stok}
                                                        </Badge>
                                                    ) : (
                                                        <span className="tabular-nums">{item.stok}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums text-right text-muted-foreground whitespace-nowrap">
                                                    {item.stok_minimum}
                                                </TableCell>
                                                <TableCell className="text-right whitespace-nowrap">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditDialog(item)}
                                                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                                        aria-label={`Ubah ${item.nama_produk}`}
                                                    >
                                                        <Edit2 className="size-3.5 mr-1" />
                                                        Ubah
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {produkList.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
                            <span className="text-muted-foreground">
                                Halaman {produkList.current_page} dari {produkList.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!produkList.prev_page_url}
                                    onClick={() => produkList.prev_page_url && router.get(produkList.prev_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!produkList.next_page_url}
                                    onClick={() => produkList.next_page_url && router.get(produkList.next_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {editingProduk ? "Ubah Data Produk" : "Tambah Produk Baru"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {editingProduk
                                ? "Perbarui informasi produk. Stok tidak dapat diubah di sini."
                                : "Masukkan rincian produk baru. Stok awal dimulai dari 0."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 py-2">
                        <div>
                            <Label htmlFor="nama_produk" className="text-xs font-medium">Nama Produk</Label>
                            <Input
                                id="nama_produk"
                                type="text"
                                placeholder="Contoh: Grip Raket Handuk"
                                value={form.data.nama_produk}
                                onChange={(e) => form.setData("nama_produk", e.target.value)}
                                className="h-10 mt-1 text-xs"
                            />
                            {form.errors.nama_produk && (
                                <p className="text-xs text-destructive mt-1">{form.errors.nama_produk}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="form_kategori" className="text-xs font-medium">Kategori</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    id="form_kategori"
                                    type="text"
                                    placeholder="Ketik kategori atau pilih di kanan"
                                    value={form.data.kategori}
                                    onChange={(e) => form.setData("kategori", e.target.value)}
                                    className="h-10 text-xs flex-1"
                                />
                                {kategoriList.length > 0 && (
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) form.setData("kategori", e.target.value);
                                        }}
                                        className="h-10 px-2 rounded-md border border-input bg-background text-xs"
                                    >
                                        <option value="">Pilih Opsi</option>
                                        {kategoriList.map((kat) => (
                                            <option key={kat} value={kat}>{kat}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            {form.errors.kategori && (
                                <p className="text-xs text-destructive mt-1">{form.errors.kategori}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="gambar_produk" className="text-xs font-medium">Foto Produk (Opsional)</Label>
                            <div className="mt-1 flex items-start gap-3">
                                {previewUrl ? (
                                    <div className="relative size-16 rounded-md border border-border overflow-hidden shrink-0 bg-muted/20">
                                        <img
                                            src={previewUrl}
                                            alt="Pratinjau foto produk"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="size-16 rounded-md border border-dashed border-border bg-muted/10 flex items-center justify-center text-[10px] text-muted-foreground shrink-0 text-center px-1">
                                        Tanpa Foto
                                    </div>
                                )}

                                <div className="flex-1 flex flex-col gap-1.5">
                                    <Input
                                        id="gambar_produk"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            form.setData("gambar", file);
                                            form.setData("hapus_gambar", false);
                                            if (file) {
                                                setPreviewUrl(URL.createObjectURL(file));
                                            }
                                        }}
                                        className="h-9 text-xs file:text-xs file:font-medium file:text-foreground cursor-pointer"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-muted-foreground">
                                            Maksimal 2 MB (JPG, JPEG, PNG, WEBP).
                                        </span>
                                        {previewUrl && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    form.setData("gambar", null);
                                                    form.setData("hapus_gambar", true);
                                                    setPreviewUrl(null);
                                                }}
                                                className="text-[11px] text-destructive hover:underline font-medium cursor-pointer"
                                            >
                                                Hapus Gambar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {form.errors.gambar && (
                                <p className="text-xs text-destructive mt-1">{form.errors.gambar}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="harga" className="text-xs font-medium">Harga Jual (Rp)</Label>
                                <Input
                                    id="harga"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Contoh: 15000"
                                    value={form.data.harga ? Number(form.data.harga.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                                    onChange={(e) => form.setData("harga", e.target.value.replace(/\D/g, ""))}
                                    className="h-10 mt-1 tabular-nums text-right text-xs"
                                />
                                {form.errors.harga && (
                                    <p className="text-xs text-destructive mt-1">{form.errors.harga}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="stok_minimum" className="text-xs font-medium">Stok Minimum</Label>
                                <Input
                                    id="stok_minimum"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Contoh: 5"
                                    value={form.data.stok_minimum}
                                    onChange={(e) => form.setData("stok_minimum", e.target.value.replace(/\D/g, ""))}
                                    className="h-10 mt-1 tabular-nums text-right text-xs"
                                />
                                {form.errors.stok_minimum && (
                                    <p className="text-xs text-destructive mt-1">{form.errors.stok_minimum}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="status_produk" className="text-xs font-medium">Status Produk</Label>
                            <select
                                id="status_produk"
                                value={form.data.status_produk}
                                onChange={(e) => form.setData("status_produk", e.target.value as "aktif" | "nonaktif")}
                                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="aktif">Aktif (Dapat dijual di POS)</option>
                                <option value="nonaktif">Nonaktif (Disembunyikan dari POS)</option>
                            </select>
                            {form.errors.status_produk && (
                                <p className="text-xs text-destructive mt-1">{form.errors.status_produk}</p>
                            )}
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="h-10 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs font-medium"
                            >
                                {form.processing ? "Menyimpan..." : "Simpan Produk"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </KasirLayout>
    );
}
