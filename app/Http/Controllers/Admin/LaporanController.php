<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReturVoid;
use App\Models\TransaksiPos;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->query('start_date', Carbon::now('Asia/Jakarta')->startOfMonth()->format('Y-m-d'));
        $endDate = $request->query('end_date', Carbon::now('Asia/Jakarta')->format('Y-m-d'));

        $transaksiPosQuery = TransaksiPos::query()
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate);

        $pendapatanPos = (float) (clone $transaksiPosQuery)
            ->where('status_transaksi', TransaksiPos::STATUS_SELESAI)
            ->sum('total');

        $returVoidQuery = ReturVoid::with(['transaksiPos', 'pengaju'])
            ->whereDate('retur_void.tanggal', '>=', $startDate)
            ->whereDate('retur_void.tanggal', '<=', $endDate);

        $jumlahVoidRetur = (int) (clone $returVoidQuery)->count();

        $totalNominalVoidRetur = (float) (clone $returVoidQuery)
            ->join('transaksi_pos', 'retur_void.id_transaksi', '=', 'transaksi_pos.id_transaksi')
            ->sum('transaksi_pos.total');

        $riwayatVoidRetur = $returVoidQuery
            ->orderBy('id_retur', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Laporan/Index', [
            'ringkasan' => [
                'pendapatan_pos' => $pendapatanPos,
                'total_nominal_void_retur' => $totalNominalVoidRetur,
                'jumlah_void_retur' => $jumlahVoidRetur,
            ],
            'riwayatVoidRetur' => $riwayatVoidRetur,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
