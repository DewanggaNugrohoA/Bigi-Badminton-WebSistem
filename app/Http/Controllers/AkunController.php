<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AkunController extends Controller
{
    /**
     * Tampilkan form pengaturan akun.
     */
    public function edit(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Pengaturan/Akun', [
            'user' => [
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'email' => $user->email,
                'no_whatsapp' => $user->no_whatsapp,
                'jenis_pelanggan' => $user->jenis_pelanggan,
                'status_member' => $user->status_member,
            ],
        ]);
    }

    /**
     * Perbarui data profil pengguna (nama, email, no_whatsapp).
     */
    public function updateProfil(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id_user, 'id_user'),
            ],
            'no_whatsapp' => ['required', 'string', 'max:20'],
        ], [
            'nama.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah digunakan oleh akun lain.',
            'no_whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
        ]);

        $user->update($validated);

        return redirect()->route('pengaturan.akun')->with('success', 'Profil Berhasil Diperbarui');
    }

    /**
     * Perbarui kata sandi pengguna.
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ], [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'current_password.current_password' => 'Kata sandi saat ini tidak cocok.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('pengaturan.akun')->with('success', 'Kata sandi berhasil diperbarui');
    }
}
