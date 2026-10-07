import { useState } from "react";
import { useForm } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Lock, ShieldCheck } from "lucide-react";

interface UserInfo {
    id_user: number;
    nama: string;
    email: string;
    no_whatsapp: string;
    jenis_pelanggan: "member" | "reguler";
    status_member: "aktif" | "tidak_aktif";
}

interface AkunProps {
    user: UserInfo;
}

export default function PengaturanAkun({ user }: AkunProps) {
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    /* ── Form Profil ── */
    const profilForm = useForm({
        nama: user.nama,
        email: user.email,
        no_whatsapp: user.no_whatsapp,
    });

    const submitProfil = (e: React.FormEvent) => {
        e.preventDefault();
        profilForm.put("/pengaturan/akun/profil", { preserveScroll: true });
    };

    /* ── Form Password ── */
    const passForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        passForm.put("/pengaturan/akun/password", {
            preserveScroll: true,
            onSuccess: () => {
                passForm.reset();
            },
        });
    };

    return (
        <PublicLayout title="Pengaturan Akun - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-2xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Pengaturan Akun</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Perbarui informasi profil dan kata sandi Anda.
                    </p>
                </div>

                {/* ── Kartu Info Member ── */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                    <ShieldCheck className={`size-5 shrink-0 ${user.status_member === "aktif" ? "text-[var(--brand)]" : "text-muted-foreground"}`} />
                    <div>
                        <p className="text-sm font-semibold capitalize text-foreground">
                            {user.jenis_pelanggan === "member" ? "Member" : "Reguler"}
                            {user.status_member === "aktif" && user.jenis_pelanggan === "member" && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
                                    Aktif
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Status keanggotaan hanya dapat diubah oleh admin.
                        </p>
                    </div>
                </div>

                {/* ── Form Profil ── */}
                <section aria-labelledby="profil-heading" className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <User className="size-4 text-muted-foreground" />
                        <h2 id="profil-heading" className="text-base font-bold text-foreground">Data Profil</h2>
                    </div>

                    <form onSubmit={submitProfil} className="space-y-4" noValidate>
                        {/* Nama */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input
                                id="nama"
                                type="text"
                                name="nama"
                                value={profilForm.data.nama}
                                onChange={(e) => profilForm.setData("nama", e.target.value)}
                                placeholder="Nama lengkap Anda"
                                autoComplete="name"
                                required
                                aria-describedby={profilForm.errors.nama ? "nama-error" : undefined}
                                aria-invalid={!!profilForm.errors.nama}
                            />
                            {profilForm.errors.nama && (
                                <p id="nama-error" role="alert" className="text-xs text-destructive">
                                    {profilForm.errors.nama}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={profilForm.data.email}
                                onChange={(e) => profilForm.setData("email", e.target.value)}
                                placeholder="nama@email.com"
                                autoComplete="email"
                                required
                                aria-describedby={profilForm.errors.email ? "email-error" : undefined}
                                aria-invalid={!!profilForm.errors.email}
                            />
                            {profilForm.errors.email && (
                                <p id="email-error" role="alert" className="text-xs text-destructive">
                                    {profilForm.errors.email}
                                </p>
                            )}
                        </div>

                        {/* Nomor WhatsApp */}
                        <div className="space-y-1.5">
                            <Label htmlFor="no_whatsapp">Nomor WhatsApp</Label>
                            <Input
                                id="no_whatsapp"
                                type="tel"
                                name="no_whatsapp"
                                value={profilForm.data.no_whatsapp}
                                onChange={(e) => profilForm.setData("no_whatsapp", e.target.value)}
                                placeholder="Contoh: 081234567890"
                                autoComplete="tel"
                                required
                                aria-describedby={profilForm.errors.no_whatsapp ? "wa-error" : undefined}
                                aria-invalid={!!profilForm.errors.no_whatsapp}
                            />
                            {profilForm.errors.no_whatsapp && (
                                <p id="wa-error" role="alert" className="text-xs text-destructive">
                                    {profilForm.errors.no_whatsapp}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={profilForm.processing}
                            className="w-full sm:w-auto bg-[var(--brand)] hover:opacity-90 min-h-[44px]"
                        >
                            {profilForm.processing ? "Menyimpan..." : "Simpan Profil"}
                        </Button>
                    </form>
                </section>

                {/* ── Form Ganti Kata Sandi ── */}
                <section aria-labelledby="password-heading" className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Lock className="size-4 text-muted-foreground" />
                        <h2 id="password-heading" className="text-base font-bold text-foreground">Ganti Kata Sandi</h2>
                    </div>

                    <form onSubmit={submitPassword} className="space-y-4" noValidate>
                        {/* Kata Sandi Saat Ini */}
                        <div className="space-y-1.5">
                            <Label htmlFor="current_password">Kata Sandi Saat Ini</Label>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    type={showCurrentPass ? "text" : "password"}
                                    name="current_password"
                                    value={passForm.data.current_password}
                                    onChange={(e) => passForm.setData("current_password", e.target.value)}
                                    placeholder="Masukkan kata sandi saat ini"
                                    className="pr-10"
                                    autoComplete="current-password"
                                    required
                                    aria-describedby={passForm.errors.current_password ? "curpass-error" : undefined}
                                    aria-invalid={!!passForm.errors.current_password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-h-[44px] flex items-center"
                                    aria-label={showCurrentPass ? "Sembunyikan kata sandi saat ini" : "Tampilkan kata sandi saat ini"}
                                >
                                    {showCurrentPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {passForm.errors.current_password && (
                                <p id="curpass-error" role="alert" className="text-xs text-destructive">
                                    {passForm.errors.current_password}
                                </p>
                            )}
                        </div>

                        {/* Kata Sandi Baru */}
                        <div className="space-y-1.5">
                            <Label htmlFor="new_password">Kata Sandi Baru</Label>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type={showNewPass ? "text" : "password"}
                                    name="password"
                                    value={passForm.data.password}
                                    onChange={(e) => passForm.setData("password", e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="pr-10"
                                    autoComplete="new-password"
                                    required
                                    aria-describedby={passForm.errors.password ? "newpass-error" : undefined}
                                    aria-invalid={!!passForm.errors.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-h-[44px] flex items-center"
                                    aria-label={showNewPass ? "Sembunyikan kata sandi baru" : "Tampilkan kata sandi baru"}
                                >
                                    {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {passForm.errors.password && (
                                <p id="newpass-error" role="alert" className="text-xs text-destructive">
                                    {passForm.errors.password}
                                </p>
                            )}
                        </div>

                        {/* Konfirmasi Kata Sandi Baru */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi Baru</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmPass ? "text" : "password"}
                                    name="password_confirmation"
                                    value={passForm.data.password_confirmation}
                                    onChange={(e) => passForm.setData("password_confirmation", e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    className="pr-10"
                                    autoComplete="new-password"
                                    required
                                    aria-describedby={passForm.errors.password_confirmation ? "confirm-error" : undefined}
                                    aria-invalid={!!passForm.errors.password_confirmation}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-h-[44px] flex items-center"
                                    aria-label={showConfirmPass ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                                >
                                    {showConfirmPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {passForm.errors.password_confirmation && (
                                <p id="confirm-error" role="alert" className="text-xs text-destructive">
                                    {passForm.errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={passForm.processing}
                            className="w-full sm:w-auto bg-[var(--brand)] hover:opacity-90 min-h-[44px]"
                        >
                            {passForm.processing ? "Memperbarui..." : "Ubah Kata Sandi"}
                        </Button>
                    </form>
                </section>
            </div>
        </PublicLayout>
    );
}
