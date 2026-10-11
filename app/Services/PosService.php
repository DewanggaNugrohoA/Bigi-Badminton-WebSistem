<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\DetailTransaksiPos;
use App\Models\Produk;
use App\Models\Restock;
use App\Models\ReturVoid;
use App\Models\ShiftKasir;
use App\Models\StockOpname;
use App\Models\TransaksiPos;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PosService
{
    public function getActiveShift(User $user): ?ShiftKasir
    {
        return ShiftKasir::where('id_user', $user->id_user)
            ->where('status', ShiftKasir::STATUS_TERBUKA)
            ->first();
    }

    public function bukaShift(User $user, int $modalAwal): ShiftKasir
    {
        return DB::transaction(function () use ($user, $modalAwal) {
            $existing = ShiftKasir::where('id_user', $user->id_user)
                ->where('status', ShiftKasir::STATUS_TERBUKA)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'modal_awal' => 'Anda masih memiliki shift yang sedang aktif.',
                ]);
            }

            $shift = ShiftKasir::create([
                'id_user' => $user->id_user,
                'waktu_buka' => Carbon::now('Asia/Jakarta'),
                'modal_awal' => $modalAwal,
                'status' => ShiftKasir::STATUS_TERBUKA,
            ]);

            AuditLog::create([
                'id_user' => $user->id_user,
                'aksi' => 'BUKA_SHIFT',
                'objek' => 'shift_kasir',
                'keterangan' => 'Membuka shift kasir dengan kas awal Rp ' . number_format($modalAwal, 0, ',', '.'),
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            return $shift;
        });
    }

    public function tutupShift(ShiftKasir $shift, int $kasFisik, User $user): ShiftKasir
    {
        return DB::transaction(function () use ($shift, $kasFisik, $user) {
            $shiftLocked = ShiftKasir::where('id_shift', $shift->id_shift)
                ->lockForUpdate()
                ->firstOrFail();

            if ($shiftLocked->id_user !== $user->id_user) {
                throw ValidationException::withMessages([
                    'kas_fisik' => 'Anda tidak berhak menutup shift kasir lain.',
                ]);
            }

            if ($shiftLocked->status === ShiftKasir::STATUS_DITUTUP) {
                throw ValidationException::withMessages([
                    'kas_fisik' => 'Shift ini sudah ditutup.',
                ]);
            }

            $totalTunai = TransaksiPos::where('id_shift', $shiftLocked->id_shift)
                ->where('status_transaksi', TransaksiPos::STATUS_SELESAI)
                ->where('metode_bayar', TransaksiPos::METODE_TUNAI)
                ->sum('total');

            $expectedCash = (float) $shiftLocked->modal_awal + (float) $totalTunai;
            $selisih = (float) $kasFisik - $expectedCash;

            $shiftLocked->update([
                'waktu_tutup' => Carbon::now('Asia/Jakarta'),
                'kas_sistem' => $expectedCash,
                'kas_fisik' => $kasFisik,
                'selisih' => $selisih,
                'status' => ShiftKasir::STATUS_DITUTUP,
            ]);

            AuditLog::create([
                'id_user' => $user->id_user,
                'aksi' => 'TUTUP_SHIFT',
                'objek' => 'shift_kasir',
                'keterangan' => 'Menutup shift #' . $shiftLocked->id_shift . ' dengan kas fisik Rp ' . number_format($kasFisik, 0, ',', '.') . ', sistem Rp ' . number_format($expectedCash, 0, ',', '.') . ', selisih Rp ' . number_format($selisih, 0, ',', '.'),
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            return $shiftLocked;
        });
    }

    public function prosesPenjualan(User $user, array $data): TransaksiPos
    {
        return DB::transaction(function () use ($user, $data) {
            $shift = ShiftKasir::where('id_user', $user->id_user)
                ->where('status', ShiftKasir::STATUS_TERBUKA)
                ->lockForUpdate()
                ->first();

            if (! $shift) {
                throw ValidationException::withMessages([
                    'shift' => 'Anda belum membuka shift kasir.',
                ]);
            }

            $items = $data['items'] ?? [];
            if (empty($items)) {
                throw ValidationException::withMessages([
                    'items' => 'Keranjang penjualan tidak boleh kosong.',
                ]);
            }

            $productIds = array_column($items, 'id_produk');
            $products = Produk::whereIn('id_produk', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id_produk');

            $calculatedSubtotal = 0;
            $lineSnapshots = [];

            foreach ($items as $item) {
                $idProduk = (int) $item['id_produk'];
                $qty = (int) $item['jumlah'];

                if ($qty < 1) {
                    throw ValidationException::withMessages([
                        'items' => 'Jumlah produk harus minimal 1.',
                    ]);
                }

                $produk = $products->get($idProduk);
                if (! $produk) {
                    throw ValidationException::withMessages([
                        'items' => 'Produk tidak ditemukan.',
                    ]);
                }

                if ($produk->status_produk !== 'aktif') {
                    throw ValidationException::withMessages([
                        'items' => 'Produk ' . $produk->nama_produk . ' sedang nonaktif.',
                    ]);
                }

                if ($produk->stok < $qty) {
                    throw ValidationException::withMessages([
                        'items' => 'Stok produk ' . $produk->nama_produk . ' tidak mencukupi (sisa: ' . $produk->stok . ').',
                    ]);
                }

                $dbHarga = (float) $produk->harga;
                $lineSubtotal = $dbHarga * $qty;
                $calculatedSubtotal += $lineSubtotal;

                $lineSnapshots[] = [
                    'produk' => $produk,
                    'jumlah' => $qty,
                    'harga' => $dbHarga,
                    'subtotal' => $lineSubtotal,
                ];
            }

            $diskon = 0;
            $total = $calculatedSubtotal - $diskon;
            $metodeBayar = $data['metode_bayar'];

            $uangDiterima = null;
            $kembalian = null;

            if ($metodeBayar === TransaksiPos::METODE_TUNAI) {
                $uangDiterima = isset($data['uang_diterima']) ? (float) $data['uang_diterima'] : 0;
                if ($uangDiterima < $total) {
                    throw ValidationException::withMessages([
                        'uang_diterima' => 'Uang diterima kurang dari total pembayaran.',
                    ]);
                }
                $kembalian = $uangDiterima - $total;
            }

            $noTransaksi = $this->generateNoTransaksi();

            $transaksi = TransaksiPos::create([
                'id_user' => $user->id_user,
                'id_shift' => $shift->id_shift,
                'no_transaksi' => $noTransaksi,
                'tanggal' => Carbon::now('Asia/Jakarta'),
                'subtotal' => $calculatedSubtotal,
                'diskon' => $diskon,
                'total' => $total,
                'metode_bayar' => $metodeBayar,
                'uang_diterima' => $uangDiterima,
                'kembalian' => $kembalian,
                'status_transaksi' => TransaksiPos::STATUS_SELESAI,
                'catatan' => $data['catatan'] ?? null,
            ]);

            foreach ($lineSnapshots as $line) {
                DetailTransaksiPos::create([
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_produk' => $line['produk']->id_produk,
                    'jumlah' => $line['jumlah'],
                    'harga' => $line['harga'],
                    'subtotal' => $line['subtotal'],
                ]);

                $line['produk']->decrement('stok', $line['jumlah']);
            }

            AuditLog::create([
                'id_user' => $user->id_user,
                'aksi' => 'PENJUALAN_POS',
                'objek' => 'transaksi_pos',
                'keterangan' => 'Transaksi ' . $noTransaksi . ' senilai Rp ' . number_format($total, 0, ',', '.') . ' (' . strtoupper($metodeBayar) . ')',
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            return $transaksi;
        });
    }

    public function simpanProduk(User $user, array $data): Produk
    {
        return DB::transaction(function () use ($user, $data) {
            $produk = Produk::create([
                'nama_produk' => trim($data['nama_produk']),
                'kategori' => trim($data['kategori']),
                'harga' => (int) $data['harga'],
                'stok' => 0,
                'stok_minimum' => (int) $data['stok_minimum'],
                'status_produk' => $data['status_produk'],
            ]);

            AuditLog::create([
                'id_user' => $user->id_user,
                'aksi' => 'TAMBAH_PRODUK',
                'objek' => 'produk',
                'keterangan' => "Menambahkan produk baru: {$produk->nama_produk} (Harga: Rp " . number_format($produk->harga, 0, ',', '.') . ")",
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            return $produk;
        });
    }

    public function updateProduk(User $user, int $idProduk, array $data): Produk
    {
        return DB::transaction(function () use ($user, $idProduk, $data) {
            $produk = Produk::where('id_produk', $idProduk)
                ->lockForUpdate()
                ->firstOrFail();

            $oldStatus = $produk->status_produk;
            $oldHarga = (float) $produk->harga;

            $produk->update([
                'nama_produk' => trim($data['nama_produk']),
                'kategori' => trim($data['kategori']),
                'harga' => (int) $data['harga'],
                'stok_minimum' => (int) $data['stok_minimum'],
                'status_produk' => $data['status_produk'],
            ]);

            $keterangan = "Memperbarui produk #{$produk->id_produk}: {$produk->nama_produk}";
            if ($oldStatus !== $produk->status_produk) {
                $keterangan .= " (Status: {$oldStatus} -> {$produk->status_produk})";
            }
            if ($oldHarga != (float) $produk->harga) {
                $keterangan .= " (Harga: Rp " . number_format($oldHarga, 0, ',', '.') . " -> Rp " . number_format($produk->harga, 0, ',', '.') . ")";
            }

            AuditLog::create([
                'id_user' => $user->id_user,
                'aksi' => 'UPDATE_PRODUK',
                'objek' => 'produk',
                'keterangan' => $keterangan,
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            return $produk;
        });
    }

    public function prosesRestock(User $user, array $data): Restock
    {
        return DB::transaction(function () use ($user, $data) {
            $idProduk = (int) $data['id_produk'];
            $jumlah = (int) $data['jumlah'];

            $produk = Produk::where('id_produk', $idProduk)
                ->lockForUpdate()
                ->firstOrFail();

            $produk->increment('stok', $jumlah);

            $restock = Restock::create([
                'id_produk' => $produk->id_produk,
                'id_user' => $user->id_user,
                'jumlah' => $jumlah,
                'tanggal' => $data['tanggal'],
                'keterangan' => $data['keterangan'] ?? null,
            ]);

            AuditLog::create([
                'id_user' => $user->id_user,
                'aksi' => 'RESTOCK_PRODUK',
                'objek' => 'restock',
                'keterangan' => "Restock {$jumlah} unit produk {$produk->nama_produk} (Stok akhir: {$produk->stok})",
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            return $restock;
        });
    }

    public function prosesOpname(User $user, array $items): void
    {
        DB::transaction(function () use ($user, $items) {
            foreach ($items as $item) {
                $idProduk = (int) $item['id_produk'];
                $stokFisik = (int) $item['stok_fisik'];
                $keterangan = $item['keterangan'] ?? null;

                $produk = Produk::where('id_produk', $idProduk)
                    ->lockForUpdate()
                    ->firstOrFail();

                $stokSistem = (int) $produk->stok;
                $selisih = $stokFisik - $stokSistem;

                if ($selisih !== 0 && empty(trim($keterangan ?? ''))) {
                    throw ValidationException::withMessages([
                        'items' => "Keterangan wajib diisi ketika ada selisih stok untuk produk {$produk->nama_produk}.",
                    ]);
                }

                StockOpname::create([
                    'id_produk' => $produk->id_produk,
                    'id_user' => $user->id_user,
                    'stok_sistem' => $stokSistem,
                    'stok_fisik' => $stokFisik,
                    'selisih' => $selisih,
                    'tanggal' => Carbon::now('Asia/Jakarta')->format('Y-m-d'),
                    'keterangan' => $keterangan,
                ]);

                $produk->update(['stok' => $stokFisik]);

                AuditLog::create([
                    'id_user' => $user->id_user,
                    'aksi' => 'STOCK_OPNAME',
                    'objek' => 'stock_opname',
                    'keterangan' => "Stock opname produk {$produk->nama_produk}: Sistem {$stokSistem}, Fisik {$stokFisik}, Selisih {$selisih}",
                    'waktu' => Carbon::now('Asia/Jakarta'),
                ]);
            }
        });
    }

    public function prosesVoidRetur(User $user, array $data): ReturVoid
    {
        return DB::transaction(function () use ($user, $data) {
            $shift = ShiftKasir::where('id_user', $user->id_user)
                ->where('status', ShiftKasir::STATUS_TERBUKA)
                ->lockForUpdate()
                ->first();

            if (! $shift) {
                throw ValidationException::withMessages([
                    'id_transaksi' => 'Anda tidak memiliki shift yang sedang aktif.',
                ]);
            }

            $idTransaksi = (int) $data['id_transaksi'];
            $jenis = $data['jenis'];
            $alasan = trim($data['alasan']);

            $transaksi = TransaksiPos::where('id_transaksi', $idTransaksi)
                ->lockForUpdate()
                ->firstOrFail();

            if ($transaksi->id_user !== $user->id_user) {
                throw ValidationException::withMessages([
                    'id_transaksi' => 'Transaksi ini bukan milik kasir Anda.',
                ]);
            }

            if ($transaksi->id_shift !== $shift->id_shift) {
                throw ValidationException::withMessages([
                    'id_transaksi' => 'Transaksi ini tidak termasuk dalam shift aktif Anda saat ini.',
                ]);
            }

            if ($transaksi->status_transaksi !== TransaksiPos::STATUS_SELESAI) {
                throw ValidationException::withMessages([
                    'id_transaksi' => 'Hanya transaksi berstatus selesai yang dapat dibatalkan.',
                ]);
            }

            $existingRetur = ReturVoid::where('id_transaksi', $transaksi->id_transaksi)
                ->lockForUpdate()
                ->first();

            if ($existingRetur) {
                throw ValidationException::withMessages([
                    'id_transaksi' => 'Transaksi ini sudah pernah diajukan void/retur sebelumnya.',
                ]);
            }

            $details = DetailTransaksiPos::where('id_transaksi', $transaksi->id_transaksi)->get();
            $productIds = $details->pluck('id_produk')->toArray();

            $products = Produk::whereIn('id_produk', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id_produk');

            foreach ($details as $detail) {
                $prod = $products->get($detail->id_produk);
                if ($prod) {
                    $prod->increment('stok', $detail->jumlah);
                }
            }

            $transaksi->update([
                'status_transaksi' => $jenis === ReturVoid::JENIS_VOID ? TransaksiPos::STATUS_VOID : TransaksiPos::STATUS_RETUR,
            ]);

            $returVoid = ReturVoid::create([
                'id_transaksi' => $transaksi->id_transaksi,
                'id_user' => $user->id_user,
                'id_admin' => null,
                'jenis' => $jenis,
                'alasan' => $alasan,
                'status' => ReturVoid::STATUS_DISETUJUI,
                'tanggal' => Carbon::now('Asia/Jakarta'),
            ]);

            AuditLog::create([
                'id_user' => $user->id_user,
                'aksi' => strtoupper($jenis) . '_TRANSAKSI',
                'objek' => 'retur_void',
                'keterangan' => ucfirst($jenis) . " transaksi {$transaksi->no_transaksi} dicatat oleh kasir: {$alasan}",
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            return $returVoid;
        });
    }

    protected function generateNoTransaksi(): string
    {
        $today = Carbon::now('Asia/Jakarta')->format('Ymd');
        $prefix = 'KSR-' . $today . '-';

        $lastTransaksi = TransaksiPos::where('no_transaksi', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('id_transaksi', 'desc')
            ->first();

        $nextSeq = 1;
        if ($lastTransaksi) {
            $parts = explode('-', $lastTransaksi->no_transaksi);
            if (isset($parts[2])) {
                $nextSeq = ((int) $parts[2]) + 1;
            }
        }

        return $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
