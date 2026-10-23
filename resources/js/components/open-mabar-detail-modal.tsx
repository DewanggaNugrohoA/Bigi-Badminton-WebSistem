import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import {
    OpenMabarDetailContent,
    type OpenMabarDetailContentProps,
} from "@/components/open-mabar-detail-content";
import { router } from "@inertiajs/react";

interface OpenMabarDetailModalProps {
    idMabar: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OpenMabarDetailModal({
    idMabar,
    open,
    onOpenChange,
}: OpenMabarDetailModalProps) {
    const [detailProps, setDetailProps] = useState<OpenMabarDetailContentProps | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDetail = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/open-mabar/${id}`, {
                headers: {
                    Accept: "text/html, application/xhtml+xml, application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });

            if (!res.ok) {
                if (res.status === 403) {
                    throw new Error("Anda tidak memiliki hak akses untuk melihat jadwal ini.");
                }
                if (res.status === 404) {
                    throw new Error("Jadwal mabar tidak ditemukan.");
                }
                throw new Error(`Gagal memuat detail jadwal (HTTP ${res.status}).`);
            }

            const text = await res.text();
            let props: any = null;

            // 1. Jika respons adalah JSON langsung
            const trimmed = text.trim();
            if (trimmed.startsWith("{")) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed?.props) {
                        props = parsed.props;
                    } else if (parsed?.mabar) {
                        props = parsed;
                    }
                } catch {
                    // Lanjut ke parser HTML jika gagal
                }
            }

            // 2. Jika respons adalah HTML halaman Inertia
            if (!props && typeof DOMParser !== "undefined") {
                try {
                    const doc = new DOMParser().parseFromString(text, "text/html");
                    // Format Inertia v2: <script data-page="app" type="application/json">{...}</script>
                    const scriptEl = doc.querySelector('script[data-page="app"], script[type="application/json"]');
                    if (scriptEl && scriptEl.textContent) {
                        const pageData = JSON.parse(scriptEl.textContent);
                        props = pageData?.props;
                    } else {
                        // Format Inertia v1: <div id="app" data-page="{...}"></div>
                        const divEl = doc.querySelector("#app[data-page]");
                        if (divEl) {
                            const attr = divEl.getAttribute("data-page");
                            if (attr) {
                                const pageData = JSON.parse(attr);
                                props = pageData?.props;
                            }
                        }
                    }
                } catch {
                    // Lanjut ke regex fallback jika DOMParser gagal
                }
            }

            // 3. Fallback regex jika DOMParser tidak tersedia
            if (!props) {
                const scriptMatch =
                    text.match(/<script\s+[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/i) ||
                    text.match(/<script\s+[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);

                if (scriptMatch) {
                    const pageData = JSON.parse(scriptMatch[1]);
                    props = pageData?.props;
                }
            }

            if (props?.mabar) {
                setDetailProps({
                    mabar: props.mabar,
                    pesertaCount: props.pesertaCount ?? 0,
                    isOwner: !!props.isOwner,
                    userStatus: props.userStatus ?? null,
                    canAccessChat: !!props.canAccessChat,
                    errors: props.errors,
                });
            } else {
                throw new Error("Format respons detail tidak valid.");
            }
        } catch (err: any) {
            console.error("Error loading detail:", err);
            setError(err.message || "Terjadi kesalahan saat memuat jadwal.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open && idMabar) {
            loadDetail(idMabar);
        } else if (!open) {
            setDetailProps(null);
            setError(null);
        }
    }, [open, idMabar, loadDetail]);

    const handleActionSuccess = () => {
        if (idMabar) {
            loadDetail(idMabar);
        }
        router.reload();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
                <DialogPrimitive.Popup
                    data-slot="dialog-content"
                    data-theme="user"
                    className="theme-user font-user fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] sm:max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl duration-200 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95 outline-none max-h-[90vh] overflow-y-auto overflow-x-hidden text-slate-900"
                >
                    <DialogTitle className="sr-only">
                        {detailProps?.mabar?.judul ?? "Detail Open Mabar"}
                    </DialogTitle>

                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-4 right-4 z-30 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                aria-label="Tutup"
                            />
                        }
                    >
                        <X className="size-4" />
                    </DialogPrimitive.Close>

                    <ErrorBoundary>
                        {loading && !detailProps && (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                                <Loader2 className="size-8 animate-spin text-blue-600" />
                                <p className="text-xs font-medium">Memuat detail jadwal mabar...</p>
                            </div>
                        )}

                        {error && !detailProps && (
                            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3 px-4">
                                <div className="size-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                                    <AlertCircle className="size-5" />
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{error}</p>
                                {idMabar && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => loadDetail(idMabar)}
                                        className="gap-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
                                    >
                                        <RefreshCw className="size-3.5" />
                                        <span>Coba Lagi</span>
                                    </Button>
                                )}
                            </div>
                        )}

                        {detailProps && (
                            <div className="relative pt-2">
                                {loading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-20 flex items-center justify-center rounded-xl">
                                        <Loader2 className="size-6 animate-spin text-blue-600" />
                                    </div>
                                )}
                                <OpenMabarDetailContent
                                    {...detailProps}
                                    isPopup={true}
                                    onActionSuccess={handleActionSuccess}
                                />
                            </div>
                        )}
                    </ErrorBoundary>
                </DialogPrimitive.Popup>
            </DialogPortal>
        </Dialog>
    );
}
