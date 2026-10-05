<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BiayaOperasional extends Model
{
    use HasFactory;

    protected $table = 'biaya_operasional';
    protected $primaryKey = 'id_biaya';

    protected $fillable = [
        'id_user',
        'kategori',
        'jumlah_biaya',
        'keterangan',
        'tanggal',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
