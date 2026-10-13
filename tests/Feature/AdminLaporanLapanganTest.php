<?php

namespace Tests\Feature;

use App\Models\Lapangan;
use App\Models\PemeriksaanLapangan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use Tests\TestCase;

class AdminLaporanLapanganTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $kasirUser;
    private User $customerUser;
    private Lapangan $lapangan1;
    private Lapangan $lapangan2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'nama' => 'Admin Pengelola',
            'email' => 'admin.laporan@example.com',
            'no_whatsapp' => '081211112222',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasirUser = User::create([
            'nama' => 'Kasir Operasional',
            'email' => 'kasir.laporan@example.com',
            'no_whatsapp' => '081233334444',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->customerUser = User::create([
            'nama' => 'Pemain Reguler',
            'email' => 'user.biasa@example.com',
            'no_whatsapp' => '081255556666',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->lapangan1 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 60000,
            'status_lapangan' => Lapangan::STATUS_TERSEDIA,
        ]);

        $this->lapangan2 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 2',
            'harga_per_jam' => 60000,
            'status_lapangan' => Lapangan::STATUS_TERSEDIA,
        ]);
    }

    public function test_simpan_pemeriksaan_berhasil_dan_catat_audit_log_dan_status_lapangan_tidak_berubah(): void
    {
        $payload = [
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_pemeriksaan' => Carbon::today('Asia/Jakarta')->format('Y-m-d'),
            'karpet_vinil' => 'rusak_ringan',
            'net' => 'baik',
            'tiang' => 'baik',
            'lampu' => 'rusak_sedang',
            'lantai' => 'baik',
            'dinding' => 'baik',
            'catatan' => 'Lampu baris tengah redup satu titik.',
        ];

        $response = $this->actingAs($this->adminUser, 'staff')
            ->post('/admin/laporan/pemeriksaan-lapangan', $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('pemeriksaan_lapangan', [
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'diperiksa_oleh' => $this->adminUser->id_user,
            'karpet_vinil' => 'rusak_ringan',
            'lampu' => 'rusak_sedang',
            'catatan' => 'Lampu baris tengah redup satu titik.',
        ]);

        // Status lapangan tidak boleh berubah (murni riwayat)
        $this->lapangan1->refresh();
        $this->assertEquals(Lapangan::STATUS_TERSEDIA, $this->lapangan1->status_lapangan);

        // Audit log tercatat dengan aktor admin
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->adminUser->id_user,
            'aksi' => 'PEMERIKSAAN_LAPANGAN',
            'objek' => 'lapangan',
        ]);
    }

    public function test_dua_pemeriksaan_pada_lapangan_dan_tanggal_yang_sama_menjadi_dua_baris_tidak_tertimpa(): void
    {
        $tanggal = Carbon::today('Asia/Jakarta')->format('Y-m-d');

        $payload1 = [
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_pemeriksaan' => $tanggal,
            'karpet_vinil' => 'baik',
            'net' => 'baik',
            'tiang' => 'baik',
            'lampu' => 'baik',
            'lantai' => 'baik',
            'dinding' => 'baik',
            'catatan' => 'Pemeriksaan sesi pagi.',
        ];

        $payload2 = [
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_pemeriksaan' => $tanggal,
            'karpet_vinil' => 'rusak_ringan',
            'net' => 'baik',
            'tiang' => 'baik',
            'lampu' => 'baik',
            'lantai' => 'baik',
            'dinding' => 'baik',
            'catatan' => 'Pemeriksaan sesi sore setelah main.',
        ];

        $this->actingAs($this->adminUser, 'staff')->post('/admin/laporan/pemeriksaan-lapangan', $payload1);
        $this->actingAs($this->adminUser, 'staff')->post('/admin/laporan/pemeriksaan-lapangan', $payload2);

        $count = PemeriksaanLapangan::where('id_lapangan', $this->lapangan1->id_lapangan)
            ->whereDate('tanggal_pemeriksaan', $tanggal)
            ->count();

        $this->assertEquals(2, $count, 'Pemeriksaan pada tanggal dan lapangan yang sama harus menjadi 2 baris terpisah tanpa saling menimpa.');
    }

    public function test_ringkasan_kondisi_terakhir_mengambil_pemeriksaan_paling_baru(): void
    {
        PemeriksaanLapangan::create([
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_pemeriksaan' => Carbon::yesterday('Asia/Jakarta')->format('Y-m-d'),
            'diperiksa_oleh' => $this->adminUser->id_user,
            'karpet_vinil' => 'rusak_berat',
            'net' => 'baik',
            'tiang' => 'baik',
            'lampu' => 'baik',
            'lantai' => 'baik',
            'dinding' => 'baik',
            'catatan' => 'Kemarin rusak berat',
        ]);

        PemeriksaanLapangan::create([
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_pemeriksaan' => Carbon::today('Asia/Jakarta')->format('Y-m-d'),
            'diperiksa_oleh' => $this->adminUser->id_user,
            'karpet_vinil' => 'baik',
            'net' => 'baik',
            'tiang' => 'baik',
            'lampu' => 'baik',
            'lantai' => 'baik',
            'dinding' => 'baik',
            'catatan' => 'Hari ini sudah diganti baik',
        ]);

        $service = new \App\Services\LaporanLapanganService();
        $ringkasan = $service->getRingkasanKondisiTerakhir();

        $itemLap1 = collect($ringkasan)->firstWhere('id_lapangan', $this->lapangan1->id_lapangan);
        $this->assertNotNull($itemLap1);
        $this->assertEquals(Carbon::today('Asia/Jakarta')->format('Y-m-d'), $itemLap1['tanggal_terakhir']);
        $this->assertCount(0, $itemLap1['komponen_tidak_baik'], 'Kondisi terakhir harus karpet_vinil baik (tidak ada komponen tidak baik).');

        $itemLap2 = collect($ringkasan)->firstWhere('id_lapangan', $this->lapangan2->id_lapangan);
        $this->assertNotNull($itemLap2);
        $this->assertNull($itemLap2['tanggal_terakhir'], 'Lapangan 2 yang belum diperiksa tanggal_terakhir bernilai null.');
    }

    public function test_filter_tanggal_dan_lapangan_serta_paginasi_riwayat(): void
    {
        // 12 catatan di Lapangan 1
        for ($i = 1; $i <= 12; $i++) {
            PemeriksaanLapangan::create([
                'id_lapangan' => $this->lapangan1->id_lapangan,
                'tanggal_pemeriksaan' => Carbon::today('Asia/Jakarta')->subDays($i)->format('Y-m-d'),
                'diperiksa_oleh' => $this->adminUser->id_user,
                'karpet_vinil' => 'baik',
                'net' => 'baik',
                'tiang' => 'baik',
                'lampu' => 'baik',
                'lantai' => 'baik',
                'dinding' => 'baik',
            ]);
        }

        // 3 catatan di Lapangan 2
        for ($j = 1; $j <= 3; $j++) {
            PemeriksaanLapangan::create([
                'id_lapangan' => $this->lapangan2->id_lapangan,
                'tanggal_pemeriksaan' => Carbon::today('Asia/Jakarta')->subDays($j)->format('Y-m-d'),
                'diperiksa_oleh' => $this->adminUser->id_user,
                'karpet_vinil' => 'baik',
                'net' => 'baik',
                'tiang' => 'baik',
                'lampu' => 'baik',
                'lantai' => 'baik',
                'dinding' => 'baik',
            ]);
        }

        $service = new \App\Services\LaporanLapanganService();

        // Paginasi per page 10 pada Lapangan 1
        $paged = $service->getRiwayatPemeriksaan(null, null, $this->lapangan1->id_lapangan, 10, 1);
        $this->assertEquals(12, $paged->total());
        $this->assertEquals(2, $paged->lastPage());
        $this->assertCount(10, $paged->items());

        // Filter lapangan 2
        $pagedLap2 = $service->getRiwayatPemeriksaan(null, null, $this->lapangan2->id_lapangan, 10, 1);
        $this->assertEquals(3, $pagedLap2->total());
    }

    public function test_validasi_input_gagal_pada_enum_tidak_valid_tanggal_masa_depan_dan_lapangan_tidak_ada(): void
    {
        // 1. Tanggal masa depan
        $resMasaDepan = $this->actingAs($this->adminUser, 'staff')
            ->post('/admin/laporan/pemeriksaan-lapangan', [
                'id_lapangan' => $this->lapangan1->id_lapangan,
                'tanggal_pemeriksaan' => Carbon::tomorrow('Asia/Jakarta')->format('Y-m-d'),
                'karpet_vinil' => 'baik',
                'net' => 'baik',
                'tiang' => 'baik',
                'lampu' => 'baik',
                'lantai' => 'baik',
                'dinding' => 'baik',
            ]);
        $resMasaDepan->assertSessionHasErrors('tanggal_pemeriksaan');

        // 2. Enum tidak valid
        $resEnumSalah = $this->actingAs($this->adminUser, 'staff')
            ->post('/admin/laporan/pemeriksaan-lapangan', [
                'id_lapangan' => $this->lapangan1->id_lapangan,
                'tanggal_pemeriksaan' => Carbon::today('Asia/Jakarta')->format('Y-m-d'),
                'karpet_vinil' => 'hancur_total',
                'net' => 'baik',
                'tiang' => 'baik',
                'lampu' => 'baik',
                'lantai' => 'baik',
                'dinding' => 'baik',
            ]);
        $resEnumSalah->assertSessionHasErrors('karpet_vinil');

        // 3. Lapangan tidak ada
        $resLapGhaib = $this->actingAs($this->adminUser, 'staff')
            ->post('/admin/laporan/pemeriksaan-lapangan', [
                'id_lapangan' => 999999,
                'tanggal_pemeriksaan' => Carbon::today('Asia/Jakarta')->format('Y-m-d'),
                'karpet_vinil' => 'baik',
                'net' => 'baik',
                'tiang' => 'baik',
                'lampu' => 'baik',
                'lantai' => 'baik',
                'dinding' => 'baik',
            ]);
        $resLapGhaib->assertSessionHasErrors('id_lapangan');
    }

    public function test_kasir_dilarang_akses_403_dan_tamu_diredirect_ke_login(): void
    {
        $payload = [
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_pemeriksaan' => Carbon::today('Asia/Jakarta')->format('Y-m-d'),
            'karpet_vinil' => 'baik',
            'net' => 'baik',
            'tiang' => 'baik',
            'lampu' => 'baik',
            'lantai' => 'baik',
            'dinding' => 'baik',
        ];

        // Tamu -> redirect login staff
        $guestRes = $this->post('/admin/laporan/pemeriksaan-lapangan', $payload);
        $guestRes->assertRedirect('/staff/login');

        // Kasir -> 403 Forbidden
        $kasirRes = $this->actingAs($this->kasirUser, 'staff')
            ->post('/admin/laporan/pemeriksaan-lapangan', $payload);
        $kasirRes->assertStatus(403);
    }

    public function test_sheet_excel_lapangan_ada_dengan_jumlah_baris_sama_dengan_data_riwayat(): void
    {
        PemeriksaanLapangan::create([
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_pemeriksaan' => '2026-10-05',
            'diperiksa_oleh' => $this->adminUser->id_user,
            'karpet_vinil' => 'baik',
            'net' => 'rusak_ringan',
            'tiang' => 'baik',
            'lampu' => 'baik',
            'lantai' => 'baik',
            'dinding' => 'baik',
            'catatan' => 'Net perlu dikencangkan',
        ]);

        PemeriksaanLapangan::create([
            'id_lapangan' => $this->lapangan2->id_lapangan,
            'tanggal_pemeriksaan' => '2026-10-06',
            'diperiksa_oleh' => $this->adminUser->id_user,
            'karpet_vinil' => 'baik',
            'net' => 'baik',
            'tiang' => 'baik',
            'lampu' => 'baik',
            'lantai' => 'baik',
            'dinding' => 'baik',
            'catatan' => null,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan/ekspor?start_date=2026-10-01&end_date=2026-10-10');
        $response->assertOk();

        $content = $response->streamedContent();
        $tempPath = tempnam(sys_get_temp_dir(), 'bigi_lapangan_test_') . '.xlsx';
        file_put_contents($tempPath, $content);

        try {
            $reader = new Xlsx();
            $spreadsheet = $reader->load($tempPath);

            $this->assertTrue($spreadsheet->sheetNameExists('Lapangan'));
            $sheet = $spreadsheet->getSheetByName('Lapangan');

            $this->assertEquals('Tanggal', $sheet->getCell('A1')->getValue());
            $this->assertEquals('Lapangan', $sheet->getCell('B1')->getValue());
            $this->assertEquals('Net', $sheet->getCell('D1')->getValue());
            $this->assertEquals('Catatan', $sheet->getCell('I1')->getValue());
            $this->assertEquals('Pemeriksa', $sheet->getCell('J1')->getValue());

            // 1 header row + 2 data rows = 3 rows
            $this->assertEquals(3, $sheet->getHighestRow());
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

}
