<?php

namespace App\Http\Controllers;

use App\Http\Requests\BukaShiftRequest;
use App\Http\Requests\CheckoutPosRequest;
use App\Http\Requests\RestockRequest;
use App\Http\Requests\SimpanProdukRequest;
use App\Http\Requests\StokOpnameRequest;
use App\Http\Requests\TutupShiftRequest;
use App\Http\Requests\VoidReturRequest;
use App\Models\Produk;
use App\Models\Restock;
use App\Models\ReturVoid;
use App\Models\ShiftKasir;
use App\Models\StockOpname;
use App\Models\TransaksiPos;
use App\Services\PosService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KasirController extends Controller
{
    public function __construct(
        protected PosService $posService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user('staff');
        $shiftAktif = $this->posService->getActiveShift($user);

        $produk = Produk::where('status_produk', 'aktif')
            ->orderBy('nama_produk', 'asc')
            ->get();

        $kategoriList = Produk::where('status_produk', 'aktif')
            ->select('kategori')
            ->distinct()
            ->orderBy('kategori', 'asc')
            ->pluck('kategori');

        return Inertia::render('Kasir/Index', [
            'shiftAktif' => $shiftAktif,
            'produk' => $produk,
            'kategoriList' => $kategoriList,
        ]);
    }

    public function shift(Request $request)
    {
        $user = $request->user('staff');
        $shiftAktif = $this->posService->getActiveShift($user);

        $ringkasanShift = null;
        if ($shiftAktif) {
            $transaksiQuery = TransaksiPos::where('id_shift', $shiftAktif->id_shift)
                ->where('status_transaksi', TransaksiPos::STATUS_SELESAI);

            $totalTunai = (float) (clone $transaksiQuery)
                ->where('metode_bayar', TransaksiPos::METODE_TUNAI)
                ->sum('total');

            $totalNonTunai = (float) (clone $transaksiQuery)
                ->where('metode_bayar', TransaksiPos::METODE_QRIS)
                ->sum('total');

            $jumlahTransaksi = (int) (clone $transaksiQuery)->count();
            $expectedCash = (float) $shiftAktif->modal_awal + $totalTunai;

            $ringkasanShift = [
                'total_tunai' => $totalTunai,
                'total_non_tunai' => $totalNonTunai,
                'jumlah_transaksi' => $jumlahTransaksi,
                'expected_cash' => $expectedCash,
            ];
        }

        $riwayatShift = ShiftKasir::where('id_user', $user->id_user)
            ->where('status', ShiftKasir::STATUS_DITUTUP)
            ->orderBy('id_shift', 'desc')
            ->paginate(10);

        return Inertia::render('Kasir/Shift', [
            'shiftAktif' => $shiftAktif,
            'ringkasanShift' => $ringkasanShift,
            'riwayatShift' => $riwayatShift,
        ]);
    }

    public function bukaShift(BukaShiftRequest $request)
    {
        $user = $request->user('staff');
        $this->posService->bukaShift($user, (int) $request->validated('modal_awal'));

        return redirect()->route('kasir.dashboard')->with('success', 'Shift kasir berhasil dibuka.');
    }

    public function tutupShift(TutupShiftRequest $request)
    {
        $user = $request->user('staff');
        $shiftAktif = $this->posService->getActiveShift($user);

        if (! $shiftAktif) {
            return back()->withErrors(['kas_fisik' => 'Tidak ada shift aktif yang dapat ditutup.']);
        }

        $closed = $this->posService->tutupShift($shiftAktif, (int) $request->validated('kas_fisik'), $user);

        return redirect()->route('kasir.shift')->with('success', 'Shift kasir berhasil ditutup dengan selisih Rp ' . number_format($closed->selisih, 0, ',', '.') . '.');
    }

    public function checkout(CheckoutPosRequest $request)
    {
        $user = $request->user('staff');
        $transaksi = $this->posService->prosesPenjualan($user, $request->validated());

        return redirect()->route('kasir.struk', ['id' => $transaksi->id_transaksi])
            ->with('success', 'Transaksi penjualan berhasil disimpan.');
    }

    public function struk(Request $request, int $id)
    {
        $user = $request->user('staff');
        $transaksi = TransaksiPos::with(['detailTransaksiPos.produk', 'user', 'shiftKasir'])
            ->where('id_transaksi', $id)
            ->where('id_user', $user->id_user)
            ->firstOrFail();

        return Inertia::render('Kasir/Struk', [
            'transaksi' => $transaksi,
        ]);
    }

    public function riwayat(Request $request)
    {
        $user = $request->user('staff');
        $tanggalFilter = $request->query('tanggal', Carbon::now('Asia/Jakarta')->format('Y-m-d'));

        $query = TransaksiPos::where('id_user', $user->id_user)
            ->withCount('detailTransaksiPos');

        if ($tanggalFilter) {
            $query->whereDate('tanggal', $tanggalFilter);
        }

        $transaksi = $query->orderBy('id_transaksi', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Kasir/Riwayat', [
            'transaksi' => $transaksi,
            'tanggalFilter' => $tanggalFilter,
        ]);
    }

    public function produkIndex(Request $request)
    {
        $search = $request->query('search', '');
        $kategori = $request->query('kategori', '');
        $status = $request->query('status', '');

        $query = Produk::query();

        if (! empty($search)) {
            $query->where('nama_produk', 'like', "%{$search}%");
        }
        if (! empty($kategori) && $kategori !== 'semua') {
            $query->where('kategori', $kategori);
        }
        if (! empty($status) && $status !== 'semua') {
            $query->where('status_produk', $status);
        }

        $produkList = $query->orderBy('nama_produk', 'asc')->paginate(15)->withQueryString();

        $kategoriList = Produk::select('kategori')
            ->distinct()
            ->orderBy('kategori', 'asc')
            ->pluck('kategori');

        return Inertia::render('Kasir/Produk/Index', [
            'produkList' => $produkList,
            'kategoriList' => $kategoriList,
            'filters' => [
                'search' => $search,
                'kategori' => $kategori,
                'status' => $status,
            ],
        ]);
    }

    public function produkStore(SimpanProdukRequest $request)
    {
        $user = $request->user('staff');
        $this->posService->simpanProduk($user, $request->validated());

        return redirect()->route('kasir.produk.index')->with('success', 'Produk berhasil ditambahkan.');
    }

    public function produkUpdate(SimpanProdukRequest $request, int $id)
    {
        $user = $request->user('staff');
        $this->posService->updateProduk($user, $id, $request->validated());

        return redirect()->route('kasir.produk.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function restockIndex(Request $request)
    {
        $tanggal = $request->query('tanggal', '');

        $query = Restock::with(['produk', 'user']);

        if (! empty($tanggal)) {
            $query->whereDate('tanggal', $tanggal);
        }

        $riwayatRestock = $query->orderBy('id_restock', 'desc')->paginate(15)->withQueryString();

        $produkList = Produk::where('status_produk', 'aktif')
            ->orderBy('nama_produk', 'asc')
            ->get(['id_produk', 'nama_produk', 'stok', 'kategori']);

        return Inertia::render('Kasir/Restock/Index', [
            'riwayatRestock' => $riwayatRestock,
            'produkList' => $produkList,
            'tanggalFilter' => $tanggal,
        ]);
    }

    public function restockStore(RestockRequest $request)
    {
        $user = $request->user('staff');
        $this->posService->prosesRestock($user, $request->validated());

        return redirect()->route('kasir.restock.index')->with('success', 'Restock produk berhasil disimpan.');
    }

    public function opnameIndex(Request $request)
    {
        $tanggal = $request->query('tanggal', '');

        $query = StockOpname::with(['produk', 'user']);

        if (! empty($tanggal)) {
            $query->whereDate('tanggal', $tanggal);
        }

        $riwayatOpname = $query->orderBy('id_opname', 'desc')->paginate(15)->withQueryString();

        $produkList = Produk::where('status_produk', 'aktif')
            ->orderBy('nama_produk', 'asc')
            ->get(['id_produk', 'nama_produk', 'stok', 'kategori']);

        return Inertia::render('Kasir/Opname/Index', [
            'riwayatOpname' => $riwayatOpname,
            'produkList' => $produkList,
            'tanggalFilter' => $tanggal,
        ]);
    }

    public function opnameStore(StokOpnameRequest $request)
    {
        $user = $request->user('staff');
        $this->posService->prosesOpname($user, $request->validated('items'));

        return redirect()->route('kasir.opname.index')->with('success', 'Stock opname berhasil disimpan dan stok produk telah diperbarui.');
    }

    public function voidIndex(Request $request)
    {
        $user = $request->user('staff');
        $shiftAktif = $this->posService->getActiveShift($user);

        $transaksiBisaDibatalkan = [];
        if ($shiftAktif) {
            $transaksiBisaDibatalkan = TransaksiPos::with(['detailTransaksiPos.produk'])
                ->where('id_shift', $shiftAktif->id_shift)
                ->where('id_user', $user->id_user)
                ->where('status_transaksi', TransaksiPos::STATUS_SELESAI)
                ->orderBy('id_transaksi', 'desc')
                ->get();
        }

        $riwayatVoid = ReturVoid::with(['transaksiPos', 'pengaju'])
            ->where('id_user', $user->id_user)
            ->orderBy('id_retur', 'desc')
            ->paginate(15);

        return Inertia::render('Kasir/Void/Index', [
            'shiftAktif' => $shiftAktif,
            'transaksiBisaDibatalkan' => $transaksiBisaDibatalkan,
            'riwayatVoid' => $riwayatVoid,
        ]);
    }

    public function voidStore(VoidReturRequest $request)
    {
        $user = $request->user('staff');
        $this->posService->prosesVoidRetur($user, $request->validated());

        return redirect()->route('kasir.void.index')->with('success', 'Pembatalan transaksi berhasil dicatat dan stok produk telah dikembalikan.');
    }
}
