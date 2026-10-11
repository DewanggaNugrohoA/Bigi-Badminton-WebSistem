<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CancelPaketMemberRequest;
use App\Http\Requests\Admin\StorePaketMemberRequest;
use App\Http\Requests\Admin\StorePenyesuaianPaketRequest;
use App\Http\Requests\Admin\UpdateMemberStatusRequest;
use App\Models\AuditLog;
use App\Models\PaketMember;
use App\Models\PenyesuaianPaket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    
    protected function logAudit(int $idAdmin, string $aksi, string $objek, ?string $keterangan = null): void
    {
        AuditLog::create([
            'id_user' => $idAdmin,
            'aksi' => $aksi,
            'objek' => $objek,
            'keterangan' => $keterangan,
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);
    }

    
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $filter = $request->input('filter', 'semua'); 
        $today = Carbon::today('Asia/Jakarta');

        $query = User::where('role', User::ROLE_USER)
            ->with([
                'paketMember' => function ($q) {
                    $q->with([
                        'reservasi.detailReservasi',
                        'penyesuaian.admin:id_user,nama',
                    ])->orderBy('id_paket', 'desc');
                },
            ]);

        
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('no_whatsapp', 'like', "%{$search}%");
            });
        }

        
        if ($filter === 'aktif') {
            $query->where('jenis_pelanggan', User::JENIS_PELANGGAN_MEMBER)
                ->where('status_member', User::STATUS_MEMBER_AKTIF);
        } elseif ($filter === 'bukan_member') {
            $query->where('jenis_pelanggan', User::JENIS_PELANGGAN_REGULER);
        } elseif ($filter === 'kedaluwarsa') {
            $query->where('jenis_pelanggan', User::JENIS_PELANGGAN_MEMBER)
                ->where(function ($q) use ($today) {
                    $q->where('status_member', User::STATUS_MEMBER_TIDAK_AKTIF)
                        ->orWhereDate('tanggal_akhir_member', '<', $today);
                });
        }

        $users = $query->orderBy('nama', 'asc')->paginate(15)->withQueryString();

        
        $transformed = $users->through(function ($u) use ($today) {
            
            $activePaket = $u->paketMember->first(function ($p) use ($today) {
                if ($p->status === PaketMember::STATUS_DIBATALKAN) {
                    return false;
                }
                if ($p->tanggal_akhir && Carbon::parse($p->tanggal_akhir)->startOfDay()->lt($today)) {
                    return false;
                }
                return $p->sisa_sesi > 0;
            });

            
            $isExpired = $u->tanggal_akhir_member && Carbon::parse($u->tanggal_akhir_member)->startOfDay()->lt($today);
            $statusLabel = 'Bukan Member';
            if ($u->jenis_pelanggan === User::JENIS_PELANGGAN_MEMBER) {
                if ($u->status_member === User::STATUS_MEMBER_AKTIF && ! $isExpired) {
                    $statusLabel = 'Member Aktif';
                } elseif ($isExpired) {
                    $statusLabel = 'Kedaluwarsa';
                } else {
                    $statusLabel = 'Tidak Aktif';
                }
            }

            
            $daftarPaket = $u->paketMember->map(function ($p) {
                $riwayatReservasi = $p->reservasi->map(function ($res) use ($u) {
                    $namaTampil = $res->id_user ? $u->nama : ($res->nama_pemesan ?? $u->nama);
                    return [
                        'id_reservasi' => $res->id_reservasi,
                        'nama_pemesan' => $namaTampil,
                        'tanggal_pemesanan' => $res->tanggal_pemesanan,
                        'status_reservasi' => $res->status_reservasi,
                        'total_biaya' => (float) $res->total_biaya,
                        'jumlah_sesi' => $res->detailReservasi->count(),
                        'jadwal' => $res->detailReservasi->map(function ($d) {
                            return [
                                'tanggal_main' => $d->tanggal_main,
                                'jam_mulai' => substr($d->jam_mulai, 0, 5),
                                'jam_selesai' => substr($d->jam_selesai, 0, 5),
                            ];
                        }),
                    ];
                });

                $riwayatPenyesuaian = $p->penyesuaian->map(function ($peny) {
                    return [
                        'id' => $peny->id,
                        'selisih' => $peny->selisih,
                        'alasan' => $peny->alasan,
                        'admin_nama' => $peny->admin?->nama ?? 'Admin',
                        'created_at' => $peny->created_at?->format('d/m/Y H:i'),
                    ];
                });

                return [
                    'id_paket' => $p->id_paket,
                    'jumlah_sesi' => $p->jumlah_sesi,
                    'sesi_terpakai' => $p->sesi_terpakai,
                    'total_penyesuaian' => $p->total_penyesuaian,
                    'sisa_sesi' => $p->sisa_sesi,
                    'tanggal_mulai' => $p->tanggal_mulai?->format('Y-m-d'),
                    'tanggal_akhir' => $p->tanggal_akhir?->format('Y-m-d'),
                    'status' => $p->status,
                    'status_dinamis' => $p->status_dinamis,
                    'catatan' => $p->catatan,
                    'created_at' => $p->created_at?->format('d/m/Y H:i'),
                    'reservasi' => $riwayatReservasi,
                    'penyesuaian' => $riwayatPenyesuaian,
                ];
            });

            return [
                'id_user' => $u->id_user,
                'nama' => $u->nama,
                'no_whatsapp' => $u->no_whatsapp,
                'email' => $u->email,
                'jenis_pelanggan' => $u->jenis_pelanggan,
                'status_member' => $u->status_member,
                'status_label' => $statusLabel,
                'tanggal_mulai_member' => $u->tanggal_mulai_member?->format('Y-m-d'),
                'tanggal_akhir_member' => $u->tanggal_akhir_member?->format('Y-m-d'),
                'masa_berlaku_teks' => $u->tanggal_mulai_member && $u->tanggal_akhir_member
                    ? "{$u->tanggal_mulai_member->format('d/m/Y')} s/d {$u->tanggal_akhir_member->format('d/m/Y')}"
                    : '-',
                'sisa_sesi_aktif' => $activePaket ? $activePaket->sisa_sesi : 0,
                'paket_aktif_id' => $activePaket?->id_paket,
                'paket_list' => $daftarPaket,
            ];
        });

        return Inertia::render('Admin/Member/Index', [
            'customers' => $transformed,
            'filters' => [
                'search' => $search ?? '',
                'filter' => $filter,
            ],
        ]);
    }

    
    public function updateStatus(UpdateMemberStatusRequest $request, int $userId)
    {
        $user = User::where('role', User::ROLE_USER)->findOrFail($userId);
        $adminId = $request->user()->id_user;

        
        $validated = $request->only([
            'jenis_pelanggan',
            'status_member',
            'tanggal_mulai_member',
            'tanggal_akhir_member',
        ]);

        $oldStatus = [
            'jenis' => $user->jenis_pelanggan,
            'status' => $user->status_member,
            'mulai' => $user->tanggal_mulai_member?->format('Y-m-d'),
            'akhir' => $user->tanggal_akhir_member?->format('Y-m-d'),
        ];

        $user->update($validated);

        $this->logAudit(
            $adminId,
            'UBAH_STATUS_MEMBER',
            "Pengguna #{$user->id_user} ({$user->nama})",
            "Mengubah status member: {$oldStatus['jenis']}/{$oldStatus['status']} -> {$user->jenis_pelanggan}/{$user->status_member} (Masa aktif: {$user->tanggal_mulai_member?->format('d/m/Y')} - {$user->tanggal_akhir_member?->format('d/m/Y')})"
        );

        return redirect()->back()->with('success', "Status keanggotaan {$user->nama} berhasil diperbarui.");
    }

    
    public function storePaket(StorePaketMemberRequest $request, int $userId)
    {
        $user = User::where('role', User::ROLE_USER)->findOrFail($userId);
        $adminId = $request->user()->id_user;

        $paket = PaketMember::create([
            'id_user' => $user->id_user,
            'jumlah_sesi' => $request->jumlah_sesi,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_akhir' => $request->tanggal_akhir,
            'status' => PaketMember::STATUS_AKTIF,
            'catatan' => $request->catatan,
        ]);

        $this->logAudit(
            $adminId,
            'TAMBAH_PAKET_MEMBER',
            "Paket Member #{$paket->id_paket}",
            "Menambahkan paket {$paket->jumlah_sesi} sesi untuk {$user->nama} (Masa berlaku: {$paket->tanggal_mulai->format('d/m/Y')}" . ($paket->tanggal_akhir ? " s/d {$paket->tanggal_akhir->format('d/m/Y')}" : '') . ')'
        );

        return redirect()->back()->with('success', "Paket sesi ({$paket->jumlah_sesi} sesi) berhasil ditambahkan untuk {$user->nama}.");
    }

    
    public function adjustPaket(StorePenyesuaianPaketRequest $request, int $paketId)
    {
        $paket = PaketMember::with('user')->findOrFail($paketId);
        $adminId = $request->user()->id_user;

        DB::transaction(function () use ($paket, $request, $adminId) {
            PenyesuaianPaket::create([
                'id_paket' => $paket->id_paket,
                'selisih' => (int) $request->selisih,
                'alasan' => $request->alasan,
                'id_admin' => $adminId,
            ]);

            $tanda = $request->selisih > 0 ? "+{$request->selisih}" : (string) $request->selisih;
            $this->logAudit(
                $adminId,
                'PENYESUAIAN_PAKET_MEMBER',
                "Paket Member #{$paket->id_paket}",
                "Penyesuaian sesi {$tanda} untuk {$paket->user->nama}. Alasan: {$request->alasan}"
            );
        });

        return redirect()->back()->with('success', 'Penyesuaian sesi paket berhasil disimpan.');
    }

    
    public function cancelPaket(CancelPaketMemberRequest $request, int $paketId)
    {
        $paket = PaketMember::with('user')->findOrFail($paketId);
        $adminId = $request->user()->id_user;

        DB::transaction(function () use ($paket, $request, $adminId) {
            $paket->update([
                'status' => PaketMember::STATUS_DIBATALKAN,
                'catatan' => ($paket->catatan ? $paket->catatan . "\n" : '') . "[Dibatalkan Admin]: " . $request->alasan,
            ]);

            $this->logAudit(
                $adminId,
                'BATAL_PAKET_MEMBER',
                "Paket Member #{$paket->id_paket}",
                "Membatalkan paket member milik {$paket->user->nama}. Alasan: {$request->alasan}"
            );
        });

        return redirect()->back()->with('success', 'Paket sesi member berhasil dibatalkan.');
    }
}
