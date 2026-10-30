<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use App\Services\ReservasiService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PerubahanATarifDanPaketMemberTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $memberUser;
    protected User $regulerUser;
    protected Lapangan $lapangan;
    protected ReservasiService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'nama' => 'Admin Penguji',
            'email' => 'admin.tarif@example.com',
            'no_whatsapp' => '081299990001',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->memberUser = User::create([
            'nama' => 'Member Setia',
            'email' => 'member.tarif@example.com',
            'no_whatsapp' => '081299990002',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
            'status_member' => User::STATUS_MEMBER_AKTIF,
            'status_akun' => User::STATUS_AKUN_AKTIF,
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addMonths(3)->toDateString(),
        ]);

        $this->regulerUser = User::create([
            'nama' => 'Pemain Reguler',
            'email' => 'reguler.tarif@example.com',
            'no_whatsapp' => '081299990003',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_REGULER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->lapangan = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 60000.00,
            'status_lapangan' => Lapangan::STATUS_TERSEDIA,
        ]);

        $this->service = app(ReservasiService::class);
    }

    /**
     * Test A1: Tarif 1 jam = 60.000, 2 jam = 100.000, 3 jam = 160.000, 4 jam = 200.000.
     */
    public function test_tarif_sewa_lapangan_kalkulasi_1_sampai_4_jam(): void
    {
        // 1 jam (60 menit) = Rp 60.000
        $this->assertEquals(60000, ReservasiService::hitungTarifReservasi(60));

        // 2 jam (120 menit) = Rp 100.000
        $this->assertEquals(100000, ReservasiService::hitungTarifReservasi(120));

        // 3 jam (180 menit) = Rp 160.000 (floor(3/2)*100k + 1*60k)
        $this->assertEquals(160000, ReservasiService::hitungTarifReservasi(180));

        // 4 jam (240 menit) = Rp 200.000 (floor(4/2)*100k + 0*60k)
        $this->assertEquals(200000, ReservasiService::hitungTarifReservasi(240));

        // 5 jam (300 menit) = Rp 260.000
        $this->assertEquals(260000, ReservasiService::hitungTarifReservasi(300));

        // Reservasi reguler 1 jam via service
        $tgl1 = Carbon::tomorrow('Asia/Jakarta')->toDateString();
        $res1Jam = $this->service->createRegularReservasi([
            'id_user' => $this->regulerUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => $tgl1,
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 60000,
        ], $this->admin->id_user);

        $this->assertEquals(60000, $res1Jam->total_biaya);
        $this->assertEquals(60000, $res1Jam->pembayaran->first()->jumlah);

        // Reservasi reguler 2 jam via service
        $res2Jam = $this->service->createRegularReservasi([
            'id_user' => $this->regulerUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => $tgl1,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
        ], $this->admin->id_user);

        $this->assertEquals(100000, $res2Jam->total_biaya);
        $this->assertEquals(100000, $res2Jam->pembayaran->first()->jumlah);

        // Reservasi reguler 3 jam via service
        $res3Jam = $this->service->createRegularReservasi([
            'id_user' => $this->regulerUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => $tgl1,
            'jam_mulai' => '13:00',
            'jam_selesai' => '16:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 160000,
        ], $this->admin->id_user);

        $this->assertEquals(160000, $res3Jam->total_biaya);
        $this->assertEquals(160000, $res3Jam->pembayaran->first()->jumlah);
    }

    /**
     * Test A2 & A4: Daftar member paket 450k: total pembayaran 450k, membuat 4 sesi, laporan menghitung 450k sekali.
     */
    public function test_daftar_member_paket_450k_total_bayar_450k_membuat_4_sesi_laporan_hitung_sekali(): void
    {
        // 1. Admin mendaftarkan paket 450k (Bulanan 4x3 Jam)
        $response = $this->actingAs($this->admin, 'staff')->post("/admin/member/{$this->memberUser->id_user}/paket", [
            'jenis_paket' => 'bulanan_4x3',
            'jumlah_sesi' => 4,
            'durasi_jam_per_sesi' => 3,
            'harga_paket' => 450000,
            'metode_pembayaran' => 'transfer',
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir' => Carbon::today('Asia/Jakarta')->addDays(30)->toDateString(),
            'catatan' => 'Paket Bulanan 4x3 Jam resmi',
        ]);
        $response->assertSessionHasNoErrors();

        $paket = PaketMember::where('id_user', $this->memberUser->id_user)->first();
        $this->assertNotNull($paket);
        $this->assertEquals('bulanan_4x3', $paket->jenis_paket);
        $this->assertEquals(4, $paket->jumlah_sesi);
        $this->assertEquals(3, $paket->durasi_jam_per_sesi);
        $this->assertEquals(450000, $paket->harga_paket);
        $this->assertEquals(4, $paket->sisa_sesi);

        // Verifikasi pembayaran tercatat SATU KALI di tabel pembayaran sebesar 450.000
        $this->assertDatabaseHas('pembayaran', [
            'id_paket' => $paket->id_paket,
            'id_reservasi' => null,
            'jumlah' => 450000,
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
        ]);
        $this->assertEquals(1, Pembayaran::where('id_paket', $paket->id_paket)->count());

        // 2. Admin membuat 4 sesi autofield untuk member tersebut
        // Buat jadwal mingguan setiap hari Rabu jam 14:00 - 17:00 (durasi 3 jam)
        $preview = $this->service->previewMemberAutofield(
            $this->memberUser->id_user,
            $this->lapangan->id_lapangan,
            '3', // Rabu
            '14:00',
            '17:00',
            null,
            4
        );

        $this->assertFalse($preview['has_conflict']);
        $this->assertTrue($preview['bisa_disimpan']);
        $this->assertEquals(4, $preview['total_sesi']);
        $this->assertEquals(0, $preview['total_biaya'], 'Total biaya autofield member harus 0 karena sudah dibayar di awal');

        $reservasi = $this->service->storeMemberAutofield([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'hari' => '3',
            'jam_mulai' => '14:00',
            'jam_selesai' => '17:00',
            'jumlah_sesi' => 4,
        ], $this->admin->id_user);

        // Verifikasi 4 sesi jadwal terbuat di detail_reservasi
        $this->assertEquals(4, $reservasi->detailReservasi()->count());
        $this->assertEquals(0, $reservasi->total_biaya);

        // Kuota sesi paket member terpotong penuh menjadi 0
        $paket->refresh();
        $this->assertEquals(4, $paket->sesi_reservasi);
        $this->assertEquals(0, $paket->sisa_sesi);

        // Penting: Tabel pembayaran TETAP HANYA 1 transaksi (tidak ada tagihan/pembayaran ganda dari sesi)
        $this->assertEquals(1, Pembayaran::count());
        $this->assertEquals(0, Pembayaran::where('id_reservasi', $reservasi->id_reservasi)->count());

        // 3. Verifikasi Laporan Keuangan: Menghitung Rp 450.000 SATU KALI
        $laporanRes = $this->actingAs($this->admin, 'staff')->get('/admin/laporan');
        $laporanRes->assertStatus(200);
        $laporanRes->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_sewa_lapangan', 450000)
            ->where('ringkasan.total_pendapatan_kotor', 450000)
            ->where('ringkasan.laba_bersih', 450000)
        );
    }

    /**
     * Test A2: Paket 350k dan 300k tersimpan dengan harga yang benar.
     */
    public function test_paket_350k_dan_300k_tersimpan_dengan_harga_yang_benar(): void
    {
        // Paket Bulanan 4x2 Jam (Rp 350.000)
        $res350 = $this->actingAs($this->admin, 'staff')->post("/admin/member/{$this->memberUser->id_user}/paket", [
            'jenis_paket' => 'bulanan_4x2',
            'jumlah_sesi' => 4,
            'durasi_jam_per_sesi' => 2,
            'harga_paket' => 350000,
            'metode_pembayaran' => 'tunai',
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
        ]);
        $res350->assertSessionHasNoErrors();

        $paket350 = PaketMember::where('jenis_paket', 'bulanan_4x2')->first();
        $this->assertNotNull($paket350);
        $this->assertEquals(350000, $paket350->harga_paket);
        $this->assertEquals(4, $paket350->jumlah_sesi);
        $this->assertEquals(2, $paket350->durasi_jam_per_sesi);

        $this->assertDatabaseHas('pembayaran', [
            'id_paket' => $paket350->id_paket,
            'jumlah' => 350000,
            'metode_pembayaran' => 'tunai',
        ]);

        // Paket Member Pagi 4x3 Jam (Rp 300.000)
        $res300 = $this->actingAs($this->admin, 'staff')->post("/admin/member/{$this->memberUser->id_user}/paket", [
            'jenis_paket' => 'pagi_4x3',
            'jumlah_sesi' => 4,
            'durasi_jam_per_sesi' => 3,
            'harga_paket' => 300000,
            'metode_pembayaran' => 'qris',
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
        ]);
        $res300->assertSessionHasNoErrors();

        $paket300 = PaketMember::where('jenis_paket', 'pagi_4x3')->first();
        $this->assertNotNull($paket300);
        $this->assertEquals(300000, $paket300->harga_paket);
        $this->assertEquals(4, $paket300->jumlah_sesi);
        $this->assertEquals(3, $paket300->durasi_jam_per_sesi);

        $this->assertDatabaseHas('pembayaran', [
            'id_paket' => $paket300->id_paket,
            'jumlah' => 300000,
            'metode_pembayaran' => 'qris',
        ]);
    }

    /**
     * Test A3: Mencatat 1 sesi main pada member paket 4 sesi membuat sisa sesi jadi 3, tanpa menambah pembayaran atau pendapatan di laporan.
     */
    public function test_mencatat_1_sesi_main_pada_member_paket_4_sesi_membuat_sisa_sesi_3_tanpa_tambah_pendapatan(): void
    {
        // 1. Daftarkan paket 450k
        $this->actingAs($this->admin, 'staff')->post("/admin/member/{$this->memberUser->id_user}/paket", [
            'jenis_paket' => 'bulanan_4x3',
            'jumlah_sesi' => 4,
            'harga_paket' => 450000,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
        ]);

        $paket = PaketMember::where('id_user', $this->memberUser->id_user)->first();
        $this->assertEquals(4, $paket->sisa_sesi);
        $initialPaymentCount = Pembayaran::count();
        $this->assertEquals(1, $initialPaymentCount);

        // 2. Admin mencatat pemakaian manual 1 sesi main langsung di lapangan
        $resAdjust = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'selisih' => -1,
            'alasan' => 'Main langsung di lapangan tanpa booking rutin',
            'tanggal' => Carbon::today('Asia/Jakarta')->toDateString(),
        ]);
        $resAdjust->assertSessionHasNoErrors();

        // 3. Verifikasi sisa sesi berkurang menjadi 3
        $paket->refresh();
        $this->assertEquals(1, $paket->pemakaian_manual);
        $this->assertEquals(3, $paket->sisa_sesi);

        // 4. Verifikasi tidak ada baris pembayaran baru yang bertambah
        $this->assertEquals($initialPaymentCount, Pembayaran::count());

        // 5. Verifikasi laporan keuangan tetap mencatat pendapatan 450.000 saja (tidak ada penambahan pendapatan dari sesi)
        $laporanRes = $this->actingAs($this->admin, 'staff')->get('/admin/laporan');
        $laporanRes->assertStatus(200);
        $laporanRes->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan/Index')
            ->where('ringkasan.pendapatan_sewa_lapangan', 450000)
            ->where('ringkasan.total_pendapatan_kotor', 450000)
        );
    }

    /**
     * Test A2: Member Pagi ditolak di luar Senin s.d Kamis.
     */
    public function test_member_pagi_ditolak_di_luar_senin_sampai_kamis(): void
    {
        $paketPagi = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jenis_paket' => 'pagi_4x3',
            'jumlah_sesi' => 4,
            'durasi_jam_per_sesi' => 3,
            'harga_paket' => 300000,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        // Coba hari Jumat (day 5) -> harus ditolak
        try {
            $this->service->previewMemberAutofield(
                $this->memberUser->id_user,
                $this->lapangan->id_lapangan,
                '5', // Jumat
                '08:00',
                '11:00'
            );
            $this->fail('Seharusnya ditolak karena Member Pagi hanya berlaku Senin s.d Kamis.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('hari', $e->errors());
            $this->assertStringContainsString('Senin s.d Kamis', $e->errors()['hari'][0]);
        }

        // Coba hari Sabtu (day 6) -> harus ditolak
        try {
            $this->service->previewMemberAutofield(
                $this->memberUser->id_user,
                $this->lapangan->id_lapangan,
                '6', // Sabtu
                '08:00',
                '11:00'
            );
            $this->fail('Seharusnya ditolak karena Member Pagi hanya berlaku Senin s.d Kamis.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('hari', $e->errors());
        }

        // Coba hari Minggu (day 0) -> harus ditolak
        try {
            $this->service->previewMemberAutofield(
                $this->memberUser->id_user,
                $this->lapangan->id_lapangan,
                '0', // Minggu
                '08:00',
                '11:00'
            );
            $this->fail('Seharusnya ditolak karena Member Pagi hanya berlaku Senin s.d Kamis.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('hari', $e->errors());
        }
    }

    /**
     * Test A2: Member Pagi ditolak di luar 08.00-12.00 atau durasi per sesi bukan 3 jam.
     */
    public function test_member_pagi_ditolak_di_luar_jam_08_sampai_12_atau_durasi_bukan_3_jam(): void
    {
        $paketPagi = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jenis_paket' => 'pagi_4x3',
            'jumlah_sesi' => 4,
            'durasi_jam_per_sesi' => 3,
            'harga_paket' => 300000,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        // Coba hari Senin (day 1) tapi jam 07:00 - 10:00 (sebelum 08:00) -> ditolak
        try {
            $this->service->previewMemberAutofield(
                $this->memberUser->id_user,
                $this->lapangan->id_lapangan,
                '1', // Senin
                '07:00',
                '10:00'
            );
            $this->fail('Seharusnya ditolak karena jam mulai sebelum 08:00.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('jam_mulai', $e->errors());
        }

        // Coba hari Senin (day 1) tapi jam 10:00 - 13:00 (lewat 12:00) -> ditolak
        try {
            $this->service->previewMemberAutofield(
                $this->memberUser->id_user,
                $this->lapangan->id_lapangan,
                '1', // Senin
                '10:00',
                '13:00'
            );
            $this->fail('Seharusnya ditolak karena jam selesai melebihi 12:00.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('jam_mulai', $e->errors());
        }

        // Coba hari Senin (day 1) jam 08:00 - 10:00 (durasi 2 jam bukan 3 jam) -> ditolak
        try {
            $this->service->previewMemberAutofield(
                $this->memberUser->id_user,
                $this->lapangan->id_lapangan,
                '1', // Senin
                '08:00',
                '10:00'
            );
            $this->fail('Seharusnya ditolak karena durasi bukan 3 jam.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('jam_selesai', $e->errors());
        }

        // Coba hari Senin (day 1) jam 08:00 - 11:00 (durasi 3 jam pas, dalam 08.00-12.00) -> diterima!
        $previewValid = $this->service->previewMemberAutofield(
            $this->memberUser->id_user,
            $this->lapangan->id_lapangan,
            '1', // Senin
            '08:00',
            '11:00'
        );
        $this->assertFalse($previewValid['has_conflict']);
        $this->assertTrue($previewValid['bisa_disimpan']);
    }
}
