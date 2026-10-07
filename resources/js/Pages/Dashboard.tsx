import PublicLayout from "@/layouts/public-layout";
import { Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Clock,
    Users,
    CheckCircle2,
    XCircle,
    Hourglass,
    Trophy,
    MapPin,
    ArrowRight,
    PlusCircle,
    List,
    ExternalLink,
    ShieldCheck,
} from "lucide-react";
import { buildWaLink } from "@/lib/content";

/* ---------- Types ---------- */
interface UserInfo {
    id_user: number;
    nama: string;
    email: string;
    no_whatsapp: string;
    role: string;
    jenis_pelanggan: "member" | "reguler";
    status_member: "aktif" | "tidak_aktif";
    tanggal_mulai_member: string | null;
    tanggal_akhir_member: string | null;
}

interface MabarStats {
    menunggu: number;
    disetujui: number;
    ditolak: number;
    diikuti: number;
}

interface PembayaranItem {
    id_pembayaran: number;
    jenis_pembayaran: "DP" | "Lunas";
    jumlah: number;
    metode_pembayaran: string;
    status_pembayaran: "menunggu" | "terkonfirmasi";
    tanggal_pembayaran: string;
}

interface DetailReservasiItem {
    id_detail_reservasi: number;
    tanggal_main: string;
    jam_mulai: string;
    jam_selesai: string;
    durasi: number;
    subtotal: number;
    lapangan?: {
        id_lapangan: number;
        nama_lapangan: string;
    };
}

interface ReservasiItem {
    id_reservasi: number;
    tanggal_pemesanan: string;
    total_biaya: number;
    status_reservasi: "terkonfirmasi" | "selesai" | "batal";
    detail_reservasi: DetailReservasiItem[];
    pembayaran: PembayaranItem[];
}

interface MabarDiikutiItem {
    id_mabar: number;
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    gender: "putra" | "putri" | "campuran";
    kuota: number;
    foto: string | null;
    peserta_terdaftar_count: number;
    lapangan?: { nama_lapangan: string } | null;
    user?: { nama: string };
}

interface DashboardProps {
    user: UserInfo;
    mabarStats: MabarStats;
    reservasiSaya: ReservasiItem[];
    mabarDiikuti: MabarDiikutiItem[];
}

/* ---------- Helpers ---------- */
function formatTanggal(dateStr: string) {
    try {
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(new Date(dateStr + "T00:00:00"));
    } catch {
        return dateStr;
    }
}

function formatJam(t: string) {
    return t ? t.substring(0, 5) : "";
}

function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function ReservasiStatusBadge({ status }: { status: ReservasiItem["status_reservasi"] }) {
    const map = {
        terkonfirmasi: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        selesai: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
        batal: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    } as const;
    const label = { terkonfirmasi: "Terkonfirmasi", selesai: "Selesai", batal: "Batal" } as const;
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status]}`}>
            {label[status]}
        </span>
    );
}

function PembayaranBadge({ pembayaran }: { pembayaran: PembayaranItem[] }) {
    if (!pembayaran || pembayaran.length === 0)
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/20">Belum Bayar</span>;
    const last = pembayaran[pembayaran.length - 1];
    const isLunas = pembayaran.some((p) => p.jenis_pembayaran === "Lunas" && p.status_pembayaran === "terkonfirmasi");
    const isDP = !isLunas && pembayaran.some((p) => p.jenis_pembayaran === "DP" && p.status_pembayaran === "terkonfirmasi");
    if (isLunas) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Lunas</span>;
    if (isDP) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20">DP</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/20">Menunggu Konfirmasi</span>;
}

/* ---------- Page ---------- */
export default function Dashboard({ user, mabarStats, reservasiSaya, mabarDiikuti }: DashboardProps) {
    const { config } = usePage<{ config?: { wa_admin_number?: string } }>().props;
    const waLink = buildWaLink(config?.wa_admin_number);
    const isMember = user.jenis_pelanggan === "member" && user.status_member === "aktif";

    return (
        <PublicLayout title="Dashboard - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">

                {/* ── Sapaan & Kartu Member ── */}
                <section aria-label="Informasi pengguna">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground">Selamat datang kembali,</p>
                            <h1 className="text-3xl font-extrabold tracking-tight truncate">{user.nama}</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                        </div>

                        {/* Kartu status member — hanya untuk member aktif */}
                        {isMember && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 shrink-0">
                                <ShieldCheck className="size-5 text-[var(--brand)] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[var(--brand)]">Member Aktif</p>
                                    {user.tanggal_akhir_member && (
                                        <p className="text-xs text-muted-foreground">
                                            s.d. {formatTanggal(user.tanggal_akhir_member)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Badge reguler */}
                        {!isMember && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card shrink-0">
                                <Users className="size-5 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-foreground capitalize">{user.jenis_pelanggan}</p>
                                    <p className="text-xs text-muted-foreground">Tipe pelanggan</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Ringkasan Statistik ── */}
                <section aria-label="Statistik mabar">
                    <h2 className="text-lg font-bold mb-4">Ringkasan Mabar</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard
                            label="Menunggu"
                            value={mabarStats.menunggu}
                            icon={<Hourglass className="size-5 text-amber-400" />}
                            colorClass="border-amber-500/20 bg-amber-500/5"
                        />
                        <StatCard
                            label="Disetujui"
                            value={mabarStats.disetujui}
                            icon={<CheckCircle2 className="size-5 text-emerald-400" />}
                            colorClass="border-emerald-500/20 bg-emerald-500/5"
                        />
                        <StatCard
                            label="Ditolak"
                            value={mabarStats.ditolak}
                            icon={<XCircle className="size-5 text-rose-400" />}
                            colorClass="border-rose-500/20 bg-rose-500/5"
                        />
                        <StatCard
                            label="Mabar Diikuti"
                            value={mabarStats.diikuti}
                            icon={<Trophy className="size-5 text-[var(--brand)]" />}
                            colorClass="border-[var(--brand)]/20 bg-[var(--brand)]/5"
                        />
                    </div>

                    {/* Tautan cepat */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Link href="/open-mabar">
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 min-h-[44px] sm:min-h-0">
                                <Calendar className="size-3.5" />
                                Cari Jadwal
                            </Button>
                        </Link>
                        <Link href="/open-mabar/create">
                            <Button size="sm" className="gap-1.5 text-xs bg-[var(--brand)] hover:opacity-90 h-9 min-h-[44px] sm:min-h-0">
                                <PlusCircle className="size-3.5" />
                                Buat Jadwal
                            </Button>
                        </Link>
                        <Link href="/open-mabar/saya">
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 min-h-[44px] sm:min-h-0">
                                <List className="size-3.5" />
                                Jadwal Saya
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* ── Reservasi Saya ── */}
                <section aria-label="Reservasi saya">
                    <h2 className="text-lg font-bold mb-4">Reservasi Saya</h2>

                    {reservasiSaya.length === 0 ? (
                        <div className="border border-dashed border-border/80 rounded-2xl p-10 text-center bg-card/40">
                            <Calendar className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                            <h3 className="text-base font-semibold text-foreground">Belum ada reservasi</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                                Reservasi dilakukan lewat WhatsApp admin. Hubungi kami untuk memesan lapangan.
                            </p>
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-4">
                                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                                    <ExternalLink className="size-4" />
                                    Reservasi via WA
                                </Button>
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reservasiSaya.map((res) => {
                                const detail = res.detail_reservasi[0];
                                return (
                                    <div
                                        key={res.id_reservasi}
                                        className="bg-card border border-border/60 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <ReservasiStatusBadge status={res.status_reservasi} />
                                                <PembayaranBadge pembayaran={res.pembayaran} />
                                            </div>
                                            {detail ? (
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    {detail.lapangan && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="size-3.5 shrink-0" />
                                                            {detail.lapangan.nama_lapangan}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-3.5 shrink-0" />
                                                        {formatTanggal(detail.tanggal_main)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="size-3.5 shrink-0" />
                                                        {formatJam(detail.jam_mulai)} – {formatJam(detail.jam_selesai)} WIB
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Dipesan: {formatTanggal(res.tanggal_pemesanan)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-muted-foreground">Total</p>
                                            <p className="font-bold text-foreground">{formatRupiah(res.total_biaya)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── Mabar Mendatang yang Diikuti ── */}
                <section aria-label="Mabar mendatang yang diikuti">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Mabar Mendatang yang Diikuti</h2>
                        <Link href="/open-mabar" className="text-xs text-[var(--brand)] hover:underline flex items-center gap-1">
                            Cari jadwal lain
                            <ArrowRight className="size-3" />
                        </Link>
                    </div>

                    {mabarDiikuti.length === 0 ? (
                        <div className="border border-dashed border-border/80 rounded-2xl p-10 text-center bg-card/40">
                            <Users className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                            <h3 className="text-base font-semibold text-foreground">Belum ada mabar mendatang</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                                Bergabunglah dengan jadwal mabar yang sudah disetujui.
                            </p>
                            <Link href="/open-mabar" className="inline-block mt-4">
                                <Button className="gap-2 bg-[var(--brand)] hover:opacity-90 min-h-[44px]">
                                    <Calendar className="size-4" />
                                    Cari Jadwal Mabar
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mabarDiikuti.map((mabar) => (
                                <div
                                    key={mabar.id_mabar}
                                    className="bg-card border border-border/60 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5">
                                        <h3 className="font-semibold text-foreground line-clamp-1">{mabar.judul}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3.5 shrink-0" />
                                                {formatTanggal(mabar.tanggal)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3.5 shrink-0" />
                                                {formatJam(mabar.jam_mulai)} – {formatJam(mabar.jam_selesai)} WIB
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3.5 shrink-0" />
                                                {mabar.peserta_terdaftar_count}/{mabar.kuota} peserta
                                            </span>
                                            {mabar.lapangan && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="size-3.5 shrink-0" />
                                                    {mabar.lapangan.nama_lapangan}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/open-mabar/${mabar.id_mabar}`} className="shrink-0">
                                        <Button variant="outline" size="sm" className="gap-1.5 text-xs min-h-[44px] sm:min-h-0">
                                            Detail
                                            <ArrowRight className="size-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </PublicLayout>
    );
}

/* ── StatCard Sub-component ── */
function StatCard({
    label,
    value,
    icon,
    colorClass,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
}) {
    return (
        <div className={`rounded-xl border p-4 flex flex-col gap-2 ${colorClass}`}>
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                {icon}
            </div>
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
        </div>
    );
}
