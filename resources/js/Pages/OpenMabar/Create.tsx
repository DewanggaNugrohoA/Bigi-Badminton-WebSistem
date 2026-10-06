import PublicLayout from "@/layouts/public-layout";
import { useForm, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Info } from "lucide-react";
import React, { useState } from "react";

interface LapanganOption {
    id_lapangan: number;
    nama_lapangan: string;
}

interface CreateProps {
    lapangan: LapanganOption[];
}

export default function OpenMabarCreate({ lapangan }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        judul: "",
        tanggal: "",
        jam_mulai: "",
        jam_selesai: "",
        gender: "campuran",
        batas_usia_min: "17",
        batas_usia_max: "40",
        kuota: "8",
        deskripsi: "",
        id_lapangan: "",
        foto: null as File | null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData("foto", file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/open-mabar");
    };

    return (
        <PublicLayout title="Buat Jadwal Open Mabar - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/open-mabar"
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Cari Jadwal</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Buat Jadwal Open Mabar
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Ajukan jadwal main bareng komunitas. Jadwal baru akan berstatus <span className="text-amber-400 font-medium">Menunggu</span> persetujuan Admin sebelum tampil di daftar publik.
                    </p>
                </div>

                <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Judul */}
                        <div className="space-y-2">
                            <Label htmlFor="judul" className="text-sm font-semibold">
                                Judul Mabar <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="judul"
                                placeholder="Contoh: Mabar Santuy Gembira Akhir Pekan"
                                value={data.judul}
                                onChange={(e) => setData("judul", e.target.value)}
                                className={errors.judul ? "border-rose-500" : ""}
                            />
                            {errors.judul && (
                                <p className="text-xs text-rose-500">{errors.judul}</p>
                            )}
                        </div>

                        {/* Tanggal, Jam Mulai, Jam Selesai */}
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
                                <Input
                                    id="jam_mulai"
                                    type="time"
                                    value={data.jam_mulai}
                                    onChange={(e) => setData("jam_mulai", e.target.value)}
                                    className={errors.jam_mulai ? "border-rose-500" : ""}
                                />
                                {errors.jam_mulai && (
                                    <p className="text-xs text-rose-500">{errors.jam_mulai}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jam_selesai" className="text-sm font-semibold">
                                    Jam Selesai <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="jam_selesai"
                                    type="time"
                                    value={data.jam_selesai}
                                    onChange={(e) => setData("jam_selesai", e.target.value)}
                                    className={errors.jam_selesai ? "border-rose-500" : ""}
                                />
                                {errors.jam_selesai && (
                                    <p className="text-xs text-rose-500">{errors.jam_selesai}</p>
                                )}
                            </div>
                        </div>

                        {/* Gender & Kuota */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-semibold">
                                    Kategori Jenis Kelamin <span className="text-rose-500">*</span>
                                </Label>
                                <select
                                    id="gender"
                                    value={data.gender}
                                    onChange={(e) => setData("gender", e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                                >
                                    <option value="campuran">Campuran (Putra & Putri)</option>
                                    <option value="putra">Putra</option>
                                    <option value="putri">Putri</option>
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
                                    placeholder="Contoh: 8"
                                    value={data.kuota}
                                    onChange={(e) => setData("kuota", e.target.value)}
                                    className={errors.kuota ? "border-rose-500" : ""}
                                />
                                {errors.kuota && (
                                    <p className="text-xs text-rose-500">{errors.kuota}</p>
                                )}
                            </div>
                        </div>

                        {/* Batas Usia Min & Max */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="batas_usia_min" className="text-sm font-semibold">
                                    Batas Usia Minimal <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="batas_usia_min"
                                    type="number"
                                    min={1}
                                    value={data.batas_usia_min}
                                    onChange={(e) => setData("batas_usia_min", e.target.value)}
                                    className={errors.batas_usia_min ? "border-rose-500" : ""}
                                />
                                {errors.batas_usia_min && (
                                    <p className="text-xs text-rose-500">{errors.batas_usia_min}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="batas_usia_max" className="text-sm font-semibold">
                                    Batas Usia Maksimal <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="batas_usia_max"
                                    type="number"
                                    min={1}
                                    value={data.batas_usia_max}
                                    onChange={(e) => setData("batas_usia_max", e.target.value)}
                                    className={errors.batas_usia_max ? "border-rose-500" : ""}
                                />
                                {errors.batas_usia_max && (
                                    <p className="text-xs text-rose-500">{errors.batas_usia_max}</p>
                                )}
                            </div>
                        </div>

                        {/* Lapangan (Opsional) */}
                        <div className="space-y-2">
                            <Label htmlFor="id_lapangan" className="text-sm font-semibold">
                                Lapangan (Opsional)
                            </Label>
                            <select
                                id="id_lapangan"
                                value={data.id_lapangan}
                                onChange={(e) => setData("id_lapangan", e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                            >
                                <option value="">-- Belum Ditentukan / Bebas --</option>
                                {lapangan.map((lap) => (
                                    <option key={lap.id_lapangan} value={lap.id_lapangan}>
                                        {lap.nama_lapangan}
                                    </option>
                                ))}
                            </select>
                            {errors.id_lapangan && (
                                <p className="text-xs text-rose-500">{errors.id_lapangan}</p>
                            )}
                        </div>

                        {/* Foto Unggahan (Opsional) */}
                        <div className="space-y-2">
                            <Label htmlFor="foto" className="text-sm font-semibold">
                                Foto Banner Mabar (Opsional, maks 2 MB)
                            </Label>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <label
                                    htmlFor="foto"
                                    className="cursor-pointer border border-dashed border-input hover:border-primary px-4 py-3 rounded-lg flex items-center gap-2 text-sm text-muted-foreground w-full sm:w-auto"
                                >
                                    <Upload className="size-4" />
                                    <span>Pilih File Gambar</span>
                                    <input
                                        id="foto"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
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

                        {/* Deskripsi & Catatan */}
                        <div className="space-y-2">
                            <Label htmlFor="deskripsi" className="text-sm font-semibold">
                                Deskripsi & Catatan Khusus (Opsional)
                            </Label>
                            <textarea
                                id="deskripsi"
                                rows={4}
                                placeholder="Contoh: Bawa raket sendiri, kok sudah disiapkan. Level permainan santai pemula - menengah..."
                                value={data.deskripsi}
                                onChange={(e) => setData("deskripsi", e.target.value)}
                                className="w-full p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                            />
                            {errors.deskripsi && (
                                <p className="text-xs text-rose-500">{errors.deskripsi}</p>
                            )}
                        </div>

                        {/* Catatan Persetujuan */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                            <Info className="size-4 shrink-0 text-amber-400 mt-0.5" />
                            <span>
                                Setelah formulir dikirim, jadwal mabar Anda akan diverifikasi oleh Admin. Anda dapat memantau statusnya di halaman <strong>Jadwal Saya</strong>.
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                            <Link href="/open-mabar">
                                <Button variant="outline" type="button">
                                    Batal
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[var(--brand)] hover:opacity-90 px-6"
                            >
                                {processing ? "Mengirim..." : "Kirim Jadwal Mabar"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
