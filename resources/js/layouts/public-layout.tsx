import { Head } from "@inertiajs/react";
import { ReactNode } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
    children: ReactNode;
    title?: string;
    showFooter?: boolean;
    className?: string;
}

export default function PublicLayout({
    children,
    title,
    showFooter = true,
    className,
}: PublicLayoutProps) {
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
        </div>
    );
}
