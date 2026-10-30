<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePemeriksaanLapanganRequest;
use App\Models\BiayaOperasional;
use App\Models\DetailReservasi;
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
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
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
            ->leftJoin('reservasi', 'pembayaran.id_reservasi', '=', 'reservasi.id_reservasi')
            ->leftJoin('paket_member', 'pembayaran.id_paket', '=', 'paket_member.id_paket')
            ->where('pembayaran.status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)
            ->where(function ($q) {
                $q->where(function ($qRes) {
                    $qRes->whereNotNull('pembayaran.id_reservasi')
                        ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL);
                })->orWhere(function ($qPkt) {
                    $qPkt->whereNotNull('pembayaran.id_paket')
                        ->where('paket_member.status', '!=', \App\Models\PaketMember::STATUS_DIBATALKAN);
                });
            })
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

        // Kalkulasi Total Biaya Operasional, Pendapatan Kotor, dan Laba Bersih
        $totalBiayaOperasional = (float) BiayaOperasional::query()
            ->whereDate('tanggal_biaya', '>=', $startDate)
            ->whereDate('tanggal_biaya', '<=', $endDate)
            ->sum('jumlah');

        $totalPendapatanKotor = $pendapatanSewaLapangan + $pendapatanPos;
        $labaBersih = $totalPendapatanKotor - $totalBiayaOperasional;

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

        // Rekapitulasi Pemakaian & Pendapatan Sewa per Hari (Tabel Harian Sewa Lapangan)
        $sessionsByDate = DetailReservasi::query()
            ->join('reservasi', 'detail_reservasi.id_reservasi', '=', 'reservasi.id_reservasi')
            ->leftJoin('users', 'reservasi.id_user', '=', 'users.id_user')
            ->whereDate('detail_reservasi.tanggal_main', '>=', $startDate)
            ->whereDate('detail_reservasi.tanggal_main', '<=', $endDate)
            ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL)
            ->selectRaw('
                DATE(detail_reservasi.tanggal_main) as tgl,
                COUNT(detail_reservasi.id_detail_reservasi) as total_sesi,
                SUM(CASE WHEN detail_reservasi.id_lapangan = 1 THEN 1 ELSE 0 END) as sesi_lap1,
                SUM(CASE WHEN detail_reservasi.id_lapangan = 2 THEN 1 ELSE 0 END) as sesi_lap2,
                SUM(CASE WHEN users.jenis_pelanggan = "member" THEN 1 ELSE 0 END) as sesi_member,
                SUM(CASE WHEN users.jenis_pelanggan != "member" OR users.jenis_pelanggan IS NULL THEN 1 ELSE 0 END) as sesi_reguler,
                SUM(detail_reservasi.durasi) as total_menit
            ')
            ->groupBy(DB::raw('DATE(detail_reservasi.tanggal_main)'))
            ->get()
            ->keyBy('tgl');

        $paymentsByDate = Pembayaran::query()
            ->leftJoin('reservasi', 'pembayaran.id_reservasi', '=', 'reservasi.id_reservasi')
            ->leftJoin('paket_member', 'pembayaran.id_paket', '=', 'paket_member.id_paket')
            ->where('pembayaran.status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)
            ->where(function ($q) {
                $q->where(function ($qRes) {
                    $qRes->whereNotNull('pembayaran.id_reservasi')
                        ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL);
                })->orWhere(function ($qPkt) {
                    $qPkt->whereNotNull('pembayaran.id_paket')
                        ->where('paket_member.status', '!=', \App\Models\PaketMember::STATUS_DIBATALKAN);
                });
            })
            ->whereDate('pembayaran.tanggal_pembayaran', '>=', $startDate)
            ->whereDate('pembayaran.tanggal_pembayaran', '<=', $endDate)
            ->selectRaw('
                DATE(pembayaran.tanggal_pembayaran) as tgl,
                COUNT(pembayaran.id_pembayaran) as total_transaksi,
                COALESCE(SUM(CASE WHEN pembayaran.jenis_pembayaran = "DP" THEN pembayaran.jumlah ELSE 0 END), 0) as dp,
                COALESCE(SUM(CASE WHEN pembayaran.jenis_pembayaran = "Lunas" THEN pembayaran.jumlah ELSE 0 END), 0) as lunas,
                COALESCE(SUM(CASE WHEN pembayaran.metode_pembayaran = "tunai" THEN pembayaran.jumlah ELSE 0 END), 0) as tunai,
                COALESCE(SUM(CASE WHEN pembayaran.metode_pembayaran = "transfer" THEN pembayaran.jumlah ELSE 0 END), 0) as transfer,
                COALESCE(SUM(CASE WHEN pembayaran.metode_pembayaran = "qris" THEN pembayaran.jumlah ELSE 0 END), 0) as qris,
                COALESCE(SUM(pembayaran.jumlah), 0) as total
            ')
            ->groupBy(DB::raw('DATE(pembayaran.tanggal_pembayaran)'))
            ->get()
            ->keyBy('tgl');

        $posByDate = TransaksiPos::query()
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
            ->get()
            ->keyBy('tgl');

        $expensesByDate = BiayaOperasional::query()
            ->whereDate('tanggal_biaya', '>=', $startDate)
            ->whereDate('tanggal_biaya', '<=', $endDate)
            ->selectRaw('
                DATE(tanggal_biaya) as tgl,
                COUNT(id_biaya) as total_biaya_items,
                COALESCE(SUM(jumlah), 0) as total
            ')
            ->groupBy(DB::raw('DATE(tanggal_biaya)'))
            ->get()
            ->keyBy('tgl');

        $period = CarbonPeriod::create($startDate, $endDate);
        $dailyList = [];

        foreach ($period as $dt) {
            $dateKey = $dt->format('Y-m-d');
            $sess = $sessionsByDate->get($dateKey);
            $pay = $paymentsByDate->get($dateKey);
            $pos = $posByDate->get($dateKey);
            $exp = $expensesByDate->get($dateKey);

            $totalSesi = (int) ($sess->total_sesi ?? 0);
            $totalMenit = (int) ($sess->total_menit ?? 0);
            $totalJam = $totalMenit > 0 ? round($totalMenit / 60, 1) : 0;
            $totalTransaksi = (int) ($pay->total_transaksi ?? 0);
            $totalUang = (float) ($pay->total ?? 0);
            $pendapatanSewa = $totalUang;
            $pendapatanPosHarian = (float) ($pos->total ?? 0);
            $totalPendapatanHarian = $pendapatanSewa + $pendapatanPosHarian;
            $pengeluaranOperasionalHarian = (float) ($exp->total ?? 0);
            $labaBersihHarian = $totalPendapatanHarian - $pengeluaranOperasionalHarian;

            $dailyList[] = [
                'tgl' => $dateKey,
                'hari' => $dt->locale('id')->isoFormat('dddd'),
                'total_sesi' => $totalSesi,
                'sesi_lap1' => (int) ($sess->sesi_lap1 ?? 0),
                'sesi_lap2' => (int) ($sess->sesi_lap2 ?? 0),
                'sesi_member' => (int) ($sess->sesi_member ?? 0),
                'sesi_reguler' => (int) ($sess->sesi_reguler ?? 0),
                'total_jam' => $totalJam,
                'total_transaksi' => $totalTransaksi,
                'dp' => (float) ($pay->dp ?? 0),
                'lunas' => (float) ($pay->lunas ?? 0),
                'tunai' => (float) ($pay->tunai ?? 0),
                'transfer' => (float) ($pay->transfer ?? 0),
                'qris' => (float) ($pay->qris ?? 0),
                'total' => $totalUang,
                'pendapatan_sewa' => $pendapatanSewa,
                'pendapatan_pos' => $pendapatanPosHarian,
                'total_pendapatan' => $totalPendapatanHarian,
                'pengeluaran_operasional' => $pengeluaranOperasionalHarian,
                'laba_bersih' => $labaBersihHarian,
                'ada_aktivitas' => ($totalPendapatanHarian > 0 || $pengeluaranOperasionalHarian > 0 || $totalSesi > 0),
            ];
        }

        $currentPageHarian = LengthAwarePaginator::resolveCurrentPage('page_sewa_harian');
        $perPageHarian = 35; // Seluruh 31 hari dalam satu bulan tampil utuh tanpa terpotong
        $harianCollection = collect($dailyList);
        $currentPageItemsHarian = $harianCollection->slice(($currentPageHarian - 1) * $perPageHarian, $perPageHarian)->values();
        $sewaHarian = new LengthAwarePaginator(
            $currentPageItemsHarian,
            $harianCollection->count(),
            $perPageHarian,
            $currentPageHarian,
            ['path' => LengthAwarePaginator::resolveCurrentPath(), 'pageName' => 'page_sewa_harian']
        );
        $sewaHarian->appends($request->all());

        // Rincian Lengkap Seluruh Sesi Pemakaian Lapangan & Pemain (Jadwal Main Harian)
        $sesiPemakaianLapangan = DetailReservasi::with([
            'lapangan:id_lapangan,nama_lapangan',
            'reservasi.user:id_user,nama,no_whatsapp,jenis_pelanggan',
            'reservasi.pembayaran:id_pembayaran,id_reservasi,jenis_pembayaran,metode_pembayaran,jumlah,status_pembayaran,keterangan',
        ])
            ->whereDate('tanggal_main', '>=', $startDate)
            ->whereDate('tanggal_main', '<=', $endDate)
            ->whereHas('reservasi', function ($q) {
                $q->where('status_reservasi', '!=', Reservasi::STATUS_BATAL);
            })
            ->orderBy('tanggal_main', 'asc')
            ->orderBy('id_lapangan', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->paginate(50, ['*'], 'page_sesi')
            ->withQueryString();

        $sesiPemakaianLapangan->through(function ($detail) {
            $res = $detail->reservasi;
            $user = $res?->user;
            $namaPemesan = $res?->nama_pemesan ?: ($user?->nama ?: 'Pelanggan');
            $noWa = $res?->no_whatsapp_pemesan ?: ($user?->no_whatsapp ?: '-');
            $isMember = ($user?->jenis_pelanggan === 'member');
            $tipeLabel = $isMember ? 'Member' : 'Reguler';

            $totalBayar = (float) ($res?->pembayaran?->where('status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)->sum('jumlah') ?? 0);
            $totalBiaya = (float) ($res?->total_biaya ?? 0);

            if ($isMember) {
                $statusBayar = 'Paket Member';
            } elseif ($totalBiaya == 0) {
                $statusBayar = 'Free / Gratis';
            } elseif ($totalBayar >= $totalBiaya && $totalBiaya > 0) {
                $statusBayar = 'Lunas';
            } elseif ($totalBayar > 0) {
                $statusBayar = 'DP Rp ' . number_format($totalBayar, 0, ',', '.');
            } else {
                $statusBayar = 'Belum Bayar';
            }

            $firstPayment = $res?->pembayaran?->first();
            $metodeBayar = $firstPayment?->metode_pembayaran ?: '-';
            $catatan = $firstPayment?->keterangan ?: ($res?->catatan ?: '-');

            $jamMulai = substr($detail->jam_mulai, 0, 5);
            $jamSelesai = substr($detail->jam_selesai, 0, 5);
            $durasiJam = $detail->durasi ? round($detail->durasi / 60, 1) : 0;

            return [
                'id_detail' => $detail->id_detail_reservasi,
                'tanggal_main' => Carbon::parse($detail->tanggal_main)->format('Y-m-d'),
                'nama_lapangan' => $detail->lapangan?->nama_lapangan ?: 'Lapangan',
                'jam_mulai' => $jamMulai,
                'jam_selesai' => $jamSelesai,
                'durasi_jam' => $durasiJam,
                'nama_pemain' => $namaPemesan,
                'no_whatsapp' => $noWa,
                'is_member' => $isMember,
                'tipe_label' => $tipeLabel,
                'status_reservasi' => $res?->status_reservasi ?: 'terkonfirmasi',
                'status_bayar' => $statusBayar,
                'total_biaya' => $totalBiaya,
                'sudah_dibayar' => $totalBayar,
                'metode_bayar' => $metodeBayar,
                'catatan' => $catatan,
            ];
        });

        // Rincian Riwayat Transaksi Pembayaran Sewa Lapangan & Paket Member
        $riwayatPembayaranSewa = Pembayaran::with([
            'reservasi.user:id_user,nama,no_whatsapp,jenis_pelanggan',
            'reservasi.detailReservasi.lapangan:id_lapangan,nama_lapangan',
            'paket.user:id_user,nama,no_whatsapp,jenis_pelanggan',
        ])
            ->whereDate('tanggal_pembayaran', '>=', $startDate)
            ->whereDate('tanggal_pembayaran', '<=', $endDate)
            ->orderBy('tanggal_pembayaran', 'asc')
            ->orderBy('id_pembayaran', 'asc')
            ->paginate(50, ['*'], 'page_pembayaran_sewa')
            ->withQueryString();

        $riwayatPembayaranSewa->through(function ($p) {
            $res = $p->reservasi;
            $firstDetail = $res?->detailReservasi?->first();

            $namaPemesan = $res?->nama_pemesan ?: ($res?->user?->nama ?: ($p->paket?->user?->nama ?: 'Pelanggan'));
            $noWa = $res?->no_whatsapp_pemesan ?: ($res?->user?->no_whatsapp ?: ($p->paket?->user?->no_whatsapp ?: '-'));
            $isMember = (bool) ($p->id_paket || ($res && $res->id_user && $res->user && $res->user->jenis_pelanggan === 'member'));

            if ($p->id_paket) {
                $itemLabel = 'Paket Member ' . ($p->paket?->nama_paket_label ?: 'Bulanan');
            } elseif ($firstDetail) {
                $jamMulai = substr($firstDetail->jam_mulai, 0, 5);
                $jamSelesai = substr($firstDetail->jam_selesai, 0, 5);
                $lapNama = $firstDetail->lapangan?->nama_lapangan ?: 'Lapangan';
                $tglMain = Carbon::parse($firstDetail->tanggal_main)->format('d/m/Y');
                $itemLabel = "{$lapNama} ({$tglMain}, {$jamMulai}-{$jamSelesai})";
            } else {
                $itemLabel = 'Sewa Lapangan';
            }

            return [
                'id_pembayaran' => $p->id_pembayaran,
                'id_reservasi' => $p->id_reservasi,
                'id_paket' => $p->id_paket,
                'tanggal_pembayaran' => $p->tanggal_pembayaran ? Carbon::parse($p->tanggal_pembayaran)->format('Y-m-d') : null,
                'nama_pemesan' => $namaPemesan,
                'no_whatsapp' => $noWa,
                'is_member' => $isMember,
                'item_label' => $itemLabel,
                'jenis_pembayaran' => $p->jenis_pembayaran,
                'metode_pembayaran' => $p->metode_pembayaran,
                'jumlah' => (float) $p->jumlah,
                'status_pembayaran' => $p->status_pembayaran,
                'status_reservasi' => $res?->status_reservasi ?: ($p->paket?->status ?: 'terkonfirmasi'),
                'keterangan' => $p->keterangan ?: '-',
            ];
        });

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
                'total_pendapatan_kotor' => $totalPendapatanKotor,
                'total_biaya_operasional' => $totalBiayaOperasional,
                'laba_bersih' => $labaBersih,
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
            'sewaHarian' => $sewaHarian,
            'sesiPemakaianLapangan' => $sesiPemakaianLapangan,
            'riwayatPembayaranSewa' => $riwayatPembayaranSewa,
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

