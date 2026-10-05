<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMabar extends Model
{
    protected $table = 'chat_mabar';
    protected $primaryKey = 'id_chat';
    
    protected $fillable = ['id_mabar', 'id_user', 'pesan', 'waktu'];

    public function openMabar() { return $this->belongsTo(OpenMabar::class, 'id_mabar'); }
    public function user() { return $this->belongsTo(User::class, 'id_user'); }
}