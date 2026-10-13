import React, { useState, useEffect } from 'react';
import { useForm, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <div className="min-h-dvh w-screen bg-background text-foreground flex overflow-y-auto">
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-muted">
                <div className="absolute top-6 left-6 z-10">
                    <Link
                        href="/register"
                        aria-label="Kembali ke pendaftaran"
                        className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center hover:bg-white/40 transition-all text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>

                <div className="absolute inset-0">
                    <img
                        src="/images/login-bg.jpg"
                        alt="Bigi Badminton Arena"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                </div>

                <div className="absolute bottom-12 left-12 right-12 z-10">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                        Verifikasi Akun
                    </h2>
                    <p className="text-zinc-200 text-sm max-w-md">
                        Satu langkah lagi untuk bergabung bersama komunitas pemain Bigi Badminton. Pastikan nomor WhatsApp Anda aktif.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 relative">
                <div className="lg:hidden absolute top-6 left-6 z-10">
                    <Link
                        href="/register"
                        aria-label="Kembali ke pendaftaran"
                        className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/80 transition-all text-foreground"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>

                <div className="w-full max-w-md space-y-6">
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
