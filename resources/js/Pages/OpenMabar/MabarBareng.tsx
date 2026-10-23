import PublicLayout from "@/layouts/public-layout";
import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MabarImage } from "@/components/mabar-image";
import { Calendar, Clock, Users, User, Filter, RotateCcw, PlusCircle, ArrowRight, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface JadwalItem {
    id_mabar: number;
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    gender: "putra" | "putri" | "campuran";
    kuota: number;
    foto?: string | null;
    peserta_terdaftar_count: number;
    user?: {
        id_user: number;
        nama: string;
    };
    lapangan?: {
        id_lapangan: number;
        nama_lapangan: string;
    } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface IndexProps {
    jadwal: {
        data: JadwalItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        tanggal: string;
        gender: string;
    };
}

export default function MabarBareng({ jadwal, filters }: IndexProps) {
    const prefersReducedMotion = useReducedMotion();
    const [tanggal, setTanggal] = useState(filters.tanggal || "");
    const [gender, setGender] = useState(filters.gender || "");

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/open-mabar/mabar-bareng",
            {
                tanggal: tanggal || undefined,
                gender: gender || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleReset = () => {
        setTanggal("");
        setGender("");
        router.get("/open-mabar/mabar-bareng", {}, { preserveState: true, preserveScroll: true });
    };

    const formatTanggal = (dateStr: string) => {
        try {
            const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
            return new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    const formatJam = (timeStr: string) => {
        return timeStr ? timeStr.substring(0, 5) : "";
    };

    const genderLabel = {
        putra: "Putra",
        putri: "Putri",
        campuran: "Campuran",
    };

    return (
        <PublicLayout title="Mabar Bareng - Bigi Badminton">
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
                
                {/* Hero Header Banner Mabar Bareng dengan Foto Lapangan */}
                <motion.div
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-sky-500/25 bg-slate-950 p-6 sm:p-8 lg:p-10 text-white shadow-xl"
                >
                    {/* Background Foto Lapangan & Overlay Gradien Gelap */}
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
                                Mabar Bareng{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">
                                    Bigi Badminton
                                </span>
                            </h1>

                            <p className="text-white/85 text-xs sm:text-sm leading-relaxed max-w-xl font-normal drop-shadow-sm">
                                Temukan lawan dan kawan bertanding badminton di Lapangan 1 &amp; 2 GOR Bigi. Pilih jadwal sesi mabar di bawah atau buat jadwal Anda sendiri!
                            </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-3">
                            <Link href="/open-mabar/create" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto h-11 px-6 rounded-full font-bold text-xs sm:text-sm gap-2 bg-white text-slate-950 hover:bg-slate-100 shadow-xl active:scale-95 transition-all">
                                    <PlusCircle className="size-4" />
                                    <span>Buat Jadwal Baru</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                
                {/* Form Filter Pencarian Jadwal */}
                <div className="bg-card/90 backdrop-blur-sm border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
                        <div className="sm:col-span-1 lg:col-span-4 space-y-1.5 text-left">
                            <Label htmlFor="tanggal" className="text-xs font-semibold text-foreground/80">
                                Tanggal Main
                            </Label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="h-10 text-sm bg-background/80"
                            />
                        </div>

                        <div className="sm:col-span-1 lg:col-span-4 space-y-1.5 text-left">
                            <Label htmlFor="gender" className="text-xs font-semibold text-foreground/80">
                                Kategori Gender
                            </Label>
                            <select
                                id="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/80 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 text-foreground cursor-pointer"
                            >
                                <option value="" className="bg-card text-foreground">Semua Kategori</option>
                                <option value="putra" className="bg-card text-foreground">Putra</option>
                                <option value="putri" className="bg-card text-foreground">Putri</option>
                                <option value="campuran" className="bg-card text-foreground">Campuran</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
                            <Button type="submit" className="flex-1 h-10 px-4 text-sm font-semibold gap-2 bg-[var(--brand)] hover:opacity-90">
                                <Filter className="size-4" />
                                <span>Terapkan</span>
                            </Button>
                            {(tanggal || gender) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    className="h-10 px-3 text-sm shrink-0"
                                    title="Reset filter"
                                    aria-label="Reset filter pencarian"
                                >
                                    <RotateCcw className="size-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {jadwal.data.length === 0 ? (
                    <div className="border border-dashed border-border/80 rounded-xl p-6 sm:p-8 text-left bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
                        <div className="flex items-start gap-4 text-left">
                            <div className="size-11 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground border border-border/60">
                                <Users className="size-5" />
                            </div>
                            <div className="space-y-1 text-left">
                                <h3 className="text-base font-semibold text-foreground">Belum Ada Jadwal yang Cocok</h3>
                                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                                    Tidak menemukan jadwal dengan kriteria pencarian tersebut. Silakan atur ulang filter pencarian atau buat jadwal mabar baru.
                                </p>
                            </div>
                        </div>
                        <Link href="/open-mabar/create" className="shrink-0 w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-10 px-4 text-sm font-medium gap-2 bg-[var(--brand)] hover:opacity-90 text-white shadow-xs">
                                <PlusCircle className="size-4" />
                                <span>Buat Jadwal Baru</span>
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {jadwal.data.map((item, idx) => {
                            const isPenuh = item.peserta_terdaftar_count >= item.kuota;
                            return (
                                <motion.div
                                    key={item.id_mabar}
                                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: (idx % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={prefersReducedMotion ? {} : { y: -5, transition: { duration: 0.25, ease: "easeOut" } }}
                                    className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-5 hover:border-[var(--brand)]/50 hover:shadow-xl hover:shadow-[var(--brand)]/10 transition-all duration-300 flex flex-col justify-between h-full text-left"
                                >
                                    <div>
                                        
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="space-y-1.5 flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="inline-flex items-center h-5 px-2 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {genderLabel[item.gender]}
                                                    </span>
                                                    {item.lapangan && (
                                                        <span className="inline-flex items-center h-5 px-2 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                                                            {item.lapangan.nama_lapangan}
                                                        </span>
                                                    )}
                                                    {isPenuh && (
                                                        <span className="inline-flex items-center h-5 px-2 rounded-md text-xs font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20">
                                                            Penuh
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="font-semibold text-base text-foreground line-clamp-1 pt-0.5">
                                                    {item.judul}
                                                </h3>
                                            </div>

                                            
                                            <MabarImage
                                                src={item.foto}
                                                alt={item.judul}
                                                variant="avatar"
                                                className="size-12 shrink-0"
                                            />
                                        </div>

                                        
                                        <div className="space-y-1.5 text-sm text-muted-foreground mb-5 pb-4 border-b border-border/50">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="size-4 text-muted-foreground/80 shrink-0" />
                                                <span>{formatTanggal(item.tanggal)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-4 text-muted-foreground/80 shrink-0" />
                                                <span>
                                                    {formatJam(item.jam_mulai)} - {formatJam(item.jam_selesai)} WIB
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="size-4 text-muted-foreground/80 shrink-0" />
                                                <span>
                                                    Terdaftar: {item.peserta_terdaftar_count}/{item.kuota} orang
                                                </span>
                                            </div>
                                            {item.user && (
                                                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground/90">
                                                    <User className="size-3.5 text-muted-foreground/80 shrink-0" />
                                                    <span>Dibuat oleh: {item.user.nama}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link href={`/open-mabar/${item.id_mabar}`} className="w-full block">
                                        <Button variant="outline" className="w-full justify-between h-9 text-xs font-medium hover:border-[var(--brand)]/40">
                                            <span>Lihat Detail</span>
                                            <ArrowRight className="size-3.5" />
                                        </Button>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {jadwal.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        {jadwal.links.map((link, idx) => {
                            const labelText = link.label
                                .replace(/&laquo;/g, "")
                                .replace(/&raquo;/g, "")
                                .trim();
                            const displayLabel = labelText.toLowerCase().includes("previous")
                                ? "Sebelumnya"
                                : labelText.toLowerCase().includes("next")
                                ? "Berikutnya"
                                : labelText;

                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 text-xs text-muted-foreground opacity-50 border border-transparent"
                                    >
                                        {displayLabel}
                                    </span>
                                );
                            }
                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                                        link.active
                                            ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                                            : "bg-card border-border hover:bg-accent text-foreground"
                                    }`}
                                >
                                    {displayLabel}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
            </div>
        </PublicLayout>
    );
}
