<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lapangan;
use App\Models\Produk;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Inisialisasi 2 data master lapangan badminton standar GOR Bigi Badminton
        $lapangan1 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 60000,
            'status_lapangan' => 'tersedia',
        ]);

        $lapangan2 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 2',
            'harga_per_jam' => 60000,
            'status_lapangan' => 'tersedia',
        ]);

        // Inisialisasi stok awal produk kantin dan perlengkapan kasir POS dengan foto produk riil
        Produk::create(['nama_produk' => 'Air Mineral', 'kategori' => 'Minuman', 'gambar' => 'produk/air_mineral.jpg', 'harga' => 5000, 'stok' => 50, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Teh Manis', 'kategori' => 'Minuman', 'gambar' => 'produk/teh_manis.jpg', 'harga' => 7000, 'stok' => 35, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Isotonik', 'kategori' => 'Minuman', 'gambar' => 'produk/isotonik.jpg', 'harga' => 10000, 'stok' => 25, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Mie Instan', 'kategori' => 'Makanan', 'gambar' => 'produk/mie_instan.jpg', 'harga' => 12000, 'stok' => 30, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Yonex', 'kategori' => 'Perlengkapan', 'gambar' => 'produk/shuttlecock_yonex.jpg', 'harga' => 120000, 'stok' => 15, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Garuda', 'kategori' => 'Perlengkapan', 'gambar' => 'produk/shuttlecock_garuda.jpg', 'harga' => 80000, 'stok' => 20, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'ayam geprek', 'kategori' => 'Makanan', 'gambar' => 'produk/ayam_geprek.jpg', 'harga' => 15000, 'stok' => 25, 'status_produk' => 'aktif']);
    }
}