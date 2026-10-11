<?php

namespace Tests\Feature;

use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Models\User;
use App\Models\VerifikasiOtp;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class SecurityHardeningPhase1Test extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $kasirUser;
    protected User $customerUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->adminUser = User::create([
            'nama' => 'Admin Security',
            'email' => 'admin.sec@example.com',
            'no_whatsapp' => '087711110001',
            'password' => Hash::make('AdminPass123!'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->kasirUser = User::create([
            'nama' => 'Kasir Security',
            'email' => 'kasir.sec@example.com',
            'no_whatsapp' => '087711110002',
            'password' => Hash::make('KasirPass123!'),
            'role' => User::ROLE_KASIR,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->customerUser = User::create([
            'nama' => 'Customer Security',
            'email' => 'customer.sec@example.com',
            'no_whatsapp' => '087711110003',
            'password' => Hash::make('CustomerPass123!'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);
    }

    
    public function test_staff_credentials_rejected_on_customer_login(): void
    {
        $response = $this->post('/login', [
            'email' => $this->adminUser->email,
            'password' => 'AdminPass123!',
        ]);

        $response->assertSessionHasErrors(['email' => 'Nomor WhatsApp/Email atau kata sandi salah.']);
        $this->assertGuest();

        $responseKasir = $this->post('/login', [
            'email' => $this->kasirUser->email,
            'password' => 'KasirPass123!',
        ]);

        $responseKasir->assertSessionHasErrors(['email' => 'Nomor WhatsApp/Email atau kata sandi salah.']);
        $this->assertGuest();
    }

    
    public function test_customer_login_rate_limit_lockout(): void
    {
        RateLimiter::clear('login_ip:127.0.0.1');
        RateLimiter::clear('login_identifier:' . $this->customerUser->email . '|127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $response = $this->post('/login', [
                'email' => $this->customerUser->email,
                'password' => 'WrongPass',
            ]);
            $response->assertSessionHasErrors('email');
        }

        $lockoutResponse = $this->post('/login', [
            'email' => $this->customerUser->email,
            'password' => 'CustomerPass123!',
        ]);

        $lockoutResponse->assertSessionHasErrors('email');
        $this->assertTrue(str_contains(
            session('errors')->first('email'),
            'Terlalu banyak percobaan masuk yang gagal'
        ));
    }

    
    public function test_otp_stored_hashed_and_rate_limited(): void
    {
        $capturedOtp = null;
        $mockWa = $this->mock(WhatsAppService::class);
        $mockWa->shouldReceive('sendOtp')->andReturnUsing(function ($phone, $otp) use (&$capturedOtp) {
            $capturedOtp = $otp;
            return true;
        });

        $response = $this->post('/register', [
            'nama' => 'Pengguna Baru OTP',
            'no_whatsapp' => '087799990001',
            'password' => 'Testing1234!',
            'password_confirmation' => 'Testing1234!',
        ]);

        $response->assertRedirect(route('register.verifikasi'));
        $successFlash = session('success');
        $this->assertStringNotContainsString('Dev Kode', $successFlash);
        $this->assertNotNull($capturedOtp);

        $record = VerifikasiOtp::where('no_whatsapp', '6287799990001')->first();
        $this->assertNotNull($record);
        $this->assertNotEquals($capturedOtp, $record->kode_otp);
        $expectedHash = hash_hmac('sha256', $capturedOtp, (string) config('app.key'));
        $this->assertTrue(hash_equals($record->kode_otp, $expectedHash));

        
        $secondResponse = $this->post('/register', [
            'nama' => 'Pengguna Baru OTP',
            'no_whatsapp' => '087799990001',
            'password' => 'Testing1234!',
            'password_confirmation' => 'Testing1234!',
        ]);
        $secondResponse->assertSessionHasErrors('no_whatsapp');
        $this->assertTrue(str_contains(
            session('errors')->first('no_whatsapp'),
            'Tunggu'
        ));
    }

    
    public function test_otp_invalidates_after_5_failed_attempts(): void
    {
        $mockWa = $this->mock(WhatsAppService::class);
        $mockWa->shouldReceive('sendOtp')->andReturn(true);

        $this->post('/register', [
            'nama' => 'Pengguna Failed OTP',
            'no_whatsapp' => '087799990002',
            'password' => 'Testing1234!',
            'password_confirmation' => 'Testing1234!',
        ]);

        $this->assertDatabaseHas('verifikasi_otp', ['no_whatsapp' => '6287799990002']);

        
        for ($i = 0; $i < 4; $i++) {
            $resp = $this->post('/register/verifikasi', [
                'no_whatsapp' => '6287799990002',
                'kode_otp' => '000000',
            ]);
            $resp->assertSessionHasErrors('kode_otp');
            $this->assertDatabaseHas('verifikasi_otp', ['no_whatsapp' => '6287799990002']);
        }

        
        $resp5 = $this->post('/register/verifikasi', [
            'no_whatsapp' => '6287799990002',
            'kode_otp' => '000000',
        ]);
        $resp5->assertSessionHasErrors('kode_otp');
        $this->assertTrue(str_contains(
            session('errors')->first('kode_otp'),
            'sebanyak 5 kali'
        ));

        $this->assertDatabaseMissing('verifikasi_otp', ['no_whatsapp' => '6287799990002']);
    }

    
    public function test_quick_customer_has_random_password(): void
    {
        $admin = $this->adminUser;

        $response = $this->actingAs($admin, 'staff')->postJson('/admin/reservasi/quick-customer', [
            'nama' => 'Quick Pelanggan Aman',
            'no_whatsapp' => '087799990003',
            'jenis_pelanggan' => 'reguler',
        ]);

        $response->assertStatus(200);
        $createdUser = User::where('no_whatsapp', '087799990003')->first();
        $this->assertNotNull($createdUser);

        
        $this->assertFalse(Hash::check('BigiBadminton123!', $createdUser->password));
        $this->assertFalse(Hash::check('Bigi@12345', $createdUser->password));
    }

    
    public function test_chat_mabar_authorization(): void
    {
        $hostUser = $this->customerUser;
        $pesertaUser = User::create([
            'nama' => 'Peserta Aktif',
            'email' => 'peserta@example.com',
            'no_whatsapp' => '087711110004',
            'password' => Hash::make('Pass123!'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $outsiderUser = User::create([
            'nama' => 'Orang Luar',
            'email' => 'outsider@example.com',
            'no_whatsapp' => '087711110005',
            'password' => Hash::make('Pass123!'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $mabar = OpenMabar::create([
            'id_user' => $hostUser->id_user,
            'judul' => 'Mabar Komunitas Security',
            'tanggal' => now()->addDays(2)->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'gender' => 'campuran',
            'batas_usia_min' => 15,
            'batas_usia_max' => 50,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        PesertaMabar::create([
            'id_mabar' => $mabar->id_mabar,
            'id_user' => $pesertaUser->id_user,
            'tanggal_daftar' => now(),
            'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
        ]);

        
        $this->actingAs($hostUser)->get("/chat-panel/{$mabar->id_mabar}/pesan")->assertStatus(200);
        $this->actingAs($hostUser)->postJson("/chat-panel/{$mabar->id_mabar}/kirim", [
            'pesan' => 'Halo semuanya dari host',
        ])->assertStatus(201);

        
        $this->actingAs($pesertaUser)->get("/chat-panel/{$mabar->id_mabar}/pesan")->assertStatus(200);
        $this->actingAs($pesertaUser)->postJson("/chat-panel/{$mabar->id_mabar}/kirim", [
            'pesan' => 'Siap hadir!',
        ])->assertStatus(201);

        
        $this->actingAs($outsiderUser)->get("/chat-panel/{$mabar->id_mabar}/pesan")->assertStatus(403);
        $this->actingAs($outsiderUser)->postJson("/chat-panel/{$mabar->id_mabar}/kirim", [
            'pesan' => 'Pesan tanpa izin',
        ])->assertStatus(403);
    }

    
    public function test_open_mabar_photo_validation_rejects_svg(): void
    {
        $svgFile = UploadedFile::fake()->create('malicious.svg', 10, 'image/svg+xml');

        $response = $this->actingAs($this->customerUser)->post('/open-mabar', [
            'judul' => 'Mabar Test Upload',
            'tanggal' => now()->addDays(1)->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'gender' => 'putra',
            'batas_usia_min' => 17,
            'batas_usia_max' => 45,
            'kuota' => 6,
            'foto' => $svgFile,
        ]);

        $response->assertSessionHasErrors('foto');
    }
}
