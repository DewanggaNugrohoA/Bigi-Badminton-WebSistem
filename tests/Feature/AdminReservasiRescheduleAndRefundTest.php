<?php

namespace Tests\Feature;

use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use App\Services\ReservasiService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReservasiRescheduleAndRefundTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $member;
    protected Lapangan $lapangan1;
    protected Lapangan $lapangan2;
    protected ReservasiService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'nama' => 'Admin Bigi',
            'email' => 'admin_test@bigi.test',
            'no_whatsapp' => '081299990001',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->member = User::create([
            'nama' => 'Angga Member',
            'email' => 'angga_test@bigi.test',
            'no_whatsapp' => '081234567890',
            'password' => bcrypt('password'),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
            'status_member' => User::STATUS_MEMBER_AKTIF,
            'status_akun' => User::STATUS_AKUN_AKTIF,
            'tanggal_mulai_member' => Carbon::today('Asia/Jakarta')->toDateString(),
            'tanggal_akhir_member' => Carbon::today('Asia/Jakarta')->addMonths(3)->toDateString(),
        ]);

        $this->lapangan1 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 1',
            'harga_per_jam' => 50000,
            'status_lapangan' => Lapangan::STATUS_TERSEDIA,
        ]);

        $this->lapangan2 = Lapangan::create([
            'nama_lapangan' => 'Lapangan 2',
            'harga_per_jam' => 50000,
            'status_lapangan' => Lapangan::STATUS_TERSEDIA,
        ]);

        $this->service = app(ReservasiService::class);
    }

    public function test_member_cancel_reservasi_mengembalikan_sesi_bermain(): void
    {
        // 1. Angga memiliki paket 4 sesi
        $paket = PaketMember::create([
            'id_user' => $this->member->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $this->assertEquals(4, $paket->fresh()->sisa_sesi);

        // 2. Booking 1 sesi untuk tanggal esok hari
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();
        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->member->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tomorrow,
            'jam_mulai' => '13:00',
            'jam_selesai' => '15:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
        ], $this->admin->id_user);

        // Sisa sesi Angga terpotong menjadi 3
        $this->assertEquals(3, $paket->fresh()->sisa_sesi);

        // 3. Batalkan reservasi via endpoint admin
        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/reservasi/{$reservasi->id_reservasi}/cancel", [
                'alasan' => 'Angga berhalangan hadir dan membatalkan main',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals(Reservasi::STATUS_BATAL, $reservasi->fresh()->status_reservasi);

        // Sisa sesi Angga kembali menjadi 4!
        $this->assertEquals(4, $paket->fresh()->sisa_sesi);
    }

    public function test_member_hapus_reservasi_mengembalikan_sesi_bermain(): void
    {
        // 1. Angga memiliki paket 4 sesi
        $paket = PaketMember::create([
            'id_user' => $this->member->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();
        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->member->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tomorrow,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
        ], $this->admin->id_user);

        // Sisa sesi jadi 3
        $this->assertEquals(3, $paket->fresh()->sisa_sesi);

        // 2. Hapus reservasi permanen via endpoint DELETE admin
        $response = $this->actingAs($this->admin, 'staff')
            ->delete("/admin/reservasi/{$reservasi->id_reservasi}", [
                'alasan' => 'Hapus pemesanan atas permintaan member',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('reservasi', ['id_reservasi' => $reservasi->id_reservasi]);

        // Sisa sesi Angga kembali menjadi 4!
        $this->assertEquals(4, $paket->fresh()->sisa_sesi);
    }

    public function test_admin_bisa_reschedule_reservasi_member(): void
    {
        $paket = PaketMember::create([
            'id_user' => $this->member->id_user,
            'jumlah_sesi' => 4,
            'tanggal_mulai' => Carbon::today('Asia/Jakarta')->toDateString(),
            'status' => PaketMember::STATUS_AKTIF,
        ]);

        $tgl1 = Carbon::tomorrow('Asia/Jakarta')->toDateString();
        $tgl2 = Carbon::tomorrow('Asia/Jakarta')->addDays(2)->toDateString();

        $reservasi = $this->service->createRegularReservasi([
            'id_user' => $this->member->id_user,
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tgl1,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
        ], $this->admin->id_user);

        // Sisa sesi 3
        $this->assertEquals(3, $paket->fresh()->sisa_sesi);

        // Reschedule ke tgl2 di Lapangan 2 jam 14:00 - 16:00
        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/reservasi/{$reservasi->id_reservasi}/reschedule", [
                'id_lapangan' => $this->lapangan2->id_lapangan,
                'tanggal_main' => $tgl2,
                'jam_mulai' => '14:00',
                'jam_selesai' => '16:00',
                'alasan' => 'Member reschedule jadwal main',
            ]);

        $response->assertSessionHasNoErrors();

        $detail = DetailReservasi::where('id_reservasi', $reservasi->id_reservasi)->first();
        $this->assertEquals($tgl2, $detail->tanggal_main);
        $this->assertEquals('14:00:00', $detail->jam_mulai);
        $this->assertEquals('16:00:00', $detail->jam_selesai);
        $this->assertEquals($this->lapangan2->id_lapangan, $detail->id_lapangan);

        // Sesi tetap 3 (tidak berkurang lagi dan tidak bertambah)
        $this->assertEquals(3, $paket->fresh()->sisa_sesi);
    }

    public function test_admin_cannot_reschedule_non_member_reservasi(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();
        $nextDay = Carbon::tomorrow('Asia/Jakarta')->addDays(2)->toDateString();

        // Reservasi reguler biasa (bukan member)
        $reservasi = $this->service->createRegularReservasi([
            'nama_pemesan' => 'Budi Reguler',
            'no_whatsapp_pemesan' => '089911223344',
            'id_lapangan' => $this->lapangan1->id_lapangan,
            'tanggal_main' => $tomorrow,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
            'jumlah_bayar' => 100000,
        ], $this->admin->id_user);

        // Coba reschedule via endpoint
        $response = $this->actingAs($this->admin, 'staff')
            ->post("/admin/reservasi/{$reservasi->id_reservasi}/reschedule", [
                'id_lapangan' => $this->lapangan2->id_lapangan,
                'tanggal_main' => $nextDay,
                'jam_mulai' => '14:00',
                'jam_selesai' => '16:00',
                'alasan' => 'Minta ganti jadwal',
            ]);

        $response->assertSessionHasErrors('reschedule');
    }
}
