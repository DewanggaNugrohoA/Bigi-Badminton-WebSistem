import { useState, useMemo } from "react";
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
    kategoriList?: string[];
    tanggalFilter: string;
}

export default function RestockIndex({ riwayatRestock, produkList, kategoriList = [], tanggalFilter }: Props) {
    const [tanggal, setTanggal] = useState(tanggalFilter || "");

    const [isNewProductMode, setIsNewProductMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProdukItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const form = useForm({
        id_produk: "",
        nama_produk: "",
        kategori: "",
        harga: "",
        jumlah: "",
        tanggal: new Date().toISOString().substring(0, 10),
        keterangan: "",
    });

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredProduk = useMemo(() => {
        if (!normalizedQuery) return produkList;
        return produkList.filter((p) => p.nama_produk.toLowerCase().includes(normalizedQuery));
    }, [produkList, normalizedQuery]);

    const exactMatch = useMemo(() => {
        if (!normalizedQuery) return null;
        return produkList.find((p) => p.nama_produk.trim().toLowerCase() === normalizedQuery);
    }, [produkList, normalizedQuery]);

    const handleSelectExistingProduct = (prod: ProdukItem) => {
        setSelectedProduct(prod);
        setIsNewProductMode(false);
        setSearchQuery(prod.nama_produk);
        setIsDropdownOpen(false);

        form.setData((prev) => ({
            ...prev,
            id_produk: String(prod.id_produk),
            nama_produk: "",
            kategori: "",
            harga: "",
        }));
        form.clearErrors("id_produk", "nama_produk", "kategori", "harga");
    };

    const handleSelectAddNewProduct = (namaBaru: string) => {
        setSelectedProduct(null);
        setIsNewProductMode(true);
        setSearchQuery(namaBaru);
        setIsDropdownOpen(false);

        form.setData((prev) => ({
            ...prev,
            id_produk: "",
            nama_produk: namaBaru,
            kategori: kategoriList.length > 0 ? kategoriList[0] : "",
            harga: "",
        }));
        form.clearErrors("id_produk", "nama_produk", "kategori", "harga");
    };

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

        const cleanedJumlah = form.data.jumlah.replace(/\D/g, "");
        const cleanedHarga = form.data.harga.replace(/\D/g, "");

        form.transform((data) => {
            if (isNewProductMode) {
                return {
                    nama_produk: data.nama_produk.trim(),
                    kategori: data.kategori.trim(),
                    harga: cleanedHarga,
                    jumlah: cleanedJumlah,
                    tanggal: data.tanggal,
                    keterangan: data.keterangan,
                };
            }
            return {
                id_produk: data.id_produk,
                jumlah: cleanedJumlah,
                tanggal: data.tanggal,
                keterangan: data.keterangan,
            };
        });

        form.post("/kasir/restock", {
            onSuccess: () => {
                form.reset("jumlah", "keterangan");
            },
        });
    };

    const currentStockDisplay = isNewProductMode || !selectedProduct ? "-" : String(selectedProduct.stok);
    const isSubmitDisabled = form.processing || !form.data.jumlah || (!selectedProduct && !isNewProductMode);

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
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                            <div className="sm:col-span-8 relative">
                                <Label htmlFor="cari_produk" className="text-xs font-medium">Produk</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="cari_produk"
                                        type="text"
                                        placeholder="Ketik nama produk..."
                                        value={searchQuery}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSearchQuery(val);
                                            setIsDropdownOpen(true);
                                            if (selectedProduct && val !== selectedProduct.nama_produk) {
                                                setSelectedProduct(null);
                                                form.setData("id_produk", "");
                                            }
                                        }}
                                        className="h-10 text-xs"
                                        autoComplete="off"
                                    />

                                    {isDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsDropdownOpen(false)}
                                            />
                                            <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-md py-1 text-xs">
                                                {filteredProduk.map((prod) => (
                                                    <button
                                                        key={prod.id_produk}
                                                        type="button"
                                                        onClick={() => handleSelectExistingProduct(prod)}
                                                        className="w-full text-left px-3 py-2 text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-between cursor-pointer"
                                                    >
                                                        <span className="font-medium truncate">{prod.nama_produk}</span>
                                                    </button>
                                                ))}

                                                {!exactMatch && searchQuery.trim().length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectAddNewProduct(searchQuery.trim())}
                                                        className="w-full text-left px-3 py-2 text-[var(--brand)] hover:bg-accent flex items-center border-t border-border cursor-pointer font-medium"
                                                    >
                                                        Tambah produk baru: {searchQuery.trim()}
                                                    </button>
                                                )}

                                                {filteredProduk.length === 0 && searchQuery.trim().length === 0 && (
                                                    <div className="px-3 py-2 text-muted-foreground text-center">
                                                        Ketik nama untuk mencari
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {form.errors.id_produk && (
                                    <p className="text-xs text-destructive mt-1">{form.errors.id_produk}</p>
                                )}
                                {form.errors.nama_produk && (
                                    <p className="text-xs text-destructive mt-1">{form.errors.nama_produk}</p>
                                )}
                            </div>

                            <div className="sm:col-span-4">
                                <Label htmlFor="stok_saat_ini" className="text-xs font-medium">Stok Saat Ini</Label>
                                <Input
                                    id="stok_saat_ini"
                                    type="text"
                                    readOnly
                                    tabIndex={-1}
                                    aria-label="Stok saat ini"
                                    value={currentStockDisplay}
                                    className="h-10 mt-1 tabular-nums text-center text-xs bg-muted/40 cursor-default select-none focus-visible:ring-0 focus-visible:outline-none"
                                />
                            </div>
                        </div>

                        {isNewProductMode && (
                            <div className="flex flex-col gap-4 p-3.5 rounded-lg border border-border/80 bg-muted/20">
                                <div>
                                    <Label htmlFor="form_kategori" className="text-xs font-medium">Kategori Produk Baru</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            id="form_kategori"
                                            type="text"
                                            placeholder="Ketik atau pilih kategori"
                                            value={form.data.kategori}
                                            onChange={(e) => form.setData("kategori", e.target.value)}
                                            className="h-10 text-xs flex-1 bg-background"
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
                                    <Label htmlFor="harga" className="text-xs font-medium">Harga Jual (Rp)</Label>
                                    <Input
                                        id="harga"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Contoh: 25000"
                                        value={form.data.harga ? Number(form.data.harga.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                                        onChange={(e) => form.setData("harga", e.target.value.replace(/\D/g, ""))}
                                        className="h-10 mt-1 tabular-nums text-right text-xs bg-background"
                                    />
                                    {form.errors.harga && (
                                        <p className="text-xs text-destructive mt-1">{form.errors.harga}</p>
                                    )}
                                </div>
                            </div>
                        )}

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
                            disabled={isSubmitDisabled}
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
