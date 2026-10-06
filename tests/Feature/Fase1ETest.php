<?php

namespace Tests\Feature;

use App\Events\PesanMabarTerkirim;
use App\Models\ChatMabar;
use App\Models\OpenMabar;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class Fase1ETest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $member;
    protected User $admin;
    protected User $kasir;
    protected OpenMabar $mabarDisetujui;
    protected OpenMabar $mabarMenunggu;
    protected OpenMabar $mabarDitolak;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->user = User::where('email', 'user@bigi.test')->first();
        $this->member = User::where('email', 'member@bigi.test')->first();
        $this->admin = User::where('email', 'admin@bigi.test')->first();
        $this->kasir = User::where('email', 'kasir@bigi.test')->first();

        // Mabar dengan berbagai status dari seeder
        $this->mabarDisetujui = OpenMabar::where('status', OpenMabar::STATUS_DISETUJUI)->first();
        $this->mabarMenunggu = OpenMabar::where('status', OpenMabar::STATUS_MENUNGGU)->first();
        $this->mabarDitolak = OpenMabar::where('status', OpenMabar::STATUS_DITOLAK)->first();
    }

    /**
     * Tamu (unauthenticated) diarahkan ke halaman login.
     */
    public function test_guests_cannot_access_chat_routes(): void
    {
        $this->get("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat")
            ->assertRedirect('/login');

        $this->post("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", [
            'pesan' => 'Halo mabar',
        ])->assertRedirect('/login');
    }

    /**
     * Admin dan Kasir menerima HTTP 403 saat mengakses rute chat (hanya role:user).
     */
    public function test_admin_and_kasir_receive_403_on_http_chat_routes(): void
    {
        // Admin
        $this->actingAs($this->admin)
            ->get("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat")
            ->assertForbidden();

        $this->actingAs($this->admin)
            ->post("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", [
                'pesan' => 'Pesan dari admin',
            ])->assertForbidden();

        // Kasir
        $this->actingAs($this->kasir)
            ->get("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat")
            ->assertForbidden();

        $this->actingAs($this->kasir)
            ->post("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", [
                'pesan' => 'Pesan dari kasir',
            ])->assertForbidden();
    }

    /**
     * Jadwal yang belum disetujui (menunggu / ditolak) tidak bisa dibuka ruang obrolannya (403).
     */
    public function test_user_cannot_access_chat_for_unapproved_mabar(): void
    {
        // Jadwal menunggu
        $this->actingAs($this->user)
            ->get("/open-mabar/{$this->mabarMenunggu->id_mabar}/chat")
            ->assertForbidden();

        $this->actingAs($this->user)
            ->post("/open-mabar/{$this->mabarMenunggu->id_mabar}/chat", [
                'pesan' => 'Coba kirim ke menunggu',
            ])->assertForbidden();

        // Jadwal ditolak
        $this->actingAs($this->user)
            ->get("/open-mabar/{$this->mabarDitolak->id_mabar}/chat")
            ->assertForbidden();

        $this->actingAs($this->user)
            ->post("/open-mabar/{$this->mabarDitolak->id_mabar}/chat", [
                'pesan' => 'Coba kirim ke ditolak',
            ])->assertForbidden();
    }

    /**
     * User login dapat membuka ruang obrolan untuk jadwal yang disetujui.
     */
    public function test_user_can_access_chat_for_approved_mabar(): void
    {
        $response = $this->actingAs($this->user)
            ->get("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('OpenMabar/Chat')
            ->has('mabar')
            ->has('messages')
        );
    }

    /**
     * Halaman memuat 50 pesan TERAKHIR dalam urutan kronologis, bukan 50 pertama.
     */
    public function test_chat_loads_last_50_messages_in_chronological_order(): void
    {
        // Bersihkan chat lama pada mabar ini untuk pengujian terisolasi
        ChatMabar::where('id_mabar', $this->mabarDisetujui->id_mabar)->delete();

        // Buat 60 pesan berurutan
        for ($i = 1; $i <= 60; $i++) {
            ChatMabar::create([
                'id_mabar' => $this->mabarDisetujui->id_mabar,
                'id_user' => $this->user->id_user,
                'pesan' => "Pesan nomor {$i}",
                'waktu' => Carbon::now()->subMinutes(60 - $i),
            ]);
        }

        $response = $this->actingAs($this->user)
            ->get("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat");

        $response->assertOk();
        $response->assertInertia(function (Assert $page) {
            $page->component('OpenMabar/Chat')
                ->has('messages', 50)
                // Pesan pertama yang dimuat harus pesan nomor 11 (bukan nomor 1)
                ->where('messages.0.pesan', 'Pesan nomor 11')
                // Pesan terakhir yang dimuat harus pesan nomor 60
                ->where('messages.49.pesan', 'Pesan nomor 60');
        });
    }

    /**
     * Validasi pesan: wajib diisi dan maksimal 500 karakter.
     */
    public function test_validation_rejects_empty_and_too_long_message(): void
    {
        // Pesan kosong
        $this->actingAs($this->user)
            ->post("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", [
                'pesan' => '',
            ])
            ->assertSessionHasErrors(['pesan']);

        // Pesan > 500 karakter
        $this->actingAs($this->user)
            ->post("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", [
                'pesan' => str_repeat('a', 501),
            ])
            ->assertSessionHasErrors(['pesan']);
    }

    /**
     * Pesan tersimpan di database chat_mabar dan event PesanMabarTerkirim disiarkan.
     */
    public function test_message_is_persisted_and_event_broadcasted(): void
    {
        Event::fake([PesanMabarTerkirim::class]);

        $isiPesan = 'Halo semua, jangan lupa bawa raket cadangan ya!';

        $response = $this->actingAs($this->user)
            ->post("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", [
                'pesan' => $isiPesan,
            ]);

        $response->assertRedirect();

        // Pastikan tersimpan di database chat_mabar
        $this->assertDatabaseHas('chat_mabar', [
            'id_mabar' => $this->mabarDisetujui->id_mabar,
            'id_user' => $this->user->id_user,
            'pesan' => $isiPesan,
        ]);

        // Pastikan event di-dispatch dengan payload yang benar
        Event::assertDispatched(PesanMabarTerkirim::class, function (PesanMabarTerkirim $event) use ($isiPesan) {
            $channels = $event->broadcastOn();
            $this->assertCount(1, $channels);
            $this->assertEquals("private-mabar.{$this->mabarDisetujui->id_mabar}", $channels[0]->name);

            $payload = $event->broadcastWith();
            $this->assertEquals($isiPesan, $payload['pesan']);
            $this->assertEquals($this->user->id_user, $payload['id_user']);
            $this->assertEquals($this->user->nama, $payload['nama_pengirim']);
            $this->assertNotEmpty($payload['waktu']);

            return true;
        });
    }

    /**
     * Otorisasi channel di routes/channels.php:
     * - user + jadwal disetujui = izin
     * - user + jadwal menunggu/ditolak = tolak
     * - admin = izin
     * - kasir = tolak
     */
    public function test_broadcast_channel_authorization(): void
    {
        $channels = Broadcast::getChannels();
        $this->assertArrayHasKey('mabar.{id_mabar}', $channels);

        $callback = $channels['mabar.{id_mabar}'];

        // 1. User + jadwal disetujui = izin (true)
        $this->assertTrue(
            (bool) $callback($this->user, $this->mabarDisetujui->id_mabar),
            'User harus diizinkan bergabung ke channel mabar yang disetujui.'
        );

        // 2. User + jadwal menunggu = tolak (false)
        $this->assertFalse(
            (bool) $callback($this->user, $this->mabarMenunggu->id_mabar),
            'User harus ditolak bergabung ke channel mabar yang berstatus menunggu.'
        );

        // 3. User + jadwal ditolak = tolak (false)
        $this->assertFalse(
            (bool) $callback($this->user, $this->mabarDitolak->id_mabar),
            'User harus ditolak bergabung ke channel mabar yang berstatus ditolak.'
        );

        // 4. Admin = izin (true)
        $this->assertTrue(
            (bool) $callback($this->admin, $this->mabarDisetujui->id_mabar),
            'Admin harus diizinkan mendengarkan channel mabar yang disetujui.'
        );

        // 5. Kasir = tolak (false)
        $this->assertFalse(
            (bool) $callback($this->kasir, $this->mabarDisetujui->id_mabar),
            'Kasir harus ditolak dari channel obrolan mabar.'
        );
    }
}
