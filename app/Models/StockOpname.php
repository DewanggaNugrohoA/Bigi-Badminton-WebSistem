<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockOpname extends Model
{
    use HasFactory;

    protected $table = 'stock_opname';
    protected $primaryKey = 'id_opname';

    protected $fillable = [
        'id_produk',
        'id_user',
        'stok_sistem',
        'stok_fisik',
        'selisih',
        'keterangan',
    ];

    public function produk()
    {
        return $this->belongsTo(Produk::class, 'id_produk', 'id_produk');
    }

    public function kasir()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
