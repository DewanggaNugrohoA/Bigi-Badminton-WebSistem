<?php

namespace App\Events;

use App\Models\OpenMabar;
use Carbon\Carbon;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MabarDiajukan implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public OpenMabar $mabar)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.notifikasi'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MabarDiajukan';
    }

    public function broadcastWith(): array
    {
        $this->mabar->loadMissing(['user:id_user,nama,no_whatsapp', 'lapangan:id_lapangan,nama_lapangan']);

        $waktuFormatted = $this->mabar->created_at instanceof Carbon
            ? $this->mabar->created_at->toIso8601String()
            : (string) ($this->mabar->created_at ?? now()->toIso8601String());

        return [
            'id_mabar' => $this->mabar->id_mabar,
            'judul' => $this->mabar->judul,
            'nama_pemohon' => $this->mabar->user?->nama ?? 'Member',
            'no_hp' => $this->mabar->no_hp ?? $this->mabar->user?->no_whatsapp ?? '-',
            'nama_lapangan' => $this->mabar->lapangan?->nama_lapangan ?? 'Lapangan Belum Ditentukan',
            'tanggal' => (string) $this->mabar->tanggal,
            'jam_mulai' => substr((string) $this->mabar->jam_mulai, 0, 5),
            'jam_selesai' => substr((string) $this->mabar->jam_selesai, 0, 5),
            'created_at' => $waktuFormatted,
        ];
    }
}
