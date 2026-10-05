<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservasi extends Model
{
    use HasFactory;

    protected $table = 'reservasi';
    protected $primaryKey = 'id_reservasi';

    protected $fillable = [
        'id_user',
        'kode_reservasi',
        'tanggal_reservasi',
        'total_harga',
        'status_reservasi',
        'catatan',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function detailReservasi()
    {
        return $this->hasMany(DetailReservasi::class, 'id_reservasi', 'id_reservasi');
    }

    public function pembayaran()
    {
        return $this->hasMany(Pembayaran::class, 'id_reservasi', 'id_reservasi');
    }
}
