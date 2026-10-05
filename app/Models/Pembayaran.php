<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    use HasFactory;

    protected $table = 'pembayaran';
    protected $primaryKey = 'id_pembayaran';

    protected $fillable = [
        'id_reservasi',
        'metode_pembayaran',
        'jumlah_bayar',
        'status_pembayaran',
        'bukti_pembayaran',
        'tanggal_bayar',
    ];

    public function reservasi()
    {
        return $this->belongsTo(Reservasi::class, 'id_reservasi', 'id_reservasi');
    }
}
