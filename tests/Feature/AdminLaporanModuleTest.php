<?php

namespace Tests\Feature;

use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\Pembayaran;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\Restock;
use App\Models\ReturVoid;
use App\Models\ShiftKasir;
use App\Models\StockOpname;
use App\Models\TransaksiPos;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLaporanModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $kasirUser;
    private User $customerUser;
    private Lapangan $lapangan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'nama' => 'Admin Keuangan',
            'email' => 'admin.keuangan@example.com',
            'no_whatsapp' => '081299990001',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasirUser = User::create([
            'nama' => 'Kasir Utama',
            'email' => 'kasir.keuangan@example.com',
            'no_whatsapp' => '081299990002',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->customerUser = User::create([
            'nama' => 'Pemain Reguler',
            'email' => 'customer.keuangan@example.com',
            'no_whatsapp' => '081299990003',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->lapangan = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 60000,
            'status_lapangan' => Lapangan::STATUS_TERSEDIA,
        ]);
    }

    public function test_guests_and_customers_redirected_and_kasir_forbidden_from_admin_laporan(): void
    {
        $this->get('/admin/laporan')->assertRedirect('/staff/login');

        $this->actingAs($this->customerUser, 'web')
            ->get('/admin/laporan')
            ->assertRedirect('/staff/login');

        $this->actingAs($this->kasirUser, 'staff')
            ->get('/admin/laporan')
            ->assertStatus(403);

        $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/laporan')
            ->assertStatus(200);
    }

    public function test_no_post_put_patch_delete_routes_allowed_on_admin_laporan(): void
    {
        $this->actingAs($this->adminUser, 'staff')->post('/admin/laporan', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->put('/admin/laporan', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->patch('/admin/laporan', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->delete('/admin/laporan', [])->assertStatus(405);
    }

    public function test_pos_revenue_excludes_void_and_splits_tunai_and_qris(): void
    {
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => Carbon::now('Asia/Jakarta')->subHours(2),
            'modal_awal' => 100000,
            'status' => ShiftKasir::STATUS_TERBUKA,
        ]);

        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'TRX-LAP-001',
            'tanggal' => Carbon::now('Asia/Jakarta'),
            'subtotal' => 60000,
            'total' => 60000,
            'metode_bayar' => TransaksiPos::METODE_TUNAI,
            'status_transaksi' => TransaksiPos::STATUS_SELESAI,
        ]);

        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'TRX-LAP-002',
            'tanggal' => Carbon::now('Asia/Jakarta'),
            'subtotal' => 40000,
            'total' => 40000,
            'metode_bayar' => TransaksiPos::METODE_QRIS,
            'status_transaksi' => TransaksiPos::STATUS_SELESAI,
        ]);

        $trxVoid = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'TRX-LAP-003',
            'tanggal' => Carbon::now('Asia/Jakarta'),
            'subtotal' => 50000,
            'total' => 50000,
            'metode_bayar' => TransaksiPos::METODE_TUNAI,
            'status_transaksi' => TransaksiPos::STATUS_VOID,
        ]);

        ReturVoid::create([
            'id_transaksi' => $trxVoid->id_transaksi,
            'id_user' => $this->kasirUser->id_user,
            'jenis' => ReturVoid::JENIS_VOID,
            'alasan' => 'Salah input',
            'status' => ReturVoid::STATUS_MENUNGGU,
            'tanggal' => Carbon::now('Asia/Jakarta'),
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_pos', 100000)
            ->where('ringkasan.pos_tunai', 60000)
            ->where('ringkasan.pos_qris', 40000)
            ->where('ringkasan.total_nominal_void_retur', 50000)
            ->where('ringkasan.jumlah_void_retur', 1)
        );
    }

    public function test_court_rental_revenue_uses_confirmed_payment_and_excludes_canceled_reservation(): void
    {
        $resTerkonfirmasi = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 150000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resTerkonfirmasi->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TRANSFER,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resTerkonfirmasi->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah' => 100000,
            'metode_pembayaran' => Pembayaran::METODE_QRIS,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        $resBatal = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 100000,
            'status_reservasi' => Reservasi::STATUS_BATAL,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resBatal->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah' => 40000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        $resMenunggu = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 80000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resMenunggu->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah' => 30000,
            'metode_pembayaran' => Pembayaran::METODE_TRANSFER,
            'status_pembayaran' => Pembayaran::STATUS_MENUNGGU,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_sewa_lapangan', 150000)
            ->where('ringkasan.dp_reservasi_batal', 40000)
            ->where('ringkasan.pembayaran_sewa_breakdown.transfer', 50000)
            ->where('ringkasan.pembayaran_sewa_breakdown.qris', 100000)
            ->where('ringkasan.pembayaran_sewa_breakdown.dp', 50000)
            ->where('ringkasan.pembayaran_sewa_breakdown.lunas', 100000)
            ->has('sewaHarian.data')
            ->has('riwayatPembayaranSewa.data')
        );
    }

    public function test_court_rental_daily_breakdown_and_payment_history_data(): void
    {
        $lap = Lapangan::first() ?? Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'status_lapangan' => 'tersedia',
        ]);

        $res = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'nama_pemesan' => 'Budi Sanjaya',
            'no_whatsapp_pemesan' => '081234567890',
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 120000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $res->id_reservasi,
            'id_lapangan' => $lap->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '17:00:00',
            'jam_selesai' => '19:00:00',
            'durasi' => 2,
            'subtotal' => 120000,
        ]);

        Pembayaran::create([
            'id_reservasi' => $res->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TRANSFER,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
            'keterangan' => 'DP Booking',
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->has('sewaHarian.data', 1)
            ->where('sewaHarian.data.0.total_transaksi', 1)
            ->where('sewaHarian.data.0.dp', 50000)
            ->where('sewaHarian.data.0.total', 50000)
            ->has('riwayatPembayaranSewa.data', 1)
            ->where('riwayatPembayaranSewa.data.0.nama_pemesan', 'Budi Sanjaya')
            ->where('riwayatPembayaranSewa.data.0.jenis_pembayaran', 'DP')
            ->where('riwayatPembayaranSewa.data.0.jumlah', 50000)
            ->where('riwayatPembayaranSewa.data.0.keterangan', 'DP Booking')
        );
    }

    public function test_outstanding_balance_calculation_for_confirmed_reservations(): void
    {
        $res1 = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 100000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        Pembayaran::create([
            'id_reservasi' => $res1->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah' => 40000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.sisa_tagihan_belum_lunas', 60000)
        );
    }

    public function test_shift_recap_and_cash_discrepancy_calculation(): void
    {
        ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => Carbon::now('Asia/Jakarta')->subHours(4),
            'waktu_tutup' => Carbon::now('Asia/Jakarta')->subHours(1),
            'modal_awal' => 100000,
            'kas_sistem' => 250000,
            'kas_fisik' => 245000,
            'selisih' => -5000,
            'status' => ShiftKasir::STATUS_DITUTUP,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.total_selisih_kas_shift', -5000)
            ->has('rekapShift.data', 1)
        );
    }

    public function test_inventory_restock_opname_and_low_stock_display(): void
    {
        $p1 = Produk::create([
            'nama_produk' => 'Shuttlecock Yonex',
            'kategori' => 'Kok',
            'harga' => 120000,
            'stok' => 2,
            'stok_minimum' => 5,
            'status_produk' => Produk::STATUS_AKTIF,
        ]);

        $p2 = Produk::create([
            'nama_produk' => 'Air Mineral',
            'kategori' => 'Minuman',
            'harga' => 5000,
            'stok' => 50,
            'stok_minimum' => 10,
            'status_produk' => Produk::STATUS_AKTIF,
        ]);

        Restock::create([
            'id_produk' => $p1->id_produk,
            'id_user' => $this->kasirUser->id_user,
            'jumlah' => 10,
            'tanggal' => Carbon::now('Asia/Jakarta')->toDateString(),
            'keterangan' => 'Restock pengiriman pagi',
        ]);

        StockOpname::create([
            'id_produk' => $p1->id_produk,
            'id_user' => $this->kasirUser->id_user,
            'stok_sistem' => 12,
            'stok_fisik' => 10,
            'selisih' => -2,
            'tanggal' => Carbon::now('Asia/Jakarta')->toDateString(),
            'keterangan' => 'Opname mingguan',
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->has('riwayatRestock.data', 1)
            ->has('riwayatOpname.data', 1)
            ->has('stokMenipis', 1)
            ->where('stokMenipis.0.nama_produk', 'Shuttlecock Yonex')
        );
    }

    public function test_date_range_validation_and_max_366_days_limit(): void
    {
        $responseInvalid = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan?start_date=2026-05-10&end_date=2026-05-01');
        $responseInvalid->assertSessionHasErrors('end_date');

        $responseOverMax = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan?start_date=2024-01-01&end_date=2026-01-01');
        $responseOverMax->assertRedirect();
        $responseOverMax->assertSessionHas('error', 'Rentang tanggal laporan maksimal 366 hari.');
    }

    public function test_excel_export_route_role_guards_and_get_only(): void
    {
        $this->get('/admin/laporan/ekspor')->assertRedirect('/staff/login');

        $this->actingAs($this->customerUser, 'web')
            ->get('/admin/laporan/ekspor')
            ->assertRedirect('/staff/login');

        $this->actingAs($this->kasirUser, 'staff')
            ->get('/admin/laporan/ekspor')
            ->assertStatus(403);

        $this->actingAs($this->adminUser, 'staff')->post('/admin/laporan/ekspor', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->put('/admin/laporan/ekspor', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->delete('/admin/laporan/ekspor', [])->assertStatus(405);

        $responseInvalid = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan/ekspor?start_date=2026-05-10&end_date=2026-05-01');
        $responseInvalid->assertSessionHasErrors('end_date');

        $responseOverMax = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan/ekspor?start_date=2024-01-01&end_date=2026-01-01');
        $responseOverMax->assertRedirect();
        $responseOverMax->assertSessionHas('error', 'Rentang tanggal laporan maksimal 366 hari.');
    }

    public function test_excel_export_generates_valid_spreadsheet_with_matching_data_and_formula_injection_guard(): void
    {
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => Carbon::now('Asia/Jakarta')->subHours(4),
            'waktu_tutup' => Carbon::now('Asia/Jakarta')->subHours(1),
            'modal_awal' => 100000,
            'kas_sistem' => 200000,
            'kas_fisik' => 195000,
            'selisih' => -5000,
            'status' => ShiftKasir::STATUS_DITUTUP,
        ]);

        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'TRX-EXP-001',
            'tanggal' => Carbon::now('Asia/Jakarta'),
            'subtotal' => 70000,
            'total' => 70000,
            'metode_bayar' => TransaksiPos::METODE_TUNAI,
            'status_transaksi' => TransaksiPos::STATUS_SELESAI,
        ]);

        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'TRX-EXP-002',
            'tanggal' => Carbon::now('Asia/Jakarta'),
            'subtotal' => 30000,
            'total' => 30000,
            'metode_bayar' => TransaksiPos::METODE_QRIS,
            'status_transaksi' => TransaksiPos::STATUS_SELESAI,
        ]);

        $trxVoid = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'TRX-EXP-VOID',
            'tanggal' => Carbon::now('Asia/Jakarta'),
            'subtotal' => 25000,
            'total' => 25000,
            'metode_bayar' => TransaksiPos::METODE_TUNAI,
            'status_transaksi' => TransaksiPos::STATUS_VOID,
        ]);

        ReturVoid::create([
            'id_transaksi' => $trxVoid->id_transaksi,
            'id_user' => $this->kasirUser->id_user,
            'jenis' => ReturVoid::JENIS_VOID,
            'alasan' => '=cmd|"/C calc"!A0',
            'status' => ReturVoid::STATUS_MENUNGGU,
            'tanggal' => Carbon::now('Asia/Jakarta'),
        ]);

        $resTerkonfirmasi = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 200000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resTerkonfirmasi->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah' => 80000,
            'metode_pembayaran' => Pembayaran::METODE_TRANSFER,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resTerkonfirmasi->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah' => 120000,
            'metode_pembayaran' => Pembayaran::METODE_QRIS,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        $resBatal = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 100000,
            'status_reservasi' => Reservasi::STATUS_BATAL,
        ]);

        Pembayaran::create([
            'id_reservasi' => $resBatal->id_reservasi,
            'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan/ekspor');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->adminUser->id_user,
            'aksi' => 'EKSPOR_LAPORAN',
            'objek' => 'laporan_keuangan',
        ]);

        $content = $response->streamedContent();
        $this->assertNotEmpty($content);

        $tempPath = tempnam(sys_get_temp_dir(), 'bigi_test_') . '.xlsx';
        file_put_contents($tempPath, $content);

        try {
            $reader = new \PhpOffice\PhpSpreadsheet\Reader\Xlsx();
            $spreadsheet = $reader->load($tempPath);

            $this->assertEquals([
                'Ringkasan',
                'POS Harian',
                'Rekap Shift',
                'Void-Retur',
                'Sewa Lapangan',
                'Restock',
                'Stok Opname',
                'Stok Menipis',
                'Pemain',
                'Lapangan',
            ], $spreadsheet->getSheetNames());

            $sheetRingkasan = $spreadsheet->getSheetByName('Ringkasan');

            $valPos = (float) $sheetRingkasan->getCell('C8')->getValue();
            $this->assertEquals(100000, $valPos);

            $valSewa = (float) $sheetRingkasan->getCell('C11')->getValue();
            $this->assertEquals(200000, $valSewa);

            $valTotal = (float) $sheetRingkasan->getCell('C14')->getValue();
            $this->assertEquals(300000, $valTotal);

            $valVoid = (float) $sheetRingkasan->getCell('C16')->getValue();
            $this->assertEquals(25000, $valVoid);

            $valSelisih = (float) $sheetRingkasan->getCell('C17')->getValue();
            $this->assertEquals(-5000, $valSelisih);

            $valDpBatal = (float) $sheetRingkasan->getCell('C20')->getValue();
            $this->assertEquals(50000, $valDpBatal);

            $sheetVoid = $spreadsheet->getSheetByName('Void-Retur');
            $alasanVal = (string) $sheetVoid->getCell('E2')->getValue();
            $this->assertStringStartsWith("'", $alasanVal);
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }
}
