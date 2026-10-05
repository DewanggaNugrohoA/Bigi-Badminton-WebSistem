<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpenMabar extends Model
{

    const GENDER_PUTRA = 'putra';
    const GENDER_PUTRI = 'putri';
    const GENDER_CAMPURAN = 'campuran';
    const STATUS_MENUNGGU = 'menunggu';
    const STATUS_DISETUJUI = 'disetujui';
    const STATUS_DITOLAK = 'ditolak';

    protected $table = 'open_mabar';
    protected $primaryKey = 'id_mabar';
    
    protected $fillable = ['id_user', 'judul', 'tanggal', 'jam_mulai', 'jam_selesai', 'gender', 'batas_usia_min', 'batas_usia_max', 'kuota', 'deskripsi', 'foto', 'id_lapangan', 'status'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
    public function lapangan() { return $this->belongsTo(Lapangan::class, 'id_lapangan'); }
    public function pesertaMabar() { return $this->hasMany(PesertaMabar::class, 'id_mabar'); }
    public function chatMabar() { return $this->hasMany(ChatMabar::class, 'id_mabar'); }

    public function approveMabar()
    {
        $this->update(['status' => 'disetujui']);
    }

    public function rejectMabar()
    {
        $this->update(['status' => 'ditolak']);
    }
}