<?php

use App\Models\OpenMabar;
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
        return $mabar && $mabar->status === OpenMabar::STATUS_DISETUJUI;
    }

    return false;
});
