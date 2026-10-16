import React, { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Search,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Phone,
} from "lucide-react";
import { formatTanggal, formatJam } from "@/lib/admin-format";
import { buildWaLink } from "@/lib/content";

interface LapanganItem {
    id_lapangan: number;
    nama_lapangan: string;
    status_lapangan: string;
}

interface UserPengaju {
    id_user: number;
    nama: string;
    no_whatsapp: string | null;
}

interface OpenMabarItem {
    id_mabar: number;
    id_user: number;
    id_lapangan: number | null;
    judul: string;
    deskripsi: string | null;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    kuota?: number;
    slot_maksimal?: number;
    biaya_per_peserta?: number;
    level_permainan?: string | null;
    gender?: string;
    no_hp?: string | null;
    status: "menunggu" | "disetujui" | "ditolak";
    created_at: string;
    peserta_terdaftar_count: number;
    user: UserPengaju;
    lapangan: LapanganItem | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface OpenMabarIndexProps {
    daftarMabar: PaginatedData<OpenMabarItem>;
    daftarLapangan: LapanganItem[];
    filters: {
        status: string;
        q: string;
        tanggal: string;
    };
}

function formatTanggalPendek(dateStr: string): string {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(d);
    } catch {
        return dateStr;
    }
}

export default function OpenMabarIndex({
    daftarMabar,
    daftarLapangan,
    filters,
}: OpenMabarIndexProps) {
    const [statusFilter, setStatusFilter] = useState(filters.status || "semua");
    const [search, setSearch] = useState(filters.q || "");
    const [tanggal, setTanggal] = useState(filters.tanggal || "");

    React.useEffect(() => {
        setStatusFilter(filters.status || "semua");
        setSearch(filters.q || "");
        setTanggal(filters.tanggal || "");
    }, [filters.status, filters.q, filters.tanggal]);

    const [detailMabar, setDetailMabar] = useState<OpenMabarItem | null>(null);
    const [approveMabar, setApproveMabar] = useState<OpenMabarItem | null>(null);
    const [rejectMabar, setRejectMabar] = useState<OpenMabarItem | null>(null);

    const [conflictChecking, setConflictChecking] = useState(false);
    const [conflictMessage, setConflictMessage] = useState<string | null>(null);
    const [conflictStatus, setConflictStatus] = useState<"OK" | "CONFLICT" | "NEED_COURT" | null>(null);

    const approveForm = useForm({
        id_lapangan: "",
    });

    const rejectForm = useForm({
        alasan: "",
    });

    const handleFilterApply = (newStatus = statusFilter, newSearch = search, newTanggal = tanggal) => {
        const params: Record<string, string> = {
            status: newStatus,
        };
        if (newSearch && newSearch.trim() !== "") {
            params.q = newSearch.trim();
        }
        if (newTanggal && newTanggal.trim() !== "") {
            params.tanggal = newTanggal.trim();
        }

        router.get(
            "/admin/open-mabar",
            params,
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterApply();
    };

    const checkConflictAsync = async (idMabar: number, courtId?: number | string) => {
        setConflictChecking(true);
        setConflictMessage(null);
        setConflictStatus(null);
        try {
            const url = courtId
                ? `/admin/open-mabar/${idMabar}/conflict?id_lapangan=${courtId}`
                : `/admin/open-mabar/${idMabar}/conflict`;
            const res = await fetch(url, {
                headers: {
                    Accept: "application/json",
                },
            });
            const data = await res.json();
            setConflictStatus(data.status);
            setConflictMessage(data.message);
        } catch {
            setConflictStatus("CONFLICT");
            setConflictMessage("Gagal memeriksa konflik slot.");
        } finally {
            setConflictChecking(false);
        }
    };

    const openDetailModal = (mabar: OpenMabarItem) => {
        setDetailMabar(mabar);
        if (mabar.id_lapangan) {
            checkConflictAsync(mabar.id_mabar, mabar.id_lapangan);
        } else {
            setConflictStatus("NEED_COURT");
            setConflictMessage("Lapangan belum ditentukan oleh pengaju.");
        }
    };

    const openApproveModalFromDetail = (mabar: OpenMabarItem) => {
        setDetailMabar(null);
        setApproveMabar(mabar);
        const defaultCourt = mabar.id_lapangan
            ? String(mabar.id_lapangan)
            : (daftarLapangan[0]?.id_lapangan ? String(daftarLapangan[0].id_lapangan) : "");
        approveForm.setData("id_lapangan", defaultCourt);
        if (defaultCourt) {
            checkConflictAsync(mabar.id_mabar, defaultCourt);
        } else {
            setConflictStatus("NEED_COURT");
            setConflictMessage("Pilih lapangan terlebih dahulu untuk memverifikasi ketersediaan slot.");
        }
    };

    const openRejectModalFromDetail = (mabar: OpenMabarItem) => {
        setDetailMabar(null);
        setRejectMabar(mabar);
        rejectForm.setData("alasan", "");
        rejectForm.clearErrors();
    };

    const handleApproveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!approveMabar) return;

        approveForm.post(`/admin/open-mabar/${approveMabar.id_mabar}/approve`, {
            preserveScroll: true,
            onSuccess: () => {
                setApproveMabar(null);
                approveForm.reset();
            },
        });
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectMabar) return;

        rejectForm.post(`/admin/open-mabar/${rejectMabar.id_mabar}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectMabar(null);
                rejectForm.reset();
            },
        });
    };

    const renderStatusBadge = (status: string) => {
        if (status === "menunggu") {
            return (
                <Badge variant="warning" className="h-6 px-2.5 text-xs whitespace-nowrap">
                    Menunggu
                </Badge>
            );
        }
        if (status === "disetujui") {
            return (
                <Badge variant="success" className="h-6 px-2.5 text-xs whitespace-nowrap">
                    Disetujui
                </Badge>
            );
        }
        if (status === "ditolak") {
            return (
                <Badge variant="danger" className="h-6 px-2.5 text-xs whitespace-nowrap">
                    Ditolak
                </Badge>
            );
        }
        return (
            <Badge variant="neutral" className="h-6 px-2.5 text-xs whitespace-nowrap">
                {status}
            </Badge>
        );
    };

    return (
        <AdminLayout>
            <Head title="Persetujuan Open Mabar" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Persetujuan Open Mabar
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Verifikasi permohonan sesi mabar dari pelanggan sebelum dipublikasikan
                    </p>
                </div>

                
                <Card className="border-border/80">
                    <CardContent className="p-3 sm:p-4">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
                        >
                            <div className="w-full md:w-44 shrink-0">
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setStatusFilter(val);
                                        handleFilterApply(val, search, tanggal);
                                    }}
                                    className="h-9 text-sm"
                                    aria-label="Filter Status"
                                >
                                    <option value="semua">Semua Status</option>
                                    <option value="menunggu">Menunggu</option>
                                    <option value="disetujui">Disetujui</option>
                                    <option value="ditolak">Ditolak</option>
                                </Select>
                            </div>

                            <div className="w-full md:w-44 shrink-0">
                                <Input
                                    type="date"
                                    value={tanggal}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setTanggal(val);
                                        handleFilterApply(statusFilter, search, val);
                                    }}
                                    className="h-9 text-sm"
                                    aria-label="Filter Tanggal"
                                />
                            </div>

                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari judul atau pengaju..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 pl-9 text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button type="submit" size="sm" variant="secondary" className="h-9 px-4">
                                    Cari
                                </Button>
                                {(search || tanggal || statusFilter !== "semua") && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 px-3 text-xs"
                                        onClick={() => {
                                            setStatusFilter("semua");
                                            setSearch("");
                                            setTanggal("");
                                            handleFilterApply("semua", "", "");
                                        }}
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                
                <Card className="border-border/80">
                    <CardHeader className="p-4 sm:p-5 pb-0">
                        <CardTitle className="text-sm font-semibold tracking-wide text-foreground">
                            Daftar Permohonan Open Mabar ({daftarMabar.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-4">
                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <Table className="w-full min-w-[700px] lg:min-w-full text-sm">
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                                        <TableHead className="py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                                            Judul
                                        </TableHead>
                                        <TableHead className="py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                                            Pengaju
                                        </TableHead>
                                        <TableHead className="py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                                            Jadwal
                                        </TableHead>
                                        <TableHead className="py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap text-center">
                                            Kuota
                                        </TableHead>
                                        <TableHead className="py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap text-center">
                                            Status
                                        </TableHead>
                                        <TableHead className="py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {daftarMabar.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-32 text-center text-muted-foreground text-sm"
                                            >
                                                Tidak ada permohonan open mabar pada filter ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        daftarMabar.data.map((mabar) => {
                                            const courtLabel = mabar.lapangan
                                                ? mabar.lapangan.nama_lapangan
                                                : "Lapangan belum dipilih";
                                            const totalKuota = mabar.kuota ?? mabar.slot_maksimal ?? 0;

                                            return (
                                                <TableRow
                                                    key={mabar.id_mabar}
                                                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                                                >
                                                    
                                                    <TableCell className="py-3 font-medium text-foreground align-middle">
                                                        <div
                                                            className="max-w-[240px] truncate"
                                                            title={mabar.judul}
                                                        >
                                                            {mabar.judul}
                                                        </div>
                                                    </TableCell>

                                                    
                                                    <TableCell className="py-3 whitespace-nowrap align-middle">
                                                        <div className="font-medium text-foreground">{mabar.user?.nama ?? "-"}</div>
                                                        {mabar.no_hp && (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className="text-xs text-muted-foreground tabular-nums">{mabar.no_hp}</span>
                                                                <a
                                                                    href={buildWaLink(mabar.no_hp, `Halo ${mabar.user?.nama ?? "Pengaju"}, saya dari Admin Bigi Badminton mengenai permohonan Open Mabar "${mabar.judul}".`)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                                                                    title={`Hubungi ${mabar.user?.nama ?? "Pengaju"} via WhatsApp`}
                                                                >
                                                                    <Phone className="size-3" />
                                                                    <span>Hubungi</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    
                                                    <TableCell className="py-3 whitespace-nowrap align-middle">
                                                        <div className="flex flex-col">
                                                            <span className="tabular-nums text-foreground">
                                                                {formatTanggalPendek(mabar.tanggal)} {formatJam(mabar.jam_mulai)}-{formatJam(mabar.jam_selesai)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {courtLabel}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    
                                                    <TableCell className="py-3 whitespace-nowrap tabular-nums text-center text-foreground align-middle">
                                                        {mabar.peserta_terdaftar_count}/{totalKuota}
                                                    </TableCell>

                                                    
                                                    <TableCell className="py-3 whitespace-nowrap text-center align-middle">
                                                        {renderStatusBadge(mabar.status)}
                                                    </TableCell>

                                                    
                                                    <TableCell className="py-3 whitespace-nowrap text-right align-middle">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-3 text-xs"
                                                            onClick={() => openDetailModal(mabar)}
                                                        >
                                                            Tinjau
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        
                        {daftarMabar.links && daftarMabar.links.length > 3 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-border">
                                <div className="text-xs text-muted-foreground">
                                    Menampilkan {daftarMabar.data.length} dari total {daftarMabar.total} permohonan
                                </div>
                                <div className="flex items-center gap-1">
                                    {daftarMabar.links.map((link, idx) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-1 text-muted-foreground/50 text-xs"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        }
                                        return (
                                            <Button
                                                key={idx}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                className={
                                                    link.active
                                                        ? "bg-[var(--brand)] text-white h-7 px-2.5 text-xs"
                                                        : "h-7 px-2.5 text-xs"
                                                }
                                                onClick={() =>
                                                    router.get(link.url!, {}, { preserveState: true })
                                                }
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            
            <Dialog
                open={!!detailMabar}
                onOpenChange={(v) => {
                    if (!v) setDetailMabar(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Open Mabar</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap sesi mabar yang diajukan oleh pengguna
                        </DialogDescription>
                    </DialogHeader>

                    {detailMabar && (
                        <div className="space-y-4 text-sm">
                            <div className="p-3 bg-muted/40 rounded-lg space-y-2 border border-border/60">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Judul:</span>
                                    <span className="font-semibold text-foreground">{detailMabar.judul}</span>
                                </div>
                                {detailMabar.deskripsi && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Deskripsi:</span>
                                        <p className="text-xs text-foreground/90 whitespace-pre-line">
                                            {detailMabar.deskripsi}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground block">Pengaju:</span>
                                    <span className="font-medium text-foreground">{detailMabar.user?.nama ?? "-"}</span>
                                    {detailMabar.no_hp ? (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="block text-muted-foreground tabular-nums">
                                                {detailMabar.no_hp}
                                            </span>
                                            <a
                                                href={buildWaLink(detailMabar.no_hp, `Halo ${detailMabar.user?.nama ?? "Pengaju"}, saya dari Admin Bigi Badminton mengenai permohonan Open Mabar "${detailMabar.judul}".`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                                                title={`Hubungi ${detailMabar.user?.nama ?? "Pengaju"} via WhatsApp`}
                                            >
                                                <Phone className="size-3" />
                                                <span>Hubungi</span>
                                            </a>
                                        </div>
                                    ) : detailMabar.user?.no_whatsapp ? (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="block text-muted-foreground tabular-nums">
                                                {detailMabar.user.no_whatsapp}
                                            </span>
                                            <a
                                                href={buildWaLink(detailMabar.user.no_whatsapp, `Halo ${detailMabar.user?.nama ?? "Pengaju"}, saya dari Admin Bigi Badminton mengenai permohonan Open Mabar "${detailMabar.judul}".`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                                                title={`Hubungi ${detailMabar.user?.nama ?? "Pengaju"} via WhatsApp`}
                                            >
                                                <Phone className="size-3" />
                                                <span>Hubungi</span>
                                            </a>
                                        </div>
                                    ) : null}
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Status Permohonan:</span>
                                    <div className="mt-1">{renderStatusBadge(detailMabar.status)}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Tanggal:</span>
                                    <span className="font-medium text-foreground">
                                        {formatTanggal(detailMabar.tanggal)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Waktu:</span>
                                    <span className="font-medium text-foreground tabular-nums">
                                        {formatJam(detailMabar.jam_mulai)} - {formatJam(detailMabar.jam_selesai)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Lapangan:</span>
                                    <span className="font-medium text-foreground">
                                        {detailMabar.lapangan?.nama_lapangan ?? "Belum ditentukan"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Kuota & Terdaftar:</span>
                                    <span className="font-medium text-foreground tabular-nums">
                                        {detailMabar.peserta_terdaftar_count} / {detailMabar.kuota ?? detailMabar.slot_maksimal ?? 0} peserta
                                    </span>
                                </div>
                                {detailMabar.gender && (
                                    <div>
                                        <span className="text-muted-foreground block">Kategori:</span>
                                        <span className="font-medium text-foreground capitalize">
                                            {detailMabar.gender}
                                        </span>
                                    </div>
                                )}
                            </div>

                            
                            <div className="pt-2 border-t border-border">
                                <span className="text-xs font-medium text-muted-foreground block mb-1.5">
                                    Verifikasi Ketersediaan Slot:
                                </span>
                                {conflictChecking ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5">
                                        <Loader2 className="size-3.5 animate-spin" />
                                        Memeriksa bentrok jadwal...
                                    </div>
                                ) : conflictStatus === "OK" ? (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                                        <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                                        <span>{conflictMessage}</span>
                                    </div>
                                ) : conflictStatus === "CONFLICT" ? (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                        <span>{conflictMessage}</span>
                                    </div>
                                ) : (
                                    <div className="p-2.5 rounded-lg bg-muted text-muted-foreground text-xs">
                                        {conflictMessage || "Pilih lapangan untuk memeriksa ketersediaan."}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4 pt-3 border-t border-border flex items-center justify-between sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailMabar(null)}
                        >
                            Tutup
                        </Button>
                        {detailMabar && detailMabar.status === "menunggu" && (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => openRejectModalFromDetail(detailMabar)}
                                >
                                    Tolak
                                </Button>
                                <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={() => openApproveModalFromDetail(detailMabar)}
                                >
                                    Setujui
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            
            <Dialog
                open={!!approveMabar}
                onOpenChange={(v) => {
                    if (!v) {
                        setApproveMabar(null);
                        approveForm.reset();
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Persetujuan Mabar</DialogTitle>
                        <DialogDescription>
                            Sesi open mabar akan dipublikasikan ke daftar mabar user. Booking lapangan dapat dicatat secara manual di menu Reservasi Lapangan.
                        </DialogDescription>
                    </DialogHeader>

                    {approveMabar && (
                        <form onSubmit={handleApproveSubmit} className="space-y-4">
                            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 text-xs border border-border/60">
                                <div className="font-semibold text-foreground text-sm">
                                    {approveMabar.judul}
                                </div>
                                <div className="text-muted-foreground">
                                    Pengaju: <span className="text-foreground">{approveMabar.user.nama}</span>
                                </div>
                                <div className="text-muted-foreground tabular-nums">
                                    Jadwal: {formatTanggal(approveMabar.tanggal)} ({formatJam(approveMabar.jam_mulai)} - {formatJam(approveMabar.jam_selesai)})
                                </div>
                            </div>

                            
                            <div className="space-y-1.5">
                                <Label htmlFor="approve-court" className="text-xs font-medium">
                                    Pilih Lapangan {!approveMabar.id_lapangan && <span className="text-rose-500">*</span>}
                                </Label>
                                <Select
                                    id="approve-court"
                                    value={approveForm.data.id_lapangan}
                                    error={!!approveForm.errors.id_lapangan}
                                    onChange={(e) => {
                                        const courtId = e.target.value;
                                        approveForm.setData("id_lapangan", courtId);
                                        checkConflictAsync(approveMabar.id_mabar, courtId);
                                    }}
                                >
                                    <option value="">-- Pilih Lapangan --</option>
                                    {daftarLapangan.map((lap) => (
                                        <option key={lap.id_lapangan} value={lap.id_lapangan}>
                                            {lap.nama_lapangan} {lap.status_lapangan === "perawatan" ? "(Perawatan)" : ""}
                                        </option>
                                    ))}
                                </Select>
                                {approveForm.errors.id_lapangan && (
                                    <p className="text-xs text-rose-500">{approveForm.errors.id_lapangan}</p>
                                )}
                            </div>

                            
                            <div className="pt-1">
                                {conflictChecking ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                                        <Loader2 className="size-3.5 animate-spin" />
                                        Memvalidasi ketersediaan jadwal slot...
                                    </div>
                                ) : conflictStatus === "OK" ? (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                                        <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                                        <span>{conflictMessage}</span>
                                    </div>
                                ) : conflictStatus === "CONFLICT" ? (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold block">Peringatan Bentrok:</span>
                                            <span>{conflictMessage}</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <DialogFooter className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setApproveMabar(null);
                                        approveForm.reset();
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    size="sm"
                                    disabled={
                                        approveForm.processing ||
                                        conflictChecking ||
                                        conflictStatus === "CONFLICT" ||
                                        !approveForm.data.id_lapangan
                                    }
                                >
                                    {approveForm.processing ? "Menyimpan..." : "Setujui Permohonan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            
            <Dialog
                open={!!rejectMabar}
                onOpenChange={(v) => {
                    if (!v) {
                        setRejectMabar(null);
                        rejectForm.reset();
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tolak Permohonan Open Mabar</DialogTitle>
                        <DialogDescription>
                            Permohonan akan berstatus ditolak. Harap masukkan alasan penolakan secara jelas.
                        </DialogDescription>
                    </DialogHeader>

                    {rejectMabar && (
                        <form onSubmit={handleRejectSubmit} className="space-y-4">
                            <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-xs border border-border/60">
                                <div className="font-semibold text-foreground text-sm">
                                    {rejectMabar.judul}
                                </div>
                                <div className="text-muted-foreground">
                                    Pengaju: <span className="text-foreground">{rejectMabar.user.nama}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="alasan-tolak" className="text-xs font-medium">
                                    Alasan Penolakan <span className="text-rose-500">*</span>
                                </Label>
                                <Textarea
                                    id="alasan-tolak"
                                    placeholder="Contoh: Jadwal bentrok dengan turnamen internal atau deskripsi tidak sesuai aturan."
                                    rows={4}
                                    value={rejectForm.data.alasan}
                                    onChange={(e) => rejectForm.setData("alasan", e.target.value)}
                                    className={rejectForm.errors.alasan ? "border-destructive ring-destructive/20" : ""}
                                />
                                {rejectForm.errors.alasan && (
                                    <p className="text-xs text-rose-500">{rejectForm.errors.alasan}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setRejectMabar(null);
                                        rejectForm.reset();
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    size="sm"
                                    disabled={rejectForm.processing || rejectForm.data.alasan.trim().length < 5}
                                >
                                    {rejectForm.processing ? "Menolak..." : "Tolak Permohonan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
