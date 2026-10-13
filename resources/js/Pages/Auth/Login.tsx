import React, { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WakeGlyph } from '@/components/ui/background-ascii-wake';
import { AuthImagePanel, AuthMobileBanner } from '@/components/auth-image-panel';
import { formatIndonesianPhoneInput, handlePhoneKeyDown } from '@/lib/content';

interface SharedProps {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: any;
}

export default function Login() {
    const { flash } = usePage<SharedProps>().props;
    const [showPassword, setShowPassword] = useState(false);

    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const redirectParam = urlParams.get('redirect') || '';

    const { data, setData, post, processing, errors } = useForm({
        no_whatsapp: '',
        password: '',
        redirect: redirectParam,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-dvh w-full bg-background text-foreground flex flex-col lg:flex-row overflow-x-hidden">
            <AuthImagePanel
                imageSrc="/images/login-panel.jpg"
                imageAlt="Suasana lapangan Bigi Badminton Arena"
                title="Bigi Badminton"
                description="Sistem Reservasi & Komunitas Open Mabar. Nikmati kemudahan mencari lawan tanding dan kelola jadwal main bareng secara terstruktur."
            />

            <div className="flex-1 w-full flex flex-col justify-center items-center bg-background px-5 sm:px-8 py-3 sm:py-6 lg:py-12 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden min-h-dvh lg:min-h-0 box-border pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-20 pointer-events-none" />

                <div className="w-full max-w-md my-auto flex flex-col space-y-3 sm:space-y-4 lg:space-y-6 relative z-10">
                    
                    <AuthMobileBanner
                        imageSrc="/images/panel-athletes-transparent.png"
                        imageAlt="Suasana lapangan Bigi Badminton Arena"
                    />

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">
                            Selamat Datang Kembali
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Belum punya akun?{' '}
                            <Link
                                href="/register"
                                className="text-[var(--brand)] hover:underline font-semibold"
                            >
                                Daftar
                            </Link>
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="p-3 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4" noValidate>
                        <input type="hidden" name="redirect" value={data.redirect} />

                        <div className="space-y-1.5 sm:space-y-2">
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
                                className="h-12 text-base"
                                required
                                autoComplete="tel"
                                aria-invalid={!!(errors.no_whatsapp || (errors as any).email)}
                                aria-describedby={(errors.no_whatsapp || (errors as any).email) ? "no_whatsapp-error" : undefined}
                            />
                            {(errors.no_whatsapp || (errors as any).email) && (
                                <p id="no_whatsapp-error" role="alert" className="text-xs text-destructive">
                                    {errors.no_whatsapp || (errors as any).email}
                                </p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Format: diawali 08 (10–13 digit angka).
                            </p>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor="password">Kata Sandi</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi"
                                    className="h-12 text-base pr-11"
                                    required
                                    autoComplete="current-password"
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
                                <p id="password-error" role="alert" className="text-xs text-destructive">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-12 text-base font-semibold transition-all mt-2"
                        >
                            {processing ? 'Memproses...' : 'Masuk'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
