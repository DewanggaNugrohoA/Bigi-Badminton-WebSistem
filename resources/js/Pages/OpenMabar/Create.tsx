import PublicLayout from "@/layouts/public-layout";
import { useForm, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload } from "lucide-react";
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
            <div className="pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/open-mabar"
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Cari Jadwal</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                        Buat Jadwal Open Mabar
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Jadwal baru berstatus <span className="font-semibold text-foreground">Menunggu</span> sampai disetujui Admin.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-card border border-border rounded-xl p-5 lg:p-6 space-y-6 shadow-xs">
                                
                                <div className="space-y-4">
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Informasi
                                    </h2>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="judul" className="text-sm font-medium">
                                            Judul Mabar <span className="text-destructive/70 text-xs">*</span>
                                        </Label>
                                        <Input
                                            id="judul"
                                            placeholder="Contoh: Mabar Santuy Gembira Akhir Pekan"
                                            value={data.judul}
                                            onChange={(e) => setData("judul", e.target.value)}
                                            className={`h-10 text-sm ${errors.judul ? "border-destructive" : ""}`}
                                            required
                                            aria-describedby={errors.judul ? "judul-error" : undefined}
                                            aria-invalid={!!errors.judul}
                                        />
                                        {errors.judul && (
                                            <p id="judul-error" role="alert" className="text-xs text-destructive">
                                                {errors.judul}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-border/60" />

                                
                                <div className="space-y-4">
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Jadwal
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="tanggal" className="text-sm font-medium">
                                                Tanggal <span className="text-destructive/70 text-xs">*</span>
                                            </Label>
                                            <Input
                                                id="tanggal"
                                                type="date"
                                                value={data.tanggal}
                                                onChange={(e) => setData("tanggal", e.target.value)}
                                                className={`h-10 text-sm ${errors.tanggal ? "border-destructive" : ""}`}
                                                required
                                                aria-describedby={errors.tanggal ? "tanggal-error" : undefined}
                                                aria-invalid={!!errors.tanggal}
                                            />
                                            {errors.tanggal && (
                                                <p id="tanggal-error" role="alert" className="text-xs text-destructive">
                                                    {errors.tanggal}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="jam_mulai" className="text-sm font-medium">
                                                Jam Mulai <span className="text-destructive/70 text-xs">*</span>
                                            </Label>
                                            <Input
                                                id="jam_mulai"
                                                type="time"
                                                value={data.jam_mulai}
                                                onChange={(e) => setData("jam_mulai", e.target.value)}
                                                className={`h-10 text-sm ${errors.jam_mulai ? "border-destructive" : ""}`}
                                                required
                                                aria-describedby={errors.jam_mulai ? "jam-mulai-error" : undefined}
                                                aria-invalid={!!errors.jam_mulai}
                                            />
                                            {errors.jam_mulai && (
                                                <p id="jam-mulai-error" role="alert" className="text-xs text-destructive">
                                                    {errors.jam_mulai}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="jam_selesai" className="text-sm font-medium">
                                                Jam Selesai <span className="text-destructive/70 text-xs">*</span>
                                            </Label>
                                            <Input
                                                id="jam_selesai"
                                                type="time"
                                                value={data.jam_selesai}
                                                onChange={(e) => setData("jam_selesai", e.target.value)}
                                                className={`h-10 text-sm ${errors.jam_selesai ? "border-destructive" : ""}`}
                                                required
                                                aria-describedby={errors.jam_selesai ? "jam-selesai-error" : undefined}
                                                aria-invalid={!!errors.jam_selesai}
                                            />
                                            {errors.jam_selesai && (
                                                <p id="jam-selesai-error" role="alert" className="text-xs text-destructive">
                                                    {errors.jam_selesai}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border/60" />

                                
                                <div className="space-y-4">
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Peserta
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="gender" className="text-sm font-medium">
                                                Kategori Jenis Kelamin <span className="text-destructive/70 text-xs">*</span>
                                            </Label>
                                            <select
                                                id="gender"
                                                value={data.gender}
                                                onChange={(e) => setData("gender", e.target.value)}
                                                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                                required
                                                aria-describedby={errors.gender ? "gender-error" : undefined}
                                                aria-invalid={!!errors.gender}
                                            >
                                                <option value="campuran" className="bg-background text-foreground">Campuran (Putra & Putri)</option>
                                                <option value="putra" className="bg-background text-foreground">Putra</option>
                                                <option value="putri" className="bg-background text-foreground">Putri</option>
                                            </select>
                                            {errors.gender && (
                                                <p id="gender-error" role="alert" className="text-xs text-destructive">
                                                    {errors.gender}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="kuota" className="text-sm font-medium">
                                                Kuota Peserta (Orang) <span className="text-destructive/70 text-xs">*</span>
                                            </Label>
                                            <Input
                                                id="kuota"
                                                type="number"
                                                min={1}
                                                placeholder="Contoh: 8"
                                                value={data.kuota}
                                                onChange={(e) => setData("kuota", e.target.value)}
                                                className={`h-10 text-sm ${errors.kuota ? "border-destructive" : ""}`}
                                                required
                                                aria-describedby={errors.kuota ? "kuota-error" : undefined}
                                                aria-invalid={!!errors.kuota}
                                            />
                                            {errors.kuota && (
                                                <p id="kuota-error" role="alert" className="text-xs text-destructive">
                                                    {errors.kuota}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="batas_usia_min" className="text-sm font-medium">
                                                Batas Usia Minimal <span className="text-destructive/70 text-xs">*</span>
                                            </Label>
                                            <Input
                                                id="batas_usia_min"
                                                type="number"
                                                min={1}
                                                value={data.batas_usia_min}
                                                onChange={(e) => setData("batas_usia_min", e.target.value)}
                                                className={`h-10 text-sm ${errors.batas_usia_min ? "border-destructive" : ""}`}
                                                required
                                                aria-describedby={errors.batas_usia_min ? "usia-min-error" : undefined}
                                                aria-invalid={!!errors.batas_usia_min}
                                            />
                                            {errors.batas_usia_min && (
                                                <p id="usia-min-error" role="alert" className="text-xs text-destructive">
                                                    {errors.batas_usia_min}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="batas_usia_max" className="text-sm font-medium">
                                                Batas Usia Maksimal <span className="text-destructive/70 text-xs">*</span>
                                            </Label>
                                            <Input
                                                id="batas_usia_max"
                                                type="number"
                                                min={1}
                                                value={data.batas_usia_max}
                                                onChange={(e) => setData("batas_usia_max", e.target.value)}
                                                className={`h-10 text-sm ${errors.batas_usia_max ? "border-destructive" : ""}`}
                                                required
                                                aria-describedby={errors.batas_usia_max ? "usia-max-error" : undefined}
                                                aria-invalid={!!errors.batas_usia_max}
                                            />
                                            {errors.batas_usia_max && (
                                                <p id="usia-max-error" role="alert" className="text-xs text-destructive">
                                                    {errors.batas_usia_max}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24">
                            
                            <div className="bg-card border border-border rounded-xl p-5 lg:p-6 space-y-4 shadow-xs">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Lokasi dan Detail
                                </h2>

                                <div className="space-y-1.5">
                                    <Label htmlFor="id_lapangan" className="text-sm font-medium">
                                        Lapangan (Opsional)
                                    </Label>
                                    <select
                                        id="id_lapangan"
                                        value={data.id_lapangan}
                                        onChange={(e) => setData("id_lapangan", e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                        aria-describedby={errors.id_lapangan ? "lapangan-error" : undefined}
                                        aria-invalid={!!errors.id_lapangan}
                                    >
                                        <option value="" className="bg-background text-foreground">-- Belum Ditentukan / Bebas --</option>
                                        {lapangan.map((lap) => (
                                            <option key={lap.id_lapangan} value={lap.id_lapangan} className="bg-background text-foreground">
                                                {lap.nama_lapangan}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_lapangan && (
                                        <p id="lapangan-error" role="alert" className="text-xs text-destructive">
                                            {errors.id_lapangan}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="foto" className="text-sm font-medium">
                                        Foto Banner Mabar (Opsional)
                                    </Label>
                                    <label
                                        htmlFor="foto"
                                        className="cursor-pointer border border-dashed border-input hover:border-foreground/50 focus-within:ring-2 focus-within:ring-ring focus-within:outline-none h-24 rounded-lg flex flex-col items-center justify-center gap-1.5 text-sm text-muted-foreground w-full transition-colors bg-muted/20"
                                    >
                                        <Upload className="size-4" />
                                        <span className="text-xs font-medium text-foreground">Pilih file gambar</span>
                                        <span className="text-[11px] text-muted-foreground">Format gambar, maks 2 MB</span>
                                        <input
                                            id="foto"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="sr-only"
                                            aria-describedby={errors.foto ? "foto-error" : undefined}
                                            aria-invalid={!!errors.foto}
                                        />
                                    </label>
                                    {data.foto && (
                                        <div className="flex items-center gap-2 pt-1">
                                            {previewUrl && (
                                                <div className="size-10 rounded-md overflow-hidden border border-border shrink-0">
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <span className="text-xs text-foreground truncate flex-1">
                                                {data.foto.name}
                                            </span>
                                        </div>
                                    )}
                                    {errors.foto && (
                                        <p id="foto-error" role="alert" className="text-xs text-destructive">
                                            {errors.foto}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="deskripsi" className="text-sm font-medium">
                                        Deskripsi & Catatan Khusus (Opsional)
                                    </Label>
                                    <textarea
                                        id="deskripsi"
                                        rows={4}
                                        placeholder="Contoh: Bawa raket sendiri, kok sudah disiapkan. Level permainan santai pemula - menengah..."
                                        value={data.deskripsi}
                                        onChange={(e) => setData("deskripsi", e.target.value)}
                                        className="w-full p-3 rounded-lg border border-input bg-background text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-y min-h-[96px] text-foreground"
                                        aria-describedby={errors.deskripsi ? "deskripsi-error" : undefined}
                                        aria-invalid={!!errors.deskripsi}
                                    />
                                    {errors.deskripsi && (
                                        <p id="deskripsi-error" role="alert" className="text-xs text-destructive">
                                            {errors.deskripsi}
                                        </p>
                                    )}
                                </div>
                            </div>

                            
                            <div className="bg-card border border-border rounded-xl p-5 lg:p-6 space-y-4 shadow-xs">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Sebelum dikirim
                                </h2>

                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Jadwal akan diverifikasi Admin. Pantau statusnya di halaman{" "}
                                    <Link href="/open-mabar/saya" className="text-foreground underline underline-offset-2 hover:text-[var(--brand)] font-medium">
                                        Jadwal Saya
                                    </Link>.
                                </p>

                                <div className="space-y-2 pt-1">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-10 text-sm bg-[var(--brand)] hover:opacity-90 font-medium"
                                    >
                                        {processing ? "Mengirim..." : "Kirim Jadwal Mabar"}
                                    </Button>

                                    <Link href="/open-mabar" className="block w-full">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full h-10 text-sm font-medium"
                                        >
                                            Batal
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}
