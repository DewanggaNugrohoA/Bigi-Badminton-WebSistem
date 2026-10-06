<?php

namespace App\Http\Controllers;

use App\Events\PesanMabarTerkirim;
use App\Models\ChatMabar;
use App\Models\OpenMabar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ChatMabarController extends Controller
{
    /**
     * Tampilkan ruang obrolan mabar dan 50 pesan terakhir.
     */
    public function index(OpenMabar $mabar)
    {
        if ($mabar->status !== OpenMabar::STATUS_DISETUJUI) {
            abort(403, 'Ruang obrolan hanya tersedia untuk jadwal yang telah disetujui.');
        }

        $mabar->load(['user:id_user,nama', 'lapangan:id_lapangan,nama_lapangan']);

        // Mengambil 50 pesan terakhir (diurutkan kronologis: dari lama ke baru)
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

        return Inertia::render('OpenMabar/Chat', [
            'mabar' => $mabar,
            'messages' => $messages,
        ]);
    }

    /**
     * Simpan pesan baru dan broadcast ke pengguna lain.
     */
    public function kirimPesan(Request $request, OpenMabar $mabar)
    {
        if ($mabar->status !== OpenMabar::STATUS_DISETUJUI) {
            abort(403, 'Ruang obrolan hanya tersedia untuk jadwal yang telah disetujui.');
        }

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

        broadcast(new PesanMabarTerkirim($chat))->toOthers();

        if ($request->wantsJson()) {
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
            ]);
        }

        return back()->with('success', 'Pesan berhasil dikirim.');
    }
}
