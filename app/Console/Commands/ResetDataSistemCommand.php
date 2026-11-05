<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\BiayaOperasional;
use App\Models\ChatMabar;
use App\Models\DetailReservasi;
use App\Models\DetailTransaksiPos;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\PemeriksaanLapangan;
use App\Models\PesertaMabar;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\Restock;
use App\Models\ReturVoid;
use App\Models\ShiftKasir;
use App\Models\StockOpname;
use App\Models\TransaksiPos;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDataSistemCommand extends Command
{
    protected $signature = 'bigi:reset-data-sistem {--force : Jalankan pembersihan tanpa konfirmasi}';

    protected $description = 'Bersihkan seluruh data transaksi dan operasional di dalam sistem, kecuali akun utama user, admin, dan kasir';

    public function handle(): int
    {
        $this->warn('=== Pembersihan Total Data Sistem Bigi Badminton ===');

        if (! $this->option('force')) {
            if (! $this->confirm('Apakah Anda yakin ingin menghapus SELURUH data transaksi dan operasional dalam sistem (hanya menyisakan akun utama user, admin, kasir)?')) {
                $this->info('Operasi dibatalkan.');
                return self::FAILURE;
            }
        }

        DB::transaction(function () {
            // 1. Transaksi POS & Kasir
            DetailTransaksiPos::query()->delete();
            ReturVoid::query()->delete();
            TransaksiPos::query()->delete();
            ShiftKasir::query()->delete();
            Restock::query()->delete();
            StockOpname::query()->delete();

            // 2. Reservasi & Sewa Lapangan
            DetailReservasi::query()->delete();
            Pembayaran::query()->delete();
            Reservasi::query()->delete();

            // 3. Member & Paket
            if (Schema::hasTable('penyesuaian_paket')) {
                DB::table('penyesuaian_paket')->delete();
            }
            PaketMember::query()->delete();

            // 4. Open Mabar & Komunitas
            ChatMabar::query()->delete();
            PesertaMabar::query()->delete();
            if (Schema::hasTable('open_mabar')) {
                DB::table('open_mabar')->delete();
            }

            // 5. Biaya Operasional, Pemeriksaan, Laporan, & Audit Log
            BiayaOperasional::query()->delete();
            PemeriksaanLapangan::query()->delete();
            if (Schema::hasTable('laporan_keuangan')) {
                DB::table('laporan_keuangan')->delete();
            }
            if (Schema::hasTable('informasi')) {
                DB::table('informasi')->delete();
            }
            AuditLog::query()->delete();

            // 6. Pengguna: Sisakan akun utama user, admin, dan kasir
            $adminIds = User::where('role', User::ROLE_ADMIN)->pluck('id_user');
            $kasirIds = User::where('role', User::ROLE_KASIR)->pluck('id_user');
            $userIds = User::where('role', User::ROLE_USER)->orderBy('id_user', 'asc')->limit(2)->pluck('id_user');
            $keepIds = $adminIds->merge($kasirIds)->merge($userIds)->unique();

            User::whereNotIn('id_user', $keepIds)->delete();

            // Reset status member & tanggal member pada akun yang dipertahankan
            User::whereIn('id_user', $keepIds)->update([
                'status_member' => User::STATUS_MEMBER_TIDAK_AKTIF,
                'jenis_pelanggan' => User::JENIS_PELANGGAN_REGULER,
                'tanggal_mulai_member' => null,
                'tanggal_akhir_member' => null,
            ]);

            // 7. Reset stok produk master ke standar bersih
            $defaultStock = [
                'Air Mineral' => 50,
                'Teh Manis' => 30,
                'Isotonik' => 20,
                'Mie Instan' => 15,
                'Shuttlecock Yonex' => 10,
                'Shuttlecock Garuda' => 15,
                'Le Mineral' => 30,
                'ayam geprek' => 20,
            ];

            foreach ($defaultStock as $nama => $stok) {
                Produk::where('nama_produk', $nama)->update(['stok' => $stok]);
            }
        });

        $this->info('✓ Seluruh data sistem berhasil dibersihkan total.');
        $this->line('Akun yang dipertahankan:');
        foreach (User::all(['id_user', 'nama', 'email', 'role']) as $u) {
            $this->line("  - [ID {$u->id_user}] {$u->nama} ({$u->role}) " . ($u->email ? "email: {$u->email}" : ''));
        }

        return self::SUCCESS;
    }
}
