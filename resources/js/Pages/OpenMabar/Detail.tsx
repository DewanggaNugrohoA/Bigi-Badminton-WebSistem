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
    XCircle,
    MessageSquare,
    AlertTriangle,
    MapPin,
} from "lucide-react";
import { useState } from "react";

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
    pesertaCount: number;
    isOwner: boolean;
    userStatus: "terdaftar" | "batal" | null;
    canAccessChat: boolean;
    errors?: {
        message?: string;
    };
    flash?: {
        success?: string;
    };
}

export default function OpenMabarDetail({
    mabar,
    pesertaCount,
    isOwner,
    userStatus,
    canAccessChat,
    errors,
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

    const handleBukaChat = () => {
        window.dispatchEvent(
            new CustomEvent("bigi:buka-chat", {
                detail: { idMabar: mabar.id_mabar },
            })
        );
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
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm mb-6 flex items-center gap-2">
                        <XCircle className="size-4 shrink-0" />
                        <span>{errors.message}</span>
                    </div>
                )}

                {isOwner && mabar.status !== "disetujui" && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
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
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card border border-border/70 rounded-xl overflow-hidden p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                            {genderLabel[mabar.gender]}
                                        </span>
                                        {mabar.lapangan && (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border flex items-center gap-1">
                                                <MapPin className="size-3" />
                                                {mabar.lapangan.nama_lapangan}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                                        {mabar.judul}
                                    </h1>
                                </div>

                                
                                <MabarImage
                                    src={mabar.foto}
                                    alt={mabar.judul}
                                    variant="avatar"
                                    className="size-16 sm:size-20 shrink-0"
                                />
                            </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-background/60 border border-border/60 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                                            <Calendar className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground font-medium">Tanggal</p>
                                            <p className="font-semibold text-foreground text-xs sm:text-sm">{formatTanggal(mabar.tanggal)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                                            <Clock className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground font-medium">Waktu Main</p>
                                            <p className="font-semibold text-foreground text-xs sm:text-sm">
                                                {formatJam(mabar.jam_mulai)} - {formatJam(mabar.jam_selesai)} WIB
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                                            <Users className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground font-medium">Batas Usia</p>
                                            <p className="font-semibold text-foreground text-xs sm:text-sm">
                                                {mabar.batas_usia_min} s/d {mabar.batas_usia_max} tahun
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                                            <User className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground font-medium">Inisiator</p>
                                            <p className="font-semibold text-foreground text-xs sm:text-sm">
                                                {mabar.user?.nama || "Pemain"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {mabar.deskripsi && (
                                    <div className="mt-6">
                                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            Deskripsi & Catatan
                                        </h2>
                                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line bg-background/50 p-4 rounded-lg border border-border/50">
                                            {mabar.deskripsi}
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>

                    <div className="space-y-6">
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
                                            isPenuh ? "text-rose-600" : "text-emerald-600"
                                        }`}
                                    >
                                        {sisaKuota}
                                    </p>
                                </div>
                            </div>

                            {mabar.status !== "disetujui" ? (
                                <div className="text-center p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                                    Pendaftaran belum dibuka (jadwal belum disetujui admin).
                                </div>
                            ) : isTerdaftar ? (
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        disabled={submitting}
                                        onClick={handleBatalIkut}
                                        className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 border-rose-200 dark:border-rose-900/40 text-xs h-11 min-h-[44px] font-semibold transition-colors"
                                    >
                                        {submitting ? "Memproses..." : "Batal Ikut Mabar"}
                                    </Button>
                                </div>
                            ) : isPenuh ? (
                                <div className="space-y-2">
                                    <Button disabled className="w-full h-11 min-h-[44px] opacity-60 font-semibold">
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
                                    className="w-full h-11 min-h-[44px] bg-[var(--brand)] hover:opacity-90 font-semibold text-white shadow-xs"
                                >
                                    {submitting ? "Memproses..." : "Ikut Mabar Sekarang"}
                                </Button>
                            )}

                            
                            <div className="mt-6 pt-5 border-t border-border/60">
                                {canAccessChat ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBukaChat}
                                        className="w-full h-10 gap-2 text-sm font-medium hover:border-[var(--brand)]/50"
                                    >
                                        <MessageSquare className="size-4 text-[var(--brand)]" />
                                        <span>Gabung Forum Chat</span>
                                    </Button>
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                                        Ikuti Open Mabar ini untuk bergabung ke forum chat.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
