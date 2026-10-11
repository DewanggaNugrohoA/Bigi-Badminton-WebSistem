<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservasi extends Model
{

    const STATUS_TERKONFIRMASI = 'terkonfirmasi';
    const STATUS_SELESAI = 'selesai';
    const STATUS_BATAL = 'batal';

    protected $table = 'reservasi';
    protected $primaryKey = 'id_reservasi';
    
    protected $fillable = ['id_user', 'nama_pemesan', 'no_whatsapp_pemesan', 'id_paket', 'tanggal_pemesanan', 'total_biaya', 'status_reservasi'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
    public function paket() { return $this->belongsTo(PaketMember::class, 'id_paket'); }
    public function detailReservasi() { return $this->hasMany(DetailReservasi::class, 'id_reservasi'); }
    public function pembayaran() { return $this->hasMany(Pembayaran::class, 'id_reservasi'); }
}