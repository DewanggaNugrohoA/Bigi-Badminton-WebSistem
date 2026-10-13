import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WakeGlyph } from '@/components/ui/background-ascii-wake';
import { AuthImagePanel, AuthMobileBanner } from '@/components/auth-image-panel';
import { formatIndonesianPhoneInput, handlePhoneKeyDown } from '@/lib/content';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        no_whatsapp: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-dvh w-full bg-background text-foreground flex flex-col lg:flex-row overflow-x-hidden">
            <AuthImagePanel
                imageSrc="/images/daftar-panel.jpg"
                imageAlt="Komunitas dan fasilitas lapangan Bigi Badminton"
                title="Gabung Komunitas Bigi"
                description="Daftar akun sekarang untuk mengikuti event Open Mabar, membuat jadwal main bareng, dan berdiskusi di forum chat mabar."
            />

            <div className="flex-1 w-full flex flex-col justify-center items-center bg-background px-5 sm:px-8 py-3 sm:py-6 lg:py-12 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden min-h-dvh lg:min-h-0 box-border pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-20 pointer-events-none" />

                <div className="w-full max-w-md my-auto flex flex-col space-y-2.5 sm:space-y-3.5 lg:space-y-6 relative z-10">
                    
                    <AuthMobileBanner
                        isCompact={true}
                        imageSrc="/images/panel-athletes-transparent.png"
                        imageAlt="Komunitas dan fasilitas lapangan Bigi Badminton"
                    />

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">
                            Daftar Akun Baru
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <Link
                                href="/login"
                                className="text-[var(--brand)] hover:underline font-semibold"
                            >
                                Masuk
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3" noValidate>
                        <div className="space-y-1">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input
                                id="nama"
                                type="text"
                                name="nama"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Nama lengkap Anda"
                                className="h-11 sm:h-12 text-base"
                                required
                                autoComplete="name"
                                aria-invalid={!!errors.nama}
                                aria-describedby={errors.nama ? "nama-error" : undefined}
                            />
                            {errors.nama && (
                                <p id="nama-error" role="alert" className="text-xs text-destructive">{errors.nama}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="no_whatsapp">Nomor WhatsApp (No. HP)</Label>
                            <Input
                                id="no_whatsapp"
                                type="tel"
                                name="no_whatsapp"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={13}
                                value={data.no_whatsapp}
                                onChange={(e) => setData('no_whatsapp', formatIndonesianPhoneInput(e.target.value))}
                                onKeyDown={handlePhoneKeyDown}
                                placeholder="Contoh: 081234567890"
                                className="h-11 sm:h-12 text-base"
                                required
                                autoComplete="tel"
                                aria-invalid={!!errors.no_whatsapp}
                                aria-describedby={errors.no_whatsapp ? "wa-error" : undefined}
                            />
                            {errors.no_whatsapp && (
                                <p id="wa-error" role="alert" className="text-xs text-destructive">{errors.no_whatsapp}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Format: diawali 08 (10–13 digit angka). Kode verifikasi akan dikirimkan via WhatsApp.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password">Kata Sandi</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="h-11 sm:h-12 text-base pr-11"
                                    required
                                    autoComplete="new-password"
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" role="alert" className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi"
                                    className="h-11 sm:h-12 text-base pr-11"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-11 sm:h-12 text-base font-semibold transition-all mt-2"
                        >
                            {processing ? 'Memproses...' : 'Daftar Sekarang'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
