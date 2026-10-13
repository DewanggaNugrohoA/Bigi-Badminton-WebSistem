<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model entitas Reservasi lapangan badminton.
 * Menghubungkan pemesan, paket member (opsional), detail jadwal slot, dan riwayat pembayaran (DP/Lunas).
 */
class Reservasi extends Model
{
    // Status Reservasi
    const STATUS_TERKONFIRMASI = 'terkonfirmasi'; // Pesanan valid dan aktif menempati jadwal
    const STATUS_SELESAI = 'selesai';             // Waktu sewa telah digunakan
    const STATUS_BATAL = 'batal';                 // Dibatalkan (slot dilepaskan kembali)

    protected $table = 'reservasi';
    protected $primaryKey = 'id_reservasi';
    
    protected $fillable = ['id_user', 'nama_pemesan', 'no_whatsapp_pemesan', 'id_paket', 'tanggal_pemesanan', 'total_biaya', 'status_reservasi'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
    public function paket() { return $this->belongsTo(PaketMember::class, 'id_paket'); }
    public function detailReservasi() { return $this->hasMany(DetailReservasi::class, 'id_reservasi'); }
    public function pembayaran() { return $this->hasMany(Pembayaran::class, 'id_reservasi'); }
}