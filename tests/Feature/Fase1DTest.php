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

        $this->user = User::where('email', 'user@bigi.test')->first();
        $this->member = User::where('email', 'member@bigi.test')->first();
        $this->admin = User::where('email', 'admin@bigi.test')->first();
        $this->kasir = User::where('email', 'kasir@bigi.test')->first();

        // Create one additional distinct user for testing multi-user actions
        $this->otherUser = User::create([
            'nama' => 'Pemain Lain',
            'email' => 'lain@bigi.test',
            'no_whatsapp' => '0899999999',
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);
    }

    /**
     * 1. Rute open-mabar hanya dapat diakses oleh user login dengan role 'user'.
     */
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

    /**
     * 2. Daftar & Filter: hanya menampilkan jadwal disetujui, tanggal >= hari ini.
     */
    public function test_index_shows_only_approved_upcoming_schedules(): void
    {
        $response = $this->actingAs($this->user)->get('/open-mabar');
        $response->assertOk();

        // Jadwal disetujui dari seeder: 'Mabar Santuy Malam Minggu', 'Mabar Putra Kompetitif', 'Mabar Putri Pagi Hari'
        $response->assertSee('Mabar Santuy Malam Minggu');
        $response->assertSee('Mabar Putra Kompetitif');

        // Jadwal 'menunggu' dan 'ditolak' dari seeder tidak boleh tampil
        $response->assertDontSee('Mabar Menunggu Persetujuan');
        $response->assertDontSee('Mabar Ditolak');
    }

    /**
     * 3. Filter usia, tanggal, dan gender (exact match).
     */
    public function test_index_filters_work_correctly(): void
    {
        // Filter usia: Mabar Putri Pagi Hari usia min 15 - max 50
        // Mabar Santuy usia min 18 - 40
        // Mabar Kompetitif usia min 20 - 35
        // Jika filter usia 16, hanya Mabar Putri yang lolos
        $responseUsia = $this->actingAs($this->user)->get('/open-mabar?usia=16');
        $responseUsia->assertSee('Mabar Putri Pagi Hari');
        $responseUsia->assertDontSee('Mabar Santuy Malam Minggu');
        $responseUsia->assertDontSee('Mabar Putra Kompetitif');

        // Filter gender: putra (exact match)
        $responseGender = $this->actingAs($this->user)->get('/open-mabar?gender=putra');
        $responseGender->assertSee('Mabar Putra Kompetitif');
        $responseGender->assertDontSee('Mabar Putri Pagi Hari');

        // Filter tanggal
        $targetDate = Carbon::now()->addDays(2)->toDateString();
        $responseTanggal = $this->actingAs($this->user)->get('/open-mabar?tanggal=' . $targetDate);
        $responseTanggal->assertSee('Mabar Santuy Malam Minggu');
        $responseTanggal->assertDontSee('Mabar Putri Pagi Hari');
    }

    /**
     * 4. Buat Jadwal: tersimpan dengan status 'menunggu' dan pembuat TIDAK otomatis jadi peserta.
     */
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
            'batas_usia_min' => 18,
            'batas_usia_max' => 35,
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

        // Pastikan pembuat jadwal TIDAK otomatis menjadi peserta di tabel peserta_mabar
        $isParticipant = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('id_user', $this->user->id_user)
            ->exists();
        $this->assertFalse($isParticipant);
    }

    /**
     * 5. Validasi Buat Jadwal (tanggal lampau, jam selesai <= jam mulai, usia max < min, kuota < 1).
     */
    public function test_create_schedule_validations(): void
    {
        $response = $this->actingAs($this->user)->post('/open-mabar', [
            'judul' => '',
            'tanggal' => Carbon::yesterday()->toDateString(),
            'jam_mulai' => '20:00',
            'jam_selesai' => '19:00',
            'gender' => 'invalid_gender',
            'batas_usia_min' => 25,
            'batas_usia_max' => 20,
            'kuota' => 0,
        ]);

        $response->assertSessionHasErrors([
            'judul',
            'tanggal',
            'jam_selesai',
            'gender',
            'batas_usia_max',
            'kuota',
        ]);
    }

    /**
     * 6. Jadwal Saya & Policy: User dapat melihat jadwal miliknya sendiri.
     */
    public function test_user_can_view_own_schedules_in_saya(): void
    {
        $response = $this->actingAs($this->user)->get('/open-mabar/saya');
        $response->assertOk();
        // Dari seeder, $user membuat 'Mabar Santuy Malam Minggu', 'Mabar Putri Pagi Hari', dan 'Mabar Ditolak'
        $response->assertSee('Mabar Santuy Malam Minggu');
        $response->assertSee('Mabar Ditolak');
    }

    /**
     * 7. Detail view: Hanya dapat diakses jika disetujui ATAU milik sendiri. User lain 403 jika belum disetujui.
     */
    public function test_detail_schedule_authorization(): void
    {
        $mabarMenunggu = OpenMabar::where('status', OpenMabar::STATUS_MENUNGGU)->first();

        // Pemiliknya ($member) boleh melihat detail mabar menunggu miliknya
        $this->actingAs($this->member)->get('/open-mabar/' . $mabarMenunggu->id_mabar)->assertOk();

        // User lain ($user) dilarang melihat detail mabar yang masih berstatus menunggu (403)
        $this->actingAs($this->user)->get('/open-mabar/' . $mabarMenunggu->id_mabar)->assertForbidden();
    }

    /**
     * 8. Edit / Revisi jadwal:
     * - Edit jadwal memuat foto dikirim sebagai POST dengan _method=PUT.
     * - Foto baru tersimpan di storage dan foto lama dihapus.
     * - Jadwal yang sebelumnya 'ditolak' berubah kembali menjadi 'menunggu'.
     */
    public function test_edit_schedule_with_photo_updates_and_resets_ditolak_to_menunggu(): void
    {
        Storage::fake('public');

        $mabarDitolak = OpenMabar::where('status', OpenMabar::STATUS_DITOLAK)
            ->where('id_user', $this->user->id_user)
            ->first();

        // Simpan foto dummy awal
        $initialPhoto = UploadedFile::fake()->image('old_photo.jpg')->store('mabar', 'public');
        $mabarDitolak->update(['foto' => $initialPhoto]);
        Storage::disk('public')->assertExists($initialPhoto);

        // Upload foto baru via POST dengan _method=PUT
        $newPhoto = UploadedFile::fake()->image('new_photo.jpg');

        $response = $this->actingAs($this->user)->post('/open-mabar/' . $mabarDitolak->id_mabar . '/edit', [
            '_method' => 'PUT',
            'judul' => 'Mabar Ditolak Direvisi',
            'tanggal' => Carbon::now()->addDays(3)->toDateString(),
            'jam_mulai' => '16:00',
            'jam_selesai' => '18:00',
            'gender' => 'putra',
            'batas_usia_min' => 15,
            'batas_usia_max' => 25,
            'kuota' => 8,
            'foto' => $newPhoto,
        ]);

        $response->assertRedirect('/open-mabar/saya');

        $mabarDitolak->refresh();
        $this->assertEquals('Mabar Ditolak Direvisi', $mabarDitolak->judul);
        // Status kembali menjadi 'menunggu'
        $this->assertEquals(OpenMabar::STATUS_MENUNGGU, $mabarDitolak->status);

        // Pastikan foto lama dihapus dan foto baru ada
        Storage::disk('public')->assertMissing($initialPhoto);
        Storage::disk('public')->assertExists($mabarDitolak->foto);
    }

    /**
     * 9. Pengguna lain tidak bisa mengedit atau menghapus jadwal bukan miliknya (403).
     */
    public function test_user_cannot_edit_or_delete_other_user_schedule(): void
    {
        $mabarMember = OpenMabar::where('id_user', $this->member->id_user)->first();

        // User mencoba edit mabar milik member
        $this->actingAs($this->user)
            ->get('/open-mabar/' . $mabarMember->id_mabar . '/edit')
            ->assertForbidden();

        $this->actingAs($this->user)
            ->put('/open-mabar/' . $mabarMember->id_mabar . '/edit', [
                'judul' => 'Bajak Jadwal',
            ])
            ->assertForbidden();

        // User mencoba hapus mabar milik member
        $this->actingAs($this->user)
            ->delete('/open-mabar/' . $mabarMember->id_mabar)
            ->assertForbidden();
    }

    /**
     * 10. Hapus jadwal milik sendiri berhasil dan menghapus foto jika ada.
     */
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

    /**
     * 11. Ikut Mabar:
     * - Hanya boleh untuk jadwal berstatus 'disetujui' (tolak jika menunggu/ditolak).
     * - Menghormati kuota.
     * - Tidak bisa dobel daftar jika status terdaftar.
     * - Jika status sebelumnya batal, ubah menjadi terdaftar tanpa duplikasi record.
     */
    public function test_join_and_cancel_mabar_with_status_and_quota_rules(): void
    {
        $mabarDisetujui = OpenMabar::where('status', OpenMabar::STATUS_DISETUJUI)
            ->where('kuota', '>', 2)
            ->first();

        $mabarMenunggu = OpenMabar::where('status', OpenMabar::STATUS_MENUNGGU)->first();

        // 11a. Menolak ikut jika jadwal belum disetujui
        $responseMenunggu = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarMenunggu->id_mabar . '/ikut');
        $responseMenunggu->assertSessionHasErrors(['message']);

        // 11b. Berhasil ikut jika disetujui
        $responseIkut = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseIkut->assertSessionHas('success');

        $peserta = PesertaMabar::where('id_mabar', $mabarDisetujui->id_mabar)
            ->where('id_user', $this->otherUser->id_user)
            ->first();
        $this->assertNotNull($peserta);
        $this->assertEquals(PesertaMabar::STATUS_TERDAFTAR, $peserta->status_peserta);

        // 11c. Coba ikut lagi saat sudah terdaftar -> tolak duplikasi
        $responseDobel = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseDobel->assertSessionHasErrors(['message']);

        // 11d. Batal ikut -> status berubah menjadi 'batal'
        $responseBatal = $this->actingAs($this->otherUser)->delete('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseBatal->assertSessionHas('success');

        $peserta->refresh();
        $this->assertEquals(PesertaMabar::STATUS_BATAL, $peserta->status_peserta);

        // 11e. Ikut kembali setelah batal -> reaktifasi row yang sama menjadi 'terdaftar' (bukan insert baru)
        $responseIkutLagi = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarDisetujui->id_mabar . '/ikut');
        $responseIkutLagi->assertSessionHas('success');

        $totalBaris = PesertaMabar::where('id_mabar', $mabarDisetujui->id_mabar)
            ->where('id_user', $this->otherUser->id_user)
            ->count();
        $this->assertEquals(1, $totalBaris);

        $peserta->refresh();
        $this->assertEquals(PesertaMabar::STATUS_TERDAFTAR, $peserta->status_peserta);
    }

    /**
     * 12. Menolak ikut jika kuota sudah penuh.
     */
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

        // Isi slot dengan member
        PesertaMabar::create([
            'id_mabar' => $mabarPenuh->id_mabar,
            'id_user' => $this->member->id_user,
            'tanggal_daftar' => Carbon::today()->toDateString(),
            'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
        ]);

        // otherUser mencoba ikut jadwal yang kuotanya sudah penuh
        $response = $this->actingAs($this->otherUser)->post('/open-mabar/' . $mabarPenuh->id_mabar . '/ikut');
        $response->assertSessionHasErrors(['message']);
    }

    /**
     * 13. Test model helper method: approveMabar() dan rejectMabar().
     */
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
