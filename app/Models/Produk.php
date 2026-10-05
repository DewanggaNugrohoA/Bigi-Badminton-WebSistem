<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{

    const STATUS_AKTIF = 'aktif';
    const STATUS_NONAKTIF = 'nonaktif';

    protected $table = 'produk';
    protected $primaryKey = 'id_produk';
    
    protected $fillable = ['nama_produk', 'kategori', 'harga', 'stok', 'stok_minimum', 'status_produk'];

    public function restock() { return $this->hasMany(Restock::class, 'id_produk'); }
    public function stockOpname() { return $this->hasMany(StockOpname::class, 'id_produk'); }
    public function detailTransaksiPos() { return $this->hasMany(DetailTransaksiPos::class, 'id_produk'); }
}