<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model entitas Pembayaran sewa lapangan reservasi (dicatat dan dikonfirmasi oleh Admin).
 */
class Pembayaran extends Model
{
    // Jenis Pembayaran Reservasi
    const JENIS_DP = 'DP';
    const JENIS_LUNAS = 'Lunas';

    // Metode Pembayaran
    const METODE_TRANSFER = 'transfer';
    const METODE_TUNAI = 'tunai';
    const METODE_QRIS = 'qris';

    // Status Pembayaran
    const STATUS_MENUNGGU = 'menunggu';
    const STATUS_TERKONFIRMASI = 'terkonfirmasi';

    protected $table = 'pembayaran';
    protected $primaryKey = 'id_pembayaran';
    
    protected $fillable = ['id_reservasi', 'tanggal_pembayaran', 'jenis_pembayaran', 'jumlah', 'metode_pembayaran', 'status_pembayaran', 'keterangan'];

    public function reservasi() { return $this->belongsTo(Reservasi::class, 'id_reservasi'); }
}