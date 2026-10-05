<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailReservasi extends Model
{
    protected $table = 'detail_reservasi';
    protected $primaryKey = 'id_detail_reservasi';
    
    protected $fillable = ['id_reservasi', 'id_lapangan', 'tanggal_main', 'jam_mulai', 'jam_selesai', 'durasi', 'subtotal'];

    public function reservasi() { return $this->belongsTo(Reservasi::class, 'id_reservasi'); }
    public function lapangan() { return $this->belongsTo(Lapangan::class, 'id_lapangan'); }
}