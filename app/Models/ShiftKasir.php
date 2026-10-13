<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model entitas Sesi Kerja (Shift) Kasir.
 * Menghitung rekapitulasi kas masuk, modal awal, kas sistem, dan kas fisik aktual.
 */
class ShiftKasir extends Model
{
    // Status Shift Kasir
    const STATUS_TERBUKA = 'terbuka'; // Shift aktif menerima transaksi POS
    const STATUS_DITUTUP = 'ditutup'; // Shift telah direkonsiliasi dan ditutup

    protected $table = 'shift_kasir';
    protected $primaryKey = 'id_shift';
    
    protected $fillable = ['id_user', 'waktu_buka', 'waktu_tutup', 'modal_awal', 'kas_sistem', 'kas_fisik', 'selisih', 'status'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
    public function transaksiPos() { return $this->hasMany(TransaksiPos::class, 'id_shift'); }
    
    
}