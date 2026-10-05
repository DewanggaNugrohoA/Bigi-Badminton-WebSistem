<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOpname extends Model
{
    protected $table = 'stock_opname';
    protected $primaryKey = 'id_opname';
    
    protected $fillable = ['id_produk', 'id_user', 'stok_sistem', 'stok_fisik', 'selisih', 'tanggal', 'keterangan'];

    public function produk() { return $this->belongsTo(Produk::class, 'id_produk'); }
    public function user() { return $this->belongsTo(User::class, 'id_user'); }
}