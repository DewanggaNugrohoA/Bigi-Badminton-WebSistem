<?php

use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use Illuminate\Support\Facades\Broadcast;

// Saluran privat profil notifikasi masing-masing user.
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id_user === (int) $id;
});

// Saluran privat notifikasi operasional khusus admin.
Broadcast::channel('admin.notifikasi', function ($user) {
    return $user && $user->role === 'admin';
}, ['guards' => ['staff', 'web']]);

/**
 * Saluran privat real-time chat Open Mabar (Laravel Reverb).
 * Aturan hak akses:
 * - Kasir: ditolak (kasir tidak memiliki keterkaitan dengan forum mabar).
 * - Admin: diizinkan memantau seluruh obrolan open mabar.
 * - User: hanya diizinkan jika event mabar berstatus disetujui DAN user adalah pembuat atau peserta terdaftar.
 */
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
