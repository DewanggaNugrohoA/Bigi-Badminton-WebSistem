<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\DetailTransaksiPos;
use App\Models\Produk;
use App\Models\Restock;
use App\Models\ReturVoid;
use App\Models\ShiftKasir;
use App\Models\StockOpname;
use App\Models\TransaksiPos;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class KasirK2ModuleTest extends TestCase
{
    use RefreshDatabase;

    protected User $kasirUser;
    protected User $otherKasir;
    protected User $adminUser;
    protected User $regulerUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->kasirUser = User::create([
            'nama' => 'Joko Kasir',
            'email' => 'joko@bigi.internal',
            'no_whatsapp' => '087700020001',
            'password' => Hash::make('KasirPass123!'),
            'role' => 'kasir',
            'status_akun' => 'aktif',
        ]);

        $this->otherKasir = User::create([
            'nama' => 'Rina Kasir',
            'email' => 'rina@bigi.internal',
            'no_whatsapp' => '087700020002',
            'password' => Hash::make('KasirPass123!'),
            'role' => 'kasir',
            'status_akun' => 'aktif',
        ]);

        $this->adminUser = User::create([
            'nama' => 'Admin Boss',
            'email' => 'boss@bigi.internal',
            'no_whatsapp' => '087700020003',
            'password' => Hash::make('AdminPass123!'),
            'role' => 'admin',
            'status_akun' => 'aktif',
        ]);

        $this->regulerUser = User::create([
            'nama' => 'Member User',
            'email' => 'member2@bigi.internal',
            'no_whatsapp' => '087700020004',
            'password' => Hash::make('MemberPass123!'),
            'role' => 'user',
            'status_akun' => 'aktif',
        ]);
    }

    public function test_produk_crud_and_validation(): void
    {
        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/produk', [
                'nama_produk' => 'Handuk Olahraga',
                'kategori' => 'Aksesoris',
                'harga' => 25000,
                'stok_minimum' => 3,
                'status_produk' => 'aktif',
            ]);

        $response->assertRedirect('/kasir/produk');
        $this->assertDatabaseHas('produk', [
            'nama_produk' => 'Handuk Olahraga',
            'stok' => 0,
            'status_produk' => 'aktif',
        ]);

        $produk = Produk::where('nama_produk', 'Handuk Olahraga')->first();
        $this->assertNotNull($produk);

        $duplicateResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/produk', [
                'nama_produk' => 'Handuk Olahraga',
                'kategori' => 'Aksesoris',
                'harga' => 20000,
                'stok_minimum' => 1,
                'status_produk' => 'aktif',
            ]);
        $duplicateResponse->assertSessionHasErrors('nama_produk');

        $updateResponse = $this->actingAs($this->kasirUser, 'staff')
            ->put('/kasir/produk/' . $produk->id_produk, [
                'nama_produk' => 'Handuk Olahraga Lembut',
                'kategori' => 'Aksesoris',
                'harga' => 30000,
                'stok_minimum' => 5,
                'status_produk' => 'nonaktif',
            ]);
        $updateResponse->assertRedirect('/kasir/produk');

        $produk->refresh();
        $this->assertEquals('Handuk Olahraga Lembut', $produk->nama_produk);
        $this->assertEquals(30000, (float) $produk->harga);
        $this->assertEquals('nonaktif', $produk->status_produk);
        $this->assertEquals(0, $produk->stok);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'TAMBAH_PRODUK',
        ]);
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'UPDATE_PRODUK',
        ]);
    }

    public function test_price_change_does_not_affect_past_transaction_snapshots(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Minuman Isotonik',
            'kategori' => 'Minuman',
            'harga' => 8000,
            'stok' => 20,
            'stok_minimum' => 5,
            'status_produk' => 'aktif',
        ]);

        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 50000,
            'status' => 'terbuka',
        ]);

        $tx = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-9991',
            'tanggal' => now(),
            'subtotal' => 16000,
            'diskon' => 0,
            'total' => 16000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 20000,
            'kembalian' => 4000,
            'status_transaksi' => 'selesai',
        ]);

        $detail = DetailTransaksiPos::create([
            'id_transaksi' => $tx->id_transaksi,
            'id_produk' => $produk->id_produk,
            'jumlah' => 2,
            'harga' => 8000,
            'subtotal' => 16000,
        ]);

        $this->actingAs($this->kasirUser, 'staff')
            ->put('/kasir/produk/' . $produk->id_produk, [
                'nama_produk' => 'Minuman Isotonik',
                'kategori' => 'Minuman',
                'harga' => 12000,
                'stok_minimum' => 5,
                'status_produk' => 'aktif',
            ]);

        $detail->refresh();
        $this->assertEquals(8000, (float) $detail->harga);
        $this->assertEquals(16000, (float) $detail->subtotal);
    }

    public function test_restock_increments_stock_and_rejects_invalid_inputs(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Kaos Kaki Badminton',
            'kategori' => 'Aksesoris',
            'harga' => 15000,
            'stok' => 5,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');
        $futureDate = Carbon::now('Asia/Jakarta')->addDays(2)->format('Y-m-d');

        $futureResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $produk->id_produk,
                'jumlah' => 10,
                'tanggal' => $futureDate,
            ]);
        $futureResponse->assertSessionHasErrors('tanggal');

        $zeroResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $produk->id_produk,
                'jumlah' => 0,
                'tanggal' => $today,
            ]);
        $zeroResponse->assertSessionHasErrors('jumlah');

        $successResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $produk->id_produk,
                'jumlah' => 15,
                'tanggal' => $today,
                'keterangan' => 'Pengiriman dari distributor',
            ]);
        $successResponse->assertRedirect('/kasir/restock');

        $produk->refresh();
        $this->assertEquals(20, $produk->stok);

        $this->assertDatabaseHas('restock', [
            'id_produk' => $produk->id_produk,
            'id_user' => $this->kasirUser->id_user,
            'jumlah' => 15,
        ]);
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'RESTOCK_PRODUK',
        ]);
    }

    public function test_restock_can_create_new_product_and_increments_stock(): void
    {
        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'nama_produk' => 'Shuttlecock Bigi Tournament',
                'kategori' => 'Shuttlecock',
                'harga' => 140000,
                'jumlah' => 25,
                'tanggal' => $today,
                'keterangan' => 'Pengadaan perdana stok',
            ]);

        $response->assertRedirect('/kasir/restock');

        $this->assertDatabaseHas('produk', [
            'nama_produk' => 'Shuttlecock Bigi Tournament',
            'kategori' => 'Shuttlecock',
            'harga' => 140000,
            'stok' => 25,
            'stok_minimum' => 0,
            'status_produk' => 'aktif',
        ]);

        $produk = Produk::where('nama_produk', 'Shuttlecock Bigi Tournament')->first();
        $this->assertNotNull($produk);

        $this->assertDatabaseHas('restock', [
            'id_produk' => $produk->id_produk,
            'id_user' => $this->kasirUser->id_user,
            'jumlah' => 25,
            'keterangan' => 'Pengadaan perdana stok',
        ]);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'TAMBAH_PRODUK',
        ]);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'RESTOCK_PRODUK',
        ]);
    }

    public function test_restock_rejects_duplicate_product_name_case_insensitively(): void
    {
        $initialCount = Produk::count();

        Produk::create([
            'nama_produk' => 'Grip Karet Yonex',
            'kategori' => 'Aksesoris',
            'harga' => 18000,
            'stok' => 10,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'nama_produk' => '  grip karet yonex  ',
                'kategori' => 'Aksesoris',
                'harga' => 20000,
                'jumlah' => 10,
                'tanggal' => $today,
            ]);

        $response->assertSessionHasErrors('nama_produk');

        $this->assertDatabaseCount('produk', $initialCount + 1);
    }

    public function test_restock_validations_for_new_product_and_exclusive_mode(): void
    {
        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');
        $existing = Produk::first();

        $bothResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $existing->id_produk,
                'nama_produk' => 'Produk Dobel',
                'kategori' => 'Kategori',
                'harga' => 10000,
                'jumlah' => 5,
                'tanggal' => $today,
            ]);
        $bothResponse->assertSessionHasErrors('id_produk');

        $emptyResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'jumlah' => 5,
                'tanggal' => $today,
            ]);
        $emptyResponse->assertSessionHasErrors('id_produk');

        $missingKategori = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'nama_produk' => 'Produk Baru Tanpa Kategori',
                'harga' => 15000,
                'jumlah' => 5,
                'tanggal' => $today,
            ]);
        $missingKategori->assertSessionHasErrors('kategori');

        $missingHarga = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'nama_produk' => 'Produk Baru Tanpa Harga',
                'kategori' => 'Minuman',
                'jumlah' => 5,
                'tanggal' => $today,
            ]);
        $missingHarga->assertSessionHasErrors('harga');

        $negativeQty = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $existing->id_produk,
                'jumlah' => -5,
                'tanggal' => $today,
            ]);
        $negativeQty->assertSessionHasErrors('jumlah');

        $zeroQty = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $existing->id_produk,
                'jumlah' => 0,
                'tanggal' => $today,
            ]);
        $zeroQty->assertSessionHasErrors('jumlah');
    }

    public function test_non_kasir_cannot_perform_restock(): void
    {
        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');
        $existing = Produk::first();

        $guest = $this->post('/kasir/restock', [
            'id_produk' => $existing->id_produk,
            'jumlah' => 5,
            'tanggal' => $today,
        ]);
        $guest->assertRedirect('/staff/login');

        $customer = $this->actingAs($this->regulerUser, 'web')
            ->post('/kasir/restock', [
                'id_produk' => $existing->id_produk,
                'jumlah' => 5,
                'tanggal' => $today,
            ]);
        $customer->assertRedirect('/staff/login');

        $admin = $this->actingAs($this->adminUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $existing->id_produk,
                'jumlah' => 5,
                'tanggal' => $today,
            ]);
        $admin->assertStatus(403);
    }

    public function test_stok_opname_updates_stock_and_validates_keterangan(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Senar Raket BG66',
            'kategori' => 'Peralatan',
            'harga' => 90000,
            'stok' => 10,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $missingKetResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/opname', [
                'items' => [
                    [
                        'id_produk' => $produk->id_produk,
                        'stok_fisik' => 8,
                        'keterangan' => '',
                    ],
                ],
            ]);
        $missingKetResponse->assertSessionHasErrors('items.0.keterangan');

        $successResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/opname', [
                'items' => [
                    [
                        'id_produk' => $produk->id_produk,
                        'stok_fisik' => 8,
                        'keterangan' => '2 pcs rusak saat disimpan',
                    ],
                ],
            ]);
        $successResponse->assertRedirect('/kasir/opname');

        $produk->refresh();
        $this->assertEquals(8, $produk->stok);

        $this->assertDatabaseHas('stock_opname', [
            'id_produk' => $produk->id_produk,
            'stok_sistem' => 10,
            'stok_fisik' => 8,
            'selisih' => -2,
            'keterangan' => '2 pcs rusak saat disimpan',
        ]);
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'STOCK_OPNAME',
        ]);
    }

    public function test_void_retur_succeeds_on_own_selesai_transaction_in_open_shift(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Grip Karet Yonex',
            'kategori' => 'Aksesoris',
            'harga' => 20000,
            'stok' => 10,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $tx = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-8881',
            'tanggal' => now(),
            'subtotal' => 40000,
            'diskon' => 0,
            'total' => 40000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 50000,
            'kembalian' => 10000,
            'status_transaksi' => 'selesai',
        ]);

        DetailTransaksiPos::create([
            'id_transaksi' => $tx->id_transaksi,
            'id_produk' => $produk->id_produk,
            'jumlah' => 2,
            'harga' => 20000,
            'subtotal' => 40000,
        ]);
        $produk->decrement('stok', 2);
        $this->assertEquals(8, $produk->fresh()->stok);

        $shortAlasanResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $tx->id_transaksi,
                'jenis' => 'void',
                'alasan' => 'fail',
            ]);
        $shortAlasanResponse->assertSessionHasErrors('alasan');

        $successResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $tx->id_transaksi,
                'jenis' => 'void',
                'alasan' => 'Pelanggan membatalkan pesanan',
            ]);
        $successResponse->assertRedirect('/kasir/void');

        $tx->refresh();
        $this->assertEquals('void', $tx->status_transaksi);
        $this->assertEquals(10, $produk->fresh()->stok);

        $this->assertDatabaseHas('retur_void', [
            'id_transaksi' => $tx->id_transaksi,
            'id_user' => $this->kasirUser->id_user,
            'id_admin' => null,
            'jenis' => 'void',
            'status' => 'disetujui',
            'alasan' => 'Pelanggan membatalkan pesanan',
        ]);

        $secondCall = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $tx->id_transaksi,
                'jenis' => 'void',
                'alasan' => 'Coba lagi kedua kali',
            ]);
        $secondCall->assertSessionHasErrors('id_transaksi');
    }

    public function test_void_retur_rejects_other_kasir_or_closed_shift_transaction(): void
    {
        $shiftOther = ShiftKasir::create([
            'id_user' => $this->otherKasir->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $txOther = TransaksiPos::create([
            'id_user' => $this->otherKasir->id_user,
            'id_shift' => $shiftOther->id_shift,
            'no_transaksi' => 'KSR-20261011-7771',
            'tanggal' => now(),
            'subtotal' => 20000,
            'diskon' => 0,
            'total' => 20000,
            'metode_bayar' => 'tunai',
            'status_transaksi' => 'selesai',
        ]);

        ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $otherKasirResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $txOther->id_transaksi,
                'jenis' => 'void',
                'alasan' => 'Bukan transaksi saya',
            ]);
        $otherKasirResponse->assertSessionHasErrors('id_transaksi');

        $closedShift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now()->subDay(),
            'waktu_tutup' => now()->subDay(),
            'modal_awal' => 100000,
            'status' => 'ditutup',
        ]);

        $txClosed = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $closedShift->id_shift,
            'no_transaksi' => 'KSR-20261010-0001',
            'tanggal' => now()->subDay(),
            'subtotal' => 20000,
            'diskon' => 0,
            'total' => 20000,
            'metode_bayar' => 'tunai',
            'status_transaksi' => 'selesai',
        ]);

        $closedShiftResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $txClosed->id_transaksi,
                'jenis' => 'void',
                'alasan' => 'Shift sudah ditutup',
            ]);
        $closedShiftResponse->assertSessionHasErrors('id_transaksi');
    }

    public function test_shift_close_and_admin_laporan_exclude_void_and_retur(): void
    {
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $txSelesai = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-1001',
            'tanggal' => now(),
            'subtotal' => 50000,
            'diskon' => 0,
            'total' => 50000,
            'metode_bayar' => 'tunai',
            'status_transaksi' => 'selesai',
        ]);

        $txVoid = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-1002',
            'tanggal' => now(),
            'subtotal' => 30000,
            'diskon' => 0,
            'total' => 30000,
            'metode_bayar' => 'tunai',
            'status_transaksi' => 'void',
        ]);

        ReturVoid::create([
            'id_transaksi' => $txVoid->id_transaksi,
            'id_user' => $this->kasirUser->id_user,
            'id_admin' => null,
            'jenis' => 'void',
            'alasan' => 'Dibatalkan kasir',
            'status' => 'disetujui',
            'tanggal' => now(),
        ]);

        $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/shift/tutup', [
                'kas_fisik' => 150000,
            ]);

        $shift->refresh();
        $this->assertEquals(150000, (float) $shift->kas_sistem);
        $this->assertEquals(0, (float) $shift->selisih);

        $adminResponse = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $adminResponse->assertStatus(200);
        $adminResponse->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_pos', 50000)
            ->where('ringkasan.total_nominal_void_retur', 30000)
            ->where('ringkasan.jumlah_void_retur', 1)
        );
    }

    public function test_role_guards_on_kasir_and_admin_laporan_routes(): void
    {
        $this->get('/admin/laporan')->assertRedirect('/staff/login');
        $this->actingAs($this->regulerUser, 'web')->get('/admin/laporan')->assertRedirect('/staff/login');
        $this->actingAs($this->kasirUser, 'staff')->get('/admin/laporan')->assertStatus(403);

        $this->actingAs($this->adminUser, 'staff')->get('/kasir/produk')->assertStatus(403);
        $this->actingAs($this->adminUser, 'staff')->get('/kasir/restock')->assertStatus(403);
        $this->actingAs($this->adminUser, 'staff')->get('/kasir/opname')->assertStatus(403);
        $this->actingAs($this->adminUser, 'staff')->get('/kasir/void')->assertStatus(403);
    }

    public function test_stok_opname_ignores_client_stok_sistem_and_uses_database_stock(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Shuttlecock Slazenger',
            'kategori' => 'Peralatan',
            'harga' => 85000,
            'stok' => 15,
            'stok_minimum' => 3,
            'status_produk' => 'aktif',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/opname', [
                'items' => [
                    [
                        'id_produk' => $produk->id_produk,
                        'stok_sistem' => 999,
                        'stok_fisik' => 12,
                        'keterangan' => '3 slop rusak terkena air',
                    ],
                ],
            ]);

        $response->assertRedirect('/kasir/opname');

        $this->assertDatabaseHas('stock_opname', [
            'id_produk' => $produk->id_produk,
            'stok_sistem' => 15,
            'stok_fisik' => 12,
            'selisih' => -3,
        ]);

        $this->assertEquals(12, $produk->fresh()->stok);
    }

    public function test_restock_rejects_negative_quantity_and_stock_remains_unchanged(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Jersey Latihan Dryfit',
            'kategori' => 'Pakaian',
            'harga' => 75000,
            'stok' => 8,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/restock', [
                'id_produk' => $produk->id_produk,
                'jumlah' => -5,
                'tanggal' => $today,
            ]);

        $response->assertSessionHasErrors('jumlah');
        $this->assertEquals(8, $produk->fresh()->stok);
        $this->assertDatabaseMissing('restock', [
            'id_produk' => $produk->id_produk,
        ]);
    }

    public function test_void_retur_rejects_already_voided_returned_or_has_retur_void_row(): void
    {
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $txVoid = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-5551',
            'tanggal' => now(),
            'subtotal' => 20000,
            'diskon' => 0,
            'total' => 20000,
            'metode_bayar' => 'tunai',
            'status_transaksi' => 'void',
        ]);

        $txRetur = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-5552',
            'tanggal' => now(),
            'subtotal' => 30000,
            'diskon' => 0,
            'total' => 30000,
            'metode_bayar' => 'tunai',
            'status_transaksi' => 'retur',
        ]);

        $voidOnVoid = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $txVoid->id_transaksi,
                'jenis' => 'void',
                'alasan' => 'Mencoba void transaksi void',
            ]);
        $voidOnVoid->assertSessionHasErrors('id_transaksi');

        $voidOnRetur = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $txRetur->id_transaksi,
                'jenis' => 'retur',
                'alasan' => 'Mencoba retur transaksi retur',
            ]);
        $voidOnRetur->assertSessionHasErrors('id_transaksi');

        $txSelesaiWithRow = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-5553',
            'tanggal' => now(),
            'subtotal' => 15000,
            'diskon' => 0,
            'total' => 15000,
            'metode_bayar' => 'tunai',
            'status_transaksi' => 'selesai',
        ]);

        ReturVoid::create([
            'id_transaksi' => $txSelesaiWithRow->id_transaksi,
            'id_user' => $this->kasirUser->id_user,
            'id_admin' => null,
            'jenis' => 'void',
            'alasan' => 'Baris retur void sudah ada',
            'status' => 'disetujui',
            'tanggal' => now(),
        ]);

        $hasRowResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $txSelesaiWithRow->id_transaksi,
                'jenis' => 'void',
                'alasan' => 'Mencoba mengajukan ulang',
            ]);
        $hasRowResponse->assertSessionHasErrors('id_transaksi');
    }

    public function test_retur_succeeds_sets_status_retur_and_returns_stock(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Grip Karet Li-Ning',
            'kategori' => 'Aksesoris',
            'harga' => 18000,
            'stok' => 12,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $tx = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-6661',
            'tanggal' => now(),
            'subtotal' => 36000,
            'diskon' => 0,
            'total' => 36000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 50000,
            'kembalian' => 14000,
            'status_transaksi' => 'selesai',
        ]);

        DetailTransaksiPos::create([
            'id_transaksi' => $tx->id_transaksi,
            'id_produk' => $produk->id_produk,
            'jumlah' => 2,
            'harga' => 18000,
            'subtotal' => 36000,
        ]);
        $produk->decrement('stok', 2);
        $this->assertEquals(10, $produk->fresh()->stok);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/void', [
                'id_transaksi' => $tx->id_transaksi,
                'jenis' => 'retur',
                'alasan' => 'Barang cacat pabrik dikembalikan pembeli',
            ]);

        $response->assertRedirect('/kasir/void');

        $tx->refresh();
        $this->assertEquals('retur', $tx->status_transaksi);
        $this->assertEquals(12, $produk->fresh()->stok);

        $this->assertDatabaseHas('retur_void', [
            'id_transaksi' => $tx->id_transaksi,
            'id_user' => $this->kasirUser->id_user,
            'jenis' => 'retur',
            'status' => 'disetujui',
            'alasan' => 'Barang cacat pabrik dikembalikan pembeli',
        ]);
    }

    public function test_product_update_ignores_client_stok_and_no_delete_route_exists(): void
    {
        $produk = Produk::create([
            'nama_produk' => 'Wristband Polos',
            'kategori' => 'Aksesoris',
            'harga' => 10000,
            'stok' => 7,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->put('/kasir/produk/' . $produk->id_produk, [
                'nama_produk' => 'Wristband Polos Hitam',
                'kategori' => 'Aksesoris',
                'harga' => 12000,
                'stok' => 999,
                'stok_minimum' => 2,
                'status_produk' => 'aktif',
            ]);

        $response->assertRedirect('/kasir/produk');

        $produk->refresh();
        $this->assertEquals('Wristband Polos Hitam', $produk->nama_produk);
        $this->assertEquals(12000, (float) $produk->harga);
        $this->assertEquals(7, $produk->stok);

        $deleteResponse = $this->actingAs($this->kasirUser, 'staff')
            ->delete('/kasir/produk/' . $produk->id_produk);
        $this->assertTrue(in_array($deleteResponse->status(), [404, 405], true));
    }

    public function test_admin_laporan_rejects_write_methods(): void
    {
        $postResponse = $this->actingAs($this->adminUser, 'staff')->post('/admin/laporan', []);
        $this->assertTrue(in_array($postResponse->status(), [404, 405], true));

        $putResponse = $this->actingAs($this->adminUser, 'staff')->put('/admin/laporan', []);
        $this->assertTrue(in_array($putResponse->status(), [404, 405], true));

        $patchResponse = $this->actingAs($this->adminUser, 'staff')->patch('/admin/laporan', []);
        $this->assertTrue(in_array($patchResponse->status(), [404, 405], true));

        $deleteResponse = $this->actingAs($this->adminUser, 'staff')->delete('/admin/laporan');
        $this->assertTrue(in_array($deleteResponse->status(), [404, 405], true));
    }

    public function test_guest_and_customer_are_rejected_from_kasir_k2_routes(): void
    {
        $routes = [
            '/kasir/produk',
            '/kasir/restock',
            '/kasir/opname',
            '/kasir/void',
        ];

        foreach ($routes as $route) {
            $this->get($route)->assertRedirect('/staff/login');
            $this->actingAs($this->regulerUser, 'web')->get($route)->assertRedirect('/staff/login');
        }
    }
}

