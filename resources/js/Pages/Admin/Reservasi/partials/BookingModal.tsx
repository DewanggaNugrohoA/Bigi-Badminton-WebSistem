import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/material-design-3-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/admin-format";
import { cn } from "@/lib/utils";

interface LapanganItem {
    id_lapangan: number;
    nama_lapangan: string;
    harga_per_jam: number;
    status_lapangan: string;
}

interface MemberUser {
    id_user: number;
    nama: string;
    no_whatsapp: string;
    status_member?: string;
    tanggal_mulai_member: string;
    tanggal_akhir_member: string;
}

interface BookingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lapangan: LapanganItem[];
    members: MemberUser[];
    regularForm: any;
    submitRegular: (e: React.FormEvent) => void;
    totalBiayaRegular: number;
    memberForm: any;
    submitAutofield: (e: React.FormEvent) => void;
    autofieldPreview: any;
    setAutofieldPreview: (p: any) => void;
    loadingPreview: boolean;
    fetchMemberPreview: () => void;
    getTarifStandarMemberSesi: () => number;
    isCustomHargaPerSesi: boolean;
    setIsCustomHargaPerSesi: (val: boolean) => void;
    operatingHours?: { start: string; end: string };
}

export default function BookingModal({
    open,
    onOpenChange,
    lapangan,
    members,
    regularForm,
    submitRegular,
    totalBiayaRegular,
    memberForm,
    submitAutofield,
    autofieldPreview,
    setAutofieldPreview,
    loadingPreview,
    fetchMemberPreview,
    getTarifStandarMemberSesi,
    isCustomHargaPerSesi,
    setIsCustomHargaPerSesi,
    operatingHours = { start: "08:00", end: "23:00" },
}: BookingModalProps) {
    
    const startHour = parseInt(operatingHours.start.split(":")[0], 10) || 8;
    const endHour = parseInt(operatingHours.end.split(":")[0], 10) || 23;

    const timeOptions: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
        const hh = String(h).padStart(2, "0");
        timeOptions.push(`${hh}:00`);
        if (h < endHour) {
            timeOptions.push(`${hh}:30`);
        }
    }

    
    const isRegularTimeValid =
        Boolean(regularForm.data.jam_mulai && regularForm.data.jam_selesai) &&
        regularForm.data.jam_selesai > regularForm.data.jam_mulai;

    
    const isMemberTimeValid =
        Boolean(memberForm.data.jam_mulai && memberForm.data.jam_selesai) &&
        memberForm.data.jam_selesai > memberForm.data.jam_mulai;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Buat Reservasi Lapangan</DialogTitle>
                    <DialogDescription>
                        Pilih jenis pemesanan sewa reguler atau autofield paket rutin mingguan untuk member.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="regular" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-4">
                        <TabsTrigger value="regular">Pemesanan Reguler</TabsTrigger>
                        <TabsTrigger value="autofield">Member Autofield</TabsTrigger>
                    </TabsList>

                    
                    <TabsContent value="regular">
                        <form onSubmit={submitRegular} className="space-y-4">
                            
                            <div className="space-y-1.5">
                                <Label htmlFor="nama_pemesan">
                                    Nama Pemesan <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="nama_pemesan"
                                    placeholder="Contoh: Budi Santoso"
                                    value={regularForm.data.nama_pemesan}
                                    onChange={(e) => {
                                        regularForm.setData("nama_pemesan", e.target.value);
                                        if (regularForm.errors.nama_pemesan) {
                                            regularForm.clearErrors("nama_pemesan");
                                        }
                                    }}
                                />
                                {regularForm.errors.nama_pemesan && (
                                    <p className="text-xs text-destructive">{regularForm.errors.nama_pemesan}</p>
                                )}
                            </div>

                            
                            <div className="space-y-1.5">
                                <Label htmlFor="no_whatsapp_pemesan">Nomor WhatsApp (Opsional)</Label>
                                <Input
                                    id="no_whatsapp_pemesan"
                                    placeholder="Contoh: 08123456789"
                                    value={regularForm.data.no_whatsapp_pemesan}
                                    onChange={(e) => {
                                        regularForm.setData("no_whatsapp_pemesan", e.target.value);
                                        if (regularForm.errors.no_whatsapp_pemesan) {
                                            regularForm.clearErrors("no_whatsapp_pemesan");
                                        }
                                    }}
                                />
                                {regularForm.errors.no_whatsapp_pemesan && (
                                    <p className="text-xs text-destructive">{regularForm.errors.no_whatsapp_pemesan}</p>
                                )}
                            </div>

                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Lapangan</Label>
                                    <Select
                                        value={regularForm.data.id_lapangan}
                                        onChange={(e) => regularForm.setData("id_lapangan", e.target.value)}
                                    >
                                        {lapangan.map((l) => (
                                            <option key={l.id_lapangan} value={l.id_lapangan}>
                                                {l.nama_lapangan} ({formatRupiah(l.harga_per_jam)}/jam)
                                            </option>
                                        ))}
                                    </Select>
                                    {regularForm.errors.id_lapangan && (
                                        <p className="text-xs text-destructive">{regularForm.errors.id_lapangan}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Tanggal Main</Label>
                                    <Input
                                        type="date"
                                        value={regularForm.data.tanggal_main}
                                        onChange={(e) => regularForm.setData("tanggal_main", e.target.value)}
                                    />
                                    {regularForm.errors.tanggal_main && (
                                        <p className="text-xs text-destructive">{regularForm.errors.tanggal_main}</p>
                                    )}
                                </div>
                            </div>

                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Jam Mulai (24 Jam)</Label>
                                    <Select
                                        value={regularForm.data.jam_mulai}
                                        onChange={(e) => regularForm.setData("jam_mulai", e.target.value)}
                                    >
                                        {timeOptions.slice(0, -1).map((t) => (
                                            <option key={`start-${t}`} value={t}>
                                                {t} WIB
                                            </option>
                                        ))}
                                    </Select>
                                    {regularForm.errors.jam_mulai && (
                                        <p className="text-xs text-destructive">{regularForm.errors.jam_mulai}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Jam Selesai (24 Jam)</Label>
                                    <Select
                                        value={regularForm.data.jam_selesai}
                                        onChange={(e) => regularForm.setData("jam_selesai", e.target.value)}
                                    >
                                        {timeOptions.slice(1).map((t) => (
                                            <option key={`end-${t}`} value={t}>
                                                {t} WIB
                                            </option>
                                        ))}
                                    </Select>
                                    {regularForm.errors.jam_selesai && (
                                        <p className="text-xs text-destructive">{regularForm.errors.jam_selesai}</p>
                                    )}
                                </div>
                            </div>

                            {!isRegularTimeValid && (
                                <p className="text-xs text-destructive">
                                    Jam selesai harus lebih akhir dari jam mulai.
                                </p>
                            )}

                            
                            <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Total Biaya (Tarif Sistem):</span>
                                <span className="font-bold text-sm text-foreground font-mono">
                                    {isRegularTimeValid && totalBiayaRegular > 0
                                        ? formatRupiah(totalBiayaRegular)
                                        : "-"}
                                </span>
                            </div>

                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Status Bayar</Label>
                                    <Select
                                        value={regularForm.data.jenis_pembayaran}
                                        onChange={(e) => {
                                            const j = e.target.value;
                                            regularForm.setData("jenis_pembayaran", j);
                                            regularForm.clearErrors("nominal_dp");
                                            if (j === "Lunas") {
                                                regularForm.setData("nominal_dp", "");
                                            }
                                        }}
                                    >
                                        <option value="Lunas">Lunas</option>
                                        <option value="DP">DP (Uang Muka)</option>
                                    </Select>
                                    {regularForm.errors.jenis_pembayaran && (
                                        <p className="text-xs text-destructive">{regularForm.errors.jenis_pembayaran}</p>
                                    )}
                                </div>

                                {regularForm.data.jenis_pembayaran === "DP" ? (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nominal-dp">Nominal DP (Rp)</Label>
                                        <Input
                                            id="nominal-dp"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            placeholder="Contoh: 50.000"
                                            value={
                                                regularForm.data.nominal_dp
                                                    ? Number(regularForm.data.nominal_dp).toLocaleString("id-ID")
                                                    : ""
                                            }
                                            onKeyDown={(e) => {
                                                if (["-", "+", "e", "E", ".", ","].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onWheel={(e) => (e.target as HTMLElement).blur()}
                                            onChange={(e) => {
                                                const cleanDigits = e.target.value.replace(/\D/g, "");
                                                const parsed = cleanDigits ? String(parseInt(cleanDigits, 10)) : "";
                                                regularForm.setData("nominal_dp", parsed);
                                                if (regularForm.errors.nominal_dp) {
                                                    regularForm.clearErrors("nominal_dp");
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                                                const parsed = pasted ? String(parseInt(pasted, 10)) : "";
                                                regularForm.setData("nominal_dp", parsed);
                                                if (regularForm.errors.nominal_dp) {
                                                    regularForm.clearErrors("nominal_dp");
                                                }
                                            }}
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Batas DP: Rp 1 s/d {formatRupiah(Math.max(0, totalBiayaRegular - 1))}
                                        </p>
                                        {regularForm.errors.nominal_dp && (
                                            <p className="text-xs text-destructive">{regularForm.errors.nominal_dp}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <Label>Nominal Pembayaran</Label>
                                        <div className="h-9 px-3 py-2 rounded-md border border-border bg-muted/60 text-xs font-mono font-semibold text-foreground flex items-center">
                                            {isRegularTimeValid && totalBiayaRegular > 0
                                                ? formatRupiah(totalBiayaRegular)
                                                : "Otomatis Lunas"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={regularForm.processing || !isRegularTimeValid}
                                    className="bg-[var(--brand)] text-white"
                                >
                                    {regularForm.processing ? "Menyimpan..." : "Konfirmasi Reservasi"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    
                    <TabsContent value="autofield">
                        <form onSubmit={submitAutofield} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Pilih Member Aktif</Label>
                                <Select
                                    value={memberForm.data.id_user}
                                    onChange={(e) => {
                                        memberForm.setData("id_user", e.target.value);
                                        setAutofieldPreview(null);
                                    }}
                                >
                                    <option value="">-- Pilih Member --</option>
                                    {members.map((m) => (
                                        <option key={m.id_user} value={m.id_user}>
                                            {m.nama} ({m.no_whatsapp})
                                        </option>
                                    ))}
                                </Select>
                                {memberForm.errors.id_user && (
                                    <p className="text-xs text-destructive">{memberForm.errors.id_user}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Jumlah Sesi</Label>
                                    <Select
                                        value={memberForm.data.jumlah_sesi || "1"}
                                        onChange={(e) => {
                                            memberForm.setData("jumlah_sesi", e.target.value);
                                            setAutofieldPreview(null);
                                        }}
                                    >
                                        <option value="1">1 Sesi (Sekali Main)</option>
                                        <option value="2">2 Sesi (2 Minggu)</option>
                                        <option value="3">3 Sesi (3 Minggu)</option>
                                        <option value="4">4 Sesi (Rutin 1 Bulan)</option>
                                        <option value="all">Semua Sisa Paket</option>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Pilih Hari Rutin</Label>
                                    <Select
                                        value={memberForm.data.hari}
                                        onChange={(e) => {
                                            memberForm.setData("hari", e.target.value);
                                            setAutofieldPreview(null);
                                        }}
                                    >
                                        <option value="0">Minggu</option>
                                        <option value="1">Senin</option>
                                        <option value="2">Selasa</option>
                                        <option value="3">Rabu</option>
                                        <option value="4">Kamis</option>
                                        <option value="5">Jumat</option>
                                        <option value="6">Sabtu</option>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Pilih Lapangan</Label>
                                    <Select
                                        value={memberForm.data.id_lapangan}
                                        onChange={(e) => {
                                            memberForm.setData("id_lapangan", e.target.value);
                                            setIsCustomHargaPerSesi(false);
                                            setAutofieldPreview(null);
                                        }}
                                    >
                                        {lapangan.map((l) => (
                                            <option key={l.id_lapangan} value={l.id_lapangan}>
                                                {l.nama_lapangan}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Jam Mulai (24 Jam)</Label>
                                    <Select
                                        value={memberForm.data.jam_mulai}
                                        onChange={(e) => {
                                            memberForm.setData("jam_mulai", e.target.value);
                                            setIsCustomHargaPerSesi(false);
                                            setAutofieldPreview(null);
                                        }}
                                    >
                                        {timeOptions.slice(0, -1).map((t) => (
                                            <option key={`member-start-${t}`} value={t}>
                                                {t} WIB
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Jam Selesai (24 Jam)</Label>
                                    <Select
                                        value={memberForm.data.jam_selesai}
                                        onChange={(e) => {
                                            memberForm.setData("jam_selesai", e.target.value);
                                            setIsCustomHargaPerSesi(false);
                                            setAutofieldPreview(null);
                                        }}
                                    >
                                        {timeOptions.slice(1).map((t) => (
                                            <option key={`member-end-${t}`} value={t}>
                                                {t} WIB
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {!isMemberTimeValid && (
                                <p className="text-xs text-destructive">
                                    Jam selesai harus setelah jam mulai.
                                </p>
                            )}

                            
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="harga-per-sesi">Harga per Sesi (Rp)</Label>
                                    {isCustomHargaPerSesi && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomHargaPerSesi(false);
                                                const tarif = getTarifStandarMemberSesi();
                                                memberForm.setData("harga_per_sesi", tarif > 0 ? String(tarif) : "");
                                                setAutofieldPreview(null);
                                            }}
                                            className="text-[11px] text-[var(--brand)] font-semibold hover:underline cursor-pointer"
                                        >
                                            Reset ke tarif
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="harga-per-sesi"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="Contoh: 100.000"
                                    value={
                                        memberForm.data.harga_per_sesi
                                            ? Number(memberForm.data.harga_per_sesi).toLocaleString("id-ID")
                                            : ""
                                    }
                                    onKeyDown={(e) => {
                                        if (["-", "+", "e", "E", ".", ","].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onChange={(e) => {
                                        setIsCustomHargaPerSesi(true);
                                        setAutofieldPreview(null);
                                        const cleanDigits = e.target.value.replace(/\D/g, "");
                                        const parsed = cleanDigits ? String(parseInt(cleanDigits, 10)) : "";
                                        memberForm.setData("harga_per_sesi", parsed);
                                        if (memberForm.errors.harga_per_sesi) {
                                            memberForm.clearErrors("harga_per_sesi");
                                        }
                                    }}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        setIsCustomHargaPerSesi(true);
                                        setAutofieldPreview(null);
                                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                                        const parsed = pasted ? String(parseInt(pasted, 10)) : "";
                                        memberForm.setData("harga_per_sesi", parsed);
                                        if (memberForm.errors.harga_per_sesi) {
                                            memberForm.clearErrors("harga_per_sesi");
                                        }
                                    }}
                                />
                                {memberForm.errors.harga_per_sesi && (
                                    <p className="text-xs text-destructive">{memberForm.errors.harga_per_sesi}</p>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={fetchMemberPreview}
                                disabled={loadingPreview || !memberForm.data.id_user || !isMemberTimeValid}
                                className="w-full gap-2 text-xs"
                            >
                                {loadingPreview ? "Mengecek Ketersediaan..." : "Pratinjau Jadwal & Cek Konflik (All-or-Nothing)"}
                            </Button>

                            
                            {autofieldPreview && (
                                <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
                                    <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                                        <div>
                                            <span className="font-semibold text-foreground">Total Jadwal: </span>
                                            <span className="font-mono">{autofieldPreview.total_sesi} Pertemuan</span>
                                            {typeof autofieldPreview.sisa_sesi_paket === "number" && (
                                                <span className="ml-2 text-muted-foreground">
                                                    (Sisa Paket: <strong className="text-foreground">{autofieldPreview.sisa_sesi_paket} sesi</strong>)
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-foreground">Total Biaya: </span>
                                            <span className="font-bold text-[var(--brand)] font-mono">
                                                {formatRupiah(autofieldPreview.total_biaya)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                                        {autofieldPreview.jadwal.map((j: any) => (
                                            <div key={j.tanggal} className="flex items-center justify-between text-xs pt-1.5">
                                                <div>
                                                    <span className={cn("font-medium", j.melebihi_kuota ? "text-rose-400" : "text-foreground")}>
                                                        {j.tanggal_format}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground ml-2 font-mono">
                                                        ({formatRupiah(j.subtotal)})
                                                    </span>
                                                </div>
                                                {j.status === "OK" ? (
                                                    <Badge variant="success" className="text-[10px]">OK</Badge>
                                                ) : (
                                                    <Badge variant="danger" className="text-[10px]">
                                                        {j.alasan || "BENTROK"}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {autofieldPreview.has_conflict && (
                                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                                            <AlertCircle className="size-4 shrink-0" />
                                            <span>
                                                Prinsip All-or-Nothing: Pemesanan tidak dapat diproses jika ada tanggal bentrok atau melampaui sisa sesi paket.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {autofieldPreview?.bisa_disimpan && (
                                <div className="grid grid-cols-3 gap-3 pt-2">
                                    <div className="space-y-1.5">
                                        <Label>Jenis Bayar</Label>
                                        <Select
                                            value={memberForm.data.jenis_pembayaran}
                                            onChange={(e) => {
                                                const j = e.target.value;
                                                memberForm.setData("jenis_pembayaran", j);
                                                memberForm.clearErrors("jumlah_bayar");
                                                if (j === "Lunas" && autofieldPreview?.total_biaya) {
                                                    memberForm.setData("jumlah_bayar", String(autofieldPreview.total_biaya));
                                                }
                                            }}
                                        >
                                            <option value="Lunas">Lunas</option>
                                            <option value="DP">DP</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nominal-autofield">Nominal (Rp)</Label>
                                        <Input
                                            id="nominal-autofield"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            placeholder="Contoh: 200.000"
                                            readOnly={memberForm.data.jenis_pembayaran === "Lunas"}
                                            className={cn(
                                                memberForm.data.jenis_pembayaran === "Lunas" &&
                                                    "bg-muted/60 text-muted-foreground cursor-not-allowed"
                                            )}
                                            value={
                                                memberForm.data.jumlah_bayar
                                                    ? Number(memberForm.data.jumlah_bayar).toLocaleString("id-ID")
                                                    : ""
                                            }
                                            onKeyDown={(e) => {
                                                if (["-", "+", "e", "E", ".", ","].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onWheel={(e) => (e.target as HTMLElement).blur()}
                                            onChange={(e) => {
                                                const cleanDigits = e.target.value.replace(/\D/g, "");
                                                const parsed = cleanDigits ? String(parseInt(cleanDigits, 10)) : "";
                                                memberForm.setData("jumlah_bayar", parsed);
                                                if (memberForm.errors.jumlah_bayar) {
                                                    memberForm.clearErrors("jumlah_bayar");
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                                                const parsed = pasted ? String(parseInt(pasted, 10)) : "";
                                                memberForm.setData("jumlah_bayar", parsed);
                                                if (memberForm.errors.jumlah_bayar) {
                                                    memberForm.clearErrors("jumlah_bayar");
                                                }
                                            }}
                                        />
                                        {memberForm.data.jenis_pembayaran === "DP" && autofieldPreview?.total_biaya && (
                                            <p className="text-[11px] text-muted-foreground">
                                                Batas DP: Rp 1 s/d {formatRupiah(Math.max(0, autofieldPreview.total_biaya - 1))}
                                            </p>
                                        )}
                                        {memberForm.errors.jumlah_bayar && (
                                            <p className="text-xs text-destructive">{memberForm.errors.jumlah_bayar}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Metode</Label>
                                        <Select
                                            value={memberForm.data.metode_pembayaran}
                                            onChange={(e) => memberForm.setData("metode_pembayaran", e.target.value)}
                                        >
                                            <option value="transfer">Transfer</option>
                                            <option value="tunai">Tunai</option>
                                            <option value="qris">QRIS</option>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Tutup
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!autofieldPreview?.bisa_disimpan || memberForm.processing || !isMemberTimeValid}
                                    className="bg-[var(--brand)] text-white"
                                >
                                    {memberForm.processing ? "Menyimpan Paket..." : "Simpan Paket Sesi Member"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
