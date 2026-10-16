import PublicLayout from "@/layouts/public-layout";
import { router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Phone } from "lucide-react";
import { buildWaLink } from "@/lib/content";

interface SlotItem {
    jam: string;
    jam_selesai: string;
    status: "kosong" | "terisi";
}

interface GridLapangan {
    id_lapangan: number;
    nama_lapangan: string;
    status_lapangan: string;
    slots: SlotItem[];
}

interface IndexProps {
    gridSlots: GridLapangan[];
    filters: {
        tanggal: string;
    };
}

export default function OpenMabarIndex({ gridSlots = [], filters }: IndexProps) {
    const { config } = usePage<{ config?: { wa_admin_number?: string } }>().props;
    const waLink = buildWaLink(config?.wa_admin_number);
    const [tanggal, setTanggal] = useState(filters.tanggal || "");

    useEffect(() => {
        if (filters.tanggal) {
            setTanggal(filters.tanggal);
        }
    }, [filters.tanggal]);

    const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTanggal(val);
        router.get(
            "/open-mabar",
            val ? { tanggal: val } : {},
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const formatTanggal = (dateStr: string) => {
        try {
            const date = new Date(dateStr + "T00:00:00");
            return new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    return (
        <PublicLayout title="Lihat Jadwal - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                            Lihat Jadwal
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                            Lihat slot lapangan yang kosong dan terisi.
                        </p>
                    </div>
                    <div className="shrink-0">
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20 border border-[var(--brand)]/30 text-[var(--brand)] text-xs sm:text-sm font-semibold transition-all group shadow-xs"
                        >
                            <Phone className="size-4 shrink-0" />
                            <span>Ingin booking lapangan hubungi kami</span>
                        </a>
                    </div>
                </div>

                {/* Filter Tanggal */}
                <div className="bg-card/90 backdrop-blur-sm border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="w-full sm:max-w-xs space-y-1.5 text-left">
                            <Label htmlFor="tanggal" className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-muted-foreground" />
                                <span>Tanggal Main</span>
                            </Label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={tanggal}
                                onChange={handleTanggalChange}
                                className="h-10 text-sm bg-background/80"
                            />
                        </div>

                        {tanggal && (
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                Menampilkan slot untuk: <span className="font-semibold text-foreground">{formatTanggal(tanggal)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid Slot per Lapangan */}
                <div className="space-y-6 sm:space-y-8">
                    {gridSlots.map((lap) => (
                        <div
                            key={lap.id_lapangan}
                            className="bg-card/60 border border-border/70 rounded-xl p-4 sm:p-5 shadow-xs space-y-3"
                        >
                            {/* Judul Lapangan dengan Garis Tipis di Bawahnya */}
                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                <h2 className="text-base sm:text-lg font-bold text-foreground">
                                    {lap.nama_lapangan}
                                </h2>
                                {lap.status_lapangan === "perawatan" && (
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        Perawatan
                                    </span>
                                )}
                            </div>

                            {/* Baris Kartu Jam (Scrollable horizontal di HP) */}
                            <div className="overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
                                <div className="flex items-stretch gap-2 min-w-max">
                                    {lap.slots.map((slot) => {
                                        const isKosong = slot.status === "kosong";

                                        if (isKosong) {
                                            return (
                                                <div
                                                    key={slot.jam}
                                                    className="flex flex-col items-center justify-center min-w-[84px] sm:min-w-[92px] py-2.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 select-none text-center shadow-xs"
                                                    title={`${lap.nama_lapangan} ${slot.jam} - Kosong`}
                                                >
                                                    <span className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                                                        {slot.jam}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-emerald-500 mt-1">
                                                        Kosong
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={slot.jam}
                                                className="flex flex-col items-center justify-center min-w-[84px] sm:min-w-[92px] py-2.5 px-3 rounded-lg border border-border/60 bg-muted/40 text-muted-foreground/60 opacity-70 select-none text-center shadow-xs"
                                                title={`${lap.nama_lapangan} ${slot.jam} - Terisi`}
                                            >
                                                <span className="text-sm sm:text-base font-semibold tracking-tight">
                                                    {slot.jam}
                                                </span>
                                                <span className="text-[11px] font-medium text-rose-400/80 mt-1">
                                                    Terisi
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {gridSlots.length === 0 && (
                        <div className="border border-dashed border-border/80 rounded-xl p-8 text-center text-muted-foreground bg-card/60">
                            Belum ada data lapangan yang tersedia.
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
