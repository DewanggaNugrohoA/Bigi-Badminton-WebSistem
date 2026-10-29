<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    /**
     * Catat aktivitas audit ke dalam tabel audit_log.
     */
    public static function log(
        string $aksi,
        string $modul,
        ?string $keterangan = null,
        ?User $user = null,
        ?array $dataLama = null,
        ?array $dataBaru = null
    ): AuditLog {
        if (! $user) {
            $user = Auth::guard('staff')->user() ?: Auth::guard('web')->user() ?: Auth::user();
        }

        $idUser = $user?->id_user;
        $role = $user?->role ?? 'tamu';
        $ip = request() ? request()->ip() : null;

        return AuditLog::create([
            'id_user' => $idUser,
            'role' => $role,
            'aksi' => strtoupper($aksi),
            'objek' => $modul,
            'modul' => $modul,
            'keterangan' => $keterangan,
            'data_lama' => $dataLama,
            'data_baru' => $dataBaru,
            'ip_address' => $ip,
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);
    }
}
