<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Restock extends Model
{
    protected $table = 'restock';
    protected $primaryKey = 'id_restock';
    
    protected $fillable = ['id_produk', 'id_user', 'jumlah', 'tanggal', 'keterangan'];

    public function produk() { return $this->belongsTo(Produk::class, 'id_produk'); }
    public function user() { return $this->belongsTo(User::class, 'id_user'); }
}