import { Head, usePage } from "@inertiajs/react";
import { ReactNode, useEffect, useRef } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { FloatingChat } from "@/components/floating-chat";
import { WakeGlyph } from "@/components/ui/background-ascii-wake";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
    children: ReactNode;
    title?: string;
    showFooter?: boolean;
    className?: string;
}

interface SharedProps {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: any;
}

export default function PublicLayout({
    children,
    title,
    showFooter = true,
    className,
}: PublicLayoutProps) {
    const { flash } = usePage<SharedProps>().props;
    const lastFlash = useRef<{ success?: string | null; error?: string | null }>({});

    useEffect(() => {
        if (flash?.success && flash.success !== lastFlash.current.success) {
            toast.success(flash.success);
            lastFlash.current.success = flash.success;
        }
        if (flash?.error && flash.error !== lastFlash.current.error) {
            toast.error(flash.error);
            lastFlash.current.error = flash.error;
        }
    }, [flash]);

    return (
        <div
            className={cn(
                "min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-[var(--brand)] selection:text-white relative isolate overflow-x-hidden",
                !showFooter && "h-dvh overflow-hidden",
                className
            )}
        >
            
            <div className="fixed inset-0 -z-10 h-full w-full pointer-events-none overflow-hidden select-none">
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-20" />
                <div className="absolute inset-0 [background-image:radial-gradient(rgba(100,116,139,0.18)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_60%,transparent_100%)] opacity-75" />
                <div className="absolute -top-24 left-1/4 w-[540px] h-[340px] bg-[var(--brand)]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-48 right-1/4 w-[440px] h-[280px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
            </div>

            {title && <Head title={title} />}
            <SiteNavbar />
            <main
                className={cn(
                    "flex-1 relative z-0",
                    !showFooter && "flex flex-col min-h-0 overflow-hidden"
                )}
            >
                {children}
            </main>
            {showFooter && <SiteFooter />}
            <FloatingChat />
            <Toaster position="top-right" richColors />
        </div>
    );
}
