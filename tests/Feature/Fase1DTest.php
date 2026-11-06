<?php

namespace Tests\Feature;

use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class Fase1DTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $member;
    protected User $otherUser;
    protected User $admin;
    protected User $kasir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->user = User::create([
            'nama' => 'User Biasa',
            'email' => 'user.d@example.com',
            'no_whatsapp' => '08133330001',
            'password' => bcrypt('secret123'),
            'role' => 'user',
        ]);

        $this->member = User::create([
            'nama' => 'User Member',
            'email' => 'member.d@example.com',
            'no_whatsapp' => '08133330002',
            'password' => bcrypt('secret123'),
            'role' => 'user',
            'jenis_pelanggan' => 'member',
            'tanggal_mulai_member' => Carbon::now()->subDays(10)->toDateString(),
            'tanggal_akhir_member' => Carbon::now()->addDays(20)->toDateString(),
            'status_member' => 'aktif',
        ]);

        $this->admin = User::create([
            'nama' => 'Admin Uji',
            'email' => 'admin.d@example.com',
            'no_whatsapp' => '08133330003',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
        ]);

        $this->kasir = User::create([
            'nama' => 'Kasir Uji',
            'email' => 'kasir.d@example.com',
            'no_whatsapp' => '08133330004',
            'password' => bcrypt('secret123'),
            'role' => 'kasir',
        ]);

        
        $this->otherUser = User::create([
            'nama' => 'Pemain Lain',
            'email' => 'lain.d@example.com',
            'no_whatsapp' => '08133330005',
            'password' => bcrypt('secret123'),
            'role' => 'user',
        ]);

        
        OpenMabar::create([
            'id_user' => $this->user->id_user,
            'judul' => 'Mabar Santuy Malam Minggu',
            'tanggal' => Carbon::now()->addDays(2)->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '22:00:00',
            'gender' => 'campuran',
            'batas_usia_min' => 18,
            'batas_usia_max' => 40,
            'kuota' => 10,
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        OpenMabar::create([
            'id_user' => $this->member->id_user,
            'judul' => 'Mabar Putra Kompetitif',
            'tanggal' => Carbon::now()->addDays(3)->toDateString(),
            'jam_mulai' => '20:00:00',
            'jam_selesai' => '23:00:00',
            'gender' => 'putra',
            'no_hp' => '081234567890',
            'batas_usia_min' => 20,
            'batas_usia_max' => 35,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        OpenMabar::create([
            'id_user' => $this->user->id_user,
            'judul' => 'Mabar Putri Pagi Hari',
            'tanggal' => Carbon::now()->addDays(4)->toDateString(),
            'jam_mulai' => '07:00:00',
            'jam_selesai' => '10:00:00',
            'gender' => 'putri',
            'batas_usia_min' => 15,
            'batas_usia_max' => 50,
            'kuota' => 6,
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        OpenMabar::create([
            'id_user' => $this->member->id_user,
            'judul' => 'Mabar Menunggu Persetujuan',
            'tanggal' => Carbon::now()->addDays(5)->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'gender' => 'campuran',
            'no_hp' => '081234567890',
            'batas_usia_min' => 20,
            'batas_usia_max' => 30,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        OpenMabar::create([
            'id_user' => $this->user->id_user,
            'judul' => 'Mabar Ditolak',
            'tanggal' => Carbon::now()->addDays(1)->toDateString(),
            'jam_mulai' => '16:00:00',
            'jam_selesai' => '18:00:00',
            'gender' => 'putra',
            'batas_usia_min' => 15,
            'batas_usia_max' => 25,
            'kuota' => 6,
            'status' => OpenMabar::STATUS_DITOLAK,
        ]);
    }

    
    public function test_guests_cannot_access_open_mabar_routes(): void
    {
        $this->get('/open-mabar')->assertRedirect('/login');
        $this->get('/open-mabar/create')->assertRedirect('/login');
        $this->get('/open-mabar/saya')->assertRedirect('/login');
    }

    public function test_admin_and_kasir_receive_403_on_open_mabar_routes(): void
    {
        $this->actingAs($this->admin)->get('/open-mabar')->assertForbidden();
        $this->actingAs($this->kasir)->get('/open-mabar')->assertForbidden();
    }

    
    public function test_index_shows_only_approved_upcoming_schedules(): void
    {
        $response = $this->actingAs($this->user)->get('/open-mabar/mabar-bareng');
        $response->assertOk();

        
        $response->assertSee('Mabar Santuy Malam Minggu');
        $response->assertSee('Mabar Putra Kompetitif');

        
        $response->assertDontSee('Mabar Menunggu Persetujuan');
        $response->assertDontSee('Mabar Ditolak');
        $response->assertDontSee('no_hp');
        $response->assertDontSee('081234567890');
    }

    public function test_index_filters_work_correctly(): void
    {
        // Filter gender di /open-mabar/mabar-bareng
        $responseGender = $this->actingAs($this->user)->get('/open-mabar/mabar-bareng?gender=putra');
        $responseGender->assertOk();
        $responseGender->assertSee('Mabar Putra Kompetitif');
        $responseGender->assertDontSee('Mabar Putri Pagi Hari');
        $responseGender->assertDontSee('Mabar Menunggu Persetujuan');
        $responseGender->assertDontSee('Mabar Ditolak');
        $responseGender->assertDontSee('no_hp');
        $responseGender->assertDontSee('081234567890');

        // Filter tanggal di /open-mabar/mabar-bareng
        $targetDate = Carbon::now()->addDays(2)->toDateString();
        $responseTanggal = $this->actingAs($this->user)->get('/open-mabar/mabar-bareng?tanggal=' . $targetDate);
        $responseTanggal->assertOk();
        $responseTanggal->assertSee('Mabar Santuy Malam Minggu');
        $responseTanggal->assertDontSee('Mabar Putri Pagi Hari');
        $responseTanggal->assertDontSee('Mabar Menunggu Persetujuan');
        $responseTanggal->assertDontSee('Mabar Ditolak');
        $responseTanggal->assertDontSee('no_hp');
        $responseTanggal->assertDontSee('081234567890');
    }

    public function test_lihat_jadwal_does_not_contain_no_hp(): void
    {
        $response = $this->actingAs($this->user)->get('/open-mabar');
        $response->assertOk();
        $response->assertDontSee('no_hp');
    }

    
    public function test_create_schedule_saves_with_status_menunggu_and_creator_is_not_participant(): void
    {
        Storage::fake('public');

        $foto = UploadedFile::fake()->image('banner_mabar.jpg');

        $response = $this->actingAs($this->user)->post('/open-mabar', [
            'judul' => 'Mabar Komunitas Baru',
            'tanggal' => Carbon::tomorrow()->toDateString(),
            'jam_mulai' => '19:00',
            'jam_selesai' => '21:00',
            'gender' => 'campuran',
            'no_hp' => '081234567890',
            'kuota' => 8,
            'deskripsi' => 'Deskripsi kegiatan mabar',
            'foto' => $foto,
        ]);

        $response->assertRedirect('/open-mabar/saya');

        $mabar = OpenMabar::where('judul', 'Mabar Komunitas Baru')->first();
        $this->assertNotNull($mabar);
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabar->status);
        $this->assertEquals($this->user->id_user, $mabar->id_user);
        $this->assertNotNull($mabar->foto);
        Storage::disk('public')->assertExists($mabar->foto);

        
        $isParticipant = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('id_user', $this->user->id_user)
            ->exists();
        $this->assertFalse($isParticipant);
    }

    
    public function test_create_schedule_validations(): void
    {
        $response = $this->actingAs($this->user)->post('/open-mabar', [
            'judul' => '',
            'tanggal' => Carbon::yesterday()->toDateString(),
            'jam_mulai' => '20:00',
            'jam_selesai' => '19:00',
            'gender' => 'invalid_gender',
            'no_hp' => 'invalid_phone',
            'kuota' => 0,
        ]);

        $response->assertSessionHasErrors([
            'judul',
            'tanggal',
            'jam_selesai',
            'gender',
            'no_hp',
            'kuota',
        ]);
    }

    
    public function test_user_can_view_own_schedules_in_saya(): void
    {
        $response = $this->actingAs($this->user)->get('/open-mabar/saya');
        $response->assertOk();
        
        $response->assertSee('Mabar Santuy Malam Minggu');
        $response->assertSee('Mabar Ditolak');
        $response->assertDontSee('081234567890');

        $responseMember = $this->actingAs($this->member)->get('/open-mabar/saya');
        $responseMember->assertOk();
        $responseMember->assertSee('Mabar Putra Kompetitif');
        $responseMember->assertDontSee('081234567890');
    }

    
    public function test_detail_schedule_authorization(): void
    {
        $mabarMenunggu = OpenMabar::where('status', OpenMabar::STATUS_MENUNGGU)->first();

        
        $this->actingAs($this->member)->get('/open-mabar/' . $mabarMenunggu->id_mabar)->assertOk();

        
        $this->actingAs($this->user)->get('/open-mabar/' . $mabarMenunggu->id_mabar)->assertForbidden();

        $mabarPutra = OpenMabar::where('judul', 'Mabar Putra Kompetitif')->first();
        $responseDetail = $this->actingAs($this->user)->get('/open-mabar/' . $mabarPutra->id_mabar);
        $responseDetail->assertOk();
        $responseDetail->assertDontSee('081234567890');
    }

    public function test_admin_can_see_creator_phone_number_in_admin_panel(): void
    {
        // Buka pertama kali: tampilkan semua status, menunggu di paling atas, no_hp terlihat
        $response = $this->actingAs($this->admin, 'staff')->get('/admin/open-mabar');
        $response->assertOk();
        $response->assertSee('081234567890');
        $response->assertSee('Mabar Menunggu Persetujuan');
        $response->assertSee('Mabar Putra Kompetitif');
        $response->assertSee('Mabar Ditolak');

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/OpenMabar/Index')
            ->where('filters.status', 'semua')
            ->where('daftarMabar.data.0.status', OpenMabar::STATUS_MENUNGGU)
        );

        // Filter status disetujui (misal Mabar Putra Kompetitif)
        $responseDisetujui = $this->actingAs($this->admin, 'staff')->get('/admin/open-mabar?status=disetujui');
        $responseDisetujui->assertOk();
        $responseDisetujui->assertSee('081234567890');
        $responseDisetujui->assertSee('Mabar Putra Kompetitif');
        $responseDisetujui->assertDontSee('Mabar Menunggu Persetujuan');
    }

    
    public function test_edit_schedule_with_photo_updates_and_resets_ditolak_to_menunggu(): void
    {
        Storage::fake('public');

        $mabarDitolak = OpenMabar::where('status', OpenMabar::STATUS_DITOLAK)
            ->where('id_user', $this->user->id_user)
            ->first();

        
        $initialPhoto = UploadedFile::fake()->image('old_photo.jpg')->store('mabar', 'public');
        $mabarDitolak->update(['foto' => $initialPhoto]);
        Storage::disk('public')->assertExists($initialPhoto);

        
        $newPhoto = UploadedFile::fake()->image('new_photo.jpg');

        $response = $this->actingAs($this->user)->post('/open-mabar/' . $mabarDitolak->id_mabar . '/edit', [
            '_method' => 'PUT',
            'judul' => 'Mabar Ditolak Direvisi',
            'tanggal' => Carbon::now()->addDays(3)->toDateString(),
            'jam_mulai' => '16:00',
            'jam_selesai' => '18:00',
            'gender' => 'putra',
            'no_hp' => '081234567890',
            'kuota' => 8,
            'foto' => $newPhoto,
        ]);

        $response->assertRedirect('/open-mabar/saya');

        $mabarDitolak->refresh();
        $this->assertEquals('Mabar Ditolak Direvisi', $mabarDitolak->judul);
        
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabarDitolak->status);

        
        Storage::disk('public')->assertMissing($initialPhoto);
        Storage::disk('public')->assertExists($mabarDitolak->foto);
    }

    
    public function test_user_cannot_edit_or_delete_other_user_schedule(): void
    {
        $mabarMember = OpenMabar::where('id_user', $this->member->id_user)->first();

        
        $this->actingAs($this->user)
            ->get('/open-mabar/' . $mabarMember->id_mabar . '/edit')
            ->assertForbidden();

        $this->actingAs($this->user)
            ->put('/open-mabar/' . $mabarMember->id_mabar . '/edit', [
                'judul' => 'Bajak Jadwal',
            ])
            ->assertForbidden();

        
        $this->actingAs($this->user)
            ->delete('/open-mabar/' . $mabarMember->id_mabar)
            ->assertForbidden();
    }

    
    public function test_user_can_delete_own_schedule(): void
    {
        Storage::fake('public');
        $photo = UploadedFile::fake()->image('to_delete.jpg')->store('mabar', 'public');

        $mabar = OpenMabar::create([
            'id_user' => $this->user->id_user,
            'judul' => 'Jadwal Untuk Dihapus',
            'tanggal' => Carbon::tomorrow()->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'gender' => 'campuran',
            'batas_usia_min' => 15,
            'batas_usia_max' => 30,
            'kuota' => 4,
            'status' => OpenMabar::STATUS_MENUNGGU,
            'foto' => $photo,
        ]);

        $response = $this->actingAs($this->user)->delete('/open-mabar/' . $mabar->id_mabar);
        $response->assertRedirect('/open-mabar/saya');

        $this->assertDatabaseMissing('open_mabar', ['id_mabar' => $mabar->id_mabar]);
        Storage::disk('public')->assertMissing($photo);
    }

    
    public function test_join_and_cancel_mabar_with_status_and_quota_rules(): void
    {
        $mabarDisetujui = OpenMabar::where('status', OpenMabar::STATUS_DISETUJUI)
            ->where('kuota', '>', 2)
            ->first();

        $mabarMenunggu = OpenMabar::where('status', OpenMabar::STATUS_MENUNGGU)->first();

        
        $responseMenunggu = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarMenunggu->id_mabar . '/ikut');
        $responseMenunggu->assertSessionHasErrors(['message']);

        
        $responseIkut = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseIkut->assertSessionHas('success');

        $peserta = PesertaMabar::where('id_mabar', $mabarDisetujui->id_mabar)
            ->where('id_user', $this->otherUser->id_user)
            ->first();
        $this->assertNotNull($peserta);
        $this->assertEquals(PesertaMabar::STATUS_TERDAFTAR, $peserta->status_peserta);

        
        $responseDobel = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseDobel->assertSessionHasErrors(['message']);

        
        $responseBatal = $this->actingAs($this->otherUser)->delete('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseBatal->assertSessionHas('success');

        $peserta->refresh();
        $this->assertEquals(PesertaMabar::STATUS_BATAL, $peserta->status_peserta);

        
        $responseIkutLagi = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseIkutLagi->assertSessionHas('success');

        $totalBaris = PesertaMabar::where('id_mabar', $mabarDisetujui->id_mabar)
            ->where('id_user', $this->otherUser->id_user)
            ->count();
        $this->assertEquals(1, $totalBaris);

        $peserta->refresh();
        $this->assertEquals(PesertaMabar::STATUS_TERDAFTAR, $peserta->status_peserta);
    }

    
    public function test_cannot_join_if_quota_is_full(): void
    {
        $mabarPenuh = OpenMabar::create([
            'id_user' => $this->user->id_user,
            'judul' => 'Mabar Kuota 1 Penuh',
            'tanggal' => Carbon::tomorrow()->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'gender' => 'campuran',
            'batas_usia_min' => 15,
            'batas_usia_max' => 30,
            'kuota' => 1,
            'status' => OpenMabar::STATUS_DISETUJUI,
        ]);

        
        PesertaMabar::create([
            'id_mabar' => $mabarPenuh->id_mabar,
            'id_user' => $this->member->id_user,
            'tanggal_daftar' => Carbon::today()->toDateString(),
            'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
        ]);

        
        $response = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarPenuh->id_mabar . '/ikut');
        $response->assertSessionHasErrors(['message']);
    }

    
    public function test_model_approve_and_reject_methods(): void
    {
        $mabar = OpenMabar::create([
            'id_user' => $this->user->id_user,
            'judul' => 'Mabar Test Status',
            'tanggal' => Carbon::tomorrow()->toDateString(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'gender' => 'campuran',
            'batas_usia_min' => 15,
            'batas_usia_max' => 30,
            'kuota' => 4,
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        $mabar->approveMabar();
        $this->assertEquals(OpenMabar::STATUS_DISETUJUI, $mabar->status);

        $mabar->rejectMabar();
        $this->assertEquals(OpenMabar::STATUS_DITOLAK, $mabar->status);
    }
}
