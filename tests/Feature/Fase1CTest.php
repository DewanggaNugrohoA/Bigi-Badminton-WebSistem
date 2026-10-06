<?php

namespace Tests\Feature;

use App\Models\Informasi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class Fase1CTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_homepage_is_accessible_without_login(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->has('informasi')
            ->has('config.wa_admin_number')
        );
    }

    public function test_homepage_shows_at_most_three_published_informasi(): void
    {
        $admin = User::where('role', 'admin')->first();

        // Bersihkan informasi yang ada dan buat data baru
        Informasi::query()->delete();

        Informasi::create([
            'id_user' => $admin->id_user,
            'judul' => 'Draft Berita',
            'status' => 'draft',
            'tanggal_publikasi' => now(),
        ]);

        for ($i = 1; $i <= 5; $i++) {
            Informasi::create([
                'id_user' => $admin->id_user,
                'judul' => "Berita Terbit $i",
                'status' => 'terbit',
                'tanggal_publikasi' => now()->subDays(5 - $i),
            ]);
        }

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->has('informasi', 3)
            ->where('informasi.0.judul', 'Berita Terbit 5')
        );
    }

    public function test_homepage_does_not_contain_open_mabar_schedules_for_guests(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->missing('open_mabar')
            ->missing('mabar')
            ->missing('jadwal')
        );
    }
}
