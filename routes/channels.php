<?php

use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id_user === (int) $id;
});

Broadcast::channel('mabar.{id_mabar}', function ($user, $id_mabar) {
    if ($user->role === 'kasir') {
        return false;
    }

    if ($user->role === 'admin') {
        return true;
    }

    if ($user->role === 'user') {
        $mabar = OpenMabar::find($id_mabar);
        if (! $mabar || $mabar->status !== OpenMabar::STATUS_DISETUJUI) {
            return false;
        }

        $isOwner = (int) $mabar->id_user === (int) $user->id_user;
        $isPeserta = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('id_user', $user->id_user)
            ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR)
            ->exists();

        return $isOwner || $isPeserta;
    }

    return false;
});
