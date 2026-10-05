<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Informasi extends Model
{

    const STATUS_DRAFT = 'draft';
    const STATUS_TERBIT = 'terbit';

    protected $table = 'informasi';
    protected $primaryKey = 'id_informasi';
    
    protected $fillable = ['id_user', 'judul', 'gambar', 'tanggal_publikasi', 'status'];

    public function user() { return $this->belongsTo(User::class, 'id_user'); }
}