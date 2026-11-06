<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model entitas Open Mabar (Komunitas Main Bareng).
 * Dibuat oleh pengguna, lalu ditinjau dan disetujui/ditolak oleh admin.
 */
class OpenMabar extends Model
{
    // Kategori Gender
    const GENDER_PUTRA = 'putra';
    const GENDER_PUTRI = 'putri';
    const GENDER_CAMPURAN = 'campuran';

    // Status Pengajuan Open Mabar
    const STATUS_MENUNGGU = 'menunggu';   // Pengajuan baru, belum tampil di publik
    const STATUS_DISETUJUI = 'disetujui'; // Disetujui admin dan slot lapangan dialokasikan
    const STATUS_DITOLAK = 'ditolak';     // Ditolak oleh admin beserta catatan alasan

    protected $table = 'open_mabar';
    protected $primaryKey = 'id_mabar';
    protected $fillable = [
        'id_user',
        'judul',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'gender',
        'no_hp',
        'batas_usia_min',
        'batas_usia_max',
        'kuota',
        'deskripsi',
        'foto',
        'id_lapangan',
        'status',
    ];

    protected $hidden = [
        'no_hp',
    ];

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