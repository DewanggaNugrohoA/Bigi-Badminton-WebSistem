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
import { Search, UserCheck, Package, Plus, ChevronLeft, ChevronRight, UserCog } from "lucide-react";
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
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<CustomerItem | null>(null);
    const [selectedUserForTambahPaket, setSelectedUserForTambahPaket] = useState<CustomerItem | null>(null);

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

            <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                    <CardContent className="p-4 sm:p-5">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-col md:flex-row md:items-center gap-3"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama pelanggan atau nomor WhatsApp..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 text-xs sm:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Select
                                    value={filter}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="w-48 text-xs sm:text-sm"
                                >
                                    <option value="semua">Semua Pelanggan</option>
                                    <option value="aktif">Member Aktif</option>
                                    <option value="bukan_member">Bukan Member (Reguler)</option>
                                    <option value="kedaluwarsa">Member Kedaluwarsa</option>
                                </Select>

                                <Button type="submit" variant="secondary" className="text-xs sm:text-sm">
                                    Cari
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                
                <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                            Daftar Pelanggan ({customers.total} Orang)
                        </CardTitle>
                    </CardHeader>

                    <div className="w-full overflow-x-auto">
                        <Table className="min-w-[760px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Nama Pelanggan</TableHead>
                                    <TableHead className="w-[140px]">WhatsApp</TableHead>
                                    <TableHead className="w-[100px]">Jenis</TableHead>
                                    <TableHead className="w-[180px]">Masa Berlaku</TableHead>
                                    <TableHead className="w-[130px]">Status</TableHead>
                                    <TableHead className="w-[120px]">Sisa Sesi</TableHead>
                                    <TableHead className="text-right w-[180px]">Aksi</TableHead>
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
                                                        <div className="text-[11px] text-muted-foreground font-normal">
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
                                                            <span className="hidden sm:inline">Status</span>
                                                        </Button>

                                                        {isMember && (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-xs gap-1"
                                                                    title="Lihat rincian paket sesi"
                                                                    onClick={() => setSelectedUserForDetail(c)}
                                                                >
                                                                    <Package className="size-3.5" />
                                                                    <span className="hidden sm:inline">Paket</span>
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
                                                                    <span className="hidden sm:inline">Tambah</span>
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

                    
                    {customers.last_page > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                                Halaman {customers.current_page} dari {customers.last_page} ({customers.total} total pelanggan)
                            </div>
                            <div className="flex items-center gap-1">
                                {customers.links.map((link, idx) => {
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
                open={!!selectedUserForDetail}
                onOpenChange={(v) => {
                    if (!v) setSelectedUserForDetail(null);
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
