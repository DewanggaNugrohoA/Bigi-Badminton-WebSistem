import { Head, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, FileQuestion } from "lucide-react";

interface ErrorProps {
    status: number;
    auth?: {
        user?: {
            role?: "user" | "admin" | "kasir";
        } | null;
    };
}

export default function ErrorPage({ status, auth }: ErrorProps) {
    const role = auth?.user?.role;

    let backUrl = "/";
    let backLabel = "Kembali ke Beranda";

    if (role === "admin") {
        backUrl = "/admin";
        backLabel = "Kembali ke Panel Admin";
    } else if (role === "kasir") {
        backUrl = "/kasir";
        backLabel = "Kembali ke Panel Kasir";
    } else if (role === "user") {
        backUrl = "/open-mabar/saya";
        backLabel = "Kembali ke Jadwal Saya";
    }

    const title = {
        403: "Akses Ditolak",
        404: "Halaman Tidak Ditemukan",
        500: "Terjadi Kesalahan Server",
        503: "Layanan Sedang Pemeliharaan",
    }[status] || "Terjadi Kesalahan";

    const description = {
        403: "Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.",
        404: "Halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.",
        500: "Maaf, terjadi masalah pada server kami. Silakan coba beberapa saat lagi.",
        503: "Kami sedang melakukan pemeliharaan rutin. Silakan kembali lagi nanti.",
    }[status] || "Terjadi kesalahan yang tidak terduga.";

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative isolate selection:bg-[var(--brand)] selection:text-white">
            <Head title={`${status} - ${title}`} />

            <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full bg-[var(--brand)]/10 blur-[100px] pointer-events-none" />
            </div>

            <div className="max-w-md w-full text-center space-y-6">
                <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-card border border-border shadow-sm text-[var(--brand)]">
                    {status === 403 ? (
                        <ShieldAlert className="size-10 text-rose-600" />
                    ) : (
                        <FileQuestion className="size-10 text-[var(--brand)]" />
                    )}
                </div>

                <div className="space-y-2">
                    <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                        Galat {status}
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href={backUrl}>
                        <Button className="gap-2 bg-[var(--brand)] hover:opacity-90 px-6 h-11 text-sm font-semibold w-full sm:w-auto">
                            <ArrowLeft className="size-4" />
                            <span>{backLabel}</span>
                        </Button>
                    </Link>
                    {role === "user" && (
                        <Link href="/">
                            <Button variant="outline" className="h-11 px-6 text-sm font-semibold w-full sm:w-auto">
                                Beranda
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
