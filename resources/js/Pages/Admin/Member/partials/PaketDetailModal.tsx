import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/material-design-3-button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/admin-format";
import PenyesuaianModal from "./PenyesuaianModal";
import { Plus, SlidersHorizontal, Ban, AlertCircle, Calendar } from "lucide-react";

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
    if (!customer) return null;

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

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6">
                    <DialogHeader className="shrink-0 pb-3 border-b border-border">
                        <div className="flex items-center justify-between pr-6">
                            <div>
                                <DialogTitle>Paket Sesi Bermain</DialogTitle>
                                <DialogDescription>
                                    Member: <strong className="text-foreground">{customer.nama}</strong> ({customer.no_whatsapp})
                                </DialogDescription>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={onOpenTambahPaket}
                                className="bg-[var(--brand)] text-white gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Tambah Paket</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    
                    <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
                        {customer.paket_list.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                                Belum ada riwayat paket sesi untuk pelanggan ini.
                            </div>
                        ) : (
                            customer.paket_list.map((pkt) => {
                                const statusVariant =
                                    pkt.status_dinamis === "aktif"
                                        ? "success"
                                        : pkt.status_dinamis === "habis"
                                        ? "neutral"
                                        : pkt.status_dinamis === "kedaluwarsa"
                                        ? "warning"
                                        : "danger";

                                return (
                                    <div
                                        key={pkt.id_paket}
                                        className="p-4 rounded-xl border border-border bg-card/60 space-y-3"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-foreground">
                                                    Paket #{pkt.id_paket}
                                                </span>
                                                <Badge variant={statusVariant} className="capitalize text-[11px]">
                                                    {pkt.status_dinamis}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {pkt.status_dinamis === "aktif" && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs gap-1"
                                                            onClick={() => setSelectedPaketAdjust(pkt)}
                                                        >
                                                            <SlidersHorizontal className="size-3" />
                                                            <span>Koreksi Sesi</span>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                                                            onClick={() => setBatalTargetPaket(pkt)}
                                                        >
                                                            <Ban className="size-3" />
                                                            <span>Batalkan</span>
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        
                                        <div className="grid grid-cols-4 gap-2 p-2.5 bg-muted/40 rounded-lg text-xs">
                                            <div>
                                                <div className="text-muted-foreground text-[10px]">Total Awal</div>
                                                <div className="font-bold font-mono text-foreground">{pkt.jumlah_sesi} sesi</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-[10px]">Terpakai</div>
                                                <div className="font-bold font-mono text-foreground">{pkt.sesi_terpakai} sesi</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-[10px]">Penyesuaian</div>
                                                <div className="font-bold font-mono text-foreground">
                                                    {pkt.total_penyesuaian > 0 ? `+${pkt.total_penyesuaian}` : pkt.total_penyesuaian} sesi
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-[10px]">Sisa Sesi</div>
                                                <div className="font-bold font-mono text-[var(--brand)] text-sm">{pkt.sisa_sesi} sesi</div>
                                            </div>
                                        </div>

                                        <div className="text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                                            <span>
                                                Masa Berlaku: {pkt.tanggal_mulai} {pkt.tanggal_akhir ? `s/d ${pkt.tanggal_akhir}` : "(Tanpa batas)"}
                                            </span>
                                            {pkt.catatan && (
                                                <span className="italic max-w-xs truncate" title={pkt.catatan}>
                                                    Ket: {pkt.catatan}
                                                </span>
                                            )}
                                        </div>

                                        
                                        {pkt.reservasi && pkt.reservasi.length > 0 && (
                                            <div className="pt-2 border-t border-border/60 space-y-1.5">
                                                <span className="text-[11px] font-semibold text-foreground">
                                                    Reservasi Pemotong Sesi ({pkt.reservasi.length} transaksi):
                                                </span>
                                                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                                                    {pkt.reservasi.map((res: any) => (
                                                        <div
                                                            key={res.id_reservasi}
                                                            className="flex items-center justify-between text-[11px] p-1.5 rounded bg-background/80 border border-border/40"
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-foreground">
                                                                    Res #{res.id_reservasi}
                                                                </span>
                                                                <span className="text-muted-foreground">({res.tanggal_pemesanan})</span>
                                                                <Badge variant={res.status_reservasi === "batal" ? "danger" : "neutral"} className="text-[9px] px-1 py-0">
                                                                    {res.status_reservasi}
                                                                </Badge>
                                                            </div>
                                                            <span className="font-mono text-muted-foreground">
                                                                {res.jumlah_sesi} sesi ({formatRupiah(res.total_biaya)})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        
                                        {pkt.penyesuaian && pkt.penyesuaian.length > 0 && (
                                            <div className="pt-2 border-t border-border/60 space-y-1.5">
                                                <span className="text-[11px] font-semibold text-foreground">
                                                    Riwayat Koreksi Manual:
                                                </span>
                                                <div className="space-y-1 text-[11px]">
                                                    {pkt.penyesuaian.map((peny: any) => (
                                                        <div key={peny.id} className="flex items-center justify-between text-muted-foreground">
                                                            <span>
                                                                {peny.selisih > 0 ? `+${peny.selisih}` : peny.selisih} sesi ({peny.alasan})
                                                            </span>
                                                            <span className="text-[10px]">Oleh: {peny.admin_nama}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="shrink-0 pt-3 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            
            <PenyesuaianModal
                open={!!selectedPaketAdjust}
                onOpenChange={(v) => {
                    if (!v) setSelectedPaketAdjust(null);
                }}
                paket={selectedPaketAdjust}
            />

            
            {batalTargetPaket && (
                <Dialog open={!!batalTargetPaket} onOpenChange={() => setBatalTargetPaket(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-destructive flex items-center gap-2">
                                <AlertCircle className="size-5" />
                                <span>Batalkan Paket Sesi #{batalTargetPaket.id_paket}</span>
                            </DialogTitle>
                            <DialogDescription>
                                Paket ini akan ditandai dibatalkan dan tidak lagi dapat dipakai untuk pemesanan sesi baru.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleConfirmCancel} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cancel_alasan">Alasan Pembatalan (Wajib)</Label>
                                <Textarea
                                    id="cancel_alasan"
                                    placeholder="Alasan pembatalan paket..."
                                    value={cancelData.alasan}
                                    onChange={(e) => setCancelData("alasan", e.target.value)}
                                    rows={3}
                                />
                                {cancelErrors.alasan && (
                                    <p className="text-xs text-destructive">{cancelErrors.alasan}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setBatalTargetPaket(null)}>
                                    Kembali
                                </Button>
                                <Button type="submit" disabled={processingCancel} variant="destructive">
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
