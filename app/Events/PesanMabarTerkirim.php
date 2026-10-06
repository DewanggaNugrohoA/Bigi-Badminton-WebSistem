<?php

namespace App\Events;

use App\Models\ChatMabar;
use Carbon\Carbon;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PesanMabarTerkirim implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChatMabar $chat)
    {
    }

    /**
     * Channel siaran privat mabar.{id_mabar}.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('mabar.' . $this->chat->id_mabar),
        ];
    }

    /**
     * Nama siaran event.
     */
    public function broadcastAs(): string
    {
        return 'PesanMabarTerkirim';
    }

    /**
     * Payload siaran: id, nama pengirim, id pengirim, pesan, waktu.
     */
    public function broadcastWith(): array
    {
        $waktuFormatted = $this->chat->waktu instanceof Carbon
            ? $this->chat->waktu->toDateTimeString()
            : (string) $this->chat->waktu;

        return [
            'id' => $this->chat->id_chat,
            'id_chat' => $this->chat->id_chat,
            'id_user' => $this->chat->id_user,
            'id_pengirim' => $this->chat->id_user,
            'nama_pengirim' => $this->chat->user?->nama ?? 'Pengguna',
            'pesan' => $this->chat->pesan,
            'waktu' => $waktuFormatted,
        ];
    }
}
