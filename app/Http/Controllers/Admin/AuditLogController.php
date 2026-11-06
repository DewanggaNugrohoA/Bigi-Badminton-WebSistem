<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $aksiFilter = $request->query('aksi');
        $roleFilter = $request->query('role');
        $userIdFilter = $request->query('id_user');
        $search = $request->query('search');

        $query = AuditLog::with('user:id_user,nama,role,email,no_whatsapp');

        if ($startDate) {
            $query->whereDate('waktu', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('waktu', '<=', $endDate);
        }

        if ($aksiFilter) {
            $query->where('aksi', $aksiFilter);
        }

        if ($roleFilter) {
            $query->where(function ($q) use ($roleFilter) {
                $q->where('role', $roleFilter)
                    ->orWhereHas('user', function ($uq) use ($roleFilter) {
                        $uq->where('role', $roleFilter);
                    });
            });
        }

        if ($userIdFilter) {
            $query->where('id_user', (int) $userIdFilter);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('keterangan', 'like', "%{$search}%")
                    ->orWhere('aksi', 'like', "%{$search}%")
                    ->orWhere('objek', 'like', "%{$search}%")
                    ->orWhere('modul', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('nama', 'like', "%{$search}%");
                    });
            });
        }

        // Kronologis: data terbaru di paling atas
        $logs = $query->orderBy('id_log', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Transform collection to ensure role is populated even for old records
        $logs->getCollection()->transform(function (AuditLog $log) {
            if (empty($log->role)) {
                $log->role = $log->user?->role ?? 'tamu';
            }
            return $log;
        });

        // Daftar aksi unik untuk filter
        $aksiList = AuditLog::select('aksi')
            ->distinct()
            ->orderBy('aksi', 'asc')
            ->pluck('aksi');

        // Daftar user staf & aktif untuk filter
        $userList = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_KASIR])
            ->orderBy('nama', 'asc')
            ->get(['id_user', 'nama', 'role']);

        return Inertia::render('Admin/AuditLog/Index', [
            'logs' => $logs,
            'aksiList' => $aksiList,
            'userList' => $userList,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
                'aksi' => $aksiFilter ?? '',
                'role' => $roleFilter ?? '',
                'id_user' => $userIdFilter ?? '',
                'search' => $search ?? '',
            ],
        ]);
    }
}
