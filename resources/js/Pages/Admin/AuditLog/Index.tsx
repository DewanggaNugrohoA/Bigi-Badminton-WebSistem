import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { formatTanggal, formatJam } from "@/lib/admin-format";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
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
    ShieldCheck,
    Search,
    RotateCcw,
    Calendar,
    UserCheck,
    Eye,
} from "lucide-react";

interface UserItem {
    id_user: number;
    nama: string;
    role: string;
    email?: string;
    no_whatsapp?: string;
}

interface AuditLogItem {
    id_log: number;
    id_user: number | null;
    role: string | null;
    aksi: string;
    objek: string;
    modul: string | null;
    keterangan: string | null;
    data_lama: any;
    data_baru: any;
    ip_address: string | null;
    waktu: string;
    user?: UserItem | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

interface Props {
    logs: PaginatedData<AuditLogItem>;
    aksiList: string[];
    userList: UserItem[];
    filters: {
        start_date: string;
        end_date: string;
        aksi: string;
        role: string;
        id_user: string;
        search: string;
    };
}

export default function AuditLogIndex({
    logs,
    aksiList,
    userList,
    filters,
}: Props) {
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [aksiFilter, setAksiFilter] = useState(filters.aksi || "");
    const [roleFilter, setRoleFilter] = useState(filters.role || "");
    const [userFilter, setUserFilter] = useState(filters.id_user || "");
    const [search, setSearch] = useState(filters.search || "");

    // Modal Detail JSON
    const [detailItem, setDetailItem] = useState<AuditLogItem | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/admin/audit-log",
            {
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                aksi: aksiFilter || undefined,
                role: roleFilter || undefined,
                id_user: userFilter || undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        setAksiFilter("");
        setRoleFilter("");
        setUserFilter("");
        setSearch("");
        router.get("/admin/audit-log", {}, { preserveState: true });
    };

    const viewDetail = (item: AuditLogItem) => {
        setDetailItem(item);
        setDetailModalOpen(true);
    };

    const getRoleBadgeVariant = (role: string | null) => {
        switch (role?.toLowerCase()) {
            case "admin":
                return "default";
            case "kasir":
                return "warning";
            case "user":
                return "success";
            default:
                return "neutral";
        }
    };

    const getAksiBadgeClass = (aksi: string) => {
        const lower = aksi.toLowerCase();
        if (lower.includes("void") || lower.includes("hapus") || lower.includes("batal") || lower.includes("tolak")) {
            return "bg-rose-500/10 text-rose-400 border-rose-500/30";
        }
        if (lower.includes("tambah") || lower.includes("sukses") || lower.includes("penjualan") || lower.includes("buka")) {
            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        }
        if (lower.includes("restock") || lower.includes("opname") || lower.includes("update") || lower.includes("edit")) {
            return "bg-amber-500/10 text-amber-400 border-amber-500/30";
        }
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    };

    return (
        <AdminLayout
            title="Audit Log"
            breadcrumb={[{ label: "Data" }, { label: "Audit Log" }]}
        >
            <Head title="Audit Log Aktivitas - Bigi Badminton" />

            <div className="flex flex-col gap-6 w-full max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheck className="size-5 text-primary" />
                            Audit Log Aktivitas
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Rekam jejak seluruh operasi penting sistem secara kronologis untuk keamanan data, akuntabilitas staf, dan pencegahan fraud.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground border-border">
                            Total {logs.total} Rekaman Log
                        </Badge>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="start_date" className="text-xs font-medium text-muted-foreground">
                                Tanggal Mulai
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 text-xs w-36 sm:w-40"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="end_date" className="text-xs font-medium text-muted-foreground">
                                Tanggal Selesai
                            </Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 text-xs w-36 sm:w-40"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="role_filter" className="text-xs font-medium text-muted-foreground">
                                Role
                            </Label>
                            <select
                                id="role_filter"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="h-9 text-xs px-3 rounded-md bg-background border border-border text-foreground"
                            >
                                <option value="">Semua Role</option>
                                <option value="admin">Admin</option>
                                <option value="kasir">Kasir</option>
                                <option value="user">User</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="aksi_filter" className="text-xs font-medium text-muted-foreground">
                                Jenis Aksi
                            </Label>
                            <select
                                id="aksi_filter"
                                value={aksiFilter}
                                onChange={(e) => setAksiFilter(e.target.value)}
                                className="h-9 text-xs px-3 rounded-md bg-background border border-border text-foreground max-w-[180px] truncate"
                            >
                                <option value="">Semua Aksi</option>
                                {aksiList.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="user_filter" className="text-xs font-medium text-muted-foreground">
                                Pengguna
                            </Label>
                            <select
                                id="user_filter"
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="h-9 text-xs px-3 rounded-md bg-background border border-border text-foreground max-w-[160px] truncate"
                            >
                                <option value="">Semua Pengguna</option>
                                {userList.map((u) => (
                                    <option key={u.id_user} value={u.id_user}>
                                        {u.nama} ({u.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                            <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
                                Cari Keterangan
                            </Label>
                            <div className="relative">
                                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="Cari keterangan / IP..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 text-xs pl-8 w-full"
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="default" className="h-9 text-xs font-medium cursor-pointer">
                            Filter
                        </Button>

                        {(startDate || endDate || aksiFilter || roleFilter || userFilter || search) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleReset}
                                className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <RotateCcw className="size-3.5 mr-1" />
                                Reset
                            </Button>
                        )}
                    </form>
                </div>

                {/* Tabel Audit Log */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                    <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Kronologis Aktivitas Sistem</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Menampilkan peristiwa terbaru di bagian atas secara waktu nyata.
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Menampilkan {logs.data.length} dari {logs.total} rekaman
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap text-xs">Waktu & Tanggal</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Pengguna / Aktor</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Role</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Aksi</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Modul / Objek</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs">Keterangan Aktivitas</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-right">IP Address</TableHead>
                                    <TableHead className="whitespace-nowrap text-xs text-center">Detail</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                                            Tidak ada data log yang cocok dengan filter yang dipilih.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.data.map((item) => {
                                        const waktuStr = typeof item.waktu === "string" ? item.waktu : "";
                                        const role = item.role || item.user?.role || "tamu";

                                        return (
                                            <TableRow key={item.id_log} className="hover:bg-muted/40">
                                                <TableCell className="text-xs whitespace-nowrap tabular-nums">
                                                    <div className="font-medium text-foreground">
                                                        {formatTanggal(waktuStr)}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {waktuStr.length >= 16 ? formatJam(waktuStr.substring(11, 16)) : "-"} WIB
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    <div className="font-medium text-foreground">
                                                        {item.user?.nama || "Sistem / Tamu"}
                                                    </div>
                                                    {item.user?.email && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {item.user.email}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center whitespace-nowrap">
                                                    <Badge
                                                        variant={getRoleBadgeVariant(role) as any}
                                                        className="text-[10px] uppercase font-mono px-2 py-0.5"
                                                    >
                                                        {role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    <span
                                                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-medium ${getAksiBadgeClass(
                                                            item.aksi
                                                        )}`}
                                                    >
                                                        {item.aksi}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap text-muted-foreground font-mono">
                                                    {item.modul || item.objek || "-"}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-sm text-foreground/90">
                                                    {item.keterangan || "-"}
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap text-right font-mono text-muted-foreground">
                                                    {item.ip_address || "-"}
                                                </TableCell>
                                                <TableCell className="text-center whitespace-nowrap">
                                                    {item.data_lama || item.data_baru ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => viewDetail(item)}
                                                            className="h-7 px-2 text-xs text-primary hover:text-primary/80 cursor-pointer"
                                                            aria-label="Lihat data payload"
                                                        >
                                                            <Eye className="size-3.5 mr-1" />
                                                            Data
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
                            <span className="text-muted-foreground">
                                Halaman {logs.current_page} dari {logs.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                {logs.prev_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(logs.prev_page_url!)}
                                        className="h-8 text-xs cursor-pointer"
                                    >
                                        Sebelumnya
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 text-xs">
                                        Sebelumnya
                                    </Button>
                                )}
                                {logs.next_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(logs.next_page_url!)}
                                        className="h-8 text-xs cursor-pointer"
                                    >
                                        Berikutnya
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 text-xs">
                                        Berikutnya
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail JSON Payload */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-lg bg-card border border-border">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="size-4 text-primary" />
                            Detail Data Audit #{detailItem?.id_log}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Payload perubahan data yang terekam pada aksi {detailItem?.aksi} ({detailItem?.modul || detailItem?.objek}).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 mt-2 max-h-[60vh] overflow-y-auto">
                        {detailItem?.data_lama && (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-rose-400">Data Sebelumnya (Lama):</span>
                                <pre className="bg-background border border-border rounded-lg p-3 text-[11px] font-mono overflow-x-auto text-muted-foreground">
                                    {JSON.stringify(detailItem.data_lama, null, 2)}
                                </pre>
                            </div>
                        )}

                        {detailItem?.data_baru && (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-emerald-400">Data Baru:</span>
                                <pre className="bg-background border border-border rounded-lg p-3 text-[11px] font-mono overflow-x-auto text-muted-foreground">
                                    {JSON.stringify(detailItem.data_baru, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDetailModalOpen(false)}
                            className="h-9 text-xs cursor-pointer"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
