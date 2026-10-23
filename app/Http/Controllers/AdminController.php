<?php

namespace App\Http\Controllers;

use App\Models\DetailReservasi;
use App\Models\OpenMabar;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\TransaksiPos;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Throwable;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today('Asia/Jakarta');
        $now = Carbon::now('Asia/Jakarta');

        $kpi = [
            'pendapatan_hari_ini' => 0,
            'pendapatan_bulan_ini' => 0,
            'persen_perubahan_bulan' => 0,
            'pendapatan_rental_bulan' => 0,
            'pendapatan_pos_bulan' => 0,
            'reservasi_mendatang' => 0,
            'reservasi_bulan_ini' => 0,
            'open_mabar_menunggu' => 0,
            'rata_rata_transaksi' => 0,
        ];

        $rekapBulanan = [];
        $jadwalHariIni = [];
        $dbConnected = true;

        try {
            DB::connection()->getPdo();

            // Batas rentang bulan berjalan
            $startOfMonth = $now->copy()->startOfMonth();
            $endOfMonth = $now->copy()->endOfMonth();

            // Batas rentang bulan sebelumnya (untuk pembanding % pertumbuhan)
            $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
            $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

            // 1. Pendapatan Bulan Ini (Rental + POS)
            $pendapatanRentalBulan = (float) Pembayaran::where('status_pembayaran', 'terkonfirmasi')
                ->whereBetween('tanggal_pembayaran', [$startOfMonth, $endOfMonth])
                ->sum('jumlah');

            $pendapatanPosBulan = (float) TransaksiPos::where('status_transaksi', 'selesai')
                ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
                ->sum('total');

            $totalPendapatanBulanIni = $pendapatanRentalBulan + $pendapatanPosBulan;

            // 2. Pendapatan Bulan Lalu (Pembanding)
            $pendapatanRentalBulanLalu = (float) Pembayaran::where('status_pembayaran', 'terkonfirmasi')
                ->whereBetween('tanggal_pembayaran', [$startOfLastMonth, $endOfLastMonth])
                ->sum('jumlah');

            $pendapatanPosBulanLalu = (float) TransaksiPos::where('status_transaksi', 'selesai')
                ->whereBetween('tanggal', [$startOfLastMonth, $endOfLastMonth])
                ->sum('total');

            $totalPendapatanBulanLalu = $pendapatanRentalBulanLalu + $pendapatanPosBulanLalu;

            $persenBulan = 0;
            if ($totalPendapatanBulanLalu > 0) {
                $persenBulan = round((($totalPendapatanBulanIni - $totalPendapatanBulanLalu) / $totalPendapatanBulanLalu) * 100, 1);
            } elseif ($totalPendapatanBulanIni > 0) {
                $persenBulan = 100;
            }

            // 3. Pendapatan Hari Ini (tetap disediakan untuk kompatibilitas data)
            $pendapatanRentalHariIni = (float) Pembayaran::where('status_pembayaran', 'terkonfirmasi')
                ->whereDate('tanggal_pembayaran', $today)
                ->sum('jumlah');

            $pendapatanPosHariIni = (float) TransaksiPos::where('status_transaksi', 'selesai')
                ->whereDate('tanggal', $today)
                ->sum('total');

            $kpi['pendapatan_hari_ini'] = $pendapatanRentalHariIni + $pendapatanPosHariIni;
            $kpi['pendapatan_bulan_ini'] = $totalPendapatanBulanIni;
            $kpi['persen_perubahan_bulan'] = $persenBulan;
            $kpi['pendapatan_rental_bulan'] = $pendapatanRentalBulan;
            $kpi['pendapatan_pos_bulan'] = $pendapatanPosBulan;

            // 4. Reservasi aktif & bulan ini
            $kpi['reservasi_mendatang'] = Reservasi::where('status_reservasi', 'terkonfirmasi')
                ->whereHas('detailReservasi', function ($q) use ($today) {
                    $q->whereDate('tanggal_main', '>=', $today);
                })
                ->count();

            $reservasiBulanIni = Reservasi::where('status_reservasi', 'terkonfirmasi')
                ->whereHas('detailReservasi', function ($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('tanggal_main', [$startOfMonth, $endOfMonth]);
                })
                ->count();

            $kpi['reservasi_bulan_ini'] = $reservasiBulanIni;
            $kpi['open_mabar_menunggu'] = OpenMabar::where('status', 'menunggu')->count();
            $kpi['rata_rata_transaksi'] = $reservasiBulanIni > 0 ? round($pendapatanRentalBulan / $reservasiBulanIni) : 0;

            // 5. Rekap 12 Bulan Tahun Ini untuk Bar Chart Minimalis (Jan - Des)
            $currentYear = $now->year;
            $currentMonth = $now->month;
            $namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            for ($m = 1; $m <= 12; $m++) {
                $startM = Carbon::create($currentYear, $m, 1, 0, 0, 0, 'Asia/Jakarta')->startOfMonth();
                $endM = $startM->copy()->endOfMonth();

                $rM = (float) Pembayaran::where('status_pembayaran', 'terkonfirmasi')
                    ->whereBetween('tanggal_pembayaran', [$startM, $endM])
                    ->sum('jumlah');

                $pM = (float) TransaksiPos::where('status_transaksi', 'selesai')
                    ->whereBetween('tanggal', [$startM, $endM])
                    ->sum('total');

                $totalM = $rM + $pM;

                $rekapBulanan[] = [
                    'bulan' => $m,
                    'label' => $namaBulan[$m - 1],
                    'nama_lengkap' => $startM->locale('id')->isoFormat('MMMM Y'),
                    'rental' => $rM,
                    'pos' => $pM,
                    'total' => $totalM,
                    'is_current' => ($m === $currentMonth),
                ];
            }

            // 6. Jadwal Lapangan Hari Ini
            $jadwalHariIni = DetailReservasi::with([
                'lapangan:id_lapangan,nama_lapangan',
                'reservasi:id_reservasi,id_user,nama_pemesan,status_reservasi',
                'reservasi.user:id_user,nama,no_whatsapp',
            ])
                ->whereDate('tanggal_main', $today)
                ->orderBy('jam_mulai', 'asc')
                ->get()
                ->map(function ($item) {
                    $namaTampil = $item->reservasi?->id_user ? ($item->reservasi?->user?->nama ?? 'Pengguna') : ($item->reservasi?->nama_pemesan ?? 'Pengguna');
                    return [
                        'id_detail' => $item->id_detail_reservasi,
                        'nama_lapangan' => $item->lapangan?->nama_lapangan ?? 'Lapangan',
                        'jam_mulai' => substr($item->jam_mulai, 0, 5),
                        'jam_selesai' => substr($item->jam_selesai, 0, 5),
                        'durasi' => $item->durasi,
                        'nama_pemesan' => $namaTampil,
                        'status_reservasi' => $item->reservasi?->status_reservasi ?? 'terkonfirmasi',
                    ];
                })
                ->toArray();
        } catch (Throwable $e) {
            $dbConnected = false;
        }

        return Inertia::render('Admin/Dashboard', [
            'kpi' => $kpi,
            'rekapBulanan' => $rekapBulanan,
            'jadwalHariIni' => $jadwalHariIni,
            'dbConnected' => $dbConnected,
            'tanggalSekarang' => $now->locale('id')->isoFormat('dddd, D MMMM Y'),
            'bulanSekarang' => $now->locale('id')->isoFormat('MMMM Y'),
        ]);
    }
}
