<?php

namespace Tests\Feature;

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
            ->has('config.wa_admin_number')
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
