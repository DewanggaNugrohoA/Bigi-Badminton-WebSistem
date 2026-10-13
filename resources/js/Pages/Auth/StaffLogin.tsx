import React, { useState, useEffect } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-center items-center px-4 py-8 relative">
            <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-lg relative z-10">
                <div className="flex flex-col items-center text-center mb-6">
                    <img
                        src="/images/logo-sm.png"
                        alt="Logo Bigi Badminton"
                        width={48}
                        height={48}
                        className="size-12 object-contain rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/15 mb-3"
                    />
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-heading">
                        Portal Staf Internal
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Masuk untuk mengakses sistem operasional GOR
                    </p>
                </div>

                
                {flash?.success && (
                    <div className="p-3 text-xs sm:text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mb-4">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="p-3 text-xs sm:text-sm rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
                        <ShieldAlert className="size-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    
                    <div className="space-y-1.5">
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
                            className="h-11 text-sm"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "staff_email-error" : undefined}
                        />
                        {errors.email && (
                            <p id="staff_email-error" role="alert" className="text-xs text-destructive font-medium">
                                {getEmailErrorMessage()}
                            </p>
                        )}
                    </div>

                    
                    <div className="space-y-1.5">
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
                                className="h-11 text-sm pr-10"
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? "staff_password-error" : undefined}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p id="staff_password-error" role="alert" className="text-xs text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            id="staff_remember"
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="size-4 rounded border-border text-[var(--brand)] focus:ring-ring cursor-pointer"
                        />
                        <Label htmlFor="staff_remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                            Ingat saya di perangkat ini
                        </Label>
                    </div>

                    
                    <Button
                        type="submit"
                        disabled={processing || isLockedOut}
                        className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-11 text-sm font-semibold transition-all mt-2"
                    >
                        {processing ? 'Memverifikasi Kredensial...' : isLockedOut ? `Terkunci (${countdown}s)` : 'Masuk ke Portal Staf'}
                    </Button>
                </form>

                
                <div className="pt-6 mt-6 border-t border-border/60 text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Masuk sebagai pelanggan</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
