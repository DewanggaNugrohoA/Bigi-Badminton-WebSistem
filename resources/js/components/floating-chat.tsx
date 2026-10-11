import React, { useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import { MessageSquare, X, Send, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEcho } from "@laravel/echo-react";

interface MabarSummary {
    id_mabar: number;
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    kuota: number;
    peserta_count: number;
    foto?: string | null;
    inisiator: string;
    lapangan?: string | null;
    last_message?: {
        pesan: string;
        pengirim: string;
        waktu: string;
    } | null;
}

interface ChatMessage {
    id: number;
    id_chat: number;
    id_user: number;
    id_pengirim: number;
    nama_pengirim: string;
    pesan: string;
    waktu: string;
}

interface SharedAuthProps {
    auth?: {
        user?: {
            id_user: number;
            nama: string;
            role: string;
        } | null;
    };
    [key: string]: unknown;
}

export function FloatingChat() {
    const { auth } = usePage<SharedAuthProps>().props;
    const currentUser = auth?.user;

    
    if (!currentUser || currentUser.role !== "user") {
        return null;
    }

    const [isOpen, setIsOpen] = useState(false);
    const [activeMabarId, setActiveMabarId] = useState<number | null>(null);
    const [mabarList, setMabarList] = useState<MabarSummary[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    
    const [activeMabarInfo, setActiveMabarInfo] = useState<MabarSummary | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [inputPesan, setInputPesan] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    
    const fetchDaftarMabar = async () => {
        setLoadingList(true);
        try {
            const res = await fetch("/chat-panel/daftar", { credentials: "same-origin" });
            if (res.ok) {
                const json = await res.json();
                setMabarList(json.data || []);
            }
        } catch {
            // Abaikan error fetch background
        } finally {
            setLoadingList(false);
        }
    };

    
    const fetchPesanMabar = async (idMabar: number) => {
        setLoadingMessages(true);
        setErrorMessage(null);
        try {
            const res = await fetch(`/chat-panel/${idMabar}/pesan`, { credentials: "same-origin" });
            if (res.ok) {
                const json = await res.json();
                setActiveMabarInfo(json.mabar || null);
                setMessages(json.messages || []);
            } else if (res.status === 403) {
                setErrorMessage("Anda tidak memiliki akses ke forum chat mabar ini.");
            }
        } catch {
            setErrorMessage("Gagal memuat pesan. Silakan coba lagi.");
        } finally {
            setLoadingMessages(false);
        }
    };

    
    useEffect(() => {
        const handleCustomOpen = (event: Event) => {
            const customEvent = event as CustomEvent<{ idMabar: number }>;
            const targetId = customEvent.detail?.idMabar;
            if (targetId) {
                setIsOpen(true);
                setActiveMabarId(targetId);
                fetchPesanMabar(targetId);
            }
        };

        window.addEventListener("bigi:buka-chat", handleCustomOpen);
        return () => window.removeEventListener("bigi:buka-chat", handleCustomOpen);
    }, []);

    
    useEffect(() => {
        if (isOpen && activeMabarId === null) {
            fetchDaftarMabar();
        }
    }, [isOpen, activeMabarId]);

    
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    
    useEcho(
        activeMabarId ? `mabar.${activeMabarId}` : "",
        [".PesanMabarTerkirim", "PesanMabarTerkirim"],
        (payload: ChatMessage) => {
            if (!activeMabarId) return;
            setMessages((prev) => {
                const incomingId = payload.id ?? payload.id_chat;
                if (prev.some((m) => (m.id ?? m.id_chat) === incomingId)) {
                    return prev;
                }
                return [...prev, payload];
            });
        }
    );

    
    
    
    useEffect(() => {
        if (!isOpen || !activeMabarId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/chat-panel/${activeMabarId}/pesan`, {
                    credentials: "same-origin",
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.messages && Array.isArray(json.messages)) {
                        setMessages((prev) => {
                            
                            if (prev.length !== json.messages.length) {
                                return json.messages;
                            }
                            const prevLastId = prev[prev.length - 1]?.id_chat ?? prev[prev.length - 1]?.id;
                            const newLastId = json.messages[json.messages.length - 1]?.id_chat ?? json.messages[json.messages.length - 1]?.id;
                            if (prevLastId !== newLastId) {
                                return json.messages;
                            }
                            return prev;
                        });
                    }
                }
            } catch {
                // Abaikan error jaringan saat polling di background
            }
        }, 2500);

        return () => clearInterval(interval);
    }, [isOpen, activeMabarId]);

    const handleSelectMabar = (id: number) => {
        setActiveMabarId(id);
        fetchPesanMabar(id);
    };

    const handleBackToList = () => {
        setActiveMabarId(null);
        setActiveMabarInfo(null);
        setMessages([]);
        fetchDaftarMabar();
    };

    const handleKirimPesan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = inputPesan.trim();
        if (!text || !activeMabarId || submitting) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/chat-panel/${activeMabarId}/kirim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken || "",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: JSON.stringify({ pesan: text }),
            });

            if (res.ok) {
                const json = await res.json();
                const newMsg = json.data;
                setMessages((prev) => {
                    const incomingId = newMsg.id ?? newMsg.id_chat;
                    if (prev.some((m) => (m.id ?? m.id_chat) === incomingId)) {
                        return prev;
                    }
                    return [...prev, newMsg];
                });
                setInputPesan("");
                requestAnimationFrame(() => {
                    textareaRef.current?.focus({ preventScroll: true });
                });
            } else {
                const errorData = await res.json();
                setErrorMessage(errorData.message || errorData.errors?.pesan?.[0] || "Gagal mengirim pesan.");
            }
        } catch {
            setErrorMessage("Koneksi gagal saat mengirim pesan.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
            
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Panel Forum Chat Mabar"
                    className="w-[92vw] sm:w-96 h-[520px] max-h-[80vh] bg-card border border-border/80 rounded-2xl shadow-xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    
                    <div className="h-14 px-4 bg-card/95 border-b border-border/80 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            {activeMabarId !== null && (
                                <button
                                    type="button"
                                    onClick={handleBackToList}
                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                                    title="Kembali ke daftar obrolan"
                                    aria-label="Kembali ke daftar obrolan"
                                >
                                    <ArrowLeft className="size-4" />
                                </button>
                            )}

                            {activeMabarInfo && (
                                <div className="size-9 rounded-full overflow-hidden bg-muted border border-border/70 shrink-0 flex items-center justify-center">
                                    {activeMabarInfo.foto ? (
                                        <img
                                            src={activeMabarInfo.foto.startsWith("http") || activeMabarInfo.foto.startsWith("/") ? activeMabarInfo.foto : `/storage/${activeMabarInfo.foto}`}
                                            alt={activeMabarInfo.judul}
                                            className="size-full object-cover object-center"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            {activeMabarInfo.judul.substring(0, 2)}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="min-w-0">
                                <h3 className="font-semibold text-sm text-foreground truncate">
                                    {activeMabarInfo ? activeMabarInfo.judul : "Forum Chat Mabar"}
                                </h3>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {activeMabarInfo ? "Obrolan Komunitas" : "Pilih mabar yang Anda ikuti"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="Tutup forum chat"
                            aria-label="Tutup forum chat"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    
                    {activeMabarId === null ? (
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loadingList ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-xs gap-2 py-10">
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Memuat daftar obrolan...</span>
                                </div>
                            ) : mabarList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                    <MessageSquare className="size-8 opacity-40 mb-2" />
                                    <p className="text-sm font-medium text-foreground">Belum Ada Obrolan</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                                        Ikuti atau buat jadwal Open Mabar untuk mulai berdiskusi dengan sesama pemain.
                                    </p>
                                </div>
                            ) : (
                                mabarList.map((item) => {
                                    const fotoUrl = item.foto
                                        ? item.foto.startsWith("http") || item.foto.startsWith("/")
                                            ? item.foto
                                            : `/storage/${item.foto}`
                                        : null;

                                    return (
                                        <button
                                            key={item.id_mabar}
                                            type="button"
                                            onClick={() => handleSelectMabar(item.id_mabar)}
                                            className="w-full text-left p-3 rounded-xl border border-border/60 bg-background/50 hover:bg-accent/50 transition-colors flex items-center gap-3"
                                        >
                                            
                                            <div className="size-11 rounded-full overflow-hidden bg-muted border border-border/70 shrink-0 flex items-center justify-center">
                                                {fotoUrl ? (
                                                    <img
                                                        src={fotoUrl}
                                                        alt={item.judul}
                                                        className="size-full object-cover object-center"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-muted-foreground uppercase">
                                                        {item.judul.substring(0, 2)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold text-xs text-foreground truncate">
                                                        {item.judul}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {item.tanggal}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                    {item.last_message ? (
                                                        <span>
                                                            <strong>{item.last_message.pengirim}:</strong> {item.last_message.pesan}
                                                        </span>
                                                    ) : (
                                                        <span className="italic">Belum ada pesan terbaru</span>
                                                    )}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        
                        <div className="flex-1 flex flex-col min-h-0">
                            {errorMessage && (
                                <div className="p-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                                    <AlertCircle className="size-3.5 shrink-0" />
                                    <span className="truncate">{errorMessage}</span>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                                {loadingMessages ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs gap-2 py-10">
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Memuat riwayat obrolan...</span>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                        <p className="text-xs">Belum ada pesan dalam forum mabar ini.</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Sapa pemain lain sekarang!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.id_user === currentUser.id_user;
                                        return (
                                            <div
                                                key={msg.id ?? msg.id_chat}
                                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                            >
                                                {!isMe && (
                                                    <span className="text-[10px] text-muted-foreground font-medium mb-0.5 px-1">
                                                        {msg.nama_pengirim}
                                                    </span>
                                                )}
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                                        isMe
                                                            ? "bg-[var(--brand)] text-white rounded-tr-xs"
                                                            : "bg-muted text-foreground border border-border/60 rounded-tl-xs"
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{msg.pesan}</p>
                                                    <span
                                                        className={`block text-[9px] mt-1 text-right ${
                                                            isMe ? "text-white/70" : "text-muted-foreground"
                                                        }`}
                                                    >
                                                        {msg.waktu ? msg.waktu.substring(11, 16) : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            
                            <form
                                onSubmit={handleKirimPesan}
                                className="p-3 bg-card border-t border-border/80 flex items-center gap-2"
                            >
                                <textarea
                                    ref={textareaRef}
                                    value={inputPesan}
                                    onChange={(e) => setInputPesan(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleKirimPesan();
                                        }
                                    }}
                                    placeholder="Tulis pesan..."
                                    maxLength={500}
                                    rows={1}
                                    className="flex-1 min-h-[38px] max-h-24 px-3 py-2 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground resize-none outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submitting || !inputPesan.trim()}
                                    className="h-[38px] px-3 bg-[var(--brand)] hover:opacity-90 text-white shrink-0"
                                    title="Kirim pesan"
                                    aria-label="Kirim pesan"
                                >
                                    {submitting ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Send className="size-3.5" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            
            <Button
                type="button"
                onClick={() => {
                    if (!isOpen) {
                        setIsOpen(true);
                        setActiveMabarId(null);
                        setActiveMabarInfo(null);
                        setMessages([]);
                        fetchDaftarMabar();
                    } else {
                        setIsOpen(false);
                    }
                }}
                className="size-12 rounded-full bg-[var(--brand)] hover:opacity-95 text-white shadow-lg flex items-center justify-center p-0 transition-transform active:scale-95"
                title="Buka Forum Chat Mabar"
                aria-label="Buka Forum Chat Mabar"
            >
                <MessageSquare className="size-5" />
            </Button>
        </div>
    );
}
