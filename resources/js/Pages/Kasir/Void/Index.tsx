import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
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
import { Ban, RotateCcw } from "lucide-react";

interface TransaksiBisaBatal {
    id_transaksi: number;
    no_transaksi: string;
    tanggal: string;
    total: number;
    metode_bayar: string;
    detail_transaksi_pos: Array<{
        id_detail: number;
        jumlah: number;
        harga: number;
        produk?: {
            nama_produk: string;
        };
    }>;
}

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

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

interface Props {
    shiftAktif: {
        id_shift: number;
        status: string;
        waktu_buka: string;
        modal_awal: number;
    } | null;
    transaksiBisaDibatalkan: TransaksiBisaBatal[];
    riwayatVoid: PaginatedData<ReturVoidItem>;
}

export default function VoidIndex({
    shiftAktif,
    transaksiBisaDibatalkan,
    riwayatVoid,
}: Props) {
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<TransaksiBisaBatal | null>(null);
    const [selectedJenis, setSelectedJenis] = useState<"void" | "retur">("void");

    const form = useForm({
        id_transaksi: 0,
        jenis: "void" as "void" | "retur",
        alasan: "",
    });

    const openActionDialog = (tx: TransaksiBisaBatal, jenis: "void" | "retur") => {
        setSelectedTx(tx);
        setSelectedJenis(jenis);
        form.setData({
            id_transaksi: tx.id_transaksi,
            jenis: jenis,
            alasan: "",
        });
        form.clearErrors();
        setActionDialogOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post("/kasir/void", {
            onSuccess: () => {
                setActionDialogOpen(false);
                form.reset();
            },
        });
    };

    return (
        <KasirLayout title="Void & Retur Transaksi" shiftAktif={shiftAktif}>
            <Head title="Void & Retur - Bigi Badminton" />

            <div className="flex flex-col gap-8">
                <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
                    <div className="border-b border-border pb-4 mb-4">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-base font-semibold text-foreground">Transaksi Shift Berjalan</h2>
                            {!shiftAktif && (
                                <Badge variant="neutral" className="text-xs py-0.5">Shift Belum Dibuka</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hanya transaksi selesai milik kasir Anda pada shift saat ini yang dapat dibatalkan (void) atau diretur. Stok produk akan dikembalikan secara otomatis.
                        </p>
                    </div>

                    {!shiftAktif ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            Buka shift terlebih dahulu untuk melihat dan mengelola transaksi berjalan.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap text-xs">No. Transaksi</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs">Waktu</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs">Rincian Item</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs text-right">Total</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs text-center">Metode</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transaksiBisaDibatalkan.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                                Belum ada transaksi selesai pada shift berjalan saat ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transaksiBisaDibatalkan.map((tx) => (
                                            <TableRow key={tx.id_transaksi}>
                                                <TableCell className="text-xs font-mono font-medium whitespace-nowrap">
                                                    {tx.no_transaksi}
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {formatJam(tx.tanggal.substring(11, 16))}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                                                    {tx.detail_transaksi_pos
                                                        .map((d) => `${d.produk?.nama_produk} (${d.jumlah})`)
                                                        .join(", ")}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap">
                                                    {formatRupiah(tx.total)}
                                                </TableCell>
                                                <TableCell className="text-center whitespace-nowrap">
                                                    <Badge variant="neutral" className="text-[11px] py-0 px-2 uppercase font-mono">
                                                        {tx.metode_bayar}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openActionDialog(tx, "void")}
                                                            className="h-8 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Ban className="size-3.5 mr-1" />
                                                            Void
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openActionDialog(tx, "retur")}
                                                            className="h-8 px-2 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                                        >
                                                            <RotateCcw className="size-3.5 mr-1" />
                                                            Retur
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
                    <div className="border-b border-border pb-4 mb-4">
                        <h2 className="text-base font-semibold text-foreground">Riwayat Void & Retur Saya</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Daftar pembatalan transaksi yang pernah Anda catat.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">No. Transaksi</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Jenis</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Alasan</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Total Transaksi</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Waktu Catat</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {riwayatVoid.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                            Belum ada riwayat void atau retur.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    riwayatVoid.data.map((item) => (
                                        <TableRow key={item.id_retur}>
                                            <TableCell className="text-xs font-mono font-medium whitespace-nowrap">
                                                {item.transaksi_pos?.no_transaksi || "-"}
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">
                                                <Badge
                                                    variant={item.jenis === "void" ? "danger" : "warning"}
                                                    className="text-[11px] py-0 px-2 uppercase font-mono"
                                                >
                                                    {item.jenis}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-foreground max-w-[240px] truncate">
                                                {item.alasan}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right font-semibold whitespace-nowrap">
                                                {formatRupiah(item.transaksi_pos?.total || 0)}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
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
                </div>
            </div>

            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Konfirmasi {selectedJenis === "void" ? "Void (Pembatalan)" : "Retur Barang"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Seluruh barang dalam transaksi {selectedTx?.no_transaksi} akan dikembalikan ke stok sistem secara langsung.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 py-2">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs flex flex-col gap-1.5">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nomor Transaksi:</span>
                                <span className="font-mono font-semibold text-foreground">{selectedTx?.no_transaksi}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Nilai:</span>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {formatRupiah(selectedTx?.total || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Metode Bayar:</span>
                                <span className="uppercase text-foreground">{selectedTx?.metode_bayar}</span>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="alasan" className="text-xs font-medium">
                                Alasan {selectedJenis === "void" ? "Void" : "Retur"} (Wajib, min. 5 karakter)
                            </Label>
                            <Textarea
                                id="alasan"
                                rows={3}
                                placeholder="Tuliskan alasan lengkap pembatalan transaksi..."
                                value={form.data.alasan}
                                onChange={(e) => form.setData("alasan", e.target.value)}
                                className="mt-1 text-xs resize-none"
                            />
                            {form.errors.alasan && (
                                <p className="text-xs text-destructive mt-1">{form.errors.alasan}</p>
                            )}
                            {form.errors.id_transaksi && (
                                <p className="text-xs text-destructive mt-1">{form.errors.id_transaksi}</p>
                            )}
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActionDialogOpen(false)}
                                className="h-10 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing || form.data.alasan.trim().length < 5}
                                className={`h-10 text-white text-xs font-medium ${
                                    selectedJenis === "void"
                                        ? "bg-destructive hover:bg-destructive/90"
                                        : "bg-amber-600 hover:bg-amber-700"
                                }`}
                            >
                                {form.processing ? "Menyimpan..." : `Konfirmasi ${selectedJenis === "void" ? "Void" : "Retur"}`}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </KasirLayout>
    );
}
