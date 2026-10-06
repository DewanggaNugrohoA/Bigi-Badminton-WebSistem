import { Head } from "@inertiajs/react";
import { ReactNode } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";

interface PublicLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-[var(--brand)] selection:text-white">
            {title && <Head title={title} />}
            <SiteNavbar />
            <main className="flex-1">
                {children}
            </main>
            <SiteFooter />
        </div>
    );
}
