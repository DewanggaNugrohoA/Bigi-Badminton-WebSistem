<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Produk extends Model
{
    const STATUS_AKTIF = 'aktif';
    const STATUS_NONAKTIF = 'nonaktif';

    protected $table = 'produk';
    protected $primaryKey = 'id_produk';

    protected $fillable = [
        'nama_produk',
        'kategori',
        'gambar',
        'harga',
        'stok',
        'stok_minimum',
        'status_produk',
    ];

    protected $appends = [
        'url_gambar',
    ];

    public function getUrlGambarAttribute(): ?string
    {
        if (! $this->gambar) {
            return null;
        }

        return Storage::disk('public')->url($this->gambar);
    }

    public function restock() { return $this->hasMany(Restock::class, 'id_produk'); }
    public function stockOpname() { return $this->hasMany(StockOpname::class, 'id_produk'); }
    public function detailTransaksiPos() { return $this->hasMany(DetailTransaksiPos::class, 'id_produk'); }
}