<?php

namespace Tests\Feature;

use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Models\User;
use App\Services\LaporanEksporService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class SecurityPaket1FixesTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $kasir;
    protected User $creator;
    protected User $peserta;
    protected User $outsider;
    protected OpenMabar $mabarDisetujui;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->admin = User::create([
            'nama' => 'Admin Security',
            'email' => 'admin.sec@bigi.test',
            'no_whatsapp' => '081299990001',
            'password' => Hash::make('AdminSec123!'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasir = User::create([
            'nama' => 'Kasir Security',
            'email' => 'kasir.sec@bigi.test',
            'no_whatsapp' => '081299990002',
            'password' => Hash::make('KasirSec123!'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->creator = User::create([
            'nama' => 'Creator Mabar',
            'email' => 'creator@bigi.test',
            'no_whatsapp' => '081299990003',
            'password' => Hash::make('Creator123!'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->peserta = User::create([
            'nama' => 'Peserta Mabar',
            'email' => 'peserta@bigi.test',
            'no_whatsapp' => '081299990004',
            'password' => Hash::make('Peserta123!'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->outsider = User::create([
            'nama' => 'User Luar',
            'email' => 'outsider@bigi.test',
            'no_whatsapp' => '081299990005',
            'password' => Hash::make('Outsider123!'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $lapangan = \App\Models\Lapangan::first();

        $this->mabarDisetujui = OpenMabar::create([
            'id_user' => $this->creator->id_user,
            'id_lapangan' => $lapangan->id_lapangan,
            'judul' => 'Mabar Approved Test',
            'deskripsi' => 'Deskripsi Mabar',
            'tanggal' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'gender' => OpenMabar::GENDER_CAMPURAN,
            'batas_usia_min' => 17,
            'batas_usia_max' => 50,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        PesertaMabar::create([
            'id_mabar' => $this->mabarDisetujui->id_mabar,
            'id_user' => $this->peserta->id_user,
            'tanggal_daftar' => Carbon::now()->toDateString(),
            'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
        ]);
    }

    /**
     * Butir 1 (SEC-03): Non-peserta ditolak di channel mabar broadcast,
     * pembuat dan peserta aktif diizinkan, admin diizinkan, kasir ditolak.
     */
    public function test_sec_03_broadcast_channel_authorizes_only_creator_active_peserta_and_admin(): void
    {
        $channels = Broadcast::getChannels();
        $this->assertArrayHasKey('mabar.{id_mabar}', $channels);
        $callback = $channels['mabar.{id_mabar}'];

        // Creator diizinkan
        $this->assertTrue((bool) $callback($this->creator, $this->mabarDisetujui->id_mabar));

        // Peserta aktif diizinkan
        $this->assertTrue((bool) $callback($this->peserta, $this->mabarDisetujui->id_mabar));

        // Outsider (user bukan pembuat dan bukan peserta) ditolak
        $this->assertFalse((bool) $callback($this->outsider, $this->mabarDisetujui->id_mabar));

        // Admin diizinkan
        $this->assertTrue((bool) $callback($this->admin, $this->mabarDisetujui->id_mabar));

        // Kasir ditolak
        $this->assertFalse((bool) $callback($this->kasir, $this->mabarDisetujui->id_mabar));
    }

    /**
     * Butir 2 (SEC-04): Hapus mabar berstatus disetujui ditolak dengan 403
     * dan pesan yang jelas bagi pembuat mabar.
     */
    public function test_sec_04_deleting_approved_mabar_is_forbidden_with_clear_message(): void
    {
        $response = $this->actingAs($this->creator, 'web')
            ->delete("/open-mabar/{$this->mabarDisetujui->id_mabar}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('open_mabar', [
            'id_mabar' => $this->mabarDisetujui->id_mabar,
        ]);
    }

    /**
     * Butir 3 (SEC-05): Formula injection sanitization menetralkan sel
     * berawalan spasi lalu '=', '+', '-', '@', '|', tab, atau carriage return.
     */
    public function test_sec_05_excel_formula_sanitization_neutralizes_spaces_and_triggers(): void
    {
        $service = new LaporanEksporService();

        // Menggunakan reflection untuk menguji method protected sanitizeText
        $reflection = new \ReflectionClass(LaporanEksporService::class);
        $method = $reflection->getMethod('sanitizeText');
        $method->setAccessible(true);

        $inputsAndExpected = [
            ' =1+1' => "' =1+1",
            "  +SUM(A1:A10)" => "'  +SUM(A1:A10)",
            "   -123cmd" => "'   -123cmd",
            " \t@injection" => "' \t@injection",
            " |calc" => "' |calc",
            "\t=cmd" => "'\t=cmd",
            "\r+123" => "'\r+123",
            'Normal Text' => 'Normal Text',
            '12345' => '12345',
        ];

        foreach ($inputsAndExpected as $input => $expected) {
            $sanitized = $method->invoke($service, $input);
            $this->assertSame($expected, $sanitized, "Sanitasi gagal untuk input [{$input}]");
        }
    }

    /**
     * Butir 4 (SEC-06): Sesi invalid setelah logout (user & staff).
     */
    public function test_sec_06_session_is_invalidated_after_logout(): void
    {
        // 1. User logout
        $this->post('/login', [
            'email' => $this->creator->email,
            'password' => 'Creator123!',
        ]);
        $this->assertAuthenticatedAs($this->creator, 'web');

        $sessionBeforeLogout = session()->getId();
        $this->post('/logout')->assertRedirect('/');
        $this->assertGuest('web');
        $this->assertNotSame($sessionBeforeLogout, session()->getId());

        // 2. Staff logout
        $this->post('/staff/login', [
            'email' => $this->admin->email,
            'password' => 'AdminSec123!',
        ]);
        $this->assertAuthenticatedAs($this->admin, 'staff');

        $staffSessionBefore = session()->getId();
        $this->post('/staff/logout')->assertRedirect('/staff/login');
        $this->assertGuest('staff');
        $this->assertNotSame($staffSessionBefore, session()->getId());
    }

    /**
     * Butir 5 (SEC-09): Kasir ditolak saat memanggil approve/reject open mabar.
     */
    public function test_sec_09_kasir_is_rejected_on_approve_and_reject_open_mabar(): void
    {
        $lapangan = \App\Models\Lapangan::first();

        $mabarMenunggu = OpenMabar::create([
            'id_user' => $this->creator->id_user,
            'id_lapangan' => $lapangan->id_lapangan,
            'judul' => 'Mabar Menunggu Approval',
            'deskripsi' => 'Deskripsi Mabar',
            'tanggal' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '20:00:00',
            'jam_selesai' => '22:00:00',
            'gender' => OpenMabar::GENDER_CAMPURAN,
            'batas_usia_min' => 17,
            'batas_usia_max' => 50,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        // Kasir coba panggil approve -> 403 Forbidden
        $responseApprove = $this->actingAs($this->kasir, 'staff')
            ->post("/admin/open-mabar/{$mabarMenunggu->id_mabar}/approve", [
                'id_lapangan' => $lapangan->id_lapangan,
            ]);
        $responseApprove->assertStatus(403);

        // Kasir coba panggil reject -> 403 Forbidden
        $responseReject = $this->actingAs($this->kasir, 'staff')
            ->post("/admin/open-mabar/{$mabarMenunggu->id_mabar}/reject", [
                'alasan' => 'Ditolak oleh kasir',
            ]);
        $responseReject->assertStatus(403);
    }

    /**
     * Butir 6 (SEC-10): Verifikasi OTP memiliki rate limiting dan batas percobaan.
     */
    public function test_sec_10_otp_verification_rate_limiting_and_attempt_limit(): void
    {
        $nomorWa = '081299990099';
        \App\Models\VerifikasiOtp::create([
            'nama' => 'User Registrasi Baru',
            'no_whatsapp' => $nomorWa,
            'password' => Hash::make('Rahasia123!'),
            'kode_otp' => hash('sha256', '123456'),
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        RateLimiter::clear('otp_attempts:' . $nomorWa);
        RateLimiter::clear('verify_otp_ip:127.0.0.1');

        // Coba salah 5 kali hingga batas percobaan tercapai
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->post('/register/verifikasi', [
                'no_whatsapp' => $nomorWa,
                'kode_otp' => '999999',
            ]);

            $response->assertSessionHasErrors(['kode_otp']);

            if ($i === 5) {
                // Pada percobaan ke-5, model VerifikasiOtp dihapus
                $this->assertDatabaseMissing('verifikasi_otp', [
                    'no_whatsapp' => $nomorWa,
                ]);
            }
        }

        // Test IP Rate Limiting di verify_otp_ip (max 15)
        for ($i = 0; $i < 15; $i++) {
            RateLimiter::hit('verify_otp_ip:127.0.0.1', 900);
        }

        $resThrottled = $this->post('/register/verifikasi', [
            'no_whatsapp' => $nomorWa,
            'kode_otp' => '123456',
        ]);

        $resThrottled->assertSessionHasErrors(['kode_otp']);
        $this->assertStringContainsString('Terlalu banyak percobaan', session('errors')->first('kode_otp'));
    }

    /**
     * Butir 9: Header keamanan (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) terpasang.
     */
    public function test_security_headers_middleware_is_applied(): void
    {
        $response = $this->get('/');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
