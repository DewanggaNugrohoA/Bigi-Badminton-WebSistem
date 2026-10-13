<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\PaketMember;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Service pengelola logika bisnis reservasi lapangan badminton.
 * 
 * Bertanggung jawab atas pengecekan konflik slot jadwal (lapangan & mabar),
 * pemesanan reguler, autofield pemesanan rutin member, pelunasan sisa bayar,
 * serta pembatalan dan penyelesaian reservasi dengan pencatatan audit log.
 */
class ReservasiService
{
    /**
     * Catat aktivitas perubahan data reservasi ke tabel audit_log.
     */
    public function logAktivitas(int $idUser, string $aksi, string $objek, ?string $keterangan = null): void
    {
        AuditLog::create([
            'id_user' => $idUser,
            'aksi' => $aksi,
            'objek' => $objek,
            'keterangan' => $keterangan,
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);
    }

    /**
     * Periksa apakah slot waktu bentrok dengan reservasi lain atau Open Mabar disetujui.
     * Menggunakan query overlap: (jam_mulai < request_selesai AND jam_selesai > request_mulai).
     *
     * @return string|null Pesan kesalahan jika terjadi bentrok, atau null jika slot tersedia.
     */
    public function checkSlotConflict(
        int $idLapangan,
        string $tanggal,
        string $jamMulai,
        string $jamSelesai,
        ?int $ignoreDetailReservasiId = null,
        bool $useLock = false
    ): ?string {
        
        $tglObj = Carbon::parse($tanggal)->startOfDay();
        $today = Carbon::today('Asia/Jakarta');
        if ($tglObj->lt($today)) {
            return 'Tidak dapat memesan jadwal pada tanggal yang sudah lewat.';
        }

        
        $lapanganQuery = Lapangan::where('id_lapangan', $idLapangan);
        if ($useLock) {
            $lapanganQuery->lockForUpdate();
        }
        $lapangan = $lapanganQuery->first();

        if (! $lapangan) {
            return 'Lapangan tidak ditemukan.';
        }
        if ($lapangan->status_lapangan === Lapangan::STATUS_PERAWATAN) {
            return 'Lapangan sedang dalam perawatan (maintenance) dan tidak dapat dipesan.';
        }

        
        $mulai = Carbon::parse($jamMulai)->format('H:i:s');
        $selesai = Carbon::parse($jamSelesai)->format('H:i:s');

        if ($mulai >= $selesai) {
            return 'Jam selesai harus lebih besar dari jam mulai.';
        }

        
        
        
        $resQuery = DetailReservasi::where('id_lapangan', $idLapangan)
            ->whereDate('tanggal_main', $tanggal)
            ->when($ignoreDetailReservasiId, fn ($q) => $q->where('id_detail_reservasi', '!=', $ignoreDetailReservasiId))
            ->whereHas('reservasi', function ($q) {
                $q->where('status_reservasi', '!=', Reservasi::STATUS_BATAL);
            })
            ->where('jam_mulai', '<', $selesai)
            ->where('jam_selesai', '>', $mulai);

        if ($useLock) {
            $resQuery->lockForUpdate();
        }

        if ($resQuery->exists()) {
            return 'Slot waktu bentrok dengan reservasi lain yang sudah terdaftar.';
        }

        
        $mabarQuery = OpenMabar::where('id_lapangan', $idLapangan)
            ->whereDate('tanggal', $tanggal)
            ->where('status', OpenMabar::STATUS_DISETUJUI)
            ->where('jam_mulai', '<', $selesai)
            ->where('jam_selesai', '>', $mulai);

        if ($useLock) {
            $mabarQuery->lockForUpdate();
        }

        if ($mabarQuery->exists()) {
            return 'Slot waktu bentrok dengan jadwal Open Mabar yang telah disetujui.';
        }

        return null;
    }

    
    /**
     * Periksa konflik jadwal khusus saat Admin akan menyetujui pengajuan Open Mabar.
     * Mengembalikan rincian pemesan/judul yang bertabrakan bila terjadi bentrok.
     */
    public function checkMabarConflict(
        int $idLapangan,
        string $tanggal,
        string $jamMulai,
        string $jamSelesai,
        ?int $ignoreMabarId = null,
        bool $useLock = false
    ): ?string {
        
        $tglObj = Carbon::parse($tanggal)->startOfDay();
        $today = Carbon::today('Asia/Jakarta');
        if ($tglObj->lt($today)) {
            return 'Tidak dapat menyetujui jadwal pada tanggal yang sudah lewat.';
        }

        
        $lapanganQuery = Lapangan::where('id_lapangan', $idLapangan);
        if ($useLock) {
            $lapanganQuery->lockForUpdate();
        }
        $lapangan = $lapanganQuery->first();

        if (! $lapangan) {
            return 'Lapangan tidak ditemukan.';
        }
        if ($lapangan->status_lapangan === Lapangan::STATUS_PERAWATAN) {
            return 'Lapangan sedang dalam perawatan (maintenance).';
        }

        
        $mulai = Carbon::parse($jamMulai)->format('H:i:s');
        $selesai = Carbon::parse($jamSelesai)->format('H:i:s');

        if ($mulai >= $selesai) {
            return 'Jam selesai harus lebih besar dari jam mulai.';
        }

        
        $resQuery = DetailReservasi::where('id_lapangan', $idLapangan)
            ->whereDate('tanggal_main', $tanggal)
            ->whereHas('reservasi', function ($q) {
                $q->where('status_reservasi', '!=', Reservasi::STATUS_BATAL);
            })
            ->where('jam_mulai', '<', $selesai)
            ->where('jam_selesai', '>', $mulai);

        if ($useLock) {
            $resQuery->lockForUpdate();
        }

        $conflictingRes = $resQuery->with(['reservasi:id_reservasi,id_user,nama_pemesan'])->first();
        if ($conflictingRes) {
            $pemesan = $conflictingRes->reservasi->nama_pemesan ?? 'Pelanggan';
            return "Slot waktu bentrok dengan reservasi #{$conflictingRes->id_reservasi} ({$pemesan}, {$conflictingRes->jam_mulai}-{$conflictingRes->jam_selesai}).";
        }

        
        $mabarQuery = OpenMabar::where('id_lapangan', $idLapangan)
            ->whereDate('tanggal', $tanggal)
            ->where('status', OpenMabar::STATUS_DISETUJUI)
            ->when($ignoreMabarId, fn ($q) => $q->where('id_mabar', '!=', $ignoreMabarId))
            ->where('jam_mulai', '<', $selesai)
            ->where('jam_selesai', '>', $mulai);

        if ($useLock) {
            $mabarQuery->lockForUpdate();
        }

        $conflictingMabar = $mabarQuery->first();
        if ($conflictingMabar) {
            return "Slot waktu bentrok dengan Open Mabar disetujui #{$conflictingMabar->id_mabar} ('{$conflictingMabar->judul}', {$conflictingMabar->jam_mulai}-{$conflictingMabar->jam_selesai}).";
        }

        return null;
    }

    
    /**
     * Buat reservasi reguler (satu slot/hari) beserta detail reservasi dan pencatatan pembayaran awal (DP/Lunas).
     * Jika pemesan terdaftar sebagai member aktif, paket sesinya dicek dan dikaitkan ke reservasi.
     */
    public function createRegularReservasi(array $data, int $adminUserId): Reservasi
    {
        return DB::transaction(function () use ($data, $adminUserId) {
            $user = null;
            $idUser = ! empty($data['id_user']) ? (int) $data['id_user'] : null;
            if ($idUser) {
                $user = User::find($idUser);
            }

            $namaPemesan = $data['nama_pemesan'] ?? ($user ? $user->nama : 'Pelanggan');
            $noWhatsappPemesan = $data['no_whatsapp_pemesan'] ?? ($user ? $user->no_whatsapp : null);

            $conflict = $this->checkSlotConflict(
                (int) $data['id_lapangan'],
                (string) $data['tanggal_main'],
                (string) $data['jam_mulai'],
                (string) $data['jam_selesai'],
                null,
                true 
            );

            if ($conflict) {
                throw ValidationException::withMessages([
                    'jam_mulai' => $conflict,
                ]);
            }

            $mulai = Carbon::parse($data['jam_mulai']);
            $selesai = Carbon::parse($data['jam_selesai']);
            $durasiMenit = $mulai->diffInMinutes($selesai);
            $durasiJam = $durasiMenit / 60;

            $lapangan = Lapangan::findOrFail($data['id_lapangan']);
            $totalBiaya = (int) round($durasiJam * $lapangan->harga_per_jam);

            $jenisPembayaran = $data['jenis_pembayaran']; 

            if ($jenisPembayaran === Pembayaran::JENIS_LUNAS) {
                if (isset($data['jumlah_bayar']) && $data['jumlah_bayar'] !== null && $data['jumlah_bayar'] !== '') {
                    $providedJumlah = (float) $data['jumlah_bayar'];
                    if ($providedJumlah < $totalBiaya) {
                        throw ValidationException::withMessages([
                            'jumlah_bayar' => 'Pembayaran Lunas harus mencakup seluruh total biaya reservasi.',
                        ]);
                    }
                }
                $jumlahBayar = (float) $totalBiaya;
            } elseif ($jenisPembayaran === Pembayaran::JENIS_DP) {
                $dpKey = isset($data['nominal_dp']) ? 'nominal_dp' : 'jumlah_bayar';
                $dpInput = $data['nominal_dp'] ?? ($data['jumlah_bayar'] ?? null);
                if ($dpInput === null || $dpInput === '') {
                    throw ValidationException::withMessages([
                        $dpKey => 'Nominal DP wajib diisi.',
                    ]);
                }
                $jumlahBayar = (float) $dpInput;
                if ($jumlahBayar <= 0) {
                    throw ValidationException::withMessages([
                        $dpKey => 'Nominal harus lebih dari 0.',
                    ]);
                }
                if ($jumlahBayar >= $totalBiaya) {
                    throw ValidationException::withMessages([
                        $dpKey => 'Nominal DP harus kurang dari total biaya.',
                    ]);
                }
            } else {
                throw ValidationException::withMessages([
                    'jenis_pembayaran' => 'Jenis pembayaran tidak valid (harus DP atau Lunas).',
                ]);
            }

            
            $idPaket = null;
            if ($user && $user->jenis_pelanggan === User::JENIS_PELANGGAN_MEMBER) {
                $paket = PaketMember::where('id_user', $user->id_user)
                    ->where('status', PaketMember::STATUS_AKTIF)
                    ->where(function ($q) {
                        $today = Carbon::today('Asia/Jakarta');
                        $q->whereNull('tanggal_akhir')->orWhereDate('tanggal_akhir', '>=', $today);
                    })
                    ->lockForUpdate()
                    ->first();

                if (! $paket) {
                    throw ValidationException::withMessages([
                        'id_user' => 'Member ini tidak memiliki paket sesi aktif yang masih berlaku.',
                    ]);
                }

                if ($paket->sisa_sesi < 1) {
                    throw ValidationException::withMessages([
                        'id_user' => "Sisa sesi pada paket member telah habis (tersisa {$paket->sisa_sesi} sesi).",
                    ]);
                }

                $idPaket = $paket->id_paket;
            }

            $reservasi = Reservasi::create([
                'id_user' => $idUser,
                'nama_pemesan' => $namaPemesan,
                'no_whatsapp_pemesan' => $noWhatsappPemesan,
                'id_paket' => $idPaket,
                'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
                'total_biaya' => $totalBiaya,
                'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
            ]);

            DetailReservasi::create([
                'id_reservasi' => $reservasi->id_reservasi,
                'id_lapangan' => $lapangan->id_lapangan,
                'tanggal_main' => $data['tanggal_main'],
                'jam_mulai' => $mulai->format('H:i:s'),
                'jam_selesai' => $selesai->format('H:i:s'),
                'durasi' => $durasiMenit,
                'subtotal' => $totalBiaya,
            ]);

            Pembayaran::create([
                'id_reservasi' => $reservasi->id_reservasi,
                'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
                'jenis_pembayaran' => $jenisPembayaran,
                'jumlah' => $jumlahBayar,
                'metode_pembayaran' => Pembayaran::METODE_TUNAI,
                'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
                'keterangan' => $data['keterangan'] ?? null,
            ]);

            $this->logAktivitas(
                $adminUserId,
                'TAMBAH_RESERVASI',
                "Reservasi #{$reservasi->id_reservasi}",
                "Membuat reservasi reguler untuk {$namaPemesan} ({$lapangan->nama_lapangan}, {$data['tanggal_main']} {$data['jam_mulai']}-{$data['jam_selesai']}, Bayar {$jenisPembayaran}: Rp " . number_format($jumlahBayar, 0, ',', '.') . ')'
            );

            return $reservasi;
        });
    }

    
    public function createReservasi(array $data, ?int $adminUserId = null): Reservasi
    {
        $adminId = $adminUserId ?? $data['id_user'];
        return $this->createRegularReservasi($data, $adminId);
    }

    
    /**
     * Hitung kalkulasi preview jadwal autofield member mingguan (misal setiap hari Senin).
     * Melakukan iterasi dari tanggal hari ini hingga tanggal akhir masa aktif member,
     * serta mendeteksi apakah setiap tanggal bentrok atau melebihi kuota sisa sesi paket.
     */
    public function previewMemberAutofield(int $idUser, int $idLapangan, string $hari, string $jamMulai, string $jamSelesai, ?int $hargaPerSesi = null): array
    {
        $user = User::findOrFail($idUser);

        if ($user->jenis_pelanggan !== User::JENIS_PELANGGAN_MEMBER || $user->status_member !== User::STATUS_MEMBER_AKTIF) {
            throw ValidationException::withMessages([
                'id_user' => 'Pengguna bukan merupakan member aktif.',
            ]);
        }

        $lapangan = Lapangan::findOrFail($idLapangan);
        $mulaiMember = Carbon::parse($user->tanggal_mulai_member)->startOfDay();
        $akhirMember = Carbon::parse($user->tanggal_akhir_member)->startOfDay();
        $today = Carbon::today('Asia/Jakarta');

        $mulai = Carbon::parse($jamMulai);
        $selesai = Carbon::parse($jamSelesai);
        $durasiMenit = $mulai->diffInMinutes($selesai);
        $subtotalPerSesi = ($hargaPerSesi !== null && $hargaPerSesi > 0)
            ? $hargaPerSesi
            : (int) round(($durasiMenit / 60) * $lapangan->harga_per_jam);

        
        $activePaket = PaketMember::where('id_user', $user->id_user)
            ->where('status', PaketMember::STATUS_AKTIF)
            ->where(function ($q) use ($today) {
                $q->whereNull('tanggal_akhir')->orWhereDate('tanggal_akhir', '>=', $today);
            })
            ->first();

        $sisaSesiPaket = $activePaket ? $activePaket->sisa_sesi : 0;

        $targetDayIndex = (int) $hari; 

        $dates = [];
        $cursor = $mulaiMember->copy();
        if ($cursor->lt($today)) {
            $cursor = $today->copy();
        }

        $sessionCounter = 0;
        
        while ($cursor->lte($akhirMember)) {
            if ($cursor->dayOfWeek === $targetDayIndex) {
                $sessionCounter++;
                $tglStr = $cursor->toDateString();
                $conflictMsg = $this->checkSlotConflict($idLapangan, $tglStr, $jamMulai, $jamSelesai);

                $statusSesi = 'OK';
                $alasanSesi = null;

                if (! $activePaket) {
                    $statusSesi = 'BENTROK';
                    $alasanSesi = 'Member belum memiliki paket sesi aktif.';
                } elseif ($sessionCounter > $sisaSesiPaket) {
                    $statusSesi = 'BENTROK';
                    $alasanSesi = "Melebihi sisa sesi paket (hanya tersisa {$sisaSesiPaket} sesi).";
                } elseif ($conflictMsg) {
                    $statusSesi = 'BENTROK';
                    $alasanSesi = $conflictMsg;
                }

                $dates[] = [
                    'tanggal' => $tglStr,
                    'tanggal_format' => $cursor->locale('id')->isoFormat('dddd, D MMMM Y'),
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $jamSelesai,
                    'status' => $statusSesi,
                    'alasan' => $alasanSesi,
                    'subtotal' => $subtotalPerSesi,
                    'melebihi_kuota' => $sessionCounter > $sisaSesiPaket,
                ];
            }
            $cursor->addDay();
        }

        $hasConflict = collect($dates)->contains('status', 'BENTROK');
        $totalBiaya = collect($dates)->sum('subtotal');

        return [
            'member' => [
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'periode' => "{$user->tanggal_mulai_member->format('d/m/Y')} - {$user->tanggal_akhir_member->format('d/m/Y')}",
                'paket_aktif' => $activePaket ? [
                    'id_paket' => $activePaket->id_paket,
                    'jumlah_sesi' => $activePaket->jumlah_sesi,
                    'sisa_sesi' => $sisaSesiPaket,
                ] : null,
            ],
            'lapangan' => [
                'id_lapangan' => $lapangan->id_lapangan,
                'nama_lapangan' => $lapangan->nama_lapangan,
                'harga_per_jam' => $lapangan->harga_per_jam,
            ],
            'jadwal' => $dates,
            'total_sesi' => count($dates),
            'sisa_sesi_paket' => $sisaSesiPaket,
            'total_biaya' => $totalBiaya,
            'bisa_disimpan' => ! $hasConflict && count($dates) > 0,
            'has_conflict' => $hasConflict,
        ];
    }

    
    /**
     * Simpan reservasi kolektif mingguan member secara atomik (all-or-nothing).
     * Jika satu saja tanggal bentrok, seluruh transaksi digagalkan dan dibatalkan.
     */
    public function storeMemberAutofield(array $data, int $adminUserId): Reservasi
    {
        return DB::transaction(function () use ($data, $adminUserId) {
            $hargaPerSesi = isset($data['harga_per_sesi']) ? (int) $data['harga_per_sesi'] : null;
            $preview = $this->previewMemberAutofield(
                (int) $data['id_user'],
                (int) $data['id_lapangan'],
                (string) $data['hari'],
                (string) $data['jam_mulai'],
                (string) $data['jam_selesai'],
                $hargaPerSesi
            );

            if (empty($preview['jadwal'])) {
                throw ValidationException::withMessages([
                    'hari' => 'Tidak ditemukan jadwal pada hari yang dipilih dalam sisa masa aktif member.',
                ]);
            }

            
            if ($preview['has_conflict']) {
                $conflicts = collect($preview['jadwal'])
                    ->where('status', 'BENTROK')
                    ->map(fn ($j) => "{$j['tanggal']}: {$j['alasan']}")
                    ->implode('; ');

                throw ValidationException::withMessages([
                    'autofield' => "Gagal membuat reservasi member secara kolektif (all-or-nothing). Terdapat jadwal bentrok pada: {$conflicts}",
                ]);
            }

            $user = User::findOrFail($data['id_user']);
            $lapangan = Lapangan::findOrFail($data['id_lapangan']);
            $totalBiaya = $preview['total_biaya'];
            $jenisPembayaran = $data['jenis_pembayaran'];
            $jumlahBayar = (float) $data['jumlah_bayar'];

            if ($jenisPembayaran === Pembayaran::JENIS_LUNAS) {
                if ($jumlahBayar < $totalBiaya) {
                    throw ValidationException::withMessages([
                        'jumlah_bayar' => 'Pembayaran Lunas harus mencakup seluruh total biaya paket sesi.',
                    ]);
                }
            } elseif ($jenisPembayaran === Pembayaran::JENIS_DP) {
                if ($jumlahBayar <= 0 || $jumlahBayar >= $totalBiaya) {
                    throw ValidationException::withMessages([
                        'jumlah_bayar' => 'Pembayaran DP harus lebih dari 0 dan kurang dari total biaya.',
                    ]);
                }
            } else {
                throw ValidationException::withMessages([
                    'jenis_pembayaran' => 'Jenis pembayaran tidak valid (harus DP atau Lunas).',
                ]);
            }

            
            $paket = PaketMember::where('id_user', $user->id_user)
                ->where('status', PaketMember::STATUS_AKTIF)
                ->where(function ($q) {
                    $today = Carbon::today('Asia/Jakarta');
                    $q->whereNull('tanggal_akhir')->orWhereDate('tanggal_akhir', '>=', $today);
                })
                ->lockForUpdate()
                ->first();

            if (! $paket) {
                throw ValidationException::withMessages([
                    'id_user' => 'Member ini tidak memiliki paket sesi aktif yang masih berlaku.',
                ]);
            }

            $totalSesiDibutuhkan = count($preview['jadwal']);
            if ($paket->sisa_sesi < $totalSesiDibutuhkan) {
                throw ValidationException::withMessages([
                    'autofield' => "Sisa sesi pada paket member ({$paket->sisa_sesi} sesi) tidak mencukupi untuk memesan {$totalSesiDibutuhkan} jadwal pertemuan.",
                ]);
            }

            
            $reservasi = Reservasi::create([
                'id_user' => $user->id_user,
                'id_paket' => $paket->id_paket,
                'tanggal_pemesanan' => Carbon::now('Asia/Jakarta')->toDateString(),
                'total_biaya' => $totalBiaya,
                'status_reservasi' => Reservasi::STATUS_TERKONFIRMASI,
            ]);

            $mulai = Carbon::parse($data['jam_mulai']);
            $selesai = Carbon::parse($data['jam_selesai']);
            $durasiMenit = $mulai->diffInMinutes($selesai);

            
            foreach ($preview['jadwal'] as $sesi) {
                
                $con = $this->checkSlotConflict(
                    $lapangan->id_lapangan,
                    $sesi['tanggal'],
                    $sesi['jam_mulai'],
                    $sesi['jam_selesai'],
                    null,
                    true
                );

                if ($con) {
                    throw ValidationException::withMessages([
                        'autofield' => "Bentrok mendadak terdeteksi pada tanggal {$sesi['tanggal']}.",
                    ]);
                }

                DetailReservasi::create([
                    'id_reservasi' => $reservasi->id_reservasi,
                    'id_lapangan' => $lapangan->id_lapangan,
                    'tanggal_main' => $sesi['tanggal'],
                    'jam_mulai' => $mulai->format('H:i:s'),
                    'jam_selesai' => $selesai->format('H:i:s'),
                    'durasi' => $durasiMenit,
                    'subtotal' => $sesi['subtotal'],
                ]);
            }

            
            Pembayaran::create([
                'id_reservasi' => $reservasi->id_reservasi,
                'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
                'jenis_pembayaran' => $jenisPembayaran,
                'jumlah' => $jumlahBayar,
                'metode_pembayaran' => $data['metode_pembayaran'] ?? Pembayaran::METODE_TRANSFER,
                'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
                'keterangan' => $data['keterangan'] ?? 'Reservasi Member Rutin',
            ]);

            $this->logAktivitas(
                $adminUserId,
                'TAMBAH_RESERVASI_MEMBER',
                "Reservasi #{$reservasi->id_reservasi}",
                "Membuat paket member autofield untuk {$user->nama} ({$preview['total_sesi']} sesi, Total Rp " . number_format($totalBiaya, 0, ',', '.') . ')'
            );

            return $reservasi;
        });
    }

    
    /**
     * Catat pelunasan sisa kekurangan biaya sewa reservasi lapangan.
     */
    public function lunasiPembayaran(int $idReservasi, array $data, int $adminUserId): Pembayaran
    {
        return DB::transaction(function () use ($idReservasi, $data, $adminUserId) {
            $reservasi = Reservasi::with('pembayaran')->findOrFail($idReservasi);

            $sudahDibayar = (float) $reservasi->pembayaran->sum('jumlah');
            $sisaKekurangan = $reservasi->total_biaya - $sudahDibayar;

            if ($sisaKekurangan <= 0) {
                throw ValidationException::withMessages([
                    'jumlah' => 'Reservasi ini sudah berstatus lunas.',
                ]);
            }

            $jumlahBayar = (float) $data['jumlah'];
            if ($jumlahBayar < $sisaKekurangan) {
                throw ValidationException::withMessages([
                    'jumlah' => 'Nominal pelunasan tidak boleh kurang dari sisa tagihan (Rp ' . number_format($sisaKekurangan, 0, ',', '.') . ').',
                ]);
            }

            $pembayaran = Pembayaran::create([
                'id_reservasi' => $reservasi->id_reservasi,
                'tanggal_pembayaran' => Carbon::now('Asia/Jakarta')->toDateString(),
                'jenis_pembayaran' => Pembayaran::JENIS_LUNAS,
                'jumlah' => $jumlahBayar,
                'metode_pembayaran' => $data['metode_pembayaran'] ?? Pembayaran::METODE_TUNAI,
                'status_pembayaran' => Pembayaran::STATUS_TERKONFIRMASI,
                'keterangan' => $data['keterangan'] ?? 'Pelunasan sisa pembayaran sewa',
            ]);

            $this->logAktivitas(
                $adminUserId,
                'PELUNASAN_SEWA',
                "Reservasi #{$reservasi->id_reservasi}",
                "Pelunasan sisa sewa sebesar Rp " . number_format($jumlahBayar, 0, ',', '.') . " via {$pembayaran->metode_pembayaran}"
            );

            return $pembayaran;
        });
    }

    /**
     * Batalkan status reservasi dan catat alasan pembatalannya ke audit log.
     */
    public function batalkanReservasi(int $idReservasi, string $alasan, int $adminUserId): Reservasi
    {
        return DB::transaction(function () use ($idReservasi, $alasan, $adminUserId) {
            $reservasi = Reservasi::findOrFail($idReservasi);

            if ($reservasi->status_reservasi === Reservasi::STATUS_SELESAI) {
                throw ValidationException::withMessages([
                    'alasan' => 'Reservasi yang sudah selesai tidak dapat dibatalkan.',
                ]);
            }

            $reservasi->update([
                'status_reservasi' => Reservasi::STATUS_BATAL,
            ]);

            $this->logAktivitas(
                $adminUserId,
                'BATAL_RESERVASI',
                "Reservasi #{$reservasi->id_reservasi}",
                "Membatalkan reservasi. Alasan: {$alasan}"
            );

            return $reservasi;
        });
    }

    /**
     * Tandai pemakaian lapangan selesai digunakan oleh pemesan.
     */
    public function selesaikanReservasi(int $idReservasi, int $adminUserId): Reservasi
    {
        return DB::transaction(function () use ($idReservasi, $adminUserId) {
            $reservasi = Reservasi::findOrFail($idReservasi);

            if ($reservasi->status_reservasi === Reservasi::STATUS_BATAL) {
                throw ValidationException::withMessages([
                    'status' => 'Reservasi yang telah dibatalkan tidak dapat ditandai selesai.',
                ]);
            }

            $reservasi->update([
                'status_reservasi' => Reservasi::STATUS_SELESAI,
            ]);

            $this->logAktivitas(
                $adminUserId,
                'SELESAIKAN_RESERVASI',
                "Reservasi #{$reservasi->id_reservasi}",
                "Menandai reservasi telah selesai digunakan."
            );

            return $reservasi;
        });
    }
}
