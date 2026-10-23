<?php

namespace Tests\Feature;

use App\Models\Lapangan;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use App\Services\ReservasiService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AdminMemberModuleTest extends TestCase
{
    use RefreshDatabase;

    protected ReservasiService $service;
    protected Lapangan $lapangan;
    protected User $admin;
    protected User $kasir;
    protected User $memberUser;
    protected User $regulerUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->service = new ReservasiService();
        $this->lapangan = Lapangan::first();

        $this->admin = User::create([
            'nama' => 'Admin Penguji',
            'email' => 'admin.test@bigi.com',
            'no_whatsapp' => '081234567890',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasir = User::create([
            'nama' => 'Kasir Utama',
            'email' => 'kasir.member@bigi.com',
            'no_whatsapp' => '081234567888',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->memberUser = User::create([
            'nama' => 'Budi Santoso (Member)',
            'email' => 'budi@example.com',
            'no_whatsapp' => '081234567891',
            'password' => Hash::make('secret123'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
            'status_member' => User::STATUS_MEMBER_AKTIF,
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addMonths(3)->toDateString(),
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->regulerUser = User::create([
            'nama' => 'Andi Wijaya (Reguler)',
            'email' => 'andi@example.com',
            'no_whatsapp' => '081234567892',
            'password' => Hash::make('secret123'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_REGULER,
            'status_member' => User::STATUS_MEMBER_TIDAK_AKTIF,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);
    }

    public function test_package_consumption_on_booking(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $this->assertEquals(4, $paket->sisa_sesi);

        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::today('Asia/Jakarta')->addDays(3)->toDateString(),
            'jam_mulai' => '09:00',
            'jam_selesai' => '10:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $this->assertEquals($paket->id_paket, $reservasi->id_paket);
        $paket->refresh();
        $this->assertEquals(1, $paket->sesi_terpakai);
        $this->assertEquals(3, $paket->sisa_sesi);
    }

    public function test_booking_rejected_when_sessions_are_insufficient(): void
    {
        $this->expectException(ValidationException::class);
        $this->service->createRegularReservasi([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::today('Asia/Jakarta')->addDays(2)->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '11:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);
    }

    public function test_cancel_returns_sessions(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::today('Asia/Jakarta')->addDays(4)->toDateString(),
            'jam_mulai' => '14:00',
            'jam_selesai' => '15:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $paket->refresh();
        $this->assertEquals(3, $paket->sisa_sesi);

        $this->service->batalkanReservasi($reservasi->id_reservasi, 'Batal oleh member', $this->admin->id_user);

        $paket->refresh();
        $this->assertEquals(4, $paket->sisa_sesi);
        $this->assertEquals(0, $paket->sesi_terpakai);
    }

    public function test_autofield_caps_schedule_to_available_package_quota(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 2,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $this->memberUser->update([
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addDays(28)->toDateString(),
        ]);

        $preview = $this->service->previewMemberAutofield(
            $this->memberUser->id_user,
            $this->lapangan->id_lapangan,
            '1',
            '19:00',
            '20:00'
        );

        $this->assertFalse($preview['has_conflict']);
        $this->assertTrue($preview['bisa_disimpan']);
        $this->assertCount(2, $preview['jadwal'], 'Jadwal harus dibatasi maksimal 2 sesi sesuai sisa kuota paket.');

        $reservasi = $this->service->storeMemberAutofield([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'hari' => '1',
            'jam_mulai' => '19:00',
            'jam_selesai' => '20:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => $preview['total_biaya'],
        ], $this->admin->id_user);

        $paket->refresh();
        $this->assertEquals(0, $paket->sisa_sesi, 'Sisa sesi paket harus terpotong 2 sesi.');
        $this->assertEquals(Reservasi::STATUS_TERKONFIRMASI, $reservasi->status_reservasi);
    }

    public function test_autofield_blocked_when_package_has_no_remaining_sessions(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 0,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $this->memberUser->update([
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addDays(28)->toDateString(),
        ]);

        $preview = $this->service->previewMemberAutofield(
            $this->memberUser->id_user,
            $this->lapangan->id_lapangan,
            '1',
            '19:00',
            '20:00'
        );

        $this->assertTrue($preview['has_conflict']);
        $this->assertFalse($preview['bisa_disimpan']);

        $this->expectException(ValidationException::class);
        $this->service->storeMemberAutofield([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'hari' => '1',
            'jam_mulai' => '19:00',
            'jam_selesai' => '20:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => $preview['total_biaya'],
        ], $this->admin->id_user);
    }

    public function test_adjustment_with_reason_and_audit_log(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $response = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'selisih' => 2,
            'alasan' => 'Bonus promo bulanan',
        ]);

        $response->assertSessionHasNoErrors();
        $paket->refresh();
        $this->assertEquals(6, $paket->sisa_sesi);

        $this->assertDatabaseHas('penyesuaian_paket', [
            'id_paket' => $paket->id_paket,
            'selisih' => 2,
            'alasan' => 'Bonus promo bulanan',
            'id_admin' => $this->admin->id_user,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'PENYESUAIAN_PAKET_MEMBER',
        ]);
    }

    public function test_admin_cannot_change_role_or_password_via_member_endpoint(): void
    {
        $oldPassword = $this->memberUser->password;
        $oldRole = $this->memberUser->role;

        $response = $this->actingAs($this->admin, 'staff')->put("/admin/member/{$this->memberUser->id_user}/status", [
            'jenis_pelanggan' => 'member',
            'status_member' => 'aktif',
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addMonths(1)->toDateString(),
            'role' => 'admin',
            'password' => 'hacked123',
        ]);

        $response->assertSessionHasNoErrors();
        $this->memberUser->refresh();

        $this->assertEquals($oldRole, $this->memberUser->role, 'Role pengguna tidak boleh berubah.');
        $this->assertEquals($oldPassword, $this->memberUser->password, 'Password pengguna tidak boleh berubah.');
    }

    public function test_non_member_booking_unaffected(): void
    {
        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->regulerUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::today('Asia/Jakarta')->addDays(3)->toDateString(),
            'jam_mulai' => '09:00',
            'jam_selesai' => '10:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $response = $this->actingAs($this->admin, 'staff')->get('/admin/member');

        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Admin/Member/Index');
            return $page;
        });
    }

    public function test_admin_akses_halaman_member_berhasil(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::today('Asia/Jakarta')->addDays(3)->toDateString(),
            'jam_mulai' => '09:00',
            'jam_selesai' => '10:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $response = $this->actingAs($this->admin, 'staff')->get('/admin/member');

        $response->assertStatus(200);
        $response->assertInertia(function ($page) use ($reservasi) {
            $page->component('Admin/Member/Index');
            $props = $page->toArray()['props'];
            $customers = $props['customers']['data'] ?? [];

            $foundUser = false;
            foreach ($customers as $c) {
                if ($c['id_user'] === $this->memberUser->id_user) {
                    $foundUser = true;
                    $this->assertEquals('Member Aktif', $c['status_label']);
                    $this->assertEquals(3, $c['sisa_sesi_aktif']);
                    break;
                }
            }

            $this->assertTrue($foundUser, 'Pengguna member harus tampil di admin/member.');
            return $page;
        });
    }

    public function test_kasir_ditolak_ke_admin_member(): void
    {
        // Kasir mengakses /admin/member menghasilkan 403 Forbidden
        $responseKasir = $this->actingAs($this->kasir, 'staff')->get('/admin/member');
        $responseKasir->assertStatus(403);
    }

    public function test_tamu_belum_login_ditolak_dari_admin_member(): void
    {
        $response = $this->get('/admin/member');
        $response->assertRedirect('/staff/login');
    }

    public function test_catat_pemakaian_mengurangi_sisa_dan_tercatat_di_riwayat_dan_audit_log(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $mainDate = Carbon::today('Asia/Jakarta')->toDateString();
        $response = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'jenis' => 'pemakaian',
            'jumlah' => 1,
            'tanggal' => $mainDate,
            'catatan' => 'Main langsung tanpa reservasi online',
        ]);

        $response->assertSessionHasNoErrors();
        $paket->refresh();
        $this->assertEquals(3, $paket->sisa_sesi);
        $this->assertEquals(1, $paket->sesi_terpakai);
        $this->assertEquals(0, $paket->total_penyesuaian);

        $this->assertDatabaseHas('penyesuaian_paket', [
            'id_paket' => $paket->id_paket,
            'selisih' => -1,
            'tanggal_main' => $mainDate,
            'alasan' => 'Main langsung tanpa reservasi online',
            'id_admin' => $this->admin->id_user,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'PENYESUAIAN_PAKET_MEMBER',
        ]);
    }

    public function test_tambah_sesi_menaikkan_sisa_sesi(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $response = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'jenis' => 'tambah',
            'jumlah' => 2,
            'catatan' => 'Bonus kompensasi mati lampu',
        ]);

        $response->assertSessionHasNoErrors();
        $paket->refresh();
        $this->assertEquals(6, $paket->sisa_sesi);
        $this->assertEquals(2, $paket->total_penyesuaian);
    }

    public function test_pemakaian_tidak_boleh_melebihi_sisa_sesi(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 2,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $response = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'jenis' => 'pemakaian',
            'jumlah' => 3,
        ]);

        $response->assertSessionHasErrors(['jumlah']);
        $paket->refresh();
        $this->assertEquals(2, $paket->sisa_sesi);
    }

    public function test_penyesuaian_paket_nonaktif_ditolak(): void
    {
        $paketBatal = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_DIBATALKAN,
        ]);

        $responseBatal = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paketBatal->id_paket}/adjust", [
            'jenis' => 'pemakaian',
            'jumlah' => 1,
        ]);
        $responseBatal->assertSessionHasErrors(['paket']);

        $paketExpired = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->subMonths(2)->toDateString(),
            'tanggal_akhir' => Carbon::today('Asia/Jakarta')->subDays(1)->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $responseExpired = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paketExpired->id_paket}/adjust", [
            'jenis' => 'pemakaian',
            'jumlah' => 1,
        ]);
        $responseExpired->assertSessionHasErrors(['paket']);
    }

    public function test_admin_dapat_menambah_paket_dan_membatalkan_paket(): void
    {
        // Tambah Paket
        $resTambah = $this->actingAs($this->admin, 'staff')->post("/admin/member/{$this->memberUser->id_user}/paket", [
            'jumlah_sesi' => 8,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'catatan' => 'Paket promo 8 sesi',
        ]);
        $resTambah->assertSessionHasNoErrors();

        $paket = PaketMember::where('id_user', $this->memberUser->id_user)->latest('id_paket')->first();
        $this->assertNotNull($paket);
        $this->assertEquals(8, $paket->jumlah_sesi);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'TAMBAH_PAKET_MEMBER',
        ]);

        // Batalkan Paket
        $resBatal = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/cancel", [
            'alasan' => 'Salah input pelanggan',
        ]);
        $resBatal->assertSessionHasNoErrors();
        $paket->refresh();
        $this->assertEquals(PaketMember::STATUS_DIBATALKAN, $paket->status);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'BATAL_PAKET_MEMBER',
        ]);
    }

    public function test_sisa_sesi_di_laporan_pemain_ikut_berubah_setelah_penyesuaian(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $service = new \App\Services\LaporanPemainService();
        $todayStr = Carbon::today('Asia/Jakarta')->toDateString();
        $pemainBefore = $service->getSemuaPemain($todayStr, $todayStr)->firstWhere('id_user', $this->memberUser->id_user);
        $this->assertEquals(4, $pemainBefore['sisa_sesi_paket']);

        // Admin catat pemakaian 1 sesi
        $response = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'jenis' => 'pemakaian',
            'jumlah' => 1,
        ]);
        $response->assertSessionHasNoErrors();

        $pemainAfter = $service->getSemuaPemain($todayStr, $todayStr)->firstWhere('id_user', $this->memberUser->id_user);
        $this->assertEquals(3, $pemainAfter['sisa_sesi_paket']);

        // Buka halaman laporan pemain sebagai admin, pastikan sisa sesi juga 3
        $resLaporan = $this->actingAs($this->admin, 'staff')->get('/admin/laporan');
        $resLaporan->assertStatus(200);
        $resLaporan->assertInertia(function ($page) {
            $props = $page->toArray()['props'];
            $pemain = collect($props['daftarPemain']['data'] ?? [])->firstWhere('id_user', $this->memberUser->id_user);
            $this->assertEquals(3, $pemain['sisa_sesi_paket']);
            return $page;
        });
    }

    public function test_pemakaian_manual_menambah_terpakai_dan_tambah_sesi_menaikkan_penyesuaian(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 8,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        // Reservasi normal
        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::today('Asia/Jakarta')->addDays(1)->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $paket->refresh();
        $this->assertEquals(1, $paket->sesi_reservasi);
        $this->assertEquals(0, $paket->pemakaian_manual);
        $this->assertEquals(1, $paket->sesi_terpakai);
        $this->assertEquals(0, $paket->total_penyesuaian);
        $this->assertEquals(7, $paket->sisa_sesi);

        // Admin catat pemakaian manual 2 sesi
        $mainDate = Carbon::today('Asia/Jakarta')->toDateString();
        $resPemakaian = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'jenis' => 'pemakaian',
            'jumlah' => 2,
            'tanggal' => $mainDate,
            'catatan' => 'Main langsung di lapangan',
        ]);
        $resPemakaian->assertSessionHasNoErrors();

        $paket->refresh();
        $this->assertEquals(1, $paket->sesi_reservasi);
        $this->assertEquals(2, $paket->pemakaian_manual);
        $this->assertEquals(3, $paket->sesi_terpakai);
        $this->assertEquals(0, $paket->total_penyesuaian);
        $this->assertEquals(5, $paket->sisa_sesi);

        $this->assertDatabaseHas('penyesuaian_paket', [
            'id_paket' => $paket->id_paket,
            'selisih' => -2,
            'tanggal_main' => $mainDate,
            'alasan' => 'Main langsung di lapangan',
            'id_admin' => $this->admin->id_user,
        ]);

        // Admin tambah sesi 3 sesi
        $resTambah = $this->actingAs($this->admin, 'staff')->post("/admin/member/paket/{$paket->id_paket}/adjust", [
            'jenis' => 'tambah',
            'jumlah' => 3,
            'catatan' => 'Bonus promo member loyal',
        ]);
        $resTambah->assertSessionHasNoErrors();

        $paket->refresh();
        $this->assertEquals(3, $paket->sesi_terpakai);
        $this->assertEquals(3, $paket->total_penyesuaian);
        $this->assertEquals(8, $paket->sisa_sesi);

        // Halaman admin/member memuat data tersebut
        $responseIndex = $this->actingAs($this->admin, 'staff')->get('/admin/member');
        $responseIndex->assertStatus(200);
        $responseIndex->assertInertia(function ($page) use ($paket) {
            $props = $page->toArray()['props'];
            $cust = collect($props['customers']['data'])->firstWhere('id_user', $this->memberUser->id_user);
            $pktData = collect($cust['paket_list'])->firstWhere('id_paket', $paket->id_paket);

            $this->assertEquals(3, $pktData['sesi_terpakai']);
            $this->assertEquals(8, $pktData['sisa_sesi']);

            $riwayatPemakaian = collect($pktData['riwayat_transaksi'])->firstWhere('selisih', -2);
            $this->assertNotNull($riwayatPemakaian);
            $this->assertEquals('Admin Penguji', $riwayatPemakaian['dicatat_oleh']);

            return $page;
        });
    }

    public function test_autofield_uses_active_package_with_remaining_sessions_and_supports_single_session_booking(): void
    {
        // Paket lama yang sudah habis (0 sesi tersisa)
        $paketLama = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 0,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        // Paket baru yang memiliki 8 sesi
        $paketBaru = PaketMember::create([
            'id_user' => $this->memberUser->id_user,
            'jumlah_sesi' => 8,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $this->memberUser->update([
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addDays(30)->toDateString(),
        ]);

        // Preview dengan jumlah_sesi = 1
        $preview = $this->service->previewMemberAutofield(
            $this->memberUser->id_user,
            $this->lapangan->id_lapangan,
            '5', // Jumat
            '08:00',
            '10:00',
            null,
            1 // hanya 1 sesi
        );

        $this->assertFalse($preview['has_conflict']);
        $this->assertTrue($preview['bisa_disimpan']);
        $this->assertEquals(8, $preview['sisa_sesi_paket'], 'Harus mengambil paket baru yang memiliki sisa sesi 8.');
        $this->assertCount(1, $preview['jadwal'], 'Jadwal harus dibatasi hanya 1 pertemuan.');

        // Simpan pemesanan 1 sesi
        $reservasi = $this->service->storeMemberAutofield([
            'id_user' => $this->memberUser->id_user,
            'id_lapangan' => $this->lapangan->id_lapangan,
            'hari' => '5',
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 1,
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => $preview['total_biaya'],
            'metode_pembayaran' => 'transfer',
        ], $this->admin->id_user);

        $paketBaru->refresh();
        $this->assertEquals(1, $paketBaru->sesi_reservasi);
        $this->assertEquals(7, $paketBaru->sisa_sesi, 'Sisa sesi pada paket baru harus terpotong 1.');
        $this->assertEquals($paketBaru->id_paket, $reservasi->id_paket);
    }
}
