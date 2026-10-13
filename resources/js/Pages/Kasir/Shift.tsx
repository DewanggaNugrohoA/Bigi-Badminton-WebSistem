import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import KasirLayout from "@/layouts/kasir-layout";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";

interface ShiftData {
    id_shift: number;
    id_user: number;
    waktu_buka: string;
    waktu_tutup: string | null;
    modal_awal: number;
    kas_sistem: number | null;
    kas_fisik: number | null;
    selisih: number | null;
    status: "terbuka" | "ditutup";
}

interface Ringkasan {
    total_tunai: number;
    total_non_tunai: number;
    jumlah_transaksi: number;
    expected_cash: number;
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
    shiftAktif: ShiftData | null;
    ringkasanShift: Ringkasan | null;
    riwayatShift: PaginatedData<ShiftData>;
}

export default function ShiftIndex({
    shiftAktif,
    ringkasanShift,
    riwayatShift,
}: Props) {
    const [tutupDialogOpen, setTutupDialogOpen] = useState(false);

    const bukaForm = useForm({
        modal_awal: "",
    });

    const tutupForm = useForm({
        kas_fisik: "",
    });

    const handleBukaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = bukaForm.data.modal_awal.replace(/\D/g, "");
        bukaForm.transform(() => ({
            modal_awal: cleaned,
        }));
        bukaForm.post("/kasir/shift/buka", {
            onSuccess: () => bukaForm.reset(),
        });
    };

    const handleTutupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = tutupForm.data.kas_fisik.replace(/\D/g, "");
        tutupForm.transform(() => ({
            kas_fisik: cleaned,
        }));
        tutupForm.post("/kasir/shift/tutup", {
            onSuccess: () => {
                setTutupDialogOpen(false);
                tutupForm.reset();
            },
        });
    };

    const formatSelisihBadge = (selisih: number | null) => {
        if (selisih === null) return "-";
        const val = Number(selisih);
        if (val === 0) {
            return (
                <Badge variant="neutral" className="text-xs tabular-nums">
                    Rp 0 (Pas)
                </Badge>
            );
        }
        if (val > 0) {
            return (
                <Badge variant="warning" className="text-xs tabular-nums">
                    +{formatRupiah(val)} (Lebih)
                </Badge>
            );
        }
        return (
            <Badge variant="danger" className="text-xs tabular-nums">
                {formatRupiah(val)} (Kurang)
            </Badge>
        );
    };

    return (
        <KasirLayout title="Manajemen Shift" shiftAktif={shiftAktif}>
            <Head title="Manajemen Shift - Bigi Badminton" />

            <div className="flex flex-col gap-8">
                {!shiftAktif ? (
                    <div className="bg-card border border-border rounded-xl p-6 sm:p-8 max-w-lg mx-auto w-full">
                        <div className="border-b border-border pb-4 mb-6">
                            <h2 className="text-base font-semibold text-foreground">Buka Shift Baru</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Masukkan jumlah modal kas awal di laci sebelum memulai operasional kasir.
                            </p>
                        </div>

                        <form onSubmit={handleBukaSubmit} className="flex flex-col gap-4">
                            <div>
                                <Label htmlFor="modal_awal" className="text-xs font-medium">
                                    Kas Awal (Rp)
                                </Label>
                                <Input
                                    id="modal_awal"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Contoh: 100000"
                                    value={bukaForm.data.modal_awal ? Number(bukaForm.data.modal_awal.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "");
                                        bukaForm.setData("modal_awal", raw);
                                    }}
                                    className="h-10 mt-1 tabular-nums text-right font-medium"
                                />
                                {bukaForm.errors.modal_awal && (
                                    <p className="text-xs text-destructive mt-1">{bukaForm.errors.modal_awal}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={bukaForm.processing || !bukaForm.data.modal_awal}
                                className="w-full h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-medium text-sm mt-2"
                            >
                                {bukaForm.processing ? "Membuka Shift..." : "Buka Shift"}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-base font-semibold text-foreground">Shift Sedang Berjalan</h2>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Dibuka pada {formatTanggal(shiftAktif.waktu_buka)}, pukul {formatJam(shiftAktif.waktu_buka.substring(11, 16))}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setTutupDialogOpen(true)}
                                className="h-10 px-4 text-xs font-medium border-destructive/40 text-destructive hover:bg-destructive/10"
                            >
                                Tutup Shift
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                            <div className="p-4 rounded-lg bg-muted/20 border border-border/60">
                                <span className="text-xs text-muted-foreground">Kas Awal</span>
                                <div className="text-base font-semibold text-foreground mt-1 tabular-nums">
                                    {formatRupiah(shiftAktif.modal_awal)}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/20 border border-border/60">
                                <span className="text-xs text-muted-foreground">Penjualan Tunai</span>
                                <div className="text-base font-semibold text-foreground mt-1 tabular-nums">
                                    {formatRupiah(ringkasanShift?.total_tunai || 0)}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/20 border border-border/60">
                                <span className="text-xs text-muted-foreground">Penjualan QRIS</span>
                                <div className="text-base font-semibold text-foreground mt-1 tabular-nums">
                                    {formatRupiah(ringkasanShift?.total_non_tunai || 0)}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/20 border border-border/60">
                                <span className="text-xs text-muted-foreground">Total Transaksi</span>
                                <div className="text-base font-semibold text-foreground mt-1 tabular-nums">
                                    {ringkasanShift?.jumlah_transaksi || 0} transaksi
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 rounded-lg bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <span className="text-xs font-semibold text-[var(--brand)]">Ekspektasi Kas Fisik di Laci</span>
                                <p className="text-[11px] text-muted-foreground">Modal awal ditambah total penerimaan penjualan tunai.</p>
                            </div>
                            <div className="text-lg font-bold tabular-nums text-foreground">
                                {formatRupiah(ringkasanShift?.expected_cash || shiftAktif.modal_awal)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="border-b border-border pb-4 mb-4">
                        <h2 className="text-base font-semibold text-foreground">Riwayat Shift Sebelumnya</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Daftar shift yang telah ditutup oleh akun Anda.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">Waktu Buka</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Waktu Tutup</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Kas Awal</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Kas Sistem</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Kas Fisik</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">Selisih</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {riwayatShift.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                                            Belum ada riwayat shift yang ditutup.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    riwayatShift.data.map((item) => (
                                        <TableRow key={item.id_shift}>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {formatTanggal(item.waktu_buka)} {formatJam(item.waktu_buka.substring(11, 16))}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {item.waktu_tutup
                                                    ? `${formatTanggal(item.waktu_tutup)} ${formatJam(item.waktu_tutup.substring(11, 16))}`
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right whitespace-nowrap">
                                                {formatRupiah(item.modal_awal)}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right whitespace-nowrap">
                                                {item.kas_sistem !== null ? formatRupiah(item.kas_sistem) : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs tabular-nums text-right whitespace-nowrap">
                                                {item.kas_fisik !== null ? formatRupiah(item.kas_fisik) : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-right whitespace-nowrap">
                                                {formatSelisihBadge(item.selisih)}
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">
                                                <Badge variant="neutral" className="text-[11px] py-0 px-2">
                                                    Ditutup
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

            <Dialog open={tutupDialogOpen} onOpenChange={setTutupDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Tutup Shift Kasir</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Hitung seluruh uang tunai fisik yang ada di laci kasir saat ini dan masukkan jumlah totalnya.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleTutupSubmit} className="flex flex-col gap-4 py-2">
                        <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs flex justify-between items-center">
                            <span className="text-muted-foreground">Kas Sistem (Ekspektasi):</span>
                            <span className="font-semibold tabular-nums text-foreground">
                                {formatRupiah(ringkasanShift?.expected_cash || shiftAktif?.modal_awal || 0)}
                            </span>
                        </div>

                        <div>
                            <Label htmlFor="kas_fisik" className="text-xs font-medium">
                                Kas Hitung Fisik (Rp)
                            </Label>
                            <Input
                                id="kas_fisik"
                                type="text"
                                inputMode="numeric"
                                placeholder="Contoh: 150000"
                                value={tutupForm.data.kas_fisik ? Number(tutupForm.data.kas_fisik.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    tutupForm.setData("kas_fisik", raw);
                                }}
                                className="h-10 mt-1 tabular-nums text-right font-medium"
                            />
                            {tutupForm.errors.kas_fisik && (
                                <p className="text-xs text-destructive mt-1">{tutupForm.errors.kas_fisik}</p>
                            )}
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setTutupDialogOpen(false)}
                                className="h-10 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={tutupForm.processing || !tutupForm.data.kas_fisik}
                                className="h-10 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs font-medium"
                            >
                                {tutupForm.processing ? "Menutup..." : "Konfirmasi Tutup Shift"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </KasirLayout>
    );
}
