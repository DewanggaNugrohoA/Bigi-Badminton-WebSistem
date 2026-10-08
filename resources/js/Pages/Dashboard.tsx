import PublicLayout from "@/layouts/public-layout";
import { Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
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
    Phone,
    Mail,
    Sparkles,
} from "lucide-react";
import { buildWaLink } from "@/lib/content";

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
        terkonfirmasi: "bg-emerald-50 text-emerald-700 border-emerald-200",
        selesai: "bg-slate-100 text-slate-700 border-slate-200",
        batal: "bg-rose-50 text-rose-700 border-rose-200",
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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">Belum Bayar</span>;
    const isLunas = pembayaran.some((p) => p.jenis_pembayaran === "Lunas" && p.status_pembayaran === "terkonfirmasi");
    const isDP = !isLunas && pembayaran.some((p) => p.jenis_pembayaran === "DP" && p.status_pembayaran === "terkonfirmasi");
    if (isLunas) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Lunas</span>;
    if (isDP) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">DP</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">Menunggu Konfirmasi</span>;
}

export default function Dashboard({ user, mabarStats, reservasiSaya, mabarDiikuti }: DashboardProps) {
    const { config } = usePage<{ config?: { wa_admin_number?: string } }>().props;
    const waLink = buildWaLink(config?.wa_admin_number);
    const isMember = user.jenis_pelanggan === "member" && user.status_member === "aktif";
    const prefersReducedMotion = useReducedMotion();

    const getInitial = (name: string) => {
        return name ? name.trim().charAt(0).toUpperCase() : "U";
    };

    return (
        <PublicLayout title="Dashboard - Bigi Badminton">
            <div className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
                {/* User Welcome Card Banner (Left-aligned & Animating) */}
                <motion.section
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    aria-label="Informasi pengguna"
                    className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-left">
                        <div className="flex items-start sm:items-center gap-4 text-left">
                            {/* Avatar Initial Badge */}
                            <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-purple-600 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-xs">
                                {getInitial(user.nama)}
                            </div>

                            <div className="min-w-0 text-left space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Selamat datang kembali,
                                    </span>
                                    {isMember ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
                                            <ShieldCheck className="size-3" />
                                            Member Aktif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                                            Pelanggan Reguler
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">
                                    {user.nama}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                                    {user.email && (
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="size-3.5 text-muted-foreground/70" />
                                            {user.email}
                                        </span>
                                    )}
                                    {user.no_whatsapp && (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="size-3.5 text-muted-foreground/70" />
                                            {user.no_whatsapp}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Card on Right or Top on Mobile */}
                        {isMember && user.tanggal_akhir_member && (
                            <div className="shrink-0 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-3.5 text-left">
                                <p className="text-xs font-semibold text-[var(--brand)]">Masa Aktif Member</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Berlaku s.d. <span className="font-medium text-foreground">{formatTanggal(user.tanggal_akhir_member)}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Ringkasan Mabar & Quick Actions */}
                <section aria-label="Statistik mabar" className="text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 text-left">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Ringkasan Mabar</h2>
                            <p className="text-xs text-muted-foreground">Statistik pengajuan & keikutsertaan open mabar Anda</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard
                            label="Menunggu"
                            value={mabarStats.menunggu}
                            icon={<Hourglass className="size-4 text-amber-600" />}
                            colorClass="border-border/80 hover:border-amber-300"
                            delay={0.05}
                        />
                        <StatCard
                            label="Disetujui"
                            value={mabarStats.disetujui}
                            icon={<CheckCircle2 className="size-4 text-emerald-600" />}
                            colorClass="border-border/80 hover:border-emerald-300"
                            delay={0.1}
                        />
                        <StatCard
                            label="Ditolak"
                            value={mabarStats.ditolak}
                            icon={<XCircle className="size-4 text-rose-600" />}
                            colorClass="border-border/80 hover:border-rose-300"
                            delay={0.15}
                        />
                        <StatCard
                            label="Mabar Diikuti"
                            value={mabarStats.diikuti}
                            icon={<Trophy className="size-4 text-[var(--brand)]" />}
                            colorClass="border-border/80 hover:border-[var(--brand)]/40"
                            delay={0.2}
                        />
                    </div>

                    {/* Tautan cepat */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-5">
                        <Link href="/open-mabar">
                            <Button variant="outline" size="sm" className="gap-2 text-xs h-10 px-4 font-semibold hover:border-[var(--brand)]/40">
                                <Calendar className="size-3.5 text-[var(--brand)]" />
                                Cari Jadwal
                            </Button>
                        </Link>
                        <Link href="/open-mabar/create">
                            <Button size="sm" className="gap-2 text-xs bg-[var(--brand)] hover:opacity-90 text-white h-10 px-4 font-semibold shadow-xs">
                                <PlusCircle className="size-3.5" />
                                Buat Jadwal Baru
                            </Button>
                        </Link>
                        <Link href="/open-mabar/saya">
                            <Button variant="outline" size="sm" className="gap-2 text-xs h-10 px-4 font-semibold">
                                <List className="size-3.5" />
                                Jadwal Saya
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Reservasi Saya (Strictly Left-aligned) */}
                <section aria-label="Reservasi saya" className="text-left">
                    <div className="flex items-center justify-between gap-3 mb-4 text-left">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Reservasi Saya</h2>
                            <p className="text-xs text-muted-foreground">Riwayat pemesanan lapangan badminton</p>
                        </div>
                    </div>

                    {reservasiSaya.length === 0 ? (
                        <div className="border border-dashed border-border/80 rounded-2xl p-6 sm:p-8 text-left bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
                            <div className="flex items-start gap-4 text-left">
                                <div className="size-12 rounded-xl bg-muted/70 border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground">
                                    <Calendar className="size-6" />
                                </div>
                                <div className="space-y-1 text-left">
                                    <h3 className="text-base font-semibold text-foreground">Belum Ada Reservasi</h3>
                                    <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                                        Reservasi sewa lapangan dilakukan melalui WhatsApp Admin. Hubungi kami untuk memilih jadwal dan mengamankan slot lapangan Anda.
                                    </p>
                                </div>
                            </div>
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="shrink-0 w-full sm:w-auto">
                                <Button className="w-full sm:w-auto h-10 px-5 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs font-semibold">
                                    <ExternalLink className="size-4" />
                                    <span>Reservasi via WA</span>
                                </Button>
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {reservasiSaya.map((res) => {
                                const detail = res.detail_reservasi[0];
                                return (
                                    <motion.div
                                        key={res.id_reservasi}
                                        whileHover={prefersReducedMotion ? {} : { y: -2 }}
                                        className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[var(--brand)]/30 hover:shadow-md transition-all text-left"
                                    >
                                        <div className="space-y-2 text-left">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <ReservasiStatusBadge status={res.status_reservasi} />
                                                <PembayaranBadge pembayaran={res.pembayaran} />
                                            </div>
                                            {detail ? (
                                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                                                    {detail.lapangan && (
                                                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                                                            <MapPin className="size-3.5 text-[var(--brand)] shrink-0" />
                                                            {detail.lapangan.nama_lapangan}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="size-3.5 shrink-0" />
                                                        {formatTanggal(detail.tanggal_main)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
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
                                        <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                            <p className="text-xs text-muted-foreground">Total Biaya</p>
                                            <p className="text-base sm:text-lg font-bold text-foreground">{formatRupiah(res.total_biaya)}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Mabar Mendatang yang Diikuti (Strictly Left-aligned) */}
                <section aria-label="Mabar mendatang yang diikuti" className="text-left">
                    <div className="flex items-center justify-between gap-3 mb-4 text-left">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Mabar Mendatang yang Diikuti</h2>
                            <p className="text-xs text-muted-foreground">Jadwal main bareng aktif yang siap Anda ikuti</p>
                        </div>
                        <Link href="/open-mabar" className="text-xs font-semibold text-[var(--brand)] hover:underline flex items-center gap-1 shrink-0">
                            <span>Cari jadwal lain</span>
                            <ArrowRight className="size-3" />
                        </Link>
                    </div>

                    {mabarDiikuti.length === 0 ? (
                        <div className="border border-dashed border-border/80 rounded-2xl p-6 sm:p-8 text-left bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
                            <div className="flex items-start gap-4 text-left">
                                <div className="size-12 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center shrink-0 text-[var(--brand)]">
                                    <Users className="size-6" />
                                </div>
                                <div className="space-y-1 text-left">
                                    <h3 className="text-base font-semibold text-foreground">Belum Ada Mabar Mendatang</h3>
                                    <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                                        Anda belum bergabung dengan jadwal mabar mana pun. Bergabunglah dengan jadwal yang sudah disetujui untuk bermain bersama komunitas badminton Bengkulu.
                                    </p>
                                </div>
                            </div>
                            <Link href="/open-mabar" className="shrink-0 w-full sm:w-auto">
                                <Button className="w-full sm:w-auto h-10 px-5 gap-2 bg-[var(--brand)] hover:opacity-90 text-white shadow-xs font-semibold">
                                    <Calendar className="size-4" />
                                    <span>Cari Jadwal Mabar</span>
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {mabarDiikuti.map((mabar) => (
                                <motion.div
                                    key={mabar.id_mabar}
                                    whileHover={prefersReducedMotion ? {} : { y: -2 }}
                                    className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[var(--brand)]/30 hover:shadow-md transition-all text-left"
                                >
                                    <div className="space-y-2 text-left flex-1 min-w-0">
                                        <h3 className="font-bold text-base text-foreground truncate">{mabar.judul}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="size-3.5 shrink-0" />
                                                {formatTanggal(mabar.tanggal)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="size-3.5 shrink-0" />
                                                {formatJam(mabar.jam_mulai)} – {formatJam(mabar.jam_selesai)} WIB
                                            </span>
                                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                                                <Users className="size-3.5 text-[var(--brand)] shrink-0" />
                                                {mabar.peserta_terdaftar_count}/{mabar.kuota} peserta
                                            </span>
                                            {mabar.lapangan && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 shrink-0" />
                                                    {mabar.lapangan.nama_lapangan}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/open-mabar/${mabar.id_mabar}`} className="shrink-0 w-full sm:w-auto">
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 text-xs h-10 px-4 font-semibold hover:border-[var(--brand)]/40">
                                            <span>Detail</span>
                                            <ArrowRight className="size-3.5" />
                                        </Button>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </PublicLayout>
    );
}

function StatCard({
    label,
    value,
    icon,
    colorClass,
    delay = 0,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
    delay?: number;
}) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            whileHover={prefersReducedMotion ? {} : { y: -3, transition: { duration: 0.15 } }}
            className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between gap-3 bg-card shadow-xs transition-all text-left ${colorClass}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">{label}</span>
                <div className="size-8 rounded-lg flex items-center justify-center bg-muted/60 border border-border/50">
                    {icon}
                </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        </motion.div>
    );
}
