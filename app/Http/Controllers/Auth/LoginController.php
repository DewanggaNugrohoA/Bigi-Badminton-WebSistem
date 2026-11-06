<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
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
        $request->validate([
            'no_whatsapp' => [
                $request->filled('email') ? 'nullable' : 'required',
                'string',
                $request->filled('email') ? 'nullable' : 'regex:/^08[0-9]{8,11}$/',
            ],
            'email' => ['nullable', 'string'],
            'password' => ['required', 'string'],
        ], [
            'no_whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'no_whatsapp.regex' => 'Nomor WhatsApp harus diawali 08 dan terdiri dari 10 hingga 13 digit angka.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $identifier = $request->input('no_whatsapp') ?: $request->input('email');

        if (! $identifier) {
            throw ValidationException::withMessages([
                'no_whatsapp' => 'Nomor WhatsApp wajib diisi.',
            ]);
        }

        $errorField = $request->filled('no_whatsapp') && ! $request->filled('email') ? 'no_whatsapp' : 'email';

        
        $cleanPhone = preg_replace('/[^0-9]/', '', $identifier);
        $altPhone = '';
        if (str_starts_with($cleanPhone, '0')) {
            $altPhone = '62' . substr($cleanPhone, 1);
        } elseif (str_starts_with($cleanPhone, '62')) {
            $altPhone = '0' . substr($cleanPhone, 2);
        }

        $ipThrottleKey = 'login_ip:' . $request->ip();
        $identifierThrottleKey = 'login_identifier:' . Str::lower($cleanPhone ?: $identifier) . '|' . $request->ip();

        
        if (RateLimiter::tooManyAttempts($ipThrottleKey, 15)) {
            $seconds = RateLimiter::availableIn($ipThrottleKey);
            throw ValidationException::withMessages([
                $errorField => "Terlalu banyak percobaan masuk dari perangkat ini. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        if (RateLimiter::tooManyAttempts($identifierThrottleKey, 5)) {
            $seconds = RateLimiter::availableIn($identifierThrottleKey);
            throw ValidationException::withMessages([
                $errorField => "Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $user = User::where('email', $identifier)
            ->orWhere('no_whatsapp', $identifier)
            ->when($cleanPhone, fn ($q) => $q->orWhere('no_whatsapp', $cleanPhone))
            ->when($altPhone, fn ($q) => $q->orWhere('no_whatsapp', $altPhone))
            ->first();

        
        if (! $user || ! Hash::check($request->password, $user->password) || $user->role !== User::ROLE_USER) {
            RateLimiter::hit($ipThrottleKey, 300);
            RateLimiter::hit($identifierThrottleKey, 300);

            throw ValidationException::withMessages([
                $errorField => 'Nomor WhatsApp/Email atau kata sandi salah.',
            ]);
        }

        if ($user->status_akun === 'nonaktif') {
            throw ValidationException::withMessages([
                $errorField => 'Akun Anda telah dinonaktifkan.',
            ]);
        }

        RateLimiter::clear($ipThrottleKey);
        RateLimiter::clear($identifierThrottleKey);

        
        Auth::login($user, false);
        $request->session()->regenerate();

        \App\Models\AuditLog::create([
            'id_user' => $user->id_user,
            'role' => $user->role,
            'aksi' => 'LOGIN_USER_SUKSES',
            'objek' => 'Sesi Pengguna',
            'modul' => 'auth',
            'keterangan' => "Pengguna {$user->nama} berhasil masuk dari IP: {$request->ip()}",
            'ip_address' => $request->ip(),
            'waktu' => \Carbon\Carbon::now('Asia/Jakarta'),
        ]);

        
        $target = $request->input('redirect') ?: $request->session()->pull('url.intended');

        if ($this->isValidInternalRedirect($target)) {
            return redirect($target);
        }

        return redirect('/');
    }

    protected function isValidInternalRedirect(?string $target): bool
    {
        if (! $target) {
            return false;
        }

        
        if (! str_starts_with($target, '/') || str_starts_with($target, '//')) {
            return false;
        }

        
        if (str_contains($target, '\\')) {
            return false;
        }

        
        if (preg_match('/[\r\n\t\x00-\x1F\x7F]/', $target)) {
            return false;
        }

        
        if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', ltrim($target, '/')) || preg_match('/:\/\//', $target)) {
            return false;
        }

        return true;
    }

    public function destroy(Request $request)
    {
        $user = $request->user('web') ?: $request->user();
        if ($user) {
            \App\Models\AuditLog::create([
                'id_user' => $user->id_user,
                'role' => $user->role,
                'aksi' => 'LOGOUT_USER',
                'objek' => 'Sesi Pengguna',
                'modul' => 'auth',
                'keterangan' => "Pengguna {$user->nama} telah keluar dari sistem.",
                'ip_address' => $request->ip(),
                'waktu' => \Carbon\Carbon::now('Asia/Jakarta'),
            ]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}