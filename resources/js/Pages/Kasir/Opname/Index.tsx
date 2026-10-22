import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatTanggal } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { ClipboardCheck } from "lucide-react";

interface ProdukItem {
    id_produk: number;
    nama_produk: string;
    stok: number;
    kategori: string;
}

interface OpnameHistoryItem {
    id_opname: number;
    id_produk: number;
    id_user: number;
    stok_sistem: number;
    stok_fisik: number;
    selisih: number;
    tanggal: string;
    keterangan: string | null;
    produk?: {
        nama_produk: string;
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
    riwayatOpname: PaginatedData<OpnameHistoryItem>;
    produkList: ProdukItem[];
    tanggalFilter: string;
}

export default function OpnameIndex({ riwayatOpname, produkList, tanggalFilter }: Props) {
    const [tanggal, setTanggal] = useState(tanggalFilter || "");
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const [selectedProdukId, setSelectedProdukId] = useState<string>(
        produkList.length > 0 ? String(produkList[0].id_produk) : ""
    );
    const [stokFisikInput, setStokFisikInput] = useState<string>("");
    const [keteranganInput, setKeteranganInput] = useState<string>("");

    const selectedProduk = produkList.find((p) => String(p.id_produk) === selectedProdukId);
    const stokSistem = selectedProduk ? selectedProduk.stok : 0;
    const stokFisikParsed = stokFisikInput !== "" ? Number(stokFisikInput.replace(/\D/g, "")) : stokSistem;
    const selisih = stokFisikParsed - stokSistem;

    const form = useForm({
        items: [] as Array<{
            id_produk: number;
            stok_fisik: number;
            keterangan: string;
        }>,
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get("/kasir/opname", { tanggal }, { preserveState: true });
    };

    const handleReset = () => {
        setTanggal("");
        router.get("/kasir/opname", {}, { preserveState: true });
    };

    const handleOpenConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduk) return;
        setConfirmModalOpen(true);
    };

    const handleConfirmSubmit = () => {
        if (!selectedProduk) return;

        form.transform(() => ({
            items: [
                {
                    id_produk: selectedProduk.id_produk,
                    stok_fisik: stokFisikParsed,
                    keterangan: keteranganInput,
                },
            ],
        }));

        form.post("/kasir/opname", {
            onSuccess: () => {
                setConfirmModalOpen(false);
                setStokFisikInput("");
                setKeteranganInput("");
            },
        });
    };

    return (
        <KasirLayout title="Stock Opname">
            <Head title="Stock Opname - Bigi Badminton" />

            <div className="flex flex-col gap-6">
                {/* Form Stock Opname */}
                <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs">
                    <div className="border-b border-border pb-3.5 mb-5">
                        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <ClipboardCheck className="size-4.5 text-[var(--brand)]" />
                            Form Penyesuaian Stok (Stock Opname)
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Cocokkan stok sistem dengan perhitungan fisik langsung di toko.
                        </p>
                    </div>

                    <form onSubmit={handleOpenConfirm} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                            <div className="sm:col-span-2 lg:col-span-4">
                                <Label htmlFor="id_produk" className="text-xs font-medium">Pilih Produk</Label>
                                <select
                                    id="id_produk"
                                    value={selectedProdukId}
                                    onChange={(e) => {
                                        setSelectedProdukId(e.target.value);
                                        setStokFisikInput("");
                                    }}
                                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {produkList.map((prod) => (
                                        <option key={prod.id_produk} value={prod.id_produk}>
                                            {prod.nama_produk} ({prod.kategori})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-1 lg:col-span-3">
                                <Label className="text-xs font-medium">Catatan Sistem vs Selisih</Label>
                                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/30 border border-border/70 h-10 items-center text-xs mt-1">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block leading-tight">Sistem:</span>
                                        <span className="font-semibold tabular-nums text-foreground">{stokSistem} unit</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block leading-tight">Selisih:</span>
                                        <span className="font-semibold tabular-nums">
                                            {selisih === 0 ? (
                                                <span className="text-muted-foreground">0 (Sesuai)</span>
                                            ) : selisih > 0 ? (
                                                <span className="text-amber-500 font-bold">+{selisih}</span>
                                            ) : (
                                                <span className="text-destructive font-bold">{selisih}</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-1 lg:col-span-2">
                                <Label htmlFor="stok_fisik" className="text-xs font-medium">Stok Fisik Dihitung</Label>
                                <Input
                                    id="stok_fisik"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={`Saat ini ${stokSistem}`}
                                    value={stokFisikInput}
                                    onChange={(e) => setStokFisikInput(e.target.value.replace(/\D/g, ""))}
                                    className="h-10 mt-1 tabular-nums text-xs"
                                />
                            </div>

                            {selisih === 0 && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                    <Button
                                        type="submit"
                                        disabled={form.processing || !selectedProduk}
                                        className="w-full h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs font-medium"
                                    >
                                        <ClipboardCheck className="size-4 mr-1.5" />
                                        Sesuaikan Stok Opname
                                    </Button>
                                </div>
                            )}
                        </div>

                        {selisih !== 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end pt-1">
                                <div className="lg:col-span-9">
                                    <Label htmlFor="keterangan" className="text-xs font-medium text-destructive">
                                        Alasan Selisih (Wajib diisi jika terdapat selisih fisik vs sistem)
                                    </Label>
                                    <Input
                                        id="keterangan"
                                        type="text"
                                        placeholder="Contoh: Barang rusak/bocor, hilang saat display, salah hitung saat restock..."
                                        value={keteranganInput}
                                        onChange={(e) => setKeteranganInput(e.target.value)}
                                        className="h-10 mt-1 text-xs"
                                    />
                                </div>
                                <div className="lg:col-span-3">
                                    <Button
                                        type="submit"
                                        disabled={
                                            form.processing ||
                                            !selectedProduk ||
                                            !keteranganInput.trim()
                                        }
                                        className="w-full h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs font-medium"
                                    >
                                        <ClipboardCheck className="size-4 mr-1.5" />
                                        Sesuaikan Stok Opname
                                    </Button>
                                </div>
                            </div>
                        )}

                        {form.errors.items && (
                            <p className="text-xs text-destructive">{form.errors.items}</p>
                        )}
                    </form>
                </div>

                {/* Riwayat Stock Opname (Full-Width Card) */}
                <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-4">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Riwayat Stock Opname</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Catatan penyesuaian fisik dan sistem.</p>
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
                                    <TableHead className="whitespace-nowrap text-xs w-44">Tanggal</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs min-w-[140px]">Produk</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right w-20">Sistem</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right w-20">Fisik</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right w-24">Selisih</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs min-w-[110px]">Kasir</TableHead>
                                    <TableHead className="text-xs min-w-[200px]">Keterangan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {riwayatOpname.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                                            Belum ada catatan stock opname.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    riwayatOpname.data.map((item) => (
                                        <TableRow key={item.id_opname}>
                                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                                {formatTanggal(item.tanggal)}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-foreground">
                                                {item.produk?.nama_produk || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right text-muted-foreground">
                                                {item.stok_sistem}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right font-bold text-foreground">
                                                {item.stok_fisik}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right">
                                                {item.selisih === 0 ? (
                                                    <Badge variant="neutral" className="text-[11px] py-0 px-2 font-medium">0</Badge>
                                                ) : item.selisih > 0 ? (
                                                    <Badge variant="warning" className="text-[11px] py-0 px-2 font-semibold">+{item.selisih}</Badge>
                                                ) : (
                                                    <Badge variant="danger" className="text-[11px] py-0 px-2 font-semibold">{item.selisih}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {item.user?.nama || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-foreground/85 break-words">
                                                {item.keterangan || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {riwayatOpname.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
                            <span className="text-muted-foreground">
                                Halaman {riwayatOpname.current_page} dari {riwayatOpname.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!riwayatOpname.prev_page_url}
                                    onClick={() => riwayatOpname.prev_page_url && router.get(riwayatOpname.prev_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!riwayatOpname.next_page_url}
                                    onClick={() => riwayatOpname.next_page_url && router.get(riwayatOpname.next_page_url)}
                                    className="h-8 text-xs"
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Konfirmasi Penyesuaian Stok</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Stok produk di sistem akan langsung diperbarui sesuai jumlah hitung fisik yang Anda masukkan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-2.5 py-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Produk</span>
                            <span className="font-semibold text-foreground">{selectedProduk?.nama_produk}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Stok Sebelumnya</span>
                            <span className="tabular-nums text-foreground">{stokSistem} unit</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Stok Baru (Fisik)</span>
                            <span className="tabular-nums font-semibold text-foreground">{stokFisikParsed} unit</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Selisih</span>
                            <span className="tabular-nums font-semibold">
                                {selisih === 0 ? "0" : selisih > 0 ? `+${selisih}` : `${selisih}`}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmModalOpen(false)}
                            className="h-10 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            disabled={form.processing}
                            onClick={handleConfirmSubmit}
                            className="h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs font-medium"
                        >
                            {form.processing ? "Menyimpan..." : "Konfirmasi & Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </KasirLayout>
    );
}
