import DitheredFooter, { FooterColumn, FooterSocial } from "@/components/ui/dithered-footer";
import { APP_CONTENT } from "@/lib/content";

export function SiteFooter() {
    const columns: FooterColumn[] = [
        {
            title: "Navigasi",
            links: [
                { label: "Beranda", href: "/" },
                { label: "Fasilitas", href: "/#fasilitas" },
                { label: "Open Mabar", href: "/open-mabar" },
                { label: "Masuk", href: "/login" },
            ],
        },
        {
            title: "Open Mabar",
            links: [
                { label: "Cari Jadwal", href: "/open-mabar" },
                { label: "Buat Jadwal", href: "/open-mabar/create" },
                { label: "Jadwal Saya", href: "/open-mabar/saya" },
            ],
        },
        {
            title: "Kontak",
            links: [
                { label: `WhatsApp: ${APP_CONTENT.whatsapp}`, href: `https://wa.me/${APP_CONTENT.whatsapp}` },
                { label: APP_CONTENT.alamat, href: "#" },
                { label: `Buka: ${APP_CONTENT.jam_operasional}`, href: "#" },
            ],
        },
    ];

    const socials: FooterSocial[] = [
        {
            label: "WhatsApp",
            href: `https://wa.me/${APP_CONTENT.whatsapp}`,
            icon: (
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                </svg>
            ),
        },
        {
            label: "Instagram",
            href: `https://instagram.com/${APP_CONTENT.instagram.replace('@', '')}`,
            icon: (
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            ),
        },
    ];

    return (
        <DitheredFooter
            brand={APP_CONTENT.nama}
            wordmark="BIGI"
            tagline="Sistem Reservasi dan Informasi Open Mabar Bigi Badminton (2 Lapangan)."
            columns={columns}
            socials={socials}
            legal={[]}
            copyright={`© ${new Date().getFullYear()} ${APP_CONTENT.nama}. All rights reserved.`}
            accent="var(--brand, #6633ee)"
        />
    );
}