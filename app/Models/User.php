<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Model entitas Pengguna (User).
 *
 * Mendukung autentikasi multi-role:
 * - admin: pengelola jadwal, data master, member, approval, dan laporan.
 * - kasir: operator shift kasir POS, penjualan snack/minuman, restock, dan opname.
 * - user: pelanggan yang dapat membuat reservasi dan mengajukan/mengikuti Open Mabar.
 */
class User extends Authenticatable
{
    // Nilai Enum Role Pengguna
    const ROLE_ADMIN = 'admin';
    const ROLE_KASIR = 'kasir';
    const ROLE_USER = 'user';

    // Nilai Enum Jenis Pelanggan
    const JENIS_PELANGGAN_MEMBER = 'member';
    const JENIS_PELANGGAN_REGULER = 'reguler';

    // Nilai Enum Status Member
    const STATUS_MEMBER_AKTIF = 'aktif';
    const STATUS_MEMBER_TIDAK_AKTIF = 'tidak_aktif';

    // Nilai Enum Status Akun (akun nonaktif dicegah login oleh RoleMiddleware)
    const STATUS_AKUN_AKTIF = 'aktif';
    const STATUS_AKUN_NONAKTIF = 'nonaktif';

    use HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'id_user';
    
    protected $fillable = ['nama', 'no_whatsapp', 'email', 'password', 'role', 'jenis_pelanggan', 'tanggal_mulai_member', 'tanggal_akhir_member', 'status_member', 'status_akun'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'tanggal_mulai_member' => 'date',
            'tanggal_akhir_member' => 'date',
        ];
    }

    public function reservasi() { return $this->hasMany(Reservasi::class, 'id_user'); }
    public function openMabar() { return $this->hasMany(OpenMabar::class, 'id_user'); }
    public function pesertaMabar() { return $this->hasMany(PesertaMabar::class, 'id_user'); }
    public function chatMabar() { return $this->hasMany(ChatMabar::class, 'id_user'); }
    public function informasi() { return $this->hasMany(Informasi::class, 'id_user'); }
    public function biayaOperasional() { return $this->hasMany(BiayaOperasional::class, 'id_user'); }
    public function transaksiPos() { return $this->hasMany(TransaksiPos::class, 'id_user'); }
    public function shiftKasir() { return $this->hasMany(ShiftKasir::class, 'id_user'); }
    public function restock() { return $this->hasMany(Restock::class, 'id_user'); }
    public function stockOpname() { return $this->hasMany(StockOpname::class, 'id_user'); }
    public function auditLog() { return $this->hasMany(AuditLog::class, 'id_user'); }
    public function returVoidPengaju() { return $this->hasMany(ReturVoid::class, 'id_user'); }
    public function returVoidPenyetuju() { return $this->hasMany(ReturVoid::class, 'id_admin'); }
    public function paketMember() { return $this->hasMany(PaketMember::class, 'id_user'); }
}