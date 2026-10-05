<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'id_user';

    protected $fillable = [
        'nama',
        'email',
        'password',
        'no_whatsapp',
        'jenis_pelanggan',
        'tanggal_mulai_member',
        'tanggal_akhir_member',
        'status_member',
        'status_akun',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function reservasi()
    {
        return $this->hasMany(Reservasi::class, 'id_user', 'id_user');
    }

    public function openMabar()
    {
        return $this->hasMany(OpenMabar::class, 'id_user', 'id_user');
    }
}
