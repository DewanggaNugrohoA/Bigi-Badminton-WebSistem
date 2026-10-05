<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Fase1ATest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_login_redirects_according_to_role(): void
    {
        $responseAdmin = $this->post('/login', [
            'email' => 'admin@bigi.test',
            'password' => 'password',
        ]);
        $responseAdmin->assertRedirect('/admin');

        auth()->logout();

        $responseKasir = $this->post('/login', [
            'email' => 'kasir@bigi.test',
            'password' => 'password',
        ]);
        $responseKasir->assertRedirect('/kasir');

        auth()->logout();

        $responseUser = $this->post('/login', [
            'email' => 'user@bigi.test',
            'password' => 'password',
        ]);
        $responseUser->assertRedirect('/dashboard');
    }

    public function test_invalid_login_shows_error_message(): void
    {
        $response = $this->post('/login', [
            'email' => 'user@bigi.test',
            'password' => 'wrongpassword',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_disabled_account_login_shows_disabled_error_message(): void
    {
        $response = $this->post('/login', [
            'email' => 'kasir.nonaktif@bigi.test',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'Akun Anda telah dinonaktifkan.',
        ]);
    }

    public function test_user_accessing_admin_or_kasir_returns_403(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();

        $responseAdmin = $this->actingAs($user)->get('/admin');
        $responseAdmin->assertStatus(403);

        $responseKasir = $this->actingAs($user)->get('/kasir');
        $responseKasir->assertStatus(403);
    }

    public function test_registration_creates_user_with_role_user_and_defaults(): void
    {
        $response = $this->post('/register', [
            'nama' => 'Pemain Baru',
            'email' => 'pemainbaru@bigi.test',
            'no_whatsapp' => '08987654321',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');

        $this->assertDatabaseHas('users', [
            'email' => 'pemainbaru@bigi.test',
            'nama' => 'Pemain Baru',
            'no_whatsapp' => '08987654321',
            'role' => 'user',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
        ]);
    }
}
