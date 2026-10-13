<?php

namespace Tests\Feature;

use App\Models\OpenMabar;
use App\Models\Reservasi;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\Pembayaran;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class Fase1FTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $member;
    protected User $admin;
    protected Reservasi $memberReservasi;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->user = User::create([
            'nama' => 'User Biasa',
            'email' => 'user.f@example.com',
            'no_whatsapp' => '08155550001',
            'password' => Hash::make('password_awal'),
            'role' => 'user',
        ]);

        $this->member = User::create([
            'nama' => 'User Member',
            'email' => 'member.f@example.com',
            'no_whatsapp' => '08155550002',
            'password' => Hash::make('password_awal'),
            'role' => 'user',
            'jenis_pelanggan' => 'member',
            'tanggal_mulai_member' => Carbon::now()->subDays(10)->toDateString(),
            'tanggal_akhir_member' => Carbon::now()->addDays(20)->toDateString(),
            'status_member' => 'aktif',
        ]);

        $this->admin = User::create([
            'nama' => 'Admin Uji',
            'email' => 'admin.f@example.com',
            'no_whatsapp' => '08155550003',
            'password' => Hash::make('password_awal'),
            'role' => 'admin',
        ]);

        $lapangan = Lapangan::first();

        $this->memberReservasi = Reservasi::create([
            'id_user' => $this->member->id_user,
            'tanggal_pemesanan' => Carbon::now()->toDateString(),
            'total_biaya' => 100000,
            'status_reservasi' => 'terkonfirmasi',
        ]);

        DetailReservasi::create([
            'id_reservasi' => $this->memberReservasi->id_reservasi,
            'id_lapangan' => $lapangan ? $lapangan->id_lapangan : 1,
            'tanggal_main' => Carbon::now()->addDays(2)->toDateString(),
            'jam_mulai' => '10:00:00',
            'jam_selesai' => '12:00:00',
            'durasi' => 120,
            'subtotal' => 100000,
        ]);

        Pembayaran::create([
            'id_reservasi' => $this->memberReservasi->id_reservasi,
            'tanggal_pembayaran' => Carbon::now()->toDateString(),
            'jenis_pembayaran' => 'Lunas',
            'jumlah' => 100000,
            'metode_pembayaran' => 'transfer',
            'status_pembayaran' => 'terkonfirmasi',
        ]);
    }

    

    
    public function test_dashboard_hanya_untuk_user_login(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    
    public function test_admin_tidak_bisa_akses_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->get('/dashboard');
        $response->assertStatus(403);
    }

    
    public function test_user_bisa_akses_dashboard(): void
    {
        $response = $this->actingAs($this->user)->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard'));
    }

    
    public function test_user_tidak_melihat_reservasi_milik_user_lain(): void
    {
        $userA = $this->user;
        $userB = $this->member;

        
        $this->assertGreaterThan(0, Reservasi::where('id_user', $userB->id_user)->count());

        $response = $this->actingAs($userA)->get('/dashboard');
        $response->assertStatus(200);

        
        $response->assertInertia(function ($page) use ($userB) {
            $page->component('Dashboard');
            
            $reservasi = collect($page->toArray()['props']['reservasiSaya']);
            foreach ($reservasi as $res) {
                $this->assertNotEquals($userB->id_user, $res['id_user'] ?? null,
                    'Reservasi milik user lain tidak boleh muncul');
            }
            return $page;
        });
    }

    
    public function test_dashboard_menampilkan_mabar_stats_milik_user_sendiri(): void
    {
        $user = $this->user;
        $otherUser = $this->member;

        
        OpenMabar::create([
            'id_user' => $otherUser->id_user,
            'judul' => 'Mabar Milik User Lain',
            'tanggal' => Carbon::now()->addDays(7)->toDateString(),
            'jam_mulai' => '10:00:00',
            'jam_selesai' => '12:00:00',
            'gender' => 'campuran',
            'batas_usia_min' => 18,
            'batas_usia_max' => 40,
            'kuota' => 10,
            'status' => 'menunggu',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(function ($page) use ($user) {
            $page->component('Dashboard');
            
            $stats = $page->toArray()['props']['mabarStats'];
            
            $dbMenunggu = OpenMabar::where('id_user', $user->id_user)
                ->where('status', 'menunggu')->count();
            $this->assertEquals($dbMenunggu, $stats['menunggu']);
            return $page;
        });
    }

    

    
    public function test_user_dapat_akses_pengaturan_akun(): void
    {
        $response = $this->actingAs($this->user)->get('/pengaturan/akun');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Pengaturan/Akun'));
    }

    
    public function test_admin_tidak_bisa_akses_pengaturan_akun(): void
    {
        $response = $this->actingAs($this->admin)->get('/pengaturan/akun');
        $response->assertStatus(403);
    }

    
    public function test_update_profil_berhasil_dengan_data_valid(): void
    {
        $user = $this->user;

        $response = $this->actingAs($user)->put('/pengaturan/akun/profil', [
            'nama' => 'Nama Baru',
            'email' => 'userbaru@example.com',
            'no_whatsapp' => '08199990001',
        ]);

        $response->assertRedirect('/pengaturan/akun');
        $response->assertSessionHas('success', 'Profil Berhasil Diperbarui');

        $this->assertDatabaseHas('users', [
            'id_user' => $user->id_user,
            'nama' => 'Nama Baru',
            'email' => 'userbaru@example.com',
            'no_whatsapp' => '08199990001',
        ]);
    }

    
    public function test_update_profil_menolak_email_duplikat_milik_user_lain(): void
    {
        $user = $this->user;
        $member = $this->member;

        $response = $this->actingAs($user)->put('/pengaturan/akun/profil', [
            'nama' => 'User Biasa',
            'email' => $member->email, 
            'no_whatsapp' => $user->no_whatsapp,
        ]);

        $response->assertSessionHasErrors(['email']);
        
        $this->assertDatabaseHas('users', [
            'id_user' => $user->id_user,
            'email' => $user->email,
        ]);
    }

    
    public function test_update_profil_menerima_email_milik_sendiri(): void
    {
        $user = $this->user;

        $response = $this->actingAs($user)->put('/pengaturan/akun/profil', [
            'nama' => 'Nama Diperbarui',
            'email' => $user->email, 
            'no_whatsapp' => $user->no_whatsapp,
        ]);

        $response->assertRedirect('/pengaturan/akun');
        $response->assertSessionHas('success', 'Profil Berhasil Diperbarui');
        $this->assertDatabaseHas('users', [
            'id_user' => $user->id_user,
            'nama' => 'Nama Diperbarui',
        ]);
    }

    
    public function test_ganti_password_berhasil_dengan_kata_sandi_lama_benar(): void
    {
        $user = $this->user;

        $response = $this->actingAs($user)->put('/pengaturan/akun/password', [
            'current_password' => 'password_awal',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ]);

        $response->assertRedirect('/pengaturan/akun');
        $response->assertSessionHas('success', 'Kata sandi berhasil diperbarui');

        
        $user->refresh();
        $this->assertTrue(Hash::check('passwordbaru123', $user->password));
    }

    
    public function test_ganti_password_ditolak_jika_kata_sandi_lama_salah(): void
    {
        $user = $this->user;
        $passwordLama = $user->password; 

        $response = $this->actingAs($user)->put('/pengaturan/akun/password', [
            'current_password' => 'passwordsalah',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ]);

        $response->assertSessionHasErrors(['current_password']);

        
        $user->refresh();
        $this->assertEquals($passwordLama, $user->password);
    }

    
    public function test_tidak_ada_endpoint_hapus_akun(): void
    {
        $user = $this->user;

        
        $response = $this->actingAs($user)->delete('/pengaturan/akun');
        $this->assertContains($response->status(), [404, 405]);

        
        $this->actingAs($user)->delete('/user/profile-information')->assertStatus(404);
        $this->actingAs($user)->delete('/user')->assertStatus(404);
    }

    

    
    public function test_tamu_redirect_ke_login_untuk_rute_terproteksi(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/pengaturan/akun')->assertRedirect('/login');
    }
}
