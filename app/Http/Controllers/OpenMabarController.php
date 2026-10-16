<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOpenMabarRequest;
use App\Http\Requests\UpdateOpenMabarRequest;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use App\Models\Reservasi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OpenMabarController extends Controller
{
    
    public function index(Request $request)
    {
        $today = Carbon::today('Asia/Jakarta')->toDateString();
        $tanggalReq = $request->input('tanggal', $today);
        try {
            $tanggal = Carbon::parse($tanggalReq)->toDateString();
        } catch (\Throwable) {
            $tanggal = $today;
        }

        $lapangan = Lapangan::orderBy('id_lapangan', 'asc')->get();

        $detailHariIni = DetailReservasi::whereDate('tanggal_main', $tanggal)
            ->whereHas('reservasi', function ($q) {
                $q->where('status_reservasi', '!=', Reservasi::STATUS_BATAL);
            })
            ->get();

        $mabarHariIni = OpenMabar::whereDate('tanggal', $tanggal)
            ->where('status', OpenMabar::STATUS_DISETUJUI)
            ->whereNotNull('id_lapangan')
            ->get();

        $slotHours = [];
        for ($h = 8; $h <= 22; $h++) {
            $slotHours[] = sprintf('%02d:00', $h);
        }

        $gridSlots = [];
        foreach ($lapangan as $lap) {
            $lapSlots = [];
            foreach ($slotHours as $timeSlot) {
                $startSlot = Carbon::parse("{$tanggal} {$timeSlot}:00");
                $endSlot = $startSlot->copy()->addHour();
                $strStart = $startSlot->format('H:i:s');
                $strEnd = $endSlot->format('H:i:s');

                $booking = $detailHariIni->first(function ($item) use ($lap, $strStart, $strEnd) {
                    return $item->id_lapangan === $lap->id_lapangan
                        && $item->jam_mulai < $strEnd
                        && $item->jam_selesai > $strStart;
                });

                $mabar = $mabarHariIni->first(function ($m) use ($lap, $strStart, $strEnd) {
                    return $m->id_lapangan === $lap->id_lapangan
                        && $m->jam_mulai < $strEnd
                        && $m->jam_selesai > $strStart;
                });

                $isPerawatan = $lap->status_lapangan === Lapangan::STATUS_PERAWATAN;
                $isTerisi = $isPerawatan || $booking !== null || $mabar !== null;

                $jamSelesaiH = ((int) substr($timeSlot, 0, 2)) + 1;
                $jamSelesai = sprintf('%02d:00', min(23, $jamSelesaiH));

                $lapSlots[] = [
                    'jam' => $timeSlot,
                    'jam_selesai' => $jamSelesai,
                    'status' => $isTerisi ? 'terisi' : 'kosong',
                ];
            }

            $gridSlots[] = [
                'id_lapangan' => $lap->id_lapangan,
                'nama_lapangan' => $lap->nama_lapangan,
                'status_lapangan' => $lap->status_lapangan,
                'slots' => $lapSlots,
            ];
        }

        $jadwalQuery = OpenMabar::query()
            ->with(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan'])
            ->withCount(['pesertaMabar as peserta_terdaftar_count' => function ($q) {
                $q->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
            }])
            ->where('status', OpenMabar::STATUS_DISETUJUI);

        if ($request->filled('tanggal')) {
            $jadwalQuery->whereDate('tanggal', $tanggal);
        } else {
            $jadwalQuery->whereDate('tanggal', '>=', $today);
        }

        $jadwal = $jadwalQuery->orderBy('tanggal', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->paginate(9)
            ->withQueryString();

        return Inertia::render('OpenMabar/Index', [
            'gridSlots' => $gridSlots,
            'jadwal' => $jadwal,
            'filters' => [
                'tanggal' => $tanggal,
            ],
        ]);
    }

    public function mabarBareng(Request $request)
    {
        $today = Carbon::today('Asia/Jakarta')->toDateString();

        $query = OpenMabar::query()
            ->with(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan'])
            ->withCount(['pesertaMabar as peserta_terdaftar_count' => function ($q) {
                $q->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
            }])
            ->where('status', OpenMabar::STATUS_DISETUJUI)
            ->whereDate('tanggal', '>=', $today);

        if ($request->filled('usia')) {
            $usia = (int) $request->input('usia');
            $query->where('batas_usia_min', '<=', $usia)
                  ->where('batas_usia_max', '>=', $usia);
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->input('tanggal'));
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->input('gender'));
        }

        $jadwal = $query->orderBy('tanggal', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->paginate(9)
            ->withQueryString();

        return Inertia::render('OpenMabar/MabarBareng', [
            'jadwal' => $jadwal,
            'filters' => [
                'usia' => $request->input('usia', ''),
                'tanggal' => $request->input('tanggal', ''),
                'gender' => $request->input('gender', ''),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $lapangan = Lapangan::where('status_lapangan', 'tersedia')
            ->select('id_lapangan', 'nama_lapangan')
            ->get();

        return Inertia::render('OpenMabar/Create', [
            'lapangan' => $lapangan,
            'initial' => [
                'tanggal' => $request->query('tanggal', ''),
                'id_lapangan' => $request->query('id_lapangan', ''),
                'jam_mulai' => $request->query('jam_mulai', ''),
                'jam_selesai' => $request->query('jam_selesai', ''),
            ],
        ]);
    }

    
    public function store(StoreOpenMabarRequest $request)
    {
        $validated = $request->validated();
        $user = Auth::user();

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('mabar', 'public');
        }

        OpenMabar::create([
            'id_user' => $user->id_user,
            'judul' => $validated['judul'],
            'tanggal' => $validated['tanggal'],
            'jam_mulai' => $validated['jam_mulai'],
            'jam_selesai' => $validated['jam_selesai'],
            'gender' => $validated['gender'],
            'batas_usia_min' => $validated['batas_usia_min'],
            'batas_usia_max' => $validated['batas_usia_max'],
            'kuota' => $validated['kuota'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'foto' => $fotoPath,
            'id_lapangan' => $validated['id_lapangan'] ?? null,
            'status' => OpenMabar::STATUS_MENUNGGU,
        ]);

        return redirect()->route('open-mabar.saya')->with('success', 'Jadwal berhasil dikirim dan menunggu persetujuan admin.');
    }

    
    public function saya()
    {
        $user = Auth::user();

        $jadwalSaya = OpenMabar::query()
            ->with(['lapangan:id_lapangan,nama_lapangan'])
            ->withCount(['pesertaMabar as peserta_terdaftar_count' => function ($q) {
                $q->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
            }])
            ->where('id_user', $user->id_user)
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->paginate(10);

        return Inertia::render('OpenMabar/Saya', [
            'jadwalSaya' => $jadwalSaya,
        ]);
    }

    
    public function show(OpenMabar $mabar)
    {
        $user = Auth::user();

        
        if (!Gate::allows('view', $mabar)) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat jadwal ini.');
        }

        $mabar->load(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan']);

        $pesertaCount = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR)
            ->count();

        $userStatus = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('id_user', $user->id_user)
            ->value('status_peserta');

        $isOwner = (int) $mabar->id_user === (int) $user->id_user;
        $isPesertaAktif = $userStatus === PesertaMabar::STATUS_TERDAFTAR;
        $canAccessChat = $mabar->status === OpenMabar::STATUS_DISETUJUI && ($isOwner || $isPesertaAktif);

        return Inertia::render('OpenMabar/Detail', [
            'mabar' => $mabar,
            'pesertaCount' => $pesertaCount,
            'isOwner' => $isOwner,
            'userStatus' => $userStatus, 
            'canAccessChat' => $canAccessChat,
        ]);
    }

    
    public function edit(OpenMabar $mabar)
    {
        if (!Gate::allows('update', $mabar)) {
            abort(403, 'Jadwal ini tidak dapat diubah.');
        }

        $lapangan = Lapangan::where('status_lapangan', 'tersedia')
            ->select('id_lapangan', 'nama_lapangan')
            ->get();

        return Inertia::render('OpenMabar/Edit', [
            'mabar' => $mabar,
            'lapangan' => $lapangan,
        ]);
    }

    
    public function update(UpdateOpenMabarRequest $request, OpenMabar $mabar)
    {
        if (!Gate::allows('update', $mabar)) {
            abort(403, 'Jadwal ini tidak dapat diubah.');
        }

        $validated = $request->validated();

        if ($request->hasFile('foto')) {
            if ($mabar->foto && Storage::disk('public')->exists($mabar->foto)) {
                Storage::disk('public')->delete($mabar->foto);
            }
            $validated['foto'] = $request->file('foto')->store('mabar', 'public');
        }

        
        if ($mabar->status === OpenMabar::STATUS_DITOLAK) {
            $validated['status'] = OpenMabar::STATUS_MENUNGGU;
        }

        $mabar->update($validated);

        return redirect()->route('open-mabar.saya')->with('success', 'Jadwal berhasil diperbarui.');
    }

    
    public function destroy(OpenMabar $mabar)
    {
        if ($mabar->status === OpenMabar::STATUS_DISETUJUI) {
            abort(403, 'Jadwal mabar yang telah disetujui tidak dapat dihapus.');
        }

        if (!Gate::allows('delete', $mabar)) {
            abort(403, 'Anda tidak dapat menghapus jadwal ini.');
        }

        if ($mabar->foto && Storage::disk('public')->exists($mabar->foto)) {
            Storage::disk('public')->delete($mabar->foto);
        }

        $mabar->delete();

        return redirect()->route('open-mabar.saya')->with('success', 'Jadwal berhasil dibatalkan dan dihapus.');
    }

    
    public function ikut(Request $request, OpenMabar $mabar)
    {
        $user = Auth::user();

        
        if ($mabar->status !== OpenMabar::STATUS_DISETUJUI) {
            return back()->withErrors(['message' => 'Hanya jadwal yang telah disetujui yang dapat diikuti.']);
        }

        
        
        return DB::transaction(function () use ($mabar, $user) {
            
            $mabarLocked = OpenMabar::where('id_mabar', $mabar->id_mabar)->lockForUpdate()->first();

            $pesertaTerdaftarCount = PesertaMabar::where('id_mabar', $mabarLocked->id_mabar)
                ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR)
                ->count();

            $existing = PesertaMabar::where('id_mabar', $mabarLocked->id_mabar)
                ->where('id_user', $user->id_user)
                ->first();

            if ($existing && $existing->status_peserta === PesertaMabar::STATUS_TERDAFTAR) {
                return back()->withErrors(['message' => 'Anda sudah terdaftar dalam jadwal mabar ini.']);
            }

            if ($pesertaTerdaftarCount >= $mabarLocked->kuota) {
                return back()->withErrors(['message' => 'Kuota mabar sudah penuh.']);
            }

            if ($existing) {
                $existing->update([
                    'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
                    'tanggal_daftar' => Carbon::today()->toDateString(),
                ]);
            } else {
                PesertaMabar::create([
                    'id_mabar' => $mabarLocked->id_mabar,
                    'id_user' => $user->id_user,
                    'tanggal_daftar' => Carbon::today()->toDateString(),
                    'status_peserta' => PesertaMabar::STATUS_TERDAFTAR,
                ]);
            }

            return back()->with('success', 'Berhasil bergabung dalam jadwal mabar.');
        });
    }

    
    public function batalIkut(Request $request, OpenMabar $mabar)
    {
        $user = Auth::user();

        $peserta = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('id_user', $user->id_user)
            ->first();

        if (!$peserta || $peserta->status_peserta !== PesertaMabar::STATUS_TERDAFTAR) {
            return back()->withErrors(['message' => 'Anda belum terdaftar dalam mabar ini.']);
        }

        $peserta->update([
            'status_peserta' => PesertaMabar::STATUS_BATAL,
        ]);

        return back()->with('success', 'Pendaftaran mabar berhasil dibatalkan.');
    }
}
