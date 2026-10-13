<?php

namespace Tests\Feature;

use App\Models\Lapangan;
use App\Models\Reservasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservasiPaymentNominalValidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Lapangan $lapangan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->admin = User::create([
            'nama' => 'Admin Penguji Reservasi',
            'email' => 'admin.res@bigi.test',
            'no_whatsapp' => '081234000001',
            'password' => bcrypt('AdminPass123!'),
            'role' => User::ROLE_ADMIN,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->lapangan = Lapangan::first(); 
    }

    
    public function test_server_rejects_negative_zero_decimal_and_too_large_nominal(): void
    {
        $payload = [
            'nama_pemesan' => 'Budi Santoso',
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '09:00',
            'jam_selesai' => '11:00', 
            'jenis_pembayaran' => 'DP',
        ];

        
        $resNegative = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', array_merge($payload, [
            'nominal_dp' => -2,
        ]));
        $resNegative->assertSessionHasErrors(['nominal_dp']);
        $this->assertEquals(
            'Nominal harus lebih dari 0.',
            session('errors')->get('nominal_dp')[0]
        );

        
        $resZero = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', array_merge($payload, [
            'nominal_dp' => 0,
        ]));
        $resZero->assertSessionHasErrors(['nominal_dp']);
        $this->assertEquals(
            'Nominal harus lebih dari 0.',
            session('errors')->get('nominal_dp')[0]
        );

        
        $resDecimal = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', array_merge($payload, [
            'nominal_dp' => 50000.5,
        ]));
        $resDecimal->assertSessionHasErrors(['nominal_dp']);
        $this->assertEquals(
            'Nominal pembayaran harus berupa angka bulat rupiah.',
            session('errors')->get('nominal_dp')[0]
        );

        
        $resTooLarge = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', array_merge($payload, [
            'nominal_dp' => 999999999,
        ]));
        $resTooLarge->assertSessionHasErrors(['nominal_dp']);
        $this->assertEquals(
            'Nominal pembayaran melebihi batas wajar.',
            session('errors')->get('nominal_dp')[0]
        );
    }

    
    public function test_server_rejects_dp_when_greater_than_or_equal_to_total(): void
    {
        
        $payload = [
            'nama_pemesan' => 'Budi Santoso',
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '13:00',
            'jam_selesai' => '15:00',
            'jenis_pembayaran' => 'DP',
        ];

        
        $resEqual = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', array_merge($payload, [
            'nominal_dp' => 100000,
        ]));
        $resEqual->assertSessionHasErrors(['nominal_dp']);
        $this->assertEquals(
            'Nominal DP harus kurang dari total biaya.',
            session('errors')->get('nominal_dp')[0]
        );

        
        $resExceed = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', array_merge($payload, [
            'nominal_dp' => 150000,
        ]));
        $resExceed->assertSessionHasErrors(['nominal_dp']);
        $this->assertEquals(
            'Nominal DP harus kurang dari total biaya.',
            session('errors')->get('nominal_dp')[0]
        );
    }

    
    public function test_server_accepts_valid_dp_and_lunas(): void
    {
        
        $resDp = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', [
            'nama_pemesan' => 'Budi Santoso',
            'no_whatsapp_pemesan' => '081234567890',
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '17:00',
            'jam_selesai' => '19:00',
            'jenis_pembayaran' => 'DP',
            'nominal_dp' => 50000,
        ]);
        $resDp->assertSessionHasNoErrors();
        $resDp->assertRedirect();

        $this->assertDatabaseHas('reservasi', [
            'nama_pemesan' => 'Budi Santoso',
            'no_whatsapp_pemesan' => '081234567890',
            'id_user' => null,
            'total_biaya' => 100000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        $this->assertDatabaseHas('pembayaran', [
            'jenis_pembayaran' => 'DP',
            'jumlah' => 50000,
            'metode_pembayaran' => 'tunai',
        ]);

        
        $resLunas = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', [
            'nama_pemesan' => 'Siti Rahma',
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '19:00',
            'jam_selesai' => '21:00',
            'jenis_pembayaran' => 'Lunas',
        ]);
        $resLunas->assertSessionHasNoErrors();
        $resLunas->assertRedirect();

        $this->assertDatabaseHas('reservasi', [
            'nama_pemesan' => 'Siti Rahma',
            'id_user' => null,
            'total_biaya' => 100000,
            'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
        ]);

        $this->assertDatabaseHas('pembayaran', [
            'jenis_pembayaran' => 'Lunas',
            'jumlah' => 100000,
            'metode_pembayaran' => 'tunai',
        ]);
    }

    
    public function test_total_computed_from_db_tariff_client_price_ignored(): void
    {
        
        $res = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', [
            'nama_pemesan' => 'Penebus Murah',
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'harga_sewa' => 10000,
            'jenis_pembayaran' => 'Lunas',
        ]);
        $res->assertSessionHasNoErrors();

        $this->assertDatabaseHas('reservasi', [
            'nama_pemesan' => 'Penebus Murah',
            'total_biaya' => 100000,
        ]);

        $this->assertDatabaseHas('detail_reservasi', [
            'subtotal' => 100000,
        ]);

        $this->assertDatabaseHas('pembayaran', [
            'jenis_pembayaran' => 'Lunas',
            'jumlah' => 100000,
        ]);
    }

    
    public function test_server_validates_nama_pemesan(): void
    {
        $payload = [
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => Carbon::tomorrow('Asia/Jakarta')->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jenis_pembayaran' => 'Lunas',
        ];

        
        $resEmpty = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', $payload);
        $resEmpty->assertSessionHasErrors(['nama_pemesan']);
        $this->assertEquals(
            'Nama pemesan wajib diisi.',
            session('errors')->get('nama_pemesan')[0]
        );

        
        $resShort = $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', array_merge($payload, [
            'nama_pemesan' => 'A',
        ]));
        $resShort->assertSessionHasErrors(['nama_pemesan']);
        $this->assertEquals(
            'Nama pemesan minimal 2 karakter.',
            session('errors')->get('nama_pemesan')[0]
        );
    }

    
    public function test_reservation_list_shows_nama_pemesan_when_id_user_is_null(): void
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta')->toDateString();

        $this->actingAs($this->admin, 'staff')->post('/admin/reservasi/regular', [
            'nama_pemesan' => 'Joko Anwar Reguler',
            'no_whatsapp_pemesan' => '085566778899',
            'id_lapangan' => $this->lapangan->id_lapangan,
            'tanggal_main' => $tomorrow,
            'jam_mulai' => '10:00',
            'jam_selesai' => '12:00',
            'jenis_pembayaran' => 'Lunas',
        ]);

        
        $resIndex = $this->actingAs($this->admin, 'staff')->get("/admin/reservasi?tanggal={$tomorrow}");
        $resIndex->assertOk();
        $daftar = $resIndex->inertiaPage()['props']['daftarReservasi'];
        $this->assertNotEmpty($daftar);
        $first = collect($daftar)->firstWhere('pemesan.nama', 'Joko Anwar Reguler');
        $this->assertNotNull($first);
        $this->assertNull($first['pemesan']['id_user']);
        $this->assertEquals('085566778899', $first['pemesan']['no_whatsapp']);

        
        $grid = $resIndex->inertiaPage()['props']['gridSlots'];
        $lapSlot = collect($grid)->firstWhere('id_lapangan', $this->lapangan->id_lapangan);
        $slot10 = collect($lapSlot['slots'])->firstWhere('jam', '10:00');
        $this->assertEquals('terpesan', $slot10['status']);
        $this->assertEquals('Joko Anwar Reguler', $slot10['info']['nama_pemesan']);
    }
}
