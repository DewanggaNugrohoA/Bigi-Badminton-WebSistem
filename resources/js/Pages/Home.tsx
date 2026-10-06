import { Head, Link, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { APP_CONTENT, buildWaLink } from "@/lib/content";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    Phone,
    ExternalLink,
    Calendar,
    Users,
    Trophy,
    Sparkles,
    Coffee,
    ShieldCheck,
    Wifi,
    RotateCcw,
    Plus,
    Minus,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Clock,
    MapPin,
} from "lucide-react";

interface LapanganItem {
    id_lapangan: number;
    nama_lapangan: string;
    harga_per_jam: number | string;
    status_lapangan: "tersedia" | "perawatan";
    keterangan?: string | null;
}

interface InformasiItem {
    id_informasi: number;
    judul: string;
    gambar?: string | null;
    tanggal_publikasi?: string | null;
}

interface HomeProps {
    lapangan: LapanganItem[];
    informasi: InformasiItem[];
}

interface SharedProps {
    auth?: {
        user?: {
            id_user: number;
            nama: string;
            email: string;
            role: string;
        } | null;
    };
    config?: {
        wa_admin_number?: string;
    };
    [key: string]: any;
}

const facilityIcons = [
    Trophy,
    Sparkles,
    Coffee,
    ShieldCheck,
    Users,
    Wifi,
];

export default function Home({ lapangan = [], informasi = [] }: HomeProps) {
    const { auth, config } = usePage<SharedProps>().props;
    const user = auth?.user;
    const waReservationLink = buildWaLink(config?.wa_admin_number);
    const prefersReducedMotion = useReducedMotion();

    const [scores, setScores] = useState({
        court1: { teamA: 0, teamB: 0 },
        court2: { teamA: 0, teamB: 0 },
    });

    const updateScore = (court: "court1" | "court2", team: "teamA" | "teamB", delta: number) => {
        setScores((prev) => ({
            ...prev,
            [court]: {
                ...prev[court],
                [team]: Math.max(0, prev[court][team] + delta),
            },
        }));
    };

    const resetScore = (court: "court1" | "court2") => {
        setScores((prev) => ({
            ...prev,
            [court]: { teamA: 0, teamB: 0 },
        }));
    };

    const formatRupiah = (amount: number | string) => {
        const num = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "";
        try {
            return new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(new Date(dateString));
        } catch {
            return dateString;
        }
    };

    const getAnimProps = (delay = 0) =>
        prefersReducedMotion
            ? {}
            : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: "-50px" },
                  transition: { duration: 0.5, delay, ease: "easeOut" as const },
              };

    return (
        <PublicLayout title="Beranda">
            {/* 1. Hero Section */}
            <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-36 px-4 sm:px-6">
                {/* Background Pattern dari referensi tailwind-css-background-snippet */}
                <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,var(--brand)_100%)] opacity-85 pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
                    <motion.div
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, scale: 0.95 },
                                  animate: { opacity: 1, scale: 1 },
                                  transition: { duration: 0.5 },
                              })}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs sm:text-sm font-medium mb-6"
                    >
                        <Trophy className="size-4 text-[var(--brand)]" />
                        <span>2 Lapangan Karpet Vinyl Standar Turnamen</span>
                    </motion.div>

                    <motion.h1
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, y: 16 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { duration: 0.6, delay: 0.1 },
                              })}
                        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight"
                    >
                        Main Badminton Lebih Seru di{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[var(--brand)]">
                            Bigi Badminton
                        </span>
                    </motion.h1>

                    <motion.p
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, y: 16 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { duration: 0.6, delay: 0.2 },
                              })}
                        className="mt-6 text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl leading-relaxed"
                    >
                        {APP_CONTENT.tagline}
                    </motion.p>

                    <motion.div
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0, y: 16 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { duration: 0.6, delay: 0.3 },
                              })}
                        className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
                    >
                        <a
                            href={waReservationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                        >
                            <Button
                                size="lg"
                                className="w-full sm:w-auto h-12 px-7 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 gap-2 rounded-xl transition-all"
                            >
                                <Phone className="size-5" />
                                <span>Reservasi via WA</span>
                                <ExternalLink className="size-4 opacity-75" />
                            </Button>
                        </a>

                        <Link
                            href={user ? "/open-mabar" : "/login?redirect=/open-mabar"}
                            className="w-full sm:w-auto"
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto h-12 px-7 text-base font-semibold border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100 gap-2 rounded-xl transition-all"
                            >
                                <Calendar className="size-5 text-[var(--brand)]" />
                                <span>Lihat Open Mabar</span>
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div
                        {...(prefersReducedMotion
                            ? {}
                            : {
                                  initial: { opacity: 0 },
                                  animate: { opacity: 1 },
                                  transition: { duration: 0.6, delay: 0.4 },
                              })}
                        className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-zinc-400"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-purple-400" />
                            <span>Buka Setiap Hari: {APP_CONTENT.jam_operasional}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-purple-400" />
                            <span>{APP_CONTENT.alamat}</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. Profil & Fasilitas Section */}
            <section id="fasilitas" className="py-20 px-4 sm:px-6 bg-zinc-950/80 border-t border-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...getAnimProps()} className="text-center max-w-3xl mx-auto mb-14">
                        <span className="text-xs uppercase tracking-widest text-[var(--brand)] font-bold">
                            FASILITAS & PROFIL
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Kenyamanan Maksimal untuk Setiap Smash
                        </h2>
                        <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
                            {APP_CONTENT.deskripsi}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {APP_CONTENT.fasilitas.map((item, idx) => {
                            const IconComponent = facilityIcons[idx % facilityIcons.length];
                            return (
                                <motion.div
                                    key={idx}
                                    {...getAnimProps(idx * 0.08)}
                                    className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="size-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[var(--brand)] mb-5 group-hover:scale-105 transition-transform">
                                            <IconComponent className="size-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                                            {item.judul}
                                        </h3>
                                        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                            {item.deskripsi}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. Daftar Lapangan Section */}
            <section className="py-20 px-4 sm:px-6 bg-zinc-950 border-t border-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...getAnimProps()} className="text-center max-w-2xl mx-auto mb-14">
                        <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                            PILIHAN LAPANGAN
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Lapangan Badminton Siap Pakai
                        </h2>
                        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
                            Pilih lapangan favorit Anda dan lakukan reservasi langsung melalui WhatsApp admin.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {lapangan.length > 0 ? (
                            lapangan.map((lap, index) => {
                                const isTersedia = lap.status_lapangan === "tersedia";
                                return (
                                    <motion.div
                                        key={lap.id_lapangan}
                                        {...getAnimProps(index * 0.1)}
                                        className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden flex flex-col justify-between p-6 sm:p-8 relative shadow-lg"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-2xl font-black text-white tracking-tight">
                                                    {lap.nama_lapangan}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                                        isTersedia
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    }`}
                                                >
                                                    {isTersedia ? (
                                                        <>
                                                            <CheckCircle2 className="size-3.5" />
                                                            <span>Tersedia</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="size-3.5" />
                                                            <span>Perawatan</span>
                                                        </>
                                                    )}
                                                </span>
                                            </div>

                                            <p className="text-zinc-400 text-sm mb-6 min-h-[40px]">
                                                {lap.keterangan ||
                                                    "Karpet vinyl premium standar turnamen dengan pencahayaan LED optimal dan sirkulasi udara baik."}
                                            </p>

                                            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 mb-6 flex items-baseline justify-between">
                                                <span className="text-xs text-zinc-400 font-medium">Tarif Sewa</span>
                                                <div className="text-right">
                                                    <span className="text-2xl font-extrabold text-white">
                                                        {formatRupiah(lap.harga_per_jam)}
                                                    </span>
                                                    <span className="text-xs text-zinc-400"> / jam</span>
                                                </div>
                                            </div>
                                        </div>

                                        <a
                                            href={waReservationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full"
                                        >
                                            <Button
                                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl gap-2 transition-all"
                                                disabled={!isTersedia}
                                            >
                                                <Phone className="size-4" />
                                                <span>{isTersedia ? "Reservasi via WA" : "Sedang Perawatan"}</span>
                                                {isTersedia && <ExternalLink className="size-3.5 opacity-75" />}
                                            </Button>
                                        </a>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="col-span-2 text-center py-12 text-zinc-500">
                                Belum ada data lapangan tersedia.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 4. Papan Skor Manual Section */}
            <section className="py-20 px-4 sm:px-6 bg-zinc-950/80 border-t border-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...getAnimProps()} className="text-center max-w-2xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold mb-3">
                            <span>Papan skor manual</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Papan Skor Lapangan
                        </h2>
                        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
                            Catat skor pertandingan Anda secara langsung di pinggir lapangan. Tersedia untuk Lapangan 1 dan Lapangan 2.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {(["court1", "court2"] as const).map((courtKey, courtIdx) => {
                            const courtTitle = courtKey === "court1" ? "Lapangan 1" : "Lapangan 2";
                            const courtData = scores[courtKey];

                            return (
                                <motion.div
                                    key={courtKey}
                                    {...getAnimProps(courtIdx * 0.1)}
                                    className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 sm:p-7 flex flex-col justify-between"
                                >
                                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="size-5 text-[var(--brand)]" />
                                            <h3 className="font-bold text-lg text-white">{courtTitle}</h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => resetScore(courtKey)}
                                            className="text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-1.5 h-8 px-2.5"
                                        >
                                            <RotateCcw className="size-3.5" />
                                            <span>Reset Skor</span>
                                        </Button>
                                    </div>

                                    {/* Display Skor */}
                                    <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center">
                                        {/* Tim A */}
                                        <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center">
                                            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                                                Tim / Pemain A
                                            </span>
                                            <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter my-2">
                                                {String(courtData.teamA).padStart(2, "0")}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 w-full justify-center">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => updateScore(courtKey, "teamA", -1)}
                                                    disabled={courtData.teamA === 0}
                                                    className="size-9 rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                                                    aria-label="Kurangi skor Tim A"
                                                >
                                                    <Minus className="size-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateScore(courtKey, "teamA", 1)}
                                                    className="h-9 px-4 rounded-lg bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-bold gap-1"
                                                    aria-label="Tambah skor Tim A"
                                                >
                                                    <Plus className="size-4" />
                                                    <span>+1</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Tim B */}
                                        <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center">
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                                                Tim / Pemain B
                                            </span>
                                            <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter my-2">
                                                {String(courtData.teamB).padStart(2, "0")}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 w-full justify-center">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => updateScore(courtKey, "teamB", -1)}
                                                    disabled={courtData.teamB === 0}
                                                    className="size-9 rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                                                    aria-label="Kurangi skor Tim B"
                                                >
                                                    <Minus className="size-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateScore(courtKey, "teamB", 1)}
                                                    className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1"
                                                    aria-label="Tambah skor Tim B"
                                                >
                                                    <Plus className="size-4" />
                                                    <span>+1</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. Informasi Terbaru Section (sembunyikan jika kosong) */}
            {informasi.length > 0 && (
                <section className="py-20 px-4 sm:px-6 bg-zinc-950 border-t border-zinc-900">
                    <div className="max-w-6xl mx-auto">
                        <motion.div {...getAnimProps()} className="text-center max-w-2xl mx-auto mb-14">
                            <span className="text-xs uppercase tracking-widest text-[var(--brand)] font-bold">
                                BERITA & PENGUMUMAN
                            </span>
                            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                                Informasi Terbaru GOR
                            </h2>
                            <p className="mt-3 text-zinc-400 text-sm sm:text-base">
                                Ikuti perkembangan, jadwal turnamen, dan pengumuman resmi dari manajemen Bigi Badminton.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {informasi.map((item, index) => (
                                <motion.div
                                    key={item.id_informasi}
                                    {...getAnimProps(index * 0.08)}
                                    className="rounded-2xl bg-zinc-900/70 border border-zinc-800 overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-all group"
                                >
                                    <div>
                                        <div className="h-44 w-full bg-zinc-800/80 overflow-hidden relative">
                                            {item.gambar ? (
                                                <img
                                                    src={`/storage/${item.gambar}`}
                                                    alt={item.judul}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-900">
                                                    <Trophy className="size-10 mb-2 opacity-40 text-purple-400" />
                                                    <span className="text-xs font-medium text-zinc-500">
                                                        Bigi Badminton News
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            {item.tanggal_publikasi && (
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2.5">
                                                    <Calendar className="size-3.5 text-purple-400" />
                                                    <span>{formatDate(item.tanggal_publikasi)}</span>
                                                </div>
                                            )}
                                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                                                {item.judul}
                                            </h3>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 6. Open Mabar Banner Section */}
            <section className="py-20 px-4 sm:px-6 bg-zinc-950/80 border-t border-zinc-900 relative isolate overflow-hidden">
                <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 border border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/30 shadow-2xl relative">
                    <motion.div {...getAnimProps()} className="text-center flex flex-col items-center">
                        <div className="size-14 rounded-2xl bg-[var(--brand)]/20 border border-[var(--brand)]/30 flex items-center justify-center text-[var(--brand)] mb-6 shadow-inner">
                            <Users className="size-7" />
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Gabung Komunitas Open Mabar Bigi
                        </h2>

                        <p className="mt-4 text-zinc-300 text-sm sm:text-base max-w-xl leading-relaxed">
                            Cari lawan tanding atau teman main bareng badminton dengan mudah. Pilih jadwal, daftar, dan mulai bertanding bersama komunitas badminton Bengkulu!
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                            {user ? (
                                <Link href="/open-mabar">
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 text-base font-semibold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-xl shadow-lg shadow-purple-950/50"
                                    >
                                        <span>Buka Open Mabar</span>
                                        <ArrowRight className="size-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/login?redirect=/open-mabar">
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 text-base font-semibold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white gap-2 rounded-xl shadow-lg shadow-purple-950/50"
                                    >
                                        <span>Masuk untuk melihat jadwal</span>
                                        <ArrowRight className="size-5" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </PublicLayout>
    );
}
