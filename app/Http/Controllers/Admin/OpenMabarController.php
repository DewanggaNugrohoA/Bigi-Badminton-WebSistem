<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveOpenMabarRequest;
use App\Http\Requests\Admin\RejectOpenMabarRequest;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Services\ReservasiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OpenMabarController extends Controller
{
    public function __construct(
        protected ReservasiService $reservasiService
    ) {}

    
    public function index(Request $request): Response
    {
        $statusFilter = $request->input('status', 'menunggu');
        $search = $request->input('q', '');
        $tanggal = $request->input('tanggal', '');

        $query = OpenMabar::query()
            ->with([
                'user:id_user,nama,no_whatsapp',
                'lapangan:id_lapangan,nama_lapangan',
            ])
            ->withCount(['pesertaMabar as peserta_terdaftar_count' => function ($q) {
                $q->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
            }]);

        
        if ($statusFilter !== 'semua' && in_array($statusFilter, ['menunggu', 'disetujui', 'ditolak'])) {
            $query->where('status', $statusFilter);
        }

        
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('judul', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('nama', 'like', "%{$search}%")
                         ->orWhere('no_whatsapp', 'like', "%{$search}%");
                  });
            });
        }

        
        if ($tanggal !== '') {
            $query->whereDate('tanggal', $tanggal);
        }

        $daftarMabar = $query->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->paginate(10)
            ->withQueryString();

        $daftarLapangan = Lapangan::select('id_lapangan', 'nama_lapangan', 'status_lapangan')->get();

        return Inertia::render('Admin/OpenMabar/Index', [
            'daftarMabar' => $daftarMabar,
            'daftarLapangan' => $daftarLapangan,
            'filters' => [
                'status' => $statusFilter,
                'q' => $search,
                'tanggal' => $tanggal,
            ],
        ]);
    }

    
    public function checkConflict(Request $request, int $id): JsonResponse
    {
        $mabar = OpenMabar::findOrFail($id);
        $idLapangan = $request->input('id_lapangan') ?: $mabar->id_lapangan;

        if (! $idLapangan) {
            return response()->json([
                'status' => 'NEED_COURT',
                'message' => 'Lapangan belum ditentukan untuk jadwal mabar ini. Silakan pilih lapangan terlebih dahulu.',
            ]);
        }

        $conflict = $this->reservasiService->checkMabarConflict(
            (int) $idLapangan,
            (string) $mabar->tanggal,
            (string) $mabar->jam_mulai,
            (string) $mabar->jam_selesai,
            (int) $mabar->id_mabar,
            false
        );

        if ($conflict) {
            return response()->json([
                'status' => 'CONFLICT',
                'message' => $conflict,
            ]);
        }

        return response()->json([
            'status' => 'OK',
            'message' => 'Slot waktu lapangan tersedia dan bebas dari bentrok jadwal.',
        ]);
    }

    
    public function approve(ApproveOpenMabarRequest $request, int $id): RedirectResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $mabar = OpenMabar::where('id_mabar', $id)->lockForUpdate()->firstOrFail();

            if ($mabar->status !== OpenMabar::STATUS_MENUNGGU) {
                throw ValidationException::withMessages([
                    'approval' => "Jadwal Open Mabar tidak dapat disetujui karena statusnya sudah {$mabar->status}.",
                ]);
            }

            
            $idLapangan = $request->input('id_lapangan') ?: $mabar->id_lapangan;
            if (! $idLapangan) {
                throw ValidationException::withMessages([
                    'id_lapangan' => 'Pilih lapangan terlebih dahulu untuk menyetujui jadwal mabar ini.',
                ]);
            }

            
            $conflict = $this->reservasiService->checkMabarConflict(
                (int) $idLapangan,
                (string) $mabar->tanggal,
                (string) $mabar->jam_mulai,
                (string) $mabar->jam_selesai,
                (int) $mabar->id_mabar,
                true
            );

            if ($conflict) {
                throw ValidationException::withMessages([
                    'id_lapangan' => "Persetujuan gagal: {$conflict}",
                ]);
            }

            $mabar->id_lapangan = (int) $idLapangan;
            $mabar->status = OpenMabar::STATUS_DISETUJUI;
            $mabar->save();

            $admin = $request->user();
            $lapanganName = Lapangan::find($idLapangan)?->nama_lapangan ?? "Lapangan #{$idLapangan}";

            $this->reservasiService->logAktivitas(
                $admin->id_user,
                'SETUJUI_OPEN_MABAR',
                "Open Mabar #{$mabar->id_mabar}",
                "Menyetujui Open Mabar '{$mabar->judul}' pada {$lapanganName}, tanggal {$mabar->tanggal} ({$mabar->jam_mulai}-{$mabar->jam_selesai})."
            );

            return redirect()->back()->with('success', "Open Mabar '{$mabar->judul}' berhasil disetujui dan dialokasikan ke {$lapanganName}.");
        });
    }

    
    public function reject(RejectOpenMabarRequest $request, int $id): RedirectResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $mabar = OpenMabar::where('id_mabar', $id)->lockForUpdate()->firstOrFail();
            $alasan = $request->input('alasan');

            
            if ($mabar->status === OpenMabar::STATUS_DITOLAK) {
                throw ValidationException::withMessages([
                    'rejection' => 'Jadwal Open Mabar sudah dalam status ditolak.',
                ]);
            }

            if ($mabar->status === OpenMabar::STATUS_DISETUJUI) {
                $pesertaCount = PesertaMabar::where('id_mabar', $mabar->id_mabar)
                    ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR)
                    ->count();

                if ($pesertaCount > 0) {
                    throw ValidationException::withMessages([
                        'rejection' => "Jadwal ini tidak dapat ditolak karena sudah memiliki {$pesertaCount} peserta yang terdaftar.",
                    ]);
                }
            }

            $mabar->status = OpenMabar::STATUS_DITOLAK;
            $mabar->save();

            $admin = $request->user();

            $this->reservasiService->logAktivitas(
                $admin->id_user,
                'TOLAK_OPEN_MABAR',
                "Open Mabar #{$mabar->id_mabar}",
                "Menolak Open Mabar '{$mabar->judul}'. Alasan: {$alasan}"
            );

            return redirect()->back()->with('success', "Open Mabar '{$mabar->judul}' telah ditolak. Pengaju dapat melihat catatan dan mengajukan revisi.");
        });
    }
}
