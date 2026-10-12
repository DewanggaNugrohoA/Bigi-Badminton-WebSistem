<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PemeriksaanLapangan extends Model
{
    use HasFactory;

    protected $table = 'pemeriksaan_lapangan';
    protected $primaryKey = 'id';

    public const KONDISI_BAIK = 'baik';
    public const KONDISI_RUSAK_RINGAN = 'rusak_ringan';
    public const KONDISI_RUSAK_SEDANG = 'rusak_sedang';
    public const KONDISI_RUSAK_BERAT = 'rusak_berat';

    public const DAFTAR_KOMPONEN = [
        'karpet_vinil' => 'Karpet / Vinil',
        'net' => 'Net',
        'tiang' => 'Tiang',
        'lampu' => 'Lampu',
        'lantai' => 'Lantai',
        'dinding' => 'Dinding',
    ];

    public const DAFTAR_KONDISI = [
        self::KONDISI_BAIK => 'Baik',
        self::KONDISI_RUSAK_RINGAN => 'Rusak Ringan',
        self::KONDISI_RUSAK_SEDANG => 'Rusak Sedang',
        self::KONDISI_RUSAK_BERAT => 'Rusak Berat',
    ];

    protected $fillable = [
        'id_lapangan',
        'tanggal_pemeriksaan',
        'diperiksa_oleh',
        'karpet_vinil',
        'net',
        'tiang',
        'lampu',
        'lantai',
        'dinding',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pemeriksaan' => 'date',
        ];
    }

    public function lapangan()
    {
        return $this->belongsTo(Lapangan::class, 'id_lapangan', 'id_lapangan');
    }

    public function pemeriksa()
    {
        return $this->belongsTo(User::class, 'diperiksa_oleh', 'id_user');
    }
}
