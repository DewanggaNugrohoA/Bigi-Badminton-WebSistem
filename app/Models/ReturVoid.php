<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReturVoid extends Model
{

    const JENIS_VOID = 'void';
    const JENIS_RETUR = 'retur';
    const STATUS_MENUNGGU = 'menunggu';
    const STATUS_DISETUJUI = 'disetujui';
    const STATUS_DITOLAK = 'ditolak';

    protected $table = 'retur_void';
    protected $primaryKey = 'id_retur';
    
    protected $fillable = ['id_transaksi', 'id_user', 'id_admin', 'jenis', 'alasan', 'status', 'tanggal'];

    public function transaksiPos() { return $this->belongsTo(TransaksiPos::class, 'id_transaksi'); }
    public function pengaju() { return $this->belongsTo(User::class, 'id_user'); }
    public function penyetuju() { return $this->belongsTo(User::class, 'id_admin'); }
}