<?php

namespace Tests\Feature;

use App\Models\BiayaOperasional;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\Pembayaran;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\TransaksiPos;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResetDataSistemCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_data_sistem_menghapus_semua_data_transaksi_dan_menyisakan_hanya_akun_utama(): void
    {
        // 1. Buat 4 akun utama
        $user1 = User::create([
            'id_user' => 1,
            'nama' => 'dewa nugroho',
            'no_whatsapp' => '081200000001',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $admin = User::create([
            'id_user' => 2,
            'nama' => 'Admin Bigi',
            'email' => 'admin@gmail.com',
            'no_whatsapp' => '081200000002',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $kasir = User::create([
            'id_user' => 3,
            'nama' => 'Kasir Bigi',
            'email' => 'kasir@gmail.com',
            'no_whatsapp' => '081200000003',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $user4 = User::create([
            'id_user' => 4,
            'nama' => 'Dewangga Nugroho',
            'no_whatsapp' => '081200000004',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        // Buat user tambahan (member impor)
        $memberDummy = User::create([
            'id_user' => 10,
            'nama' => 'Member Dummy',
            'no_whatsapp' => '081200000010',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        // Master Lapangan & Produk
        $lapangan = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 60000,
            'status_lapangan' => 'tersedia',
        ]);

        $produk = Produk::create([
            'nama_produk' => 'Air Mineral',
            'kategori' => 'Minuman',
            'harga' => 5000,
            'stok' => 5,
            'status_produk' => 'aktif',
        ]);

        // Buat data transaksi dummy
        $res = Reservasi::create([
            'id_user' => $user1->id_user,
            'nama_pemesan' => 'dewa',
            'tanggal_pemesanan' => '2026-11-05',
            'total_biaya' => 60000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $res->id_reservasi,
            'id_lapangan' => $lapangan->id_lapangan,
            'tanggal_main' => '2026-11-05',
            'jam_mulai' => '10:00:00',
            'jam_selesai' => '11:00:00',
            'durasi' => 60,
            'subtotal' => 60000,
        ]);

        Pembayaran::create([
            'id_reservasi' => $res->id_reservasi,
            'tanggal_pembayaran' => '2026-11-05',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah' => 60000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        BiayaOperasional::create([
            'id_user' => $admin->id_user,
            'jenis_pengeluaran' => 'WiFi / Internet',
            'keterangan' => 'Tagihan WiFi',
            'tanggal_biaya' => '2026-11-01',
            'jumlah' => 200000,
        ]);

        // Pastikan sebelum reset ada transaksi
        $this->assertEquals(1, Reservasi::count());
        $this->assertEquals(1, Pembayaran::count());
        $this->assertEquals(1, BiayaOperasional::count());
        $this->assertEquals(5, User::count());

        // Jalankan perintah reset
        $this->artisan('bigi:reset-data-sistem', ['--force' => true])
            ->assertSuccessful();

        // Verifikasi setelah reset: Seluruh transaksi 0
        $this->assertEquals(0, Reservasi::count());
        $this->assertEquals(0, DetailReservasi::count());
        $this->assertEquals(0, Pembayaran::count());
        $this->assertEquals(0, BiayaOperasional::count());
        $this->assertEquals(0, TransaksiPos::count());

        // Verifikasi user: Hanya 4 akun utama yang tersisa
        $this->assertEquals(4, User::count());
        $this->assertDatabaseHas('users', ['id_user' => 1, 'role' => User::ROLE_USER]);
        $this->assertDatabaseHas('users', ['id_user' => 2, 'role' => User::ROLE_ADMIN]);
        $this->assertDatabaseHas('users', ['id_user' => 3, 'role' => User::ROLE_KASIR]);
        $this->assertDatabaseHas('users', ['id_user' => 4, 'role' => User::ROLE_USER]);
        $this->assertDatabaseMissing('users', ['id_user' => 10]);

        // Verifikasi master produk & lapangan tetap ada
        $this->assertEquals(1, Lapangan::count());
        $this->assertEquals(1, Produk::count());
        $this->assertEquals(50, Produk::first()->stok); // Stok air mineral ter-reset ke 50
    }
}
