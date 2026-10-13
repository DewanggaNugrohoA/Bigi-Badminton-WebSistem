import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/material-design-3-button";
import { Construction, ArrowLeft } from "lucide-react";

interface PlaceholderProps {
    title: string;
    description?: string;
    breadcrumbParent?: string;
}

export default function AdminPlaceholder({
    title,
    description = "Fitur ini sedang dalam antrean pengerjaan dan akan segera tersedia pada fase berikutnya.",
    breadcrumbParent = "Operasional",
}: PlaceholderProps) {
    return (
        <AdminLayout
            title={title}
            breadcrumb={[
                { label: breadcrumbParent },
                { label: title },
            ]}
        >
            <Head title={`${title} - Admin`} />

            <div className="max-w-3xl mx-auto py-12 px-2">
                <Card className="text-center p-8 sm:p-12 border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center p-0">
                        <div className="size-16 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mb-6 ring-8 ring-[var(--brand)]/5">
                            <Construction className="size-8" />
                        </div>

                        <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                            Fase Pengembangan
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3 font-heading">
                            Modul {title} Segera Hadir
                        </h2>

                        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-8">
                            {description}
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/admin"
                                className={buttonVariants({ variant: "outline", size: "default" })}
                            >
                                <ArrowLeft className="size-4" />
                                <span>Kembali ke Dashboard</span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
