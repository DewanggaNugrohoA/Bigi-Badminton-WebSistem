<?php

namespace App\Policies;

use App\Models\OpenMabar;
use App\Models\User;

/**
 * Policy otorisasi aksi terhadap kegiatan Open Mabar.
 */
class OpenMabarPolicy
{
    /**
     * User hanya boleh melihat detail mabar yang telah disetujui Admin,
     * atau mabar miliknya sendiri meskipun masih menunggu persetujuan.
     */
    public function view(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->status === OpenMabar::STATUS_DISETUJUI
            || $openMabar->id_user === $user->id_user;
    }

    /**
     * User hanya boleh mengubah mabar miliknya yang berstatus menunggu atau ditolak.
     * Mabar yang sudah disetujui tidak boleh diubah langsung oleh user agar tidak membatalkan reservasi jadwal.
     */
    public function update(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->id_user === $user->id_user
            && in_array($openMabar->status, [OpenMabar::STATUS_MENUNGGU, OpenMabar::STATUS_DITOLAK], true);
    }

    /**
     * User hanya boleh menghapus mabar miliknya sendiri yang belum disetujui.
     */
    public function delete(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->id_user === $user->id_user
            && in_array($openMabar->status, [OpenMabar::STATUS_MENUNGGU, OpenMabar::STATUS_DITOLAK], true);
    }
}
