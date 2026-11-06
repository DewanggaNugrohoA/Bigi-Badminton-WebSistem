<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailTransaksiPos extends Model
{
    protected $table = 'detail_transaksi_pos';
    protected $primaryKey = 'id_detail';
    
    protected $fillable = ['id_transaksi', 'id_produk', 'jumlah', 'harga', 'subtotal'];

    protected $appends = ['subtotal'];

    /**
     * Hitung subtotal dari kolom database atau perkalian jumlah dan harga satuan.
     */
    public function getSubtotalAttribute($value): float
    {
        return $value !== null ? (float) $value : (float) ($this->jumlah * $this->harga);
    }

    public function transaksiPos() { return $this->belongsTo(TransaksiPos::class, 'id_transaksi'); }
    public function transaksi() { return $this->belongsTo(TransaksiPos::class, 'id_transaksi'); }
    public function produk() { return $this->belongsTo(Produk::class, 'id_produk'); }
}