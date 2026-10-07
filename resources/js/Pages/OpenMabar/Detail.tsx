import PublicLayout from "@/layouts/public-layout";
import { Link, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { MabarImage } from "@/components/mabar-image";
import {
    Calendar,
    Clock,
    Users,
    User,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    MessageSquare,
    AlertTriangle,
    MapPin,
    ShieldCheck,
} from "lucide-react";
import { useState } from "react";

interface PesertaItem {
    id_peserta: number;
    tanggal_daftar: string;
    status_peserta: "terdaftar" | "batal";
    user?: {
        id_user: number;
        nama: string;
    };
}

interface DetailProps {
    mabar: {
        id_mabar: number;
        id_user: number;
        judul: string;
        tanggal: string;
        jam_mulai: string;
        jam_selesai: string;
        gender: "putra" | "putri" | "campuran";
        batas_usia_min: number;
        batas_usia_max: number;
        kuota: number;
        deskripsi: string | null;
        foto: string | null;
        status: "menunggu" | "disetujui" | "ditolak";
        user?: {
            id_user: number;
            nama: string;
        };
        lapangan?: {
            id_lapangan: number;
            nama_lapangan: string;
        } | null;
    };
    peserta: PesertaItem[];
    pesertaCount: number;
    isOwner: boolean;
    userStatus: "terdaftar" | "batal" | null;
    errors?: {
        message?: string;
    };
    flash?: {
        success?: string;
    };
}

export default function OpenMabarDetail({
    mabar,
    peserta,
    pesertaCount,
    isOwner,
    userStatus,
    errors,
    flash,
}: DetailProps) {
    const [submitting, setSubmitting] = useState(false);

    const isTerdaftar = userStatus === "terdaftar";
    const sisaKuota = Math.max(0, mabar.kuota - pesertaCount);
    const isPenuh = sisaKuota === 0;

    const handleIkut = () => {
        setSubmitting(true);
        router.post(
            `/open-mabar/${mabar.id_mabar}/ikut`,
            {},
            {
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const handleBatalIkut = () => {
        if (confirm("Apakah Anda yakin ingin membatalkan keikutsertaan Anda dalam jadwal mabar ini?")) {
            setSubmitting(true);
            router.delete(`/open-mabar/${mabar.id_mabar}/ikut`, {
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const formatTanggal = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
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

    const formatJam = (timeStr: string) => (timeStr ? timeStr.substring(0, 5) : "");

    const genderLabel = {
        putra: "Putra",
        putri: "Putri",
        campuran: "Campuran (Putra & Putri)",
    };

    return (
        <PublicLayout title={`${mabar.judul} - Open Mabar Bigi Badminton`}>
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
                <Link
                    href="/open-mabar"
                    className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Kembali ke Cari Jadwal</span>
                </Link>

                {errors?.message && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-6 flex items-center gap-2">
                        <XCircle className="size-4 shrink-0" />
                        <span>{errors.message}</span>
                    </div>
                )}

                {/* Status Khusus Pemilik jika belum disetujui */}
                {isOwner && mabar.status !== "disetujui" && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm mb-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                            <span>
                                Status jadwal ini: <strong>{mabar.status.toUpperCase()}</strong>. Hanya Anda (pemilik) yang dapat melihat halaman ini saat belum disetujui.
                            </span>
                        </div>
                        <Link href={`/open-mabar/${mabar.id_mabar}/edit`}>
                            <Button variant="outline" size="sm" className="shrink-0">Edit Jadwal</Button>
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Banner Card */}
                        <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
                            <MabarImage src={mabar.foto} alt={mabar.judul} aspectRatio="aspect-[21/9] sm:aspect-[16/7]" />

                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-[var(--brand)] border border-primary/20">
                                        {genderLabel[mabar.gender]}
                                    </span>
                                    {mabar.lapangan && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            {mabar.lapangan.nama_lapangan}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                                    {mabar.judul}
                                </h1>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Calendar className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Tanggal</p>
                                            <p className="font-semibold text-foreground">{formatTanggal(mabar.tanggal)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Clock className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Waktu Main</p>
                                            <p className="font-semibold text-foreground">
                                                {formatJam(mabar.jam_mulai)} - {formatJam(mabar.jam_selesai)} WIB
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Users className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Batas Usia</p>
                                            <p className="font-semibold text-foreground">
                                                {mabar.batas_usia_min} s/d {mabar.batas_usia_max} tahun
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <User className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Inisiator</p>
                                            <p className="font-semibold text-foreground">
                                                {mabar.user?.nama || "Pemain"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {mabar.deskripsi && (
                                    <div className="mt-6">
                                        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">
                                            Deskripsi & Catatan
                                        </h2>
                                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-xl border border-border/40">
                                            {mabar.deskripsi}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ruang Obrolan Tautan */}
                        <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0">
                                    <MessageSquare className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-foreground text-base">Forum Diskusi Mabar</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Koordinasi dengan sesama pemain dalam ruang obrolan.
                                    </p>
                                </div>
                            </div>
                            <Link href={`/open-mabar/${mabar.id_mabar}/chat`}>
                                <Button variant="outline" className="gap-2">
                                    <MessageSquare className="size-4" />
                                    <span>Buka Ruang Obrolan</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Sidebar: Partisipasi & Daftar Peserta */}
                    <div className="space-y-6">
                        {/* Status Card Partisipasi */}
                        <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-lg text-foreground mb-4">Status Kuota</h2>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50 mb-6">
                                <div>
                                    <p className="text-xs text-muted-foreground">Terdaftar</p>
                                    <p className="text-2xl font-black text-foreground">
                                        {pesertaCount} <span className="text-xs font-normal text-muted-foreground">/ {mabar.kuota} orang</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Sisa Slot</p>
                                    <p
                                        className={`text-2xl font-black ${
                                            isPenuh ? "text-rose-400" : "text-emerald-400"
                                        }`}
                                    >
                                        {sisaKuota}
                                    </p>
                                </div>
                            </div>

                            {/* Tombol Ikut / Batal Ikut */}
                            {mabar.status !== "disetujui" ? (
                                <div className="text-center p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                                    Pendaftaran belum dibuka (jadwal belum disetujui admin).
                                </div>
                            ) : isTerdaftar ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                                        <ShieldCheck className="size-4" />
                                        <span>Anda terdaftar sebagai peserta</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={submitting}
                                        onClick={handleBatalIkut}
                                        className="w-full text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 border-rose-500/20 text-xs"
                                    >
                                        {submitting ? "Memproses..." : "Batal Ikut Mabar"}
                                    </Button>
                                </div>
                            ) : isPenuh ? (
                                <div className="space-y-2">
                                    <Button disabled className="w-full opacity-60">
                                        Kuota Penuh
                                    </Button>
                                    <p className="text-[11px] text-muted-foreground text-center">
                                        Slot peserta untuk jadwal ini sudah terisi penuh.
                                    </p>
                                </div>
                            ) : (
                                <Button
                                    disabled={submitting}
                                    onClick={handleIkut}
                                    className="w-full bg-[var(--brand)] hover:opacity-90 font-semibold"
                                >
                                    {submitting ? "Memproses..." : "Ikut Mabar Sekarang"}
                                </Button>
                            )}
                        </div>

                        {/* Daftar Peserta */}
                        <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-base text-foreground mb-4 flex items-center justify-between">
                                <span>Daftar Peserta</span>
                                <span className="text-xs font-normal text-muted-foreground">
                                    ({pesertaCount} orang)
                                </span>
                            </h2>

                            {peserta.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">
                                    Belum ada peserta yang mendaftar. Jadilah pemain pertama!
                                </p>
                            ) : (
                                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                    {peserta.map((p, idx) => (
                                        <div
                                            key={p.id_peserta}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="size-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    {p.user?.nama || "Pemain"}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">
                                                Terdaftar
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
