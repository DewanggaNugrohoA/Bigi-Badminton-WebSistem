import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        email: '',
        no_whatsapp: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-screen w-screen bg-background text-foreground flex overflow-y-auto">
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
                        Gabung Komunitas Bigi
                    </h2>
                    <p className="text-zinc-300 text-sm max-w-md">
                        Daftar akun sekarang untuk mengikuti event Open Mabar, membuat jadwal main bareng, dan berdiskusi di forum chat mabar.
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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nama */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input
                                id="nama"
                                type="text"
                                name="nama"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Nama lengkap Anda"
                                required
                                autoComplete="name"
                            />
                            {errors.nama && (
                                <p className="text-xs text-destructive">{errors.nama}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
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
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email}</p>
                            )}
                        </div>

                        {/* No WhatsApp */}
                        <div className="space-y-1.5">
                            <Label htmlFor="no_whatsapp">Nomor WhatsApp</Label>
                            <Input
                                id="no_whatsapp"
                                type="tel"
                                name="no_whatsapp"
                                value={data.no_whatsapp}
                                onChange={(e) => setData('no_whatsapp', e.target.value)}
                                placeholder="Contoh: 081234567890"
                                required
                                autoComplete="tel"
                            />
                            {errors.no_whatsapp && (
                                <p className="text-xs text-destructive">{errors.no_whatsapp}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Kata sandi</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="pr-10"
                                    required
                                    autoComplete="new-password"
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

                        {/* Konfirmasi Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password_confirmation">Konfirmasi Kata sandi</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi"
                                    className="pr-10"
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

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-11 text-base font-semibold transition-all mt-3"
                        >
                            {processing ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
