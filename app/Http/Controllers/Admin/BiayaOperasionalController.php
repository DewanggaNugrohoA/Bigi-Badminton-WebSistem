<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BiayaOperasional;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BiayaOperasionalController extends Controller
{
    public function index(Request $request)
    {
        $tanggal = $request->query('tanggal');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $jenisFilter = $request->query('jenis_pengeluaran');
        $search = $request->query('search');

        $query = BiayaOperasional::with('user:id_user,nama,role');

        if ($tanggal) {
            $query->whereDate('tanggal_biaya', $tanggal);
        } else {
            if ($startDate) {
                $query->whereDate('tanggal_biaya', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('tanggal_biaya', '<=', $endDate);
            }
        }

        if ($jenisFilter) {
            $query->where('jenis_pengeluaran', $jenisFilter);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('keterangan', 'like', "%{$search}%")
                    ->orWhere('jenis_pengeluaran', 'like', "%{$search}%");
            });
        }

        // Hitung total biaya untuk periode filter yang dipilih
        $totalBiaya = (float) (clone $query)->sum('jumlah');

        $biayaList = $query->orderBy('tanggal_biaya', 'desc')
            ->orderBy('id_biaya', 'desc')
            ->paginate(15)
            ->withQueryString();

        $kategoriList = BiayaOperasional::select('jenis_pengeluaran')
            ->distinct()
            ->orderBy('jenis_pengeluaran', 'asc')
            ->pluck('jenis_pengeluaran');

        return Inertia::render('Admin/BiayaOperasional/Index', [
            'biayaList' => $biayaList,
            'totalBiaya' => $totalBiaya,
            'kategoriList' => $kategoriList,
            'filters' => [
                'tanggal' => $tanggal ?? '',
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
                'jenis_pengeluaran' => $jenisFilter ?? '',
                'search' => $search ?? '',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => ['nullable', 'date'],
            'tanggal_biaya' => ['nullable', 'date'],
            'jenis_pengeluaran' => ['required', 'string', 'max:100'],
            'nominal' => ['nullable', 'numeric', 'min:1'],
            'jumlah' => ['nullable', 'numeric', 'min:1'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ], [
            'jenis_pengeluaran.required' => 'Jenis pengeluaran wajib diisi.',
            'nominal.min' => 'Nominal biaya harus lebih dari 0.',
            'jumlah.min' => 'Nominal biaya harus lebih dari 0.',
        ]);

        $tanggal = $validated['tanggal_biaya'] ?? $validated['tanggal'] ?? Carbon::now('Asia/Jakarta')->format('Y-m-d');
        $nominal = $validated['nominal'] ?? $validated['jumlah'] ?? 0;

        if ($nominal <= 0) {
            return back()->withErrors(['nominal' => 'Nominal biaya wajib diisi dan harus lebih dari 0.']);
        }

        $user = $request->user('staff') ?: $request->user();

        $biaya = BiayaOperasional::create([
            'id_user' => $user->id_user,
            'jenis_pengeluaran' => trim($validated['jenis_pengeluaran']),
            'tanggal_biaya' => $tanggal,
            'jumlah' => $nominal,
            'keterangan' => trim((string) ($validated['keterangan'] ?? '')),
        ]);

        AuditLog::create([
            'id_user' => $user->id_user,
            'aksi' => 'TAMBAH_BIAYA_OPERASIONAL',
            'objek' => 'biaya_operasional',
            'keterangan' => "Mencatat biaya operasional: {$biaya->jenis_pengeluaran} sebesar Rp " . number_format($biaya->jumlah, 0, ',', '.') . " pada tanggal {$biaya->tanggal_biaya}",
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);

        return redirect()->route('admin.biaya-operasional.index')
            ->with('success', 'Biaya operasional berhasil dicatat.');
    }

    public function update(Request $request, int $id)
    {
        $biaya = BiayaOperasional::findOrFail($id);

        $validated = $request->validate([
            'tanggal' => ['nullable', 'date'],
            'tanggal_biaya' => ['nullable', 'date'],
            'jenis_pengeluaran' => ['required', 'string', 'max:100'],
            'nominal' => ['nullable', 'numeric', 'min:1'],
            'jumlah' => ['nullable', 'numeric', 'min:1'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ], [
            'jenis_pengeluaran.required' => 'Jenis pengeluaran wajib diisi.',
            'nominal.min' => 'Nominal biaya harus lebih dari 0.',
            'jumlah.min' => 'Nominal biaya harus lebih dari 0.',
        ]);

        $tanggal = $validated['tanggal_biaya'] ?? $validated['tanggal'] ?? $biaya->tanggal_biaya;
        $nominal = $validated['nominal'] ?? $validated['jumlah'] ?? $biaya->jumlah;

        $biaya->update([
            'jenis_pengeluaran' => trim($validated['jenis_pengeluaran']),
            'tanggal_biaya' => $tanggal,
            'jumlah' => $nominal,
            'keterangan' => trim((string) ($validated['keterangan'] ?? '')),
        ]);

        $user = $request->user('staff') ?: $request->user();

        AuditLog::create([
            'id_user' => $user->id_user,
            'aksi' => 'UPDATE_BIAYA_OPERASIONAL',
            'objek' => 'biaya_operasional',
            'keterangan' => "Memperbarui biaya operasional #{$biaya->id_biaya}: {$biaya->jenis_pengeluaran} menjadi Rp " . number_format($biaya->jumlah, 0, ',', '.'),
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);

        return redirect()->route('admin.biaya-operasional.index')
            ->with('success', 'Biaya operasional berhasil diperbarui.');
    }

    public function destroy(Request $request, int $id)
    {
        $biaya = BiayaOperasional::findOrFail($id);
        $jenis = $biaya->jenis_pengeluaran;
        $jumlah = $biaya->jumlah;

        $biaya->delete();

        $user = $request->user('staff') ?: $request->user();

        AuditLog::create([
            'id_user' => $user->id_user,
            'aksi' => 'HAPUS_BIAYA_OPERASIONAL',
            'objek' => 'biaya_operasional',
            'keterangan' => "Menghapus catatan biaya operasional #{$id}: {$jenis} senilai Rp " . number_format($jumlah, 0, ',', '.'),
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);

        return redirect()->route('admin.biaya-operasional.index')
            ->with('success', 'Biaya operasional berhasil dihapus.');
    }
}
