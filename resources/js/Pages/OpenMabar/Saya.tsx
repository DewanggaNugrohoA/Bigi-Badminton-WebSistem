import PublicLayout from "@/layouts/public-layout";
import { Link, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { MabarImage } from "@/components/mabar-image";
import { Calendar, Clock, Users, PlusCircle, Edit, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";

interface JadwalSayaItem {
    id_mabar: number;
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    gender: "putra" | "putri" | "campuran";
    batas_usia_min: number;
    batas_usia_max: number;
    kuota: number;
    status: "menunggu" | "disetujui" | "ditolak";
    foto?: string | null;
    peserta_terdaftar_count: number;
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

interface SayaProps {
    jadwalSaya: {
        data: JadwalSayaItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function OpenMabarSaya({ jadwalSaya, flash }: SayaProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = (id: number, judul: string) => {
        if (confirm(`Apakah Anda yakin ingin membatalkan dan menghapus jadwal "${judul}"?`)) {
            setDeletingId(id);
            router.delete(`/open-mabar/${id}`, {
                onFinish: () => setDeletingId(null),
            });
        }
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

    const formatJam = (timeStr: string) => (timeStr ? timeStr.substring(0, 5) : "");

    const statusBadge = (status: JadwalSayaItem["status"]) => {
        switch (status) {
            case "disetujui":
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Disetujui
                    </span>
                );
            case "ditolak":
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Ditolak
                    </span>
                );
            case "menunggu":
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Menunggu Persetujuan
                    </span>
                );
        }
    };

    return (
        <PublicLayout title="Jadwal Saya - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Jadwal Mabar Saya</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Kelola jadwal main bareng yang Anda buat, pantau status persetujuan, atau revisi jadwal.
                        </p>
                    </div>
                    <Link href="/open-mabar/create" className="shrink-0">
                        <Button className="gap-2 bg-[var(--brand)] hover:opacity-90">
                            <PlusCircle className="size-4" />
                            <span>Buat Jadwal Baru</span>
                        </Button>
                    </Link>
                </div>

                {jadwalSaya.data.length === 0 ? (
                    <div className="border border-dashed border-border/80 rounded-2xl p-6 sm:p-8 text-left bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs my-8">
                        <div className="flex items-start gap-4 text-left">
                            <div className="size-12 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center shrink-0 text-[var(--brand)]">
                                <Calendar className="size-6" />
                            </div>
                            <div className="space-y-1 text-left">
                                <h3 className="text-base font-semibold text-foreground">Anda Belum Membuat Jadwal Mabar</h3>
                                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                                    Inisiasi kegiatan main bareng bersama komunitas pemain Bigi Badminton sekarang juga! Buat jadwal, ajak pemain lain, dan kumpulkan peserta.
                                </p>
                            </div>
                        </div>
                        <Link href="/open-mabar/create" className="shrink-0 w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-10 px-5 gap-2 bg-[var(--brand)] hover:opacity-90 text-white shadow-xs font-semibold">
                                <PlusCircle className="size-4" />
                                <span>Buat Jadwal Pertama</span>
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jadwalSaya.data.map((item) => (
                            <div
                                key={item.id_mabar}
                                className="bg-card border border-border/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[var(--brand)]/40 hover:shadow-md shadow-xs transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                                    <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden shrink-0 border border-border/50">
                                        <MabarImage src={item.foto} alt={item.judul} aspectRatio="h-full w-full" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {statusBadge(item.status)}
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {item.gender}
                                            </span>
                                            {item.lapangan && (
                                                <span className="text-xs text-muted-foreground">
                                                    • {item.lapangan.nama_lapangan}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-base text-foreground line-clamp-1">
                                            {item.judul}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="size-3.5 text-muted-foreground" />
                                                {formatTanggal(item.tanggal)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="size-3.5 text-muted-foreground" />
                                                {formatJam(item.jam_mulai)} - {formatJam(item.jam_selesai)} WIB
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Users className="size-3.5 text-muted-foreground" />
                                                Peserta: {item.peserta_terdaftar_count}/{item.kuota}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                                    {(item.status === "menunggu" || item.status === "ditolak") && (
                                        <Link href={`/open-mabar/${item.id_mabar}/edit`}>
                                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                <Edit className="size-3.5" />
                                                <span>Revisi</span>
                                            </Button>
                                        </Link>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={deletingId === item.id_mabar}
                                        onClick={() => handleDelete(item.id_mabar, item.judul)}
                                        className="gap-1.5 text-xs text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 border-rose-500/20"
                                    >
                                        <Trash2 className="size-3.5" />
                                        <span>Batal</span>
                                    </Button>

                                    <Link href={`/open-mabar/${item.id_mabar}`}>
                                        <Button size="sm" className="gap-1.5 text-xs bg-[var(--brand)] hover:opacity-90">
                                            <span>Detail</span>
                                            <ArrowRight className="size-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {jadwalSaya.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        {jadwalSaya.links.map((link, idx) => {
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
