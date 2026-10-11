import { Head, Link } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Printer, ArrowLeft } from "lucide-react";

interface DetailItem {
    id_detail: number;
    id_produk: number;
    jumlah: number;
    harga: number;
    subtotal: number;
    produk: {
        nama_produk: string;
    };
}

interface TransaksiData {
    id_transaksi: number;
    no_transaksi: string;
    tanggal: string;
    subtotal: number;
    diskon: number;
    total: number;
    metode_bayar: "tunai" | "qris";
    uang_diterima: number | null;
    kembalian: number | null;
    status_transaksi: string;
    catatan: string | null;
    user: {
        nama: string;
    };
    shift_kasir?: {
        id_shift: number;
    };
    detail_transaksi_pos: DetailItem[];
}

interface Props {
    transaksi: TransaksiData;
}

export default function StrukKasir({ transaksi }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <KasirLayout title="Struk Pembayaran">
            <Head title={`Struk ${transaksi.no_transaksi} - Bigi Badminton`} />

            <style>{`
                @media print {
                    aside, header, nav, .no-print {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print-area {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 auto !important;
                        max-width: 80mm !important;
                        width: 80mm !important;
                    }
                }
            `}</style>

            <div className="max-w-md mx-auto flex flex-col gap-4">
                <div className="flex items-center justify-between no-print">
                    <Link href="/kasir">
                        <Button variant="ghost" size="sm" className="h-9 text-xs">
                            <ArrowLeft className="size-4 mr-1.5" />
                            Kembali ke POS
                        </Button>
                    </Link>

                    <Button
                        type="button"
                        onClick={handlePrint}
                        className="h-9 px-4 text-xs font-medium bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white"
                    >
                        <Printer className="size-4 mr-1.5" />
                        Cetak Struk
                    </Button>
                </div>

                <div className="print-area bg-card border border-border rounded-xl p-6 shadow-xs font-mono text-xs">
                    <div className="text-center pb-4 border-b border-dashed border-border">
                        <h1 className="font-bold text-sm tracking-tight text-foreground">BIGI BADMINTON</h1>
                        <p className="text-[11px] text-muted-foreground mt-0.5">GOR Badminton 2 Lapangan</p>
                        <p className="text-[10px] text-muted-foreground">Komp. Olahraga, Bengkulu</p>
                    </div>

                    <div className="py-3 border-b border-dashed border-border flex flex-col gap-1 text-[11px] text-muted-foreground">
                        <div className="flex justify-between">
                            <span>No. Transaksi</span>
                            <span className="font-semibold text-foreground">{transaksi.no_transaksi}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Waktu</span>
                            <span className="text-foreground">
                                {formatTanggal(transaksi.tanggal)} {formatJam(transaksi.tanggal.substring(11, 16))}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kasir</span>
                            <span className="text-foreground">{transaksi.user?.nama || "Kasir"}</span>
                        </div>
                    </div>

                    <div className="py-3 border-b border-dashed border-border flex flex-col gap-2">
                        {transaksi.detail_transaksi_pos.map((item) => (
                            <div key={item.id_detail} className="flex flex-col gap-0.5">
                                <div className="text-foreground font-medium truncate">
                                    {item.produk.nama_produk}
                                </div>
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>
                                        {item.jumlah} x {formatRupiah(item.harga)}
                                    </span>
                                    <span className="text-foreground font-semibold tabular-nums">
                                        {formatRupiah(item.subtotal)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="py-3 border-b border-dashed border-border flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="tabular-nums">{formatRupiah(transaksi.subtotal)}</span>
                        </div>
                        {Number(transaksi.diskon) > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Diskon</span>
                                <span className="tabular-nums">-{formatRupiah(transaksi.diskon)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t border-border/40">
                            <span>TOTAL</span>
                            <span className="tabular-nums">{formatRupiah(transaksi.total)}</span>
                        </div>
                    </div>

                    <div className="py-3 border-b border-dashed border-border flex flex-col gap-1 text-[11px] text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Metode Bayar</span>
                            <span className="font-semibold uppercase text-foreground">{transaksi.metode_bayar}</span>
                        </div>
                        {transaksi.metode_bayar === "tunai" && (
                            <>
                                <div className="flex justify-between">
                                    <span>Uang Diterima</span>
                                    <span className="tabular-nums text-foreground">
                                        {formatRupiah(transaksi.uang_diterima || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold text-foreground">
                                    <span>Kembalian</span>
                                    <span className="tabular-nums">{formatRupiah(transaksi.kembalian || 0)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-4 text-center text-[10px] text-muted-foreground">
                        <p>Terima kasih atas kunjungan Anda!</p>
                        <p className="mt-0.5">Barang yang sudah dibeli tidak dapat ditukar.</p>
                    </div>
                </div>
            </div>
        </KasirLayout>
    );
}
