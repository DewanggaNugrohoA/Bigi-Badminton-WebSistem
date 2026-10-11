<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\PenyesuaianPaket;
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

    
    public function test_autofield_all_or_nothing_with_package_limit(): void
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
            'tanggal_main' => Carbon::today('Asia/Jakarta')->addDays(5)->toDateString(),
            'jam_mulai' => '16:00',
            'jam_selesai' => '17:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 50000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $this->assertNull($reservasi->id_paket);
        $this->assertEquals(Reservasi::STATUS_TERKONFIRMASI, $reservasi->status_reservasi);
    }
}
