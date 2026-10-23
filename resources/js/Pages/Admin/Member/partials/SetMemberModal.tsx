import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface SetMemberModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: {
        id_user: number;
        nama: string;
        no_whatsapp: string;
        jenis_pelanggan: "member" | "reguler";
        status_member: "aktif" | "tidak_aktif";
        tanggal_mulai_member: string | null;
        tanggal_akhir_member: string | null;
    } | null;
}

/**
 * Modal dialog untuk memperbarui status tipe pelanggan (reguler / member)
 * serta rentang tanggal aktif keanggotaan member.
 */
export default function SetMemberModal({
    open,
    onOpenChange,
    customer,
}: SetMemberModalProps) {
    const normalizeDate = (d: string | null | undefined) => {
        if (!d) return "";
        return d.substring(0, 10);
    };

    const initialJenis = customer?.jenis_pelanggan || "reguler";
    const initialStatus = customer?.status_member || "tidak_aktif";
    const initialMulai = normalizeDate(customer?.tanggal_mulai_member);
    const initialAkhir = normalizeDate(customer?.tanggal_akhir_member);

    const { data, setData, put, processing, errors } = useForm({
        jenis_pelanggan: initialJenis,
        status_member: initialStatus,
        tanggal_mulai_member: initialMulai,
        tanggal_akhir_member: initialAkhir,
    });

    useEffect(() => {
        if (customer) {
            setData({
                jenis_pelanggan: customer.jenis_pelanggan || "reguler",
                status_member: customer.status_member || "tidak_aktif",
                tanggal_mulai_member: normalizeDate(customer.tanggal_mulai_member),
                tanggal_akhir_member: normalizeDate(customer.tanggal_akhir_member),
            });
        }
    }, [customer?.id_user, open]);

    const isChanged =
        data.jenis_pelanggan !== initialJenis ||
        data.status_member !== initialStatus ||
        normalizeDate(data.tanggal_mulai_member) !== initialMulai ||
        normalizeDate(data.tanggal_akhir_member) !== initialAkhir;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isChanged || !customer) return;
        put(`/admin/member/${customer.id_user}/status`, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-md rounded-lg p-4 sm:p-6 shadow-md border-border">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Atur Status Keanggotaan</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Ubah status member dan masa aktif untuk <strong className="text-foreground">{customer.nama}</strong> ({customer.no_whatsapp}).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1 sm:pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="jenis_pelanggan" className="text-xs sm:text-sm">Jenis Pelanggan</Label>
                            <Select
                                id="jenis_pelanggan"
                                value={data.jenis_pelanggan}
                                onChange={(e) => setData("jenis_pelanggan", e.target.value as any)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                            >
                                <option value="reguler">Reguler</option>
                                <option value="member">Member</option>
                            </Select>
                            {errors.jenis_pelanggan && (
                                <p className="text-xs text-destructive">{errors.jenis_pelanggan}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="status_member" className="text-xs sm:text-sm">Status Member</Label>
                            <Select
                                id="status_member"
                                value={data.status_member}
                                onChange={(e) => setData("status_member", e.target.value as any)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                            >
                                <option value="tidak_aktif">Tidak Aktif</option>
                                <option value="aktif">Aktif</option>
                            </Select>
                            {errors.status_member && (
                                <p className="text-xs text-destructive">{errors.status_member}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal_mulai_member" className="text-xs sm:text-sm">Tanggal Mulai</Label>
                            <Input
                                id="tanggal_mulai_member"
                                type="date"
                                value={data.tanggal_mulai_member}
                                onChange={(e) => setData("tanggal_mulai_member", e.target.value)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                            />
                            {errors.tanggal_mulai_member && (
                                <p className="text-xs text-destructive">{errors.tanggal_mulai_member}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal_akhir_member" className="text-xs sm:text-sm">Tanggal Berakhir</Label>
                            <Input
                                id="tanggal_akhir_member"
                                type="date"
                                value={data.tanggal_akhir_member}
                                onChange={(e) => setData("tanggal_akhir_member", e.target.value)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                            />
                            {errors.tanggal_akhir_member && (
                                <p className="text-xs text-destructive">{errors.tanggal_akhir_member}</p>
                            )}
                        </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                        * Jika status diatur menjadi <strong>Member Aktif</strong>, pelanggan dapat diberikan paket sesi bermain dan harga khusus member.
                    </p>

                    {!isChanged && (
                        <p className="text-[11px] text-amber-500 font-medium">
                            * Tidak ada perubahan data. Ubah salah satu data status di atas untuk mengaktifkan tombol simpan.
                        </p>
                    )}

                    <DialogFooter className="gap-2 pt-2 flex-col sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-md text-xs sm:text-sm h-8 sm:h-9"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !isChanged}
                            className="rounded-md text-xs sm:text-sm h-8 sm:h-9 bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
