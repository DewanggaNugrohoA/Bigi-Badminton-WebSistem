<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lapangan extends Model
{
    use HasFactory;

    protected $table = 'lapangan';
    protected $primaryKey = 'id_lapangan';

    protected $fillable = [
        'nama_lapangan',
        'harga_per_jam',
        'status',
    ];

    public function detailReservasi()
    {
        return $this->hasMany(DetailReservasi::class, 'id_lapangan', 'id_lapangan');
    }

    public function openMabar()
    {
        return $this->hasMany(OpenMabar::class, 'id_lapangan', 'id_lapangan');
    }
}
