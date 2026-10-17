<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetOtp extends Model
{
    protected $table = 'password_reset_otp';
    protected $primaryKey = 'id_reset';

    protected $fillable = [
        'no_whatsapp',
        'kode_otp',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
