<?php

namespace App\Services;

use App\Models\DetailReservasi;
use App\Models\OpenMabar;
use App\Models\PaketMember;
use App\Models\PesertaMabar;
use App\Models\Reservasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service pengelola data statistik dan aktivitas pemain (member, reguler, dan peserta open mabar).
 */
class LaporanPemainService
{
    /**
     * Standarisasi nomor telepon WhatsApp ke format lokal (misal: 628... menjadi 08...).
     */
    public static function normalizeWhatsapp(?string $wa): string
    {
        if ($wa === null) {
            return '';
        }
        $digits = preg_replace('/\D+/', '', $wa);
        if ($digits === '' || $digits === null) {
            return '';
        }
        if (str_starts_with($digits, '62')) {
            $digits = '0' . substr($digits, 2);
        }
        return $digits;
    }

    public function getRingkasan(string $startDate, string $endDate): array
    {
        $pemainTerdaftarAktif = User::query()
            ->where('role', User::ROLE_USER)
            ->where('status_akun', User::STATUS_AKUN_AKTIF)
            ->count();

        $today = Carbon::today('Asia/Jakarta');
        $memberAktif = User::query()
            ->where('role', User::ROLE_USER)
            ->where('status_akun', User::STATUS_AKUN_AKTIF)
            ->where('jenis_pelanggan', User::JENIS_PELANGGAN_MEMBER)
            ->where('status_member', User::STATUS_MEMBER_AKTIF)
            ->where(function ($q) use ($today) {
                $q->whereNull('tanggal_akhir_member')
                    ->orWhereDate('tanggal_akhir_member', '>=', $today);
            })
            ->count();

        $totalKunjungan = (int) Reservasi::query()
            ->where('status_reservasi', '!=', Reservasi::STATUS_BATAL)
            ->whereExists(function ($q) use ($startDate, $endDate) {
                $q->select(DB::raw(1))
                    ->from('detail_reservasi')
                    ->whereColumn('detail_reservasi.id_reservasi', 'reservasi.id_reservasi')
                    ->whereDate('detail_reservasi.tanggal_main', '>=', $startDate)
                    ->whereDate('detail_reservasi.tanggal_main', '<=', $endDate);
            })
            ->count();

        $totalSesiPaketTerpakai = (int) DetailReservasi::query()
            ->join('reservasi', 'detail_reservasi.id_reservasi', '=', 'reservasi.id_reservasi')
            ->whereNotNull('reservasi.id_paket')
            ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL)
            ->whereDate('detail_reservasi.tanggal_main', '>=', $startDate)
            ->whereDate('detail_reservasi.tanggal_main', '<=', $endDate)
            ->count();

        $jumlahOpenMabar = (int) OpenMabar::query()
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->count();

        $allPemain = $this->getSemuaPemain($startDate, $endDate, null);
        $pemainBerkunjung = 0;
        foreach ($allPemain as $item) {
            if ($item['kunjungan_periode'] > 0) {
                $pemainBerkunjung++;
            }
        }

        return [
            'pemain_terdaftar_aktif' => $pemainTerdaftarAktif,
            'member_aktif' => $memberAktif,
            'pemain_berkunjung_periode' => $pemainBerkunjung,
            'total_kunjungan' => $totalKunjungan,
            'total_sesi_paket_terpakai' => $totalSesiPaketTerpakai,
            'jumlah_open_mabar' => $jumlahOpenMabar,
        ];
    }

    public function getSemuaPemain(string $startDate, string $endDate, ?string $search = null): Collection
    {
        $today = Carbon::today('Asia/Jakarta');

        $kunjunganSub = DB::table('reservasi')
            ->join('detail_reservasi', 'reservasi.id_reservasi', '=', 'detail_reservasi.id_reservasi')
            ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL)
            ->whereDate('detail_reservasi.tanggal_main', '>=', $startDate)
            ->whereDate('detail_reservasi.tanggal_main', '<=', $endDate)
            ->groupBy('reservasi.id_reservasi', 'reservasi.id_user')
            ->select('reservasi.id_reservasi', 'reservasi.id_user');

        $kunjunganRegistered = DB::table($kunjunganSub, 'valid_res')
            ->whereNotNull('valid_res.id_user')
            ->groupBy('valid_res.id_user')
            ->select('valid_res.id_user', DB::raw('COUNT(valid_res.id_reservasi) as total_kunjungan'))
            ->pluck('total_kunjungan', 'id_user')
            ->all();

        $lastVisitRegistered = DB::table('reservasi')
            ->join('detail_reservasi', 'reservasi.id_reservasi', '=', 'detail_reservasi.id_reservasi')
            ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL)
            ->whereNotNull('reservasi.id_user')
            ->groupBy('reservasi.id_user')
            ->select('reservasi.id_user', DB::raw('MAX(detail_reservasi.tanggal_main) as last_date'))
            ->pluck('last_date', 'id_user')
            ->all();

        $mabarDibuat = DB::table('open_mabar')
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->groupBy('id_user')
            ->select('id_user', DB::raw('COUNT(id_mabar) as total_mabar'))
            ->pluck('total_mabar', 'id_user')
            ->all();

        $mabarDiikuti = DB::table('peserta_mabar')
            ->join('open_mabar', 'peserta_mabar.id_mabar', '=', 'open_mabar.id_mabar')
            ->where('peserta_mabar.status_peserta', PesertaMabar::STATUS_TERDAFTAR)
            ->whereDate('open_mabar.tanggal', '>=', $startDate)
            ->whereDate('open_mabar.tanggal', '<=', $endDate)
            ->groupBy('peserta_mabar.id_user')
            ->select('peserta_mabar.id_user', DB::raw('COUNT(peserta_mabar.id_peserta) as total_ikut'))
            ->pluck('total_ikut', 'peserta_mabar.id_user')
            ->all();

        $users = User::query()
            ->where('role', User::ROLE_USER)
            ->where('status_akun', User::STATUS_AKUN_AKTIF)
            ->with([
                'paketMember' => function ($q) {
                    $q->with([
                        'reservasi.detailReservasi',
                        'penyesuaian',
                    ])->orderBy('id_paket', 'desc');
                },
            ])
            ->get();

        $registeredByNormalizedPhone = [];
        $registeredRows = [];

        foreach ($users as $user) {
            $normWa = self::normalizeWhatsapp($user->no_whatsapp);

            $activePaket = $user->paketMember->first(function ($p) use ($today) {
                if ($p->status === PaketMember::STATUS_DIBATALKAN) {
                    return false;
                }
                if ($p->tanggal_akhir && Carbon::parse($p->tanggal_akhir)->startOfDay()->lt($today)) {
                    return false;
                }
                return $p->sisa_sesi > 0;
            });

            $sisaSesi = $activePaket ? $activePaket->sisa_sesi : null;

            $jenisLabel = 'Reguler';
            $isExpired = $user->tanggal_akhir_member && Carbon::parse($user->tanggal_akhir_member)->startOfDay()->lt($today);
            if ($user->jenis_pelanggan === User::JENIS_PELANGGAN_MEMBER && $user->status_member === User::STATUS_MEMBER_AKTIF && ! $isExpired) {
                $jenisLabel = 'Member';
            }

            $kunjungan = (int) ($kunjunganRegistered[$user->id_user] ?? 0);
            $lastVisit = $lastVisitRegistered[$user->id_user] ?? null;
            $dibuat = (int) ($mabarDibuat[$user->id_user] ?? 0);
            $diikuti = (int) ($mabarDiikuti[$user->id_user] ?? 0);

            $rowData = [
                'key' => 'u_' . $user->id_user,
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'no_whatsapp' => $user->no_whatsapp,
                'norm_wa' => $normWa,
                'jenis_label' => $jenisLabel,
                'sisa_sesi_paket' => $sisaSesi,
                'kunjungan_periode' => $kunjungan,
                'open_mabar_dibuat' => $dibuat,
                'open_mabar_diikuti' => $diikuti,
                'kunjungan_terakhir' => $lastVisit,
                'is_walkin' => false,
            ];

            $registeredRows[$user->id_user] = $rowData;
            if ($normWa !== '') {
                $registeredByNormalizedPhone[$normWa] = $user->id_user;
            }
        }

        $walkinReservations = DB::table('reservasi')
            ->join('detail_reservasi', 'reservasi.id_reservasi', '=', 'detail_reservasi.id_reservasi')
            ->whereNull('reservasi.id_user')
            ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL)
            ->groupBy('reservasi.id_reservasi', 'reservasi.nama_pemesan', 'reservasi.no_whatsapp_pemesan')
            ->select(
                'reservasi.id_reservasi',
                'reservasi.nama_pemesan',
                'reservasi.no_whatsapp_pemesan',
                DB::raw('MAX(detail_reservasi.tanggal_main) as max_date_all'),
                DB::raw('SUM(CASE WHEN detail_reservasi.tanggal_main >= ' . DB::getPdo()->quote($startDate) . ' AND detail_reservasi.tanggal_main <= ' . DB::getPdo()->quote($endDate) . ' THEN 1 ELSE 0 END) as slots_in_period')
            )
            ->get();

        $walkinGroups = [];
        $noPhoneVisitsInPeriod = 0;
        $noPhoneLastVisit = null;

        foreach ($walkinReservations as $res) {
            $inPeriod = (int) $res->slots_in_period > 0 ? 1 : 0;
            $resLastDate = $res->max_date_all;
            $norm = self::normalizeWhatsapp($res->no_whatsapp_pemesan);

            if ($norm === '') {
                if ($inPeriod > 0) {
                    $noPhoneVisitsInPeriod += 1;
                }
                if ($resLastDate) {
                    if ($noPhoneLastVisit === null || $resLastDate > $noPhoneLastVisit) {
                        $noPhoneLastVisit = $resLastDate;
                    }
                }
                continue;
            }

            if (isset($registeredByNormalizedPhone[$norm])) {
                $userId = $registeredByNormalizedPhone[$norm];
                $registeredRows[$userId]['kunjungan_periode'] += $inPeriod;
                if ($resLastDate) {
                    $currentLast = $registeredRows[$userId]['kunjungan_terakhir'];
                    if ($currentLast === null || $resLastDate > $currentLast) {
                        $registeredRows[$userId]['kunjungan_terakhir'] = $resLastDate;
                    }
                }
                continue;
            }

            if (! isset($walkinGroups[$norm])) {
                $walkinGroups[$norm] = [
                    'nama' => $res->nama_pemesan ?: 'Pelanggan Walk-in',
                    'raw_whatsapp' => $res->no_whatsapp_pemesan,
                    'norm_wa' => $norm,
                    'kunjungan_periode' => 0,
                    'kunjungan_terakhir' => null,
                ];
            }

            $walkinGroups[$norm]['kunjungan_periode'] += $inPeriod;
            if ($resLastDate) {
                $cur = $walkinGroups[$norm]['kunjungan_terakhir'];
                if ($cur === null || $resLastDate > $cur) {
                    $walkinGroups[$norm]['kunjungan_terakhir'] = $resLastDate;
                }
            }
        }

        $allRows = collect($registeredRows)->values();

        foreach ($walkinGroups as $norm => $w) {
            $allRows->push([
                'key' => 'w_' . $norm,
                'id_user' => null,
                'nama' => $w['nama'],
                'no_whatsapp' => $w['raw_whatsapp'],
                'norm_wa' => $norm,
                'jenis_label' => 'Tanpa akun',
                'sisa_sesi_paket' => null,
                'kunjungan_periode' => $w['kunjungan_periode'],
                'open_mabar_dibuat' => 0,
                'open_mabar_diikuti' => 0,
                'kunjungan_terakhir' => $w['kunjungan_terakhir'],
                'is_walkin' => true,
            ]);
        }

        if ($noPhoneVisitsInPeriod > 0 || $noPhoneLastVisit !== null) {
            $allRows->push([
                'key' => 'w_no_phone',
                'id_user' => null,
                'nama' => 'Tanpa nomor',
                'no_whatsapp' => null,
                'norm_wa' => '',
                'jenis_label' => 'Tanpa akun',
                'sisa_sesi_paket' => null,
                'kunjungan_periode' => $noPhoneVisitsInPeriod,
                'open_mabar_dibuat' => 0,
                'open_mabar_diikuti' => 0,
                'kunjungan_terakhir' => $noPhoneLastVisit,
                'is_walkin' => true,
            ]);
        }

        if ($search !== null && trim($search) !== '') {
            $s = mb_strtolower(trim($search));
            $sDigits = preg_replace('/\D+/', '', $s);
            $allRows = $allRows->filter(function ($item) use ($s, $sDigits) {
                $namaMatch = str_contains(mb_strtolower($item['nama']), $s);
                $waMatch = false;
                if ($item['no_whatsapp']) {
                    $waMatch = str_contains(mb_strtolower($item['no_whatsapp']), $s);
                }
                if (! $waMatch && $sDigits !== '' && $item['norm_wa']) {
                    $waMatch = str_contains($item['norm_wa'], $sDigits);
                }
                return $namaMatch || $waMatch;
            });
        }

        return $allRows->sort(function ($a, $b) {
            if ($a['kunjungan_periode'] !== $b['kunjungan_periode']) {
                return $b['kunjungan_periode'] <=> $a['kunjungan_periode'];
            }
            return strcasecmp($a['nama'], $b['nama']);
        })->values();
    }

    public function getPaginatedPemain(string $startDate, string $endDate, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $all = $this->getSemuaPemain($startDate, $endDate, $search);
        $total = $all->count();
        $slice = $all->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator($slice, $total, $perPage, $page, [
            'path' => request()->url(),
            'query' => request()->query(),
        ]);
    }
}
