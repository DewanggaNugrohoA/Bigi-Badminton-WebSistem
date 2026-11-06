import React from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { KeyRound, ArrowLeft } from 'lucide-react';
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

export default function LupaPassword() {
    const { flash } = usePage<SharedProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        no_whatsapp: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/lupa-password');
    };

    return (
        <div className="min-h-dvh w-full bg-transparent text-foreground flex flex-col lg:flex-row overflow-x-hidden">
            <AuthImagePanel
                imageSrc="/images/login-panel.jpg"
                imageAlt="Lupa kata sandi Bigi Badminton"
                title="Lupa Kata Sandi"
                description="Jangan khawatir, masukkan nomor WhatsApp akun Anda. Kami akan mengirimkan kode verifikasi OTP untuk mengatur ulang kata sandi Anda."
                backHref="/login"
                backLabel="Kembali ke halaman masuk"
            />

            <div className="flex-1 w-full flex flex-col justify-center items-center bg-transparent px-5 sm:px-8 py-3 sm:py-6 lg:py-12 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden min-h-dvh lg:min-h-0 box-border pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-20 pointer-events-none" />

                <div className="w-full max-w-md my-auto flex flex-col space-y-4 sm:space-y-6 relative z-10">
                    <AuthMobileBanner
                        isCompact={true}
                        imageSrc="/images/panel-athletes-transparent.png"
                        imageAlt="Lupa kata sandi Bigi Badminton"
                        backHref="/login"
                        backLabel="Kembali ke masuk"
                    />

                    <div>
                        <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[var(--brand)] mb-4">
                            <KeyRound className="size-6" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                            Lupa Kata Sandi
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Masukkan nomor WhatsApp yang terdaftar pada akun Anda untuk menerima kode OTP verifikasi reset kata sandi.
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
                            <Label htmlFor="no_whatsapp">Nomor WhatsApp (No. HP)</Label>
                            <Input
                                id="no_whatsapp"
                                type="tel"
                                name="no_whatsapp"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={13}
                                autoFocus
                                value={data.no_whatsapp}
                                onChange={(e) => setData('no_whatsapp', formatIndonesianPhoneInput(e.target.value))}
                                onKeyDown={handlePhoneKeyDown}
                                placeholder="Contoh: 081234567890"
                                className="h-12 text-base"
                                required
                                autoComplete="tel"
                                aria-invalid={!!errors.no_whatsapp}
                                aria-describedby={errors.no_whatsapp ? "no_whatsapp-error" : undefined}
                            />
                            {errors.no_whatsapp && (
                                <p id="no_whatsapp-error" role="alert" className="text-xs text-destructive">
                                    {errors.no_whatsapp}
                                </p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Pastikan nomor WhatsApp aktif dan dapat menerima pesan.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing || !data.no_whatsapp}
                            className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 h-12 text-base font-semibold transition-all mt-2"
                        >
                            {processing ? 'Mengirim Kode OTP...' : 'Kirim Kode Verifikasi (OTP)'}
                        </Button>

                        <div className="text-center pt-2">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Sudah ingat kata sandi? Masuk di sini</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
