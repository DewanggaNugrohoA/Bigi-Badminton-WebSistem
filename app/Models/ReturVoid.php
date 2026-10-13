<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model entitas Void dan Retur transaksi kasir POS.
 * Menghubungkan kasir yang mengajukan (id_user) dan admin peninjau (id_admin).
 */
class ReturVoid extends Model
{
    // Jenis Pengajuan
    const JENIS_VOID = 'void';   // Pembatalan transaksi karena salah input
    const JENIS_RETUR = 'retur'; // Pengembalian barang cacat/rusak

    // Status Pengajuan
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