<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuickCustomerRequest;
use App\Http\Requests\Admin\StoreMemberAutofieldRequest;
use App\Http\Requests\Admin\StoreRegularReservasiRequest;
use App\Models\DetailReservasi;
use App\Models\Lapangan;
use App\Models\OpenMabar;
use App\Models\Reservasi;
use App\Models\User;
use App\Services\ReservasiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReservasiController extends Controller
{
    public function __construct(
        protected ReservasiService $reservasiService
    ) {}

    
    public function index(Request $request): Response
    {
        $tanggalReq = $request->input('tanggal', Carbon::today('Asia/Jakarta')->toDateString());
        $tanggal = Carbon::parse($tanggalReq)->toDateString();
        $carbonTgl = Carbon::parse($tanggal);

        
        $lapangan = Lapangan::orderBy('id_lapangan', 'asc')->get();

        
        $detailHariIni = DetailReservasi::with([
            'lapangan:id_lapangan,nama_lapangan',
            'reservasi:id_reservasi,id_user,nama_pemesan,no_whatsapp_pemesan,total_biaya,status_reservasi',
            'reservasi.user:id_user,nama,no_whatsapp,jenis_pelanggan',
            'reservasi.pembayaran:id_pembayaran,id_reservasi,jenis_pembayaran,jumlah,status_pembayaran',
        ])
            ->whereDate('tanggal_main', $tanggal)
            ->whereHas('reservasi', function ($q) {
                $q->where('status_reservasi', '!=', Reservasi::STATUS_BATAL);
            })
            ->get();

        $slotHours = [];
        for ($h = 8; $h <= 22; $h++) {
            $slotHours[] = sprintf('%02d:00', $h);
        }

        $gridSlots = [];
        foreach ($lapangan as $lap) {
            $lapSlots = [];
            foreach ($slotHours as $timeSlot) {
                $startSlot = Carbon::parse("{$tanggal} {$timeSlot}:00");
                $endSlot = $startSlot->copy()->addHour();
                $strStart = $startSlot->format('H:i:s');
                $strEnd = $endSlot->format('H:i:s');

                $booking = $detailHariIni->first(function ($item) use ($lap, $strStart, $strEnd) {
                    return $item->id_lapangan === $lap->id_lapangan
                        && $item->jam_mulai < $strEnd
                        && $item->jam_selesai > $strStart;
                });

                $status = 'tersedia';
                $info = null;

                if ($lap->status_lapangan === Lapangan::STATUS_PERAWATAN) {
                    $status = 'perawatan';
                    $info = ['label' => 'Perawatan Lapangan'];
                } elseif ($booking) {
                    $sudahBayar = $booking->reservasi->pembayaran->sum('jumlah');
                    $isLunas = $sudahBayar >= $booking->reservasi->total_biaya;
                    $status = 'terpesan';
                    $namaTampil = $booking->reservasi->id_user ? ($booking->reservasi->user->nama ?? 'Pelanggan') : ($booking->reservasi->nama_pemesan ?? 'Pelanggan');
                    $info = [
                        'id_reservasi' => $booking->id_reservasi,
                        'nama_pemesan' => $namaTampil,
                        'jenis_pelanggan' => $booking->reservasi->user->jenis_pelanggan ?? 'reguler',
                        'status_pembayaran' => $isLunas ? 'Lunas' : 'DP',
                        'jam_mulai' => substr($booking->jam_mulai, 0, 5),
                        'jam_selesai' => substr($booking->jam_selesai, 0, 5),
                        'status_reservasi' => $booking->reservasi->status_reservasi,
                    ];
                }

                $lapSlots[] = [
                    'jam' => $timeSlot,
                    'status' => $status,
                    'info' => $info,
                ];
            }

            $gridSlots[] = [
                'id_lapangan' => $lap->id_lapangan,
                'nama_lapangan' => $lap->nama_lapangan,
                'harga_per_jam' => $lap->harga_per_jam,
                'status_lapangan' => $lap->status_lapangan,
                'slots' => $lapSlots,
            ];
        }

        
        $daftarReservasi = Reservasi::with([
            'user:id_user,nama,no_whatsapp,jenis_pelanggan',
            'detailReservasi.lapangan:id_lapangan,nama_lapangan',
            'pembayaran',
        ])
            ->whereHas('detailReservasi', function ($q) use ($tanggal) {
                $q->whereDate('tanggal_main', $tanggal);
            })
            ->orderBy('id_reservasi', 'desc')
            ->get()
            ->map(function ($res) use ($tanggal) {
                $totalBayar = $res->pembayaran->sum('jumlah');
                $sisa = max(0, $res->total_biaya - $totalBayar);
                $detail = $res->detailReservasi->first(fn ($d) => $d->tanggal_main == $tanggal) ?? $res->detailReservasi->first();
                $namaTampil = $res->id_user ? ($res->user->nama ?? 'Pelanggan') : ($res->nama_pemesan ?? 'Pelanggan');
                $waTampil = $res->id_user ? ($res->user->no_whatsapp ?? '-') : ($res->no_whatsapp_pemesan ?? '-');
                $jenisPelanggan = $res->id_user ? ($res->user->jenis_pelanggan ?? 'reguler') : 'reguler';

                return [
                    'id_reservasi' => $res->id_reservasi,
                    'id_detail_reservasi' => $detail?->id_detail_reservasi,
                    'id_lapangan' => $detail?->id_lapangan,
                    'tanggal_main' => $detail ? Carbon::parse($detail->tanggal_main)->toDateString() : $tanggal,
                    'pemesan' => [
                        'id_user' => $res->id_user,
                        'nama' => $namaTampil,
                        'no_whatsapp' => $waTampil,
                        'jenis_pelanggan' => $jenisPelanggan,
                    ],
                    'lapangan' => $detail?->lapangan?->nama_lapangan ?? 'Lapangan',
                    'jam_mulai' => $detail ? substr($detail->jam_mulai, 0, 5) : '-',
                    'jam_selesai' => $detail ? substr($detail->jam_selesai, 0, 5) : '-',
                    'total_biaya' => $res->total_biaya,
                    'total_dibayar' => $totalBayar,
                    'sisa_tagihan' => $sisa,
                    'status_pembayaran' => $sisa <= 0 ? 'Lunas' : 'DP',
                    'status_reservasi' => $res->status_reservasi,
                    'bisa_dilunasi' => $sisa > 0 && $res->status_reservasi !== Reservasi::STATUS_BATAL,
                    'bisa_dibatalkan' => $res->status_reservasi === Reservasi::STATUS_TERKONFIRMASI,
                    'bisa_diselesaikan' => $res->status_reservasi === Reservasi::STATUS_TERKONFIRMASI,
                    'bisa_diedit' => $res->status_reservasi === Reservasi::STATUS_TERKONFIRMASI && $jenisPelanggan === 'member',
                ];
            });

        
        $members = User::where('jenis_pelanggan', User::JENIS_PELANGGAN_MEMBER)
            ->where('status_member', User::STATUS_MEMBER_AKTIF)
            ->where('status_akun', User::STATUS_AKUN_AKTIF)
            ->select('id_user', 'nama', 'no_whatsapp', 'tanggal_mulai_member', 'tanggal_akhir_member')
            ->get();

        return Inertia::render('Admin/Reservasi/Index', [
            'tanggal' => $tanggal,
            'tanggalLabel' => $carbonTgl->locale('id')->isoFormat('dddd, D MMMM Y'),
            'prevDate' => $carbonTgl->copy()->subDay()->toDateString(),
            'nextDate' => $carbonTgl->copy()->addDay()->toDateString(),
            'lapangan' => $lapangan,
            'gridSlots' => $gridSlots,
            'daftarReservasi' => $daftarReservasi,
            'members' => $members,
            'operatingHours' => ['start' => '08:00', 'end' => '23:00'],
        ]);
    }

    
    public function storeRegular(StoreRegularReservasiRequest $request)
    {
        $this->reservasiService->createRegularReservasi($request->validated(), $request->user()->id_user);

        return redirect()->back()->with('success', 'Reservasi sewa lapangan berhasil dibuat.');
    }

    
    public function previewAutofield(Request $request): JsonResponse
    {
        $request->validate([
            'id_user' => ['required', 'exists:users,id_user'],
            'id_lapangan' => ['required', 'exists:lapangan,id_lapangan'],
            'hari' => ['required', 'in:0,1,2,3,4,5,6'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'harga_per_sesi' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'jumlah_sesi' => ['nullable'],
        ]);

        $hargaPerSesi = $request->filled('harga_per_sesi') ? (int) $request->harga_per_sesi : null;
        $jumlahSesiInput = $request->input('jumlah_sesi');
        $jumlahSesi = (is_numeric($jumlahSesiInput) && (int) $jumlahSesiInput > 0) ? (int) $jumlahSesiInput : null;

        $preview = $this->reservasiService->previewMemberAutofield(
            (int) $request->id_user,
            (int) $request->id_lapangan,
            (string) $request->hari,
            (string) $request->jam_mulai,
            (string) $request->jam_selesai,
            $hargaPerSesi,
            $jumlahSesi
        );

        return response()->json($preview);
    }

    
    public function storeAutofield(StoreMemberAutofieldRequest $request)
    {
        $reservasi = $this->reservasiService->storeMemberAutofield($request->validated(), $request->user()->id_user);

        $firstDetail = $reservasi->detailReservasi()->orderBy('tanggal_main', 'asc')->first();
        $targetDate = $firstDetail ? Carbon::parse($firstDetail->tanggal_main)->toDateString() : null;

        if ($targetDate) {
            $labelTgl = Carbon::parse($targetDate)->locale('id')->isoFormat('dddd, D MMMM Y');
            $totalPertemuan = $reservasi->detailReservasi()->count();
            return redirect()->to("/admin/reservasi?tanggal={$targetDate}")
                ->with('success', "Paket reservasi rutin member berhasil disimpan untuk {$totalPertemuan} pertemuan (mulai {$labelTgl}).");
        }

        return redirect()->back()->with('success', 'Paket reservasi rutin member berhasil disimpan secara kolektif.');
    }

    
    public function pelunasan(Request $request, int $id)
    {
        $request->validate([
            'jumlah' => ['required', 'integer', 'min:1', 'max:100000000'],
            'metode_pembayaran' => ['required', 'in:tunai,transfer,qris'],
            'keterangan' => ['nullable', 'string', 'max:500'],
        ], [
            'jumlah.required' => 'Nominal pembayaran wajib diisi.',
            'jumlah.integer' => 'Nominal pembayaran harus berupa angka bulat rupiah.',
            'jumlah.min' => 'Nominal harus lebih dari 0.',
            'jumlah.max' => 'Nominal pembayaran melebihi batas wajar.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
        ]);

        $this->reservasiService->lunasiPembayaran($id, $request->only(['jumlah', 'metode_pembayaran', 'keterangan']), $request->user()->id_user);

        return redirect()->back()->with('success', 'Pelunasan sisa pembayaran reservasi berhasil dicatat.');
    }

    
    public function cancel(Request $request, int $id)
    {
        $request->validate([
            'alasan' => ['required', 'string', 'min:3', 'max:500'],
        ], [
            'alasan.required' => 'Alasan pembatalan reservasi wajib diisi.',
            'alasan.min' => 'Alasan pembatalan minimal 3 karakter.',
        ]);

        $this->reservasiService->batalkanReservasi($id, $request->input('alasan'), $request->user()->id_user);

        return redirect()->back()->with('success', 'Reservasi berhasil dibatalkan.');
    }

    
    public function finish(Request $request, int $id)
    {
        $this->reservasiService->selesaikanReservasi($id, $request->user()->id_user);

        return redirect()->back()->with('success', 'Reservasi ditandai selesai bermain.');
    }

    /**
     * Reschedule jadwal reservasi (ubah tanggal, jam, atau lapangan).
     */
    public function reschedule(Request $request, int $id)
    {
        $validated = $request->validate([
            'id_detail_reservasi' => ['nullable', 'integer'],
            'id_lapangan' => ['required', 'integer', 'exists:lapangan,id_lapangan'],
            'tanggal_main' => ['required', 'date'],
            'jam_mulai' => ['required', 'string'],
            'jam_selesai' => ['required', 'string'],
            'alasan' => ['nullable', 'string', 'max:500'],
        ], [
            'id_lapangan.required' => 'Lapangan wajib dipilih.',
            'id_lapangan.exists' => 'Lapangan tidak ditemukan.',
            'tanggal_main.required' => 'Tanggal main baru wajib diisi.',
            'jam_mulai.required' => 'Jam mulai wajib dipilih.',
            'jam_selesai.required' => 'Jam selesai wajib dipilih.',
        ]);

        $this->reservasiService->rescheduleReservasi($id, $validated, $request->user()->id_user);

        return redirect()->back()->with('success', 'Jadwal reservasi berhasil di-reschedule.');
    }

    /**
     * Hapus reservasi dan kembalikan sesi paket member jika ada.
     */
    public function destroy(Request $request, int $id)
    {
        $alasan = $request->input('alasan');
        $this->reservasiService->hapusReservasi($id, $request->user()->id_user, $alasan);

        return redirect()->back()->with('success', 'Reservasi berhasil dihapus dan sesi/slot telah dikembalikan.');
    }

    
    public function searchCustomers(Request $request): JsonResponse
    {
        $query = $request->input('q', '');
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $customers = User::where('role', User::ROLE_USER)
            ->where('status_akun', User::STATUS_AKUN_AKTIF)
            ->where(function ($q) use ($query) {
                $q->where('nama', 'like', "%{$query}%")
                    ->orWhere('no_whatsapp', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id_user', 'nama', 'no_whatsapp', 'jenis_pelanggan', 'status_member', 'tanggal_mulai_member', 'tanggal_akhir_member']);

        return response()->json($customers);
    }

    
    public function quickCustomer(QuickCustomerRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'nama' => $data['nama'],
            'no_whatsapp' => $data['no_whatsapp'],
            'password' => Hash::make(Str::random(64)),
            'role' => User::ROLE_USER,
            'jenis_pelanggan' => $data['jenis_pelanggan'],
            'tanggal_mulai_member' => $data['tanggal_mulai_member'] ?? null,
            'tanggal_akhir_member' => $data['tanggal_akhir_member'] ?? null,
            'status_member' => $data['jenis_pelanggan'] === 'member' ? User::STATUS_MEMBER_AKTIF : User::STATUS_MEMBER_TIDAK_AKTIF,
            'status_akun' => User::STATUS_AKUN_AKTIF,
        ]);

        $this->reservasiService->logAktivitas(
            $request->user()->id_user,
            'TAMBAH_PELANGGAN_CEPAT',
            "Pelanggan #{$user->id_user}",
            "Pendaftaran cepat pelanggan: {$user->nama} ({$user->no_whatsapp}, {$user->jenis_pelanggan})"
        );

        return response()->json([
            'message' => 'Akun pelanggan baru berhasil dibuat.',
            'customer' => $user,
        ]);
    }
}
