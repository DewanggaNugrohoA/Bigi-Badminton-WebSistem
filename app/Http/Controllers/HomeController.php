<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $avatarDir = Storage::disk('public')->path('avatars');
        $userIds = [];

        if (is_dir($avatarDir)) {
            $files = glob($avatarDir . DIRECTORY_SEPARATOR . 'avatar_*.*');
            if (!empty($files)) {
                // Urutkan berdasarkan waktu modifikasi terbaru agar foto terbaru muncul duluan
                usort($files, function ($a, $b) {
                    return filemtime($b) <=> filemtime($a);
                });

                foreach ($files as $file) {
                    if (preg_match('/avatar_(\d+)\./', basename($file), $matches)) {
                        $userIds[] = (int) $matches[1];
                    }
                }
            }
        }

        $communityMembers = [];
        if (!empty($userIds)) {
            $users = User::whereIn('id_user', $userIds)
                ->where('status_akun', 'aktif')
                ->select('id_user', 'nama', 'jenis_pelanggan')
                ->get()
                ->keyBy('id_user');

            // Susun sesuai urutan userIds (terbaru)
            foreach ($userIds as $uid) {
                if (isset($users[$uid])) {
                    $u = $users[$uid];
                    $fotoUrl = $u->foto;
                    if ($fotoUrl) {
                        $communityMembers[] = [
                            'id_user' => $u->id_user,
                            'name' => $u->nama,
                            'role' => $u->jenis_pelanggan === 'member' ? 'Member Bigi' : 'Pemain Komunitas',
                            'img' => $fotoUrl,
                        ];
                    }
                }
            }
        }

        // Query user yang sudah join sebagai member Bigi Badminton aktif
        $realMembers = User::where('jenis_pelanggan', 'member')
            ->where('status_akun', 'aktif')
            ->where('status_member', 'aktif')
            ->select('id_user', 'nama', 'jenis_pelanggan', 'status_member')
            ->latest('tanggal_mulai_member')
            ->take(5)
            ->get()
            ->map(function ($u) {
                return [
                    'id_user' => $u->id_user,
                    'nama' => $u->nama,
                    'foto' => $u->foto,
                ];
            })
            ->values()
            ->toArray();

        $totalMemberCount = User::where('jenis_pelanggan', 'member')
            ->where('status_akun', 'aktif')
            ->where('status_member', 'aktif')
            ->count();

        // Sample avatar pelengkap jika jumlah member di database masih di bawah 3
        $sampleMembers = [
            ['id_user' => 991, 'nama' => 'Hendra Setiawan', 'foto' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'],
            ['id_user' => 992, 'nama' => 'Greysia Polii', 'foto' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'],
            ['id_user' => 993, 'nama' => 'Fajar Alfian', 'foto' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces'],
        ];

        $bigiMembers = $realMembers;
        if (count($bigiMembers) < 3) {
            foreach ($sampleMembers as $sample) {
                if (count($bigiMembers) >= 3) break;
                $bigiMembers[] = $sample;
            }
        }

        return Inertia::render('Home', [
            'communityMembers' => $communityMembers,
            'bigiMembers' => $bigiMembers,
            'totalMemberCount' => max($totalMemberCount, 50),
        ]);
    }
}
