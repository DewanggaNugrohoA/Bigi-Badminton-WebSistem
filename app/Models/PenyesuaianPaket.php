<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenyesuaianPaket extends Model
{
    use HasFactory;

    protected $table = 'penyesuaian_paket';

    protected $fillable = [
        'id_paket',
        'selisih',
        'tanggal_main',
        'alasan',
        'id_admin',
    ];

    protected function casts(): array
    {
        return [
            'selisih' => 'integer',
            'tanggal_main' => 'date',
        ];
    }

    public function paket()
    {
        return $this->belongsTo(PaketMember::class, 'id_paket');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'id_admin');
    }
}
