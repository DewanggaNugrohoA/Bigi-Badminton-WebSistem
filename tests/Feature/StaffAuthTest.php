<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffAuthTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $kasirUser;
    protected User $regulerUser;
    protected User $inactiveAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->adminUser = User::create([
            'nama' => 'Super Admin',
            'email' => 'superadmin@bigi.internal',
            'no_whatsapp' => '087700000001',
            'password' => Hash::make('Secret12345!'),
            'role' => 'admin',
            'status_akun' => 'aktif',
        ]);

        $this->kasirUser = User::create([
            'nama' => 'Staff Kasir',
            'email' => 'staffkasir@bigi.internal',
            'no_whatsapp' => '087700000002',
            'password' => Hash::make('KasirPass123!'),
            'role' => 'kasir',
            'status_akun' => 'aktif',
        ]);

        $this->regulerUser = User::create([
            'nama' => 'Pelanggan Biasa',
            'email' => 'customer@bigi.internal',
            'no_whatsapp' => '087700000003',
            'password' => Hash::make('Customer123!'),
            'role' => 'user',
            'status_akun' => 'aktif',
        ]);

        $this->inactiveAdmin = User::create([
            'nama' => 'Admin Nonaktif',
            'email' => 'inactive@bigi.internal',
            'no_whatsapp' => '087700000004',
            'password' => Hash::make('Inactive123!'),
            'role' => 'admin',
            'status_akun' => 'nonaktif',
        ]);
    }

    
    public function test_staff_login_success_and_redirects_by_role(): void
    {
        
        $resAdmin = $this->post('/staff/login', [
            'email' => 'superadmin@bigi.internal',
            'password' => 'Secret12345!',
        ]);
        $resAdmin->assertRedirect('/admin');
        $this->assertAuthenticatedAs($this->adminUser, 'staff');

        
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->adminUser->id_user,
            'aksi' => 'LOGIN_STAF_SUKSES',
        ]);

        
        $resLogout = $this->post('/staff/logout');
        $resLogout->assertRedirect('/staff/login');
        $this->assertGuest('staff');

        
        $resKasir = $this->post('/staff/login', [
            'email' => 'staffkasir@bigi.internal',
            'password' => 'KasirPass123!',
        ]);
        $resKasir->assertRedirect('/kasir');
        $this->assertAuthenticatedAs($this->kasirUser, 'staff');
    }

    
    public function test_staff_login_with_wrong_password_gives_generic_message(): void
    {
        $response = $this->post('/staff/login', [
            'email' => 'superadmin@bigi.internal',
            'password' => 'WrongPassword999',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'Email atau kata sandi salah.',
        ]);
        $this->assertGuest();
    }

    
    public function test_customer_role_cannot_login_at_staff_login(): void
    {
        $response = $this->post('/staff/login', [
            'email' => 'customer@bigi.internal',
            'password' => 'Customer123!',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'Email atau kata sandi salah.',
        ]);
        $this->assertGuest();
    }

    
    public function test_inactive_staff_account_is_blocked(): void
    {
        $response = $this->post('/staff/login', [
            'email' => 'inactive@bigi.internal',
            'password' => 'Inactive123!',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'Akun staf tidak aktif. Silakan hubungi administrator.',
        ]);
        $this->assertGuest();
    }

    
    public function test_staff_login_lockout_after_five_failed_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/staff/login', [
                'email' => 'superadmin@bigi.internal',
                'password' => 'WrongPassword',
            ]);
        }

        
        $response = $this->post('/staff/login', [
            'email' => 'superadmin@bigi.internal',
            'password' => 'WrongPassword',
        ]);

        $response->assertSessionHasErrors('email');
        $errors = session('errors')->get('email');
        $this->assertStringContainsString('Terlalu banyak percobaan', $errors[0]);

        
        $this->assertDatabaseHas('audit_log', [
            'id_user' => $this->adminUser->id_user,
            'aksi' => 'LOGIN_GAGAL_LOCKOUT',
        ]);
    }

    
    public function test_logged_in_customer_gets_403_when_accessing_admin(): void
    {
        $this->actingAs($this->regulerUser, 'web');

        $response = $this->get('/admin');
        $response->assertRedirect('/staff/login');
    }

    
    public function test_unauthenticated_access_to_admin_redirects_to_staff_login(): void
    {
        $response = $this->get('/admin');
        $response->assertRedirect('/staff/login');
    }

    
    public function test_artisan_buat_admin_command(): void
    {
        
        $this->artisan('bigi:buat-admin', ['--role' => 'admin'])
            ->expectsQuestion('Masukkan Nama Lengkap Staf', 'Staf Baru')
            ->expectsQuestion('Masukkan Alamat Email Staf', 'stafbaru@bigi.internal')
            ->expectsQuestion('Masukkan Kata Sandi (Minimal 10 karakter, harus ada huruf dan angka)', 'weak')
            ->expectsQuestion('Ulangi Kata Sandi', 'weak')
            ->expectsQuestion('Masukkan Kata Sandi Baru (Minimal 10 karakter, harus ada huruf dan angka)', 'StrongPass12345')
            ->expectsQuestion('Ulangi Kata Sandi Baru', 'StrongPass12345')
            ->expectsQuestion('Masukkan Nomor WhatsApp Staf (Format 08...)', '088812345678')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'email' => 'stafbaru@bigi.internal',
            'no_whatsapp' => '088812345678',
            'role' => 'admin',
            'status_akun' => 'aktif',
        ]);

        $created = User::where('email', 'stafbaru@bigi.internal')->first();
        $this->assertTrue(Hash::check('StrongPass12345', $created->password));
    }

    
    public function test_artisan_buat_admin_rejects_empty_or_invalid_phone(): void
    {
        $this->artisan('bigi:buat-admin', ['--role' => 'kasir'])
            ->expectsQuestion('Masukkan Nama Lengkap Staf', 'Kasir Tambahan')
            ->expectsQuestion('Masukkan Alamat Email Staf', 'kasirtambahan@bigi.internal')
            ->expectsQuestion('Masukkan Kata Sandi (Minimal 10 karakter, harus ada huruf dan angka)', 'StrongKasir123')
            ->expectsQuestion('Ulangi Kata Sandi', 'StrongKasir123')
            
            ->expectsQuestion('Masukkan Nomor WhatsApp Staf (Format 08...)', '')
            ->expectsQuestion('Masukkan Nomor WhatsApp Staf (Format 08...)', '12345')
            ->expectsQuestion('Masukkan Nomor WhatsApp Staf (Format 08...)', '087711223344')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'email' => 'kasirtambahan@bigi.internal',
            'no_whatsapp' => '087711223344',
            'role' => 'kasir',
            'status_akun' => 'aktif',
        ]);
    }
}
