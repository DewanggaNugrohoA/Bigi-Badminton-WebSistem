<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftKasir extends Model
{
    use HasFactory;

    protected $table = 'shift_kasir';
    protected $primaryKey = 'id_shift';

    protected $fillable = [
        'id_user',
        'waktu_buka',
        'waktu_tutup',
        'saldo_awal',
        'saldo_akhir',
        'total_tunai',
        'total_non_tunai',
        'status_shift',
    ];

    public function kasir()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function transaksiPos()
    {
        return $this->hasMany(TransaksiPos::class, 'id_shift', 'id_shift');
    }
}
