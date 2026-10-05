<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Informasi extends Model
{
    use HasFactory;

    protected $table = 'informasi';
    protected $primaryKey = 'id_informasi';

    protected $fillable = [
        'id_user',
        'judul',
        'konten',
        'status_terbit',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
