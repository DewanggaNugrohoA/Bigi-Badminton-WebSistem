<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    use HasFactory;

    protected $table = 'produk';
    protected $primaryKey = 'id_produk';

    protected $fillable = [
        'nama_produk',
        'kategori',
        'harga_jual',
        'stok',
    ];

    public function detailTransaksi()
    {
        return $this->hasMany(DetailTransaksiPos::class, 'id_produk', 'id_produk');
    }
}
