<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PesertaMabar extends Model
{

    const STATUS_TERDAFTAR = 'terdaftar';
    const STATUS_BATAL = 'batal';

    protected $table = 'peserta_mabar';
    protected $primaryKey = 'id_peserta';
    
    protected $fillable = ['id_mabar', 'id_user', 'tanggal_daftar', 'status_peserta'];

    public function openMabar() { return $this->belongsTo(OpenMabar::class, 'id_mabar'); }
    public function user() { return $this->belongsTo(User::class, 'id_user'); }
}