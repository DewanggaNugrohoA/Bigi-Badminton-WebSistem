import PublicLayout from "@/layouts/public-layout";
import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MabarImage } from "@/components/mabar-image";
import { Calendar, Clock, Users, User, Filter, RotateCcw, PlusCircle, ArrowRight } from "lucide-react";

interface JadwalItem {
    id_mabar: number;
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    gender: "putra" | "putri" | "campuran";
    batas_usia_min: number;
    batas_usia_max: number;
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
        usia: string;
        tanggal: string;
        gender: string;
    };
}

export default function OpenMabarIndex({ jadwal, filters }: IndexProps) {
    const [usia, setUsia] = useState(filters.usia || "");
    const [tanggal, setTanggal] = useState(filters.tanggal || "");
    const [gender, setGender] = useState(filters.gender || "");

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/open-mabar",
            {
                usia: usia || undefined,
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
        setUsia("");
        setTanggal("");
        setGender("");
        router.get("/open-mabar", {}, { preserveState: true, preserveScroll: true });
    };

    const formatTanggal = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
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
        <PublicLayout title="Cari Jadwal Open Mabar - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-[var(--brand)] border border-primary/20 mb-3">
                            <span>Komunitas Badminton</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Jadwal Open Mabar
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                            Temukan teman mabar badminton dan pilih slot main yang cocok untukmu.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/open-mabar/create">
                            <Button className="gap-2 bg-[var(--brand)] hover:opacity-90">
                                <PlusCircle className="size-4" />
                                <span>Buat Jadwal</span>
                            </Button>
                        </Link>
                        <Link href="/open-mabar/saya">
                            <Button variant="outline">
                                <span>Jadwal Saya</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-card border border-border/60 rounded-xl p-5 mb-8 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label htmlFor="usia" className="text-xs font-semibold text-muted-foreground">
                                Usia Pemain
                            </Label>
                            <Input
                                id="usia"
                                type="number"
                                min={1}
                                max={100}
                                placeholder="Contoh: 22"
                                value={usia}
                                onChange={(e) => setUsia(e.target.value)}
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal" className="text-xs font-semibold text-muted-foreground">
                                Tanggal Main
                            </Label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="gender" className="text-xs font-semibold text-muted-foreground">
                                Kategori Gender
                            </Label>
                            <select
                                id="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                            >
                                <option value="" className="bg-background text-foreground">Semua Kategori</option>
                                <option value="putra" className="bg-background text-foreground">Putra</option>
                                <option value="putri" className="bg-background text-foreground">Putri</option>
                                <option value="campuran" className="bg-background text-foreground">Campuran</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button type="submit" className="flex-1 h-10 min-h-[44px] gap-2 bg-[var(--brand)] hover:opacity-90">
                                <Filter className="size-4" />
                                <span>Terapkan</span>
                            </Button>
                            {(usia || tanggal || gender) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    className="h-10 min-h-[44px] px-3.5"
                                    title="Reset filter"
                                    aria-label="Reset filter pencarian"
                                >
                                    <RotateCcw className="size-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Jadwal */}
                {jadwal.data.length === 0 ? (
                    <div className="border border-dashed border-border/80 rounded-2xl p-12 text-center bg-card/40 my-10">
                        <Users className="size-12 mx-auto text-muted-foreground/40 mb-3" />
                        <h3 className="text-lg font-semibold text-foreground">Belum ada jadwal yang cocok</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                            Tidak menemukan jadwal dengan kriteria yang dicari. Silakan ubah filter atau buat jadwal mabar baru!
                        </p>
                        <Link href="/open-mabar/create" className="mt-5 inline-block">
                            <Button className="bg-[var(--brand)] hover:opacity-90">Buat Jadwal Baru</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jadwal.data.map((item) => {
                            const isPenuh = item.peserta_terdaftar_count >= item.kuota;
                            return (
                                <div
                                    key={item.id_mabar}
                                    className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-border transition-all flex flex-col group shadow-sm"
                                >
                                    <MabarImage src={item.foto} alt={item.judul} />

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                                                    {genderLabel[item.gender]}
                                                </span>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        isPenuh
                                                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    }`}
                                                >
                                                    {isPenuh ? "Penuh" : `Tersedia: ${item.kuota - item.peserta_terdaftar_count} slot`}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                                                {item.judul}
                                            </h3>

                                            <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-3.5 text-primary shrink-0" />
                                                    <span>{formatTanggal(item.tanggal)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="size-3.5 text-primary shrink-0" />
                                                    <span>
                                                        {formatJam(item.jam_mulai)} - {formatJam(item.jam_selesai)} WIB
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="size-3.5 text-primary shrink-0" />
                                                    <span>
                                                        Usia {item.batas_usia_min} - {item.batas_usia_max} th • Terdaftar: {item.peserta_terdaftar_count}/{item.kuota}
                                                    </span>
                                                </div>
                                                {item.user && (
                                                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                                                        <User className="size-3.5 text-muted-foreground shrink-0" />
                                                        <span>Dibuat oleh: {item.user.nama}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Link href={`/open-mabar/${item.id_mabar}`} className="w-full mt-2 block">
                                            <Button variant="outline" className="w-full justify-between">
                                                <span>Lihat Detail</span>
                                                <ArrowRight className="size-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {jadwal.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        {jadwal.links.map((link, idx) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="px-3 py-1.5 text-xs text-muted-foreground opacity-50 border border-transparent"
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                                        link.active
                                            ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                                            : "bg-card border-border hover:bg-accent text-foreground"
                                    }`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
