export function formatRupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
}

export function formatTanggal(dateStr: string): string {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(d);
    } catch {
        return dateStr;
    }
}

export function formatTanggalRingkas(dateStr: string): string {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(d);
    } catch {
        return dateStr;
    }
}

export function formatJam(timeStr: string): string {
    if (!timeStr) return "-";
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
}

export type StatusBadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export const STATUS_RESERVASI_MAP: Record<string, { label: string; variant: StatusBadgeVariant }> = {
    terkonfirmasi: { label: "Terkonfirmasi", variant: "success" },
    selesai: { label: "Selesai", variant: "neutral" },
    batal: { label: "Batal", variant: "danger" },
};

export const STATUS_PEMBAYARAN_MAP: Record<string, { label: string; variant: StatusBadgeVariant }> = {
    Lunas: { label: "Lunas", variant: "success" },
    DP: { label: "DP", variant: "warning" },
};
