<?php

namespace Tests\Feature;

use App\Models\OpenMabar;
use App\Models\PesertaMabar;
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

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    // ───────────────────────────── Dashboard ─────────────────────────────

    /** Dashboard hanya bisa diakses oleh role user, bukan tamu */
    public function test_dashboard_hanya_untuk_user_login(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    /** Admin yang akses /dashboard mendapat 403 */
    public function test_admin_tidak_bisa_akses_dashboard(): void
    {
        $admin = User::where('email', 'admin@bigi.test')->first();
        $response = $this->actingAs($admin)->get('/dashboard');
        $response->assertStatus(403);
    }

    /** User dapat mengakses /dashboard */
    public function test_user_bisa_akses_dashboard(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();
        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard'));
    }

    /** User A tidak melihat reservasi milik User B di /dashboard */
    public function test_user_tidak_melihat_reservasi_milik_user_lain(): void
    {
        // user@bigi.test tidak punya reservasi (hanya member@bigi.test yang punya di seeder)
        $userA = User::where('email', 'user@bigi.test')->first();
        $userB = User::where('email', 'member@bigi.test')->first();

        // Pastikan userB punya reservasi
        $this->assertGreaterThan(0, Reservasi::where('id_user', $userB->id_user)->count());

        $response = $this->actingAs($userA)->get('/dashboard');
        $response->assertStatus(200);

        // Ambil prop reservasiSaya dari response Inertia
        $response->assertInertia(function ($page) use ($userB) {
            $page->component('Dashboard');
            // Reservasi yang tampil harus kosong karena userA tidak punya reservasi
            $reservasi = collect($page->toArray()['props']['reservasiSaya']);
            foreach ($reservasi as $res) {
                $this->assertNotEquals($userB->id_user, $res['id_user'] ?? null,
                    'Reservasi milik user lain tidak boleh muncul');
            }
            return $page;
        });
    }

    /** Data mabar di dashboard hanya milik user yang login */
    public function test_dashboard_menampilkan_mabar_stats_milik_user_sendiri(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();
        $otherUser = User::where('email', 'member@bigi.test')->first();

        // Buat mabar milik otherUser
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
            // Mabar yang dihitung adalah milik user sendiri, bukan milik other user
            $stats = $page->toArray()['props']['mabarStats'];
            // Verifikasi data stats cocok dengan DB
            $dbMenunggu = OpenMabar::where('id_user', $user->id_user)
                ->where('status', 'menunggu')->count();
            $this->assertEquals($dbMenunggu, $stats['menunggu']);
            return $page;
        });
    }

    // ───────────────────────── Pengaturan Akun ───────────────────────────

    /** Halaman pengaturan akun dapat diakses user */
    public function test_user_dapat_akses_pengaturan_akun(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();
        $response = $this->actingAs($user)->get('/pengaturan/akun');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Pengaturan/Akun'));
    }

    /** Admin tidak dapat akses /pengaturan/akun (role:user saja) */
    public function test_admin_tidak_bisa_akses_pengaturan_akun(): void
    {
        $admin = User::where('email', 'admin@bigi.test')->first();
        $response = $this->actingAs($admin)->get('/pengaturan/akun');
        $response->assertStatus(403);
    }

    /** Update profil berhasil dengan data valid */
    public function test_update_profil_berhasil_dengan_data_valid(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();

        $response = $this->actingAs($user)->put('/pengaturan/akun/profil', [
            'nama' => 'Nama Baru',
            'email' => 'userbaru@bigi.test',
            'no_whatsapp' => '0899999999',
        ]);

        $response->assertRedirect('/pengaturan/akun');
        $response->assertSessionHas('success', 'Profil Berhasil Diperbarui');

        $this->assertDatabaseHas('users', [
            'id_user' => $user->id_user,
            'nama' => 'Nama Baru',
            'email' => 'userbaru@bigi.test',
            'no_whatsapp' => '0899999999',
        ]);
    }

    /** Update profil ditolak jika email milik user lain sudah dipakai */
    public function test_update_profil_menolak_email_duplikat_milik_user_lain(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();
        $member = User::where('email', 'member@bigi.test')->first();

        $response = $this->actingAs($user)->put('/pengaturan/akun/profil', [
            'nama' => 'User Biasa',
            'email' => $member->email, // email milik user lain
            'no_whatsapp' => '0833333333',
        ]);

        $response->assertSessionHasErrors(['email']);
        // Data tidak berubah
        $this->assertDatabaseHas('users', [
            'id_user' => $user->id_user,
            'email' => 'user@bigi.test',
        ]);
    }

    /** Update profil BERHASIL jika email adalah milik sendiri (tidak berubah) */
    public function test_update_profil_menerima_email_milik_sendiri(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();

        $response = $this->actingAs($user)->put('/pengaturan/akun/profil', [
            'nama' => 'Nama Diperbarui',
            'email' => $user->email, // email sama, tidak berubah
            'no_whatsapp' => '0833333333',
        ]);

        $response->assertRedirect('/pengaturan/akun');
        $response->assertSessionHas('success', 'Profil Berhasil Diperbarui');
        $this->assertDatabaseHas('users', [
            'id_user' => $user->id_user,
            'nama' => 'Nama Diperbarui',
        ]);
    }

    /** Ganti password berhasil dengan kata sandi lama benar */
    public function test_ganti_password_berhasil_dengan_kata_sandi_lama_benar(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();

        $response = $this->actingAs($user)->put('/pengaturan/akun/password', [
            'current_password' => 'password',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ]);

        $response->assertRedirect('/pengaturan/akun');
        $response->assertSessionHas('success', 'Kata sandi berhasil diperbarui');

        // Verifikasi password baru bisa login
        $user->refresh();
        $this->assertTrue(Hash::check('passwordbaru123', $user->password));
    }

    /** Ganti password ditolak jika kata sandi lama salah */
    public function test_ganti_password_ditolak_jika_kata_sandi_lama_salah(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();
        $passwordLama = $user->password; // simpan sebelum percobaan

        $response = $this->actingAs($user)->put('/pengaturan/akun/password', [
            'current_password' => 'passwordsalah',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ]);

        $response->assertSessionHasErrors(['current_password']);

        // Password tidak berubah
        $user->refresh();
        $this->assertEquals($passwordLama, $user->password);
    }

    /** Tidak ada endpoint hapus akun */
    public function test_tidak_ada_endpoint_hapus_akun(): void
    {
        $user = User::where('email', 'user@bigi.test')->first();

        // Rute DELETE pada /pengaturan/akun tidak didefinisikan (MethodNotAllowedHttpException / 405)
        $response = $this->actingAs($user)->delete('/pengaturan/akun');
        $this->assertContains($response->status(), [404, 405]);

        // Rute hapus akun umum lainnya tidak ada (404)
        $this->actingAs($user)->delete('/user/profile-information')->assertStatus(404);
        $this->actingAs($user)->delete('/user')->assertStatus(404);
    }

    // ─────────────────────── Error Pages ─────────────────────────────────

    /** Tamu mengakses rute terlindungi mendapat redirect login, bukan 404 */
    public function test_tamu_redirect_ke_login_untuk_rute_terproteksi(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/pengaturan/akun')->assertRedirect('/login');
    }
}
