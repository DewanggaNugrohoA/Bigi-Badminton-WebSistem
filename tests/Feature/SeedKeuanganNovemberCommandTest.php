<?php

namespace Tests\Feature;

use App\Models\Lapangan;
use App\Models\Pembayaran;
use App\Models\Produk;
use App\Models\TransaksiPos;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedKeuanganNovemberCommandTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $kasirUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_user' => 2,
            'nama' => 'Admin Bigi',
            'email' => 'admin@gmail.com',
            'no_whatsapp' => '081299990001',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasirUser = User::create([
            'id_user' => 3,
            'nama' => 'Kasir Bigi',
            'email' => 'kasir@gmail.com',
            'no_whatsapp' => '081299990002',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        Lapangan::create([
            'id_lapangan' => 1,
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 60000,
            'status_lapangan' => 'tersedia',
        ]);

        Lapangan::create([
            'id_lapangan' => 2,
            'nama_lapangan' => 'Lapangan 2',
            'harga_per_jam' => 60000,
            'status_lapangan' => 'tersedia',
        ]);

        Produk::create(['nama_produk' => 'Air Mineral', 'kategori' => 'Minuman', 'harga' => 5000, 'stok' => 50, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Teh Manis', 'kategori' => 'Minuman', 'harga' => 7000, 'stok' => 30, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Isotonik', 'kategori' => 'Minuman', 'harga' => 10000, 'stok' => 20, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Mie Instan', 'kategori' => 'Makanan', 'harga' => 12000, 'stok' => 20, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Garuda', 'kategori' => 'Perlengkapan', 'harga' => 80000, 'stok' => 20, 'status_produk' => 'aktif']);
        Produk::create(['nama_produk' => 'Shuttlecock Yonex', 'kategori' => 'Perlengkapan', 'harga' => 120000, 'stok' => 20, 'status_produk' => 'aktif']);
    }

    public function test_command_seed_keuangan_november_menghasilkan_tepat_13_896_juta(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 11, 5, 19, 0, 0, 'Asia/Jakarta'));

        // Jalankan perintah artisan
        $this->artisan('bigi:seed-keuangan-november', ['--fresh' => true])
            ->assertSuccessful();

        // 1. Verifikasi kalkulasi agregat pembayaran sewa lapangan
        $sewaBulan = (float) Pembayaran::where('status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)
            ->whereBetween('tanggal_pembayaran', ['2026-11-01', '2026-11-30'])
            ->sum('jumlah');

        $this->assertEquals(13000000, $sewaBulan);

        // 2. Verifikasi kalkulasi transaksi POS kasir
        $posBulan = (float) TransaksiPos::where('status_transaksi', TransaksiPos::STATUS_SELESAI)
            ->whereBetween('tanggal', ['2026-11-01 00:00:00', '2026-11-30 23:59:59'])
            ->sum('total');

        $this->assertEquals(896000, $posBulan);

        // 3. Verifikasi Grand Total Keuangan Pendapatan
        $totalPendapatan = $sewaBulan + $posBulan;
        $this->assertEquals(13896000, $totalPendapatan);

        // 4. Verifikasi pada response Dashboard Admin
        $resDashboard = $this->actingAs($this->adminUser, 'staff')->get('/admin');
        $resDashboard->assertStatus(200);
        $resDashboard->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('kpi.pendapatan_bulan_ini', 13896000)
            ->where('kpi.pendapatan_rental_bulan', 13000000)
            ->where('kpi.pendapatan_pos_bulan', 896000)
        );

        // 5. Verifikasi pada response Laporan Keuangan Admin
        $resLaporan = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan?start_date=2026-11-01&end_date=2026-11-05');
        $resLaporan->assertStatus(200);
        $resLaporan->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_sewa_lapangan', 13000000)
            ->where('ringkasan.pendapatan_pos', 896000)
            ->where('ringkasan.total_pendapatan_kotor', 13896000)
        );

        Carbon::setTestNow();
    }
}
