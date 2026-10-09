<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
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
            'kasir_aktif' => 0,
        ];

        $jadwalHariIni = [];
        $aktivitasTerbaru = [];
        $dbConnected = true;

        try {
            // Cek koneksi DB dengan timeout aman
            DB::connection()->getPdo();

            // 1. KPI: Pendapatan Hari Ini = Rental (pembayaran terkonfirmasi hari ini) + POS (penjualan selesai hari ini)
            $pendapatanRental = (float) Pembayaran::where('status_pembayaran', 'terkonfirmasi')
                ->whereDate('tanggal_pembayaran', $today)
                ->sum('jumlah');

            $pendapatanPos = (float) TransaksiPos::where('status_transaksi', 'selesai')
                ->whereDate('tanggal', $today)
                ->sum('total');

            $kpi['pendapatan_hari_ini'] = $pendapatanRental + $pendapatanPos;

            // 2. KPI: Reservasi Mendatang (terkonfirmasi & tanggal main >= hari ini)
            $kpi['reservasi_mendatang'] = Reservasi::where('status_reservasi', 'terkonfirmasi')
                ->whereHas('detailReservasi', function ($q) use ($today) {
                    $q->whereDate('tanggal_main', '>=', $today);
                })
                ->count();

            // 3. KPI: Open Mabar Menunggu Persetujuan
            $kpi['open_mabar_menunggu'] = OpenMabar::where('status', 'menunggu')->count();

            // 4. KPI: Kasir Aktif (role kasir, status_akun aktif)
            $kpi['kasir_aktif'] = User::where('role', 'kasir')
                ->where('status_akun', 'aktif')
                ->count();

            // 5. Tabel Jadwal Lapangan Hari Ini (Lapangan 1 & 2)
            $jadwalHariIni = DetailReservasi::with([
                'lapangan:id_lapangan,nama_lapangan',
                'reservasi:id_reservasi,id_user,status_reservasi',
                'reservasi.user:id_user,nama,no_whatsapp',
            ])
                ->whereDate('tanggal_main', $today)
                ->orderBy('jam_mulai', 'asc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id_detail' => $item->id_detail_reservasi,
                        'nama_lapangan' => $item->lapangan?->nama_lapangan ?? 'Lapangan',
                        'jam_mulai' => substr($item->jam_mulai, 0, 5),
                        'jam_selesai' => substr($item->jam_selesai, 0, 5),
                        'durasi' => $item->durasi,
                        'nama_pemesan' => $item->reservasi?->user?->nama ?? 'Pengguna',
                        'status_reservasi' => $item->reservasi?->status_reservasi ?? 'terkonfirmasi',
                    ];
                })
                ->toArray();

            // 6. Tabel Aktivitas Terbaru (audit_log: limit 8)
            $aktivitasTerbaru = AuditLog::with('user:id_user,nama,role')
                ->orderBy('waktu', 'desc')
                ->limit(8)
                ->get()
                ->map(function ($log) {
                    return [
                        'id_log' => $log->id_log,
                        'waktu' => Carbon::parse($log->waktu)->locale('id')->diffForHumans(),
                        'waktu_lengkap' => Carbon::parse($log->waktu)->format('d/m/Y H:i'),
                        'pengguna' => $log->user?->nama ?? 'Sistem',
                        'role' => $log->user?->role ?? 'admin',
                        'aksi' => $log->aksi,
                        'objek' => $log->objek,
                        'keterangan' => $log->keterangan ?? '-',
                    ];
                })
                ->toArray();
        } catch (Throwable $e) {
            // Jangan memalsukan data jika database mati / tidak terhubung
            $dbConnected = false;
        }

        return Inertia::render('Admin/Dashboard', [
            'kpi' => $kpi,
            'jadwalHariIni' => $jadwalHariIni,
            'aktivitasTerbaru' => $aktivitasTerbaru,
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
