<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model entitas Transaksi Penjualan Kasir POS (Point of Sale).
 * id_user merujuk pada kasir yang melayani transaksi.
 */
class TransaksiPos extends Model
{
    // Metode Pembayaran POS
    const METODE_TUNAI = 'tunai';
    const METODE_QRIS = 'qris';

    // Status Transaksi POS
    const STATUS_SELESAI = 'selesai'; // Transaksi berhasil dan stok terpotong
    const STATUS_VOID = 'void';       // Pembatalan transaksi kasir (stok dipulihkan)
    const STATUS_RETUR = 'retur';     // Pengembalian barang kasir (stok dipulihkan)

    protected $table = 'transaksi_pos';
    protected $primaryKey = 'id_transaksi';
    
    protected $fillable = ['id_user', 'id_shift', 'no_transaksi', 'tanggal', 'subtotal', 'diskon', 'total', 'metode_bayar', 'uang_diterima', 'kembalian', 'status_transaksi', 'catatan'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
    public function shiftKasir() { return $this->belongsTo(ShiftKasir::class, 'id_shift'); }
    public function detailTransaksiPos() { return $this->hasMany(DetailTransaksiPos::class, 'id_transaksi'); }
    public function returVoid() { return $this->hasMany(ReturVoid::class, 'id_transaksi'); }

    
}