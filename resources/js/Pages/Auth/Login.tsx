import React, { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

    // Get search params for redirect query
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const redirectParam = urlParams.get('redirect') || '';

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        redirect: redirectParam,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="h-screen w-screen bg-background text-foreground flex overflow-hidden">
            {/* Left Panel - Image Section (hidden on small screens) */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-muted">
                {/* Back Button */}
                <div className="absolute top-6 left-6 z-10">
                    <Link
                        href="/"
                        className="w-10 h-10 bg-background/40 backdrop-blur-md border border-border/40 rounded-full flex items-center justify-center hover:bg-background/60 transition-all text-foreground"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>

                <div className="absolute bottom-12 left-12 right-12 z-10">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                        Bigi Badminton
                    </h2>
                    <p className="text-zinc-300 text-sm max-w-md">
                        Sistem Reservasi & Komunitas Open Mabar. Nikmati kemudahan mencari lawan tanding dan kelola jadwal main bareng secara terstruktur.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form Section */}
            <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 relative">
                {/* Mobile Back Button */}
                <div className="lg:hidden absolute top-6 left-6 z-10">
                    <Link
                        href="/"
                        className="w-10 h-10 bg-secondary/80 rounded-full flex items-center justify-center hover:bg-secondary transition-all text-foreground"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>

                <div className="w-full max-w-md space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
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

                    {/* Success Flash Notification */}
                    {flash?.success && (
                        <div className="p-3 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            {flash.success}
                        </div>
                    )}

                    {/* Error Flash / Validation general */}
                    {errors.email && (
                        <div className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                            {errors.email}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="hidden" name="redirect" value={data.redirect} />

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="nama@email.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Kata sandi</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi"
                                    className="pr-10"
                                    required
                                    autoComplete="current-password"
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
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-11 text-base font-semibold transition-all mt-2"
                        >
                            {processing ? 'Memproses...' : 'Masuk'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
