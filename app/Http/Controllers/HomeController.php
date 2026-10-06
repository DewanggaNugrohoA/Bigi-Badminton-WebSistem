<?php

namespace App\Http\Controllers;

use App\Models\Informasi;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $informasi = Informasi::query()
            ->where('status', Informasi::STATUS_TERBIT)
            ->latest('tanggal_publikasi')
            ->latest('created_at')
            ->take(3)
            ->get(['id_informasi', 'judul', 'gambar', 'tanggal_publikasi']);

        return Inertia::render('Home', [
            'informasi' => $informasi,
        ]);
    }
}
