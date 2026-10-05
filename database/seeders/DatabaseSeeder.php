<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Lapangan;
use App\Models\Produk;
use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Models\ChatMabar;
use App\Models\Informasi;
use App\Models\Reservasi;
use App\Models\DetailReservasi;
use App\Models\Pembayaran;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        // Users
        $admin = User::create([
            'nama' => 'Admin',
            'email' => 'admin@bigi.test',
            'no_whatsapp' => '0811111111',
            'password' => $password,
            'role' => 'admin',
        ]);

        $kasir = User::create([
            'nama' => 'Kasir',
            'email' => 'kasir@bigi.test',
            'no_whatsapp' => '0822222222',
            'password' => $password,
            'role' => 'kasir',
        ]);

        $user = User::create([
            'nama' => 'User Biasa',
            'email' => 'user@bigi.test',
            'no_whatsapp' => '0833333333',
            'password' => $password,
            'role' => 'user',
        ]);

        $member = User::create([
            'nama' => 'User Member',
            'email' => 'member@bigi.test',
            'no_whatsapp' => '0844444444',
            'password' => $password,
            'role' => 'user',
            'jenis_pelanggan' => 'member',
            'tanggal_mulai_member' => Carbon::now()->subDays(10)->toDateString(),
            'tanggal_akhir_member' => Carbon::now()->addDays(20)->toDateString(),
            'status_member' => 'aktif',
        ]);

        $kasirNonaktif = User::create([
            'nama' => 'Kasir Nonaktif',
            'email' => 'kasir.nonaktif@bigi.test',
            'no_whatsapp' => '0855555555',
            'password' => $password,
            'role' => 'kasir',
            'status_akun' => 'nonaktif',
        ]);

        // Lapangan
        $lapangan1 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 50000,
            'status_lapangan' => 'tersedia',
        ]);

        $lapangan2 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 2',
            'harga_per_jam' => 50000,
            'status_lapangan' => 'tersedia',
        ]);

        // Produk
        Produk::create(['nama_produk' => 'Air Mineral', 'kategori' => 'Minuman', 'harga' => 5000, 'stok' => 50, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Teh Manis', 'kategori' => 'Minuman', 'harga' => 7000, 'stok' => 30, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Isotonik', 'kategori' => 'Minuman', 'harga' => 10000, 'stok' => 20, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Mie Instan', 'kategori' => 'Makanan', 'harga' => 12000, 'stok' => 15, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Yonex', 'kategori' => 'Perlengkapan', 'harga' => 120000, 'stok' => 10, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Garuda', 'kategori' => 'Perlengkapan', 'harga' => 80000, 'stok' => 15, 'status_produk' => 'aktif']);

        // Informasi
        Informasi::create([
            'id_user' => $admin->id_user,
            'judul' => 'Turnamen Bulutangkis 2026',
            'status' => 'terbit',
            'tanggal_publikasi' => Carbon::now()->toDateString(),
        ]);
        Informasi::create([
            'id_user' => $admin->id_user,
            'judul' => 'Promo Member Baru',
            'status' => 'terbit',
            'tanggal_publikasi' => Carbon::now()->toDateString(),
        ]);

        // Open Mabar
        $mabar1 = OpenMabar::create([
            'id_user' => $user->id_user,
            'judul' => 'Mabar Santuy Malam Minggu',
            'tanggal' => Carbon::now()->addDays(2)->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '22:00:00',
            'gender' => 'campuran',
            'batas_usia_min' => 18,
            'batas_usia_max' => 40,
            'kuota' => 10,
            'status' => 'disetujui',
            'foto' => 'mabar1.jpg'
        ]);

        $mabar2 = OpenMabar::create([
            'id_user' => $member->id_user,
            'judul' => 'Mabar Putra Kompetitif',
            'tanggal' => Carbon::now()->addDays(3)->toDateString(),
            'jam_mulai' => '20:00:00',
            'jam_selesai' => '23:00:00',
            'gender' => 'putra',
            'batas_usia_min' => 20,
            'batas_usia_max' => 35,
            'kuota' => 8,
            'status' => 'disetujui',
        ]);

        $mabar3 = OpenMabar::create([
            'id_user' => $user->id_user,
            'judul' => 'Mabar Putri Pagi Hari',
            'tanggal' => Carbon::now()->addDays(4)->toDateString(),
            'jam_mulai' => '07:00:00',
            'jam_selesai' => '10:00:00',
            'gender' => 'putri',
            'batas_usia_min' => 15,
            'batas_usia_max' => 50,
            'kuota' => 6,
            'status' => 'disetujui',
        ]);

        $mabar4 = OpenMabar::create([
            'id_user' => $member->id_user,
            'judul' => 'Mabar Menunggu Persetujuan',
            'tanggal' => Carbon::now()->addDays(5)->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'gender' => 'campuran',
            'batas_usia_min' => 20,
            'batas_usia_max' => 30,
            'kuota' => 8,
            'status' => 'menunggu',
        ]);

        $mabar5 = OpenMabar::create([
            'id_user' => $user->id_user,
            'judul' => 'Mabar Ditolak',
            'tanggal' => Carbon::now()->addDays(1)->toDateString(),
            'jam_mulai' => '16:00:00',
            'jam_selesai' => '18:00:00',
            'gender' => 'putra',
            'batas_usia_min' => 15,
            'batas_usia_max' => 25,
            'kuota' => 6,
            'status' => 'ditolak',
        ]);

        // Peserta & Chat
        PesertaMabar::create([
            'id_mabar' => $mabar1->id_mabar,
            'id_user' => $member->id_user,
            'tanggal_daftar' => Carbon::now()->toDateString(),
        ]);
        
        ChatMabar::create([
            'id_mabar' => $mabar1->id_mabar,
            'id_user' => $member->id_user,
            'pesan' => 'Halo semua, salam kenal!',
            'waktu' => Carbon::now(),
        ]);

        // Reservasi Member
        $reservasi = Reservasi::create([
            'id_user' => $member->id_user,
            'tanggal_pemesanan' => Carbon::now()->toDateString(),
            'total_biaya' => 100000,
            'status_reservasi' => 'terkonfirmasi',
        ]);

        DetailReservasi::create([
            'id_reservasi' => $reservasi->id_reservasi,
            'id_lapangan' => $lapangan1->id_lapangan,
            'tanggal_main' => Carbon::now()->addDays(2)->toDateString(),
            'jam_mulai' => '10:00:00',
            'jam_selesai' => '12:00:00',
            'durasi' => 120,
            'subtotal' => 100000,
        ]);

        Pembayaran::create([
            'id_reservasi' => $reservasi->id_reservasi,
            'tanggal_pembayaran' => Carbon::now()->toDateString(),
            'jenis_pembayaran' => 'Lunas',
            'jumlah' => 100000,
            'metode_pembayaran' => 'transfer',
            'status_pembayaran' => 'terkonfirmasi',
        ]);
    }
}