import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TambahPaketModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: {
        id_user: number;
        nama: string;
        no_whatsapp: string;
    } | null;
}

export default function TambahPaketModal({ open, onOpenChange, customer }: TambahPaketModalProps) {
    if (!customer) return null;

    const [preset, setPreset] = useState<number | "custom">(4);

    const todayStr = new Date().toISOString().split("T")[0];
    const { data, setData, post, processing, errors, reset } = useForm({
        jumlah_sesi: "4",
        tanggal_mulai: todayStr,
        tanggal_akhir: "",
        catatan: "",
    });

    const handleSelectPreset = (val: number) => {
        setPreset(val);
        setData("jumlah_sesi", String(val));
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreset("custom");
        setData("jumlah_sesi", e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/member/${customer.id_user}/paket`, {
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
                    <DialogTitle>Tambah Paket Sesi Baru</DialogTitle>
                    <DialogDescription>
                        Tambahkan kuota sesi bermain untuk member <strong className="text-foreground">{customer.nama}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Pilih Jumlah Sesi</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={preset === 4 ? "default" : "outline"}
                                className={preset === 4 ? "bg-[var(--brand)] text-white" : ""}
                                onClick={() => handleSelectPreset(4)}
                            >
                                4 Sesi
                            </Button>
                            <Button
                                type="button"
                                variant={preset === 8 ? "default" : "outline"}
                                className={preset === 8 ? "bg-[var(--brand)] text-white" : ""}
                                onClick={() => handleSelectPreset(8)}
                            >
                                8 Sesi
                            </Button>
                            <Button
                                type="button"
                                variant={preset === "custom" ? "default" : "outline"}
                                className={preset === "custom" ? "bg-[var(--brand)] text-white" : ""}
                                onClick={() => setPreset("custom")}
                            >
                                Kustom
                            </Button>
                        </div>

                        {preset === "custom" && (
                            <div className="pt-1.5 space-y-1">
                                <Input
                                    type="number"
                                    min="1"
                                    max="200"
                                    placeholder="Masukkan kuota sesi..."
                                    value={data.jumlah_sesi}
                                    onChange={handleCustomChange}
                                />
                            </div>
                        )}

                        {errors.jumlah_sesi && (
                            <p className="text-xs text-destructive">{errors.jumlah_sesi}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                            <Input
                                id="tanggal_mulai"
                                type="date"
                                value={data.tanggal_mulai}
                                onChange={(e) => setData("tanggal_mulai", e.target.value)}
                            />
                            {errors.tanggal_mulai && (
                                <p className="text-xs text-destructive">{errors.tanggal_mulai}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal_akhir">Tanggal Akhir (Opsional)</Label>
                            <Input
                                id="tanggal_akhir"
                                type="date"
                                value={data.tanggal_akhir}
                                onChange={(e) => setData("tanggal_akhir", e.target.value)}
                            />
                            {errors.tanggal_akhir && (
                                <p className="text-xs text-destructive">{errors.tanggal_akhir}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="catatan">Catatan / Keterangan</Label>
                        <Textarea
                            id="catatan"
                            placeholder="Catatan paket (misal: pembayaran tunai di kasir)..."
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            rows={3}
                        />
                        {errors.catatan && (
                            <p className="text-xs text-destructive">{errors.catatan}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-[var(--brand)] text-white">
                            {processing ? "Menyimpan..." : "Simpan Paket Sesi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
