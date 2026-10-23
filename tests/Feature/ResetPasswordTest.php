<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->user = User::create([
            'nama' => 'Budi Santoso',
            'no_whatsapp' => '081234567890',
            'email' => null,
            'password' => Hash::make('Lama12345!'),
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);
    }

    public function test_can_view_lupa_password_form(): void
    {
        $response = $this->get('/lupa-password');
        $response->assertStatus(200);
    }

    public function test_cannot_request_otp_with_unregistered_phone(): void
    {
        $response = $this->post('/lupa-password', [
            'no_whatsapp' => '089999999999',
        ]);

        $response->assertSessionHasErrors('no_whatsapp');
    }

    public function test_cannot_request_otp_for_inactive_account(): void
    {
        $inactive = User::create([
            'nama' => 'User Nonaktif',
            'no_whatsapp' => '081234567899',
            'password' => Hash::make('Secret123!'),
            'role' => User::ROLE_USER,
            'status_akun' => 'nonaktif',
        ]);

        $response = $this->post('/lupa-password', [
            'no_whatsapp' => '081234567899',
        ]);

        $response->assertSessionHasErrors('no_whatsapp');
    }

    public function test_can_request_otp_with_registered_phone(): void
    {
        $response = $this->post('/lupa-password', [
            'no_whatsapp' => '081234567890',
        ]);

        $response->assertRedirect(route('password.verifikasi'));
        $this->assertDatabaseHas('password_reset_otp', [
            'no_whatsapp' => '6281234567890',
        ]);

        $record = PasswordResetOtp::where('no_whatsapp', '6281234567890')->first();
        $this->assertNotNull($record);
        $this->assertNotEmpty($record->kode_otp);
        // Pastikan bukan plaintext 6 digit di DB
        $this->assertGreaterThan(20, strlen($record->kode_otp));
    }

    public function test_cannot_request_otp_too_frequently(): void
    {
        $this->post('/lupa-password', [
            'no_whatsapp' => '081234567890',
        ]);

        // Request kedua langsung dalam 1 menit
        $response2 = $this->post('/lupa-password', [
            'no_whatsapp' => '081234567890',
        ]);

        $response2->assertSessionHasErrors('no_whatsapp');
    }

    public function test_cannot_reset_with_wrong_otp(): void
    {
        $otp = '123456';
        $hashed = hash_hmac('sha256', $otp, (string) config('app.key'));

        PasswordResetOtp::create([
            'no_whatsapp' => '6281234567890',
            'kode_otp' => $hashed,
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        $response = $this->post('/lupa-password/reset', [
            'no_whatsapp' => '6281234567890',
            'kode_otp' => '999999',
            'password' => 'Baru12345!',
            'password_confirmation' => 'Baru12345!',
        ]);

        $response->assertSessionHasErrors('kode_otp');
        $this->assertTrue(Hash::check('Lama12345!', $this->user->fresh()->password));
    }

    public function test_cannot_reset_with_expired_otp(): void
    {
        $otp = '123456';
        $hashed = hash_hmac('sha256', $otp, (string) config('app.key'));

        PasswordResetOtp::create([
            'no_whatsapp' => '6281234567890',
            'kode_otp' => $hashed,
            'expires_at' => Carbon::now()->subMinutes(1),
        ]);

        $response = $this->post('/lupa-password/reset', [
            'no_whatsapp' => '6281234567890',
            'kode_otp' => '123456',
            'password' => 'Baru12345!',
            'password_confirmation' => 'Baru12345!',
        ]);

        $response->assertSessionHasErrors('kode_otp');
    }

    public function test_successful_password_reset_and_login_with_new_password(): void
    {
        $otp = '654321';
        $hashed = hash_hmac('sha256', $otp, (string) config('app.key'));

        PasswordResetOtp::create([
            'no_whatsapp' => '6281234567890',
            'kode_otp' => $hashed,
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        $response = $this->withSession(['reset_no_whatsapp' => '6281234567890'])
            ->post('/lupa-password/reset', [
                'no_whatsapp' => '6281234567890',
                'kode_otp' => '654321',
                'password' => 'PasswordBaru123!',
                'password_confirmation' => 'PasswordBaru123!',
            ]);

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('success');

        // Pastikan record OTP dihapus
        $this->assertDatabaseMissing('password_reset_otp', [
            'no_whatsapp' => '6281234567890',
        ]);

        // Pastikan password user di database sudah ter-update
        $this->assertTrue(Hash::check('PasswordBaru123!', $this->user->fresh()->password));

        // Coba login dengan password baru
        $loginResponse = $this->post('/login', [
            'no_whatsapp' => '081234567890',
            'password' => 'PasswordBaru123!',
        ]);

        $loginResponse->assertRedirect('/');
        $this->assertAuthenticatedAs($this->user->fresh(), 'web');
    }

    public function test_can_resend_otp(): void
    {
        $otp = '111111';
        $hashed = hash_hmac('sha256', $otp, (string) config('app.key'));

        $record = PasswordResetOtp::create([
            'no_whatsapp' => '6281234567890',
            'kode_otp' => $hashed,
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        $response = $this->withSession(['reset_no_whatsapp' => '6281234567890'])
            ->post('/lupa-password/kirim-ulang-otp', [
                'no_whatsapp' => '6281234567890',
            ]);

        $response->assertSessionHas('success');
        $newRecord = $record->fresh();
        $this->assertNotEquals($hashed, $newRecord->kode_otp);

        // Langsung request kedua dalam cooldown
        $responseCooldown = $this->post('/lupa-password/kirim-ulang-otp', [
            'no_whatsapp' => '6281234567890',
        ]);
        $responseCooldown->assertSessionHasErrors('kode_otp');
    }
}
