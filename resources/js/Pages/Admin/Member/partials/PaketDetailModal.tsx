import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PenyesuaianModal from "./PenyesuaianModal";
import { Plus, SlidersHorizontal, Ban, AlertCircle } from "lucide-react";

interface PaketDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: {
        id_user: number;
        nama: string;
        no_whatsapp: string;
        paket_list: any[];
    } | null;
    onOpenTambahPaket: () => void;
}

export default function PaketDetailModal({
    open,
    onOpenChange,
    customer,
    onOpenTambahPaket,
}: PaketDetailModalProps) {
    const [selectedPaketAdjust, setSelectedPaketAdjust] = useState<any | null>(null);
    const [batalTargetPaket, setBatalTargetPaket] = useState<any | null>(null);

    const { data: cancelData, setData: setCancelData, post: postCancel, processing: processingCancel, errors: cancelErrors, reset: resetCancel } = useForm({
        alasan: "",
    });

    const handleConfirmCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!batalTargetPaket) return;
        postCancel(`/admin/member/paket/${batalTargetPaket.id_paket}/cancel`, {
            onSuccess: () => {
                resetCancel();
                setBatalTargetPaket(null);
            },
        });
    };

    if (!customer) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6 rounded-lg">
                    <DialogHeader className="shrink-0 pb-3 border-b border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-4 sm:pr-6">
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-semibold leading-none tracking-tight">
                                    Paket Sesi Bermain
                                </DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    Member: <span className="font-medium text-foreground">{customer.nama}</span> ({customer.no_whatsapp})
                                </DialogDescription>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={onOpenTambahPaket}
                                className="h-8 sm:h-9 gap-1.5 rounded-md px-3 text-xs sm:text-sm self-start sm:self-auto"
                            >
                                <Plus className="size-3.5 sm:size-4" />
                                <span>Tambah Paket</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Scrollable container */}
                    <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
                        {customer.paket_list.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-xs sm:text-sm border border-dashed border-border rounded-md">
                                Belum ada riwayat paket sesi untuk pelanggan ini.
                            </div>
                        ) : (
                            customer.paket_list.map((pkt) => {
                                return (
                                    <div
                                        key={pkt.id_paket}
                                        className="p-3.5 sm:p-4 rounded-md border border-border bg-card space-y-3"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs sm:text-sm text-foreground">
                                                    Paket #{pkt.id_paket}
                                                </span>
                                                <Badge variant="neutral" className="text-[10px] sm:text-[11px] font-normal text-muted-foreground border-border rounded-md capitalize">
                                                    {pkt.status_dinamis || pkt.status}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {(pkt.status_dinamis === "aktif" || pkt.status === "aktif") && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 sm:h-9 text-xs gap-1.5 rounded-md"
                                                            onClick={() => setSelectedPaketAdjust(pkt)}
                                                        >
                                                            <SlidersHorizontal className="size-3 sm:size-3.5" />
                                                            <span>Catat Pemakaian</span>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 sm:h-9 text-xs text-destructive hover:text-destructive gap-1.5 rounded-md"
                                                            onClick={() => setBatalTargetPaket(pkt)}
                                                        >
                                                            <Ban className="size-3 sm:size-3.5" />
                                                            <span>Batalkan</span>
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rincian 4 Angka Kuota */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 sm:p-3 bg-muted/40 rounded-md border border-border/50">
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground">Total Awal</div>
                                                <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5">{pkt.jumlah_sesi} sesi</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground">Terpakai</div>
                                                <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5">{pkt.sesi_terpakai} sesi</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground">Penyesuaian</div>
                                                <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5">
                                                    {(pkt.total_penyesuaian ?? 0) > 0 ? `+${pkt.total_penyesuaian}` : (pkt.total_penyesuaian ?? 0)} sesi
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground">Sisa Sesi</div>
                                                <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5">{pkt.sisa_sesi} sesi</div>
                                            </div>
                                        </div>

                                        <div className="text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                                            <span>
                                                Masa Berlaku: {pkt.periode_teks || `${pkt.tanggal_mulai} s/d ${pkt.tanggal_akhir || '(Tanpa batas)'}`}
                                            </span>
                                            {pkt.catatan && (
                                                <span className="italic max-w-xs truncate" title={pkt.catatan}>
                                                    Ket: {pkt.catatan}
                                                </span>
                                            )}
                                        </div>

                                        {/* Riwayat Transaksi Gabungan */}
                                        {pkt.riwayat_transaksi && pkt.riwayat_transaksi.length > 0 && (
                                            <div className="pt-2 border-t border-border/60 space-y-1.5">
                                                <span className="text-[11px] font-medium text-foreground">
                                                    Riwayat Transaksi & Pemakaian ({pkt.riwayat_transaksi.length}):
                                                </span>
                                                <div className="max-h-36 overflow-y-auto divide-y divide-border/40 pr-1">
                                                    {pkt.riwayat_transaksi.map((item: any) => {
                                                        const tandaJumlah = item.selisih > 0 ? `+${item.selisih}` : `${item.selisih}`;

                                                        return (
                                                            <div
                                                                key={item.id_unique}
                                                                className="py-1.5 first:pt-0 last:pb-0 space-y-0.5 text-xs"
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-medium text-foreground">
                                                                        {item.tipe_label} ({tandaJumlah} sesi)
                                                                    </span>
                                                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground shrink-0 font-mono">
                                                                        {item.tanggal_display}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground leading-normal break-words">
                                                                    <span>{item.keterangan}</span>
                                                                    {item.dicatat_oleh && (
                                                                        <span className="ml-1 text-muted-foreground/80">
                                                                            · Dicatat oleh: {item.dicatat_oleh}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="shrink-0 pt-3 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8 sm:h-9 text-xs sm:text-sm rounded-md">
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Catat Pemakaian / Tambah Sesi */}
            <PenyesuaianModal
                open={!!selectedPaketAdjust}
                onOpenChange={(v) => {
                    if (!v) setSelectedPaketAdjust(null);
                }}
                paket={selectedPaketAdjust}
            />

            {/* Modal Batalkan Paket */}
            {batalTargetPaket && (
                <Dialog open={!!batalTargetPaket} onOpenChange={() => setBatalTargetPaket(null)}>
                    <DialogContent className="w-[95vw] sm:max-w-md rounded-lg p-4 sm:p-6 shadow-md border-border">
                        <DialogHeader>
                            <DialogTitle className="text-destructive flex items-center gap-2 text-base sm:text-lg">
                                <AlertCircle className="size-4 sm:size-5 shrink-0" />
                                <span>Batalkan Paket Sesi #{batalTargetPaket.id_paket}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                Paket ini akan ditandai dibatalkan dan tidak lagi dapat dipakai untuk pemesanan sesi baru.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleConfirmCancel} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cancel_alasan" className="text-xs sm:text-sm">Alasan Pembatalan (Wajib)</Label>
                                <Textarea
                                    id="cancel_alasan"
                                    placeholder="Alasan pembatalan paket..."
                                    value={cancelData.alasan}
                                    onChange={(e) => setCancelData("alasan", e.target.value)}
                                    rows={3}
                                    className="rounded-md bg-background border-input focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm resize-none"
                                />
                                {cancelErrors.alasan && (
                                    <p className="text-xs text-destructive">{cancelErrors.alasan}</p>
                                )}
                            </div>

                            <DialogFooter className="gap-2 pt-2 sm:pt-3 flex-col sm:flex-row">
                                <Button type="button" variant="outline" onClick={() => setBatalTargetPaket(null)} className="rounded-md text-xs sm:text-sm h-8 sm:h-9">
                                    Kembali
                                </Button>
                                <Button type="submit" disabled={processingCancel} variant="destructive" className="rounded-md text-xs sm:text-sm h-8 sm:h-9">
                                    {processingCancel ? "Membatalkan..." : "Konfirmasi Batal Paket"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
