import { useState } from "react";
import { useForm } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { formatIndonesianPhoneInput, handlePhoneKeyDown } from "@/lib/content";
import { BigiMemberBadge } from "@/components/ui/award-badge";

interface UserInfo {
    id_user: number;
    nama: string;
    email: string;
    no_whatsapp: string;
    jenis_pelanggan: "member" | "reguler";
    status_member: "aktif" | "tidak_aktif";
    tanggal_mulai_member?: string | null;
    tanggal_akhir_member?: string | null;
}

interface AkunProps {
    user: UserInfo;
}

function formatTanggalPendek(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(date);
    } catch {
        return dateStr;
    }
}

export default function PengaturanAkun({ user }: AkunProps) {
    const isMember = user.jenis_pelanggan === "member";
    const isMemberAktif = isMember && user.status_member === "aktif";

    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const profilForm = useForm({
        nama: user.nama,
        email: user.email || '',
        no_whatsapp: user.no_whatsapp,
    });

    const submitProfil = (e: React.FormEvent) => {
        e.preventDefault();
        profilForm.put("/pengaturan/akun/profil", { preserveScroll: true });
    };

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

    const memberStatusSection = (
        <section aria-labelledby="member-heading" className="bg-card border border-border rounded-xl p-5 lg:p-6 shadow-xs">
            <div className="pb-3 border-b border-border">
                <h2 id="member-heading" className="text-base font-semibold text-foreground">
                    Status Keanggotaan
                </h2>
            </div>

            <div className="pt-4 space-y-4">
                {isMemberAktif ? (
                    <div className="w-full flex justify-center overflow-hidden py-1">
                        <div className="max-w-full flex justify-center">
                            <BigiMemberBadge />
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-semibold capitalize text-foreground">
                            {isMember ? "Member" : "Pelanggan Reguler"}
                        </p>
                    </div>
                )}

                {isMember && user.tanggal_akhir_member && (
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                        <span className="text-sm text-muted-foreground">Berlaku sampai</span>
                        <span className="text-sm text-foreground">
                            {formatTanggalPendek(user.tanggal_akhir_member)}
                        </span>
                    </div>
                )}
            </div>
        </section>
    );

    return (
        <PublicLayout title="Pengaturan Akun - Bigi Badminton">
            <div className="pt-28 pb-24 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                        Pengaturan Akun
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Perbarui informasi profil dan kata sandi Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    
                    <div className="block lg:hidden">
                        {memberStatusSection}
                    </div>

                    
                    <div className="lg:col-span-3">
                        <section aria-labelledby="profil-heading" className="bg-card border border-border rounded-xl p-5 lg:p-6 shadow-xs">
                            <div className="pb-3 border-b border-border">
                                <h2 id="profil-heading" className="text-base font-semibold text-foreground">
                                    Data Profil
                                </h2>
                            </div>

                            <form onSubmit={submitProfil} className="pt-4 space-y-4" noValidate>
                                <div className="space-y-1.5">
                                    <Label htmlFor="nama" className="text-sm font-medium">Nama Lengkap</Label>
                                    <Input
                                        id="nama"
                                        type="text"
                                        name="nama"
                                        value={profilForm.data.nama}
                                        onChange={(e) => profilForm.setData("nama", e.target.value)}
                                        placeholder="Nama lengkap Anda"
                                        autoComplete="name"
                                        required
                                        className="h-10 text-sm"
                                        aria-describedby={profilForm.errors.nama ? "nama-error" : undefined}
                                        aria-invalid={!!profilForm.errors.nama}
                                    />
                                    {profilForm.errors.nama && (
                                        <p id="nama-error" role="alert" className="text-xs text-destructive">
                                            {profilForm.errors.nama}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium">Email (Opsional)</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={profilForm.data.email}
                                        onChange={(e) => profilForm.setData("email", e.target.value)}
                                        placeholder="nama@email.com (opsional)"
                                        autoComplete="email"
                                        className="h-10 text-sm"
                                        aria-describedby={profilForm.errors.email ? "email-error" : undefined}
                                        aria-invalid={!!profilForm.errors.email}
                                    />
                                    {profilForm.errors.email && (
                                        <p id="email-error" role="alert" className="text-xs text-destructive">
                                            {profilForm.errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="no_whatsapp" className="text-sm font-medium">Nomor WhatsApp</Label>
                                    <Input
                                        id="no_whatsapp"
                                        type="tel"
                                        name="no_whatsapp"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={13}
                                        value={profilForm.data.no_whatsapp}
                                        onChange={(e) => profilForm.setData("no_whatsapp", formatIndonesianPhoneInput(e.target.value))}
                                        onKeyDown={handlePhoneKeyDown}
                                        placeholder="Contoh: 081234567890"
                                        autoComplete="tel"
                                        required
                                        className="h-10 text-sm"
                                        aria-describedby={profilForm.errors.no_whatsapp ? "wa-error" : undefined}
                                        aria-invalid={!!profilForm.errors.no_whatsapp}
                                    />
                                    {profilForm.errors.no_whatsapp && (
                                        <p id="wa-error" role="alert" className="text-xs text-destructive">
                                            {profilForm.errors.no_whatsapp}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Format: diawali 08 (10–13 digit angka).
                                    </p>
                                </div>

                                <div className="pt-1">
                                    <Button
                                        type="submit"
                                        disabled={profilForm.processing}
                                        className="h-10 text-sm w-full sm:w-auto bg-[var(--brand)] hover:opacity-90 font-medium"
                                    >
                                        {profilForm.processing ? "Menyimpan..." : "Simpan Profil"}
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </div>

                    
                    <div className="lg:col-span-2 space-y-6">
                        
                        <div className="hidden lg:block">
                            {memberStatusSection}
                        </div>

                        <section aria-labelledby="password-heading" className="bg-card border border-border rounded-xl p-5 lg:p-6 shadow-xs">
                            <div className="pb-3 border-b border-border">
                                <h2 id="password-heading" className="text-base font-semibold text-foreground">
                                    Ganti Kata Sandi
                                </h2>
                            </div>

                            <form onSubmit={submitPassword} className="pt-4 space-y-4" noValidate>
                                <div className="space-y-1.5">
                                    <Label htmlFor="current_password" className="text-sm font-medium">Kata Sandi Saat Ini</Label>
                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            type={showCurrentPass ? "text" : "password"}
                                            name="current_password"
                                            value={passForm.data.current_password}
                                            onChange={(e) => passForm.setData("current_password", e.target.value)}
                                            placeholder="Masukkan kata sandi saat ini"
                                            className="h-10 text-sm pr-10"
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

                                <div className="space-y-1.5">
                                    <Label htmlFor="new_password" className="text-sm font-medium">Kata Sandi Baru</Label>
                                    <div className="relative">
                                        <Input
                                            id="new_password"
                                            type={showNewPass ? "text" : "password"}
                                            name="password"
                                            value={passForm.data.password}
                                            onChange={(e) => passForm.setData("password", e.target.value)}
                                            placeholder="Minimal 8 karakter"
                                            className="h-10 text-sm pr-10"
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

                                <div className="space-y-1.5">
                                    <Label htmlFor="password_confirmation" className="text-sm font-medium">Konfirmasi Kata Sandi Baru</Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={showConfirmPass ? "text" : "password"}
                                            name="password_confirmation"
                                            value={passForm.data.password_confirmation}
                                            onChange={(e) => passForm.setData("password_confirmation", e.target.value)}
                                            placeholder="Ulangi kata sandi baru"
                                            className="h-10 text-sm pr-10"
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

                                <div className="pt-1">
                                    <Button
                                        type="submit"
                                        disabled={passForm.processing}
                                        className="h-10 text-sm w-full sm:w-auto bg-[var(--brand)] hover:opacity-90 font-medium"
                                    >
                                        {passForm.processing ? "Memperbarui..." : "Ubah Kata Sandi"}
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
