<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerifikasiOtp extends Model
{
    protected $table = 'verifikasi_otp';
    protected $primaryKey = 'id_otp';

    protected $fillable = [
        'no_whatsapp',
        'kode_otp',
        'nama',
        'password',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
