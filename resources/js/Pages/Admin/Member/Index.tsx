import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { Search, Package, Plus, UserCog } from "lucide-react";
import SetMemberModal from "./partials/SetMemberModal";
import TambahPaketModal from "./partials/TambahPaketModal";
import PaketDetailModal from "./partials/PaketDetailModal";

interface CustomerItem {
    id_user: number;
    nama: string;
    no_whatsapp: string;
    email: string | null;
    jenis_pelanggan: "member" | "reguler";
    status_member: "aktif" | "tidak_aktif";
    status_label: string;
    tanggal_mulai_member: string | null;
    tanggal_akhir_member: string | null;
    masa_berlaku_teks: string;
    sisa_sesi_aktif: number;
    paket_aktif_id: number | null;
    paket_list: any[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedCustomers {
    data: CustomerItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface MemberIndexProps {
    customers: PaginatedCustomers;
    filters: {
        search: string;
        filter: string;
    };
}

export default function MemberIndex({ customers, filters }: MemberIndexProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [filter, setFilter] = useState(filters.filter || "semua");

    const [selectedUserForStatus, setSelectedUserForStatus] = useState<CustomerItem | null>(null);
    const [selectedUserIdForDetail, setSelectedUserIdForDetail] = useState<number | null>(null);
    const [selectedUserForTambahPaket, setSelectedUserForTambahPaket] = useState<CustomerItem | null>(null);

    const selectedUserForDetail = selectedUserIdForDetail
        ? customers.data.find((c) => c.id_user === selectedUserIdForDetail) || null
        : null;

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/admin/member",
            { search, filter },
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        router.get(
            "/admin/member",
            { search, filter: newFilter },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AdminLayout
            title="Data & Paket Member"
            breadcrumb={[
                { label: "Dashboard", href: "/admin" },
                { label: "Member" },
            ]}
        >
            <Head title="Manajemen Member & Paket Sesi" />

            <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            Kelola Member & Paket Sesi
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Atur keanggotaan pelanggan, terbitkan paket sesi bermain, dan kelola kuota sesi.
                        </p>
                    </div>
                </div>

                <Card className="border-border bg-card">
                    <CardContent className="p-3 sm:p-5">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-3"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama pelanggan atau nomor WhatsApp..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 text-xs sm:text-sm h-9 sm:h-10"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Select
                                    value={filter}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="w-full sm:w-48 text-xs sm:text-sm h-9 sm:h-10"
                                >
                                    <option value="semua">Semua Pelanggan</option>
                                    <option value="aktif">Member Aktif</option>
                                    <option value="bukan_member">Bukan Member (Reguler)</option>
                                    <option value="kedaluwarsa">Member Kedaluwarsa</option>
                                </Select>

                                <Button type="submit" variant="secondary" className="text-xs sm:text-sm shrink-0 h-9 sm:h-10">
                                    Cari
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="p-3 sm:p-5 border-b border-border flex flex-row items-center justify-between">
                        <CardTitle className="text-sm sm:text-base font-semibold">
                            Daftar Pelanggan ({customers.total} Orang)
                        </CardTitle>
                    </CardHeader>

                    {/* Desktop & Tablet Table View */}
                    <div className="hidden md:block w-full overflow-x-auto">
                        <Table className="min-w-[720px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Nama Pelanggan</TableHead>
                                    <TableHead className="w-[130px]">WhatsApp</TableHead>
                                    <TableHead className="w-[90px]">Jenis</TableHead>
                                    <TableHead className="w-[170px]">Masa Berlaku</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[110px]">Sisa Sesi</TableHead>
                                    <TableHead className="text-right w-[170px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                                            Tidak ada data pelanggan yang sesuai dengan kriteria pencarian.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.data.map((c) => {
                                        const isMember = c.jenis_pelanggan === "member";
                                        const statusBadgeVariant =
                                            c.status_label === "Member Aktif"
                                                ? "success"
                                                : c.status_label === "Kedaluwarsa"
                                                ? "warning"
                                                : "neutral";

                                        return (
                                            <TableRow key={c.id_user} className="hover:bg-muted/40">
                                                <TableCell className="font-semibold text-foreground">
                                                    <div>{c.nama}</div>
                                                    {c.email && (
                                                        <div className="text-[11px] text-muted-foreground font-normal truncate max-w-[160px]">
                                                            {c.email}
                                                        </div>
                                                    )}
                                                </TableCell>

                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {c.no_whatsapp}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge
                                                        variant={isMember ? "success" : "neutral"}
                                                        className={isMember ? "bg-[var(--brand)] text-white border-transparent capitalize text-[10px]" : "capitalize text-[10px]"}
                                                    >
                                                        {c.jenis_pelanggan}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-xs text-muted-foreground font-mono">
                                                    {c.masa_berlaku_teks}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant={statusBadgeVariant} className="text-[10px]">
                                                        {c.status_label}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell>
                                                    {isMember ? (
                                                        <div className="font-mono font-bold text-xs text-foreground flex items-center gap-1">
                                                            <span className={c.sisa_sesi_aktif > 0 ? "text-[var(--brand)]" : "text-muted-foreground"}>
                                                                {c.sisa_sesi_aktif} Sesi
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs gap-1"
                                                            title="Atur status member"
                                                            onClick={() => setSelectedUserForStatus(c)}
                                                        >
                                                            <UserCog className="size-3.5" />
                                                            <span>Status</span>
                                                        </Button>

                                                        {isMember && (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-xs gap-1"
                                                                    title="Lihat rincian paket sesi"
                                                                    onClick={() => setSelectedUserIdForDetail(c.id_user)}
                                                                >
                                                                    <Package className="size-3.5" />
                                                                    <span>Paket</span>
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="h-8 text-xs gap-1"
                                                                    title="Tambah paket sesi baru"
                                                                    onClick={() => setSelectedUserForTambahPaket(c)}
                                                                >
                                                                    <Plus className="size-3.5" />
                                                                    <span>Tambah</span>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card List View (Optimal untuk 375px) */}
                    <div className="block md:hidden divide-y divide-border">
                        {customers.data.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-xs">
                                Tidak ada data pelanggan yang sesuai dengan kriteria pencarian.
                            </div>
                        ) : (
                            customers.data.map((c) => {
                                const isMember = c.jenis_pelanggan === "member";
                                const statusBadgeVariant =
                                    c.status_label === "Member Aktif"
                                        ? "success"
                                        : c.status_label === "Kedaluwarsa"
                                        ? "warning"
                                        : "neutral";

                                return (
                                    <div key={c.id_user} className="p-3.5 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-sm text-foreground truncate">{c.nama}</div>
                                                <div className="text-xs font-mono text-muted-foreground">{c.no_whatsapp}</div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Badge
                                                    variant={isMember ? "success" : "neutral"}
                                                    className={isMember ? "bg-[var(--brand)] text-white border-transparent capitalize text-[10px]" : "capitalize text-[10px]"}
                                                >
                                                    {c.jenis_pelanggan}
                                                </Badge>
                                                <Badge variant={statusBadgeVariant} className="text-[10px]">
                                                    {c.status_label}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2 rounded-md">
                                            <div>
                                                <span className="text-muted-foreground block text-[10px]">Masa Berlaku</span>
                                                <span className="font-mono text-foreground text-[11px] truncate block">
                                                    {c.masa_berlaku_teks}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-[10px]">Sisa Sesi</span>
                                                <span className="font-mono font-bold text-foreground text-[11px]">
                                                    {isMember ? `${c.sisa_sesi_aktif} Sesi` : "-"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5 pt-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs gap-1 flex-1"
                                                onClick={() => setSelectedUserForStatus(c)}
                                            >
                                                <UserCog className="size-3.5" />
                                                <span>Status</span>
                                            </Button>

                                            {isMember && (
                                                <>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs gap-1 flex-1"
                                                        onClick={() => setSelectedUserIdForDetail(c.id_user)}
                                                    >
                                                        <Package className="size-3.5" />
                                                        <span>Paket</span>
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 text-xs gap-1 flex-1"
                                                        onClick={() => setSelectedUserForTambahPaket(c)}
                                                    >
                                                        <Plus className="size-3.5" />
                                                        <span>Tambah</span>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {customers.last_page > 1 && (
                        <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                            <div>
                                Halaman {customers.current_page} dari {customers.last_page} ({customers.total} pelanggan)
                            </div>
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                                {customers.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 text-muted-foreground/50 text-xs"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Button
                                            key={idx}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            className={link.active ? "bg-[var(--brand)] text-white h-7 px-2.5 text-xs" : "h-7 px-2.5 text-xs"}
                                            onClick={() => router.get(link.url!, {}, { preserveState: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <SetMemberModal
                open={!!selectedUserForStatus}
                onOpenChange={(v) => {
                    if (!v) setSelectedUserForStatus(null);
                }}
                customer={selectedUserForStatus}
            />

            <TambahPaketModal
                open={!!selectedUserForTambahPaket}
                onOpenChange={(v) => {
                    if (!v) setSelectedUserForTambahPaket(null);
                }}
                customer={selectedUserForTambahPaket}
            />

            <PaketDetailModal
                open={!!selectedUserIdForDetail}
                onOpenChange={(v) => {
                    if (!v) setSelectedUserIdForDetail(null);
                }}
                customer={selectedUserForDetail}
                onOpenTambahPaket={() => {
                    if (selectedUserForDetail) {
                        setSelectedUserForTambahPaket(selectedUserForDetail);
                    }
                }}
            />
        </AdminLayout>
    );
}
