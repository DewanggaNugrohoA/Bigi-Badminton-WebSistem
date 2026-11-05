<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\DetailTransaksiPos;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\ShiftKasir;
use App\Models\TransaksiPos;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SeedKeuanganNovemberCommand extends Command
{
    protected $signature = 'bigi:seed-keuangan-november {--fresh : Bersihkan data reservasi dan transaksi November sebelum input}';

    protected $description = 'Masukkan data riil keuangan operasional bulan November 2026 sebesar Rp 13.896.000 (13.896 jt)';

    public function handle(): int
    {
        $this->info('=== Memulai Pemasukan Data Keuangan Admin November 2026 (Target: Rp 13.896.000) ===');

        DB::transaction(function () {
            if ($this->option('fresh')) {
                $this->warn('Membersihkan transaksi November sebelumnya...');
                
                // Hapus pembayaran November
                Pembayaran::whereBetween('tanggal_pembayaran', ['2026-11-01', '2026-11-30'])->delete();

                // Hapus detail reservasi & reservasi November
                $resIds = Reservasi::whereBetween('tanggal_pemesanan', ['2026-11-01', '2026-11-30'])->pluck('id_reservasi');
                DetailReservasi::whereIn('id_reservasi', $resIds)->delete();
                Reservasi::whereIn('id_reservasi', $resIds)->delete();

                // Hapus detail transaksi POS & transaksi POS November
                $posIds = TransaksiPos::whereBetween('tanggal', ['2026-11-01 00:00:00', '2026-11-30 23:59:59'])->pluck('id_transaksi');
                DetailTransaksiPos::whereIn('id_transaksi', $posIds)->delete();
                TransaksiPos::whereIn('id_transaksi', $posIds)->delete();
                ShiftKasir::whereBetween('waktu_buka', ['2026-11-01 00:00:00', '2026-11-30 23:59:59'])->delete();

                // Hapus paket member November
                PaketMember::whereBetween('tanggal_mulai', ['2026-11-01', '2026-11-30'])->delete();
            }

            // -------------------------------------------------------------
            // 1. DATA MEMBER & PAKET MEMBER NOVEMBER 2026 (TOTAL: Rp 7.900.000)
            // -------------------------------------------------------------
            $membersData = [
                // 10 Paket Bulanan 4x3 Jam (@ Rp 450.000 = Rp 4.500.000)
                ['nama' => 'PB Didi', 'wa' => '085200000001', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'Perseverance', 'wa' => '085200000002', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'PB Garda XIII', 'wa' => '085200000003', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'Alfa', 'wa' => '085200000004', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'PB Centil', 'wa' => '085200000005', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'Nency', 'wa' => '085200000006', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-02', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'PB My', 'wa' => '085200000007', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-02', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'PB Hammas', 'wa' => '085200000008', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-02', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'Nabila', 'wa' => '085200000009', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-03', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'PB Sumber Sehat', 'wa' => '085200000010', 'paket' => 'bulanan_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 450000, 'tgl' => '2026-11-03', 'metode' => Pembayaran::METODE_TRANSFER],

                // 8 Paket Bulanan 4x2 Jam (@ Rp 350.000 = Rp 2.800.000)
                ['nama' => 'Doddy', 'wa' => '085200000011', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TUNAI],
                ['nama' => 'Guardian Toxic', 'wa' => '085200000012', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'PB Keluarga Ceria', 'wa' => '085200000013', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-02', 'metode' => Pembayaran::METODE_TUNAI],
                ['nama' => 'Novhan', 'wa' => '085200000014', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-02', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'Willy', 'wa' => '085200000015', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-02', 'metode' => Pembayaran::METODE_TUNAI],
                ['nama' => 'PB FA', 'wa' => '085200000016', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-03', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'Anugerah', 'wa' => '085200000017', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-03', 'metode' => Pembayaran::METODE_TUNAI],
                ['nama' => 'Rosa', 'wa' => '085200000018', 'paket' => 'bulanan_4x2', 'sesi' => 4, 'durasi' => 2, 'harga' => 350000, 'tgl' => '2026-11-03', 'metode' => Pembayaran::METODE_TRANSFER],

                // 2 Paket Member Pagi 4x3 Jam (@ Rp 300.000 = Rp 600.000)
                ['nama' => 'Pinksmash Pagi', 'wa' => '085200000019', 'paket' => 'pagi_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 300000, 'tgl' => '2026-11-01', 'metode' => Pembayaran::METODE_TRANSFER],
                ['nama' => 'Komunitas Pagi Ceria', 'wa' => '085200000020', 'paket' => 'pagi_4x3', 'sesi' => 4, 'durasi' => 3, 'harga' => 300000, 'tgl' => '2026-11-02', 'metode' => Pembayaran::METODE_TUNAI],
            ];

            $totalMember = 0;
            $memberUsers = [];

            foreach ($membersData as $m) {
                $user = User::firstOrCreate(
                    ['no_whatsapp' => $m['wa']],
                    [
                        'nama' => $m['nama'],
                        'email' => null,
                        'password' => Hash::make('password123'),
                        'role' => User::ROLE_USER,
                        'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
                        'status_member' => User::STATUS_MEMBER_AKTIF,
                        'status_akun' => User::STATUS_AKUN_AKTIF,
                        'tanggal_mulai_member' => $m['tgl'],
                        'tanggal_akhir_member' => Carbon::parse($m['tgl'])->addMonth()->toDateString(),
                    ]
                );

                $user->update([
                    'nama' => $m['nama'],
                    'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
                    'status_member' => User::STATUS_MEMBER_AKTIF,
                    'tanggal_mulai_member' => $m['tgl'],
                    'tanggal_akhir_member' => Carbon::parse($m['tgl'])->addMonth()->toDateString(),
                ]);

                $paket = PaketMember::create([
                    'id_user' => $user->id_user,
                    'jenis_paket' => $m['paket'],
                    'jumlah_sesi' => $m['sesi'],
                    'durasi_jam_per_sesi' => $m['durasi'],
                    'harga_paket' => $m['harga'],
                    'tanggal_mulai' => $m['tgl'],
                    'tanggal_akhir' => Carbon::parse($m['tgl'])->addMonth()->toDateString(),
                    'status' => PaketMember::STATUS_AKTIF,
                    'catatan' => 'Paket Member November 2026',
                ]);

                Pembayaran::create([
                    'id_reservasi' => null,
                    'id_paket' => $paket->id_paket,
                    'tanggal_pembayaran' => $m['tgl'],
                    'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
                    'jumlah' => $m['harga'],
                    'metode_pembayaran' => $m['metode'],
                    'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
                    'keterangan' => "Pembayaran {$paket->nama_paket_label} ({$user->nama})",
                ]);

                $totalMember += $m['harga'];
                $memberUsers[] = ['user' => $user, 'paket' => $paket];
            }

            $this->info("✓ Member & Paket Member berhasil dibuat: 20 paket, Total Rp " . number_format($totalMember, 0, ',', '.'));

            // Sesi bermain member di jadwal (total_biaya = 0 sesuai aturan bisnis member)
            $memberSessions = [
                ['user' => $memberUsers[0], 'tgl' => '2026-11-01', 'lap' => 1, 'mulai' => '17:00', 'selesai' => '20:00'],
                ['user' => $memberUsers[1], 'tgl' => '2026-11-01', 'lap' => 1, 'mulai' => '20:00', 'selesai' => '23:00'],
                ['user' => $memberUsers[10], 'tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '14:00', 'selesai' => '16:00'],
                ['user' => $memberUsers[18], 'tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '09:00', 'selesai' => '12:00'],
                
                ['user' => $memberUsers[2], 'tgl' => '2026-11-02', 'lap' => 1, 'mulai' => '17:00', 'selesai' => '20:00'],
                ['user' => $memberUsers[3], 'tgl' => '2026-11-02', 'lap' => 1, 'mulai' => '20:00', 'selesai' => '23:00'],
                ['user' => $memberUsers[12], 'tgl' => '2026-11-02', 'lap' => 2, 'mulai' => '14:00', 'selesai' => '16:00'],
                
                ['user' => $memberUsers[4], 'tgl' => '2026-11-03', 'lap' => 1, 'mulai' => '17:00', 'selesai' => '20:00'],
                ['user' => $memberUsers[5], 'tgl' => '2026-11-03', 'lap' => 1, 'mulai' => '20:00', 'selesai' => '23:00'],
                ['user' => $memberUsers[13], 'tgl' => '2026-11-03', 'lap' => 2, 'mulai' => '14:00', 'selesai' => '16:00'],

                ['user' => $memberUsers[6], 'tgl' => '2026-11-04', 'lap' => 1, 'mulai' => '17:00', 'selesai' => '20:00'],
                ['user' => $memberUsers[7], 'tgl' => '2026-11-04', 'lap' => 1, 'mulai' => '20:00', 'selesai' => '23:00'],

                ['user' => $memberUsers[8], 'tgl' => '2026-11-05', 'lap' => 1, 'mulai' => '17:00', 'selesai' => '20:00'],
                ['user' => $memberUsers[9], 'tgl' => '2026-11-05', 'lap' => 1, 'mulai' => '20:00', 'selesai' => '23:00'],
            ];

            foreach ($memberSessions as $ms) {
                $u = $ms['user']['user'];
                $pkt = $ms['user']['paket'];
                $cMulai = Carbon::parse("{$ms['tgl']} {$ms['mulai']}:00");
                $cSelesai = Carbon::parse("{$ms['tgl']} {$ms['selesai']}:00");
                $durasi = (int) $cMulai->diffInMinutes($cSelesai);

                $res = Reservasi::create([
                    'id_user' => $u->id_user,
                    'nama_pemesan' => $u->nama,
                    'no_whatsapp_pemesan' => $u->no_whatsapp,
                    'id_paket' => $pkt->id_paket,
                    'tanggal_pemesanan' => $ms['tgl'],
                    'total_biaya' => 0,
                    'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
                ]);

                DetailReservasi::create([
                    'id_reservasi' => $res->id_reservasi,
                    'id_lapangan' => $ms['lap'],
                    'tanggal_main' => $ms['tgl'],
                    'jam_mulai' => $ms['mulai'] . ':00',
                    'jam_selesai' => $ms['selesai'] . ':00',
                    'durasi' => $durasi,
                    'subtotal' => 0,
                ]);
            }

            // -------------------------------------------------------------
            // 2. DATA SEWA REGULER (1 - 5 NOVEMBER 2026) (TOTAL: Rp 5.100.000)
            // -------------------------------------------------------------
            $regulerData = [
                // 1 November 2026 (Total: Rp 1.160.000)
                ['tgl' => '2026-11-01', 'lap' => 1, 'mulai' => '08:00', 'selesai' => '14:00', 'nama' => 'UKM Olahraga Kampus', 'biaya' => 360000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Acara Turnamen Kampus 6 Jam'],
                ['tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '16:00', 'selesai' => '18:00', 'nama' => 'Bpk. Hendra', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 2 Jam Reguler'],
                ['tgl' => '2026-11-01', 'lap' => 1, 'mulai' => '14:00', 'selesai' => '16:00', 'nama' => 'Tim Reborn', 'biaya' => 100000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 2 Jam Reguler'],
                ['tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '18:00', 'selesai' => '20:00', 'nama' => 'Fajar & Rekan', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Reguler'],
                ['tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '20:00', 'selesai' => '23:00', 'nama' => 'Rian Badminton', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Reguler Malam'],
                ['tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '12:00', 'selesai' => '14:00', 'nama' => 'PB Smash Bengkulu', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 2 Jam Siang'],
                ['tgl' => '2026-11-01', 'lap' => 1, 'mulai' => '16:00', 'selesai' => '17:00', 'nama' => 'Dimas', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Sore'],
                ['tgl' => '2026-11-01', 'lap' => 1, 'mulai' => '23:00', 'selesai' => '24:00', 'nama' => 'PB Kencana', 'biaya' => 60000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '23:00', 'selesai' => '24:00', 'nama' => 'Arif', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-01', 'lap' => 2, 'mulai' => '08:00', 'selesai' => '09:00', 'nama' => 'Doni', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Pagi'],

                // 2 November 2026 (Total: Rp 900.000)
                ['tgl' => '2026-11-02', 'lap' => 1, 'mulai' => '15:00', 'selesai' => '17:00', 'nama' => 'PB Garuda Muda', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 2 Jam Sore'],
                ['tgl' => '2026-11-02', 'lap' => 2, 'mulai' => '16:00', 'selesai' => '18:00', 'nama' => 'Bayu', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Sore'],
                ['tgl' => '2026-11-02', 'lap' => 2, 'mulai' => '18:00', 'selesai' => '20:00', 'nama' => 'Tim Rajawali', 'biaya' => 100000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 2 Jam Malam'],
                ['tgl' => '2026-11-02', 'lap' => 2, 'mulai' => '20:00', 'selesai' => '22:00', 'nama' => 'Yoga', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Malam'],
                ['tgl' => '2026-11-02', 'lap' => 2, 'mulai' => '08:00', 'selesai' => '11:00', 'nama' => 'PB Angkasa', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Pagi'],
                ['tgl' => '2026-11-02', 'lap' => 1, 'mulai' => '12:00', 'selesai' => '15:00', 'nama' => 'Surya', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Siang'],
                ['tgl' => '2026-11-02', 'lap' => 1, 'mulai' => '23:00', 'selesai' => '24:00', 'nama' => 'Ilham', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-02', 'lap' => 2, 'mulai' => '22:00', 'selesai' => '23:00', 'nama' => 'Rio', 'biaya' => 60000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-02', 'lap' => 2, 'mulai' => '23:00', 'selesai' => '24:00', 'nama' => 'Kevin', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Malam'],

                // 3 November 2026 (Total: Rp 960.000)
                ['tgl' => '2026-11-03', 'lap' => 1, 'mulai' => '15:00', 'selesai' => '17:00', 'nama' => 'PB Cendana', 'biaya' => 100000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 2 Jam Sore'],
                ['tgl' => '2026-11-03', 'lap' => 2, 'mulai' => '16:00', 'selesai' => '18:00', 'nama' => 'Sandy', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Sore'],
                ['tgl' => '2026-11-03', 'lap' => 2, 'mulai' => '18:00', 'selesai' => '20:00', 'nama' => 'PB Mahasiswa', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 2 Jam Malam'],
                ['tgl' => '2026-11-03', 'lap' => 2, 'mulai' => '20:00', 'selesai' => '22:00', 'nama' => 'Eko', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Malam'],
                ['tgl' => '2026-11-03', 'lap' => 1, 'mulai' => '12:00', 'selesai' => '15:00', 'nama' => 'PB Bhayangkara', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Siang'],
                ['tgl' => '2026-11-03', 'lap' => 2, 'mulai' => '09:00', 'selesai' => '12:00', 'nama' => 'Wahyu', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Pagi'],
                ['tgl' => '2026-11-03', 'lap' => 1, 'mulai' => '23:00', 'selesai' => '24:00', 'nama' => 'Teguh', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-03', 'lap' => 2, 'mulai' => '22:00', 'selesai' => '23:00', 'nama' => 'Riko', 'biaya' => 60000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-03', 'lap' => 2, 'mulai' => '23:00', 'selesai' => '24:00', 'nama' => 'Dani', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-03', 'lap' => 1, 'mulai' => '08:00', 'selesai' => '09:00', 'nama' => 'Bagas', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Pagi'],

                // 4 November 2026 (Total: Rp 1.000.000)
                ['tgl' => '2026-11-04', 'lap' => 1, 'mulai' => '14:00', 'selesai' => '17:00', 'nama' => 'PB Merpati', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Siang'],
                ['tgl' => '2026-11-04', 'lap' => 2, 'mulai' => '16:00', 'selesai' => '18:00', 'nama' => 'Vicky', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Sore'],
                ['tgl' => '2026-11-04', 'lap' => 2, 'mulai' => '18:00', 'selesai' => '20:00', 'nama' => 'PB Gemilang', 'biaya' => 100000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 2 Jam Malam'],
                ['tgl' => '2026-11-04', 'lap' => 2, 'mulai' => '20:00', 'selesai' => '22:00', 'nama' => 'Andi', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Malam'],
                ['tgl' => '2026-11-04', 'lap' => 1, 'mulai' => '11:00', 'selesai' => '14:00', 'nama' => 'PB Bintang', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Siang'],
                ['tgl' => '2026-11-04', 'lap' => 2, 'mulai' => '09:00', 'selesai' => '12:00', 'nama' => 'PB Cahaya', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Pagi'],
                ['tgl' => '2026-11-04', 'lap' => 2, 'mulai' => '14:00', 'selesai' => '16:00', 'nama' => 'PB Pelita', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 2 Jam Siang'],
                ['tgl' => '2026-11-04', 'lap' => 1, 'mulai' => '23:00', 'selesai' => '24:00', 'nama' => 'Reza', 'biaya' => 60000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 1 Jam Malam'],
                ['tgl' => '2026-11-04', 'lap' => 2, 'mulai' => '22:00', 'selesai' => '23:00', 'nama' => 'Faisal', 'biaya' => 60000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 1 Jam Malam'],

                // 5 November 2026 (Hari ini - Total: Rp 1.080.000)
                ['tgl' => '2026-11-05', 'lap' => 1, 'mulai' => '14:00', 'selesai' => '17:00', 'nama' => 'PB Nusantara', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Sore Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 2, 'mulai' => '16:00', 'selesai' => '18:00', 'nama' => 'Bima', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Sore Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 2, 'mulai' => '18:00', 'selesai' => '20:00', 'nama' => 'PB Mandiri', 'biaya' => 100000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 2 Jam Malam Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 2, 'mulai' => '20:00', 'selesai' => '22:00', 'nama' => 'Taufik', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Malam Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 1, 'mulai' => '11:00', 'selesai' => '14:00', 'nama' => 'PB Raflesia', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Siang Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 2, 'mulai' => '09:00', 'selesai' => '12:00', 'nama' => 'PB Panorama', 'biaya' => 160000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 3 Jam Pagi Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 2, 'mulai' => '12:00', 'selesai' => '14:00', 'nama' => 'PB Sejahtera', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TRANSFER, 'ket' => 'Sewa 2 Jam Siang Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 2, 'mulai' => '14:00', 'selesai' => '16:00', 'nama' => 'Ardi', 'biaya' => 100000, 'metode' => Pembayaran::METODE_QRIS, 'ket' => 'Sewa 2 Jam Siang Hari Ini'],
                ['tgl' => '2026-11-05', 'lap' => 1, 'mulai' => '23:00', 'selesai' => '01:00', 'nama' => 'Yudi', 'biaya' => 100000, 'metode' => Pembayaran::METODE_TUNAI, 'ket' => 'Sewa 2 Jam Malam Hari Ini'],
            ];

            $totalReguler = 0;
            foreach ($regulerData as $r) {
                $cMulai = Carbon::parse("{$r['tgl']} {$r['mulai']}:00");
                $cSelesai = Carbon::parse("{$r['tgl']} {$r['selesai']}:00");
                $durasi = (int) $cMulai->diffInMinutes($cSelesai);

                $res = Reservasi::create([
                    'id_user' => null,
                    'nama_pemesan' => $r['nama'],
                    'no_whatsapp_pemesan' => null,
                    'id_paket' => null,
                    'tanggal_pemesanan' => $r['tgl'],
                    'total_biaya' => $r['biaya'],
                    'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
                ]);

                DetailReservasi::create([
                    'id_reservasi' => $res->id_reservasi,
                    'id_lapangan' => $r['lap'],
                    'tanggal_main' => $r['tgl'],
                    'jam_mulai' => $r['mulai'] . ':00',
                    'jam_selesai' => $r['selesai'] . ':00',
                    'durasi' => $durasi,
                    'subtotal' => $r['biaya'],
                ]);

                Pembayaran::create([
                    'id_reservasi' => $res->id_reservasi,
                    'id_paket' => null,
                    'tanggal_pembayaran' => $r['tgl'],
                    'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
                    'jumlah' => $r['biaya'],
                    'metode_pembayaran' => $r['metode'],
                    'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
                    'keterangan' => "Pembayaran Lunas sewa {$r['nama']}",
                ]);

                $totalReguler += $r['biaya'];
            }

            $this->info("✓ Sewa Reguler berhasil dibuat: " . count($regulerData) . " reservasi, Total Rp " . number_format($totalReguler, 0, ',', '.'));

            // -------------------------------------------------------------
            // 3. TRANSAKSI KASIR POS (1 - 5 NOVEMBER 2026) (TOTAL: Rp 896.000)
            // -------------------------------------------------------------
            // Ambil master produk
            $pAir = Produk::firstOrCreate(['nama_produk' => 'Air Mineral'], ['kategori' => 'Minuman', 'harga' => 5000, 'stok' => 50, 'status_produk' => 'aktif']);
            $pTeh = Produk::firstOrCreate(['nama_produk' => 'Teh Manis'], ['kategori' => 'Minuman', 'harga' => 7000, 'stok' => 30, 'status_produk' => 'aktif']);
            $pIso = Produk::firstOrCreate(['nama_produk' => 'Isotonik'], ['kategori' => 'Minuman', 'harga' => 10000, 'stok' => 20, 'status_produk' => 'aktif']);
            $pMie = Produk::firstOrCreate(['nama_produk' => 'Mie Instan'], ['kategori' => 'Makanan', 'harga' => 12000, 'stok' => 20, 'status_produk' => 'aktif']);
            $pGaruda = Produk::firstOrCreate(['nama_produk' => 'Shuttlecock Garuda'], ['kategori' => 'Perlengkapan', 'harga' => 80000, 'stok' => 20, 'status_produk' => 'aktif']);
            $pYonex = Produk::firstOrCreate(['nama_produk' => 'Shuttlecock Yonex'], ['kategori' => 'Perlengkapan', 'harga' => 120000, 'stok' => 20, 'status_produk' => 'aktif']);

            $posShiftsData = [
                // 1 November 2026 (Total: Rp 175.000)
                [
                    'tgl' => '2026-11-01',
                    'buka' => '2026-11-01 15:00:00',
                    'tutup' => '2026-11-01 23:30:00',
                    'trx' => [
                        [
                            'no' => 'KSR-20261101-0001',
                            'waktu' => '2026-11-01 16:30:00',
                            'metode' => TransaksiPos::METODE_QRIS,
                            'items' => [
                                ['prod' => $pYonex, 'qty' => 1, 'harga' => 120000],
                                ['prod' => $pAir, 'qty' => 1, 'harga' => 5000],
                            ],
                        ],
                        [
                            'no' => 'KSR-20261101-0002',
                            'waktu' => '2026-11-01 19:45:00',
                            'metode' => TransaksiPos::METODE_TUNAI,
                            'items' => [
                                ['prod' => $pMie, 'qty' => 2, 'harga' => 12000],
                                ['prod' => $pTeh, 'qty' => 3, 'harga' => 7000],
                                ['prod' => $pAir, 'qty' => 1, 'harga' => 5000],
                            ],
                        ],
                    ],
                ],
                // 2 November 2026 (Total: Rp 152.000)
                [
                    'tgl' => '2026-11-02',
                    'buka' => '2026-11-02 15:00:00',
                    'tutup' => '2026-11-02 23:30:00',
                    'trx' => [
                        [
                            'no' => 'KSR-20261102-0001',
                            'waktu' => '2026-11-02 17:15:00',
                            'metode' => TransaksiPos::METODE_TUNAI,
                            'items' => [
                                ['prod' => $pGaruda, 'qty' => 1, 'harga' => 80000],
                                ['prod' => $pIso, 'qty' => 1, 'harga' => 10000],
                            ],
                        ],
                        [
                            'no' => 'KSR-20261102-0002',
                            'waktu' => '2026-11-02 20:10:00',
                            'metode' => TransaksiPos::METODE_QRIS,
                            'items' => [
                                ['prod' => $pMie, 'qty' => 3, 'harga' => 12000],
                                ['prod' => $pTeh, 'qty' => 3, 'harga' => 7000],
                                ['prod' => $pAir, 'qty' => 1, 'harga' => 5000],
                            ],
                        ],
                    ],
                ],
                // 3 November 2026 (Total: Rp 255.000)
                [
                    'tgl' => '2026-11-03',
                    'buka' => '2026-11-03 15:00:00',
                    'tutup' => '2026-11-03 23:30:00',
                    'trx' => [
                        [
                            'no' => 'KSR-20261103-0001',
                            'waktu' => '2026-11-03 17:00:00',
                            'metode' => TransaksiPos::METODE_QRIS,
                            'items' => [
                                ['prod' => $pGaruda, 'qty' => 1, 'harga' => 80000],
                                ['prod' => $pYonex, 'qty' => 1, 'harga' => 120000],
                            ],
                        ],
                        [
                            'no' => 'KSR-20261103-0002',
                            'waktu' => '2026-11-03 21:00:00',
                            'metode' => TransaksiPos::METODE_TUNAI,
                            'items' => [
                                ['prod' => $pMie, 'qty' => 2, 'harga' => 12000],
                                ['prod' => $pTeh, 'qty' => 3, 'harga' => 7000],
                                ['prod' => $pAir, 'qty' => 2, 'harga' => 5000],
                            ],
                        ],
                    ],
                ],
                // 4 November 2026 (Total: Rp 140.000)
                [
                    'tgl' => '2026-11-04',
                    'buka' => '2026-11-04 15:00:00',
                    'tutup' => '2026-11-04 23:30:00',
                    'trx' => [
                        [
                            'no' => 'KSR-20261104-0001',
                            'waktu' => '2026-11-04 18:20:00',
                            'metode' => TransaksiPos::METODE_TUNAI,
                            'items' => [
                                ['prod' => $pGaruda, 'qty' => 1, 'harga' => 80000],
                                ['prod' => $pIso, 'qty' => 1, 'harga' => 10000],
                            ],
                        ],
                        [
                            'no' => 'KSR-20261104-0002',
                            'waktu' => '2026-11-04 20:45:00',
                            'metode' => TransaksiPos::METODE_QRIS,
                            'items' => [
                                ['prod' => $pMie, 'qty' => 2, 'harga' => 12000],
                                ['prod' => $pTeh, 'qty' => 3, 'harga' => 7000],
                                ['prod' => $pAir, 'qty' => 1, 'harga' => 5000],
                            ],
                        ],
                    ],
                ],
                // 5 November 2026 (Hari ini - Total: Rp 174.000)
                [
                    'tgl' => '2026-11-05',
                    'buka' => '2026-11-05 14:00:00',
                    'tutup' => '2026-11-05 23:30:00',
                    'trx' => [
                        [
                            'no' => 'KSR-20261105-0001',
                            'waktu' => '2026-11-05 16:15:00',
                            'metode' => TransaksiPos::METODE_QRIS,
                            'items' => [
                                ['prod' => $pGaruda, 'qty' => 1, 'harga' => 80000],
                                ['prod' => $pIso, 'qty' => 2, 'harga' => 10000],
                            ],
                        ],
                        [
                            'no' => 'KSR-20261105-0002',
                            'waktu' => '2026-11-05 19:30:00',
                            'metode' => TransaksiPos::METODE_TUNAI,
                            'items' => [
                                ['prod' => $pMie, 'qty' => 3, 'harga' => 12000],
                                ['prod' => $pTeh, 'qty' => 4, 'harga' => 7000],
                                ['prod' => $pAir, 'qty' => 2, 'harga' => 5000],
                            ],
                        ],
                    ],
                ],
            ];

            $totalPos = 0;
            $kasirUser = User::where('role', User::ROLE_KASIR)->first() ?: User::find(3);

            foreach ($posShiftsData as $s) {
                $shift = ShiftKasir::create([
                    'id_user' => $kasirUser->id_user,
                    'waktu_buka' => $s['buka'],
                    'waktu_tutup' => $s['tutup'],
                    'modal_awal' => 100000,
                    'kas_sistem' => 0, // Akan di-update setelah kalkulasi total tunai
                    'kas_fisik' => 0,
                    'selisih' => 0,
                    'status' => ShiftKasir::STATUS_DITUTUP,
                ]);

                $shiftTotalTunai = 0;

                foreach ($s['trx'] as $t) {
                    $subtotal = 0;
                    foreach ($t['items'] as $item) {
                        $subtotal += ($item['qty'] * $item['harga']);
                    }

                    $totalBayar = $subtotal;
                    $uangDiterima = $t['metode'] === TransaksiPos::METODE_TUNAI ? ceil($totalBayar / 50000) * 50000 : $totalBayar;
                    if ($uangDiterima < $totalBayar) {
                        $uangDiterima = $totalBayar;
                    }
                    $kembalian = $uangDiterima - $totalBayar;

                    if ($t['metode'] === TransaksiPos::METODE_TUNAI) {
                        $shiftTotalTunai += $totalBayar;
                    }

                    $trx = TransaksiPos::create([
                        'id_user' => $kasirUser->id_user,
                        'id_shift' => $shift->id_shift,
                        'no_transaksi' => $t['no'],
                        'tanggal' => $t['waktu'],
                        'subtotal' => $subtotal,
                        'diskon' => 0,
                        'total' => $totalBayar,
                        'metode_bayar' => $t['metode'],
                        'uang_diterima' => $uangDiterima,
                        'kembalian' => $kembalian,
                        'status_transaksi' => TransaksiPos::STATUS_SELESAI,
                        'catatan' => 'Penjualan Kasir POS',
                    ]);

                    foreach ($t['items'] as $item) {
                        $subItem = $item['qty'] * $item['harga'];
                        DetailTransaksiPos::create([
                            'id_transaksi' => $trx->id_transaksi,
                            'id_produk' => $item['prod']->id_produk,
                            'jumlah' => $item['qty'],
                            'harga' => $item['harga'],
                            'subtotal' => $subItem,
                        ]);

                        // Kurangi stok produk
                        $item['prod']->decrement('stok', $item['qty']);
                    }

                    $totalPos += $totalBayar;
                }

                // Update rekonsiliasi kas shift
                $shift->update([
                    'kas_sistem' => 100000 + $shiftTotalTunai,
                    'kas_fisik' => 100000 + $shiftTotalTunai,
                    'selisih' => 0,
                ]);
            }

            $this->info("✓ Transaksi POS berhasil dibuat: 5 shift kasir, Total Rp " . number_format($totalPos, 0, ',', '.'));

            // -------------------------------------------------------------
            // 4. AUDIT LOG & REKAP AKHIR
            // -------------------------------------------------------------
            $grandTotal = $totalMember + $totalReguler + $totalPos;

            AuditLog::create([
                'id_user' => 2, // Admin Bigi
                'aksi' => 'SEED_KEUANGAN_NOVEMBER',
                'objek' => 'Keuangan & Laporan',
                'keterangan' => "Pemasukan data riil keuangan November 2026: Member Rp " . number_format($totalMember, 0, ',', '.') . ", Reguler Rp " . number_format($totalReguler, 0, ',', '.') . ", POS Rp " . number_format($totalPos, 0, ',', '.') . " | Total Rp " . number_format($grandTotal, 0, ',', '.'),
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            $this->info("=================================================");
            $this->info("REKAPITULASI PEMASUKAN DATA KEUANGAN NOVEMBER 2026:");
            $this->line("- Pendapatan Paket Member : Rp " . number_format($totalMember, 0, ',', '.'));
            $this->line("- Pendapatan Sewa Reguler : Rp " . number_format($totalReguler, 0, ',', '.'));
            $this->line("  -> Subtotal Sewa Lapangan: Rp " . number_format($totalMember + $totalReguler, 0, ',', '.'));
            $this->line("- Pendapatan Kasir POS    : Rp " . number_format($totalPos, 0, ',', '.'));
            $this->info("-------------------------------------------------");
            $this->info("TOTAL KEUANGAN DI ADMIN   : Rp " . number_format($grandTotal, 0, ',', '.') . " (13.896 jt)");
            $this->info("=================================================");
        });

        return self::SUCCESS;
    }
}
