import React, { useState, useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/material-design-3-button";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/admin-format";
import BookingModal from "./partials/BookingModal";
import PelunasanModal from "./partials/PelunasanModal";
import BatalModal from "./partials/BatalModal";
import QuickCustomerModal from "./partials/QuickCustomerModal";

interface LapanganItem {
    id_lapangan: number;
    nama_lapangan: string;
    harga_per_jam: number;
    status_lapangan: "tersedia" | "perawatan" | string;
}

interface GridSlotItem {
    jam: string;
    status: "tersedia" | "terpesan" | "open_mabar" | "perawatan";
    info: any;
}

interface GridLapangan {
    id_lapangan: number;
    nama_lapangan: string;
    harga_per_jam: number;
    status_lapangan: string;
    slots: GridSlotItem[];
}

interface ReservasiRow {
    id_reservasi: number;
    pemesan: {
        id_user: number;
        nama: string;
        no_whatsapp: string;
        jenis_pelanggan: string;
    };
    lapangan: string;
    jam_mulai: string;
    jam_selesai: string;
    total_biaya: number;
    total_dibayar: number;
    sisa_tagihan: number;
    status_pembayaran: "Lunas" | "DP" | string;
    status_reservasi: "terkonfirmasi" | "selesai" | "batal" | string;
    bisa_dilunasi: boolean;
    bisa_dibatalkan: boolean;
    bisa_diselesaikan: boolean;
}

interface MemberUser {
    id_user: number;
    nama: string;
    no_whatsapp: string;
    tanggal_mulai_member: string;
    tanggal_akhir_member: string;
}

interface Props {
    tanggal: string;
    tanggalLabel: string;
    prevDate: string;
    nextDate: string;
    lapangan: LapanganItem[];
    gridSlots: GridLapangan[];
    daftarReservasi: ReservasiRow[];
    members: MemberUser[];
    operatingHours: { start: string; end: string };
}

export default function ReservasiIndex({
    tanggal,
    tanggalLabel,
    prevDate,
    nextDate,
    lapangan = [],
    gridSlots = [],
    daftarReservasi = [],
    members = [],
    operatingHours = { start: "08:00", end: "23:00" },
}: Props) {
    
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [pelunasanModalOpen, setPelunasanModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<ReservasiRow | null>(null);

    
    const regularForm = useForm({
        nama_pemesan: "",
        no_whatsapp_pemesan: "",
        id_lapangan: lapangan[0]?.id_lapangan ? String(lapangan[0].id_lapangan) : "1",
        tanggal_main: tanggal,
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        jenis_pembayaran: "Lunas",
        nominal_dp: "",
    });

    
    const memberForm = useForm({
        id_user: members[0]?.id_user ? String(members[0].id_user) : "",
        id_lapangan: lapangan[0]?.id_lapangan ? String(lapangan[0].id_lapangan) : "1",
        hari: "0", // 0: Minggu
        jam_mulai: "19:00",
        jam_selesai: "21:00",
        harga_per_sesi: "",
        jenis_pembayaran: "Lunas",
        jumlah_bayar: "",
        metode_pembayaran: "transfer",
    });

    const [isCustomHargaPerSesi, setIsCustomHargaPerSesi] = useState(false);
    const [autofieldPreview, setAutofieldPreview] = useState<any | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    
    const pelunasanForm = useForm({
        jumlah: "",
        metode_pembayaran: "tunai",
        keterangan: "Pelunasan sisa tagihan sewa lapangan",
    });

    
    const cancelForm = useForm({
        alasan: "",
    });

    
    const quickCustomerForm = useForm({
        nama: "",
        no_whatsapp: "",
        jenis_pelanggan: "reguler",
        tanggal_mulai_member: "",
        tanggal_akhir_member: "",
    });

    
    const getTarifStandarRegular = () => {
        const lap = lapangan.find((l) => String(l.id_lapangan) === regularForm.data.id_lapangan);
        const harga = lap?.harga_per_jam || 50000;
        const [startH, startM = 0] = (regularForm.data.jam_mulai || "").split(":").map(Number);
        const [endH, endM = 0] = (regularForm.data.jam_selesai || "").split(":").map(Number);
        if (isNaN(startH) || isNaN(endH)) return 0;
        const durasiMenit = (endH * 60 + endM) - (startH * 60 + startM);
        if (durasiMenit <= 0) return 0;
        return Math.round((durasiMenit / 60) * harga);
    };

    
    const getTarifStandarMemberSesi = () => {
        const lap = lapangan.find((l) => String(l.id_lapangan) === memberForm.data.id_lapangan);
        const harga = lap?.harga_per_jam || 50000;
        const [startH, startM = 0] = (memberForm.data.jam_mulai || "").split(":").map(Number);
        const [endH, endM = 0] = (memberForm.data.jam_selesai || "").split(":").map(Number);
        if (isNaN(startH) || isNaN(endH)) return 0;
        const durasiMenit = (endH * 60 + endM) - (startH * 60 + startM);
        if (durasiMenit <= 0) return 0;
        return Math.round((durasiMenit / 60) * harga);
    };

    
    useEffect(() => {
        const tarif = getTarifStandarMemberSesi();
        if (!isCustomHargaPerSesi) {
            memberForm.setData("harga_per_sesi", tarif > 0 ? String(tarif) : "");
        }
    }, [
        memberForm.data.id_lapangan,
        memberForm.data.jam_mulai,
        memberForm.data.jam_selesai,
    ]);

    
    const handleSlotClick = (idLap: number, jam: string) => {
        const [h] = jam.split(":").map(Number);
        const nextH = Math.min(23, h + 2);
        const jamSelesai = `${String(nextH).padStart(2, "0")}:00`;

        regularForm.setData({
            ...regularForm.data,
            id_lapangan: String(idLap),
            tanggal_main: tanggal,
            jam_mulai: jam,
            jam_selesai: jamSelesai,
        });

        setBookingModalOpen(true);
    };

    
    const fetchMemberPreview = async () => {
        if (!memberForm.data.id_user || !memberForm.data.id_lapangan) return;
        setLoadingPreview(true);
        try {
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch("/admin/reservasi/autofield/preview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf || "",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    id_user: memberForm.data.id_user,
                    id_lapangan: memberForm.data.id_lapangan,
                    hari: memberForm.data.hari,
                    jam_mulai: memberForm.data.jam_mulai,
                    jam_selesai: memberForm.data.jam_selesai,
                    harga_per_sesi: memberForm.data.harga_per_sesi ? Number(memberForm.data.harga_per_sesi) : null,
                }),
            });
            const data = await res.json();
            setAutofieldPreview(data);
            if (data.total_biaya) {
                if (memberForm.data.jenis_pembayaran === "Lunas") {
                    memberForm.setData("jumlah_bayar", String(data.total_biaya));
                }
            }
        } catch (err) {
            toast.error("Gagal memuat pratinjau jadwal member.");
        } finally {
            setLoadingPreview(false);
        }
    };

    const submitRegular = (e: React.FormEvent) => {
        e.preventDefault();
        regularForm.post("/admin/reservasi/regular", {
            onSuccess: () => {
                setBookingModalOpen(false);
                regularForm.reset();
            },
        });
    };

    const submitAutofield = (e: React.FormEvent) => {
        e.preventDefault();
        memberForm.post("/admin/reservasi/autofield", {
            onSuccess: () => {
                setBookingModalOpen(false);
                setAutofieldPreview(null);
            },
        });
    };

    const submitPelunasan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReservation) return;
        pelunasanForm.post(`/admin/reservasi/${selectedReservation.id_reservasi}/pelunasan`, {
            onSuccess: () => {
                setPelunasanModalOpen(false);
                pelunasanForm.reset();
                setSelectedReservation(null);
            },
        });
    };

    const submitCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReservation) return;
        cancelForm.post(`/admin/reservasi/${selectedReservation.id_reservasi}/cancel`, {
            onSuccess: () => {
                setCancelModalOpen(false);
                cancelForm.reset();
                setSelectedReservation(null);
            },
        });
    };

    const handleFinish = (id: number) => {
        if (!confirm("Tandai pemesanan ini telah selesai bermain?")) return;
        regularForm.post(`/admin/reservasi/${id}/finish`);
    };

    const submitQuickCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch("/admin/reservasi/quick-customer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf || "",
                    Accept: "application/json",
                },
                body: JSON.stringify(quickCustomerForm.data),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                regularForm.setData({
                    ...regularForm.data,
                    nama_pemesan: data.customer.nama,
                    no_whatsapp_pemesan: data.customer.no_whatsapp,
                });
                setQuickCustomerModalOpen(false);
                quickCustomerForm.reset();
            } else {
                toast.error(data.message || "Gagal membuat akun cepat.");
            }
        } catch (err) {
            toast.error("Terjadi kendala koneksi.");
        }
    };

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    return (
        <AdminLayout
            title="Reservasi & Sewa Lapangan"
            breadcrumb={[{ label: "Operasional" }, { label: "Reservasi" }]}
        >
            <Head title="Manajemen Reservasi Lapangan - Admin" />

            <div className="space-y-6 sm:space-y-8 max-w-full overflow-hidden">
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
                    
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-heading">
                            Jadwal Lapangan
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Pilih slot kosong pada grid untuk membuat reservasi sewa langsung.
                        </p>
                    </div>

                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 sm:whitespace-nowrap">
                        
                        <div className="flex items-center justify-between sm:justify-start rounded-lg border border-border bg-card p-1 shadow-xs h-10 shrink-0">
                            <Link
                                href={`/admin/reservasi?tanggal=${prevDate}`}
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                                    "text-muted-foreground hover:text-foreground"
                                )}
                                aria-label="Hari sebelumnya"
                            >
                                <ChevronLeft className="size-4" />
                            </Link>

                            <div className="w-[200px] sm:w-[220px] px-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground select-none">
                                <CalendarIcon className="size-4 text-[var(--brand)] shrink-0" />
                                <span className="truncate text-center font-mono tabular-nums">{tanggalLabel}</span>
                            </div>

                            <Link
                                href={`/admin/reservasi?tanggal=${nextDate}`}
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                                    "text-muted-foreground hover:text-foreground"
                                )}
                                aria-label="Hari berikutnya"
                            >
                                <ChevronRight className="size-4" />
                            </Link>
                        </div>

                        
                        <Button
                            type="button"
                            onClick={() => {
                                regularForm.setData("tanggal_main", tanggal);
                                setBookingModalOpen(true);
                            }}
                            className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-10 px-4 gap-2 text-xs sm:text-sm shrink-0 whitespace-nowrap min-w-[140px] justify-center"
                        >
                            <Plus className="size-4 shrink-0" />
                            <span>Reservasi Baru</span>
                        </Button>
                    </div>
                </div>

                
                <Card className="p-0 overflow-hidden border-border/80 shadow-xs">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
                        <CardTitle className="text-base sm:text-lg">
                            Matriks Slot Lapangan ({tanggalLabel})
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="w-full overflow-x-auto scrollbar-thin">
                            <div className="min-w-[960px] p-4">
                                {gridSlots.map((lap) => (
                                    <div key={lap.id_lapangan} className="mb-6 last:mb-0">
                                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                                            <h3 className="font-bold text-sm text-foreground">
                                                {lap.nama_lapangan}
                                            </h3>
                                            {lap.status_lapangan === "perawatan" && (
                                                <Badge variant="danger" className="text-[10px]">
                                                    Sedang Dalam Perawatan
                                                </Badge>
                                            )}
                                        </div>

                                        
                                        <div className="grid grid-cols-15 gap-1.5">
                                            {lap.slots.map((slot) => {
                                                const isTersedia = slot.status === "tersedia";
                                                const isTerpesan = slot.status === "terpesan";
                                                const isDP = isTerpesan && slot.info?.status_pembayaran === "DP";
                                                const isMabar = slot.status === "open_mabar";
                                                const isPerawatan = slot.status === "perawatan";

                                                const statusDesc = isTersedia
                                                    ? "Kosong, klik untuk pesan"
                                                    : isTerpesan
                                                    ? `Terpesan oleh ${slot.info?.nama_pemesan || "Pelanggan"} (${slot.info?.status_pembayaran || "Terpesan"})`
                                                    : isMabar
                                                    ? `Open Mabar: ${slot.info?.judul || "Mabar Disetujui"}`
                                                    : "Perawatan / Tutup";

                                                return (
                                                    <button
                                                        key={slot.jam}
                                                        type="button"
                                                        disabled={!isTersedia}
                                                        onClick={() => isTersedia && handleSlotClick(lap.id_lapangan, slot.jam)}
                                                        aria-label={`${lap.nama_lapangan}, pukul ${slot.jam}, status ${statusDesc}`}
                                                        className={`flex flex-col justify-between p-2 rounded-lg text-left transition-all min-h-[76px] border outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 ${
                                                            isTersedia
                                                                ? "bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/25 hover:border-emerald-500 cursor-pointer hover:shadow-xs"
                                                                : isTerpesan
                                                                ? isDP
                                                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 cursor-not-allowed"
                                                                    : "bg-[var(--brand)]/10 border-[var(--brand)]/30 text-[var(--brand)] cursor-not-allowed"
                                                                : isMabar
                                                                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 cursor-not-allowed"
                                                                : "bg-rose-500/10 border-rose-500/25 text-rose-500 cursor-not-allowed"
                                                        }`}
                                                        title={
                                                            isTerpesan
                                                                ? `Terpesan: ${slot.info?.nama_pemesan} (${slot.info?.jam_mulai}-${slot.info?.jam_selesai}) [${slot.info?.status_pembayaran}]`
                                                                : isMabar
                                                                ? `Open Mabar: ${slot.info?.judul} (${slot.info?.jam_mulai}-${slot.info?.jam_selesai})`
                                                                : isPerawatan
                                                                ? "Lapangan Perawatan"
                                                                : `Klik untuk pesan ${slot.jam}`
                                                        }
                                                    >
                                                        <span className="text-[11px] font-mono font-semibold text-foreground/80">
                                                            {slot.jam}
                                                        </span>

                                                        <div className="text-[10px] leading-tight mt-1 min-w-0 w-full">
                                                            {isTersedia && (
                                                                <span className="text-emerald-500 font-medium">Kosong</span>
                                                            )}
                                                            {isTerpesan && (
                                                                <div className="font-semibold min-w-0">
                                                                    <div
                                                                        className="truncate"
                                                                        title={slot.info?.nama_pemesan}
                                                                    >
                                                                        {slot.info?.nama_pemesan}
                                                                    </div>
                                                                    <span className="text-[9px] uppercase font-bold tracking-wider">
                                                                        {slot.info?.status_pembayaran}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {isMabar && (
                                                                <div
                                                                    className="truncate font-semibold text-purple-400"
                                                                    title={slot.info?.judul || "Mabar Disetujui"}
                                                                >
                                                                    Mabar Disetujui
                                                                </div>
                                                            )}
                                                            {isPerawatan && (
                                                                <span className="text-rose-500 font-medium">Tutup</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                
                <Card className="border-border/80 shadow-xs">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/70">
                        <CardTitle className="text-base sm:text-lg font-bold">
                            Riwayat Reservasi Tanggal Ini
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        {daftarReservasi.length > 0 ? (
                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <Table className="min-w-[900px] w-full">
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/70">
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold py-3 px-4 whitespace-nowrap">
                                                Pemesan
                                            </TableHead>
                                            <TableHead className="w-[1%] text-xs uppercase tracking-wide text-muted-foreground font-semibold py-3 px-4 whitespace-nowrap">
                                                Lapangan
                                            </TableHead>
                                            <TableHead className="w-[1%] text-xs uppercase tracking-wide text-muted-foreground font-semibold py-3 px-4 whitespace-nowrap">
                                                Waktu Main
                                            </TableHead>
                                            <TableHead className="w-[1%] text-right text-xs uppercase tracking-wide text-muted-foreground font-semibold py-3 px-4 whitespace-nowrap">
                                                Total & Sisa
                                            </TableHead>
                                            <TableHead className="w-[1%] text-center text-xs uppercase tracking-wide text-muted-foreground font-semibold py-3 px-4 whitespace-nowrap">
                                                Status Bayar
                                            </TableHead>
                                            <TableHead className="w-[1%] text-center text-xs uppercase tracking-wide text-muted-foreground font-semibold py-3 px-4 whitespace-nowrap">
                                                Status Main
                                            </TableHead>
                                            <TableHead className="w-[1%] text-right text-xs uppercase tracking-wide text-muted-foreground font-semibold py-3 px-4 whitespace-nowrap">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {daftarReservasi.map((res) => {
                                            const noWa = res.pemesan.no_whatsapp && res.pemesan.no_whatsapp !== "-" ? res.pemesan.no_whatsapp : null;
                                            const sisaTagihan = Number(res.sisa_tagihan) || 0;
                                            const isLunas = res.status_pembayaran === "Lunas";

                                            return (
                                                <TableRow
                                                    key={res.id_reservasi}
                                                    className="hover:bg-muted/30 transition-colors border-b border-border/50"
                                                >
                                                    <TableCell className="py-3 px-4 align-middle whitespace-nowrap">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium text-sm text-foreground">
                                                                {res.pemesan.nama}
                                                            </span>
                                                            {noWa && (
                                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                                    {noWa}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 align-middle text-sm text-foreground whitespace-nowrap">
                                                        {res.lapangan}
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 align-middle text-sm tabular-nums text-foreground/90 whitespace-nowrap">
                                                        {res.jam_mulai} - {res.jam_selesai}
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 align-middle text-right whitespace-nowrap">
                                                        <div className="flex flex-col items-end text-sm tabular-nums">
                                                            <span className="text-foreground">
                                                                {formatRupiah(res.total_biaya)}
                                                            </span>
                                                            {sisaTagihan > 0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Sisa {formatRupiah(sisaTagihan)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 align-middle text-center whitespace-nowrap">
                                                        {isLunas ? (
                                                            <Badge
                                                                variant="success"
                                                                className="h-6 px-2.5 text-xs font-medium rounded-full justify-center min-w-[62px]"
                                                            >
                                                                Lunas
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="warning"
                                                                className="h-6 px-2.5 text-xs font-medium rounded-full justify-center min-w-[62px]"
                                                            >
                                                                DP
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 align-middle text-center whitespace-nowrap">
                                                        {res.status_reservasi === "terkonfirmasi" && (
                                                            <Badge
                                                                variant="info"
                                                                className="h-6 px-2.5 text-xs font-medium rounded-full justify-center min-w-[62px]"
                                                            >
                                                                Aktif
                                                            </Badge>
                                                        )}
                                                        {res.status_reservasi === "selesai" && (
                                                            <Badge
                                                                variant="neutral"
                                                                className="h-6 px-2.5 text-xs font-medium rounded-full justify-center min-w-[62px]"
                                                            >
                                                                Selesai
                                                            </Badge>
                                                        )}
                                                        {res.status_reservasi === "batal" && (
                                                            <Badge
                                                                variant="danger"
                                                                className="h-6 px-2.5 text-xs font-medium rounded-full justify-center min-w-[62px]"
                                                            >
                                                                Batal
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 align-middle text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                            {res.bisa_dilunasi && sisaTagihan > 0 && res.status_reservasi !== "batal" && res.status_reservasi !== "selesai" && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="default"
                                                                    className="text-sm cursor-pointer"
                                                                    aria-label={`Pelunasan reservasi ${res.pemesan.nama} (${res.jam_mulai} - ${res.jam_selesai})`}
                                                                    onClick={() => {
                                                                        setSelectedReservation(res);
                                                                        pelunasanForm.setData("jumlah", String(res.sisa_tagihan));
                                                                        setPelunasanModalOpen(true);
                                                                    }}
                                                                >
                                                                    Pelunasan
                                                                </Button>
                                                            )}

                                                            {res.bisa_diselesaikan && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-sm text-foreground cursor-pointer"
                                                                    aria-label={`Selesaikan reservasi ${res.pemesan.nama} (${res.jam_mulai} - ${res.jam_selesai})`}
                                                                    onClick={() => handleFinish(res.id_reservasi)}
                                                                >
                                                                    Selesai
                                                                </Button>
                                                            )}

                                                            {res.bisa_dibatalkan && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                                    aria-label={`Batalkan reservasi ${res.pemesan.nama} (${res.jam_mulai} - ${res.jam_selesai})`}
                                                                    onClick={() => {
                                                                        setSelectedReservation(res);
                                                                        setCancelModalOpen(true);
                                                                    }}
                                                                >
                                                                    Batal
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center p-4">
                                <span className="font-semibold text-sm text-foreground">
                                    Tidak ada reservasi pada tanggal ini
                                </span>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                    Silakan klik salah satu slot kosong pada grid di atas untuk membuat pesanan.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            
            <BookingModal
                open={bookingModalOpen}
                onOpenChange={setBookingModalOpen}
                lapangan={lapangan}
                members={members}
                regularForm={regularForm}
                submitRegular={submitRegular}
                totalBiayaRegular={getTarifStandarRegular()}
                memberForm={memberForm}
                submitAutofield={submitAutofield}
                autofieldPreview={autofieldPreview}
                setAutofieldPreview={setAutofieldPreview}
                loadingPreview={loadingPreview}
                fetchMemberPreview={fetchMemberPreview}
                getTarifStandarMemberSesi={getTarifStandarMemberSesi}
                isCustomHargaPerSesi={isCustomHargaPerSesi}
                setIsCustomHargaPerSesi={setIsCustomHargaPerSesi}
                operatingHours={operatingHours}
            />

            <PelunasanModal
                open={pelunasanModalOpen}
                onOpenChange={setPelunasanModalOpen}
                reservation={selectedReservation}
                form={pelunasanForm}
                onSubmit={submitPelunasan}
            />

            <BatalModal
                open={cancelModalOpen}
                onOpenChange={setCancelModalOpen}
                reservation={selectedReservation}
                form={cancelForm}
                onSubmit={submitCancel}
            />

            <QuickCustomerModal
                open={quickCustomerModalOpen}
                onOpenChange={setQuickCustomerModalOpen}
                form={quickCustomerForm}
                onSubmit={submitQuickCustomer}
            />
        </AdminLayout>
    );
}
