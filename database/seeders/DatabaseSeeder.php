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

        
        Produk::create(['nama_produk' => 'Air Mineral', 'kategori' => 'Minuman', 'harga' => 5000, 'stok' => 50, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Teh Manis', 'kategori' => 'Minuman', 'harga' => 7000, 'stok' => 30, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Isotonik', 'kategori' => 'Minuman', 'harga' => 10000, 'stok' => 20, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Mie Instan', 'kategori' => 'Makanan', 'harga' => 12000, 'stok' => 15, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Yonex', 'kategori' => 'Perlengkapan', 'harga' => 120000, 'stok' => 10, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Garuda', 'kategori' => 'Perlengkapan', 'harga' => 80000, 'stok' => 15, 'status_produk' => 'aktif']);
    }
}