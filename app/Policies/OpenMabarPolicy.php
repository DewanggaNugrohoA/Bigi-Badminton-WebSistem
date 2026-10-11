<?php

namespace App\Policies;

use App\Models\OpenMabar;
use App\Models\User;

class OpenMabarPolicy
{
    
    public function view(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->status === OpenMabar::STATUS_DISETUJUI
            || $openMabar->id_user === $user->id_user;
    }

    
    public function update(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->id_user === $user->id_user
            && in_array($openMabar->status, [OpenMabar::STATUS_MENUNGGU, OpenMabar::STATUS_DITOLAK], true);
    }

    
    public function delete(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->id_user === $user->id_user;
    }
}
