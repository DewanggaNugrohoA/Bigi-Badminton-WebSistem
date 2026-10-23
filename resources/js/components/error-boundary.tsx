import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackUrl?: string;
    fallbackLabel?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            const fallbackUrl = this.props.fallbackUrl ?? "/open-mabar/saya";
            const fallbackLabel = this.props.fallbackLabel ?? "Kembali ke Jadwal Saya";

            return (
                <div className="pt-28 pb-16 px-4 sm:px-6 max-w-xl mx-auto text-center space-y-4">
                    <div className="size-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                        <AlertTriangle className="size-6" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                        Terjadi kesalahan saat memuat halaman. Muat ulang atau kembali ke Jadwal Saya.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="gap-2"
                        >
                            <RefreshCw className="size-3.5" />
                            <span>Muat Ulang</span>
                        </Button>
                        <Link href={fallbackUrl}>
                            <Button size="sm" className="gap-2 bg-[var(--brand)] hover:opacity-90 text-white">
                                <ArrowLeft className="size-3.5" />
                                <span>{fallbackLabel}</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
