<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restock extends Model
{
    use HasFactory;

    protected $table = 'restock';
    protected $primaryKey = 'id_restock';

    protected $fillable = [
        'id_produk',
        'id_user',
        'jumlah',
        'biaya_total',
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
