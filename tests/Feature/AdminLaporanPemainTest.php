<?php

namespace Tests\Feature;

use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\PaketMember;
use App\Models\PenyesuaianPaket;
use App\Models\PesertaMabar;
use App\Models\Reservasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLaporanPemainTest extends TestCase
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
            'nama' => 'Pemain Terdaftar',
            'email' => 'pemain1@example.com',
            'no_whatsapp' => '081299991111',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_REGULER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->lapangan = Lapangan::create([
            'nama_lapangan' => 'Lapangan A',
            'harga_per_jam' => 50000,
            'status_lapangan' => Lapangan::STATUS_TERSEDIA,
        ]);
    }

    public function test_auth_and_role_guards_and_get_only_for_laporan_pemain(): void
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

        $this->actingAs($this->adminUser, 'staff')->post('/admin/laporan', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->put('/admin/laporan', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->patch('/admin/laporan', [])->assertStatus(405);
        $this->actingAs($this->adminUser, 'staff')->delete('/admin/laporan', [])->assertStatus(405);
    }

    public function test_visits_exclude_canceled_reservations_and_count_per_reservation(): void
    {
        $resValid = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 100000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resValid->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resValid->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '09:00',
            'jam_selesai' => '10:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $resBatal = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 50000,
            'status_reservasi' => Reservasi::STATUS_BATAL,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resBatal->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '11:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasanPemain.total_kunjungan', 1)
            ->where('ringkasanPemain.pemain_berkunjung_periode', 1)
            ->where('daftarPemain.data.0.kunjungan_periode', 1)
        );
    }

    public function test_walkin_reservations_merged_by_normalized_whatsapp(): void
    {
        $resWalkin1 = Reservasi::create([
            'id_user' => null,
            'nama_pemesan' => 'Budi Walkin',
            'no_whatsapp_pemesan' => '082155556666',
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 50000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resWalkin1->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '13:00',
            'jam_selesai' => '14:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $resWalkin2 = Reservasi::create([
            'id_user' => null,
            'nama_pemesan' => 'Budi Walkin 2',
            'no_whatsapp_pemesan' => '+62821-5555-6666',
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 50000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resWalkin2->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '14:00',
            'jam_selesai' => '15:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasanPemain.total_kunjungan', 2)
            ->where('daftarPemain.data.0.norm_wa', '082155556666')
            ->where('daftarPemain.data.0.kunjungan_periode', 2)
            ->where('daftarPemain.data.0.jenis_label', 'Tanpa akun')
        );
    }

    public function test_walkin_matching_registered_user_phone_is_merged_into_user_account(): void
    {
        $resWalkin = Reservasi::create([
            'id_user' => null,
            'nama_pemesan' => 'Walkin Matching',
            'no_whatsapp_pemesan' => '+62 812-9999-1111',
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 50000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resWalkin->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '16:00',
            'jam_selesai' => '17:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('daftarPemain.total', 1)
            ->where('daftarPemain.data.0.id_user', $this->customerUser->id_user)
            ->where('daftarPemain.data.0.kunjungan_periode', 1)
        );
    }

    public function test_walkin_without_phone_aggregated_into_single_tanpa_nomor_row(): void
    {
        $resNoPhone1 = Reservasi::create([
            'id_user' => null,
            'nama_pemesan' => 'Anonim 1',
            'no_whatsapp_pemesan' => null,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 50000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resNoPhone1->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '17:00',
            'jam_selesai' => '18:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $resNoPhone2 = Reservasi::create([
            'id_user' => null,
            'nama_pemesan' => 'Anonim 2',
            'no_whatsapp_pemesan' => '',
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 50000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resNoPhone2->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '18:00',
            'jam_selesai' => '19:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasanPemain.total_kunjungan', 2)
            ->where('daftarPemain.data.0.nama', 'Tanpa nomor')
            ->where('daftarPemain.data.0.kunjungan_periode', 2)
            ->where('daftarPemain.data.0.jenis_label', 'Tanpa akun')
        );
    }

    public function test_member_package_remaining_sessions_calculated_correctly_with_adjustments(): void
    {
        $this->customerUser->update([
            'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
            'status_member' => User::STATUS_MEMBER_AKTIF,
            'tanggal_mulai_member' => Carbon::now('Asia/Jakarta')->subDays(5),
            'tanggal_akhir_member' => Carbon::now('Asia/Jakarta')->addDays(25),
        ]);

        $paket = PaketMember::create([
            'id_user' => $this->customerUser->id_user,
            'jumlah_sesi' => 10,
            'tanggal_mulai' => Carbon::now('Asia/Jakarta')->subDays(5),
            'tanggal_akhir' => Carbon::now('Asia/Jakarta')->addDays(25),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $resPaket = Reservasi::create([
            'id_user' => $this->customerUser->id_user,
            'id_paket' => $paket->id_paket,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 0,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resPaket->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '11:00',
            'durasi' => 1,
            'subtotal' => 0,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resPaket->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '11:00',
            'jam_selesai' => '12:00',
            'durasi' => 1,
            'subtotal' => 0,
        ]);

        PenyesuaianPaket::create([
            'id_paket' => $paket->id_paket,
            'selisih' => 2,
            'alasan' => 'Bonus promo',
            'id_admin' => $this->adminUser->id_user,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasanPemain.member_aktif', 1)
            ->where('ringkasanPemain.total_sesi_paket_terpakai', 2)
            ->where('daftarPemain.data.0.sisa_sesi_paket', 10)
            ->where('daftarPemain.data.0.jenis_label', 'Member')
        );
    }

    public function test_open_mabar_created_and_joined_counts(): void
    {
        $mabar = OpenMabar::create([
            'id_user' => $this->customerUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'judul' => 'Mabar Pagi Seru',
            'tanggal' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '07:00',
            'jam_selesai' => '09:00',
            'gender' => OpenMabar::GENDER_CAMPURAN,
            'batas_usia_min' => 17,
            'batas_usia_max' => 50,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        $user2 = User::create([
            'nama' => 'Pemain Kedua',
            'email' => 'pemain2@example.com',
            'no_whatsapp' => '081288887777',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_REGULER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        PesertaMabar::create([
            'id_mabar' => $mabar->id_mabar,
            'id_user' => $user2->id_user,
            'tanggal_daftar' => Carbon::now('Asia/Jakarta')->toDateString(),
            'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasanPemain.jumlah_open_mabar', 1)
        );

        $daftarData = $response->viewData('page')['props']['daftarPemain']['data'];
        $user1Data = collect($daftarData)->firstWhere('id_user', $this->customerUser->id_user);
        $user2Data = collect($daftarData)->firstWhere('id_user', $user2->id_user);

        $this->assertEquals(1, $user1Data['open_mabar_dibuat']);
        $this->assertEquals(0, $user1Data['open_mabar_diikuti']);

        $this->assertEquals(0, $user2Data['open_mabar_dibuat']);
        $this->assertEquals(1, $user2Data['open_mabar_diikuti']);
    }

    public function test_player_search_and_date_filter(): void
    {
        User::create([
            'nama' => 'Ahmad Suhendra',
            'email' => 'ahmad@example.com',
            'no_whatsapp' => '085512341234',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_REGULER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan?search_pemain=Suhendra');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('daftarPemain.total', 1)
            ->where('daftarPemain.data.0.nama', 'Ahmad Suhendra')
        );

        $responseWa = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan?search_pemain=085512341234');
        $responseWa->assertStatus(200);
        $responseWa->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('daftarPemain.total', 1)
            ->where('daftarPemain.data.0.nama', 'Ahmad Suhendra')
        );
    }

    public function test_excel_export_includes_pemain_sheet_with_all_records(): void
    {
        $resWalkin = Reservasi::create([
            'id_user' => null,
            'nama_pemesan' => 'Walkin Pemain',
            'no_whatsapp_pemesan' => '087799998888',
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 50000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $resWalkin->id_reservasi,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '11:00',
            'durasi' => 1,
            'subtotal' => 50000,
        ]);

        $response = $this->actingAs($this->adminUser, 'staff')->get('/admin/laporan/ekspor');
        $response->assertStatus(200);

        $content = $response->streamedContent();
        $tempPath = tempnam(sys_get_temp_dir(), 'bigi_pemain_test_') . '.xlsx';
        file_put_contents($tempPath, $content);

        try {
            $reader = new \PhpOffice\PhpSpreadsheet\Reader\Xlsx();
            $spreadsheet = $reader->load($tempPath);

            $this->assertTrue($spreadsheet->sheetNameExists('Pemain'));
            $sheet = $spreadsheet->getSheetByName('Pemain');

            $this->assertEquals('Nama', $sheet->getCell('A1')->getValue());
            $this->assertEquals('WhatsApp', $sheet->getCell('B1')->getValue());
            $this->assertEquals('Jenis', $sheet->getCell('C1')->getValue());
            $this->assertEquals('Sisa Sesi Paket', $sheet->getCell('D1')->getValue());
            $this->assertEquals('Kunjungan (Periode)', $sheet->getCell('E1')->getValue());

            $highestRow = $sheet->getHighestRow();
            $this->assertEquals(3, $highestRow);
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }
}
