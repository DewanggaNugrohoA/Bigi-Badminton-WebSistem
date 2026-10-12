<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lapangan extends Model
{

    const STATUS_TERSEDIA = 'tersedia';
    const STATUS_PERAWATAN = 'perawatan';

    protected $table = 'lapangan';
    protected $primaryKey = 'id_lapangan';
    
    protected $fillable = ['nama_lapangan', 'harga_per_jam', 'status_lapangan', 'keterangan'];

    public function pemeriksaan()
    {
        return $this->hasMany(PemeriksaanLapangan::class, 'id_lapangan', 'id_lapangan');
    }
}