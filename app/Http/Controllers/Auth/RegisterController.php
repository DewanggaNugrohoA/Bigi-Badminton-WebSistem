<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class RegisterController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'no_whatsapp' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        User::create([
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'no_whatsapp' => $validated['no_whatsapp'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
        ]);

        return redirect('/login')->with('success', 'Registrasi berhasil, silakan masuk.');
    }
}