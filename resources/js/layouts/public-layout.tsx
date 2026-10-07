import { Head, usePage } from "@inertiajs/react";
import { ReactNode, useEffect, useRef } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
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
                "min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-[var(--brand)] selection:text-white",
                !showFooter && "h-dvh overflow-hidden",
                className
            )}
        >
            {title && <Head title={title} />}
            <SiteNavbar />
            <main
                className={cn(
                    "flex-1",
                    !showFooter && "flex flex-col min-h-0 overflow-hidden"
                )}
            >
                {children}
            </main>
            {showFooter && <SiteFooter />}
            <Toaster position="top-right" richColors />
        </div>
    );
}

