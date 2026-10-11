import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface QuickCustomerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: {
        data: {
            nama: string;
            no_whatsapp: string;
            jenis_pelanggan: string;
            tanggal_mulai_member: string;
            tanggal_akhir_member: string;
        };
        setData: (field: string, value: any) => void;
        errors: Record<string, string>;
        processing: boolean;
    };
    onSubmit: (e: React.FormEvent) => void;
}

export default function QuickCustomerModal({
    open,
    onOpenChange,
    form,
    onSubmit,
}: QuickCustomerModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrasi Pelanggan Cepat</DialogTitle>
                    <DialogDescription>
                        Daftarkan akun pelanggan baru di tempat secara langsung.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Nama Lengkap</Label>
                        <Input
                            placeholder="Nama pelanggan"
                            value={form.data.nama}
                            onChange={(e) => form.setData("nama", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Nomor WhatsApp (HP)</Label>
                        <Input
                            placeholder="08xxxxxxxxxx"
                            value={form.data.no_whatsapp}
                            onChange={(e) => form.setData("no_whatsapp", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Jenis Pelanggan</Label>
                        <Select
                            value={form.data.jenis_pelanggan}
                            onChange={(e) => form.setData("jenis_pelanggan", e.target.value)}
                        >
                            <option value="reguler">Reguler</option>
                            <option value="member">Member</option>
                        </Select>
                    </div>

                    {form.data.jenis_pelanggan === "member" && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                                <Label>Mulai Member</Label>
                                <Input
                                    type="date"
                                    value={form.data.tanggal_mulai_member}
                                    onChange={(e) => form.setData("tanggal_mulai_member", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Akhir Member</Label>
                                <Input
                                    type="date"
                                    value={form.data.tanggal_akhir_member}
                                    onChange={(e) => form.setData("tanggal_akhir_member", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing} className="bg-[var(--brand)] text-white">
                            {form.processing ? "Mendaftarkan..." : "Daftarkan Pelanggan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
