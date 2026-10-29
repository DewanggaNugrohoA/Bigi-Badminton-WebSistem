<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\BiayaOperasional;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\Pembayaran;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\ShiftKasir;
use App\Models\TransaksiPos;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBiayaOperasionalAndAuditLogTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $kasirUser;
    private User $customerUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'nama' => 'Admin Utama',
            'email' => 'admin@bigi.test',
            'no_whatsapp' => '081299990001',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasirUser = User::create([
            'nama' => 'Kasir Utama',
            'email' => 'kasir@bigi.test',
            'no_whatsapp' => '081299990002',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->customerUser = User::create([
            'nama' => 'Customer Biasa',
            'email' => 'customer@bigi.test',
            'no_whatsapp' => '081299990003',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);
    }

    /**
     * Test Case #22: Input tagihan listrik Rp 500.000 tersimpan dan muncul di daftar/rekap keuangan.
     */
    public function test_case_22_admin_dapat_input_biaya_operasional_dan_tersimpan_di_database(): void
    {
        $response = $this->actingAs($this->adminUser, 'staff')
            ->post('/admin/biaya-operasional', [
                'tanggal_biaya' => '2026-10-29',
                'jenis_pengeluaran' => 'Tagihan Listrik PLN',
                'nominal' => 500000,
                'keterangan' => 'Tagihan listrik operasional gedung bulan Oktober',
            ]);

        $response->assertRedirect('/admin/biaya-operasional');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('biaya_operasional', [
            'jenis_pengeluaran' => 'Tagihan Listrik PLN',
            'jumlah' => 500000,
            'id_user' => $this->adminUser->id_user,
        ]);

        // Verifikasi muncul di halaman index
        $indexResponse = $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/biaya-operasional?start_date=2026-10-01&end_date=2026-10-31');

        $indexResponse->assertStatus(200);
        $indexResponse->assertInertia(fn ($page) => $page
            ->component('Admin/BiayaOperasional/Index')
            ->has('biayaList.data', 1)
            ->where('totalBiaya', 500000)
        );
    }

    public function test_non_admin_cannot_access_biaya_operasional(): void
    {
        // Kasir ditolak 403
        $this->actingAs($this->kasirUser, 'staff')
            ->get('/admin/biaya-operasional')
            ->assertStatus(403);

        $this->actingAs($this->kasirUser, 'staff')
            ->post('/admin/biaya-operasional', [
                'tanggal_biaya' => '2026-10-29',
                'jenis_pengeluaran' => 'WiFi',
                'nominal' => 300000,
            ])
            ->assertStatus(403);

        // User biasa ditolak 403
        $this->actingAs($this->customerUser, 'web')
            ->get('/admin/biaya-operasional')
            ->assertStatus(403);
    }

    public function test_admin_can_update_and_delete_biaya_operasional(): void
    {
        $biaya = BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'WiFi',
            'tanggal_biaya' => '2026-10-15',
            'jumlah' => 350000,
            'keterangan' => 'Tagihan Indihome',
        ]);

        $updateResponse = $this->actingAs($this->adminUser, 'staff')
            ->put("/admin/biaya-operasional/{$biaya->id_biaya}", [
                'jenis_pengeluaran' => 'WiFi Dedicated',
                'nominal' => 400000,
                'tanggal_biaya' => '2026-10-15',
                'keterangan' => 'Upgrade bandwidth',
            ]);

        $updateResponse->assertRedirect('/admin/biaya-operasional');
        $this->assertDatabaseHas('biaya_operasional', [
            'id_biaya' => $biaya->id_biaya,
            'jenis_pengeluaran' => 'WiFi Dedicated',
            'jumlah' => 400000,
        ]);

        $deleteResponse = $this->actingAs($this->adminUser, 'staff')
            ->delete("/admin/biaya-operasional/{$biaya->id_biaya}");

        $deleteResponse->assertRedirect('/admin/biaya-operasional');
        $this->assertDatabaseMissing('biaya_operasional', [
            'id_biaya' => $biaya->id_biaya,
        ]);
    }

    /**
     * Test Case #23: Kalkulasi Laba Bersih akurat
     * Laba bersih = total pendapatan kotor (sewa + POS) - total biaya operasional
     * Mengabaikan transaksi void / reservasi batal.
     */
    public function test_case_23_kalkulasi_laba_bersih_akurat(): void
    {
        $tgl = '2026-10-15';

        // 1. Sewa Lapangan Valid: Rp 600.000
        $lapangan = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 50000,
            'status_lapangan' => 'tersedia',
        ]);

        $res1 = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => $tgl,
            'total_biaya' => 600000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        Pembayaran::create([
            'id_reservasi' => $res1->id_reservasi,
            'tanggal_pembayaran' => $tgl,
            'jenis_pembayaran' => 'Lunas',
            'jumlah' => 600000,
            'metode_pembayaran' => 'transfer',
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        // 2. Sewa Lapangan BATAL: Rp 200.000 (harus diabaikan)
        $resBatal = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => $tgl,
            'total_biaya' => 200000,
            'status_reservasi' => Reservasi::STATUS_BATAL,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resBatal->id_reservasi,
            'tanggal_pembayaran' => $tgl,
            'jenis_pembayaran' => 'DP',
            'jumlah' => 100000,
            'metode_pembayaran' => 'transfer',
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        // 3. Penjualan POS Valid: Rp 400.000
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => "{$tgl} 08:00:00",
            'modal_awal' => 100000,
            'status' => ShiftKasir::STATUS_TERBUKA,
        ]);

        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261015-0001',
            'tanggal' => "{$tgl} 10:00:00",
            'subtotal' => 400000,
            'diskon' => 0,
            'total' => 400000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 400000,
            'kembalian' => 0,
            'status_transaksi' => TransaksiPos::STATUS_SELESAI,
        ]);

        // 4. Penjualan POS VOID: Rp 150.000 (harus diabaikan)
        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261015-0002',
            'tanggal' => "{$tgl} 11:00:00",
            'subtotal' => 150000,
            'diskon' => 0,
            'total' => 150000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 150000,
            'kembalian' => 0,
            'status_transaksi' => TransaksiPos::STATUS_VOID,
        ]);

        // Total Pendapatan Kotor = 600.000 (Sewa) + 400.000 (POS) = Rp 1.000.000

        // 5. Biaya Operasional: Rp 500.000
        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'Tagihan Listrik',
            'tanggal_biaya' => $tgl,
            'jumlah' => 500000,
            'keterangan' => 'Listrik PLN',
        ]);

        // Maka Laba Bersih yang diharapkan = 1.000.000 - 500.000 = Rp 500.000

        $response = $this->actingAs($this->adminUser, 'staff')
            ->get("/admin/laporan?start_date={$tgl}&end_date={$tgl}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_sewa_lapangan', 600000)
            ->where('ringkasan.pendapatan_pos', 400000)
            ->where('ringkasan.total_pendapatan_kotor', 1000000)
            ->where('ringkasan.total_biaya_operasional', 500000)
            ->where('ringkasan.laba_bersih', 500000)
        );
    }

    /**
     * Test Case #26: Audit Log tampil kronologis dengan role
     */
    public function test_case_26_audit_log_tampil_kronologis_dengan_role(): void
    {
        // Catat aktivitas oleh Admin
        AuditLog::create([
            'id_user' => $this->adminUser->id_user,
            'role' => 'admin',
            'aksi' => 'APPROVE_MABAR',
            'objek' => 'open_mabar',
            'keterangan' => 'Menyetujui jadwal open mabar #10',
            'waktu' => Carbon::now()->subMinutes(10),
        ]);

        // Catat aktivitas oleh Kasir
        AuditLog::create([
            'id_user' => $this->kasirUser->id_user,
            'role' => 'kasir',
            'aksi' => 'RESTOCK_PRODUK',
            'objek' => 'restock',
            'keterangan' => 'Restock 20 unit Grip Raket Yonex',
            'waktu' => Carbon::now()->subMinutes(5),
        ]);

        // Catat aktivitas opname oleh Kasir
        AuditLog::create([
            'id_user' => $this->kasirUser->id_user,
            'role' => 'kasir',
            'aksi' => 'STOCK_OPNAME',
            'objek' => 'stock_opname',
            'keterangan' => 'Opname Shuttlecock: Sistem 10, Fisik 9, Selisih -1',
            'waktu' => Carbon::now()->subMinute(),
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/audit-log');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/AuditLog/Index')
            ->has('logs.data', 3)
            // Kronologis: Terbaru paling atas (STOCK_OPNAME, lalu RESTOCK_PRODUK, lalu APPROVE_MABAR)
            ->where('logs.data.0.aksi', 'STOCK_OPNAME')
            ->where('logs.data.0.role', 'kasir')
            ->where('logs.data.1.aksi', 'RESTOCK_PRODUK')
            ->where('logs.data.1.role', 'kasir')
            ->where('logs.data.2.aksi', 'APPROVE_MABAR')
            ->where('logs.data.2.role', 'admin')
        );

        // Filter berdasarkan role kasir
        $filterRoleKasir = $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/audit-log?role=kasir');

        $filterRoleKasir->assertStatus(200);
        $filterRoleKasir->assertInertia(fn ($page) => $page
            ->component('Admin/AuditLog/Index')
            ->has('logs.data', 2)
            ->where('logs.data.0.role', 'kasir')
            ->where('logs.data.1.role', 'kasir')
        );

        // Non-admin ditolak 403
        $this->actingAs($this->kasirUser, 'staff')
            ->get('/admin/audit-log')
            ->assertStatus(403);

        $this->actingAs($this->customerUser, 'web')
            ->get('/admin/audit-log')
            ->assertStatus(403);
    }
}
