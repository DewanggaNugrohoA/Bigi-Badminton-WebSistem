import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

export default function TambahPaketModal({
    open,
    onOpenChange,
    customer,
}: TambahPaketModalProps) {
    const todayStr = new Date().toISOString().split("T")[0];
    const defaultEndStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const [preset, setPreset] = useState<number | "custom" | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        jumlah_sesi: "",
        tanggal_mulai: todayStr,
        tanggal_akhir: defaultEndStr,
        catatan: "",
    });

    useEffect(() => {
        if (open) {
            setPreset(null);
            setData({
                jumlah_sesi: "",
                tanggal_mulai: todayStr,
                tanggal_akhir: defaultEndStr,
                catatan: "",
            });
        }
    }, [open, customer?.id_user]);

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
        if (!customer || !data.jumlah_sesi || Number(data.jumlah_sesi) < 1) {
            return;
        }
        post(`/admin/member/${customer.id_user}/paket`, {
            onSuccess: () => {
                reset();
                setPreset(null);
                onOpenChange(false);
            },
        });
    };

    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-md rounded-lg p-4 sm:p-6 shadow-md border-border">
                <DialogHeader className="gap-1 sm:gap-1.5">
                    <DialogTitle className="text-base sm:text-lg font-semibold leading-none tracking-tight">
                        Tambah Paket Sesi Baru
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                        Tambahkan kuota sesi bermain untuk <strong className="text-foreground">{customer.nama}</strong> ({customer.no_whatsapp}).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1 sm:pt-2">
                    {/* Preset Jumlah Sesi */}
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">Jumlah Sesi</Label>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {[4, 8, 12].map((s) => (
                                <Button
                                    key={s}
                                    type="button"
                                    variant={preset === s ? "default" : "outline"}
                                    onClick={() => handleSelectPreset(s)}
                                    className={
                                        preset === s
                                            ? "bg-[var(--brand)] text-white hover:opacity-90 h-8 sm:h-9 text-xs sm:text-sm"
                                            : "h-8 sm:h-9 text-xs sm:text-sm"
                                    }
                                >
                                    {s} Sesi
                                </Button>
                            ))}
                            <Button
                                type="button"
                                variant={preset === "custom" ? "default" : "outline"}
                                onClick={() => setPreset("custom")}
                                className={
                                    preset === "custom"
                                        ? "bg-[var(--brand)] text-white hover:opacity-90 h-8 sm:h-9 text-xs sm:text-sm"
                                        : "h-8 sm:h-9 text-xs sm:text-sm"
                                }
                            >
                                Kustom
                            </Button>
                        </div>

                        {preset === "custom" && (
                            <div className="pt-1.5">
                                <Input
                                    type="number"
                                    min="1"
                                    max="200"
                                    placeholder="Masukkan jumlah sesi..."
                                    value={data.jumlah_sesi}
                                    onChange={handleCustomChange}
                                    className="h-9 sm:h-10 text-xs sm:text-sm"
                                    required
                                />
                            </div>
                        )}
                        {!data.jumlah_sesi && (
                            <p className="text-[11px] text-amber-500 font-medium">
                                * Pilih salah satu opsi sesi di atas atau isi kustom terlebih dahulu.
                            </p>
                        )}
                        {errors.jumlah_sesi && (
                            <p className="text-xs text-destructive">{errors.jumlah_sesi}</p>
                        )}
                    </div>

                    {/* Masa Berlaku Paket */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="pkt_tgl_mulai" className="text-xs sm:text-sm">
                                Tanggal Mulai <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="pkt_tgl_mulai"
                                type="date"
                                value={data.tanggal_mulai}
                                onChange={(e) => setData("tanggal_mulai", e.target.value)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                                required
                            />
                            {errors.tanggal_mulai && (
                                <p className="text-xs text-destructive">{errors.tanggal_mulai}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pkt_tgl_akhir" className="text-xs sm:text-sm">
                                Tanggal Berakhir
                            </Label>
                            <Input
                                id="pkt_tgl_akhir"
                                type="date"
                                value={data.tanggal_akhir}
                                onChange={(e) => setData("tanggal_akhir", e.target.value)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                            />
                            {errors.tanggal_akhir && (
                                <p className="text-xs text-destructive">{errors.tanggal_akhir}</p>
                            )}
                        </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                        * Jika tanggal berakhir dikosongkan, paket sesi tidak akan kedaluwarsa.
                    </p>

                    {/* Catatan Paket */}
                    <div className="space-y-1.5">
                        <Label htmlFor="pkt_catatan" className="text-xs sm:text-sm">Catatan Paket (Opsional)</Label>
                        <Textarea
                            id="pkt_catatan"
                            placeholder="Contoh: Paket promo awal bulan / transfer BCA..."
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            rows={2}
                            className="text-xs sm:text-sm resize-none"
                        />
                        {errors.catatan && (
                            <p className="text-xs text-destructive">{errors.catatan}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 pt-2 flex-col sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-md text-xs sm:text-sm h-8 sm:h-9"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.jumlah_sesi || Number(data.jumlah_sesi) < 1}
                            className="rounded-md text-xs sm:text-sm h-8 sm:h-9 bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? "Menyimpan..." : "Simpan Paket"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
