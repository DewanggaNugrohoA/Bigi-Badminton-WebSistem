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

        // Inisialisasi stok awal produk kantin dan perlengkapan kasir POS
        Produk::create(['nama_produk' => 'Air Mineral', 'kategori' => 'Minuman', 'harga' => 5000, 'stok' => 50, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Teh Manis', 'kategori' => 'Minuman', 'harga' => 7000, 'stok' => 30, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Isotonik', 'kategori' => 'Minuman', 'harga' => 10000, 'stok' => 20, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Mie Instan', 'kategori' => 'Makanan', 'harga' => 12000, 'stok' => 15, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Yonex', 'kategori' => 'Perlengkapan', 'harga' => 120000, 'stok' => 10, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Garuda', 'kategori' => 'Perlengkapan', 'harga' => 80000, 'stok' => 15, 'status_produk' => 'aktif']);
    }
}