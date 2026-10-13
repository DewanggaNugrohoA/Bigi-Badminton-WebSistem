<?php

namespace App\Http\Controllers;

use App\Events\PesanMabarTerkirim;
use App\Models\ChatMabar;
use App\Models\OpenMabar;
use App\Models\PesertaMabar;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatPanelController extends Controller
{
    
    protected function authorizeParticipant(OpenMabar $mabar): void
    {
        if ($mabar->status !== OpenMabar::STATUS_DISETUJUI) {
            abort(403, 'Ruang obrolan hanya tersedia untuk jadwal yang telah disetujui.');
        }

        $userId = Auth::id();
        $isOwner = (int) $mabar->id_user === (int) $userId;
        $isPeserta = PesertaMabar::where('id_mabar', $mabar->id_mabar)
            ->where('id_user', $userId)
            ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR)
            ->exists();

        if (! $isOwner && ! $isPeserta) {
            abort(403, 'Anda bukan peserta aktif atau pembuat jadwal mabar ini.');
        }
    }

    
    public function daftarMabar(): JsonResponse
    {
        $userId = Auth::id();

        $mabarList = OpenMabar::query()
            ->where('status', OpenMabar::STATUS_DISETUJUI)
            ->where(function ($query) use ($userId) {
                $query->where('id_user', $userId)
                    ->orWhereHas('pesertaMabar', function ($sub) use ($userId) {
                        $sub->where('id_user', $userId)
                            ->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
                    });
            })
            ->with(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan'])
            ->withCount(['pesertaMabar as peserta_count' => function ($q) {
                $q->where('status_peserta', PesertaMabar::STATUS_TERDAFTAR);
            }])
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->get();

        $data = $mabarList->map(function (OpenMabar $m) {
            $lastChat = ChatMabar::where('id_mabar', $m->id_mabar)
                ->with('user:id_user,nama')
                ->latest('id_chat')
                ->first();

            return [
                'id_mabar' => $m->id_mabar,
                'judul' => $m->judul,
                'tanggal' => $m->tanggal,
                'jam_mulai' => $m->jam_mulai,
                'jam_selesai' => $m->jam_selesai,
                'kuota' => $m->kuota,
                'peserta_count' => $m->peserta_count,
                'foto' => $m->foto,
                'inisiator' => $m->user?->nama ?? 'Pemain',
                'lapangan' => $m->lapangan?->nama_lapangan,
                'last_message' => $lastChat ? [
                    'pesan' => $lastChat->pesan,
                    'pengirim' => $lastChat->user?->nama ?? 'Pengguna',
                    'waktu' => $lastChat->waktu instanceof Carbon ? $lastChat->waktu->toDateTimeString() : (string) $lastChat->waktu,
                ] : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    
    public function pesan(OpenMabar $mabar): JsonResponse
    {
        $this->authorizeParticipant($mabar);

        $mabar->load(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan']);

        $rawMessages = ChatMabar::where('id_mabar', $mabar->id_mabar)
            ->with('user:id_user,nama')
            ->orderBy('id_chat', 'desc')
            ->take(50)
            ->get()
            ->reverse()
            ->values();

        $messages = $rawMessages->map(function (ChatMabar $chat) {
            $waktuFormatted = $chat->waktu instanceof Carbon
                ? $chat->waktu->toDateTimeString()
                : (string) $chat->waktu;

            return [
                'id' => $chat->id_chat,
                'id_chat' => $chat->id_chat,
                'id_user' => $chat->id_user,
                'id_pengirim' => $chat->id_user,
                'nama_pengirim' => $chat->user?->nama ?? 'Pengguna',
                'pesan' => $chat->pesan,
                'waktu' => $waktuFormatted,
            ];
        });

        return response()->json([
            'status' => 'success',
            'mabar' => [
                'id_mabar' => $mabar->id_mabar,
                'judul' => $mabar->judul,
                'tanggal' => $mabar->tanggal,
                'jam_mulai' => $mabar->jam_mulai,
                'jam_selesai' => $mabar->jam_selesai,
                'kuota' => $mabar->kuota,
                'status' => $mabar->status,
                'foto' => $mabar->foto,
            ],
            'messages' => $messages,
        ]);
    }

    
    public function kirim(Request $request, OpenMabar $mabar): JsonResponse
    {
        $this->authorizeParticipant($mabar);

        $validated = $request->validate([
            'pesan' => ['required', 'string', 'max:500'],
        ], [
            'pesan.required' => 'Pesan tidak boleh kosong.',
            'pesan.max' => 'Pesan tidak boleh lebih dari 500 karakter.',
        ]);

        $chat = ChatMabar::create([
            'id_mabar' => $mabar->id_mabar,
            'id_user' => Auth::id(),
            'pesan' => trim($validated['pesan']),
            'waktu' => Carbon::now(),
        ]);

        $chat->load('user:id_user,nama');

        try {
            broadcast(new PesanMabarTerkirim($chat))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        $waktuFormatted = $chat->waktu instanceof Carbon
            ? $chat->waktu->toDateTimeString()
            : (string) $chat->waktu;

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $chat->id_chat,
                'id_chat' => $chat->id_chat,
                'id_user' => $chat->id_user,
                'id_pengirim' => $chat->id_user,
                'nama_pengirim' => $chat->user?->nama ?? 'Pengguna',
                'pesan' => $chat->pesan,
                'waktu' => $waktuFormatted,
            ],
        ], 201);
    }
}
