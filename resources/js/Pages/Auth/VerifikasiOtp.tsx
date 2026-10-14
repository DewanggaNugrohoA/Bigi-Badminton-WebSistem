import React, { useState, useEffect } from 'react';
import { useForm, Link, router, usePage } from '@inertiajs/react';
import { KeyRound, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WakeGlyph } from '@/components/ui/background-ascii-wake';
import { AuthImagePanel, AuthMobileBanner } from '@/components/auth-image-panel';

interface VerifikasiOtpProps {
    no_whatsapp: string;
}

interface SharedProps {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: any;
}

export default function VerifikasiOtp({ no_whatsapp }: VerifikasiOtpProps) {
    const { flash } = usePage<SharedProps>().props;
    const [cooldown, setCooldown] = useState(60);
    const [isResending, setIsResending] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        no_whatsapp: no_whatsapp || '',
        kode_otp: '',
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
        post('/register/verifikasi');
    };

    const handleKirimUlang = () => {
        if (cooldown > 0 || isResending) return;
        setIsResending(true);
        router.post(
            '/register/kirim-ulang-otp',
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
        <div className="min-h-dvh w-full bg-background text-foreground flex flex-col lg:flex-row overflow-x-hidden">
            <AuthImagePanel
                imageSrc="/images/login-panel.jpg"
                imageAlt="Verifikasi akun Bigi Badminton"
                title="Verifikasi Akun"
                description="Satu langkah lagi untuk bergabung bersama komunitas pemain Bigi Badminton. Pastikan nomor WhatsApp Anda aktif."
                backHref="/register"
                backLabel="Kembali ke pendaftaran"
            />

            <div className="flex-1 w-full flex flex-col justify-center items-center bg-background px-5 sm:px-8 py-3 sm:py-6 lg:py-12 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden min-h-dvh lg:min-h-0 box-border pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-20 pointer-events-none" />

                <div className="w-full max-w-md my-auto flex flex-col space-y-4 sm:space-y-6 relative z-10">
                    <AuthMobileBanner
                        isCompact={true}
                        imageSrc="/images/panel-athletes-transparent.png"
                        imageAlt="Verifikasi akun Bigi Badminton"
                        backHref="/register"
                        backLabel="Kembali ke pendaftaran"
                    />
                    <div>
                        <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[var(--brand)] mb-4">
                            <KeyRound className="size-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            Verifikasi Kode OTP
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Masukkan 6 digit kode yang dikirim ke nomor WhatsApp{' '}
                            <span className="font-semibold text-foreground underline decoration-[var(--brand)]">
                                {no_whatsapp}
                            </span>
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

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div className="space-y-2">
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
                                className="h-14 text-center text-2xl tracking-[0.4em] font-mono font-bold rounded-xl bg-background border-border/80 focus:border-primary"
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

                        <Button
                            type="submit"
                            disabled={processing || data.kode_otp.length !== 6}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-11 text-base font-semibold transition-all"
                        >
                            {processing ? 'Memverifikasi...' : 'Verifikasi Sekarang'}
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
                                href="/register"
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
