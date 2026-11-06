import React, { useState, useEffect } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WakeGlyph } from '@/components/ui/background-ascii-wake';
import { AuthImagePanel, AuthMobileBanner } from '@/components/auth-image-panel';
import { PageProps } from '@inertiajs/core';

interface SharedProps extends PageProps {
    flash?: {
        success?: string;
        error?: string;
    };
    errors: Record<string, string>;
    [key: string]: unknown;
}

export default function StaffLogin() {
    const { flash } = usePage<SharedProps>().props;
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        if (errors.email) {
            const match = errors.email.match(/(\d+)\s*detik/);
            if (match) {
                setCountdown(parseInt(match[1], 10));
            }
        }
    }, [errors.email]);

    useEffect(() => {
        if (countdown === null || countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const getEmailErrorMessage = () => {
        if (!errors.email) return null;
        if (countdown !== null && countdown > 0) {
            return `Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam ${countdown} detik.`;
        }
        if (countdown === 0) {
            return 'Waktu tunggu telah berakhir. Anda dapat mencoba masuk kembali.';
        }
        return errors.email;
    };

    const isLockedOut = countdown !== null && countdown > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLockedOut) return;
        post('/staff/login', {
            preserveScroll: true,
            onFinish: () => {
                setData('password', '');
            },
        });
    };

    return (
        <div className="min-h-dvh w-full bg-background text-foreground flex flex-col lg:flex-row overflow-x-hidden">
            <AuthImagePanel
                imageSrc="/images/login-panel.jpg"
                imageAlt="Suasana lapangan Bigi Badminton Arena"
                title="Portal Staf Bigi Badminton"
                description="Masuk untuk mengakses sistem operasional GOR."
            />

            <div className="flex-1 w-full flex flex-col justify-center items-center bg-transparent px-5 sm:px-8 py-3 sm:py-6 lg:py-12 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden min-h-dvh lg:min-h-0 box-border pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-20 pointer-events-none" />

                <div className="w-full max-w-md my-auto flex flex-col space-y-3 sm:space-y-4 lg:space-y-6 relative z-10">
                    <AuthMobileBanner
                        imageSrc="/images/panel-athletes-transparent.png"
                        imageAlt="Suasana lapangan Bigi Badminton Arena"
                    />

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">
                            Portal Staf Internal
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Masuk untuk mengakses sistem operasional GOR
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
                        <div className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor="staff_email">Alamat Email Staf</Label>
                            <Input
                                id="staff_email"
                                type="email"
                                name="email"
                                autoComplete="username"
                                placeholder="nama@domain"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                className="h-12 text-base"
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? "staff_email-error" : undefined}
                            />
                            {errors.email && (
                                <p id="staff_email-error" role="alert" className="text-xs text-destructive">
                                    {getEmailErrorMessage()}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor="staff_password">Kata Sandi</Label>
                            <div className="relative">
                                <Input
                                    id="staff_password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    className="h-12 text-base pr-11"
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? "staff_password-error" : undefined}
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
                                <p id="staff_password-error" role="alert" className="text-xs text-destructive">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                            <input
                                id="staff_remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="size-4 rounded border-border text-[var(--brand)] focus:ring-ring cursor-pointer"
                            />
                            <Label htmlFor="staff_remember" className="text-xs sm:text-sm text-muted-foreground cursor-pointer select-none">
                                Ingat saya di perangkat ini
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing || isLockedOut}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-12 text-base font-semibold transition-all mt-2"
                        >
                            {processing ? 'Memverifikasi Kredensial...' : isLockedOut ? `Terkunci (${countdown}s)` : 'Masuk ke Portal Staf'}
                        </Button>
                    </form>

                    <p className="text-sm text-muted-foreground text-center">
                        Bukan staf?{' '}
                        <Link
                            href="/login"
                            className="text-[var(--brand)] hover:underline font-semibold"
                        >
                            Masuk sebagai pelanggan
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
