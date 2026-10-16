<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Models\Reservasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminOpenMabarApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $user;
    protected User $kasir;
    protected Lapangan $lapangan1;
    protected Lapangan $lapangan2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->lapangan1 = Lapangan::first();
        $this->lapangan2 = Lapangan::skip(1)->first() ?? Lapangan::create([
            'nama_lapangan' => 'Lapangan 2',
            'harga_per_jam' => 50000,
            'status_lapangan' => 'tersedia',
        ]);

        $this->admin = User::create([
            'nama' => 'Admin Penguji',
            'email' => 'admin.test@bigi.com',
            'no_whatsapp' => '081234567890',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->user = User::create([
            'nama' => 'Pengguna Mabar',
            'email' => 'user.mabar@example.com',
            'no_whatsapp' => '081234567891',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasir = User::create([
            'nama' => 'Kasir Penguji',
            'email' => 'kasir.test@bigi.com',
            'no_whatsapp' => '081234567892',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);
    }

    protected function createMabar(array $overrides = []): OpenMabar
    {
        return OpenMabar::create(array_merge([
            'id_user' => $this->user->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'judul' => 'Sesi Mabar Uji',
            'deskripsi' => 'Deskripsi uji mabar',
            'tanggal' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'gender' => OpenMabar::GENDER_CAMPURAN,
            'batas_usia_min' => 17,
            'batas_usia_max' => 50,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_MENUNGGU,
        ], $overrides));
    }

    public function test_guest_and_user_and_kasir_cannot_access_admin_open_mabar(): void
    {
        
        $this->get('/admin/open-mabar')->assertRedirect('/staff/login');

        
        $this->actingAs($this->user, 'web')
            ->get('/admin/open-mabar')
            ->assertRedirect('/staff/login');

        
        $this->actingAs($this->kasir, 'staff')
            ->get('/admin/open-mabar')
            ->assertStatus(403);
    }

    public function test_admin_can_view_open_mabar_index(): void
    {
        $this->createMabar([
            'judul' => 'Mabar Santai Malam',
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->get('/admin/open-mabar');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/OpenMabar/Index')
            ->has('daftarMabar.data', 1)
            ->has('daftarLapangan')
        );
    }

    public function test_admin_can_check_conflict_via_api(): void
    {
        $mabar = $this->createMabar([
            'judul' => 'Mabar API Conflict Test',
        ]);

        
        $res = $this->actingAs($this->admin, 'staff')
            ->getJson("/admin/open-mabar/{$mabar->id_mabar}/conflict");

        $res->assertStatus(200)
            ->assertJson([
                'status' => 'OK',
            ]);
    }

    public function test_admin_can_approve_open_mabar_successfully(): void
    {
        $mabar = $this->createMabar([
            'id_lapangan' => null, 
            'judul' => 'Mabar Lapangan Belum Dipilih',
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/approve", [
                'id_lapangan' => $this->lapangan1->id_lapangan,
            ]);

        $response->assertSessionHas('success');

        $mabar->refresh();
        $this->assertEquals(OpenMabar::STATUS_DISETUJUI, $mabar->status);
        $this->assertEquals($this->lapangan1->id_lapangan, $mabar->id_lapangan);

        
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'SETUJUI_OPEN_MABAR',
        ]);
    }

    public function test_cannot_approve_mabar_with_overlapping_reservation(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();

        
        $reservasi = Reservasi::create([
            'id_user' => $this->user->id_user,
            'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
            'total_biaya' => 100000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        DetailReservasi::create([
            'id_reservasi' => $reservasi->id_reservasi,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tomorrow,
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'durasi' => 2,
            'subtotal' => 100000,
        ]);

        $mabar = $this->createMabar([
            'judul' => 'Mabar Bentrok Reservasi',
            'tanggal' => $tomorrow,
            'jam_mulai' => '20:00:00',
            'jam_selesai' => '22:00:00',
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/approve", [
                'id_lapangan' => $this->lapangan1->id_lapangan,
            ]);

        $response->assertSessionHasErrors(['id_lapangan']);

        $mabar->refresh();
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabar->status);
    }

    public function test_cannot_approve_mabar_with_overlapping_approved_mabar(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();

        
        $this->createMabar([
            'judul' => 'Mabar Sudah Disetujui',
            'tanggal' => $tomorrow,
            'jam_mulai' => '16:00:00',
            'jam_selesai' => '18:00:00',
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        
        $mabar2 = $this->createMabar([
            'judul' => 'Mabar Tumpang Tindih',
            'tanggal' => $tomorrow,
            'jam_mulai' => '17:00:00',
            'jam_selesai' => '19:00:00',
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar2->id_mabar}/approve", [
                'id_lapangan' => $this->lapangan1->id_lapangan,
            ]);

        $response->assertSessionHasErrors(['id_lapangan']);
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabar2->fresh()->status);
    }

    public function test_cannot_approve_mabar_when_court_in_maintenance(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();

        $this->lapangan1->update(['status_lapangan' => 'perawatan']);

        $mabar = $this->createMabar([
            'judul' => 'Mabar Lapangan Rusak',
            'tanggal' => $tomorrow,
            'jam_mulai' => '10:00:00',
            'jam_selesai' => '12:00:00',
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/approve", [
                'id_lapangan' => $this->lapangan1->id_lapangan,
            ]);

        $response->assertSessionHasErrors(['id_lapangan']);
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabar->fresh()->status);
    }

    public function test_adjacent_time_slots_are_allowed(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();

        
        $this->createMabar([
            'judul' => 'Mabar Jam 18-20',
            'tanggal' => $tomorrow,
            'jam_mulai' => '18:00:00',
            'jam_selesai' => '20:00:00',
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        
        $mabar2 = $this->createMabar([
            'judul' => 'Mabar Jam 20-22 Berdampingan',
            'tanggal' => $tomorrow,
            'jam_mulai' => '20:00:00',
            'jam_selesai' => '22:00:00',
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar2->id_mabar}/approve", [
                'id_lapangan' => $this->lapangan1->id_lapangan,
            ]);

        $response->assertSessionHas('success');
        $this->assertEquals(OpenMabar::STATUS_DISETUJUI, $mabar2->fresh()->status);
    }

    public function test_cannot_approve_past_date_mabar(): void
    {
        $yesterday = Carbon::yesterday('Asia/Jakarta')->toDateString();

        $mabar = $this->createMabar([
            'judul' => 'Mabar Kemarin',
            'tanggal' => $yesterday,
            'jam_mulai' => '10:00:00',
            'jam_selesai' => '12:00:00',
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/approve", [
                'id_lapangan' => $this->lapangan1->id_lapangan,
            ]);

        $response->assertSessionHasErrors();
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabar->fresh()->status);
    }

    public function test_cannot_approve_non_menunggu_mabar(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();

        $mabar = $this->createMabar([
            'judul' => 'Mabar Sudah Ditolak',
            'tanggal' => $tomorrow,
            'jam_mulai' => '14:00:00',
            'jam_selesai' => '16:00:00',
            'status' => OpenMabar::STATUS_DITOLAK,
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/approve", [
                'id_lapangan' => $this->lapangan1->id_lapangan,
            ]);

        $response->assertSessionHasErrors();
        $this->assertEquals(OpenMabar::STATUS_DITOLAK, $mabar->fresh()->status);
    }

    public function test_admin_can_reject_with_valid_reason(): void
    {
        $mabar = $this->createMabar([
            'judul' => 'Mabar Akan Ditolak',
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/reject", [
                'alasan' => 'Deskripsi tidak lengkap dan kontak tidak dapat dihubungi.',
            ]);

        $response->assertSessionHas('success');

        $mabar->refresh();
        $this->assertEquals(OpenMabar::STATUS_DITOLAK, $mabar->status);

        
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'TOLAK_OPEN_MABAR',
        ]);

        $log = AuditLog::where('aksi', 'TOLAK_OPEN_MABAR')->latest('id_log')->first();
        $this->assertStringContainsString('Deskripsi tidak lengkap', $log->keterangan);
    }

    public function test_reject_validation_fails_if_reason_is_empty_or_too_short(): void
    {
        $mabar = $this->createMabar([
            'judul' => 'Mabar Validasi Alasan',
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/reject", [
                'alasan' => 'abc', 
            ]);

        $response->assertSessionHasErrors(['alasan']);
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabar->fresh()->status);
    }

    public function test_cannot_reject_disetujui_mabar_if_participants_already_joined(): void
    {
        $mabar = $this->createMabar([
            'judul' => 'Mabar Dengan Peserta',
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        
        PesertaMabar::create([
            'id_mabar' => $mabar->id_mabar,
            'id_user' => $this->user->id_user,
            'tanggal_daftar' => Carbon::now('Asia/Jakarta')->toDateString(),
            'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
        ]);

        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/open-mabar/{$mabar->id_mabar}/reject", [
                'alasan' => 'Dibatalkan sepihak oleh admin meskipun ada peserta.',
            ]);

        $response->assertSessionHasErrors();
        $this->assertEquals(OpenMabar::STATUS_DISETUJUI, $mabar->fresh()->status);
    }

    public function test_customer_open_mabar_list_only_shows_approved(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();

        
        $approved = $this->createMabar([
            'judul' => 'Mabar Approved List',
            'tanggal' => $tomorrow,
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '10:00:00',
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        
        $this->createMabar([
            'judul' => 'Mabar Menunggu List',
            'tanggal' => $tomorrow,
            'jam_mulai' => '10:00:00',
            'jam_selesai' => '12:00:00',
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        
        $this->createMabar([
            'judul' => 'Mabar Ditolak List',
            'tanggal' => $tomorrow,
            'jam_mulai' => '12:00:00',
            'jam_selesai' => '14:00:00',
            'status' => OpenMabar::STATUS_DITOLAK,
        ]);

        $res = $this->actingAs($this->user, 'web')
            ->get('/open-mabar/mabar-bareng');

        $res->assertStatus(200);
        $res->assertInertia(fn ($page) => $page
            ->component('OpenMabar/MabarBareng')
            ->where('jadwal.data.0.id_mabar', $approved->id_mabar)
            ->has('jadwal.data', 1)
        );
    }
}
