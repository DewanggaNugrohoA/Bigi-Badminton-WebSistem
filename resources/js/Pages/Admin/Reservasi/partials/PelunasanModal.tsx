import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/admin-format";

interface PelunasanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: {
        id_reservasi: number;
        pemesan: {
            nama: string;
        };
        total_biaya: number;
        total_dibayar: number;
        sisa_tagihan: number;
    } | null;
    form: {
        data: {
            jumlah: string | number;
            metode_pembayaran: string;
        };
        setData: (field: string, value: any) => void;
        errors: {
            jumlah?: string;
        };
        processing: boolean;
    };
    onSubmit: (e: React.FormEvent) => void;
}

export default function PelunasanModal({
    open,
    onOpenChange,
    reservation,
    form,
    onSubmit,
}: PelunasanModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pelunasan Sisa Pembayaran</DialogTitle>
                    <DialogDescription>
                        Catat pembayaran pelunasan untuk Reservasi #{reservation?.id_reservasi} ({reservation?.pemesan.nama})
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Biaya:</span>
                            <span className="font-semibold text-foreground font-mono">
                                {formatRupiah(reservation?.total_biaya || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sudah Dibayar:</span>
                            <span className="font-semibold text-foreground font-mono">
                                {formatRupiah(reservation?.total_dibayar || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between font-bold text-amber-500 pt-1 border-t border-border/50">
                            <span>Sisa Kekurangan:</span>
                            <span className="font-mono">{formatRupiah(reservation?.sisa_tagihan || 0)}</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="nominal-pelunasan">Nominal Pelunasan (Rp)</Label>
                        <Input
                            id="nominal-pelunasan"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="Contoh: 60.000"
                            value={form.data.jumlah ? Number(form.data.jumlah).toLocaleString("id-ID") : ""}
                            onKeyDown={(e) => {
                                if (["-", "+", "e", "E", ".", ","].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            onWheel={(e) => (e.target as HTMLElement).blur()}
                            onChange={(e) => {
                                const cleanDigits = e.target.value.replace(/\D/g, "");
                                const parsed = cleanDigits ? String(parseInt(cleanDigits, 10)) : "";
                                form.setData("jumlah", parsed);
                            }}
                            onPaste={(e) => {
                                e.preventDefault();
                                const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                                const parsed = pasted ? String(parseInt(pasted, 10)) : "";
                                form.setData("jumlah", parsed);
                            }}
                        />
                        {form.errors.jumlah && (
                            <p className="text-xs text-destructive">{form.errors.jumlah}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Metode Pembayaran</Label>
                        <Select
                            value={form.data.metode_pembayaran}
                            onChange={(e) => form.setData("metode_pembayaran", e.target.value)}
                        >
                            <option value="tunai">Tunai</option>
                            <option value="transfer">Transfer</option>
                            <option value="qris">QRIS</option>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing} className="bg-[var(--brand)] text-white">
                            {form.processing ? "Menyimpan..." : "Konfirmasi Pelunasan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
