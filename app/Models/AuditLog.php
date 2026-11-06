<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    protected $primaryKey = 'id_log';

    protected $fillable = [
        'id_user',
        'role',
        'aksi',
        'objek',
        'modul',
        'keterangan',
        'data_lama',
        'data_baru',
        'ip_address',
        'waktu',
        'user_id',
    ];

    protected $casts = [
        'data_lama' => 'array',
        'data_baru' => 'array',
        'waktu' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    protected static function booted()
    {
        static::creating(function (AuditLog $log) {
            if (empty($log->waktu)) {
                $log->waktu = Carbon::now('Asia/Jakarta');
            }

            if (empty($log->objek) && !empty($log->modul)) {
                $log->objek = $log->modul;
            } elseif (empty($log->modul) && !empty($log->objek)) {
                $log->modul = $log->objek;
            }

            if (empty($log->ip_address) && request()) {
                $log->ip_address = request()->ip();
            }

            if (empty($log->role) && !empty($log->id_user)) {
                $user = User::find($log->id_user);
                if ($user) {
                    $log->role = $user->role;
                }
            }
        });
    }

    public function setUserIdAttribute($value): void
    {
        $this->attributes['id_user'] = $value;
    }
}
