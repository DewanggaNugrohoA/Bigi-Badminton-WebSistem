<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use App\Services\ReservasiService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ConflictLogicTest extends TestCase
{
    use RefreshDatabase;

    protected ReservasiService $service;
    protected Lapangan $lapangan1;
    protected Lapangan $lapangan2;
    protected User $userReguler;
    protected User $userMember;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->service = new ReservasiService();
        $this->lapangan1 = Lapangan::where('nama_lapangan', 'Lapangan 1')->first();
        $this->lapangan2 = Lapangan::where('nama_lapangan', 'Lapangan 2')->first();
        
        $this->userReguler = User::create([
            'nama' => 'User Reguler Uji',
            'email' => 'reguler.c@example.com',
            'no_whatsapp' => '08166660001',
            'password' => bcrypt('secret123'),
            'role' => 'user',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
        ]);

        $this->userMember = User::create([
            'nama' => 'User Member Uji',
            'email' => 'member.c@example.com',
            'no_whatsapp' => '08166660002',
            'password' => bcrypt('secret123'),
            'role' => 'user',
            'jenis_pelanggan' => 'member',
            'tanggal_mulai_member' => Carbon::now()->subDays(10)->toDateString(),
            'tanggal_akhir_member' => Carbon::now()->addDays(20)->toDateString(),
            'status_member' => 'aktif',
        ]);

        $this->admin = User::create([
            'nama' => 'Admin Uji',
            'email' => 'admin.c@example.com',
            'no_whatsapp' => '08166660003',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
        ]);
    }

    
    public function test_overlapping_slots_are_blocked(): void
    {
        $tanggal = Carbon::now()->addDays(10)->toDateString();

        
        $this->service->createRegularReservasi([
            'id_user' => $this->userReguler->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tanggal,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        
        $conflict = $this->service->checkSlotConflict($this->lapangan1->id_lapangan, $tanggal, '11:00', '13:00');
        $this->assertNotNull($conflict);
        $this->assertStringContainsString('bentrok', $conflict);

        
        $conflictInside = $this->service->checkSlotConflict($this->lapangan1->id_lapangan, $tanggal, '10:30', '11:30');
        $this->assertNotNull($conflictInside);

        
        $conflictSurround = $this->service->checkSlotConflict($this->lapangan1->id_lapangan, $tanggal, '09:00', '13:00');
        $this->assertNotNull($conflictSurround);
    }

    
    public function test_adjacent_slots_are_allowed(): void
    {
        $tanggal = Carbon::now()->addDays(10)->toDateString();

        $this->service->createRegularReservasi([
            'id_user' => $this->userReguler->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tanggal,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $conflictBefore = $this->service->checkSlotConflict($this->lapangan1->id_lapangan, $tanggal, '08:00', '10:00');
        $this->assertNull($conflictBefore);

        $conflictAfter = $this->service->checkSlotConflict($this->lapangan1->id_lapangan, $tanggal, '12:00', '14:00');
        $this->assertNull($conflictAfter);
    }

    
    public function test_cancelled_reservations_are_ignored(): void
    {
        $tanggal = Carbon::now()->addDays(11)->toDateString();

        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->userReguler->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tanggal,
            'jam_mulai' => '14:00',
            'jam_selesai' => '16:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
            'metode_pembayaran' => Pembayaran::METODE_TUNAI,
        ], $this->admin->id_user);

        $this->service->batalkanReservasi($reservasi->id_reservasi, 'Dibatalkan oleh pelanggan', $this->admin->id_user);

        $conflict = $this->service->checkSlotConflict($this->lapangan1->id_lapangan, $tanggal, '14:00', '16:00');
        $this->assertNull($conflict);
    }

    
    public function test_maintenance_court_is_blocked(): void
    {
        $tanggal = Carbon::now()->addDays(12)->toDateString();
        $this->lapangan2->update(['status_lapangan' => Lapangan::STATUS_PERAWATAN]);

        $conflict = $this->service->checkSlotConflict($this->lapangan2->id_lapangan, $tanggal, '15:00', '17:00');
        $this->assertNotNull($conflict);
        $this->assertStringContainsString('perawatan', $conflict);
    }

    
    public function test_approved_open_mabar_does_not_automatically_block_court_slot(): void
    {
        $tanggal = Carbon::now()->addDays(13)->toDateString();

        OpenMabar::create([
            'id_user' => $this->userReguler->id_user,
            'judul' => 'Mabar Khusus Komunitas',
            'tanggal' => $tanggal,
            'jam_mulai' => '18:00:00',
            'jam_selesai' => '21:00:00',
            'gender' => OpenMabar::GENDER_CAMPURAN,
            'batas_usia_min' => 17,
            'batas_usia_max' => 50,
            'kuota' => 12,
            'status' => OpenMabar::STATUS_DISETUJUI,
            'id_lapangan' => $this->lapangan1->id_lapangan,
        ]);

        $conflict = $this->service->checkSlotConflict($this->lapangan1->id_lapangan, $tanggal, '19:00', '20:00');
        $this->assertNull($conflict);
    }

    
    public function test_payment_rules_dp_and_lunas(): void
    {
        $tanggal = Carbon::now()->addDays(14)->toDateString();

        try {
            $this->service->createRegularReservasi([
                'id_user' => $this->userReguler->id_user,
                'id_lapangan' => $this->lapangan1->id_lapangan,
                'tanggal_main' => $tanggal,
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
                'jumlah_bayar' => 50000,
            ], $this->admin->id_user);
            $this->fail('Seharusnya gagal validasi karena jumlah lunas kurang dari total.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('jumlah_bayar', $e->errors());
        }

        $resDP = $this->service->createRegularReservasi([
            'id_user' => $this->userReguler->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tanggal,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah_bayar' => 50000,
        ], $this->admin->id_user);

        $this->assertEquals(100000, $resDP->total_biaya);
        $this->assertEquals('DP', $resDP->pembayaran->first()->jenis_pembayaran);
    }

    
    public function test_member_autofield_is_all_or_nothing_when_conflict_exists(): void
    {
        
        $this->userMember->update([
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addDays(28)->toDateString(),
            'status_member' => 'aktif',
        ]);

        
        $targetHari = 0;
        
        
        
        $minggu2 = Carbon::today('Asia/Jakarta')->next(Carbon::SUNDAY)->addWeek();
        
        $this->service->createRegularReservasi([
            'id_user' => $this->userReguler->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $minggu2->toDateString(),
            'jam_mulai' => '16:00',
            'jam_selesai' => '18:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
        ], $this->admin->id_user);

        $initialReservasiCount = Reservasi::count();
        $initialDetailCount = DetailReservasi::count();

        
        $preview = $this->service->previewMemberAutofield(
            $this->userMember->id_user,
            $this->lapangan1->id_lapangan,
            (string) $targetHari,
            '16:00',
            '18:00'
        );

        $this->assertTrue($preview['has_conflict']);
        $this->assertFalse($preview['bisa_disimpan']);

        
        try {
            $this->service->storeMemberAutofield([
                'id_user' => $this->userMember->id_user,
                'id_lapangan' => $this->lapangan1->id_lapangan,
                'hari' => (string) $targetHari,
                'jam_mulai' => '16:00',
                'jam_selesai' => '18:00',
                'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
                'jumlah_bayar' => $preview['total_biaya'],
            ], $this->admin->id_user);

            $this->fail('Seharusnya gagal menyimpan member autofield karena terdapat tanggal bentrok.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('autofield', $e->errors());
            $this->assertStringContainsString($minggu2->toDateString(), $e->errors()['autofield'][0]);
        }

        
        $this->assertEquals($initialReservasiCount, Reservasi::count(), 'Reservasi baru tidak boleh dibuat saat ada tanggal bentrok.');
        $this->assertEquals($initialDetailCount, DetailReservasi::count(), 'Detail reservasi tidak boleh dibuat saat ada tanggal bentrok.');
    }

    
    public function test_reservasi_total_biaya_equals_sum_of_detail_subtotals(): void
    {
        
        $this->userMember->update([
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addDays(21)->toDateString(),
            'status_member' => 'aktif',
        ]);

        \App\Models\PaketMember::create([
            'id_user' => $this->userMember->id_user,
            'jumlah_sesi' => 10,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir' => Carbon::today('Asia/Jakarta')->addDays(30)->toDateString(),
            'status' => 'aktif',
        ]);

        $preview = $this->service->previewMemberAutofield(
            $this->userMember->id_user,
            $this->lapangan2->id_lapangan,
            '2', 
            '08:00',
            '10:00' 
        );

        if ($preview['bisa_disimpan']) {
            $res = $this->service->storeMemberAutofield([
                'id_user' => $this->userMember->id_user,
                'id_lapangan' => $this->lapangan2->id_lapangan,
                'hari' => '2',
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
                'jumlah_bayar' => $preview['total_biaya'],
            ], $this->admin->id_user);

            $sumSubtotal = $res->detailReservasi()->sum('subtotal');
            $this->assertEquals((float) $res->total_biaya, (float) $sumSubtotal);
            // Pada aturan baru, sesi member tidak memiliki tagihan (total_biaya = 0) karena dibayar di awal saat daftar paket
            $this->assertEquals(0, (float) $res->total_biaya);
        }
    }

    
    public function test_all_actions_write_audit_log_entries(): void
    {
        $initialLogCount = AuditLog::count();
        $tanggal = Carbon::now()->addDays(15)->toDateString();

        
        $res = $this->service->createRegularReservasi([
            'id_user' => $this->userReguler->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tanggal,
            'jam_mulai' => '14:00',
            'jam_selesai' => '16:00',
            'jenis_pembayaran' => Pembayaran::JENIS_DP,
            'jumlah_bayar' => 50000,
        ], $this->admin->id_user);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'TAMBAH_RESERVASI',
        ]);

        
        $this->service->lunasiPembayaran($res->id_reservasi, [
            'jumlah' => 50000,
            'metode_pembayaran' => 'tunai',
        ], $this->admin->id_user);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'PELUNASAN_SEWA',
        ]);

        
        $this->service->selesaikanReservasi($res->id_reservasi, $this->admin->id_user);

        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->admin->id_user,
            'aksi' => 'SELESAIKAN_RESERVASI',
        ]);

        $this->assertEquals($initialLogCount + 3, AuditLog::count());
    }
}
