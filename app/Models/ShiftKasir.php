<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftKasir extends Model
{

    const STATUS_TERBUKA = 'terbuka';
    const STATUS_DITUTUP = 'ditutup';

    protected $table = 'shift_kasir';
    protected $primaryKey = 'id_shift';
    
    protected $fillable = ['id_user', 'waktu_buka', 'waktu_tutup', 'modal_awal', 'kas_sistem', 'kas_fisik', 'selisih', 'status'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
    public function transaksiPos() { return $this->hasMany(TransaksiPos::class, 'id_shift'); }
    
    
}