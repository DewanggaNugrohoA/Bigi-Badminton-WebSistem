<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    protected $primaryKey = 'id_log';
    
    protected $fillable = ['id_user', 'aksi', 'objek', 'keterangan', 'waktu'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
}