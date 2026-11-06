import { Head, usePage } from "@inertiajs/react";
import { ReactNode, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
    const { url } = usePage();
    const prefersReducedMotion = useReducedMotion();
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
                "min-h-screen flex flex-col bg-transparent text-foreground antialiased selection:bg-[var(--brand)] selection:text-white relative isolate overflow-x-hidden",
                !showFooter && "h-dvh overflow-hidden",
                className
            )}
        >
            
            <div className="fixed inset-0 -z-10 h-full w-full pointer-events-none overflow-hidden select-none">
                <WakeGlyph cellSize={14} className="absolute inset-0 opacity-10" />
                <div className="absolute inset-0 [background-image:radial-gradient(rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_60%,transparent_100%)] opacity-50" />
            </div>

            {title && <Head title={title} />}
            <SiteNavbar />
            <motion.main
                key={url ? url.split("?")[0] : "page"}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "flex-1 relative z-0",
                    !showFooter && "flex flex-col min-h-0 overflow-hidden"
                )}
            >
                {children}
            </motion.main>
            {showFooter && <SiteFooter />}
            <FloatingChat />
            <Toaster position="top-right" richColors />
        </div>
    );
}
