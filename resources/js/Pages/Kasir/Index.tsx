import { useState, useMemo } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatRupiah } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface ProdukItem {
    id_produk: number;
    nama_produk: string;
    kategori: string;
    harga: number;
    stok: number;
    stok_minimum: number;
    status_produk: string;
    url_gambar?: string | null;
}

interface CartItem {
    produk: ProdukItem;
    jumlah: number;
}

interface Props {
    shiftAktif: {
        id_shift: number;
        status: string;
        waktu_buka: string;
        modal_awal: number;
    } | null;
    produk: ProdukItem[];
    kategoriList: string[];
}

/**
 * Antarmuka Utama Kasir POS (Point of Sale).
 * Fitur utama:
 * - Peringatan pembukaan shift kasir jika belum ada shift aktif.
 * - Katalog produk cepat (grid kartu, filter kategori, pencarian).
 * - Keranjang belanja interaktif (tambah, kurang kuantitas, kalkulasi total).
 * - Modal checkout pembayaran (Tunai dengan hitung otomatis kembalian & QRIS).
 */
export default function KasirIndex({ shiftAktif, produk, kategoriList }: Props) {
    const [search, setSearch] = useState("");
    const [selectedKategori, setSelectedKategori] = useState<string>("semua");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        items: [] as Array<{ id_produk: number; jumlah: number }>,
        metode_bayar: "tunai" as "tunai" | "qris",
        uang_diterima: "",
        catatan: "",
    });

    const filteredProduk = useMemo(() => {
        return produk.filter((item) => {
            const matchSearch = item.nama_produk.toLowerCase().includes(search.toLowerCase());
            const matchKategori = selectedKategori === "semua" || item.kategori === selectedKategori;
            return matchSearch && matchKategori;
        });
    }, [produk, search, selectedKategori]);

    const addToCart = (item: ProdukItem) => {
        if (item.stok <= 0) return;

        setCart((prevCart) => {
            const existing = prevCart.find((c) => c.produk.id_produk === item.id_produk);
            if (existing) {
                if (existing.jumlah >= item.stok) return prevCart;
                return prevCart.map((c) =>
                    c.produk.id_produk === item.id_produk
                        ? { ...c, jumlah: c.jumlah + 1 }
                        : c
                );
            }
            return [...prevCart, { produk: item, jumlah: 1 }];
        });
    };

    const updateQty = (id_produk: number, delta: number) => {
        setCart((prevCart) => {
            return prevCart
                .map((item) => {
                    if (item.produk.id_produk === id_produk) {
                        const newQty = item.jumlah + delta;
                        if (newQty <= 0) return null;
                        if (newQty > item.produk.stok) return item;
                        return { ...item, jumlah: newQty };
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    };

    const removeFromCart = (id_produk: number) => {
        setCart((prevCart) => prevCart.filter((c) => c.produk.id_produk !== id_produk));
    };

    const clearCart = () => {
        setCart([]);
    };

    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + Number(item.produk.harga) * item.jumlah, 0);
    }, [cart]);

    const total = subtotal;

    const totalItemCount = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.jumlah, 0);
    }, [cart]);

    const parsedUangDiterima = useMemo(() => {
        if (!data.uang_diterima) return 0;
        const cleaned = data.uang_diterima.toString().replace(/\D/g, "");
        return Number(cleaned) || 0;
    }, [data.uang_diterima]);

    const kembalian = useMemo(() => {
        if (data.metode_bayar !== "tunai") return 0;
        return Math.max(0, parsedUangDiterima - total);
    }, [data.metode_bayar, parsedUangDiterima, total]);

    const handleUangDiterimaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "");
        setData("uang_diterima", raw);
    };

    const handleOpenPayment = () => {
        if (cart.length === 0) return;
        setIsMobileCartOpen(false);
        setIsPaymentOpen(true);
    };

    const handleSelectPresetUang = (nominal: number) => {
        setData("uang_diterima", String(nominal));
    };

    const handleSubmitCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0 || processing) return;

        const payloadItems = cart.map((c) => ({
            id_produk: c.produk.id_produk,
            jumlah: c.jumlah,
        }));

        transform(() => ({
            items: payloadItems,
            metode_bayar: data.metode_bayar,
            uang_diterima: data.metode_bayar === "tunai" ? String(parsedUangDiterima) : "",
            catatan: data.catatan || "",
        }));

        post("/kasir/checkout", {
            onSuccess: () => {
                setCart([]);
                reset();
                setIsPaymentOpen(false);
            },
        });
    };

    if (!shiftAktif) {
        return (
            <KasirLayout title="Penjualan POS" shiftAktif={null}>
                <Head title="Penjualan POS - Bigi Badminton" />
                <div className="max-w-xl mx-auto">
                    <div className="bg-card border border-border rounded-xl p-8 text-center mt-8 shadow-xs">
                        <h2 className="text-lg font-semibold text-foreground">Shift Belum Dibuka</h2>
                        <p className="text-sm text-muted-foreground mt-2 mb-6">
                            Anda harus membuka shift kasir terlebih dahulu sebelum dapat memproses transaksi penjualan POS.
                        </p>
                        <Link href="/kasir/shift">
                            <Button className="w-full sm:w-auto h-10 px-6 font-medium">
                                Buka Shift Sekarang
                            </Button>
                        </Link>
                    </div>
                </div>
            </KasirLayout>
        );
    }

    const renderCartItemsList = () => (
        <div className="flex-1 overflow-y-auto divide-y divide-border/60 -mx-4 px-4 sm:-mx-5 sm:px-5">
            {cart.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                    <p className="text-xs">Keranjang masih kosong.</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">Pilih produk di samping untuk menambahkan.</p>
                </div>
            ) : (
                cart.map((item) => (
                    <div key={item.produk.id_produk} className="py-3 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-foreground truncate">
                                {item.produk.nama_produk}
                            </div>
                            <div className="text-[11px] text-muted-foreground tabular-nums">
                                {formatRupiah(item.produk.harga)}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => updateQty(item.produk.id_produk, -1)}
                                className="size-7 rounded-md font-bold text-xs"
                                aria-label="Kurangi jumlah"
                            >
                                -
                            </Button>

                            <span className="w-7 text-center text-xs font-semibold tabular-nums">
                                {item.jumlah}
                            </span>

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => updateQty(item.produk.id_produk, 1)}
                                disabled={item.jumlah >= item.produk.stok}
                                className="size-7 rounded-md font-bold text-xs"
                                aria-label="Tambah jumlah"
                            >
                                +
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.produk.id_produk)}
                                className="h-7 px-2 text-xs rounded-md text-muted-foreground hover:text-destructive"
                                aria-label="Hapus dari keranjang"
                            >
                                Hapus
                            </Button>
                        </div>

                        <div className="text-xs font-semibold text-right tabular-nums min-w-[70px] shrink-0">
                            {formatRupiah(Number(item.produk.harga) * item.jumlah)}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderCartSummaryAndAction = () => (
        <div className="border-t border-border pt-4 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal ({totalItemCount} item)</span>
                <span className="tabular-nums font-medium text-foreground">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>Total Tagihan</span>
                <span className="tabular-nums text-base font-bold text-foreground">{formatRupiah(total)}</span>
            </div>

            <Button
                type="button"
                onClick={handleOpenPayment}
                disabled={cart.length === 0}
                className="w-full h-11 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-semibold text-sm shadow-xs"
            >
                Bayar ({formatRupiah(total)})
            </Button>
        </div>
    );

    return (
        <KasirLayout title="Penjualan POS" shiftAktif={shiftAktif} fullWidth>
            <Head title="Penjualan POS - Bigi Badminton" />

            <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
                <aside
                    aria-label="Keranjang Pesanan"
                    className="hidden md:flex flex-col w-[360px] lg:w-[400px] xl:w-[420px] bg-card border-r border-border p-4 sm:p-5 shrink-0 h-full overflow-hidden"
                >
                    <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-foreground">Pesanan Saat Ini</h2>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                ({cart.length} jenis)
                            </span>
                        </div>
                        {cart.length > 0 && (
                            <button
                                type="button"
                                onClick={clearCart}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
                            >
                                Kosongkan
                            </button>
                        )}
                    </div>

                    {renderCartItemsList()}
                    {renderCartSummaryAndAction()}
                </aside>

                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
                    <div className="p-3 sm:p-4 border-b border-border shrink-0 bg-background/95 backdrop-blur-xs flex flex-col sm:flex-row gap-2.5 sm:items-center">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Cari nama produk..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full bg-card"
                                aria-label="Cari produk"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedKategori("semua")}
                                className={`h-10 px-3.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                                    selectedKategori === "semua"
                                        ? "bg-foreground text-background border-foreground font-semibold"
                                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                                }`}
                            >
                                Semua
                            </button>
                            {kategoriList.map((kat) => (
                                <button
                                    key={kat}
                                    type="button"
                                    onClick={() => setSelectedKategori(kat)}
                                    className={`h-10 px-3.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                                        selectedKategori === kat
                                            ? "bg-foreground text-background border-foreground font-semibold"
                                            : "bg-card text-muted-foreground border-border hover:text-foreground"
                                    }`}
                                >
                                    {kat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 md:pb-4">
                        {filteredProduk.length === 0 ? (
                            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm max-w-md mx-auto my-12">
                                <p className="font-medium text-foreground">Tidak ada produk ditemukan</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Coba ubah kata kunci pencarian atau pilih kategori lain.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                                {filteredProduk.map((item) => {
                                    const isOutOfStock = item.stok <= 0;
                                    const isLowStock = !isOutOfStock && item.stok <= item.stok_minimum;
                                    const cartItem = cart.find((c) => c.produk.id_produk === item.id_produk);
                                    const cartQty = cartItem?.jumlah || 0;

                                    return (
                                        <button
                                            key={item.id_produk}
                                            type="button"
                                            disabled={isOutOfStock}
                                            onClick={() => addToCart(item)}
                                            aria-label={`Tambah ${item.nama_produk}`}
                                            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all select-none relative group min-h-[44px] ${
                                                isOutOfStock
                                                    ? "opacity-45 cursor-not-allowed bg-muted/40 border-border"
                                                    : "bg-card border-border hover:border-foreground/40 active:scale-[0.98] cursor-pointer shadow-2xs hover:shadow-xs"
                                            }`}
                                        >
                                            {cartQty > 0 && (
                                                <span className="absolute top-2 right-2 z-10 size-5 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                                                    {cartQty}
                                                </span>
                                            )}

                                            <div>
                                                <div className="w-full aspect-square rounded-lg overflow-hidden border border-border/60 bg-muted/20 mb-2.5 flex items-center justify-center">
                                                    {item.url_gambar ? (
                                                        <img
                                                            src={item.url_gambar}
                                                            alt={item.nama_produk}
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-muted/40 text-muted-foreground font-semibold text-base select-none uppercase tracking-wider">
                                                            {item.nama_produk.slice(0, 2)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pr-2">
                                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                                                        {item.kategori}
                                                    </div>
                                                    <h3 className="text-xs sm:text-sm font-semibold text-foreground mt-0.5 line-clamp-2 leading-tight">
                                                        {item.nama_produk}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                                                <span className="text-xs font-semibold tabular-nums text-foreground">
                                                    {formatRupiah(item.harga)}
                                                </span>

                                                {isOutOfStock ? (
                                                    <Badge variant="neutral" className="text-[9px] py-0 px-1.5 font-normal">
                                                        Habis
                                                    </Badge>
                                                ) : isLowStock ? (
                                                    <Badge variant="warning" className="text-[9px] py-0 px-1.5 font-normal">
                                                        Sisa {item.stok}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                                        Stok {item.stok}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <div className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border p-3 z-30 shadow-lg flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">Total Tagihan ({totalItemCount} item)</div>
                    <div className="text-sm font-bold text-foreground tabular-nums">{formatRupiah(total)}</div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsMobileCartOpen(true)}
                        className="h-10 px-3 text-xs font-medium"
                    >
                        Lihat Pesanan
                    </Button>
                    <Button
                        type="button"
                        onClick={handleOpenPayment}
                        disabled={cart.length === 0}
                        className="h-10 px-4 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs font-semibold"
                    >
                        Bayar
                    </Button>
                </div>
            </div>

            <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
                <SheetContent side="bottom" className="p-4 sm:p-5 h-[80vh] flex flex-col bg-card">
                    <SheetHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
                        <SheetTitle className="text-sm font-semibold">Pesanan Saat Ini ({cart.length} item)</SheetTitle>
                        {cart.length > 0 && (
                            <button
                                type="button"
                                onClick={clearCart}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
                            >
                                Kosongkan
                            </button>
                        )}
                    </SheetHeader>
                    {renderCartItemsList()}
                    {renderCartSummaryAndAction()}
                </SheetContent>
            </Sheet>

            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSubmitCheckout} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                            <DialogDescription>
                                Total tagihan: <span className="font-bold text-foreground tabular-nums">{formatRupiah(total)}</span>
                            </DialogDescription>
                        </DialogHeader>

                        {errors.items && (
                            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                                {errors.items}
                            </div>
                        )}

                        <div>
                            <Label className="text-xs font-medium">Metode Pembayaran</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                                <button
                                    type="button"
                                    onClick={() => setData("metode_bayar", "tunai")}
                                    className={`h-11 rounded-lg text-xs font-semibold border flex items-center justify-center transition-colors ${
                                        data.metode_bayar === "tunai"
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-card text-muted-foreground border-border hover:text-foreground"
                                    }`}
                                >
                                    Tunai
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData("metode_bayar", "qris")}
                                    className={`h-11 rounded-lg text-xs font-semibold border flex items-center justify-center transition-colors ${
                                        data.metode_bayar === "qris"
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-card text-muted-foreground border-border hover:text-foreground"
                                    }`}
                                >
                                    QRIS
                                </button>
                            </div>
                            {errors.metode_bayar && (
                                <p className="text-xs text-destructive mt-1">{errors.metode_bayar}</p>
                            )}
                        </div>

                        {data.metode_bayar === "tunai" && (
                            <div className="flex flex-col gap-2.5 bg-muted/30 p-3.5 rounded-lg border border-border/80">
                                <div>
                                    <Label htmlFor="uang_diterima" className="text-xs font-medium">
                                        Uang Diterima (Rp)
                                    </Label>
                                    <Input
                                        id="uang_diterima"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={data.uang_diterima ? Number(data.uang_diterima).toLocaleString("id-ID") : ""}
                                        onChange={handleUangDiterimaChange}
                                        className="h-10 mt-1 tabular-nums text-right font-semibold text-sm"
                                        autoFocus
                                    />
                                    {errors.uang_diterima && (
                                        <p className="text-xs text-destructive mt-1">{errors.uang_diterima}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectPresetUang(total)}
                                        className="text-[11px] px-2.5 py-1 rounded bg-card border border-border text-foreground hover:bg-muted font-medium tabular-nums"
                                    >
                                        Uang Pas
                                    </button>
                                    {[20000, 50000, 100000].map((nominal) => {
                                        if (nominal >= total) {
                                            return (
                                                <button
                                                    key={nominal}
                                                    type="button"
                                                    onClick={() => handleSelectPresetUang(nominal)}
                                                    className="text-[11px] px-2.5 py-1 rounded bg-card border border-border text-foreground hover:bg-muted font-medium tabular-nums"
                                                >
                                                    {formatRupiah(nominal)}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>

                                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                                    <span className="text-muted-foreground font-medium">Kembalian:</span>
                                    <span className="font-bold text-foreground tabular-nums text-sm">
                                        {formatRupiah(kembalian)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="catatan" className="text-xs font-medium">Catatan (Opsional)</Label>
                            <Textarea
                                id="catatan"
                                rows={2}
                                placeholder="Catatan transaksi..."
                                value={data.catatan}
                                onChange={(e) => setData("catatan", e.target.value)}
                                className="mt-1 text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPaymentOpen(false)}
                                className="h-10 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    cart.length === 0 ||
                                    processing ||
                                    (data.metode_bayar === "tunai" && parsedUangDiterima < total)
                                }
                                className="h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-semibold text-xs"
                            >
                                {processing ? "Memproses..." : "Selesaikan Transaksi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </KasirLayout>
    );
}
