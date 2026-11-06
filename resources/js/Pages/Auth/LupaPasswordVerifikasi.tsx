import React, { useState, useEffect } from 'react';
import { useForm, Link, router, usePage } from '@inertiajs/react';
import { KeyRound, Smartphone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WakeGlyph } from '@/components/ui/background-ascii-wake';
import { AuthImagePanel, AuthMobileBanner } from '@/components/auth-image-panel';

interface LupaPasswordVerifikasiProps {
    no_whatsapp: string;
}

interface SharedProps {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: any;
}

export default function LupaPasswordVerifikasi({ no_whatsapp }: LupaPasswordVerifikasiProps) {
    const { flash } = usePage<SharedProps>().props;
    const [cooldown, setCooldown] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        no_whatsapp: no_whatsapp || '',
        kode_otp: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/lupa-password/reset');
    };

    const handleKirimUlang = () => {
        if (cooldown > 0 || isResending) return;
        setIsResending(true);
        router.post(
            '/lupa-password/kirim-ulang-otp',
            { no_whatsapp },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsResending(false);
                    setCooldown(60);
                },
            }
        );
    };

    return (
        <div className="min-h-dvh w-full bg-transparent text-foreground flex flex-col lg:flex-row overflow-x-hidden">
            <AuthImagePanel
                imageSrc="/images/login-panel.jpg"
                imageAlt="Reset kata sandi Bigi Badminton"
                title="Atur Ulang Kata Sandi"
                description="Masukkan kode verifikasi 6 digit yang dikirim ke nomor WhatsApp Anda, lalu buat kata sandi baru untuk mengamankan akun Anda."
                backHref="/lupa-password"
                backLabel="Kembali ke form nomor"
            />

            <div className="flex-1 w-full flex flex-col justify-center items-center bg-transparent px-5 sm:px-8 py-3 sm:py-6 lg:py-12 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden min-h-dvh lg:min-h-0 box-border pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-20 pointer-events-none" />

                <div className="w-full max-w-md my-auto flex flex-col space-y-4 sm:space-y-6 relative z-10">
                    <AuthMobileBanner
                        isCompact={true}
                        imageSrc="/images/panel-athletes-transparent.png"
                        imageAlt="Reset kata sandi Bigi Badminton"
                        backHref="/lupa-password"
                        backLabel="Kembali"
                    />

                    <div>
                        <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[var(--brand)] mb-4">
                            <ShieldCheck className="size-6" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                            Verifikasi & Kata Sandi Baru
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Masukkan 6 digit kode OTP yang dikirim ke WhatsApp{' '}
                            <span className="font-semibold text-foreground underline decoration-[var(--brand)]">
                                {no_whatsapp}
                            </span>
                            , lalu masukkan kata sandi baru Anda.
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

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor="kode_otp">Kode Verifikasi (6 Digit)</Label>
                            <Input
                                id="kode_otp"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                autoFocus
                                value={data.kode_otp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setData('kode_otp', val);
                                }}
                                placeholder="------"
                                className="h-13 text-center text-2xl tracking-[0.4em] font-mono font-bold rounded-xl bg-background border-border/80 focus:border-primary"
                                required
                                aria-invalid={!!errors.kode_otp}
                                aria-describedby={errors.kode_otp ? "otp-error" : undefined}
                            />
                            {errors.kode_otp && (
                                <p id="otp-error" role="alert" className="text-xs text-destructive">
                                    {errors.kode_otp}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor="password">Kata Sandi Baru</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="h-11 text-base pr-11"
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
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" role="alert" className="text-xs text-destructive">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi Baru</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    className="h-11 text-base pr-11"
                                    required
                                    autoComplete="new-password"
                                    aria-invalid={!!errors.password_confirmation}
                                    aria-describedby={errors.password_confirmation ? "password_confirmation-error" : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p id="password_confirmation-error" role="alert" className="text-xs text-destructive">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing || data.kode_otp.length !== 6 || !data.password || !data.password_confirmation}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-11 text-base font-semibold transition-all mt-2"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                        </Button>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                            <div>
                                Tidak menerima kode?{' '}
                                <button
                                    type="button"
                                    onClick={handleKirimUlang}
                                    disabled={cooldown > 0 || isResending}
                                    className={`font-semibold transition-colors ${
                                        cooldown > 0 || isResending
                                            ? 'text-muted-foreground/60 cursor-not-allowed'
                                            : 'text-[var(--brand)] hover:underline cursor-pointer'
                                    }`}
                                >
                                    {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim Ulang Kode'}
                                </button>
                            </div>

                            <Link
                                href="/lupa-password"
                                className="hover:text-foreground hover:underline transition-colors flex items-center gap-1"
                            >
                                <Smartphone className="size-3" />
                                <span>Ganti Nomor</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
