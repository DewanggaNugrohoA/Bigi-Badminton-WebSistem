import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatTanggal } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

interface ProdukItem {
    id_produk: number;
    nama_produk: string;
    stok: number;
    kategori: string;
}

interface RestockItem {
    id_restock: number;
    id_produk: number;
    id_user: number;
    jumlah: number;
    tanggal: string;
    keterangan: string | null;
    produk?: {
        nama_produk: string;
        kategori: string;
    };
    user?: {
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
    riwayatRestock: PaginatedData<RestockItem>;
    produkList: ProdukItem[];
    tanggalFilter: string;
}

export default function RestockIndex({ riwayatRestock, produkList, tanggalFilter }: Props) {
    const [tanggal, setTanggal] = useState(tanggalFilter || "");

    const form = useForm({
        id_produk: produkList.length > 0 ? String(produkList[0].id_produk) : "",
        jumlah: "",
        tanggal: new Date().toISOString().substring(0, 10),
        keterangan: "",
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get("/kasir/restock", { tanggal }, { preserveState: true });
    };

    const handleReset = () => {
        setTanggal("");
        router.get("/kasir/restock", {}, { preserveState: true });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            jumlah: data.jumlah.replace(/\D/g, ""),
        }));
        form.post("/kasir/restock", {
            onSuccess: () => {
                form.reset("jumlah", "keterangan");
            },
        });
    };

    return (
        <KasirLayout title="Restock Barang">
            <Head title="Restock Barang - Bigi Badminton" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 xl:col-span-4 bg-card border border-border rounded-xl p-6 shadow-xs">
                    <div className="border-b border-border pb-4 mb-5">
                        <h2 className="text-base font-semibold text-foreground">Form Tambah Stok</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Catat penambahan barang masuk ke gudang/toko kasir.
                        </p>
                    </div>

                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                        <div>
                            <Label htmlFor="id_produk" className="text-xs font-medium">Pilih Produk</Label>
                            <select
                                id="id_produk"
                                value={form.data.id_produk}
                                onChange={(e) => form.setData("id_produk", e.target.value)}
                                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {produkList.map((prod) => (
                                    <option key={prod.id_produk} value={prod.id_produk}>
                                        {prod.nama_produk} (Stok: {prod.stok})
                                    </option>
                                ))}
                            </select>
                            {form.errors.id_produk && (
                                <p className="text-xs text-destructive mt-1">{form.errors.id_produk}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="jumlah" className="text-xs font-medium">Jumlah Masuk (Unit)</Label>
                            <Input
                                id="jumlah"
                                type="text"
                                inputMode="numeric"
                                placeholder="Contoh: 24"
                                value={form.data.jumlah}
                                onChange={(e) => form.setData("jumlah", e.target.value.replace(/\D/g, ""))}
                                className="h-10 mt-1 tabular-nums text-xs"
                            />
                            {form.errors.jumlah && (
                                <p className="text-xs text-destructive mt-1">{form.errors.jumlah}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="tanggal_restock" className="text-xs font-medium">Tanggal Barang Masuk</Label>
                            <Input
                                id="tanggal_restock"
                                type="date"
                                max={new Date().toISOString().substring(0, 10)}
                                value={form.data.tanggal}
                                onChange={(e) => form.setData("tanggal", e.target.value)}
                                className="h-10 mt-1 text-xs"
                            />
                            {form.errors.tanggal && (
                                <p className="text-xs text-destructive mt-1">{form.errors.tanggal}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="keterangan" className="text-xs font-medium">Keterangan (Opsional)</Label>
                            <Textarea
                                id="keterangan"
                                rows={2}
                                placeholder="Contoh: Pembelian supplier Toko ABC"
                                value={form.data.keterangan}
                                onChange={(e) => form.setData("keterangan", e.target.value)}
                                className="mt-1 text-xs resize-none"
                            />
                            {form.errors.keterangan && (
                                <p className="text-xs text-destructive mt-1">{form.errors.keterangan}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={form.processing || !form.data.jumlah || !form.data.id_produk}
                            className="w-full h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs font-medium mt-2"
                        >
                            <Plus className="size-4 mr-1.5" />
                            {form.processing ? "Menyimpan..." : "Simpan Restock"}
                        </Button>
                    </form>
                </div>

                <div className="lg:col-span-7 xl:col-span-8 bg-card border border-border rounded-xl p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-4">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Riwayat Barang Masuk</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Daftar restock yang pernah dicatat.</p>
                        </div>

                        <form onSubmit={handleFilter} className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="h-9 text-xs w-36"
                            />
                            <Button type="submit" variant="outline" size="sm" className="h-9 text-xs">
                                Filter
                            </Button>
                            {tanggal && (
                                <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="h-9 text-xs">
                                    Reset
                                </Button>
                            )}
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">Tanggal</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Produk</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Jumlah</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Kasir</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Keterangan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {riwayatRestock.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                                            Belum ada catatan restock.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    riwayatRestock.data.map((item) => (
                                        <TableRow key={item.id_restock}>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {formatTanggal(item.tanggal)}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                                                {item.produk?.nama_produk || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap">
                                                +{item.jumlah}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {item.user?.nama || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                {item.keterangan || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {riwayatRestock.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
                            <span className="text-muted-foreground">
                                Halaman {riwayatRestock.current_page} dari {riwayatRestock.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!riwayatRestock.prev_page_url}
                                    onClick={() => riwayatRestock.prev_page_url && router.get(riwayatRestock.prev_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!riwayatRestock.next_page_url}
                                    onClick={() => riwayatRestock.next_page_url && router.get(riwayatRestock.next_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </KasirLayout>
    );
}
