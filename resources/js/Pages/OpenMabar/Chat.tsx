import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import PublicLayout from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Send,
    MessageSquare,
    Clock,
    Calendar,
    Wifi,
    WifiOff,
    AlertCircle,
    UserCircle,
} from "lucide-react";
import { useEcho, useConnectionStatus } from "@laravel/echo-react";

interface LapanganInfo {
    id_lapangan: number;
    nama_lapangan: string;
}

interface MabarData {
    id_mabar: number;
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    gender: string;
    kuota: number;
    status: string;
    lapangan?: LapanganInfo | null;
}

interface MessageItem {
    id: number;
    id_chat?: number;
    id_user: number;
    id_pengirim?: number;
    nama_pengirim: string;
    pesan: string;
    waktu: string;
}

interface PageProps {
    auth?: {
        user?: {
            id_user: number;
            nama: string;
            role: string;
        } | null;
    };
    mabar: MabarData;
    messages: MessageItem[];
    [key: string]: any;
}

export default function ChatMabar({ mabar, messages: initialMessages }: PageProps) {
    const { auth } = usePage<PageProps>().props;
    const currentUserId = auth?.user?.id_user;

    const [chatMessages, setChatMessages] = useState<MessageItem[]>(initialMessages || []);
    const [pesanInput, setPesanInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Koneksi status dari Laravel Echo
    const connectionStatus = useConnectionStatus();

    // Sinkronisasi data awal dari props dan deduplikasi berdasarkan id
    useEffect(() => {
        setChatMessages((prev) => {
            const map = new Map<number, MessageItem>();
            for (const item of prev) {
                const key = item.id ?? item.id_chat!;
                map.set(key, item);
            }
            for (const item of initialMessages || []) {
                const key = item.id ?? item.id_chat!;
                map.set(key, item);
            }
            return Array.from(map.values()).sort(
                (a, b) => (a.id ?? a.id_chat!) - (b.id ?? b.id_chat!)
            );
        });
    }, [initialMessages]);

    // Fungsi bantu untuk auto-scroll ke pesan terbawah
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    // Auto-scroll saat ada pesan bertambah
    useEffect(() => {
        scrollToBottom();
    }, [chatMessages.length]);

    // Dengarkan event siaran WebSocket via useEcho
    useEcho(
        `mabar.${mabar.id_mabar}`,
        [".PesanMabarTerkirim", "PesanMabarTerkirim"],
        (payload: MessageItem) => {
            setChatMessages((prev) => {
                const incomingId = payload.id ?? payload.id_chat;
                // Cegah duplikasi jika pesan sudah ada
                if (prev.some((m) => (m.id ?? m.id_chat) === incomingId)) {
                    return prev;
                }
                return [...prev, payload];
            });
        },
        [mabar.id_mabar]
    );

    // Format tanggal Indonesia
    const formatTanggal = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    const formatJam = (timeStr: string) => (timeStr ? timeStr.substring(0, 5) : "");

    const formatWaktuPesan = (timeStr: string) => {
        try {
            if (!timeStr) return "";
            if (timeStr.includes(" ")) {
                const parts = timeStr.split(" ");
                if (parts[1]) return parts[1].substring(0, 5);
            }
            const date = new Date(timeStr);
            if (!isNaN(date.getTime())) {
                return new Intl.DateTimeFormat("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(date);
            }
            return timeStr;
        } catch {
            return timeStr;
        }
    };

    // Handler submit kirim pesan
    const handleKirim = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const text = pesanInput.trim();
        if (!text) {
            setErrorMessage("Pesan tidak boleh kosong.");
            return;
        }

        if (text.length > 500) {
            setErrorMessage("Pesan maksimal 500 karakter.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        router.post(
            `/open-mabar/${mabar.id_mabar}/chat`,
            { pesan: text },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setPesanInput("");
                },
                onError: (errors) => {
                    setErrorMessage(errors.pesan || "Gagal mengirim pesan.");
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Shortcut Enter untuk kirim, Shift+Enter untuk baris baru
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleKirim();
        }
    };

    const isConnected = connectionStatus === "connected";
    const isConnecting = connectionStatus === "connecting";

    return (
        <PublicLayout title={`Ruang Obrolan - ${mabar.judul}`}>
            <Head title={`Ruang Obrolan - ${mabar.judul}`} />

            {/* Container luar dengan padding atas yang cukup agar tidak tertutup navbar fixed */}
            <div className="pt-20 sm:pt-24 pb-4 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6rem)]">
                {/* Kartu Chat Utama */}
                <div className="flex-1 flex flex-col min-h-0 bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Chat */}
                    <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-border/80 bg-card/95 backdrop-blur shrink-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href={`/open-mabar/${mabar.id_mabar}`}
                                className="size-9 rounded-lg border border-border/70 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                title="Kembali ke Detail Mabar"
                            >
                                <ArrowLeft className="size-4" />
                            </Link>
                            <div className="min-w-0">
                                <h1 className="font-bold text-foreground text-sm sm:text-base truncate">
                                    {mabar.judul}
                                </h1>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span className="inline-flex items-center gap-1 shrink-0">
                                        <Calendar className="size-3" />
                                        <span>{formatTanggal(mabar.tanggal)}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 shrink-0">
                                        <Clock className="size-3" />
                                        <span>
                                            {formatJam(mabar.jam_mulai)} - {formatJam(mabar.jam_selesai)} WIB
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Indikator Status Koneksi Real-time */}
                        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 border border-border/50">
                            {isConnected ? (
                                <>
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-emerald-400 hidden sm:inline">Terhubung</span>
                                    <Wifi className="size-3.5 text-emerald-400 sm:hidden" />
                                </>
                            ) : isConnecting ? (
                                <>
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-amber-400 hidden sm:inline">Menghubungkan...</span>
                                    <Wifi className="size-3.5 text-amber-400 sm:hidden" />
                                </>
                            ) : (
                                <>
                                    <span className="size-2 rounded-full bg-rose-500" />
                                    <span className="text-muted-foreground hidden sm:inline">Koneksi terputus (Offline)</span>
                                    <WifiOff className="size-3.5 text-rose-400 sm:hidden" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Area Riwayat Pesan (Scroll Sendiri) */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 bg-muted/10"
                    >
                        {chatMessages.length === 0 ? (
                            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                                <div className="size-12 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center mb-3 text-muted-foreground">
                                    <MessageSquare className="size-6" />
                                </div>
                                <p className="font-medium text-foreground text-sm">Belum ada pesan</p>
                                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                    Mulai obrolan dan koordinasikan persiapan mabar Anda dengan pemain lain di sini!
                                </p>
                            </div>
                        ) : (
                            chatMessages.map((msg) => {
                                const isMe = (msg.id_user ?? msg.id_pengirim) === currentUserId;
                                const msgKey = msg.id ?? msg.id_chat ?? Math.random();

                                return (
                                    <div
                                        key={msgKey}
                                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                    >
                                        {!isMe && (
                                            <div className="flex items-center gap-1.5 mb-1 px-1 text-xs text-muted-foreground font-medium">
                                                <UserCircle className="size-3.5 text-primary" />
                                                <span>{msg.nama_pengirim}</span>
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                                                isMe
                                                    ? "bg-[var(--brand)] text-white rounded-br-none"
                                                    : "bg-card border border-border/80 text-foreground rounded-bl-none"
                                            }`}
                                        >
                                            <p>{msg.pesan}</p>
                                            <div
                                                className={`text-[10px] mt-1 text-right select-none ${
                                                    isMe ? "text-white/70" : "text-muted-foreground"
                                                }`}
                                            >
                                                {formatWaktuPesan(msg.waktu)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Kotak Input Pesan (Tetap di Bawah Layar) */}
                    <div className="p-3 sm:p-4 border-t border-border/80 bg-card/95 backdrop-blur shrink-0">
                        {errorMessage && (
                            <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                                <AlertCircle className="size-3.5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleKirim} className="flex items-end gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    value={pesanInput}
                                    onChange={(e) => {
                                        setPesanInput(e.target.value);
                                        if (errorMessage) setErrorMessage(null);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Tulis pesan (Enter untuk kirim, Shift+Enter untuk baris baru)..."
                                    rows={1}
                                    maxLength={500}
                                    disabled={isSubmitting}
                                    className="w-full resize-none min-h-[42px] max-h-[120px] px-3.5 py-2.5 rounded-xl bg-background border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all disabled:opacity-50"
                                />
                                <div className="absolute right-2 bottom-1.5 text-[10px] text-muted-foreground/60 select-none pointer-events-none">
                                    {pesanInput.length}/500
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !pesanInput.trim()}
                                className="h-[42px] px-4 gap-1.5 shrink-0 rounded-xl"
                            >
                                <Send className="size-4" />
                                <span className="hidden sm:inline">Kirim</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
