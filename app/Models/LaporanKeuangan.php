<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model entitas arsip ringkasan Laporan Keuangan berkala (sesuai spesifikasi ERD/Class Diagram).
 */
class LaporanKeuangan extends Model
{
    protected $table = 'laporan_keuangan';
    protected $primaryKey = 'id_laporan';
    
    protected $fillable = ['periode_awal', 'periode_akhir', 'pendapatan_lapangan', 'pendapatan_pos', 'total_pengeluaran', 'profit_bersih'];
}