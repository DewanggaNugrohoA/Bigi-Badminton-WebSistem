<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use App\Services\ReservasiService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ImportJadwalRealCommand extends Command
{
    protected $signature = 'bigi:import-jadwal-real {--fresh : Bersihkan data reservasi dan paket member sebelum impor}';

    protected $description = 'Impor data jadwal riil pemakaian lapangan Bigi Badminton (28 Sep - 1 Nov 2026)';

    public function handle(): int
    {
        $jsonPath = database_path('data/jadwal_real_bigi.json');
        if (! file_exists($jsonPath)) {
            $this->error("Berkas data tidak ditemukan: {$jsonPath}");
            return self::FAILURE;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        if (! $data || empty($data['jadwal'])) {
            $this->error('Format berkas JSON tidak valid atau data jadwal kosong.');
            return self::FAILURE;
        }

        $this->info('=== Mulai Pengimporan Data Riil Bigi Badminton (28 Sep - 1 Nov 2026) ===');

        DB::transaction(function () use ($data) {
            if ($this->option('fresh')) {
                $this->warn('Membersihkan data reservasi, pembayaran, dan paket member lama...');
                DetailReservasi::query()->delete();
                Pembayaran::whereNotNull('id_reservasi')->orWhereNotNull('id_paket')->delete();
                Reservasi::query()->delete();
                PaketMember::query()->delete();
                // Hapus user member yang dibuat sebelumnya (sisakan user id 1 s/d 4)
                User::where('role', User::ROLE_USER)
                    ->where('id_user', '>', 4)
                    ->delete();
            }

            // 1. Buat / Dapatkan Member & Paket Member
            $memberMap = []; // nama_lower => ['user' => User, 'paket' => PaketMember]
            foreach ($data['members'] as $m) {
                $user = User::firstOrCreate(
                    ['no_whatsapp' => $m['no_whatsapp']],
                    [
                        'nama' => $m['nama'],
                        'email' => null,
                        'password' => Hash::make('password123'),
                        'role' => User::ROLE_USER,
                        'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
                        'status_member' => User::STATUS_MEMBER_AKTIF,
                        'status_akun' => User::STATUS_AKUN_AKTIF,
                        'tanggal_mulai_member' => $m['tanggal_mulai'],
                        'tanggal_akhir_member' => $m['tanggal_akhir'],
                    ]
                );

                // Pastikan status member aktif
                $user->update([
                    'nama' => $m['nama'],
                    'jenis_pelanggan' => User::JENIS_PELANGGAN_MEMBER,
                    'status_member' => User::STATUS_MEMBER_AKTIF,
                    'tanggal_mulai_member' => $m['tanggal_mulai'],
                    'tanggal_akhir_member' => $m['tanggal_akhir'],
                ]);

                // Paket member
                $paket = PaketMember::firstOrCreate(
                    [
                        'id_user' => $user->id_user,
                        'jenis_paket' => $m['jenis_paket'],
                    ],
                    [
                        'jumlah_sesi' => $m['jumlah_sesi'],
                        'durasi_jam_per_sesi' => $m['durasi_jam'],
                        'harga_paket' => $m['harga_paket'],
                        'tanggal_mulai' => $m['tanggal_mulai'],
                        'tanggal_akhir' => $m['tanggal_akhir'],
                        'status' => PaketMember::STATUS_AKTIF,
                        'catatan' => 'Paket Member Riil Operasional',
                    ]
                );

                // Catat pembayaran paket di awal satu kali jika belum ada
                Pembayaran::firstOrCreate(
                    [
                        'id_paket' => $paket->id_paket,
                    ],
                    [
                        'id_reservasi' => null,
                        'tanggal_pembayaran' => $m['tanggal_mulai'],
                        'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
                        'jumlah' => $m['harga_paket'],
                        'metode_pembayaran' => Pembayaran::METODE_TRANSFER,
                        'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
                        'keterangan' => "Pembayaran Paket {$paket->nama_paket_label} ({$user->nama})",
                    ]
                );

                // Simpan alias normalisasi nama member
                $aliasKeys = [
                    strtolower(trim($m['nama'])),
                    strtolower(str_replace('pb ', '', trim($m['nama']))),
                    strtolower(str_replace('pb', '', trim($m['nama']))),
                ];

                foreach ($aliasKeys as $k) {
                    $memberMap[$k] = ['user' => $user, 'paket' => $paket];
                }
            }

            // Tambahkan alias khusus
            if (isset($memberMap['guardian toxic'])) {
                $memberMap['guardian'] = $memberMap['guardian toxic'];
            }
            if (isset($memberMap['pb sumber sehat'])) {
                $memberMap['pb sumber'] = $memberMap['pb sumber sehat'];
                $memberMap['sumber'] = $memberMap['pb sumber sehat'];
                $memberMap['sumber sehat'] = $memberMap['pb sumber sehat'];
            }
            if (isset($memberMap['pb keluarga ceria'])) {
                $memberMap['pb klrg ceria'] = $memberMap['pb keluarga ceria'];
                $memberMap['klrg ceria'] = $memberMap['pb keluarga ceria'];
            }

            $countReservasi = 0;
            $countMemberSesi = 0;
            $countReguler = 0;
            $countBatal = 0;

            // 2. Loop & Masukkan Jadwal
            foreach ($data['jadwal'] as $j) {
                $tgl = $j['tanggal'];
                $idLap = (int) $j['lapangan'];
                $jamMulai = $j['jam_mulai'] . ':00';
                $jamSelesai = $j['jam_selesai'] . ':00';
                $nama = trim($j['nama']);
                $tipe = strtoupper(trim($j['tipe']));
                $catatan = trim($j['catatan'] ?? '');

                $cMulai = Carbon::parse("{$tgl} {$jamMulai}");
                $cSelesai = Carbon::parse("{$tgl} {$jamSelesai}");
                $durasiMenit = (int) $cMulai->diffInMinutes($cSelesai);
                $tarifStandar = ReservasiService::hitungTarifReservasi($durasiMenit);

                $isBatal = str_contains($catatan, '❌');

                if ($tipe === 'M') {
                    // Cari member
                    $cleanName = strtolower(trim($nama));
                    $cleanNameNoPb = strtolower(trim(str_replace(['pb ', 'pb-'], '', $cleanName)));
                    $memberData = $memberMap[$cleanName] ?? ($memberMap[$cleanNameNoPb] ?? null);

                    $idUser = $memberData ? $memberData['user']->id_user : null;
                    $idPaket = $memberData ? $memberData['paket']->id_paket : null;

                    $statusRes = $isBatal ? Reservasi::STATUS_BATAL : Reservasi::STATUS_TERKONFIRMASI;

                    $reservasi = Reservasi::create([
                        'id_user' => $idUser,
                        'nama_pemesan' => $nama,
                        'no_whatsapp_pemesan' => $memberData ? $memberData['user']->no_whatsapp : null,
                        'id_paket' => $idPaket,
                        'tanggal_pemesanan' => $tgl,
                        'total_biaya' => 0,
                        'status_reservasi' => $statusRes,
                    ]);

                    DetailReservasi::create([
                        'id_reservasi' => $reservasi->id_reservasi,
                        'id_lapangan' => $idLap,
                        'tanggal_main' => $tgl,
                        'jam_mulai' => $jamMulai,
                        'jam_selesai' => $jamSelesai,
                        'durasi' => $durasiMenit,
                        'subtotal' => 0,
                    ]);

                    $countMemberSesi++;
                } else {
                    // Tipe Reguler
                    $totalBiaya = $tarifStandar;
                    $jumlahBayar = 0;
                    $jenisBayar = null;
                    $metodeBayar = Pembayaran::METODE_TUNAI;
                    $statusRes = $isBatal ? Reservasi::STATUS_BATAL : Reservasi::STATUS_TERKONFIRMASI;

                    if (stripos($catatan, 'free') !== false) {
                        $totalBiaya = 0;
                        $jumlahBayar = 0;
                        $jenisBayar = Pembayaran::JENIS_LUNAS;
                    } elseif ($isBatal) {
                        // Cek kasus khusus PB FA batal tapi bayar 100k
                        if (stripos($catatan, '100k') !== false) {
                            $totalBiaya = 100000;
                            $jumlahBayar = 100000;
                            $jenisBayar = Pembayaran::JENIS_LUNAS;
                            $metodeBayar = Pembayaran::METODE_TUNAI;
                        } else {
                            $totalBiaya = $tarifStandar;
                            $jumlahBayar = 0;
                        }
                    } elseif (preg_match('/dp\s*(\d+)k?/i', $catatan, $m)) {
                        $dpNominal = (int) $m[1] * 1000;
                        $totalBiaya = $tarifStandar;
                        $jumlahBayar = $dpNominal;
                        $jenisBayar = Pembayaran::JENIS_DP;
                    } elseif (stripos($catatan, 'transfer 100k') !== false || stripos($catatan, 'tf 100k') !== false) {
                        $totalBiaya = 100000;
                        $jumlahBayar = 100000;
                        $jenisBayar = Pembayaran::JENIS_LUNAS;
                        $metodeBayar = Pembayaran::METODE_TRANSFER;
                    } elseif (stripos($catatan, 'bayar 100k') !== false) {
                        $totalBiaya = 100000;
                        $jumlahBayar = 100000;
                        $jenisBayar = Pembayaran::JENIS_LUNAS;
                    } elseif (stripos($catatan, 'bayar 60k') !== false) {
                        $totalBiaya = 60000;
                        $jumlahBayar = 60000;
                        $jenisBayar = Pembayaran::JENIS_LUNAS;
                    } elseif (stripos($catatan, 'bayar 50k') !== false) {
                        $totalBiaya = 50000;
                        $jumlahBayar = 50000;
                        $jenisBayar = Pembayaran::JENIS_LUNAS;
                    } elseif (strtoupper($nama) === 'HIMASIF') {
                        // Acara 7 jam HIMASIF
                        $totalBiaya = 360000;
                        $jumlahBayar = 360000;
                        $jenisBayar = Pembayaran::JENIS_LUNAS;
                    } else {
                        // Default lunas sewa biasa
                        $totalBiaya = $tarifStandar;
                        $jumlahBayar = $tarifStandar;
                        $jenisBayar = Pembayaran::JENIS_LUNAS;
                    }

                    $reservasi = Reservasi::create([
                        'id_user' => null,
                        'nama_pemesan' => $nama,
                        'no_whatsapp_pemesan' => null,
                        'id_paket' => null,
                        'tanggal_pemesanan' => $tgl,
                        'total_biaya' => $totalBiaya,
                        'status_reservasi' => $statusRes,
                    ]);

                    DetailReservasi::create([
                        'id_reservasi' => $reservasi->id_reservasi,
                        'id_lapangan' => $idLap,
                        'tanggal_main' => $tgl,
                        'jam_mulai' => $jamMulai,
                        'jam_selesai' => $jamSelesai,
                        'durasi' => $durasiMenit,
                        'subtotal' => $totalBiaya,
                    ]);

                    if ($jumlahBayar > 0 && $jenisBayar) {
                        Pembayaran::create([
                            'id_reservasi' => $reservasi->id_reservasi,
                            'id_paket' => null,
                            'tanggal_pembayaran' => $tgl,
                            'jenis_pembayaran' => $jenisBayar,
                            'jumlah' => $jumlahBayar,
                            'metode_pembayaran' => $metodeBayar,
                            'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
                            'keterangan' => $catatan ?: "Pembayaran {$jenisBayar} sewa {$nama}",
                        ]);
                    }

                    $countReguler++;
                }

                if ($isBatal) {
                    $countBatal++;
                }
                $countReservasi++;
            }

            // Catat 1 ringkasan audit log
            AuditLog::create([
                'id_user' => 2, // Admin Bigi
                'aksi' => 'IMPORT_JADWAL_REAL',
                'objek' => 'Reservasi & Member',
                'keterangan' => "Impor massal {$countReservasi} data jadwal riil 28 Sep - 1 Nov 2026 ({$countMemberSesi} sesi member, {$countReguler} reguler, {$countBatal} batal)",
                'waktu' => Carbon::now('Asia/Jakarta'),
            ]);

            $this->info("✓ Berhasil membuat {$countReservasi} jadwal reservasi:");
            $this->line("  - Sesi Member: {$countMemberSesi}");
            $this->line("  - Pemesanan Reguler: {$countReguler}");
            $this->line("  - Status Dibatalkan: {$countBatal}");
        });

        $this->info('=== Pengimporan Selesai dengan Sukses ===');
        return self::SUCCESS;
    }
}
