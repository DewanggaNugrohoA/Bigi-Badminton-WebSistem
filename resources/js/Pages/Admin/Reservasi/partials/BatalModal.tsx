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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BatalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: {
        id_reservasi: number;
    } | null;
    form: {
        data: {
            alasan: string;
        };
        setData: (field: string, value: any) => void;
        errors: {
            alasan?: string;
        };
        processing: boolean;
    };
    onSubmit: (e: React.FormEvent) => void;
}

export default function BatalModal({
    open,
    onOpenChange,
    reservation,
    form,
    onSubmit,
}: BatalModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Batalkan Reservasi</DialogTitle>
                    <DialogDescription>
                        Pemberitahuan pembatalan Reservasi #{reservation?.id_reservasi}. Alasan pembatalan dicatat pada audit log.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Alasan Pembatalan</Label>
                        <Textarea
                            placeholder="Tuliskan alasan rinci pembatalan..."
                            value={form.data.alasan}
                            onChange={(e) => form.setData("alasan", e.target.value)}
                        />
                        {form.errors.alasan && (
                            <p className="text-xs text-destructive">{form.errors.alasan}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Kembali
                        </Button>
                        <Button type="submit" variant="destructive" disabled={form.processing}>
                            {form.processing ? "Membatalkan..." : "Ya, Batalkan Reservasi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
