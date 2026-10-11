import React from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PenyesuaianModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paket: {
        id_paket: number;
        jumlah_sesi: number;
        sisa_sesi: number;
    } | null;
}

export default function PenyesuaianModal({ open, onOpenChange, paket }: PenyesuaianModalProps) {
    if (!paket) return null;

    const { data, setData, post, processing, errors, reset } = useForm({
        selisih: "",
        alasan: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/member/paket/${paket.id_paket}/adjust`, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Penyesuaian Kuota Sesi</DialogTitle>
                    <DialogDescription>
                        Koreksi kuota sesi paket #{paket.id_paket} (Sisa saat ini: <strong className="text-foreground">{paket.sisa_sesi} sesi</strong>).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="selisih">Nilai Koreksi Sesi (+ atau -)</Label>
                        <Input
                            id="selisih"
                            type="number"
                            placeholder="Contoh: 1 (tambah 1 sesi) atau -1 (kurangi 1 sesi)"
                            value={data.selisih}
                            onChange={(e) => setData("selisih", e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Gunakan angka positif untuk menambah sesi bonus/kompensasi, atau angka negatif untuk pengurangan.
                        </p>
                        {errors.selisih && (
                            <p className="text-xs text-destructive">{errors.selisih}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="alasan">Alasan Penyesuaian (Wajib)</Label>
                        <Textarea
                            id="alasan"
                            placeholder="Alasan koreksi sesi (misal: penggantian jadwal mati lampu)..."
                            value={data.alasan}
                            onChange={(e) => setData("alasan", e.target.value)}
                            rows={3}
                        />
                        {errors.alasan && (
                            <p className="text-xs text-destructive">{errors.alasan}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-[var(--brand)] text-white">
                            {processing ? "Menyimpan..." : "Simpan Penyesuaian"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
