<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePemeriksaanLapanganRequest;
use App\Models\Lapangan;
use App\Models\Pembayaran;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\Restock;
use App\Models\ReturVoid;
use App\Models\ShiftKasir;
use App\Models\StockOpname;
use App\Models\TransaksiPos;
use App\Models\User;
use App\Services\LaporanEksporService;
use App\Services\LaporanLapanganService;
use App\Services\LaporanPemainService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function index(Request $request, LaporanLapanganService $lapanganService)
    {
        $defaultStart = Carbon::now('Asia/Jakarta')->startOfMonth()->format('Y-m-d');
        $defaultEnd = Carbon::now('Asia/Jakarta')->format('Y-m-d');

        $startDate = $request->query('start_date', $defaultStart);
        $endDate = $request->query('end_date', $defaultEnd);

        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ], [
            'start_date.date' => 'Format tanggal awal tidak valid.',
            'end_date.date' => 'Format tanggal akhir tidak valid.',
            'end_date.after_or_equal' => 'Tanggal akhir harus sama dengan atau setelah tanggal awal.',
        ]);

        $startCarbon = Carbon::parse($startDate);
        $endCarbon = Carbon::parse($endDate);

        if ($startCarbon->diffInDays($endCarbon) > 366) {
            return redirect()->route('admin.laporan', [
                'start_date' => $defaultStart,
                'end_date' => $defaultEnd,
            ])->with('error', 'Rentang tanggal laporan maksimal 366 hari.');
        }

        $transaksiPosQuery = TransaksiPos::query()
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate);

        $posSelesai = (clone $transaksiPosQuery)
            ->where('status_transaksi', TransaksiPos::STATUS_SELESAI)
            ->selectRaw('
                COALESCE(SUM(total), 0) as total_pos,
                COALESCE(SUM(CASE WHEN metode_bayar = "tunai" THEN total ELSE 0 END), 0) as total_tunai,
                COALESCE(SUM(CASE WHEN metode_bayar = "qris" THEN total ELSE 0 END), 0) as total_qris
            ')
            ->first();

        $pendapatanPos = (float) ($posSelesai->total_pos ?? 0);
        $posTunai = (float) ($posSelesai->total_tunai ?? 0);
        $posQris = (float) ($posSelesai->total_qris ?? 0);

        $returVoidQuery = ReturVoid::with(['transaksiPos', 'pengaju'])
            ->whereDate('retur_void.tanggal', '>=', $startDate)
            ->whereDate('retur_void.tanggal', '<=', $endDate);

        $jumlahVoidRetur = (int) (clone $returVoidQuery)->count();

        $totalNominalVoidRetur = (float) (clone $returVoidQuery)
            ->join('transaksi_pos', 'retur_void.id_transaksi', '=', 'transaksi_pos.id_transaksi')
            ->sum('transaksi_pos.total');

        $riwayatVoidRetur = (clone $returVoidQuery)
            ->orderBy('retur_void.id_retur', 'desc')
            ->paginate(10, ['retur_void.*'], 'page_void')
            ->withQueryString();

        $sewaValidAgg = Pembayaran::query()
            ->join('reservasi', 'pembayaran.id_reservasi', '=', 'reservasi.id_reservasi')
            ->where('pembayaran.status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)
            ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL)
            ->whereDate('pembayaran.tanggal_pembayaran', '>=', $startDate)
            ->whereDate('pembayaran.tanggal_pembayaran', '<=', $endDate)
            ->selectRaw('
                COALESCE(SUM(pembayaran.jumlah), 0) as total_sewa,
                COALESCE(SUM(CASE WHEN pembayaran.metode_pembayaran = "transfer" THEN pembayaran.jumlah ELSE 0 END), 0) as transfer,
                COALESCE(SUM(CASE WHEN pembayaran.metode_pembayaran = "tunai" THEN pembayaran.jumlah ELSE 0 END), 0) as tunai,
                COALESCE(SUM(CASE WHEN pembayaran.metode_pembayaran = "qris" THEN pembayaran.jumlah ELSE 0 END), 0) as qris,
                COALESCE(SUM(CASE WHEN pembayaran.jenis_pembayaran = "DP" THEN pembayaran.jumlah ELSE 0 END), 0) as dp,
                COALESCE(SUM(CASE WHEN pembayaran.jenis_pembayaran = "Lunas" THEN pembayaran.jumlah ELSE 0 END), 0) as lunas
            ')
            ->first();

        $pendapatanSewaLapangan = (float) ($sewaValidAgg->total_sewa ?? 0);

        $pembayaranSewaBreakdown = [
            'transfer' => (float) ($sewaValidAgg->transfer ?? 0),
            'tunai' => (float) ($sewaValidAgg->tunai ?? 0),
            'qris' => (float) ($sewaValidAgg->qris ?? 0),
            'dp' => (float) ($sewaValidAgg->dp ?? 0),
            'lunas' => (float) ($sewaValidAgg->lunas ?? 0),
        ];

        $dpReservasiBatal = (float) Pembayaran::query()
            ->join('reservasi', 'pembayaran.id_reservasi', '=', 'reservasi.id_reservasi')
            ->where('pembayaran.status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)
            ->where('reservasi.status_reservasi', Reservasi::STATUS_BATAL)
            ->whereDate('pembayaran.tanggal_pembayaran', '>=', $startDate)
            ->whereDate('pembayaran.tanggal_pembayaran', '<=', $endDate)
            ->sum('pembayaran.jumlah');

        $sisaTagihanBelumLunas = (float) Reservasi::query()
            ->where('status_reservasi', Reservasi::STATUS_TERKONFIRMASI)
            ->whereDate('tanggal_pemesanan', '>=', $startDate)
            ->whereDate('tanggal_pemesanan', '<=', $endDate)
            ->selectRaw('
                COALESCE(SUM(
                    GREATEST(0, total_biaya - COALESCE((
                        SELECT SUM(jumlah) FROM pembayaran 
                        WHERE pembayaran.id_reservasi = reservasi.id_reservasi 
                        AND pembayaran.status_pembayaran = ?
                    ), 0))
                ), 0) as sisa_tagihan
            ', [Pembayaran::STATUS_TERKONFIRMASI])
            ->value('sisa_tagihan');

        $shiftAgg = ShiftKasir::query()
            ->whereDate('waktu_buka', '>=', $startDate)
            ->whereDate('waktu_buka', '<=', $endDate)
            ->selectRaw('COALESCE(SUM(selisih), 0) as total_selisih')
            ->first();

        $totalSelisihKasShift = (float) ($shiftAgg->total_selisih ?? 0);

        $posHarian = TransaksiPos::query()
            ->where('status_transaksi', TransaksiPos::STATUS_SELESAI)
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->selectRaw('
                DATE(tanggal) as tgl,
                COUNT(id_transaksi) as total_transaksi,
                COALESCE(SUM(CASE WHEN metode_bayar = "tunai" THEN total ELSE 0 END), 0) as tunai,
                COALESCE(SUM(CASE WHEN metode_bayar = "qris" THEN total ELSE 0 END), 0) as qris,
                COALESCE(SUM(total), 0) as total
            ')
            ->groupBy(DB::raw('DATE(tanggal)'))
            ->orderBy('tgl', 'desc')
            ->paginate(10, ['*'], 'page_pos')
            ->withQueryString();

        $rekapShift = ShiftKasir::with('user:id_user,nama')
            ->whereDate('waktu_buka', '>=', $startDate)
            ->whereDate('waktu_buka', '<=', $endDate)
            ->orderBy('waktu_buka', 'desc')
            ->paginate(10, ['*'], 'page_shift')
            ->withQueryString();

        $riwayatRestock = Restock::with(['produk:id_produk,nama_produk', 'user:id_user,nama'])
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->orderBy('id_restock', 'desc')
            ->paginate(10, ['*'], 'page_restock')
            ->withQueryString();

        $riwayatOpname = StockOpname::with(['produk:id_produk,nama_produk', 'user:id_user,nama'])
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->orderBy('id_opname', 'desc')
            ->paginate(10, ['*'], 'page_opname')
            ->withQueryString();

        $stokMenipis = Produk::query()
            ->where('status_produk', Produk::STATUS_AKTIF)
            ->whereColumn('stok', '<=', 'stok_minimum')
            ->orderBy('stok', 'asc')
            ->get(['id_produk', 'nama_produk', 'kategori', 'stok', 'stok_minimum']);

        $pemainService = new \App\Services\LaporanPemainService();
        $ringkasanPemain = $pemainService->getRingkasan($startDate, $endDate);
        $searchPemain = $request->query('search_pemain');
        $pagePemain = (int) $request->query('page_pemain', 1);
        $daftarPemain = $pemainService->getPaginatedPemain($startDate, $endDate, $searchPemain, 15, $pagePemain);

        $currentUser = $request->user();
        $isAdmin = $currentUser && $currentUser->role === \App\Models\User::ROLE_ADMIN;

        $daftarPemain->getCollection()->transform(function ($item) use ($isAdmin) {
            if (! $isAdmin) {
                $item['no_whatsapp'] = null;
            }
            return $item;
        });

        // Lapangan Props
        $idLapanganFilter = $request->query('id_lapangan') ? (int) $request->query('id_lapangan') : null;
        $pageLapangan = (int) $request->query('page_lapangan', 1);
        $riwayatLapangan = $lapanganService->getRiwayatPemeriksaan(
            $startDate,
            $endDate,
            $idLapanganFilter,
            10,
            $pageLapangan
        );
        $ringkasanLapangan = $lapanganService->getRingkasanKondisiTerakhir();
        $masterLapangan = Lapangan::orderBy('id_lapangan', 'asc')->get(['id_lapangan', 'nama_lapangan', 'status_lapangan']);

        return Inertia::render('Admin/Laporan/Index', [
            'ringkasan' => [
                'pendapatan_pos' => $pendapatanPos,
                'pos_tunai' => $posTunai,
                'pos_qris' => $posQris,
                'pendapatan_sewa_lapangan' => $pendapatanSewaLapangan,
                'dp_reservasi_batal' => $dpReservasiBatal,
                'sisa_tagihan_belum_lunas' => $sisaTagihanBelumLunas,
                'total_nominal_void_retur' => $totalNominalVoidRetur,
                'jumlah_void_retur' => $jumlahVoidRetur,
                'total_selisih_kas_shift' => $totalSelisihKasShift,
                'pembayaran_sewa_breakdown' => $pembayaranSewaBreakdown,
            ],
            'ringkasanPemain' => $ringkasanPemain,
            'daftarPemain' => $daftarPemain,
            'ringkasanLapangan' => $ringkasanLapangan,
            'riwayatLapangan' => $riwayatLapangan,
            'masterLapangan' => $masterLapangan,
            'posHarian' => $posHarian,
            'rekapShift' => $rekapShift,
            'riwayatVoidRetur' => $riwayatVoidRetur,
            'riwayatRestock' => $riwayatRestock,
            'riwayatOpname' => $riwayatOpname,
            'stokMenipis' => $stokMenipis,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search_pemain' => $searchPemain ?? '',
                'id_lapangan' => $idLapanganFilter ? (string) $idLapanganFilter : '',
            ],
        ]);
    }

    public function storePemeriksaan(StorePemeriksaanLapanganRequest $request, LaporanLapanganService $lapanganService)
    {
        $lapanganService->simpanPemeriksaan($request->validated(), $request->user());

        return redirect()->back()->with('success', 'Catatan pemeriksaan kondisi lapangan berhasil disimpan.');
    }

    public function ekspor(Request $request, LaporanEksporService $eksporService)
    {
        $defaultStart = Carbon::now('Asia/Jakarta')->startOfMonth()->format('Y-m-d');
        $defaultEnd = Carbon::now('Asia/Jakarta')->format('Y-m-d');

        $startDate = $request->query('start_date', $defaultStart);
        $endDate = $request->query('end_date', $defaultEnd);

        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ], [
            'start_date.date' => 'Format tanggal awal tidak valid.',
            'end_date.date' => 'Format tanggal akhir tidak valid.',
            'end_date.after_or_equal' => 'Tanggal akhir harus sama dengan atau setelah tanggal awal.',
        ]);

        $startCarbon = Carbon::parse($startDate);
        $endCarbon = Carbon::parse($endDate);

        if ($startCarbon->diffInDays($endCarbon) > 366) {
            return redirect()->route('admin.laporan', [
                'start_date' => $defaultStart,
                'end_date' => $defaultEnd,
            ])->with('error', 'Rentang tanggal laporan maksimal 366 hari.');
        }

        $idLapangan = $request->query('id_lapangan') ? (int) $request->query('id_lapangan') : null;

        $spreadsheet = $eksporService->generateExcel($startDate, $endDate, $request->user(), $idLapangan);

        $startStr = $startCarbon->format('Ymd');
        $endStr = $endCarbon->format('Ymd');
        $filename = "laporan-keuangan-{$startStr}-{$endStr}.xlsx";

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}

