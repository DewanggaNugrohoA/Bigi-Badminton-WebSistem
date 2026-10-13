<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Fase1ATest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $kasirUser;
    protected User $regularUser;
    protected User $disabledUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->adminUser = User::create([
            'nama' => 'Admin Uji',
            'email' => 'admin.test@example.com',
            'no_whatsapp' => '08123450001',
            'password' => 'secret123',
            'role' => 'admin',
            'status_akun' => 'aktif',
        ]);

        $this->kasirUser = User::create([
            'nama' => 'Kasir Uji',
            'email' => 'kasir.test@example.com',
            'no_whatsapp' => '08123450002',
            'password' => 'secret123',
            'role' => 'kasir',
            'status_akun' => 'aktif',
        ]);

        $this->regularUser = User::create([
            'nama' => 'User Biasa Uji',
            'email' => 'user.test@example.com',
            'no_whatsapp' => '08123450003',
            'password' => 'secret123',
            'role' => 'user',
            'status_akun' => 'aktif',
        ]);

        $this->disabledUser = User::create([
            'nama' => 'User Nonaktif Uji',
            'email' => 'user.nonaktif@example.com',
            'no_whatsapp' => '08123450004',
            'password' => 'secret123',
            'role' => 'user',
            'status_akun' => 'nonaktif',
        ]);
    }

    public function test_login_redirects_according_to_role(): void
    {
        $responseAdmin = $this->post('/staff/login', [
            'email' => $this->adminUser->email,
            'password' => 'secret123',
        ]);
        $responseAdmin->assertRedirect('/admin');

        \Illuminate\Support\Facades\Auth::guard('staff')->logout();

        $responseKasir = $this->post('/staff/login', [
            'email' => $this->kasirUser->email,
            'password' => 'secret123',
        ]);
        $responseKasir->assertRedirect('/kasir');

        \Illuminate\Support\Facades\Auth::guard('staff')->logout();

        $responseUser = $this->post('/login', [
            'email' => $this->regularUser->email,
            'password' => 'secret123',
        ]);
        $responseUser->assertRedirect('/');
    }

    public function test_invalid_login_shows_error_message(): void
    {
        $response = $this->post('/login', [
            'email' => $this->regularUser->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertSessionHasErrors(['email' => 'Nomor WhatsApp/Email atau kata sandi salah.']);
    }

    public function test_disabled_account_login_shows_disabled_error_message(): void
    {
        $response = $this->post('/login', [
            'email' => $this->disabledUser->email,
            'password' => 'secret123',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'Akun Anda telah dinonaktifkan.',
        ]);
    }

    public function test_user_accessing_admin_or_kasir_returns_403(): void
    {
        $user = $this->regularUser;

        
        $responseAdmin = $this->actingAs($user, 'web')->get('/admin');
        $responseAdmin->assertRedirect('/staff/login');

        $responseKasir = $this->actingAs($user, 'web')->get('/kasir');
        $responseKasir->assertRedirect('/staff/login');
    }

    public function test_registration_creates_user_with_role_user_after_otp_verification(): void
    {
        $capturedOtp = null;
        $mockWa = $this->mock(\App\Services\WhatsAppService::class);
        $mockWa->shouldReceive('sendOtp')
            ->once()
            ->andReturnUsing(function ($phone, $otp) use (&$capturedOtp) {
                $capturedOtp = $otp;
                return true;
            });

        $response = $this->post('/register', [
            'nama' => 'Pemain Baru',
            'no_whatsapp' => '08987654321',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('register.verifikasi'));
        $this->assertGuest();

        $this->assertDatabaseHas('verifikasi_otp', [
            'no_whatsapp' => '628987654321',
            'nama' => 'Pemain Baru',
        ]);

        $otpRecord = \App\Models\VerifikasiOtp::where('no_whatsapp', '628987654321')->first();
        $this->assertNotNull($otpRecord);
        $this->assertNotNull($capturedOtp);
        $this->assertEquals(6, strlen($capturedOtp));

        
        $verifyResponse = $this->post('/register/verifikasi', [
            'no_whatsapp' => '628987654321',
            'kode_otp' => $capturedOtp,
        ]);

        $verifyResponse->assertRedirect('/login');
        $verifyResponse->assertSessionHas('success');
        $this->assertGuest();

        $this->assertDatabaseHas('users', [
            'nama' => 'Pemain Baru',
            'no_whatsapp' => '628987654321',
            'role' => 'user',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
        ]);
    }

    public function test_login_with_no_whatsapp_redirects_to_home(): void
    {
        $response = $this->post('/login', [
            'no_whatsapp' => $this->regularUser->no_whatsapp,
            'password' => 'secret123',
        ]);
        $response->assertRedirect('/');
    }

    public function test_login_redirect_handles_internal_paths_and_blocks_malicious_urls(): void
    {
        $responseValid = $this->post('/login', [
            'email' => $this->regularUser->email,
            'password' => 'secret123',
            'redirect' => '/open-mabar',
        ]);
        $responseValid->assertRedirect('/open-mabar');

        auth()->logout();

        $responseDoubleSlash = $this->post('/login', [
            'email' => $this->regularUser->email,
            'password' => 'secret123',
            'redirect' => '//evil.com',
        ]);
        $responseDoubleSlash->assertRedirect('/');

        auth()->logout();

        $responseBackslash = $this->post('/login', [
            'email' => $this->regularUser->email,
            'password' => 'secret123',
            'redirect' => '/\evil.com',
        ]);
        $responseBackslash->assertRedirect('/');

        auth()->logout();

        $responseExternal = $this->post('/login', [
            'email' => $this->regularUser->email,
            'password' => 'secret123',
            'redirect' => 'https://evil.com',
        ]);
        $responseExternal->assertRedirect('/');
    }
}