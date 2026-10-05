<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PesertaMabar extends Model
{
    use HasFactory;

    protected $table = 'peserta_mabar';
    protected $primaryKey = 'id_peserta';

    protected $fillable = [
        'id_mabar',
        'id_user',
        'status_pembayaran',
    ];

    public function openMabar()
    {
        return $this->belongsTo(OpenMabar::class, 'id_mabar', 'id_mabar');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
