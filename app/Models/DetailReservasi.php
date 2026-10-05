<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailReservasi extends Model
{
    use HasFactory;

    protected $table = 'detail_reservasi';
    protected $primaryKey = 'id_detail_reservasi';

    protected $fillable = [
        'id_reservasi',
        'id_lapangan',
        'jam_mulai',
        'jam_selesai',
        'subtotal',
    ];

    public function reservasi()
    {
        return $this->belongsTo(Reservasi::class, 'id_reservasi', 'id_reservasi');
    }

    public function lapangan()
    {
        return $this->belongsTo(Lapangan::class, 'id_lapangan', 'id_lapangan');
    }
}
