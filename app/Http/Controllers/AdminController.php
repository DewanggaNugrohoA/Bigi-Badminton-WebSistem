<?php

namespace App\Http\Controllers;

use App\Models\DetailReservasi;
use App\Models\OpenMabar;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\TransaksiPos;
use App\Models\User;
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
            'reservasi_mendatang' => 0,
            'open_mabar_menunggu' => 0,
        ];

        $jadwalHariIni = [];
        $dbConnected = true;

        try {
            
            DB::connection()->getPdo();

            
            $pendapatanRental = (float) Pembayaran::where('status_pembayaran', 'terkonfirmasi')
                ->whereDate('tanggal_pembayaran', $today)
                ->sum('jumlah');

            $pendapatanPos = (float) TransaksiPos::where('status_transaksi', 'selesai')
                ->whereDate('tanggal', $today)
                ->sum('total');

            $kpi['pendapatan_hari_ini'] = $pendapatanRental + $pendapatanPos;

            
            $kpi['reservasi_mendatang'] = Reservasi::where('status_reservasi', 'terkonfirmasi')
                ->whereHas('detailReservasi', function ($q) use ($today) {
                    $q->whereDate('tanggal_main', '>=', $today);
                })
                ->count();

            
            $kpi['open_mabar_menunggu'] = OpenMabar::where('status', 'menunggu')->count();

            
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
            'jadwalHariIni' => $jadwalHariIni,
            'dbConnected' => $dbConnected,
            'tanggalSekarang' => $now->locale('id')->isoFormat('dddd, D MMMM Y'),
        ]);
    }

    public function placeholder(Request $request)
    {
        $path = $request->path();
        
        $map = [
            'admin/reservasi' => ['title' => 'Reservasi & Sewa Lapangan', 'group' => 'Operasional'],
            'admin/open-mabar' => ['title' => 'Persetujuan Open Mabar', 'group' => 'Operasional'],
            'admin/member' => ['title' => 'Paket & Data Member', 'group' => 'Operasional'],
            'admin/informasi' => ['title' => 'Informasi & Pengumuman', 'group' => 'Operasional'],
            'admin/produk' => ['title' => 'Produk & Harga POS', 'group' => 'Penjualan'],
            'admin/transaksi-pos' => ['title' => 'Transaksi Kasir POS', 'group' => 'Penjualan'],
            'admin/shift-kasir' => ['title' => 'Shift Kasir', 'group' => 'Penjualan'],
            'admin/void-retur' => ['title' => 'Persetujuan Void & Retur', 'group' => 'Penjualan'],
            'admin/laporan' => ['title' => 'Laporan & Ekspor Excel', 'group' => 'Laporan'],
            'admin/kasir' => ['title' => 'Pengelolaan Akun Kasir', 'group' => 'Pengelolaan'],
            'admin/audit-log' => ['title' => 'Audit Log Aktivitas', 'group' => 'Pengelolaan'],
            'admin/pengaturan' => ['title' => 'Pengaturan Akun Admin', 'group' => 'Pengelolaan'],
        ];

        $info = $map[$path] ?? ['title' => 'Modul Admin', 'group' => 'Pengelolaan'];

        return Inertia::render('Admin/Placeholder', [
            'title' => $info['title'],
            'breadcrumbParent' => $info['group'],
            'description' => "Modul {$info['title']} sedang disiapkan untuk fase berikutnya sesuai spesifikasi sistem Bigi Badminton.",
        ]);
    }
}
