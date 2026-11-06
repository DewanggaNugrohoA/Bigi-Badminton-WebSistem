import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CalendarSync, User } from "lucide-react";

interface LapanganItem {
    id_lapangan: number;
    nama_lapangan: string;
    status_lapangan: string;
}

interface RescheduleReservation {
    id_reservasi: number;
    id_detail_reservasi?: number;
    id_lapangan?: number;
    tanggal_main?: string;
    jam_mulai?: string;
    jam_selesai?: string;
    lapangan?: string;
    pemesan: {
        id_user?: number | null;
        nama: string;
        no_whatsapp: string;
        jenis_pelanggan: string;
    };
}

interface RescheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: RescheduleReservation | null;
    lapanganList: LapanganItem[];
}

export default function RescheduleModal({
    open,
    onOpenChange,
    reservation,
    lapanganList,
}: RescheduleModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id_detail_reservasi: reservation?.id_detail_reservasi || "",
        id_lapangan: String(reservation?.id_lapangan || lapanganList[0]?.id_lapangan || "1"),
        tanggal_main: reservation?.tanggal_main || new Date().toISOString().split("T")[0],
        jam_mulai: reservation?.jam_mulai ? reservation.jam_mulai.substring(0, 5) : "10:00",
        jam_selesai: reservation?.jam_selesai ? reservation.jam_selesai.substring(0, 5) : "12:00",
        alasan: "",
    });

    useEffect(() => {
        if (open && reservation) {
            setData({
                id_detail_reservasi: reservation.id_detail_reservasi || "",
                id_lapangan: String(reservation.id_lapangan || lapanganList[0]?.id_lapangan || "1"),
                tanggal_main: reservation.tanggal_main || new Date().toISOString().split("T")[0],
                jam_mulai: reservation.jam_mulai ? reservation.jam_mulai.substring(0, 5) : "10:00",
                jam_selesai: reservation.jam_selesai ? reservation.jam_selesai.substring(0, 5) : "12:00",
                alasan: "",
            });
        }
    }, [open, reservation?.id_reservasi]);

    // Opsi jam 08:00 sampai 23:00
    const timeSlots: string[] = [];
    for (let h = 8; h <= 23; h++) {
        timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reservation) return;
        post(`/admin/reservasi/${reservation.id_reservasi}/reschedule`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    if (!reservation || reservation.pemesan.jenis_pelanggan !== "member") return null;

    const isMember = true;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-lg rounded-lg p-4 sm:p-6 shadow-md border-border">
                <DialogHeader className="gap-1 sm:gap-1.5 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[var(--brand)]/10 text-[var(--brand)] rounded-md">
                            <CalendarSync className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base sm:text-lg font-semibold leading-none tracking-tight">
                                Edit & Reschedule Jadwal
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Atur ulang tanggal, waktu, atau lapangan untuk Reservasi #{reservation.id_reservasi}.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Ringkasan Pemesan */}
                <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <User className="size-3.5" /> Pemesan:
                        </span>
                        <span className="font-semibold text-foreground">
                            {reservation.pemesan.nama} ({reservation.pemesan.no_whatsapp})
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tipe Pelanggan:</span>
                        <span className={`font-medium capitalize ${isMember ? "text-[var(--brand)] font-bold" : "text-foreground"}`}>
                            {reservation.pemesan.jenis_pelanggan}
                            {isMember && " (Kuota Sesi Member)"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Jadwal Semula:</span>
                        <span className="font-mono text-muted-foreground">
                            {reservation.tanggal_main} • {reservation.jam_mulai}-{reservation.jam_selesai} ({reservation.lapangan})
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Lapangan */}
                    <div className="space-y-1.5">
                        <Label htmlFor="reschedule_lapangan" className="text-xs sm:text-sm">
                            Pilih Lapangan Baru <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            id="reschedule_lapangan"
                            value={data.id_lapangan}
                            onChange={(e) => setData("id_lapangan", e.target.value)}
                            className="h-9 sm:h-10 text-xs sm:text-sm"
                        >
                            {lapanganList.map((lap) => (
                                <option
                                    key={lap.id_lapangan}
                                    value={String(lap.id_lapangan)}
                                    disabled={lap.status_lapangan === "perawatan"}
                                >
                                    {lap.nama_lapangan} {lap.status_lapangan === "perawatan" ? "(Perawatan)" : ""}
                                </option>
                            ))}
                        </Select>
                        {errors.id_lapangan && (
                            <p className="text-xs text-destructive">{errors.id_lapangan}</p>
                        )}
                    </div>

                    {/* Tanggal Main */}
                    <div className="space-y-1.5">
                        <Label htmlFor="reschedule_tanggal" className="text-xs sm:text-sm">
                            Tanggal Main Baru <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="reschedule_tanggal"
                            type="date"
                            value={data.tanggal_main}
                            onChange={(e) => setData("tanggal_main", e.target.value)}
                            className="h-9 sm:h-10 text-xs sm:text-sm"
                            required
                        />
                        {errors.tanggal_main && (
                            <p className="text-xs text-destructive">{errors.tanggal_main}</p>
                        )}
                    </div>

                    {/* Jam Mulai & Jam Selesai */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="reschedule_jam_mulai" className="text-xs sm:text-sm">
                                Jam Mulai <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                id="reschedule_jam_mulai"
                                value={data.jam_mulai}
                                onChange={(e) => setData("jam_mulai", e.target.value)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                            >
                                {timeSlots.slice(0, -1).map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </Select>
                            {errors.jam_mulai && (
                                <p className="text-xs text-destructive">{errors.jam_mulai}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reschedule_jam_selesai" className="text-xs sm:text-sm">
                                Jam Selesai <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                id="reschedule_jam_selesai"
                                value={data.jam_selesai}
                                onChange={(e) => setData("jam_selesai", e.target.value)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                            >
                                {timeSlots.slice(1).map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </Select>
                            {errors.jam_selesai && (
                                <p className="text-xs text-destructive">{errors.jam_selesai}</p>
                            )}
                        </div>
                    </div>

                    {/* Alasan Reschedule */}
                    <div className="space-y-1.5">
                        <Label htmlFor="reschedule_alasan" className="text-xs sm:text-sm">
                            Alasan Reschedule (Opsional)
                        </Label>
                        <Textarea
                            id="reschedule_alasan"
                            placeholder="Contoh: Permintaan reschedule jadwal dari member..."
                            value={data.alasan}
                            onChange={(e) => setData("alasan", e.target.value)}
                            rows={2}
                            className="text-xs sm:text-sm resize-none"
                        />
                        {errors.alasan && (
                            <p className="text-xs text-destructive">{errors.alasan}</p>
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
                            disabled={processing}
                            className="rounded-md text-xs sm:text-sm h-8 sm:h-9 bg-[var(--brand)] text-white hover:opacity-90 cursor-pointer"
                        >
                            {processing ? "Menyimpan..." : "Simpan Jadwal Baru"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
