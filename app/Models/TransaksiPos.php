<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransaksiPos extends Model
{
    use HasFactory;

    protected $table = 'transaksi_pos';
    protected $primaryKey = 'id_transaksi';

    protected $fillable = [
        'id_user',
        'id_shift',
        'nomor_transaksi',
        'total_harga',
        'metode_pembayaran',
        'jumlah_bayar',
        'kembalian',
    ];

    public function kasir()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function shiftKasir()
    {
        return $this->belongsTo(ShiftKasir::class, 'id_shift', 'id_shift');
    }

    public function detailTransaksi()
    {
        return $this->hasMany(DetailTransaksiPos::class, 'id_transaksi', 'id_transaksi');
    }
}
