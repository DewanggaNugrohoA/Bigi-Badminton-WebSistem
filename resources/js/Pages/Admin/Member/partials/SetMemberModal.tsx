import React from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/material-design-3-button";
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
        jenis_pelanggan: string;
        status_member: string;
        tanggal_mulai_member: string | null;
        tanggal_akhir_member: string | null;
    } | null;
}

export default function SetMemberModal({ open, onOpenChange, customer }: SetMemberModalProps) {
    if (!customer) return null;

    const { data, setData, put, processing, errors, reset } = useForm({
        jenis_pelanggan: customer.jenis_pelanggan || "reguler",
        status_member: customer.status_member || "tidak_aktif",
        tanggal_mulai_member: customer.tanggal_mulai_member || "",
        tanggal_akhir_member: customer.tanggal_akhir_member || "",
    });

    
    React.useEffect(() => {
        if (customer) {
            setData({
                jenis_pelanggan: customer.jenis_pelanggan || "reguler",
                status_member: customer.status_member || "tidak_aktif",
                tanggal_mulai_member: customer.tanggal_mulai_member || "",
                tanggal_akhir_member: customer.tanggal_akhir_member || "",
            });
        }
    }, [customer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/member/${customer.id_user}/status`, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Atur Status Keanggotaan</DialogTitle>
                    <DialogDescription>
                        Ubah status member dan masa aktif untuk <strong className="text-foreground">{customer.nama}</strong> ({customer.no_whatsapp}).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="jenis_pelanggan">Jenis Pelanggan</Label>
                            <Select
                                id="jenis_pelanggan"
                                value={data.jenis_pelanggan}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setData((prev) => ({
                                        ...prev,
                                        jenis_pelanggan: val,
                                        status_member: val === "member" ? "aktif" : "tidak_aktif",
                                    }));
                                }}
                            >
                                <option value="member">Member</option>
                                <option value="reguler">Reguler</option>
                            </Select>
                            {errors.jenis_pelanggan && (
                                <p className="text-xs text-destructive">{errors.jenis_pelanggan}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="status_member">Status Member</Label>
                            <Select
                                id="status_member"
                                value={data.status_member}
                                onChange={(e) => setData("status_member", e.target.value)}
                            >
                                <option value="aktif">Aktif</option>
                                <option value="tidak_aktif">Tidak Aktif</option>
                            </Select>
                            {errors.status_member && (
                                <p className="text-xs text-destructive">{errors.status_member}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal_mulai_member">Tanggal Mulai</Label>
                            <Input
                                id="tanggal_mulai_member"
                                type="date"
                                value={data.tanggal_mulai_member}
                                onChange={(e) => setData("tanggal_mulai_member", e.target.value)}
                            />
                            {errors.tanggal_mulai_member && (
                                <p className="text-xs text-destructive">{errors.tanggal_mulai_member}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal_akhir_member">Tanggal Berakhir</Label>
                            <Input
                                id="tanggal_akhir_member"
                                type="date"
                                value={data.tanggal_akhir_member}
                                onChange={(e) => setData("tanggal_akhir_member", e.target.value)}
                            />
                            {errors.tanggal_akhir_member && (
                                <p className="text-xs text-destructive">{errors.tanggal_akhir_member}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-[var(--brand)] text-white">
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
