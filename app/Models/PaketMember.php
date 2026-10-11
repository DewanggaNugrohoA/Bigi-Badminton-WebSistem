<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaketMember extends Model
{
    use HasFactory;

    const STATUS_AKTIF = 'aktif';
    const STATUS_HABIS = 'habis';
    const STATUS_KEDALUWARSA = 'kedaluwarsa';
    const STATUS_DIBATALKAN = 'dibatalkan';

    protected $table = 'paket_member';
    protected $primaryKey = 'id_paket';

    protected $fillable = [
        'id_user',
        'jumlah_sesi',
        'tanggal_mulai',
        'tanggal_akhir',
        'status',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_akhir' => 'date',
            'jumlah_sesi' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function reservasi()
    {
        return $this->hasMany(Reservasi::class, 'id_paket');
    }

    public function penyesuaian()
    {
        return $this->hasMany(PenyesuaianPaket::class, 'id_paket');
    }

    
    public function getSesiTerpakaiAttribute(): int
    {
        if ($this->relationLoaded('reservasi')) {
            return (int) $this->reservasi
                ->where('status_reservasi', '!=', Reservasi::STATUS_BATAL)
                ->sum(function ($res) {
                    return $res->detailReservasi ? $res->detailReservasi->count() : 0;
                });
        }

        return (int) DetailReservasi::whereHas('reservasi', function ($q) {
            $q->where('id_paket', $this->id_paket)
                ->where('status_reservasi', '!=', Reservasi::STATUS_BATAL);
        })->count();
    }

    
    public function getTotalPenyesuaianAttribute(): int
    {
        if ($this->relationLoaded('penyesuaian')) {
            return (int) $this->penyesuaian->sum('selisih');
        }

        return (int) $this->penyesuaian()->sum('selisih');
    }

    
    public function getSisaSesiAttribute(): int
    {
        $sisa = $this->jumlah_sesi + $this->total_penyesuaian - $this->sesi_terpakai;
        return max(0, $sisa);
    }

    
    public function getStatusDinamisAttribute(): string
    {
        if ($this->status === self::STATUS_DIBATALKAN) {
            return self::STATUS_DIBATALKAN;
        }

        if ($this->tanggal_akhir && Carbon::parse($this->tanggal_akhir)->startOfDay()->lt(Carbon::today('Asia/Jakarta'))) {
            return self::STATUS_KEDALUWARSA;
        }

        if ($this->sisa_sesi <= 0) {
            return self::STATUS_HABIS;
        }

        return self::STATUS_AKTIF;
    }
}
