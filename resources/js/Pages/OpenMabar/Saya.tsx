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
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Disetujui
                    </span>
                );
            case "ditolak":
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Ditolak
                    </span>
                );
            case "menunggu":
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Menunggu Persetujuan
                    </span>
                );
        }
    };

    return (
        <PublicLayout title="Jadwal Saya - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
                {/* Header */}
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

                {/* Notifikasi Flash */}
                {flash?.success && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
                        {flash.success}
                    </div>
                )}

                {/* List Jadwal Saya */}
                {jadwalSaya.data.length === 0 ? (
                    <div className="border border-dashed border-border/80 rounded-2xl p-12 text-center bg-card/40 my-10">
                        <Calendar className="size-12 mx-auto text-muted-foreground/40 mb-3" />
                        <h3 className="text-lg font-semibold text-foreground">Anda belum membuat jadwal mabar</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                            Inisiasi kegiatan main bareng bersama komunitas pemain Bigi Badminton sekarang juga!
                        </p>
                        <Link href="/open-mabar/create" className="mt-5 inline-block">
                            <Button className="bg-[var(--brand)] hover:opacity-90">Buat Jadwal Pertama</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jadwalSaya.data.map((item) => (
                            <div
                                key={item.id_mabar}
                                className="bg-card border border-border/60 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-border transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                                    <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden shrink-0">
                                        <MabarImage src={item.foto} alt={item.judul} aspectRatio="h-full w-full" />
                                    </div>
                                    <div className="space-y-1.5 flex-1">
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
                                        <h3 className="font-bold text-lg text-foreground line-clamp-1">
                                            {item.judul}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3.5 text-primary" />
                                                {formatTanggal(item.tanggal)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3.5 text-primary" />
                                                {formatJam(item.jam_mulai)} - {formatJam(item.jam_selesai)} WIB
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3.5 text-primary" />
                                                Peserta: {item.peserta_terdaftar_count}/{item.kuota}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Aksi */}
                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                                    {/* Edit hanya jika status menunggu atau ditolak */}
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

                {/* Pagination */}
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
