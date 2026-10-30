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
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/admin-format";
import { CheckCircle2, Clock, Calendar, SunMedium } from "lucide-react";

interface TambahPaketModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: {
        id_user: number;
        nama: string;
        no_whatsapp: string;
    } | null;
}

export type JenisPaketKey = "bulanan_4x3" | "bulanan_4x2" | "pagi_4x3" | "kustom";

interface PaketOption {
    id: JenisPaketKey;
    nama: string;
    deskripsi: string;
    sesi: number;
    durasiJam: number;
    harga: number;
    badge?: string;
    catatanKhusus?: string;
}

const PAKET_RESMI: PaketOption[] = [
    {
        id: "bulanan_4x3",
        nama: "Bulanan 4x3 Jam",
        deskripsi: "4 hari x 3 jam per pertemuan",
        sesi: 4,
        durasiJam: 3,
        harga: 450000,
        badge: "Populer",
    },
    {
        id: "bulanan_4x2",
        nama: "Bulanan 4x2 Jam",
        deskripsi: "4 hari x 2 jam per pertemuan",
        sesi: 4,
        durasiJam: 2,
        harga: 350000,
    },
    {
        id: "pagi_4x3",
        nama: "Member Pagi 4x3 Jam",
        deskripsi: "Senin s.d Kamis (08.00 - 12.00)",
        sesi: 4,
        durasiJam: 3,
        harga: 300000,
        badge: "Hemat",
        catatanKhusus: "Khusus Senin–Kamis jam 08:00–12:00",
    },
];

export default function TambahPaketModal({
    open,
    onOpenChange,
    customer,
}: TambahPaketModalProps) {
    const todayStr = new Date().toISOString().split("T")[0];
    const defaultEndStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const [selectedPaket, setSelectedPaket] = useState<JenisPaketKey>("bulanan_4x3");

    const { data, setData, post, processing, errors, reset } = useForm({
        jenis_paket: "bulanan_4x3",
        jumlah_sesi: "4",
        durasi_jam_per_sesi: "3",
        harga_paket: "450000",
        metode_pembayaran: "transfer",
        tanggal_mulai: todayStr,
        tanggal_akhir: defaultEndStr,
        catatan: "",
    });

    useEffect(() => {
        if (open) {
            setSelectedPaket("bulanan_4x3");
            setData({
                jenis_paket: "bulanan_4x3",
                jumlah_sesi: "4",
                durasi_jam_per_sesi: "3",
                harga_paket: "450000",
                metode_pembayaran: "transfer",
                tanggal_mulai: todayStr,
                tanggal_akhir: defaultEndStr,
                catatan: "",
            });
        }
    }, [open, customer?.id_user]);

    const handleSelectPaket = (pkt: PaketOption) => {
        setSelectedPaket(pkt.id);
        setData({
            ...data,
            jenis_paket: pkt.id,
            jumlah_sesi: String(pkt.sesi),
            durasi_jam_per_sesi: String(pkt.durasiJam),
            harga_paket: String(pkt.harga),
        });
    };

    const handleSelectCustom = () => {
        setSelectedPaket("kustom");
        setData({
            ...data,
            jenis_paket: "kustom",
            jumlah_sesi: "",
            durasi_jam_per_sesi: "",
            harga_paket: "",
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer || !data.jumlah_sesi || Number(data.jumlah_sesi) < 1) {
            return;
        }
        post(`/admin/member/${customer.id_user}/paket`, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    if (!customer) return null;

    const currentHarga = Number(data.harga_paket) || 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-lg rounded-xl p-4 sm:p-6 shadow-xl border-border bg-card">
                <DialogHeader className="gap-1 sm:gap-1.5 text-left">
                    <DialogTitle className="text-base sm:text-lg font-bold leading-none tracking-tight">
                        Daftar Paket Member Baru
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                        Pilih paket resmi untuk <strong className="text-foreground">{customer.nama}</strong> ({customer.no_whatsapp}). Pembayaran dilakukan sekali di awal.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Pilihan Paket */}
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-semibold">Pilih Paket Resmi</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {PAKET_RESMI.map((pkt) => {
                                const isSelected = selectedPaket === pkt.id;
                                return (
                                    <button
                                        key={pkt.id}
                                        type="button"
                                        onClick={() => handleSelectPaket(pkt)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                                            isSelected
                                                ? "border-[var(--brand)] bg-[var(--brand)]/10 ring-2 ring-[var(--brand)]/30"
                                                : "border-border/80 bg-background/50 hover:border-slate-400 dark:hover:border-slate-600"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                                                        {pkt.nama}
                                                    </span>
                                                    {pkt.badge && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] px-1.5 py-0 h-4 bg-[var(--brand)]/20 text-[var(--brand)] font-semibold"
                                                        >
                                                            {pkt.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                    <Clock className="size-3 shrink-0" />
                                                    {pkt.deskripsi}
                                                </p>
                                                {pkt.catatanKhusus && (
                                                    <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                                                        <SunMedium className="size-3 shrink-0" />
                                                        {pkt.catatanKhusus}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-sm sm:text-base text-[var(--brand)] font-mono">
                                                    {formatRupiah(pkt.harga)}
                                                </span>
                                                <span className="block text-[10px] text-muted-foreground">
                                                    Bayar 1x di awal
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Opsi Kustom */}
                            <button
                                type="button"
                                onClick={handleSelectCustom}
                                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    selectedPaket === "kustom"
                                        ? "border-[var(--brand)] bg-[var(--brand)]/10 ring-2 ring-[var(--brand)]/30"
                                        : "border-border/80 bg-background/50 hover:border-slate-400 dark:hover:border-slate-600"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                                        Paket Kustom (Fleksibel)
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        Isi kuota & harga manual
                                    </span>
                                </div>
                            </button>
                        </div>

                        {selectedPaket === "kustom" && (
                            <div className="p-3 rounded-xl border border-dashed border-border bg-card/60 space-y-3 mt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Jumlah Sesi *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="200"
                                            placeholder="Contoh: 4"
                                            value={data.jumlah_sesi}
                                            onChange={(e) => setData("jumlah_sesi", e.target.value)}
                                            className="h-9 text-xs sm:text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Durasi Jam/Sesi</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="8"
                                            placeholder="Contoh: 2 atau 3"
                                            value={data.durasi_jam_per_sesi}
                                            onChange={(e) => setData("durasi_jam_per_sesi", e.target.value)}
                                            className="h-9 text-xs sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Harga Total Paket (Rp) *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        placeholder="Contoh: 400000"
                                        value={data.harga_paket}
                                        onChange={(e) => setData("harga_paket", e.target.value)}
                                        className="h-9 text-xs sm:text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        {errors.jumlah_sesi && (
                            <p className="text-xs text-destructive">{errors.jumlah_sesi}</p>
                        )}
                        {errors.harga_paket && (
                            <p className="text-xs text-destructive">{errors.harga_paket}</p>
                        )}
                    </div>

                    {/* Metode Pembayaran & Tanggal Mulai/Akhir */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs sm:text-sm">Metode Bayar</Label>
                            <Select
                                value={data.metode_pembayaran}
                                onChange={(e) => setData("metode_pembayaran", e.target.value)}
                            >
                                <option value="transfer">Transfer</option>
                                <option value="tunai">Tunai</option>
                                <option value="qris">QRIS</option>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs sm:text-sm">Tanggal Mulai *</Label>
                            <Input
                                type="date"
                                value={data.tanggal_mulai}
                                onChange={(e) => setData("tanggal_mulai", e.target.value)}
                                className="h-9 text-xs sm:text-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs sm:text-sm">Tanggal Akhir</Label>
                            <Input
                                type="date"
                                value={data.tanggal_akhir}
                                onChange={(e) => setData("tanggal_akhir", e.target.value)}
                                className="h-9 text-xs sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Ringkasan Pembayaran Di Awal */}
                    <div className="p-3 rounded-lg bg-[var(--brand)]/10 border border-[var(--brand)]/20 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 text-foreground">
                            <CheckCircle2 className="size-4 shrink-0 text-[var(--brand)]" />
                            <span>Total Pembayaran Lunas di Awal:</span>
                        </div>
                        <span className="font-bold text-sm sm:text-base text-[var(--brand)] font-mono">
                            {formatRupiah(currentHarga)}
                        </span>
                    </div>

                    {/* Catatan Paket */}
                    <div className="space-y-1.5">
                        <Label htmlFor="pkt_catatan" className="text-xs sm:text-sm">Catatan Paket (Opsional)</Label>
                        <Textarea
                            id="pkt_catatan"
                            placeholder="Catatan tambahan pembayaran / keterangan bank..."
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            rows={2}
                            className="text-xs sm:text-sm resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2 pt-2 flex-col sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-md text-xs sm:text-sm h-9"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.jumlah_sesi || Number(data.jumlah_sesi) < 1}
                            className="rounded-md text-xs sm:text-sm h-9 bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {processing ? "Menyimpan..." : `Simpan & Bayar (${formatRupiah(currentHarga)})`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
