import PublicLayout from "@/layouts/public-layout";
import { router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Phone, Clock, Info, CheckCircle2 } from "lucide-react";
import { buildWaLink } from "@/lib/content";
import { motion, useReducedMotion } from "framer-motion";

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
    const prefersReducedMotion = useReducedMotion();
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

    const handleQuickDate = (daysAhead: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        setTanggal(dateStr);
        router.get(
            "/open-mabar",
            { tanggal: dateStr },
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

    const getWaBookingLinkForSlot = (lapanganNama: string, slotJam: string, slotJamSelesai: string) => {
        const formattedDate = formatTanggal(tanggal);
        const message = `Halo admin Bigi Badminton, saya ingin reservasi lapangan.

Nama: 
Tanggal main: ${formattedDate} (${tanggal})
Jam mulai - selesai: ${slotJam} - ${slotJamSelesai} WIB
Lapangan (1/2): ${lapanganNama}
Tipe pelanggan (Member/Non-member): 

Terima kasih.`;
        return buildWaLink(config?.wa_admin_number, message);
    };

    // Helper untuk membandingkan tanggal cepat
    const isToday = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return tanggal === `${y}-${m}-${d}`;
    };

    const isTomorrow = () => {
        const now = new Date();
        now.setDate(now.getDate() + 1);
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return tanggal === `${y}-${m}-${d}`;
    };

    return (
        <PublicLayout title="Lihat Jadwal - Bigi Badminton">
            <div className="relative overflow-hidden w-full">
                {/* Atmospheric Background Court Layers (Terkurung rapi hanya di halaman ini) */}
                <div className="absolute inset-0 size-full pointer-events-none overflow-hidden select-none -z-10">
                    <img
                        src="/images/hero-bright-court.jpg"
                        alt="Bigi Court"
                        className="size-full object-cover object-[center_35%] opacity-10 filter blur-[0.5px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/95 to-background" />
                    <div className="absolute -top-32 -left-32 size-[450px] bg-sky-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -right-32 size-[450px] bg-indigo-500/10 rounded-full blur-3xl" />
                </div>

                <div className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
                    
                    {/* Hero Header Banner Lihat Jadwal */}
                    <motion.div
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-sky-500/25 bg-slate-950 p-6 sm:p-8 lg:p-10 text-white shadow-xl"
                    >
                        {/* Background Court Photo & Overlays */}
                        <div className="absolute inset-0 size-full pointer-events-none overflow-hidden select-none z-0">
                            <img
                                src="/images/hero-bright-court.jpg"
                                alt="Lapangan Bigi Badminton"
                                className="size-full object-cover object-[center_28%] opacity-35 brightness-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/35" />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent" />
                            
                            {/* Ambient Glows */}
                            <div className="absolute -top-16 -left-16 size-64 bg-sky-500/25 rounded-full blur-3xl" />
                            <div className="absolute -bottom-16 -right-16 size-64 bg-indigo-500/25 rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="max-w-2xl space-y-2.5 text-left">
                                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                                    Lihat Jadwal{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">
                                        Lapangan Bigi
                                    </span>
                                </h1>

                                <p className="text-white/85 text-xs sm:text-sm leading-relaxed max-w-xl font-normal drop-shadow-sm">
                                    Pantau ketersediaan slot bermain Lapangan 1 &amp; Lapangan 2 secara langsung (real-time). Pilih jam yang pas dan reservasi dengan mudah via WhatsApp admin!
                                </p>
                            </div>

                            <div className="shrink-0 flex items-center gap-3">
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 h-11 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all"
                                >
                                    <Phone className="size-4 text-emerald-600 shrink-0" />
                                    <span>Hubungi Admin Reservasi</span>
                                </a>
                            </div>
                        </div>
                    </motion.div>

                {/* Filter Tanggal */}
                <div className="bg-card/90 backdrop-blur-sm border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Input Tanggal & Tombol Cepat */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="space-y-1.5 text-left">
                                <Label htmlFor="tanggal" className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-muted-foreground" />
                                    <span>Pilih Tanggal Main</span>
                                </Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={tanggal}
                                    onChange={handleTanggalChange}
                                    className="h-10 text-sm bg-background/80 w-full sm:w-48 font-medium"
                                />
                            </div>

                            {/* Tombol Cepat Hari Ini & Besok */}
                            <div className="flex items-center gap-1.5 sm:self-end pt-1 sm:pt-0">
                                <button
                                    type="button"
                                    onClick={() => handleQuickDate(0)}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                                        isToday()
                                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                            : "bg-background/70 hover:bg-background text-foreground/80 border-border/80"
                                    }`}
                                >
                                    Hari Ini
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickDate(1)}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                                        isTomorrow()
                                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                            : "bg-background/70 hover:bg-background text-foreground/80 border-border/80"
                                    }`}
                                >
                                    Besok
                                </button>
                            </div>
                        </div>

                        {tanggal && (
                            <div className="text-xs sm:text-sm text-muted-foreground sm:text-right">
                                Menampilkan slot untuk: <span className="font-semibold text-foreground">{formatTanggal(tanggal)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid 2 Kolom Kanan-Kiri untuk Lapangan 1 & Lapangan 2 (Tanpa Scroll Horizontal) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                    {gridSlots.map((lap) => {
                        const availableSlots = lap.slots.filter((s) => s.status === "kosong");
                        const bookedSlots = lap.slots.filter((s) => s.status === "terisi");
                        const isUnderMaintenance = lap.status_lapangan === "perawatan";

                        return (
                            <div
                                key={lap.id_lapangan}
                                className="bg-card/75 border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4"
                            >
                                {/* Header Lapangan */}
                                <div className="flex items-center justify-between pb-3 border-b border-border/60 flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                            {lap.id_lapangan}
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight font-heading">
                                                {lap.nama_lapangan}
                                            </h2>
                                            {isUnderMaintenance && (
                                                <p className="text-[11px] text-rose-500 font-medium">
                                                    Sedang dalam perawatan berkala
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Indikator Status Lapangan */}
                                    {isUnderMaintenance ? (
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
                                            Perawatan
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold text-[11px]">
                                                {availableSlots.length} Kosong
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50 text-[11px] font-medium">
                                                {bookedSlots.length} Terisi
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Grid Kartu Slot Jam (Wrap penuh, tanpa scroll horizontal) */}
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                                    {lap.slots.map((slot) => {
                                        const isKosong = slot.status === "kosong" && !isUnderMaintenance;

                                        if (isKosong) {
                                            return (
                                                <a
                                                    key={slot.jam}
                                                    href={getWaBookingLinkForSlot(lap.nama_lapangan, slot.jam, slot.jam_selesai)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative flex flex-col items-center justify-center py-3 px-2 sm:px-3 rounded-xl border border-border/80 bg-background/80 hover:bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    title={`${lap.nama_lapangan} pukul ${slot.jam} - ${slot.jam_selesai} (Tersedia - Klik untuk pesan via WA)`}
                                                >
                                                    <span className="text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors font-heading">
                                                        {slot.jam}
                                                    </span>
                                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                                                        s/d {slot.jam_selesai}
                                                    </span>
                                                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold tracking-wide">
                                                        <span>Tersedia</span>
                                                    </div>
                                                </a>
                                            );
                                        }

                                        return (
                                            <div
                                                key={slot.jam}
                                                className="flex flex-col items-center justify-center py-3 px-2 sm:px-3 rounded-xl border border-border/40 bg-muted/30 text-muted-foreground/60 select-none text-center opacity-70 cursor-not-allowed"
                                                title={`${lap.nama_lapangan} pukul ${slot.jam} - ${slot.jam_selesai} (Sudah Terisi / Tidak Tersedia)`}
                                            >
                                                <span className="text-sm sm:text-base font-semibold tracking-tight text-muted-foreground line-through font-heading">
                                                    {slot.jam}
                                                </span>
                                                <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 mt-0.5">
                                                    s/d {slot.jam_selesai}
                                                </span>
                                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border border-border/50">
                                                    <span>Terisi</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {gridSlots.length === 0 && (
                        <div className="col-span-full border border-dashed border-border/80 rounded-2xl p-10 text-center text-muted-foreground bg-card/60">
                            Belum ada data lapangan yang tersedia untuk tanggal ini.
                        </div>
                    )}
                </div>
            </div>
            </div>
        </PublicLayout>
    );
}
