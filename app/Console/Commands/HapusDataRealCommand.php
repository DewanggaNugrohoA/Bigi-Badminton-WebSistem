<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class HapusDataRealCommand extends Command
{
    protected $signature = 'bigi:hapus-data-real {--force : Jalankan tanpa konfirmasi}';

    protected $description = 'Hapus seluruh data riil pemakaian lapangan, reservasi, pembayaran sewa, dan akun member hasil impor';

    public function handle(): int
    {
        $countDetail = DetailReservasi::count();
        $countReservasi = Reservasi::count();
        $countBayar = Pembayaran::whereNotNull('id_reservasi')->orWhereNotNull('id_paket')->count();
        $countPaket = PaketMember::count();
        $countMemberUser = User::where('role', User::ROLE_USER)->where('id_user', '>', 4)->count();

        $this->info('=== Ringkasan Data yang Akan Dihapus ===');
        $this->line("- Detail Sesi Bermain : {$countDetail} baris");
        $this->line("- Reservasi Lapangan  : {$countReservasi} baris");
        $this->line("- Transaksi Pembayaran: {$countBayar} baris");
        $this->line("- Paket Member        : {$countPaket} baris");
        $this->line("- Akun Member Impor   : {$countMemberUser} akun");

        if (! $this->option('force')) {
            if (! $this->confirm('Apakah Anda yakin ingin menghapus seluruh data riil tersebut dari sistem?')) {
                $this->warn('Operasi pembatalan penghapusan data.');
                return self::FAILURE;
            }
        }

        DB::transaction(function () use ($countDetail, $countReservasi, $countBayar, $countPaket, $countMemberUser) {
            DetailReservasi::query()->delete();
            Pembayaran::whereNotNull('id_reservasi')->orWhereNotNull('id_paket')->delete();
            Reservasi::query()->delete();
            PaketMember::query()->delete();
            User::where('role', User::ROLE_USER)->where('id_user', '>', 4)->delete();
            AuditLog::where('aksi', 'IMPORT_JADWAL_REAL')->delete();

            // Catat log penghapusan data riil
            AuditLog::create([
                'id_user' => 2, // Admin Bigi
                'aksi' => 'HAPUS_DATA_REAL',
                'objek' => 'Reservasi & Member',
                'keterangan' => "Pembersihan total data riil: {$countReservasi} reservasi, {$countDetail} sesi lapangan, {$countBayar} pembayaran sewa, {$countPaket} paket member, dan {$countMemberUser} akun member.",
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);
        });

        $this->info('✓ Seluruh data riil pemakaian lapangan dan member berhasil dihapus bersih dari sistem.');
        return self::SUCCESS;
    }
}
