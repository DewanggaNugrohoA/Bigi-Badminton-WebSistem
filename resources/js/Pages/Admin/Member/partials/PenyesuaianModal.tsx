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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface PenyesuaianModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paket: {
        id_paket: number;
        jumlah_sesi: number;
        sisa_sesi: number;
        status_dinamis?: string;
    } | null;
}

interface PenyesuaianFormData {
    jenis: "pemakaian" | "tambah";
    jumlah: number;
    tanggal: string;
    catatan: string;
    selisih?: string;
    alasan?: string;
    paket?: string;
}

export default function PenyesuaianModal({ open, onOpenChange, paket }: PenyesuaianModalProps) {
    if (!paket) return null;

    const todayStr = new Date().toISOString().split("T")[0];
    const [jenis, setJenis] = useState<"pemakaian" | "tambah">("pemakaian");

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<PenyesuaianFormData>({
        jenis: "pemakaian",
        jumlah: 1,
        tanggal: todayStr,
        catatan: "",
    });

    useEffect(() => {
        if (open) {
            setJenis("pemakaian");
            setData({
                jenis: "pemakaian",
                jumlah: 1,
                tanggal: todayStr,
                catatan: "",
            });
            clearErrors();
        }
    }, [open, paket?.id_paket]);

    const handleJenisChange = (newJenis: "pemakaian" | "tambah") => {
        setJenis(newJenis);
        setData("jenis", newJenis);
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const jumlahNum = Number(data.jumlah);
        if (jenis === "pemakaian" && jumlahNum > paket.sisa_sesi) {
            toast.error(`Jumlah pemakaian (${jumlahNum} sesi) melebihi sisa sesi (${paket.sisa_sesi} sesi).`);
            return;
        }

        post(`/admin/member/paket/${paket.id_paket}/adjust`, {
            preserveScroll: true,
            onSuccess: () => {
                const msg =
                    jenis === "pemakaian"
                        ? `Berhasil mencatat pemakaian ${data.jumlah} sesi.`
                        : `Berhasil menambah ${data.jumlah} sesi.`;
                toast.success(msg);
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-md rounded-lg p-4 sm:p-6 shadow-md border-border">
                <DialogHeader className="gap-1 sm:gap-1.5">
                    <DialogTitle className="text-base sm:text-lg font-semibold leading-none tracking-tight">
                        {jenis === "pemakaian" ? "Catat Pemakaian Sesi" : "Tambah Sesi Paket"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                        Paket #{paket.id_paket} &bull; Sisa saat ini:{" "}
                        <strong className="text-foreground">{paket.sisa_sesi} sesi</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1 sm:pt-2">
                    {/* Error global paket jika ada */}
                    {errors.paket && (
                        <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span>{errors.paket}</span>
                        </div>
                    )}

                    {/* Tab Pilihan Jenis Penyesuaian */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-md text-xs sm:text-sm">
                        <button
                            type="button"
                            onClick={() => handleJenisChange("pemakaian")}
                            className={cn(
                                "py-1.5 px-3 rounded text-center font-medium transition-colors",
                                jenis === "pemakaian"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Catat Pemakaian (-)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleJenisChange("tambah")}
                            className={cn(
                                "py-1.5 px-3 rounded text-center font-medium transition-colors",
                                jenis === "tambah"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Tambah Sesi (+)
                        </button>
                    </div>

                    {/* Input Jumlah Sesi */}
                    <div className="space-y-1.5">
                        <Label htmlFor="adj_jumlah" className="text-xs sm:text-sm">
                            Jumlah Sesi <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="adj_jumlah"
                            type="number"
                            min="1"
                            max={jenis === "pemakaian" ? paket.sisa_sesi : 100}
                            value={data.jumlah}
                            onChange={(e) => setData("jumlah", parseInt(e.target.value) || 0)}
                            className="rounded-md bg-background border-input focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm h-9 sm:h-10"
                            required
                        />
                        {errors.jumlah && (
                            <p className="text-xs text-destructive">{errors.jumlah}</p>
                        )}
                        {errors.selisih && (
                            <p className="text-xs text-destructive">{errors.selisih}</p>
                        )}
                        {jenis === "pemakaian" && (
                            <p className="text-[11px] text-muted-foreground">
                                Maksimal {paket.sisa_sesi} sesi (sesuai sisa kuota yang tersedia).
                            </p>
                        )}
                    </div>

                    {/* Input Tanggal Main (khusus pemakaian) atau tanggal efektif */}
                    <div className="space-y-1.5">
                        <Label htmlFor="adj_tanggal" className="text-xs sm:text-sm">
                            {jenis === "pemakaian" ? "Tanggal Main" : "Tanggal Penambahan"}
                        </Label>
                        <Input
                            id="adj_tanggal"
                            type="date"
                            value={data.tanggal}
                            onChange={(e) => setData("tanggal", e.target.value)}
                            className="rounded-md bg-background border-input focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm h-9 sm:h-10"
                        />
                        {errors.tanggal && (
                            <p className="text-xs text-destructive">{errors.tanggal}</p>
                        )}
                    </div>

                    {/* Input Alasan / Catatan */}
                    <div className="space-y-1.5">
                        <Label htmlFor="adj_catatan" className="text-xs sm:text-sm">
                            {jenis === "pemakaian" ? "Catatan / Keterangan" : "Alasan Penambahan"}{" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="adj_catatan"
                            rows={3}
                            placeholder={
                                jenis === "pemakaian"
                                    ? "Contoh: Main offline hari Minggu 2 jam..."
                                    : "Contoh: Kompensasi lapangan basah / bonus perpanjangan..."
                            }
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            className="rounded-md bg-background border-input focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm resize-none"
                            required
                        />
                        {errors.catatan && (
                            <p className="text-xs text-destructive">{errors.catatan}</p>
                        )}
                        {errors.alasan && (
                            <p className="text-xs text-destructive">{errors.alasan}</p>
                        )}
                    </div>

                    {/* Ringkasan Estimasi Sisa */}
                    <div className="p-3 rounded-md bg-muted/40 border border-border/50 text-xs space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Sisa Sesi Awal:</span>
                            <span className="font-mono">{paket.sisa_sesi} sesi</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Penyesuaian:</span>
                            <span className={cn("font-mono font-medium", jenis === "pemakaian" ? "text-destructive" : "text-emerald-500")}>
                                {jenis === "pemakaian" ? `-${data.jumlah || 0}` : `+${data.jumlah || 0}`} sesi
                            </span>
                        </div>
                        <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border/40">
                            <span>Estimasi Sisa Akhir:</span>
                            <span className="font-mono">
                                {jenis === "pemakaian"
                                    ? Math.max(0, paket.sisa_sesi - (data.jumlah || 0))
                                    : paket.sisa_sesi + (data.jumlah || 0)}{" "}
                                sesi
                            </span>
                        </div>
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
                            disabled={processing || !data.catatan.trim() || Number(data.jumlah) < 1}
                            variant="default"
                            className="rounded-md text-xs sm:text-sm h-8 sm:h-9 bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing
                                ? "Menyimpan..."
                                : jenis === "pemakaian"
                                ? "Simpan Pemakaian"
                                : "Simpan Tambah Sesi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
