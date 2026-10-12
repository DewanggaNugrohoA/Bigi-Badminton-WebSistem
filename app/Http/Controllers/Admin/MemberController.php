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

        $query = User::query()
            ->where('role', User::ROLE_USER)
            ->with([
                'paketMember' => function ($q) {
                    $q->with([
                        'penyesuaian.admin:id_user,nama,role',
                        'reservasi',
                    ])->orderBy('id_paket', 'desc');
                },
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('no_whatsapp', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($filter === 'aktif') {
            $query->where('jenis_pelanggan', User::JENIS_PELANGGAN_MEMBER)
                ->where('status_member', User::STATUS_MEMBER_AKTIF);
        } elseif ($filter === 'bukan_member') {
            $query->where(function ($q) {
                $q->where('jenis_pelanggan', '!=', User::JENIS_PELANGGAN_MEMBER)
                    ->orWhereNull('jenis_pelanggan');
            });
        } elseif ($filter === 'kedaluwarsa') {
            $query->where('jenis_pelanggan', User::JENIS_PELANGGAN_MEMBER)
                ->where(function ($q) use ($today) {
                    $q->where('status_member', User::STATUS_MEMBER_TIDAK_AKTIF)
                        ->orWhereDate('tanggal_akhir_member', '<', $today);
                });
        }

        $customers = $query->orderBy('nama', 'asc')->paginate(15)->withQueryString();

        $transformed = $customers->through(function ($u) use ($today) {
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
                    $statusLabel = 'Member Kedaluwarsa';
                } else {
                    $statusLabel = 'Member Tidak Aktif';
                }
            }

            $daftarPaket = $u->paketMember->map(function ($p) use ($u) {
                $riwayat = [];

                foreach ($p->reservasi as $res) {
                    $riwayat[] = [
                        'id_unique' => "res_{$res->id_reservasi}",
                        'waktu_sort' => $res->created_at ? $res->created_at->toDateTimeString() : '',
                        'tanggal_display' => $res->tanggal_main ? $res->tanggal_main->format('d/m/Y') : '-',
                        'tipe' => 'reservasi',
                        'tipe_label' => 'Sewa Lapangan',
                        'selisih' => -1,
                        'keterangan' => "Reservasi #{$res->id_reservasi} ({$res->jam_mulai} - {$res->jam_selesai})",
                        'dicatat_oleh' => 'Sistem Reservasi',
                    ];
                }

                foreach ($p->penyesuaian as $adj) {
                    $tanggalAdj = $adj->tanggal_main
                        ? $adj->tanggal_main->format('d/m/Y')
                        : ($adj->created_at ? $adj->created_at->format('d/m/Y') : '-');

                    $tipeLabel = $adj->selisih < 0 ? 'Pemakaian Sesi' : 'Penambahan Sesi';
                    $dicatatOleh = $adj->admin ? $adj->admin->nama : 'Petugas';

                    $riwayat[] = [
                        'id_unique' => "adj_{$adj->id_penyesuaian}",
                        'waktu_sort' => $adj->created_at ? $adj->created_at->toDateTimeString() : '',
                        'tanggal_display' => $tanggalAdj,
                        'tipe' => $adj->selisih < 0 ? 'pemakaian' : 'penambahan',
                        'tipe_label' => $tipeLabel,
                        'selisih' => $adj->selisih,
                        'keterangan' => $adj->alasan ?: '-',
                        'dicatat_oleh' => $dicatatOleh,
                    ];
                }

                usort($riwayat, function ($a, $b) {
                    return strcmp($b['waktu_sort'], $a['waktu_sort']);
                });

                return [
                    'id_paket' => $p->id_paket,
                    'jumlah_sesi' => $p->jumlah_sesi,
                    'sesi_terpakai' => $p->sesi_terpakai,
                    'sisa_sesi' => $p->sisa_sesi,
                    'tanggal_mulai' => $p->tanggal_mulai ? $p->tanggal_mulai->format('Y-m-d') : null,
                    'tanggal_akhir' => $p->tanggal_akhir ? $p->tanggal_akhir->format('Y-m-d') : null,
                    'periode_teks' => $p->tanggal_mulai
                        ? ($p->tanggal_akhir
                            ? "{$p->tanggal_mulai->format('d/m/Y')} s/d {$p->tanggal_akhir->format('d/m/Y')}"
                            : "Mulai {$p->tanggal_mulai->format('d/m/Y')} (Tanpa kedaluwarsa)")
                        : '-',
                    'status' => $p->status,
                    'status_label' => $p->status_label,
                    'catatan' => $p->catatan,
                    'created_at' => $p->created_at ? $p->created_at->format('d/m/Y H:i') : '-',
                    'riwayat_transaksi' => $riwayat,
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
                    : ($u->tanggal_mulai_member ? "Mulai {$u->tanggal_mulai_member->format('d/m/Y')}" : '-'),
                'sisa_sesi_aktif' => $activePaket ? $activePaket->sisa_sesi : 0,
                'paket_aktif_id' => $activePaket ? $activePaket->id_paket : null,
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

        $tanggalMain = null;
        if ($request->filled('tanggal_main')) {
            $tanggalMain = $request->tanggal_main;
        } elseif ($request->filled('tanggal')) {
            $tanggalMain = $request->tanggal;
        }

        DB::transaction(function () use ($paket, $request, $adminId, $tanggalMain) {
            PenyesuaianPaket::create([
                'id_paket' => $paket->id_paket,
                'selisih' => (int) $request->selisih,
                'tanggal_main' => $tanggalMain,
                'alasan' => $request->alasan,
                'id_admin' => $adminId,
            ]);

            $tanda = $request->selisih > 0 ? "+{$request->selisih}" : (string) $request->selisih;
            $aksiTeks = $request->selisih < 0 ? 'Pemakaian sesi' : 'Penambahan sesi';
            $this->logAudit(
                $adminId,
                'PENYESUAIAN_PAKET_MEMBER',
                "Paket Member #{$paket->id_paket}",
                "{$aksiTeks} ({$tanda} sesi) untuk {$paket->user->nama}. Alasan: {$request->alasan}"
            );
        });

        $pesan = $request->selisih < 0
            ? 'Pemakaian ' . abs((int) $request->selisih) . ' sesi berhasil dicatat.'
            : 'Penambahan ' . (int) $request->selisih . ' sesi berhasil disimpan.';

        return redirect()->back()->with('success', $pesan);
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
