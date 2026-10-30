export function formatRupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
}

/**
 * Hitung tarif reservasi sewa lapangan berdasarkan durasi bermain dalam menit.
 * Aturan tarif resmi:
 * - 1 jam (60 menit) = Rp 60.000
 * - 2 jam (120 menit) = Rp 100.000
 * - Lebih dari 2 jam: floor(jam/2) * 100.000 + (jam mod 2) * 60.000
 *   (3 jam = 160.000, 4 jam = 200.000, 5 jam = 260.000, dst.)
 */
export function hitungTarifReservasi(durasiMenit: number): number {
    if (durasiMenit <= 0) return 0;
    const jam = Math.ceil(durasiMenit / 60);
    const paketDuaJam = Math.floor(jam / 2);
    const sisaSatuJam = jam % 2;
    return paketDuaJam * 100000 + sisaSatuJam * 60000;
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
