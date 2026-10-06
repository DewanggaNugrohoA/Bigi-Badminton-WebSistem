<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOpenMabarRequest;
use App\Http\Requests\UpdateOpenMabarRequest;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OpenMabarController extends Controller
{
    /**
     * Tampilkan daftar jadwal Open Mabar yang disetujui (cari & filter).
     */
    public function index(Request $request)
    {
        $today = Carbon::today()->toDateString();

        $query = OpenMabar::query()
            ->with(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan'])
            ->withCount(['pesertaMabar as peserta_terdaftar_count' => function ($q) {
                $q->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
            }])
            ->where('status', OpenMabar::STATUS_DISETUJUI)
            ->whereDate('tanggal', '>=', $today);

        // Filter: Usia (batas_usia_min <= usia <= batas_usia_max)
        if ($request->filled('usia')) {
            $usia = (int) $request->input('usia');
            $query->where('batas_usia_min', '<=', $usia)
                  ->where('batas_usia_max', '>=', $usia);
        }

        // Filter: Tanggal pelaksanaan
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->input('tanggal'));
        }

        // Filter: Jenis kelamin / gender (exact match)
        if ($request->filled('gender')) {
            $query->where('gender', $request->input('gender'));
        }

        $jadwal = $query->orderBy('tanggal', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->paginate(9)
            ->withQueryString();

        return Inertia::render('OpenMabar/Index', [
            'jadwal' => $jadwal,
            'filters' => [
                'usia' => $request->input('usia', ''),
                'tanggal' => $request->input('tanggal', ''),
                'gender' => $request->input('gender', ''),
            ],
        ]);
    }

    /**
     * Form buat jadwal mabar baru.
     */
    public function create()
    {
        $lapangan = Lapangan::where('status_lapangan', 'tersedia')
            ->select('id_lapangan', 'nama_lapangan')
            ->get();

        return Inertia::render('OpenMabar/Create', [
            'lapangan' => $lapangan,
        ]);
    }

    /**
     * Simpan jadwal mabar baru (status 'menunggu').
     */
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

    /**
     * Halaman jadwal mabar milik saya.
     */
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

    /**
     * Detail jadwal mabar & daftar peserta.
     */
    public function show(OpenMabar $mabar)
    {
        $user = Auth::user();

        // Cek otorisasi view via policy (hanya disetujui atau milik sendiri)
        if (!Gate::allows('view', $mabar)) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat jadwal ini.');
        }

        $mabar->load(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan']);

        $peserta = PesertaMabar::with('user:id_user,nama')
            ->where('id_mabar', $mabar->id_mabar)
            ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR)
            ->orderBy('tanggal_daftar', 'asc')
            ->get();

        $userStatus = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('id_user', $user->id_user)
            ->value('status_peserta');

        return Inertia::render('OpenMabar/Detail', [
            'mabar' => $mabar,
            'peserta' => $peserta,
            'pesertaCount' => $peserta->count(),
            'isOwner' => $mabar->id_user === $user->id_user,
            'userStatus' => $userStatus, // 'terdaftar', 'batal', or null
        ]);
    }

    /**
     * Form revisi/edit jadwal mabar (hanya untuk status menunggu atau ditolak milik sendiri).
     */
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

    /**
     * Update jadwal mabar.
     */
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

        // Jika jadwal sebelumnya ditolak, ubah kembali menjadi menunggu
        if ($mabar->status === OpenMabar::STATUS_DITOLAK) {
            $validated['status'] = OpenMabar::STATUS_MENUNGGU;
        }

        $mabar->update($validated);

        return redirect()->route('open-mabar.saya')->with('success', 'Jadwal berhasil diperbarui.');
    }

    /**
     * Hapus jadwal mabar milik sendiri.
     */
    public function destroy(OpenMabar $mabar)
    {
        if (!Gate::allows('delete', $mabar)) {
            abort(403, 'Anda tidak dapat menghapus jadwal ini.');
        }

        if ($mabar->foto && Storage::disk('public')->exists($mabar->foto)) {
            Storage::disk('public')->delete($mabar->foto);
        }

        $mabar->delete();

        return redirect()->route('open-mabar.saya')->with('success', 'Jadwal berhasil dibatalkan dan dihapus.');
    }

    /**
     * Ikut jadwal mabar.
     */
    public function ikut(Request $request, OpenMabar $mabar)
    {
        $user = Auth::user();

        // Ikut hanya boleh untuk jadwal berstatus 'disetujui'
        if ($mabar->status !== OpenMabar::STATUS_DISETUJUI) {
            return back()->withErrors(['message' => 'Hanya jadwal yang telah disetujui yang dapat diikuti.']);
        }

        // Pembuat jadwal tidak otomatis jadi peserta dan tidak boleh ikut jika mau, atau dicek
        // Sesuai catatan: Ikut hanya boleh untuk jadwal disetujui, tolak jika kuota penuh atau sudah terdaftar
        return DB::transaction(function () use ($mabar, $user) {
            // Lock baris open_mabar supaya tidak melewati kuota saat concurrent request
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

    /**
     * Batal ikut jadwal mabar.
     */
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
