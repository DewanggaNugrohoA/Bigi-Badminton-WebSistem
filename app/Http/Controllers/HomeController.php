<?php

namespace App\Http\Controllers;

use App\Models\Informasi;
use App\Models\Lapangan;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $lapangan = Lapangan::query()
            ->select('id_lapangan', 'nama_lapangan', 'harga_per_jam', 'status_lapangan', 'keterangan')
            ->orderBy('id_lapangan')
            ->get();

        $informasi = Informasi::query()
            ->where('status', Informasi::STATUS_TERBIT)
            ->latest('tanggal_publikasi')
            ->latest('created_at')
            ->take(3)
            ->get(['id_informasi', 'judul', 'gambar', 'tanggal_publikasi']);

        return Inertia::render('Home', [
            'lapangan' => $lapangan,
            'informasi' => $informasi,
        ]);
    }
}
