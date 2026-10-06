<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Auth::validate($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'Email atau kata sandi salah.',
            ]);
        }

        if ($user->status_akun === 'nonaktif') {
            throw ValidationException::withMessages([
                'email' => 'Akun Anda telah dinonaktifkan.',
            ]);
        }

        // Login tanpa remember me
        Auth::login($user, false);
        $request->session()->regenerate();

        // Cek redirect target yang aman
        $target = $request->input('redirect') ?: $request->session()->pull('url.intended');

        if ($this->isValidInternalRedirect($target)) {
            return redirect($target);
        }

        return match ($user->role) {
            'admin' => redirect('/admin'),
            'kasir' => redirect('/kasir'),
            default => redirect('/dashboard'),
        };
    }

    protected function isValidInternalRedirect(?string $target): bool
    {
        if (! $target) {
            return false;
        }

        // Harus diawali persis satu '/' dan bukan '//'
        if (! str_starts_with($target, '/') || str_starts_with($target, '//')) {
            return false;
        }

        // Tidak boleh mengandung backslash (\)
        if (str_contains($target, '\\')) {
            return false;
        }

        // Tidak boleh mengandung karakter newline/kontrol
        if (preg_match('/[\r\n\t\x00-\x1F\x7F]/', $target)) {
            return false;
        }

        // Tidak boleh mengandung skema apapun (misal http:, https:, javascript:)
        if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', ltrim($target, '/')) || preg_match('/:\/\//', $target)) {
            return false;
        }

        return true;
    }

    public function destroy(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}