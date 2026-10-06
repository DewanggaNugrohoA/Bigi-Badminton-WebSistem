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
    alamat: 'Jl. Universitas Bengkulu No. 1, Kota Bengkulu',
    instagram: '@bigibadminton',
    jam_operasional: '08:00 - 23:00 WIB',
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
            judul: 'Free Wi-Fi Berkecepatan Tinggi',
            deskripsi: 'Akses internet nirkabel gratis untuk pemain dan pengunjung.',
        },
    ] as FasilitasItem[],
};
