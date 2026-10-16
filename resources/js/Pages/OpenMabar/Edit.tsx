import PublicLayout from "@/layouts/public-layout";
import { useForm, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import {
    formatIndonesianPhoneInput,
    handlePhoneKeyDown,
    JAM_BULAT_OPTIONS,
    formatJamLabel,
    getDefaultJamSelesai,
} from "@/lib/content";

interface LapanganOption {
    id_lapangan: number;
    nama_lapangan: string;
}

interface EditProps {
    mabar: {
        id_mabar: number;
        judul: string;
        tanggal: string;
        jam_mulai: string;
        jam_selesai: string;
        gender: "putra" | "putri" | "campuran";
        no_hp?: string;
        kuota: number;
        deskripsi: string | null;
        id_lapangan: number | null;
        foto: string | null;
        status: "menunggu" | "disetujui" | "ditolak";
    };
    lapangan: LapanganOption[];
}

export default function OpenMabarEdit({ mabar, lapangan }: EditProps) {
    
    const { data, setData, post, processing, errors } = useForm({
        _method: "PUT",
        judul: mabar.judul,
        tanggal: mabar.tanggal,
        jam_mulai: mabar.jam_mulai ? mabar.jam_mulai.substring(0, 5) : "",
        jam_selesai: mabar.jam_selesai ? mabar.jam_selesai.substring(0, 5) : "",
        gender: mabar.gender,
        no_hp: mabar.no_hp || "",
        kuota: String(mabar.kuota),
        deskripsi: mabar.deskripsi || "",
        id_lapangan: mabar.id_lapangan ? String(mabar.id_lapangan) : "",
        foto: null as File | null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(
        mabar.foto ? (mabar.foto.startsWith("http") ? mabar.foto : `/storage/${mabar.foto}`) : null
    );

    const handleJamMulaiChange = (newMulai: string) => {
        setData((prev) => {
            const next = { ...prev, jam_mulai: newMulai };
            if (!prev.jam_selesai || prev.jam_selesai <= newMulai) {
                next.jam_selesai = getDefaultJamSelesai(newMulai);
            }
            return next;
        });
    };

    const jamMulaiList = [...JAM_BULAT_OPTIONS.filter((j) => j <= "22:00")];
    if (data.jam_mulai && !jamMulaiList.includes(data.jam_mulai)) {
        jamMulaiList.unshift(data.jam_mulai);
    }

    const jamSelesaiList = [...JAM_BULAT_OPTIONS.filter((j) => !data.jam_mulai || j > data.jam_mulai)];
    if (data.jam_selesai && !jamSelesaiList.includes(data.jam_selesai)) {
        jamSelesaiList.unshift(data.jam_selesai);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData("foto", file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(`/open-mabar/${mabar.id_mabar}/edit`);
    };

    return (
        <PublicLayout title={`Revisi Jadwal: ${mabar.judul} - Bigi Badminton`}>
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/open-mabar/saya"
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Jadwal Saya</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Revisi Jadwal Open Mabar
                    </h1>
                    {mabar.status === "ditolak" && (
                        <div className="mt-3 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                            <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                            <span>
                                Jadwal ini sebelumnya <strong>Ditolak</strong> oleh Admin. Setelah Anda melakukan perubahan dan menyimpannya, status jadwal akan kembali menjadi <strong>Menunggu Persetujuan</strong>.
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="judul" className="text-sm font-semibold">
                                Judul Mabar <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="judul"
                                value={data.judul}
                                onChange={(e) => setData("judul", e.target.value)}
                                className={errors.judul ? "border-rose-500" : ""}
                            />
                            {errors.judul && (
                                <p className="text-xs text-rose-500">{errors.judul}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tanggal" className="text-sm font-semibold">
                                    Tanggal <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) => setData("tanggal", e.target.value)}
                                    className={errors.tanggal ? "border-rose-500" : ""}
                                />
                                {errors.tanggal && (
                                    <p className="text-xs text-rose-500">{errors.tanggal}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jam_mulai" className="text-sm font-semibold">
                                    Jam Mulai <span className="text-rose-500">*</span>
                                </Label>
                                <select
                                    id="jam_mulai"
                                    value={data.jam_mulai}
                                    onChange={(e) => handleJamMulaiChange(e.target.value)}
                                    className={`w-full h-10 px-3 rounded-lg border bg-background text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground ${errors.jam_mulai ? "border-rose-500" : "border-input"}`}
                                    required
                                >
                                    <option value="" disabled className="bg-background text-muted-foreground">Pilih Jam Mulai</option>
                                    {jamMulaiList.map((jam) => (
                                        <option key={jam} value={jam} className="bg-background text-foreground">
                                            {formatJamLabel(jam)}
                                        </option>
                                    ))}
                                </select>
                                {errors.jam_mulai && (
                                    <p className="text-xs text-rose-500">{errors.jam_mulai}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jam_selesai" className="text-sm font-semibold">
                                    Jam Selesai <span className="text-rose-500">*</span>
                                </Label>
                                <select
                                    id="jam_selesai"
                                    value={data.jam_selesai}
                                    onChange={(e) => setData("jam_selesai", e.target.value)}
                                    className={`w-full h-10 px-3 rounded-lg border bg-background text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground ${errors.jam_selesai ? "border-rose-500" : "border-input"}`}
                                    required
                                >
                                    <option value="" disabled className="bg-background text-muted-foreground">
                                        {data.jam_mulai ? "Pilih Jam Selesai" : "Pilih Jam Mulai Dulu"}
                                    </option>
                                    {jamSelesaiList.map((jam) => (
                                        <option key={jam} value={jam} className="bg-background text-foreground">
                                            {formatJamLabel(jam)}
                                        </option>
                                    ))}
                                </select>
                                {errors.jam_selesai && (
                                    <p className="text-xs text-rose-500">{errors.jam_selesai}</p>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Waktu operasional open mabar: 09:00 WIB s.d. 23:00 WIB (11 malam).
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-semibold">
                                    Kategori Jenis Kelamin <span className="text-rose-500">*</span>
                                </Label>
                                <select
                                    id="gender"
                                    value={data.gender}
                                    onChange={(e) => setData("gender", e.target.value as any)}
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-transparent text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                >
                                    <option value="campuran" className="bg-background text-foreground">Campuran (Putra & Putri)</option>
                                    <option value="putra" className="bg-background text-foreground">Putra</option>
                                    <option value="putri" className="bg-background text-foreground">Putri</option>
                                </select>
                                {errors.gender && (
                                    <p className="text-xs text-rose-500">{errors.gender}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="kuota" className="text-sm font-semibold">
                                    Kuota Peserta (Orang) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="kuota"
                                    type="number"
                                    min={1}
                                    value={data.kuota}
                                    onChange={(e) => setData("kuota", e.target.value)}
                                    className={errors.kuota ? "border-rose-500" : ""}
                                />
                                {errors.kuota && (
                                    <p className="text-xs text-rose-500">{errors.kuota}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="no_hp" className="text-sm font-semibold">
                                Nomor HP/WhatsApp <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="no_hp"
                                type="tel"
                                name="no_hp"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={13}
                                value={data.no_hp}
                                onChange={(e) => setData("no_hp", formatIndonesianPhoneInput(e.target.value))}
                                onKeyDown={handlePhoneKeyDown}
                                placeholder="Contoh: 081234567890"
                                className={errors.no_hp ? "border-rose-500" : ""}
                                required
                                autoComplete="tel"
                            />
                            {errors.no_hp && (
                                <p className="text-xs text-rose-500">{errors.no_hp}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Nomor hanya dilihat Admin untuk verifikasi, tidak ditampilkan ke pengguna lain.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="id_lapangan" className="text-sm font-semibold">
                                Lapangan (Opsional)
                            </Label>
                            <select
                                id="id_lapangan"
                                value={data.id_lapangan}
                                onChange={(e) => setData("id_lapangan", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-input bg-transparent text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                            >
                                <option value="" className="bg-background text-foreground">-- Belum Ditentukan / Bebas --</option>
                                {lapangan.map((lap) => (
                                    <option key={lap.id_lapangan} value={lap.id_lapangan} className="bg-background text-foreground">
                                        {lap.nama_lapangan}
                                    </option>
                                ))}
                            </select>
                            {errors.id_lapangan && (
                                <p className="text-xs text-rose-500">{errors.id_lapangan}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="foto" className="text-sm font-semibold">
                                Ganti Foto Banner (Opsional, maks 2 MB)
                            </Label>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <label
                                    htmlFor="foto"
                                    className="cursor-pointer border border-dashed border-input hover:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:outline-none px-4 py-3 rounded-lg flex items-center gap-2 text-sm text-muted-foreground w-full sm:w-auto transition-colors"
                                >
                                    <Upload className="size-4" />
                                    <span>Pilih File Gambar Baru</span>
                                    <input
                                        id="foto"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="sr-only"
                                    />
                                </label>
                                {data.foto && (
                                    <span className="text-xs text-foreground truncate max-w-xs">
                                        {data.foto.name}
                                    </span>
                                )}
                            </div>
                            {previewUrl && (
                                <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden border border-border">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            {errors.foto && (
                                <p className="text-xs text-rose-500">{errors.foto}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deskripsi" className="text-sm font-semibold">
                                Deskripsi & Catatan Khusus (Opsional)
                            </Label>
                            <textarea
                                id="deskripsi"
                                rows={4}
                                value={data.deskripsi}
                                onChange={(e) => setData("deskripsi", e.target.value)}
                                className="w-full p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                            />
                            {errors.deskripsi && (
                                <p className="text-xs text-rose-500">{errors.deskripsi}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                            <Link href="/open-mabar/saya">
                                <Button variant="outline" type="button">
                                    Batal
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[var(--brand)] hover:opacity-90 px-6"
                            >
                                {processing ? "Menyimpan..." : "Simpan Revisi"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
