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

        $this->user = User::create([
            'nama' => 'User Biasa',
            'email' => 'user.e@example.com',
            'no_whatsapp' => '08144440001',
            'password' => bcrypt('secret123'),
            'role' => 'user',
        ]);

        $this->member = User::create([
            'nama' => 'User Member',
            'email' => 'member.e@example.com',
            'no_whatsapp' => '08144440002',
            'password' => bcrypt('secret123'),
            'role' => 'user',
            'jenis_pelanggan' => 'member',
            'tanggal_mulai_member' => Carbon::now()->subDays(10)->toDateString(),
            'tanggal_akhir_member' => Carbon::now()->addDays(20)->toDateString(),
            'status_member' => 'aktif',
        ]);

        $this->admin = User::create([
            'nama' => 'Admin Uji',
            'email' => 'admin.e@example.com',
            'no_whatsapp' => '08144440003',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
        ]);

        $this->kasir = User::create([
            'nama' => 'Kasir Uji',
            'email' => 'kasir.e@example.com',
            'no_whatsapp' => '08144440004',
            'password' => bcrypt('secret123'),
            'role' => 'kasir',
        ]);

        
        $this->mabarDisetujui = OpenMabar::create([
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

        $this->mabarMenunggu = OpenMabar::create([
            'id_user' => $this->member->id_user,
            'judul' => 'Mabar Menunggu Persetujuan',
            'tanggal' => Carbon::now()->addDays(5)->toDateString(),
            'jam_mulai' => '19:00:00',
            'jam_selesai' => '21:00:00',
            'gender' => 'campuran',
            'batas_usia_min' => 20,
            'batas_usia_max' => 30,
            'kuota' => 8,
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        $this->mabarDitolak = OpenMabar::create([
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

    
    public function test_guests_cannot_access_chat_routes(): void
    {
        $this->get("/chat-panel/{$this->mabarDisetujui->id_mabar}/pesan")
            ->assertRedirect('/login');

        $this->post("/chat-panel/{$this->mabarDisetujui->id_mabar}/kirim", [
            'pesan' => 'Halo mabar',
        ])->assertRedirect('/login');
    }

    
    public function test_admin_and_kasir_receive_403_on_http_chat_routes(): void
    {
        
        $this->actingAs($this->admin)
            ->get("/chat-panel/{$this->mabarDisetujui->id_mabar}/pesan")
            ->assertForbidden();

        $this->actingAs($this->admin)
            ->post("/chat-panel/{$this->mabarDisetujui->id_mabar}/kirim", [
                'pesan' => 'Pesan dari admin',
            ])->assertForbidden();

        
        $this->actingAs($this->kasir)
            ->get("/chat-panel/{$this->mabarDisetujui->id_mabar}/pesan")
            ->assertForbidden();

        $this->actingAs($this->kasir)
            ->post("/chat-panel/{$this->mabarDisetujui->id_mabar}/kirim", [
                'pesan' => 'Pesan dari kasir',
            ])->assertForbidden();
    }

    
    public function test_user_cannot_access_chat_for_unapproved_mabar(): void
    {
        
        $this->actingAs($this->user)
            ->get("/chat-panel/{$this->mabarMenunggu->id_mabar}/pesan")
            ->assertForbidden();

        $this->actingAs($this->user)
            ->post("/chat-panel/{$this->mabarMenunggu->id_mabar}/kirim", [
                'pesan' => 'Coba kirim ke menunggu',
            ])->assertForbidden();

        
        $this->actingAs($this->user)
            ->get("/chat-panel/{$this->mabarDitolak->id_mabar}/pesan")
            ->assertForbidden();

        $this->actingAs($this->user)
            ->post("/chat-panel/{$this->mabarDitolak->id_mabar}/kirim", [
                'pesan' => 'Coba kirim ke ditolak',
            ])->assertForbidden();
    }

    
    public function test_user_can_access_chat_for_approved_mabar(): void
    {
        $response = $this->actingAs($this->user)
            ->get("/chat-panel/{$this->mabarDisetujui->id_mabar}/pesan");

        $response->assertOk();
        $response->assertJsonStructure([
            'status',
            'mabar' => ['id_mabar', 'judul', 'tanggal', 'jam_mulai', 'jam_selesai', 'kuota', 'status'],
            'messages',
        ]);
    }

    
    public function test_chat_loads_last_50_messages_in_chronological_order(): void
    {
        
        ChatMabar::where('id_mabar', $this->mabarDisetujui->id_mabar)->delete();

        
        for ($i = 1; $i <= 60; $i++) {
            ChatMabar::create([
                'id_mabar' => $this->mabarDisetujui->id_mabar,
                'id_user' => $this->user->id_user,
                'pesan' => "Pesan nomor {$i}",
                'waktu' => Carbon::now()->subMinutes(60 - $i),
            ]);
        }

        $response = $this->actingAs($this->user)
            ->get("/chat-panel/{$this->mabarDisetujui->id_mabar}/pesan");

        $response->assertOk();
        $data = $response->json('messages');
        $this->assertCount(50, $data);
        
        $this->assertEquals('Pesan nomor 11', $data[0]['pesan']);
        
        $this->assertEquals('Pesan nomor 60', $data[49]['pesan']);
    }

    
    public function test_validation_rejects_empty_and_too_long_message(): void
    {
        
        $this->actingAs($this->user)
            ->postJson("/chat-panel/{$this->mabarDisetujui->id_mabar}/kirim", [
                'pesan' => '',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['pesan']);

        
        $this->actingAs($this->user)
            ->postJson("/chat-panel/{$this->mabarDisetujui->id_mabar}/kirim", [
                'pesan' => str_repeat('a', 501),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['pesan']);
    }

    
    public function test_message_is_persisted_and_event_broadcasted(): void
    {
        Event::fake([PesanMabarTerkirim::class]);

        $isiPesan = 'Halo semua, jangan lupa bawa raket cadangan ya!';

        $response = $this->actingAs($this->user)
            ->postJson("/chat-panel/{$this->mabarDisetujui->id_mabar}/kirim", [
                'pesan' => $isiPesan,
            ]);

        $response->assertStatus(201);

        
        $this->assertDatabaseHas('chat_mabar', [
            'id_mabar' => $this->mabarDisetujui->id_mabar,
            'id_user' => $this->user->id_user,
            'pesan' => $isiPesan,
        ]);

        
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

    
    public function test_old_chat_routes_return_404(): void
    {
        $this->actingAs($this->user)
            ->get("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat")
            ->assertNotFound();

        $this->actingAs($this->user)
            ->post("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", ['pesan' => 'Tes'])
            ->assertNotFound();
    }

    
    public function test_customer_page_props_do_not_contain_old_chat_url_and_can_access_chat_flag(): void
    {
        
        $responseOwner = $this->actingAs($this->user)->get("/open-mabar/{$this->mabarDisetujui->id_mabar}");
        $responseOwner->assertOk();
        $responseOwner->assertInertia(fn (Assert $page) => $page
            ->component('OpenMabar/Detail')
            ->has('mabar')
            ->has('pesertaCount')
            ->where('canAccessChat', true)
            ->missing('peserta')
        );

        $propsOwnerJson = json_encode($responseOwner->original->getData()['page']['props'] ?? []);
        $this->assertStringNotContainsString("/chat'", $propsOwnerJson);
        $this->assertStringNotContainsString("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", $propsOwnerJson);
        $this->assertStringNotContainsString("open-mabar.chat", $propsOwnerJson);

        
        $responseOutsider = $this->actingAs($this->member)->get("/open-mabar/{$this->mabarDisetujui->id_mabar}");
        $responseOutsider->assertOk();
        $responseOutsider->assertInertia(fn (Assert $page) => $page
            ->component('OpenMabar/Detail')
            ->where('canAccessChat', false)
            ->missing('peserta')
        );

        $propsOutsiderJson = json_encode($responseOutsider->original->getData()['page']['props'] ?? []);
        $this->assertStringNotContainsString("/open-mabar/{$this->mabarDisetujui->id_mabar}/chat", $propsOutsiderJson);
        $this->assertStringNotContainsString("open-mabar.chat", $propsOutsiderJson);

        
        $responseIndex = $this->actingAs($this->user)->get('/open-mabar');
        $responseIndex->assertOk();
        $propsIndexJson = json_encode($responseIndex->original->getData()['page']['props'] ?? []);
        $this->assertStringNotContainsString("/chat", $propsIndexJson);
        $this->assertStringNotContainsString("open-mabar.chat", $propsIndexJson);

        
        $responseSaya = $this->actingAs($this->user)->get('/open-mabar/saya');
        $responseSaya->assertOk();
        $propsSayaJson = json_encode($responseSaya->original->getData()['page']['props'] ?? []);
        $this->assertStringNotContainsString("/chat", $propsSayaJson);
        $this->assertStringNotContainsString("open-mabar.chat", $propsSayaJson);
    }

    
    public function test_broadcast_channel_authorization(): void
    {
        $channels = Broadcast::getChannels();
        $this->assertArrayHasKey('mabar.{id_mabar}', $channels);

        $callback = $channels['mabar.{id_mabar}'];

        
        $this->assertTrue(
            (bool) $callback($this->user, $this->mabarDisetujui->id_mabar),
            'User harus diizinkan bergabung ke channel mabar yang disetujui.'
        );

        
        $this->assertFalse(
            (bool) $callback($this->user, $this->mabarMenunggu->id_mabar),
            'User harus ditolak bergabung ke channel mabar yang berstatus menunggu.'
        );

        
        $this->assertFalse(
            (bool) $callback($this->user, $this->mabarDitolak->id_mabar),
            'User harus ditolak bergabung ke channel mabar yang berstatus ditolak.'
        );

        
        $this->assertTrue(
            (bool) $callback($this->admin, $this->mabarDisetujui->id_mabar),
            'Admin harus diizinkan mendengarkan channel mabar yang disetujui.'
        );

        
        $this->assertFalse(
            (bool) $callback($this->kasir, $this->mabarDisetujui->id_mabar),
            'Kasir harus ditolak dari channel obrolan mabar.'
        );
    }
}
