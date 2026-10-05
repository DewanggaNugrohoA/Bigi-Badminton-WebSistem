<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{

    const JENIS_DP = 'DP';
    const JENIS_LUNAS = 'Lunas';
    const METODE_TRANSFER = 'transfer';
    const METODE_TUNAI = 'tunai';
    const METODE_QRIS = 'qris';
    const STATUS_MENUNGGU = 'menunggu';
    const STATUS_TERKONFIRMASI = 'terkonfirmasi';

    protected $table = 'pembayaran';
    protected $primaryKey = 'id_pembayaran';
    
    protected $fillable = ['id_reservasi', 'tanggal_pembayaran', 'jenis_pembayaran', 'jumlah', 'metode_pembayaran', 'status_pembayaran', 'keterangan'];

    public function reservasi() { return $this->belongsTo(Reservasi::class, 'id_reservasi'); }
}