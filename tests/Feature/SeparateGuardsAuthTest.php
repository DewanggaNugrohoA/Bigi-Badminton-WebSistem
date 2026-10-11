<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class SeparateGuardsAuthTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->admin = User::create([
            'nama' => 'Admin Testing',
            'email' => 'admin.guards@bigi.test',
            'no_whatsapp' => '08111111111',
            'password' => 'AdminSecret123!',
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->customer = User::create([
            'nama' => 'Customer Testing',
            'email' => 'cust.guards@bigi.test',
            'no_whatsapp' => '08222222222',
            'password' => 'CustSecret123!',
            'role' => User::ROLE_USER,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);
    }

    
    public function test_staff_logged_in_is_guest_on_public_pages_and_navbar_has_no_staff_user(): void
    {
        $response = $this->actingAs($this->admin, 'staff')->get('/');

        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Home')
                ->where('auth.user', null);
        });
    }

    
    public function test_customer_cannot_open_admin(): void
    {
        $response = $this->actingAs($this->customer, 'web')->get('/admin');

        $response->assertRedirect('/staff/login');
    }

    
    public function test_staff_visiting_customer_login_sees_customer_login_page(): void
    {
        $response = $this->actingAs($this->admin, 'staff')->get('/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Auth/Login'));
    }

    
    public function test_customer_visiting_staff_login_sees_staff_login_page(): void
    {
        $response = $this->actingAs($this->customer, 'web')->get('/staff/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Auth/StaffLogin'));
    }

    
    public function test_both_guards_can_be_logged_in_at_once(): void
    {
        
        $resCustLogin = $this->post('/login', [
            'email' => $this->customer->email,
            'password' => 'CustSecret123!',
        ]);
        $resCustLogin->assertRedirect('/');

        
        $resStaffLogin = $this->post('/staff/login', [
            'email' => $this->admin->email,
            'password' => 'AdminSecret123!',
        ]);
        $resStaffLogin->assertRedirect('/admin');

        
        $this->assertAuthenticatedAs($this->customer, 'web');
        $this->assertAuthenticatedAs($this->admin, 'staff');

        
        $resHome = $this->get('/');
        $resHome->assertInertia(function ($page) {
            $page->component('Home')
                ->where('auth.user.id_user', $this->customer->id_user)
                ->where('auth.user.role', 'user');
        });

        
        $resAdmin = $this->get('/admin');
        $resAdmin->assertInertia(function ($page) {
            $page->component('Admin/Dashboard')
                ->where('auth.user.id_user', $this->admin->id_user)
                ->where('auth.user.role', 'admin');
        });
    }

    
    public function test_logout_of_staff_does_not_log_out_customer(): void
    {
        
        $this->post('/login', [
            'email' => $this->customer->email,
            'password' => 'CustSecret123!',
        ]);
        $this->post('/staff/login', [
            'email' => $this->admin->email,
            'password' => 'AdminSecret123!',
        ]);

        $this->assertAuthenticatedAs($this->customer, 'web');
        $this->assertAuthenticatedAs($this->admin, 'staff');

        
        $logoutStaff = $this->post('/staff/logout');
        $logoutStaff->assertRedirect('/staff/login');

        
        $this->assertGuest('staff');
        $this->assertAuthenticatedAs($this->customer, 'web');

        
        $resDash = $this->get('/dashboard');
        $resDash->assertStatus(200);
    }

    
    public function test_logout_of_customer_does_not_log_out_staff(): void
    {
        
        $this->post('/login', [
            'email' => $this->customer->email,
            'password' => 'CustSecret123!',
        ]);
        $this->post('/staff/login', [
            'email' => $this->admin->email,
            'password' => 'AdminSecret123!',
        ]);

        $this->assertAuthenticatedAs($this->customer, 'web');
        $this->assertAuthenticatedAs($this->admin, 'staff');

        
        $logoutCust = $this->post('/logout');
        $logoutCust->assertRedirect('/');

        
        $this->assertGuest('web');
        $this->assertAuthenticatedAs($this->admin, 'staff');

        
        $resAdmin = $this->get('/admin');
        $resAdmin->assertStatus(200);
    }
}
