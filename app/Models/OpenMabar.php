<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpenMabar extends Model
{
    use HasFactory;

    protected $table = 'open_mabar';
    protected $primaryKey = 'id_mabar';

    protected $fillable = [
        'id_user',
        'id_lapangan',
        'judul',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'level_pemain',
        'max_peserta',
        'harga_per_orang',
        'status',
        'alasan_penolakan',
    ];

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function lapangan()
    {
        return $this->belongsTo(Lapangan::class, 'id_lapangan', 'id_lapangan');
    }

    public function peserta()
    {
        return $this->hasMany(PesertaMabar::class, 'id_mabar', 'id_mabar');
    }

    public function chat()
    {
        return $this->hasMany(ChatMabar::class, 'id_mabar', 'id_mabar');
    }

    public function approveMabar(): bool
    {
        return $this->update([
            'status' => 'disetujui',
            'alasan_penolakan' => null,
        ]);
    }

    public function rejectMabar(string $alasan): bool
    {
        return $this->update([
            'status' => 'ditolak',
            'alasan_penolakan' => $alasan,
        ]);
    }
}
