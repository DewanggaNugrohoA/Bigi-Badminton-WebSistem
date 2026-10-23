import { useState, useRef, useEffect } from "react";
import { router, useForm } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    User as UserIcon,
    Lock,
    Camera,
    Eye,
    EyeOff,
    CheckCircle2,
    Calendar,
    Phone,
    Mail,
    ShieldCheck,
    KeyRound,
    Loader2,
} from "lucide-react";
import { formatIndonesianPhoneInput, handlePhoneKeyDown } from "@/lib/content";
import { BigiMemberBadge } from "@/components/ui/award-badge";

interface UserInfo {
    id_user: number;
    nama: string;
    email: string;
    no_whatsapp: string;
    foto?: string | null;
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

    // Tab state: 'profile' | 'password'
    const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

    // Avatar upload & preview state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [hapusFoto, setHapusFoto] = useState(false);
    const [isSavingProfil, setIsSavingProfil] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Password visibility states
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Profile form state
    const [formData, setFormData] = useState({
        nama: user.nama || "",
        email: user.email || "",
        no_whatsapp: user.no_whatsapp || "",
    });

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setHapusFoto(false);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleDeleteAvatar = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setHapusFoto(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const submitProfil = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfil(true);
        setErrors({});

        router.post(
            "/pengaturan/akun/profil",
            {
                _method: "put",
                nama: formData.nama,
                email: formData.email,
                no_whatsapp: formData.no_whatsapp,
                foto: selectedFile || undefined,
                hapus_foto: hapusFoto ? "1" : "0",
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedFile(null);
                    setHapusFoto(false);
                    setIsSavingProfil(false);
                },
                onError: (errs) => {
                    setErrors(errs);
                    setIsSavingProfil(false);
                },
            }
        );
    };

    // Password form using Inertia useForm
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

    // State untuk Popup / Modal Lupa Kata Sandi via OTP WhatsApp
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
    const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
    const [otpData, setOtpData] = useState({
        kode_otp: "",
        password: "",
        password_confirmation: "",
    });
    const [showOtpNewPass, setShowOtpNewPass] = useState(false);
    const [showOtpConfirmPass, setShowOtpConfirmPass] = useState(false);

    useEffect(() => {
        if (otpCooldown <= 0) return;
        const timer = setInterval(() => {
            setOtpCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [otpCooldown]);

    const formatMaskedPhone = (phone?: string) => {
        if (!phone) return "";
        const clean = phone.replace(/\D/g, "");
        if (clean.length < 8) return phone;
        const prefix = clean.slice(0, 4);
        const suffix = clean.slice(-4);
        return `${prefix} •••• ${suffix}`;
    };

    const handleKirimOtp = () => {
        if (otpCooldown > 0 || isSendingOtp) return;
        setIsSendingOtp(true);
        setOtpErrors({});
        setOtpSuccessMessage(null);

        router.post(
            "/pengaturan/akun/lupa-password/kirim-otp",
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSendingOtp(false);
                    setOtpCooldown(60);
                    setOtpSuccessMessage("Kode OTP telah dikirim ke nomor WhatsApp Anda.");
                },
                onError: (errs) => {
                    setIsSendingOtp(false);
                    setOtpErrors(errs);
                },
            }
        );
    };

    const handleBukaModalLupaPassword = () => {
        setIsOtpModalOpen(true);
        setOtpErrors({});
        setOtpSuccessMessage(null);
        setOtpData({ kode_otp: "", password: "", password_confirmation: "" });

        if (otpCooldown <= 0) {
            handleKirimOtp();
        }
    };

    const handleVerifikasiOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifyingOtp(true);
        setOtpErrors({});

        router.post(
            "/pengaturan/akun/lupa-password/verifikasi",
            otpData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsVerifyingOtp(false);
                    setIsOtpModalOpen(false);
                    setOtpData({ kode_otp: "", password: "", password_confirmation: "" });
                    passForm.reset();
                },
                onError: (errs) => {
                    setIsVerifyingOtp(false);
                    setOtpErrors(errs);
                },
            }
        );
    };

    // Current avatar image display source
    const currentAvatarSrc = !hapusFoto ? previewUrl || user.foto : null;

    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name
            .trim()
            .split(/\s+/)
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    return (
        <PublicLayout title="Pengaturan Akun - Bigi Badminton">
            <div className="pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Halaman */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                        Pengaturan Akun
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola data profil, foto, dan kata sandi akun Anda.
                    </p>
                </div>

                {/* Layout 2 Kolom: Sidebar Tab Kiri & Konten Utama Kanan */}
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                    
                    {/* Sidebar Navigasi Tab Kiri */}
                    <aside className="w-full lg:w-64 shrink-0 bg-card/90 backdrop-blur-sm border border-border/80 rounded-2xl p-2 sm:p-2.5 shadow-xs space-y-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                activeTab === "profile"
                                    ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <UserIcon className="size-4 shrink-0" />
                            <span>Pengaturan Profil</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("password")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                activeTab === "password"
                                    ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <Lock className="size-4 shrink-0" />
                            <span>Kata Sandi</span>
                        </button>
                    </aside>

                    {/* Konten Utama Kanan */}
                    <main className="flex-1 w-full bg-card/90 backdrop-blur-sm border border-border/80 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xs">
                        
                        {/* TAB 1: PENGATURAN PROFIL */}
                        {activeTab === "profile" && (
                            <form onSubmit={submitProfil} className="space-y-8" noValidate>
                                
                                {/* Area Avatar Profil (Sesuai Referensi Gambar) */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 pb-6 border-b border-border/60">
                                    {/* Lingkaran Avatar dengan Tombol Kamera */}
                                    <div className="relative size-28 sm:size-32 rounded-full ring-4 ring-background border-2 border-border/80 shadow-md shrink-0 bg-muted flex items-center justify-center overflow-visible">
                                        <div className="size-full rounded-full overflow-hidden flex items-center justify-center">
                                            {currentAvatarSrc ? (
                                                <img
                                                    src={currentAvatarSrc}
                                                    alt={user.nama}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <div className="size-full flex items-center justify-center bg-primary/15 text-primary text-3xl font-extrabold font-heading">
                                                    {getInitials(formData.nama)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Ikon Kamera Overlay */}
                                        <button
                                            type="button"
                                            onClick={handleUploadClick}
                                            className="absolute bottom-0 right-0 size-8 sm:size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card shadow-md hover:scale-110 active:scale-95 transition-transform"
                                            title="Ubah foto profil"
                                            aria-label="Ubah foto profil"
                                        >
                                            <Camera className="size-4" />
                                        </button>
                                    </div>

                                    {/* Tombol Aksi Upload & Hapus Foto */}
                                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                            <Button
                                                type="button"
                                                onClick={handleUploadClick}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs"
                                            >
                                                Unggah Foto Baru
                                            </Button>

                                            {currentAvatarSrc && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleDeleteAvatar}
                                                    className="border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors"
                                                >
                                                    Hapus Foto
                                                </Button>
                                            )}
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-1">
                                            Format yang didukung: JPG, PNG, WEBP. Ukuran maksimal 2MB.
                                        </p>
                                        {errors.foto && (
                                            <p className="text-xs text-destructive font-medium">
                                                {errors.foto}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Form Fields Grid (2 Kolom Responsif Sesuai Referensi) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                    
                                    {/* Field: Nama Lengkap */}
                                    <div className="space-y-2">
                                        <Label htmlFor="nama" className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                                            <span>Nama Lengkap</span>
                                            <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="nama"
                                            type="text"
                                            name="nama"
                                            value={formData.nama}
                                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                            placeholder="Masukkan nama lengkap Anda"
                                            autoComplete="name"
                                            required
                                            className="h-11 rounded-xl bg-background/60 text-sm font-medium border-border/80"
                                            aria-invalid={!!errors.nama}
                                        />
                                        {errors.nama && (
                                            <p className="text-xs text-destructive font-medium">
                                                {errors.nama}
                                            </p>
                                        )}
                                    </div>

                                    {/* Field: Nomor WhatsApp */}
                                    <div className="space-y-2">
                                        <Label htmlFor="no_whatsapp" className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                                            <Phone className="size-3.5 text-muted-foreground" />
                                            <span>Nomor WhatsApp</span>
                                            <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="no_whatsapp"
                                            type="tel"
                                            name="no_whatsapp"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={13}
                                            value={formData.no_whatsapp}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    no_whatsapp: formatIndonesianPhoneInput(e.target.value),
                                                })
                                            }
                                            onKeyDown={handlePhoneKeyDown}
                                            placeholder="Contoh: 081234567890"
                                            autoComplete="tel"
                                            required
                                            className="h-11 rounded-xl bg-background/60 text-sm font-medium border-border/80"
                                            aria-invalid={!!errors.no_whatsapp}
                                        />
                                        {errors.no_whatsapp && (
                                            <p className="text-xs text-destructive font-medium">
                                                {errors.no_whatsapp}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground">
                                            Format: diawali 08 (10–13 digit angka).
                                        </p>
                                    </div>

                                    {/* Field: Email (Opsional) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                                            <Mail className="size-3.5 text-muted-foreground" />
                                            <span>Alamat Email (Opsional)</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="nama@email.com"
                                            autoComplete="email"
                                            className="h-11 rounded-xl bg-background/60 text-sm font-medium border-border/80"
                                            aria-invalid={!!errors.email}
                                        />
                                        {errors.email && (
                                            <p className="text-xs text-destructive font-medium">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Field: Jenis Pelanggan / Keanggotaan (Lencana Badge 3D: Gold Member / Silver Reguler) */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                                                <ShieldCheck className="size-3.5 text-muted-foreground" />
                                                <span>Tipe Keanggotaan</span>
                                            </Label>
                                            {isMemberAktif && user.tanggal_akhir_member && (
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    s.d. {formatTanggalPendek(user.tanggal_akhir_member)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="pt-0.5 flex justify-start">
                                            <BigiMemberBadge isMember={isMemberAktif} />
                                        </div>
                                    </div>

                                </div>

                                {/* Tombol Simpan Perubahan */}
                                <div className="pt-4 border-t border-border/60 flex justify-start">
                                    <Button
                                        type="submit"
                                        disabled={isSavingProfil}
                                        className="h-11 px-8 rounded-xl bg-foreground text-background hover:bg-primary hover:text-white font-semibold text-sm shadow-md transition-all active:scale-95"
                                    >
                                        {isSavingProfil ? "Menyimpan..." : "Simpan Perubahan"}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* TAB 2: KATA SANDI */}
                        {activeTab === "password" && (
                            <form onSubmit={submitPassword} className="space-y-6 max-w-xl" noValidate>
                                <div className="pb-4 border-b border-border/60">
                                    <h2 className="text-lg font-bold text-foreground font-heading">
                                        Ganti Kata Sandi
                                    </h2>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                        Pastikan akun Anda menggunakan kata sandi yang kuat dan aman.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Current Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password" className="text-xs sm:text-sm font-semibold text-foreground">
                                            Kata Sandi Saat Ini
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="current_password"
                                                type={showCurrentPass ? "text" : "password"}
                                                name="current_password"
                                                value={passForm.data.current_password}
                                                onChange={(e) => passForm.setData("current_password", e.target.value)}
                                                placeholder="Masukkan kata sandi saat ini"
                                                className="h-11 rounded-xl bg-background/60 text-sm pr-11 border-border/80 font-medium"
                                                autoComplete="current-password"
                                                required
                                                aria-invalid={!!passForm.errors.current_password}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPass(!showCurrentPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition-colors"
                                                aria-label={showCurrentPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                            >
                                                {showCurrentPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        {passForm.errors.current_password && (
                                            <p className="text-xs text-destructive font-medium">
                                                {passForm.errors.current_password}
                                            </p>
                                        )}
                                    </div>

                                    {/* New Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="new_password" className="text-xs sm:text-sm font-semibold text-foreground">
                                            Kata Sandi Baru
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="new_password"
                                                type={showNewPass ? "text" : "password"}
                                                name="password"
                                                value={passForm.data.password}
                                                onChange={(e) => passForm.setData("password", e.target.value)}
                                                placeholder="Minimal 8 karakter"
                                                className="h-11 rounded-xl bg-background/60 text-sm pr-11 border-border/80 font-medium"
                                                autoComplete="new-password"
                                                required
                                                aria-invalid={!!passForm.errors.password}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPass(!showNewPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition-colors"
                                                aria-label={showNewPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                            >
                                                {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        {passForm.errors.password && (
                                            <p className="text-xs text-destructive font-medium">
                                                {passForm.errors.password}
                                            </p>
                                        )}
                                    </div>

                                    {/* Confirm New Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-xs sm:text-sm font-semibold text-foreground">
                                            Konfirmasi Kata Sandi Baru
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                type={showConfirmPass ? "text" : "password"}
                                                name="password_confirmation"
                                                value={passForm.data.password_confirmation}
                                                onChange={(e) => passForm.setData("password_confirmation", e.target.value)}
                                                placeholder="Ulangi kata sandi baru"
                                                className="h-11 rounded-xl bg-background/60 text-sm pr-11 border-border/80 font-medium"
                                                autoComplete="new-password"
                                                required
                                                aria-invalid={!!passForm.errors.password_confirmation}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition-colors"
                                                aria-label={showConfirmPass ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                                            >
                                                {showConfirmPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        {passForm.errors.password_confirmation && (
                                            <p className="text-xs text-destructive font-medium">
                                                {passForm.errors.password_confirmation}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-wrap items-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={passForm.processing}
                                        className="h-11 px-8 rounded-xl bg-foreground text-background hover:bg-primary hover:text-white font-semibold text-sm shadow-md transition-all active:scale-95"
                                    >
                                        {passForm.processing ? "Memperbarui..." : "Ubah Kata Sandi"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBukaModalLupaPassword}
                                        className="h-11 px-5 rounded-xl border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 text-foreground font-medium text-sm transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <KeyRound className="size-4 text-muted-foreground" />
                                        <span>Lupa Kata Sandi?</span>
                                    </Button>
                                </div>
                            </form>
                        )}

                    </main>

                </div>
            </div>

            {/* Modal / Popup Simpel: Reset Kata Sandi via OTP WhatsApp */}
            <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl p-6 sm:p-7 shadow-xl border-border/80 bg-card">
                    <DialogHeader className="gap-2">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                <KeyRound className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold font-heading">
                                    Lupa Kata Sandi
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Atur ulang kata sandi dengan verifikasi WhatsApp.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Info Nomor WhatsApp Penerima OTP */}
                    <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate">
                            <Phone className="size-4 text-emerald-600 shrink-0" />
                            <span className="text-muted-foreground shrink-0">Kode OTP ke:</span>
                            <span className="font-semibold text-foreground font-mono truncate">
                                {formatMaskedPhone(user.no_whatsapp)}
                            </span>
                        </div>
                        {otpCooldown > 0 ? (
                            <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                                Kirim ulang dlm {otpCooldown}s
                            </span>
                        ) : (
                            <button
                                type="button"
                                disabled={isSendingOtp}
                                onClick={handleKirimOtp}
                                className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50 shrink-0"
                            >
                                {isSendingOtp ? "Mengirim..." : "Kirim Ulang"}
                            </button>
                        )}
                    </div>

                    {otpSuccessMessage && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>{otpSuccessMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleVerifikasiOtp} className="space-y-4 pt-1" noValidate>
                        {/* Input Kode OTP */}
                        <div className="space-y-1.5">
                            <Label htmlFor="modal_kode_otp" className="text-xs font-semibold text-foreground">
                                Masukkan 6 Digit Kode OTP
                            </Label>
                            <Input
                                id="modal_kode_otp"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="000000"
                                value={otpData.kode_otp}
                                onChange={(e) =>
                                    setOtpData({
                                        ...otpData,
                                        kode_otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                                    })
                                }
                                className="h-12 rounded-xl bg-background/60 text-center text-xl font-mono tracking-[0.35em] font-bold border-border/80 focus-visible:ring-primary"
                                required
                                autoFocus
                            />
                            {otpErrors.kode_otp && (
                                <p className="text-xs text-destructive font-medium">
                                    {otpErrors.kode_otp}
                                </p>
                            )}
                            {otpErrors.otp && (
                                <p className="text-xs text-destructive font-medium">
                                    {otpErrors.otp}
                                </p>
                            )}
                        </div>

                        {/* Input Kata Sandi Baru */}
                        <div className="space-y-1.5">
                            <Label htmlFor="modal_otp_password" className="text-xs font-semibold text-foreground">
                                Kata Sandi Baru
                            </Label>
                            <div className="relative">
                                <Input
                                    id="modal_otp_password"
                                    type={showOtpNewPass ? "text" : "password"}
                                    placeholder="Minimal 8 karakter"
                                    value={otpData.password}
                                    onChange={(e) =>
                                        setOtpData({ ...otpData, password: e.target.value })
                                    }
                                    className="h-11 rounded-xl bg-background/60 text-sm pr-11 border-border/80 font-medium"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOtpNewPass(!showOtpNewPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                                    aria-label={showOtpNewPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                >
                                    {showOtpNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {otpErrors.password && (
                                <p className="text-xs text-destructive font-medium">
                                    {otpErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Input Konfirmasi Kata Sandi Baru */}
                        <div className="space-y-1.5">
                            <Label htmlFor="modal_otp_password_confirmation" className="text-xs font-semibold text-foreground">
                                Konfirmasi Kata Sandi Baru
                            </Label>
                            <div className="relative">
                                <Input
                                    id="modal_otp_password_confirmation"
                                    type={showOtpConfirmPass ? "text" : "password"}
                                    placeholder="Ulangi kata sandi baru"
                                    value={otpData.password_confirmation}
                                    onChange={(e) =>
                                        setOtpData({ ...otpData, password_confirmation: e.target.value })
                                    }
                                    className="h-11 rounded-xl bg-background/60 text-sm pr-11 border-border/80 font-medium"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOtpConfirmPass(!showOtpConfirmPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                                    aria-label={showOtpConfirmPass ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                                >
                                    {showOtpConfirmPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {otpErrors.password_confirmation && (
                                <p className="text-xs text-destructive font-medium">
                                    {otpErrors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-2 pt-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsOtpModalOpen(false)}
                                className="rounded-xl h-10 px-4 text-xs font-medium"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isVerifyingOtp ||
                                    otpData.kode_otp.length !== 6 ||
                                    !otpData.password ||
                                    otpData.password.length < 8
                                }
                                className="rounded-xl h-10 px-5 bg-foreground text-background hover:bg-primary hover:text-white font-semibold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-2"
                            >
                                {isVerifyingOtp ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>Simpan Kata Sandi Baru</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PublicLayout>
    );
}
