import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { MabarImage } from "@/components/mabar-image";
import { ShuttlecockSilhouette } from "@/components/shuttlecock-silhouette";
import {
    Calendar,
    Clock,
    User,
    XCircle,
    MessageSquare,
    AlertTriangle,
    MapPin,
} from "lucide-react";

export interface OpenMabarData {
    id_mabar: number;
    id_user: number;
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    gender: "putra" | "putri" | "campuran";
    kuota: number;
    deskripsi?: string | null;
    foto?: string | null;
    status: "menunggu" | "disetujui" | "ditolak";
    user?: {
        id_user: number;
        nama: string;
    };
    lapangan?: {
        id_lapangan: number;
        nama_lapangan: string;
    } | null;
}

export interface OpenMabarDetailContentProps {
    mabar: OpenMabarData;
    pesertaCount?: number;
    isOwner?: boolean;
    userStatus?: "terdaftar" | "batal" | null;
    canAccessChat?: boolean;
    errors?: {
        message?: string;
    };
    isPopup?: boolean;
    onActionSuccess?: () => void;
}

export function OpenMabarDetailContent({
    mabar,
    pesertaCount = 0,
    isOwner = false,
    userStatus = null,
    canAccessChat = false,
    errors,
    isPopup = false,
    onActionSuccess,
}: OpenMabarDetailContentProps) {
    const [submitting, setSubmitting] = useState(false);

    const isTerdaftar = userStatus === "terdaftar";
    const kuota = mabar?.kuota ?? 0;
    const count = pesertaCount ?? 0;
    const sisaKuota = Math.max(0, kuota - count);
    const isPenuh = sisaKuota === 0;

    const handleIkut = () => {
        if (!mabar?.id_mabar) return;
        setSubmitting(true);
        router.post(
            `/open-mabar/${mabar.id_mabar}/ikut`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    onActionSuccess?.();
                },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const handleBatalIkut = () => {
        if (!mabar?.id_mabar) return;
        if (confirm("Apakah Anda yakin ingin membatalkan keikutsertaan Anda dalam jadwal mabar ini?")) {
            setSubmitting(true);
            router.delete(`/open-mabar/${mabar.id_mabar}/ikut`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    onActionSuccess?.();
                },
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const handleBukaChat = () => {
        if (!mabar?.id_mabar) return;
        window.dispatchEvent(
            new CustomEvent("bigi:buka-chat", {
                detail: { idMabar: mabar.id_mabar },
            })
        );
    };

    const formatTanggal = (dateStr?: string | null) => {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
            if (isNaN(date.getTime())) return dateStr;
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

    const formatJam = (timeStr?: string | null) => (timeStr ? timeStr.substring(0, 5) : "");

    const genderLabel: Record<string, string> = {
        putra: "Putra",
        putri: "Putri",
        campuran: "Campuran (Putra & Putri)",
    };

    const displayGender =
        mabar?.gender && genderLabel[mabar.gender]
            ? genderLabel[mabar.gender]
            : (mabar?.gender ?? "Campuran");

    return (
        <div className="space-y-6">
            {errors?.message && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                    <XCircle className="size-4 shrink-0 text-rose-600" />
                    <span>{errors.message}</span>
                </div>
            )}

            {isOwner && mabar?.status && mabar.status !== "disetujui" && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                        <span>
                            Status jadwal ini: <strong>{mabar.status.toUpperCase()}</strong>. Hanya Anda (pemilik) yang dapat melihat halaman ini saat belum disetujui.
                        </span>
                    </div>
                    {mabar?.id_mabar && (
                        <Link href={`/open-mabar/${mabar.id_mabar}/edit`}>
                            <Button variant="outline" size="sm" className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-100">Edit Jadwal</Button>
                        </Link>
                    )}
                </div>
            )}

            <div className={`grid grid-cols-1 ${isPopup ? "md:grid-cols-3" : "lg:grid-cols-3"} gap-6`}>
                <div className={`${isPopup ? "md:col-span-2" : "lg:col-span-2"} space-y-6`}>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden p-5 sm:p-6 relative shadow-xs">
                        <ShuttlecockSilhouette />
                        <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                            <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        {displayGender}
                                    </span>
                                    {mabar?.lapangan && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            {mabar.lapangan.nama_lapangan}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                                    {mabar?.judul ?? "Jadwal Open Mabar"}
                                </h1>
                            </div>

                            <MabarImage
                                src={mabar?.foto}
                                alt={mabar?.judul ?? "Mabar"}
                                variant="avatar"
                                className="size-16 sm:size-20 shrink-0 border border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                                    <Calendar className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-500 font-medium">Tanggal</p>
                                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">{formatTanggal(mabar?.tanggal)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                                    <Clock className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-500 font-medium">Waktu Main</p>
                                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                                        {formatJam(mabar?.jam_mulai)} - {formatJam(mabar?.jam_selesai)} WIB
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                                    <User className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-500 font-medium">Inisiator</p>
                                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                                        {mabar?.user?.nama || "Pemain"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {mabar?.deskripsi && (
                            <div className="mt-6 relative z-10">
                                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Deskripsi & Catatan
                                </h2>
                                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    {mabar.deskripsi}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
                        <h2 className="font-bold text-lg text-slate-900 mb-4">Status Kuota</h2>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Terdaftar</p>
                                <p className="text-2xl font-black text-slate-900">
                                    {count} <span className="text-xs font-normal text-slate-500">/ {kuota} orang</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-medium">Sisa Slot</p>
                                <p
                                    className={`text-2xl font-black ${
                                        isPenuh ? "text-rose-600" : "text-emerald-600"
                                    }`}
                                >
                                    {sisaKuota}
                                </p>
                            </div>
                        </div>

                        {mabar?.status !== "disetujui" ? (
                            <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                                Pendaftaran belum dibuka (jadwal belum disetujui admin).
                            </div>
                        ) : isTerdaftar ? (
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    disabled={submitting}
                                    onClick={handleBatalIkut}
                                    className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-11 min-h-[44px] font-semibold transition-colors"
                                >
                                    {submitting ? "Memproses..." : "Batal Ikut Mabar"}
                                </Button>
                            </div>
                        ) : isPenuh ? (
                            <div className="space-y-2">
                                <Button disabled className="w-full h-11 min-h-[44px] opacity-60 font-semibold bg-slate-100 border border-slate-200 text-slate-400">
                                    Kuota Penuh
                                </Button>
                                <p className="text-[11px] text-slate-500 text-center">
                                    Slot peserta untuk jadwal ini sudah terisi penuh.
                                </p>
                            </div>
                        ) : (
                            <Button
                                disabled={submitting}
                                onClick={handleIkut}
                                className="w-full h-11 min-h-[44px] bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow-xs"
                            >
                                {submitting ? "Memproses..." : "Ikut Mabar Sekarang"}
                            </Button>
                        )}

                        <div className="mt-6 pt-5 border-t border-slate-100">
                            {canAccessChat ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBukaChat}
                                    className="w-full h-10 gap-2 text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-600 hover:text-blue-600"
                                >
                                    <MessageSquare className="size-4" />
                                    <span>Gabung Forum Chat</span>
                                </Button>
                            ) : (
                                <p className="text-xs text-slate-500 text-center leading-relaxed">
                                    Ikuti Open Mabar ini untuk bergabung ke forum chat.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
