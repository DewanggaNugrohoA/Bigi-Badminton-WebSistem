<?php

namespace Database\Seeders;

use App\Models\ChatMabar;
use App\Models\DetailReservasi;
use App\Models\Informasi;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\Pembayaran;
use App\Models\PesertaMabar;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed 5 Users
        $admin = User::create([
            'nama' => 'Admin Bigi',
            'email' => 'admin@bigi.test',
            'password' => Hash::make('password'),
            'no_whatsapp' => '081234567890',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
            'role' => 'admin',
        ]);

        $kasir = User::create([
            'nama' => 'Kasir Utama',
            'email' => 'kasir@bigi.test',
            'password' => Hash::make('password'),
            'no_whatsapp' => '081234567891',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
            'role' => 'kasir',
        ]);

        $user = User::create([
            'nama' => 'Budi Santoso',
            'email' => 'user@bigi.test',
            'password' => Hash::make('password'),
            'no_whatsapp' => '081234567892',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
            'role' => 'user',
        ]);

        $member = User::create([
            'nama' => 'Siti Rahma Member',
            'email' => 'member@bigi.test',
            'password' => Hash::make('password'),
            'no_whatsapp' => '081234567893',
            'jenis_pelanggan' => 'member',
            'tanggal_mulai_member' => now()->startOfMonth()->toDateString(),
            'tanggal_akhir_member' => now()->addMonth()->toDateString(),
            'status_member' => 'aktif',
            'status_akun' => 'aktif',
            'role' => 'user',
        ]);

        $kasirNonaktif = User::create([
            'nama' => 'Kasir Nonaktif',
            'email' => 'kasir.nonaktif@bigi.test',
            'password' => Hash::make('password'),
            'no_whatsapp' => '081234567894',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'nonaktif',
            'role' => 'kasir',
        ]);

        // 2. Seed 2 Lapangan
        $lap1 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1 (Vinyl A)',
            'harga_per_jam' => 50000,
            'status' => 'tersedia',
        ]);

        $lap2 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 2 (Vinyl B)',
            'harga_per_jam' => 50000,
            'status' => 'tersedia',
        ]);

        // 3. Seed 6 Produk
        $produkItems = [
            ['nama_produk' => 'Aqua 600ml', 'kategori' => 'Minuman', 'harga_jual' => 4000, 'stok' => 50],
            ['nama_produk' => 'Pocari Sweat 500ml', 'kategori' => 'Minuman', 'harga_jual' => 8000, 'stok' => 30],
            ['nama_produk' => 'Grip Raket Yonex', 'kategori' => 'Aksesori', 'harga_jual' => 15000, 'stok' => 20],
            ['nama_produk' => 'Sewa Raket Pro', 'kategori' => 'Sewa', 'harga_jual' => 20000, 'stok' => 10],
            ['nama_produk' => 'Shuttlecock Alpha 1 Slop', 'kategori' => 'Peralatan', 'harga_jual' => 120000, 'stok' => 15],
            ['nama_produk' => 'Roti Bakar Cokelat', 'kategori' => 'Makanan', 'harga_jual' => 12000, 'stok' => 25],
        ];
        foreach ($produkItems as $p) {
            Produk::create($p);
        }

        // 4. Seed 5 Open Mabar (3 disetujui, 1 menunggu, 1 ditolak)
        $mabar1 = OpenMabar::create([
            'id_user' => $user->id_user,
            'id_lapangan' => $lap1->id_lapangan,
            'judul' => 'Mabar Santai Malam Rabu',
            'tanggal' => now()->addDays(2)->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'level_pemain' => 'Pemula - Menengah',
            'max_peserta' => 6,
            'harga_per_orang' => 25000,
            'status' => 'disetujui',
        ]);

        $mabar2 = OpenMabar::create([
            'id_user' => $member->id_user,
            'id_lapangan' => $lap2->id_lapangan,
            'judul' => 'Mabar Ganda Putra Intermediate',
            'tanggal' => now()->addDays(3)->toDateString(),
            'jam_mulai' => '20:00:00',
            'jam_selesai' => '22:00:00',
            'level_pemain' => 'Menengah',
            'max_peserta' => 4,
            'harga_per_orang' => 30000,
            'status' => 'disetujui',
        ]);

        $mabar3 = OpenMabar::create([
            'id_user' => $user->id_user,
            'id_lapangan' => $lap1->id_lapangan,
            'judul' => 'Sparring Akhir Pekan',
            'tanggal' => now()->addDays(5)->toDateString(),
            'jam_mulai' => '16:00:00',
            'jam_selesai' => '18:00:00',
            'level_pemain' => 'Lanjutan',
            'max_peserta' => 4,
            'harga_per_orang' => 30000,
            'status' => 'disetujui',
        ]);

        $mabar4 = OpenMabar::create([
            'id_user' => $member->id_user,
            'id_lapangan' => $lap2->id_lapangan,
            'judul' => 'Mabar Pagi Ceria',
            'tanggal' => now()->addDays(4)->toDateString(),
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '10:00:00',
            'level_pemain' => 'Semua Level',
            'max_peserta' => 8,
            'harga_per_orang' => 20000,
            'status' => 'menunggu',
        ]);

        $mabar5 = OpenMabar::create([
            'id_user' => $user->id_user,
            'id_lapangan' => $lap1->id_lapangan,
            'judul' => 'Mabar Tengah Malam',
            'tanggal' => now()->addDays(1)->toDateString(),
            'jam_mulai' => '23:00:00',
            'jam_selesai' => '01:00:00',
            'level_pemain' => 'Semua Level',
            'max_peserta' => 4,
            'harga_per_orang' => 25000,
            'status' => 'ditolak',
            'alasan_penolakan' => 'Jam operasional GOR hanya sampai pukul 23:00 WIB.',
        ]);

        // Peserta & Chat Mabar untuk Mabar 1
        PesertaMabar::create([
            'id_mabar' => $mabar1->id_mabar,
            'id_user' => $user->id_user,
            'status_pembayaran' => 'lunas',
        ]);
        PesertaMabar::create([
            'id_mabar' => $mabar1->id_mabar,
            'id_user' => $member->id_user,
            'status_pembayaran' => 'lunas',
        ]);

        ChatMabar::create([
            'id_mabar' => $mabar1->id_mabar,
            'id_user' => $user->id_user,
            'pesan' => 'Halo kawan-kawan, jangan lupa bawa raket sendiri ya!',
        ]);
        ChatMabar::create([
            'id_mabar' => $mabar1->id_mabar,
            'id_user' => $member->id_user,
            'pesan' => 'Siap mas, saya meluncur jam 18:45.',
        ]);

        // 5. Seed 2 Informasi Terbit
        Informasi::create([
            'id_user' => $admin->id_user,
            'judul' => 'Jadwal Pemeliharaan Lapangan 2',
            'konten' => 'Diberitahukan kepada seluruh anggota, Lapangan 2 akan menjalani pengecatan ulang karpet pada hari Senin depan.',
            'status_terbit' => 'terbit',
        ]);

        Informasi::create([
            'id_user' => $admin->id_user,
            'judul' => 'Turnamen Internal Bigi Cup 2026',
            'konten' => 'Pendaftaran Turnamen Internal Bigi Cup 2026 resmi dibuka! Hubungi admin atau kasir untuk informasi pendaftaran.',
            'status_terbit' => 'terbit',
        ]);

        // 6. Seed 1 Reservasi milik member@bigi.test + Detail + Pembayaran
        $reservasi = Reservasi::create([
            'id_user' => $member->id_user,
            'kode_reservasi' => 'RES-'.date('Ymd').'-001',
            'tanggal_reservasi' => now()->addDay()->toDateString(),
            'total_harga' => 100000,
            'status_reservasi' => 'lunas',
            'catatan' => 'Sewa 2 jam lapangan 1 oleh member',
        ]);

        DetailReservasi::create([
            'id_reservasi' => $reservasi->id_reservasi,
            'id_lapangan' => $lap1->id_lapangan,
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'subtotal' => 100000,
        ]);

        Pembayaran::create([
            'id_reservasi' => $reservasi->id_reservasi,
            'metode_pembayaran' => 'qris',
            'jumlah_bayar' => 100000,
            'status_pembayaran' => 'berhasil',
            'bukti_pembayaran' => 'bukti_qris_001.png',
            'tanggal_bayar' => now(),
        ]);
    }
}
