<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiayaOperasional extends Model
{
    protected $table = 'biaya_operasional';
    protected $primaryKey = 'id_biaya';
    
    protected $fillable = ['id_user', 'tanggal_biaya', 'keterangan', 'jumlah'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
}