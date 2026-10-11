<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\DetailTransaksiPos;
use App\Models\Produk;
use App\Models\ShiftKasir;
use App\Models\TransaksiPos;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class KasirPosModuleTest extends TestCase
{
    use RefreshDatabase;

    protected User $kasirUser;
    protected User $otherKasir;
    protected User $adminUser;
    protected User $regulerUser;
    protected Produk $produkAktif1;
    protected Produk $produkAktif2;
    protected Produk $produkNonaktif;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->kasirUser = User::create([
            'nama' => 'Budi Kasir',
            'email' => 'budikasir@bigi.internal',
            'no_whatsapp' => '087700010001',
            'password' => Hash::make('KasirPass123!'),
            'role' => 'kasir',
            'status_akun' => 'aktif',
        ]);

        $this->otherKasir = User::create([
            'nama' => 'Siti Kasir',
            'email' => 'sitikasir@bigi.internal',
            'no_whatsapp' => '087700010002',
            'password' => Hash::make('KasirPass123!'),
            'role' => 'kasir',
            'status_akun' => 'aktif',
        ]);

        $this->adminUser = User::create([
            'nama' => 'Super Admin',
            'email' => 'admin@bigi.internal',
            'no_whatsapp' => '087700010003',
            'password' => Hash::make('AdminPass123!'),
            'role' => 'admin',
            'status_akun' => 'aktif',
        ]);

        $this->regulerUser = User::create([
            'nama' => 'Pelanggan Biasa',
            'email' => 'member@bigi.internal',
            'no_whatsapp' => '087700010004',
            'password' => Hash::make('MemberPass123!'),
            'role' => 'user',
            'status_akun' => 'aktif',
        ]);

        $this->produkAktif1 = Produk::create([
            'nama_produk' => 'Air Mineral 600ml',
            'kategori' => 'Minuman',
            'harga' => 5000,
            'stok' => 20,
            'stok_minimum' => 5,
            'status_produk' => 'aktif',
        ]);

        $this->produkAktif2 = Produk::create([
            'nama_produk' => 'Grip Raket Karet',
            'kategori' => 'Aksesoris',
            'harga' => 15000,
            'stok' => 10,
            'stok_minimum' => 2,
            'status_produk' => 'aktif',
        ]);

        $this->produkNonaktif = Produk::create([
            'nama_produk' => 'Shuttlecock Second',
            'kategori' => 'Peralatan',
            'harga' => 2500,
            'stok' => 50,
            'stok_minimum' => 5,
            'status_produk' => 'nonaktif',
        ]);
    }

    public function test_guest_is_redirected_to_staff_login_when_accessing_kasir(): void
    {
        $response = $this->get('/kasir');
        $response->assertRedirect('/staff/login');
    }

    public function test_regular_customer_cannot_access_kasir(): void
    {
        $response = $this->actingAs($this->regulerUser, 'web')->get('/kasir');
        $response->assertRedirect('/staff/login');
    }

    public function test_admin_gets_403_when_accessing_kasir(): void
    {
        $response = $this->actingAs($this->adminUser, 'staff')->get('/kasir');
        $response->assertStatus(403);
    }

    public function test_kasir_can_access_kasir_pages(): void
    {
        $response = $this->actingAs($this->kasirUser, 'staff')->get('/kasir');
        $response->assertStatus(200);

        $shiftResponse = $this->actingAs($this->kasirUser, 'staff')->get('/kasir/shift');
        $shiftResponse->assertStatus(200);

        $riwayatResponse = $this->actingAs($this->kasirUser, 'staff')->get('/kasir/riwayat');
        $riwayatResponse->assertStatus(200);
    }

    public function test_kasir_can_open_shift(): void
    {
        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/shift/buka', [
                'modal_awal' => 100000,
            ]);

        $response->assertRedirect('/kasir');
        $this->assertDatabaseHas('shift_kasir', [
            'id_user' => $this->kasirUser->id_user,
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'BUKA_SHIFT',
        ]);
    }

    public function test_kasir_cannot_open_more_than_one_shift_at_a_time(): void
    {
        ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/shift/buka', [
                'modal_awal' => 200000,
            ]);

        $response->assertSessionHasErrors('modal_awal');
        $this->assertEquals(1, ShiftKasir::where('id_user', $this->kasirUser->id_user)->count());
    }

    public function test_cannot_sell_without_an_open_shift(): void
    {
        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/checkout', [
                'items' => [
                    ['id_produk' => $this->produkAktif1->id_produk, 'jumlah' => 2],
                ],
                'metode_bayar' => 'tunai',
                'uang_diterima' => 20000,
            ]);

        $response->assertSessionHasErrors('shift');
        $this->assertDatabaseCount('transaksi_pos', 0);
    }

    public function test_sale_decrements_stok_and_snapshots_db_price_ignoring_client(): void
    {
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/checkout', [
                'items' => [
                    ['id_produk' => $this->produkAktif1->id_produk, 'jumlah' => 2, 'harga' => 100],
                    ['id_produk' => $this->produkAktif2->id_produk, 'jumlah' => 1, 'harga' => 500],
                ],
                'metode_bayar' => 'tunai',
                'uang_diterima' => 30000,
            ]);

        $transaksi = TransaksiPos::first();
        $this->assertNotNull($transaksi);
        $response->assertRedirect('/kasir/struk/' . $transaksi->id_transaksi);

        $this->assertEquals(25000, (float) $transaksi->total);
        $this->assertEquals(30000, (float) $transaksi->uang_diterima);
        $this->assertEquals(5000, (float) $transaksi->kembalian);
        $this->assertStringStartsWith('KSR-', $transaksi->no_transaksi);

        $this->produkAktif1->refresh();
        $this->produkAktif2->refresh();
        $this->assertEquals(18, $this->produkAktif1->stok);
        $this->assertEquals(9, $this->produkAktif2->stok);

        $this->assertDatabaseHas('detail_transaksi_pos', [
            'id_transaksi' => $transaksi->id_transaksi,
            'id_produk' => $this->produkAktif1->id_produk,
            'jumlah' => 2,
            'harga' => 5000,
            'subtotal' => 10000,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'PENJUALAN_POS',
        ]);
    }

    public function test_insufficient_stock_is_rejected_with_all_or_nothing_rollback(): void
    {
        ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/checkout', [
                'items' => [
                    ['id_produk' => $this->produkAktif1->id_produk, 'jumlah' => 2],
                    ['id_produk' => $this->produkAktif2->id_produk, 'jumlah' => 999],
                ],
                'metode_bayar' => 'tunai',
                'uang_diterima' => 10000000,
            ]);

        $response->assertSessionHasErrors('items');
        $this->assertDatabaseCount('transaksi_pos', 0);
        $this->assertDatabaseCount('detail_transaksi_pos', 0);

        $this->produkAktif1->refresh();
        $this->produkAktif2->refresh();
        $this->assertEquals(20, $this->produkAktif1->stok);
        $this->assertEquals(10, $this->produkAktif2->stok);
    }

    public function test_inactive_product_is_rejected(): void
    {
        ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/checkout', [
                'items' => [
                    ['id_produk' => $this->produkNonaktif->id_produk, 'jumlah' => 1],
                ],
                'metode_bayar' => 'tunai',
                'uang_diterima' => 10000,
            ]);

        $response->assertSessionHasErrors('items');
        $this->assertDatabaseCount('transaksi_pos', 0);
    }

    public function test_cash_received_less_than_total_is_rejected(): void
    {
        ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/checkout', [
                'items' => [
                    ['id_produk' => $this->produkAktif1->id_produk, 'jumlah' => 2],
                ],
                'metode_bayar' => 'tunai',
                'uang_diterima' => 5000,
            ]);

        $response->assertSessionHasErrors('uang_diterima');
        $this->assertDatabaseCount('transaksi_pos', 0);
    }

    public function test_qris_sale_succeeds_without_cash_received(): void
    {
        ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/checkout', [
                'items' => [
                    ['id_produk' => $this->produkAktif1->id_produk, 'jumlah' => 1],
                ],
                'metode_bayar' => 'qris',
            ]);

        $transaksi = TransaksiPos::first();
        $this->assertNotNull($transaksi);
        $this->assertEquals('qris', $transaksi->metode_bayar);
        $this->assertNull($transaksi->uang_diterima);
        $this->assertNull($transaksi->kembalian);
    }

    public function test_closing_shift_computes_expected_cash_and_selisih(): void
    {
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-0001',
            'tanggal' => now(),
            'subtotal' => 20000,
            'diskon' => 0,
            'total' => 20000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 20000,
            'kembalian' => 0,
            'status_transaksi' => 'selesai',
        ]);

        TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift->id_shift,
            'no_transaksi' => 'KSR-20261011-0002',
            'tanggal' => now(),
            'subtotal' => 50000,
            'diskon' => 0,
            'total' => 50000,
            'metode_bayar' => 'qris',
            'status_transaksi' => 'selesai',
        ]);

        $response = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/shift/tutup', [
                'kas_fisik' => 115000,
            ]);

        $response->assertRedirect('/kasir/shift');

        $shift->refresh();
        $this->assertEquals('ditutup', $shift->status);
        $this->assertEquals(120000, (float) $shift->kas_sistem);
        $this->assertEquals(115000, (float) $shift->kas_fisik);
        $this->assertEquals(-5000, (float) $shift->selisih);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->kasirUser->id_user,
            'aksi' => 'TUTUP_SHIFT',
        ]);
    }

    public function test_closed_shift_cannot_be_reopened_or_used_for_sales(): void
    {
        $shift = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'waktu_tutup' => now(),
            'modal_awal' => 100000,
            'kas_sistem' => 100000,
            'kas_fisik' => 100000,
            'selisih' => 0,
            'status' => 'ditutup',
        ]);

        $closeResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/shift/tutup', [
                'kas_fisik' => 100000,
            ]);
        $closeResponse->assertSessionHasErrors('kas_fisik');

        $checkoutResponse = $this->actingAs($this->kasirUser, 'staff')
            ->post('/kasir/checkout', [
                'items' => [
                    ['id_produk' => $this->produkAktif1->id_produk, 'jumlah' => 1],
                ],
                'metode_bayar' => 'tunai',
                'uang_diterima' => 10000,
            ]);
        $checkoutResponse->assertSessionHasErrors('shift');
    }

    public function test_kasir_sees_only_own_transactions_and_struk(): void
    {
        $shift1 = ShiftKasir::create([
            'id_user' => $this->kasirUser->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'terbuka',
        ]);

        $trx1 = TransaksiPos::create([
            'id_user' => $this->kasirUser->id_user,
            'id_shift' => $shift1->id_shift,
            'no_transaksi' => 'KSR-20261011-0001',
            'tanggal' => now(),
            'subtotal' => 10000,
            'diskon' => 0,
            'total' => 10000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 10000,
            'kembalian' => 0,
            'status_transaksi' => 'selesai',
        ]);

        $shift2 = ShiftKasir::create([
            'id_user' => $this->otherKasir->id_user,
            'waktu_buka' => now(),
            'modal_awal' => 50000,
            'status' => 'terbuka',
        ]);

        $trx2 = TransaksiPos::create([
            'id_user' => $this->otherKasir->id_user,
            'id_shift' => $shift2->id_shift,
            'no_transaksi' => 'KSR-20261011-0002',
            'tanggal' => now(),
            'subtotal' => 20000,
            'diskon' => 0,
            'total' => 20000,
            'metode_bayar' => 'tunai',
            'uang_diterima' => 20000,
            'kembalian' => 0,
            'status_transaksi' => 'selesai',
        ]);

        $this->actingAs($this->kasirUser, 'staff')
            ->get('/kasir/struk/' . $trx1->id_transaksi)
            ->assertStatus(200);

        $this->actingAs($this->kasirUser, 'staff')
            ->get('/kasir/struk/' . $trx2->id_transaksi)
            ->assertStatus(404);
    }
}
