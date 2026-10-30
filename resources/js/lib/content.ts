export const WA_RESERVATION_TEMPLATE = `Halo admin Bigi Badminton, saya ingin reservasi lapangan.

Nama:
Tanggal main:
Jam mulai - selesai:
Lapangan (1/2):
Tipe pelanggan (Member/Non-member):

Terima kasih.`;

export function cleanWaNumber(phone?: string | null): string {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
}

export function formatIndonesianPhoneInput(raw: string): string {
    let digits = raw.replace(/\D/g, '');

    if (digits.startsWith('628')) {
        digits = '0' + digits.slice(2);
    } else if (digits.startsWith('8')) {
        digits = '0' + digits;
    }

    if (digits.length >= 2 && !digits.startsWith('08')) {
        digits = '08' + digits.replace(/^0+/, '');
    }

    return digits.slice(0, 13);
}

export function isValidIndonesianPhone(phone: string): boolean {
    return /^08[0-9]{8,11}$/.test(phone);
}

export function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (
        ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
        e.ctrlKey ||
        e.metaKey
    ) {
        return;
    }

    if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
    }
}

export function buildWaLink(phone?: string | null, message: string = WA_RESERVATION_TEMPLATE): string {
    const cleaned = cleanWaNumber(phone);
    if (!cleaned) return '#';
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export interface FasilitasItem {
    judul: string;
    deskripsi: string;
}

export const APP_CONTENT = {
    nama: 'Bigi Badminton',
    tagline: 'Pusat Olahraga Badminton Modern & Nyaman di Kota Bengkulu',
    deskripsi: 'GOR Bigi Badminton menyediakan 2 lapangan badminton standar turnamen dengan karpet vinyl berkualitas, pencahayaan LED optimal, dan fasilitas pendukung lengkap untuk kenyamanan latihan serta turnamen Anda.',
    alamat: 'Lihat lokasi di peta',
    maps_url: 'https://maps.google.com/?q=-3.815252,102.293190',
    maps_embed_url: 'https://maps.google.com/maps?q=-3.815252,102.293190&z=16&output=embed',
    instagram: '@bigi_badminton',
    instagram_url: 'https://instagram.com/bigi_badminton',
    jam_operasional: '08:00 - 23:00 WIB',
    telepon_reservasi: [
        { nomor: '085664943141', wa: '6285664943141' },
        { nomor: '082374236585', wa: '6282374236585' },
    ],
    fasilitas: [
        {
            judul: '2 Lapangan Karpet Vinyl',
            deskripsi: 'Karpet vinyl berstandar turnamen yang empuk, tidak licin, dan meminimalkan risiko cedera.',
        },
        {
            judul: 'Penerangan LED Anti-Silau',
            deskripsi: 'Pencahayaan LED merata dengan standar pertandingan yang nyaman di mata.',
        },
        {
            judul: 'Kantin & POS Minuman',
            deskripsi: 'Menyediakan minuman segar, camilan berenergi, serta perlengkapan badminton seperti shuttlecock dan grip.',
        },
        {
            judul: 'Area Parkir Luas & Aman',
            deskripsi: 'Area parkir kendaraan roda dua dan empat yang aman dan teratur.',
        },
        {
            judul: 'Ruang Ganti & Toilet Bersih',
            deskripsi: 'Fasilitas sanitasi yang selalu dirawat berkala demi kenyamanan para pemain.',
        },
        {
            judul: 'Wi-Fi Gratis Berkecepatan Tinggi',
            deskripsi: 'Akses internet nirkabel gratis untuk pemain dan pengunjung.',
        },
    ] as FasilitasItem[],
};

export const JAM_BULAT_OPTIONS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00'
];

export function formatJamLabel(jam: string): string {
    const h = parseInt(jam.split(':')[0], 10);
    if (isNaN(h)) return jam;
    if (h < 11) return `${jam} WIB (Pagi)`;
    if (h < 15) return `${jam} WIB (Siang)`;
    if (h < 18) return `${jam} WIB (Sore)`;
    return `${jam} WIB (Malam)`;
}

export function getDefaultJamSelesai(jamMulai: string): string {
    const h = parseInt(jamMulai.split(':')[0], 10);
    if (isNaN(h)) return '';
    const endH = Math.min(23, h + 2);
    return `${String(endH).padStart(2, '0')}:00`;
}
