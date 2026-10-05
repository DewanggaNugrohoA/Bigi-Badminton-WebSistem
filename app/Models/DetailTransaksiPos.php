<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailTransaksiPos extends Model
{
    use HasFactory;

    protected $table = 'detail_transaksi_pos';
    protected $primaryKey = 'id_detail';

    protected $fillable = [
        'id_transaksi',
        'id_produk',
        'jumlah',
        'harga_satuan',
        'subtotal',
    ];

    public function transaksiPos()
    {
        return $this->belongsTo(TransaksiPos::class, 'id_transaksi', 'id_transaksi');
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class, 'id_produk', 'id_produk');
    }
}
