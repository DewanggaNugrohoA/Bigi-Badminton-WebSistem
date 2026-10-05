<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturVoid extends Model
{
    use HasFactory;

    protected $table = 'retur_void';
    protected $primaryKey = 'id_retur';

    protected $fillable = [
        'id_transaksi',
        'id_user',
        'id_admin',
        'tipe',
        'alasan',
        'status',
    ];

    public function transaksiPos()
    {
        return $this->belongsTo(TransaksiPos::class, 'id_transaksi', 'id_transaksi');
    }

    public function kasir()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'id_admin', 'id_user');
    }
}
