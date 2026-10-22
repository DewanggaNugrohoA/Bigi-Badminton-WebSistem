/**
 * Modul audio notifikasi WhatsApp untuk Panel Admin Bigi Badminton.
 * Menggunakan pendekatan hybrid:
 * 1. File audio autentik (/sounds/wa-notification.wav)
 * 2. Fallback Web Audio API synthesizer jika file audio diblokir atau belum termuat.
 */

const STORAGE_KEY_SOUND = "admin_notif_sound_enabled";

let sharedAudioContext: AudioContext | null = null;
let isAudioUnlocked = false;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!sharedAudioContext && AudioCtx) {
            sharedAudioContext = new AudioCtx();
        }
        if (sharedAudioContext && sharedAudioContext.state === "suspended") {
            sharedAudioContext.resume().catch(() => {});
        }
        return sharedAudioContext;
    } catch {
        return null;
    }
}

/**
 * Membuka izin audio browser (Autoplay Policy) pada interaksi pertama pengguna.
 */
export function unlockAudio(): void {
    if (isAudioUnlocked || typeof window === "undefined") return;

    const ctx = getAudioContext();
    if (ctx) {
        if (ctx.state === "suspended") {
            ctx.resume().then(() => {
                isAudioUnlocked = true;
            }).catch(() => {});
        } else {
            isAudioUnlocked = true;
        }
    }

    // Buat dummy audio sebentar untuk membuka hak audio HTML5
    try {
        const dummy = new Audio();
        dummy.volume = 0;
        dummy.play().catch(() => {});
    } catch {}
}

if (typeof window !== "undefined") {
    const handleFirstInteraction = () => {
        unlockAudio();
        window.removeEventListener("click", handleFirstInteraction);
        window.removeEventListener("keydown", handleFirstInteraction);
        window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true, once: true });
    window.addEventListener("keydown", handleFirstInteraction, { passive: true, once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true, once: true });
}

/**
 * Cek status preferensi suara admin (default aktif).
 */
export function isNotificationSoundEnabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
        const val = localStorage.getItem(STORAGE_KEY_SOUND);
        return val === null ? true : val === "true";
    } catch {
        return true;
    }
}

/**
 * Mengubah preferensi suara admin.
 */
export function setNotificationSoundEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
    } catch {}
}

/**
 * Sintesis nada WhatsApp menggunakan Web Audio API murni.
 * Menghasilkan nada 2-chime harmonik (C6 -> G6) khas notifikasi perpesanan instan.
 */
function playSynthesizedWaChime(): void {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const playTone = (freq: number, startTime: number, duration: number, peakVol: number) => {
        const osc = ctx.createOscillator();
        const harmonic = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        harmonic.type = "triangle";
        harmonic.frequency.setValueAtTime(freq * 2, startTime);

        // Envelope akustik: attack cepat, decay lembut
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(peakVol, startTime + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gainNode);
        harmonic.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        harmonic.start(startTime);
        osc.stop(startTime + duration);
        harmonic.stop(startTime + duration);
    };

    // Nada 1: C6 (1046.5 Hz)
    playTone(1046.5, now, 0.20, 0.35);
    // Nada 2: G6 (1568.0 Hz) sedikit lebih tinggi dan cerah
    playTone(1568.0, now + 0.11, 0.32, 0.40);
}

/**
 * Memainkan suara notifikasi WhatsApp.
 * Mengutamakan audio file jika didukung, jika gagal otomatis memutar sintesis Web Audio API.
 */
export function playWaNotificationSound(): Promise<void> {
    if (!isNotificationSoundEnabled()) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        try {
            const audio = new Audio("/sounds/wa-notification.wav");
            audio.volume = 0.85;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => resolve())
                    .catch(() => {
                        // Jika Audio element gagal (misal file belum termuat atau error codec), gunakan synth
                        playSynthesizedWaChime();
                        resolve();
                    });
            } else {
                resolve();
            }
        } catch {
            playSynthesizedWaChime();
            resolve();
        }
    });
}
