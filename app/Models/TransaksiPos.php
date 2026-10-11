<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransaksiPos extends Model
{

    const METODE_TUNAI = 'tunai';
    const METODE_QRIS = 'qris';
    const STATUS_SELESAI = 'selesai';
    const STATUS_VOID = 'void';
    const STATUS_RETUR = 'retur';

    protected $table = 'transaksi_pos';
    protected $primaryKey = 'id_transaksi';
    
    protected $fillable = ['id_user', 'id_shift', 'no_transaksi', 'tanggal', 'subtotal', 'diskon', 'total', 'metode_bayar', 'uang_diterima', 'kembalian', 'status_transaksi', 'catatan'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
    public function shiftKasir() { return $this->belongsTo(ShiftKasir::class, 'id_shift'); }
    public function detailTransaksiPos() { return $this->hasMany(DetailTransaksiPos::class, 'id_transaksi'); }
    public function returVoid() { return $this->hasMany(ReturVoid::class, 'id_transaksi'); }

    
}