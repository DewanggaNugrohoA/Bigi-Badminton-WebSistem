<?php

namespace App\Http\Controllers;

use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Models\Reservasi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $mabarStats = [
            'menunggu' => OpenMabar::where('id_user', $user->id_user)
                ->where('status', OpenMabar::STATUS_MENUNGGU)
                ->count(),
            'disetujui' => OpenMabar::where('id_user', $user->id_user)
                ->where('status', OpenMabar::STATUS_DISETUJUI)
                ->count(),
            'ditolak' => OpenMabar::where('id_user', $user->id_user)
                ->where('status', OpenMabar::STATUS_DITOLAK)
                ->count(),
            'diikuti' => PesertaMabar::where('id_user', $user->id_user)
                ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR)
                ->count(),
        ];

        $reservasiSaya = Reservasi::where('id_user', $user->id_user)
            ->with([
                'detailReservasi.lapangan:id_lapangan,nama_lapangan',
                'pembayaran' => function ($query) {
                    $query->select('id_pembayaran', 'id_reservasi', 'jenis_pembayaran', 'jumlah', 'metode_pembayaran', 'status_pembayaran', 'tanggal_pembayaran');
                },
            ])
            ->orderBy('tanggal_pemesanan', 'desc')
            ->get();

        $today = Carbon::today()->toDateString();
        $mabarDiikuti = OpenMabar::whereHas('pesertaMabar', function ($query) use ($user) {
                $query->where('id_user', $user->id_user)
                    ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
            })
            ->where('status', OpenMabar::STATUS_DISETUJUI)
            ->whereDate('tanggal', '>=', $today)
            ->with(['lapangan:id_lapangan,nama_lapangan', 'user:id_user,nama'])
            ->withCount([
                'pesertaMabar as peserta_terdaftar_count' => function ($query) {
                    $query->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
                },
            ])
            ->orderBy('tanggal', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'user' => [
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'email' => $user->email,
                'no_whatsapp' => $user->no_whatsapp,
                'role' => $user->role,
                'jenis_pelanggan' => $user->jenis_pelanggan,
                'status_member' => $user->status_member,
                'tanggal_mulai_member' => $user->tanggal_mulai_member?->format('Y-m-d'),
                'tanggal_akhir_member' => $user->tanggal_akhir_member?->format('Y-m-d'),
            ],
            'mabarStats' => $mabarStats,
            'reservasiSaya' => $reservasiSaya,
            'mabarDiikuti' => $mabarDiikuti,
        ]);
    }
}

