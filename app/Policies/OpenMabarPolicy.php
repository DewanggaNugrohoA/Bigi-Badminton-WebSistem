<?php

namespace App\Policies;

use App\Models\OpenMabar;
use App\Models\User;

class OpenMabarPolicy
{
    /**
     * Determine whether the user can view the schedule details.
     * Schedule can be viewed if it is approved, or if the user is the owner.
     */
    public function view(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->status === OpenMabar::STATUS_DISETUJUI
            || $openMabar->id_user === $user->id_user;
    }

    /**
     * Determine whether the user can update the schedule.
     * Only the owner can update, and only if status is 'menunggu' or 'ditolak'.
     */
    public function update(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->id_user === $user->id_user
            && in_array($openMabar->status, [OpenMabar::STATUS_MENUNGGU, OpenMabar::STATUS_DITOLAK], true);
    }

    /**
     * Determine whether the user can delete the schedule.
     * Only the owner can delete their own schedule.
     */
    public function delete(User $user, OpenMabar $openMabar): bool
    {
        return $openMabar->id_user === $user->id_user;
    }
}
