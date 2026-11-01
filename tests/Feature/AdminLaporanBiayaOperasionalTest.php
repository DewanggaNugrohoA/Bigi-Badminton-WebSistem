<?php

namespace Tests\Feature;

use App\Models\BiayaOperasional;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx as XlsxReader;
use Tests\TestCase;

class AdminLaporanBiayaOperasionalTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $customerUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'nama' => 'Admin Keuangan',
            'email' => 'admin.keuangan@bigi.test',
            'no_whatsapp' => '081299990001',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->customerUser = User::create([
            'nama' => 'Pelanggan Setia',
            'email' => 'pelanggan@bigi.test',
            'no_whatsapp' => '081299990002',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);
    }

    /**
     * Test 3 biaya di periode yang sama:
     * - Listrik 500.000
     * - WiFi 300.000
     * - Gas 100.000
     * Biaya di luar periode tidak ikut.
     * Rincian muncul 3 baris, total 900.000, subtotal per jenis benar, laba bersih = pendapatan - 900.000.
     */
    public function test_rincian_biaya_operasional_muncul_sesuai_periode_dan_laba_bersih_akurat(): void
    {
        $lapangan = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 60000,
            'status_lapangan' => 'tersedia',
        ]);

        // Pendapatan Sewa Lapangan Valid = Rp 1.500.000 pada 2026-10-15
        $reservasi = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'no_reservasi' => 'RES-20261015-001',
            'nama_pemesan' => 'Pelanggan Setia',
            'no_whatsapp_pemesan' => '081299990002',
            'tanggal_pemesanan' => '2026-10-15',
            'total_biaya' => 1500000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $reservasi->id_reservasi,
            'id_lapangan' => $lapangan->id_lapangan,
            'tanggal_main' => '2026-10-15',
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '10:00:00',
            'durasi' => 120,
            'subtotal' => 1500000,
        ]);

        Pembayaran::create([
            'id_reservasi' => $reservasi->id_reservasi,
            'jenis_pembayaran' => 'Lunas',
            'metode_pembayaran' => 'transfer',
            'jumlah' => 1500000,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
            'tanggal_pembayaran' => '2026-10-15',
        ]);

        // 3 Biaya dalam periode (2026-10-01 s/d 2026-10-31)
        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'Listrik',
            'tanggal_biaya' => '2026-10-10',
            'jumlah' => 500000,
            'keterangan' => 'Tagihan PLN',
        ]);

        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'WiFi',
            'tanggal_biaya' => '2026-10-12',
            'jumlah' => 300000,
            'keterangan' => 'Tagihan Internet',
        ]);

        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'Gas',
            'tanggal_biaya' => '2026-10-18',
            'jumlah' => 100000,
            'keterangan' => 'Isi Ulang Gas',
        ]);

        // 1 Biaya DI LUAR periode (2026-11-05) -> Tidak boleh ikut
        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'Perlengkapan',
            'tanggal_biaya' => '2026-11-05',
            'jumlah' => 250000,
            'keterangan' => 'Beli Shuttlecock',
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/laporan?start_date=2026-10-01&end_date=2026-10-31');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_sewa_lapangan', 1500000)
            ->where('ringkasan.total_pendapatan_kotor', 1500000)
            ->where('ringkasan.total_biaya_operasional', 900000)
            ->where('ringkasan.laba_bersih', 600000) // 1.500.000 - 900.000 = 600.000
            // Rincian item harus ada 3 baris
            ->has('ringkasan.biaya_operasional_items', 3)
            ->where('ringkasan.biaya_operasional_items.0.jenis_pengeluaran', 'Listrik')
            ->where('ringkasan.biaya_operasional_items.0.jumlah', 500000)
            ->where('ringkasan.biaya_operasional_items.0.tanggal_biaya', '2026-10-10')
            ->where('ringkasan.biaya_operasional_items.1.jenis_pengeluaran', 'WiFi')
            ->where('ringkasan.biaya_operasional_items.1.jumlah', 300000)
            ->where('ringkasan.biaya_operasional_items.1.tanggal_biaya', '2026-10-12')
            ->where('ringkasan.biaya_operasional_items.2.jenis_pengeluaran', 'Gas')
            ->where('ringkasan.biaya_operasional_items.2.jumlah', 100000)
            ->where('ringkasan.biaya_operasional_items.2.tanggal_biaya', '2026-10-18')
            // Subtotal per jenis harus terurut nominal terbesar ke terkecil
            ->has('ringkasan.ringkasan_kategori_biaya', 3)
            ->where('ringkasan.ringkasan_kategori_biaya.0.jenis', 'Listrik')
            ->where('ringkasan.ringkasan_kategori_biaya.0.total', 500000)
            ->where('ringkasan.ringkasan_kategori_biaya.1.jenis', 'WiFi')
            ->where('ringkasan.ringkasan_kategori_biaya.1.total', 300000)
            ->where('ringkasan.ringkasan_kategori_biaya.2.jenis', 'Gas')
            ->where('ringkasan.ringkasan_kategori_biaya.2.total', 100000)
        );
    }

    /**
     * Test rincian biaya operasional dan subtotal per jenis muncul di ekspor Excel.
     */
    public function test_rincian_biaya_operasional_dan_subtotal_muncul_di_ekspor_excel(): void
    {
        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'Listrik',
            'tanggal_biaya' => '2026-10-10',
            'jumlah' => 500000,
            'keterangan' => 'Tagihan PLN',
        ]);

        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'WiFi',
            'tanggal_biaya' => '2026-10-12',
            'jumlah' => 300000,
            'keterangan' => 'Tagihan Internet',
        ]);

        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'Gas',
            'tanggal_biaya' => '2026-10-18',
            'jumlah' => 100000,
            'keterangan' => 'Isi Ulang Gas',
        ]);

        // Di luar periode
        BiayaOperasional::create([
            'id_user' => $this->adminUser->id_user,
            'jenis_pengeluaran' => 'Perlengkapan',
            'tanggal_biaya' => '2026-11-05',
            'jumlah' => 250000,
            'keterangan' => 'Beli Shuttlecock',
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/laporan/ekspor?start_date=2026-10-01&end_date=2026-10-31');

        $response->assertStatus(200);

        $content = $response->streamedContent();
        $this->assertNotEmpty($content);

        $tempPath = tempnam(sys_get_temp_dir(), 'bigi_excel_test_') . '.xlsx';
        file_put_contents($tempPath, $content);

        try {
            $reader = new XlsxReader();
            $spreadsheet = $reader->load($tempPath);

            // Sheet tetap 10 (tidak bertambah sheet baru)
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

            // Cell C22: Total Biaya Operasional = 900.000
            $valBiayaTotal = (float) $sheetRingkasan->getCell('C22')->getValue();
            $this->assertEquals(900000, $valBiayaTotal);

            // Cari section RINCIAN PENGELUARAN OPERASIONAL dan cek rincian
            $foundRincianTitle = false;
            $foundSubtotalTitle = false;
            $foundTotalFooter = false;
            $listrikFound = false;
            $wifiFound = false;
            $gasFound = false;
            $perlengkapanFound = false;

            $highestRow = $sheetRingkasan->getHighestRow();
            for ($r = 24; $r <= $highestRow; $r++) {
                $valA = (string) $sheetRingkasan->getCell("A{$r}")->getValue();
                $valB = (string) $sheetRingkasan->getCell("B{$r}")->getValue();
                $valD = (float) $sheetRingkasan->getCell("D{$r}")->getValue();

                if (str_contains($valA, 'RINGKASAN BIAYA OPERASIONAL PER JENIS')) {
                    $foundSubtotalTitle = true;
                }
                if (str_contains($valA, 'RINCIAN PENGELUARAN OPERASIONAL')) {
                    $foundRincianTitle = true;
                }
                if ($valA === 'Listrik' || $valB === 'Listrik') {
                    $listrikFound = true;
                }
                if ($valA === 'WiFi' || $valB === 'WiFi') {
                    $wifiFound = true;
                }
                if ($valA === 'Gas' || $valB === 'Gas') {
                    $gasFound = true;
                }
                if ($valA === 'Perlengkapan' || $valB === 'Perlengkapan') {
                    $perlengkapanFound = true;
                }
                if (str_contains($valA, 'TOTAL PENGELUARAN OPERASIONAL')) {
                    $foundTotalFooter = true;
                    $this->assertEquals(900000, $valD);
                }
            }

            $this->assertTrue($foundSubtotalTitle, 'Judul ringkasan per jenis harus ditemukan di sheet Ringkasan');
            $this->assertTrue($foundRincianTitle, 'Judul rincian pengeluaran operasional harus ditemukan di sheet Ringkasan');
            $this->assertTrue($listrikFound, 'Listrik harus ada di rincian Excel');
            $this->assertTrue($wifiFound, 'WiFi harus ada di rincian Excel');
            $this->assertTrue($gasFound, 'Gas harus ada di rincian Excel');
            $this->assertFalse($perlengkapanFound, 'Perlengkapan (di luar periode) TIDAK boleh ada di Excel');
            $this->assertTrue($foundTotalFooter, 'Footer TOTAL PENGELUARAN OPERASIONAL harus ditemukan di Excel');
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * Test periode tanpa biaya operasional menghasilkan rincian kosong dan pesan yang tepat.
     */
    public function test_periode_tanpa_biaya_operasional_menampilkan_pesan_kosong(): void
    {
        $response = $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/laporan?start_date=2026-08-01&end_date=2026-08-05');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.total_biaya_operasional', 0)
            ->has('ringkasan.biaya_operasional_items', 0)
            ->has('ringkasan.ringkasan_kategori_biaya', 0)
        );

        $eksporRes = $this->actingAs($this->adminUser, 'staff')
            ->get('/admin/laporan/ekspor?start_date=2026-08-01&end_date=2026-08-05');

        $eksporRes->assertStatus(200);
        $content = $eksporRes->streamedContent();

        $tempPath = tempnam(sys_get_temp_dir(), 'bigi_excel_test_') . '.xlsx';
        file_put_contents($tempPath, $content);

        try {
            $reader = new XlsxReader();
            $spreadsheet = $reader->load($tempPath);
            $sheetRingkasan = $spreadsheet->getSheetByName('Ringkasan');

            $highestRow = $sheetRingkasan->getHighestRow();
            $pesanKosongFound = false;
            for ($r = 24; $r <= $highestRow; $r++) {
                $valA = (string) $sheetRingkasan->getCell("A{$r}")->getValue();
                if (str_contains($valA, 'Tidak ada pengeluaran operasional pada periode ini')) {
                    $pesanKosongFound = true;
                    break;
                }
            }
            $this->assertTrue($pesanKosongFound, 'Pesan "Tidak ada pengeluaran operasional pada periode ini" harus muncul di Excel saat kosong');
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }
}
