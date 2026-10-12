<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Lapangan;
use App\Models\PemeriksaanLapangan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class LaporanLapanganService
{
    /**
     * Dapatkan riwayat pemeriksaan lapangan terpaginasi dengan filter rentang tanggal dan lapangan.
     */
    public function getRiwayatPemeriksaan(
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $idLapangan = null,
        int $perPage = 10,
        int $page = 1
    ): LengthAwarePaginator {
        $query = PemeriksaanLapangan::with([
            'lapangan:id_lapangan,nama_lapangan',
            'pemeriksa:id_user,nama',
        ]);

        if ($startDate) {
            $query->whereDate('tanggal_pemeriksaan', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('tanggal_pemeriksaan', '<=', $endDate);
        }

        if ($idLapangan) {
            $query->where('id_lapangan', $idLapangan);
        }

        return $query->orderBy('tanggal_pemeriksaan', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage, ['*'], 'page_lapangan', $page)
            ->withQueryString();
    }

    /**
     * Dapatkan semua riwayat pemeriksaan tanpa batas paginasi untuk kebutuhan ekspor Excel.
     */
    public function getSemuaRiwayatPemeriksaan(
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $idLapangan = null
    ): Collection {
        $query = PemeriksaanLapangan::with([
            'lapangan:id_lapangan,nama_lapangan',
            'pemeriksa:id_user,nama',
        ]);

        if ($startDate) {
            $query->whereDate('tanggal_pemeriksaan', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('tanggal_pemeriksaan', '<=', $endDate);
        }

        if ($idLapangan) {
            $query->where('id_lapangan', $idLapangan);
        }

        return $query->orderBy('tanggal_pemeriksaan', 'desc')
            ->orderBy('id', 'desc')
            ->get();
    }

    /**
     * Ringkasan kondisi terakhir untuk setiap lapangan yang ada dalam sistem.
     * Mengembalikan list tiap lapangan dengan:
     * - id_lapangan, nama_lapangan, status_lapangan
     * - tanggal_pemeriksaan_terakhir (string formatted or null)
     * - komponen_tidak_baik (array nama komponen yang kondisinya bukan 'baik', beserta kondisinya)
     * - pemeriksaan_terakhir (detail model atau null)
     */
    public function getRingkasanKondisiTerakhir(): array
    {
        $lapanganList = Lapangan::orderBy('id_lapangan', 'asc')->get();

        $ringkasan = [];

        foreach ($lapanganList as $lap) {
            $lastCheck = PemeriksaanLapangan::with('pemeriksa:id_user,nama')
                ->where('id_lapangan', $lap->id_lapangan)
                ->orderBy('tanggal_pemeriksaan', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $komponenTidakBaik = [];

            if ($lastCheck) {
                $komponenKeys = array_keys(PemeriksaanLapangan::DAFTAR_KOMPONEN);
                foreach ($komponenKeys as $key) {
                    $val = $lastCheck->{$key};
                    if ($val !== PemeriksaanLapangan::KONDISI_BAIK) {
                        $komponenTidakBaik[] = [
                            'komponen' => PemeriksaanLapangan::DAFTAR_KOMPONEN[$key] ?? $key,
                            'key' => $key,
                            'kondisi' => $val,
                            'kondisi_label' => PemeriksaanLapangan::DAFTAR_KONDISI[$val] ?? $val,
                        ];
                    }
                }
            }

            $ringkasan[] = [
                'id_lapangan' => $lap->id_lapangan,
                'nama_lapangan' => $lap->nama_lapangan,
                'status_lapangan' => $lap->status_lapangan,
                'tanggal_terakhir' => $lastCheck ? $lastCheck->tanggal_pemeriksaan->format('Y-m-d') : null,
                'diperiksa_oleh' => $lastCheck?->pemeriksa?->nama ?? null,
                'komponen_tidak_baik' => $komponenTidakBaik,
                'pemeriksaan_terakhir' => $lastCheck ? [
                    'id' => $lastCheck->id,
                    'tanggal_pemeriksaan' => $lastCheck->tanggal_pemeriksaan->format('Y-m-d'),
                    'karpet_vinil' => $lastCheck->karpet_vinil,
                    'net' => $lastCheck->net,
                    'tiang' => $lastCheck->tiang,
                    'lampu' => $lastCheck->lampu,
                    'lantai' => $lastCheck->lantai,
                    'dinding' => $lastCheck->dinding,
                    'catatan' => $lastCheck->catatan,
                ] : null,
            ];
        }

        return $ringkasan;
    }

    /**
     * Simpan pemeriksaan lapangan baru dan catat di AuditLog.
     * Murni catatan riwayat: tidak mengubah status_lapangan pada tabel lapangan.
     */
    public function simpanPemeriksaan(array $data, User $actor): PemeriksaanLapangan
    {
        $lapangan = Lapangan::findOrFail($data['id_lapangan']);

        $pemeriksaan = PemeriksaanLapangan::create([
            'id_lapangan' => $lapangan->id_lapangan,
            'tanggal_pemeriksaan' => $data['tanggal_pemeriksaan'],
            'diperiksa_oleh' => $actor->id_user,
            'karpet_vinil' => $data['karpet_vinil'],
            'net' => $data['net'],
            'tiang' => $data['tiang'],
            'lampu' => $data['lampu'],
            'lantai' => $data['lantai'],
            'dinding' => $data['dinding'],
            'catatan' => $data['catatan'] ?? null,
        ]);

        AuditLog::create([
            'id_user' => $actor->id_user,
            'aksi' => 'PEMERIKSAAN_LAPANGAN',
            'objek' => 'lapangan',
            'keterangan' => "Mencatat pemeriksaan rutin untuk {$lapangan->nama_lapangan} pada tanggal {$pemeriksaan->tanggal_pemeriksaan->format('Y-m-d')}.",
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);

        return $pemeriksaan;
    }
}
