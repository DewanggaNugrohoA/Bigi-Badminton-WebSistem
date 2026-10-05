<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class KasirController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Kasir/Dashboard', [
            'user' => $request->user(),
        ]);
    }
}
