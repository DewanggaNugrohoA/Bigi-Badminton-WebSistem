import { useState, useMemo } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatRupiah } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

interface ProdukItem {
    id_produk: number;
    nama_produk: string;
    kategori: string;
    harga: number;
    stok: number;
    stok_minimum: number;
    status_produk: string;
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

export default function KasirIndex({ shiftAktif, produk, kategoriList }: Props) {
    const [search, setSearch] = useState("");
    const [selectedKategori, setSelectedKategori] = useState<string>("semua");
    const [cart, setCart] = useState<CartItem[]>([]);

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

    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + Number(item.produk.harga) * item.jumlah, 0);
    }, [cart]);

    const total = subtotal;

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
            },
        });
    };

    if (!shiftAktif) {
        return (
            <KasirLayout title="Penjualan POS" shiftAktif={null}>
                <Head title="Penjualan POS - Bigi Badminton" />
                <div className="bg-card border border-border rounded-xl p-8 max-w-xl mx-auto text-center mt-8">
                    <h2 className="text-lg font-semibold text-foreground">Shift Belum Dibuka</h2>
                    <p className="text-sm text-muted-foreground mt-2 mb-6">
                        Anda harus membuka shift kasir terlebih dahulu sebelum dapat memproses transaksi penjualan.
                    </p>
                    <Link href="/kasir/shift">
                        <Button className="w-full sm:w-auto h-10 px-6 font-medium">
                            Buka Shift Sekarang
                        </Button>
                    </Link>
                </div>
            </KasirLayout>
        );
    }

    return (
        <KasirLayout title="Penjualan POS" shiftAktif={shiftAktif}>
            <Head title="Penjualan POS - Bigi Badminton" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 min-w-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari nama produk..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10"
                                aria-label="Cari produk"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setSelectedKategori("semua")}
                                className={`h-10 px-3.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                                    selectedKategori === "semua"
                                        ? "bg-foreground text-background border-foreground"
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
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-card text-muted-foreground border-border hover:text-foreground"
                                    }`}
                                >
                                    {kat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredProduk.length === 0 ? (
                            <div className="col-span-full bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                                Tidak ada produk yang sesuai kriteria pencarian.
                            </div>
                        ) : (
                            filteredProduk.map((item) => {
                                const isOutOfStock = item.stok <= 0;
                                const isLowStock = !isOutOfStock && item.stok <= item.stok_minimum;

                                return (
                                    <button
                                        key={item.id_produk}
                                        type="button"
                                        disabled={isOutOfStock}
                                        onClick={() => addToCart(item)}
                                        aria-label={`Tambah ${item.nama_produk}`}
                                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all select-none min-h-[120px] ${
                                            isOutOfStock
                                                ? "opacity-50 cursor-not-allowed bg-muted/40 border-border"
                                                : "bg-card border-border hover:border-foreground/40 active:scale-[0.98] cursor-pointer"
                                        }`}
                                    >
                                        <div>
                                            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                                                {item.kategori}
                                            </div>
                                            <h3 className="text-sm font-semibold text-foreground mt-0.5 line-clamp-2">
                                                {item.nama_produk}
                                            </h3>
                                        </div>

                                        <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                                            <span className="text-xs font-semibold tabular-nums text-foreground">
                                                {formatRupiah(item.harga)}
                                            </span>

                                            {isOutOfStock ? (
                                                <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                                                    Habis
                                                </Badge>
                                            ) : isLowStock ? (
                                                <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                                                    Sisa {item.stok}
                                                </Badge>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                                    Stok {item.stok}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
                    <form
                        onSubmit={handleSubmitCheckout}
                        className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs"
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <h2 className="text-base font-semibold text-foreground">Keranjang Penjualan</h2>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {cart.length} item
                            </span>
                        </div>

                        {errors.items && (
                            <div className="text-xs text-destructive">{errors.items}</div>
                        )}

                        <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                            {cart.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground text-xs">
                                    Keranjang masih kosong. Klik produk di sebelah kiri untuk menambahkan.
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div
                                        key={item.produk.id_produk}
                                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border/60"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium text-foreground truncate">
                                                {item.produk.nama_produk}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground tabular-nums">
                                                {formatRupiah(item.produk.harga)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => updateQty(item.produk.id_produk, -1)}
                                                className="size-7 rounded-md"
                                                aria-label="Kurangi jumlah"
                                            >
                                                <Minus className="size-3" />
                                            </Button>

                                            <span className="text-xs font-semibold tabular-nums min-w-[20px] text-center">
                                                {item.jumlah}
                                            </span>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => updateQty(item.produk.id_produk, 1)}
                                                disabled={item.jumlah >= item.produk.stok}
                                                className="size-7 rounded-md"
                                                aria-label="Tambah jumlah"
                                            >
                                                <Plus className="size-3" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFromCart(item.produk.id_produk)}
                                                className="size-7 rounded-md text-muted-foreground hover:text-destructive"
                                                aria-label="Hapus dari keranjang"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>

                                        <div className="text-xs font-semibold text-right tabular-nums min-w-[65px] shrink-0">
                                            {formatRupiah(Number(item.produk.harga) * item.jumlah)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-border pt-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                                <span>Total Tagihan</span>
                                <span className="tabular-nums text-base">{formatRupiah(total)}</span>
                            </div>
                        </div>

                        <div className="border-t border-border pt-3 flex flex-col gap-3">
                            <div>
                                <Label className="text-xs font-medium">Metode Pembayaran</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setData("metode_bayar", "tunai")}
                                        className={`h-10 rounded-lg text-xs font-medium border transition-colors ${
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
                                        className={`h-10 rounded-lg text-xs font-medium border transition-colors ${
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
                                <div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-lg border border-border/60">
                                    <div>
                                        <Label htmlFor="uang_diterima" className="text-xs font-medium">
                                            Uang Diterima (Rp)
                                        </Label>
                                        <Input
                                            id="uang_diterima"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Contoh: 50000"
                                            value={data.uang_diterima ? Number(data.uang_diterima).toLocaleString("id-ID") : ""}
                                            onChange={handleUangDiterimaChange}
                                            className="h-10 mt-1 tabular-nums text-right font-medium"
                                        />
                                        {errors.uang_diterima && (
                                            <p className="text-xs text-destructive mt-1">{errors.uang_diterima}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                                        <span className="text-muted-foreground">Kembalian:</span>
                                        <span className="font-semibold text-foreground tabular-nums">
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
                        </div>

                        <Button
                            type="submit"
                            disabled={
                                cart.length === 0 ||
                                processing ||
                                (data.metode_bayar === "tunai" && parsedUangDiterima < total)
                            }
                            className="w-full h-11 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-medium text-sm mt-1"
                        >
                            {processing ? "Memproses..." : "Selesaikan Penjualan"}
                        </Button>
                    </form>
                </div>
            </div>
        </KasirLayout>
    );
}
