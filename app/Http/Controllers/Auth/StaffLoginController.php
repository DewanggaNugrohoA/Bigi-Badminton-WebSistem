<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StaffLoginRequest;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller autentikasi khusus staf internal (Admin & Kasir).
 *
 * Menerapkan rate limiting ketat (maksimal 5 kegagalan per email/IP)
 * untuk memitigasi serangan brute force. Kegagalan berulang dicatat ke audit_log.
 * Akses role kasir yang nonaktif ditolak dan tidak boleh masuk sistem.
 */
class StaffLoginController extends Controller
{
    /**
     * Tampilkan formulir login khusus staf/karyawan.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/StaffLogin');
    }

    /**
     * Proses otentikasi staf, validasi password hash, verifikasi status akun, dan buat sesi guard staff.
     */
    public function store(StaffLoginRequest $request)
    {
        $throttleKey = $this->throttleKey($request);

        
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            
            $existingUser = User::where('email', $request->email)->first();
            if ($existingUser) {
                $this->writeAuditLog(
                    $existingUser->id_user,
                    'LOGIN_GAGAL_LOCKOUT',
                    'Akun Staf',
                    "Percobaan login melebihi batas (5x). Terkunci selama {$seconds} detik dari IP: {$request->ip()}"
                );
            }

            throw ValidationException::withMessages([
                'email' => "Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        
        
        $genericError = 'Email atau kata sandi salah.';

        if (
            ! $user ||
            ! Hash::check($request->password, $user->password) ||
            ! in_array($user->role, [User::ROLE_ADMIN, User::ROLE_KASIR], true)
        ) {
            RateLimiter::hit($throttleKey, 60); 

            throw ValidationException::withMessages([
                'email' => $genericError,
            ]);
        }

        
        if ($user->status_akun === User::STATUS_AKUN_NONAKTIF) {
            RateLimiter::hit($throttleKey, 60);

            $this->writeAuditLog(
                $user->id_user,
                'LOGIN_STAF_DITOLAK',
                'Akun Staf Nonaktif',
                "Percobaan login pada akun yang dinonaktifkan dari IP: {$request->ip()}"
            );

            throw ValidationException::withMessages([
                'email' => 'Akun staf tidak aktif. Silakan hubungi administrator.',
            ]);
        }

        
        RateLimiter::clear($throttleKey);

        $remember = (bool) $request->boolean('remember', false);
        Auth::guard('staff')->login($user, $remember);

        
        $request->session()->regenerate();

        
        $this->writeAuditLog(
            $user->id_user,
            'LOGIN_STAF_SUKSES',
            'Sesi Staf',
            "Staf {$user->nama} ({$user->role}) berhasil masuk dari IP: {$request->ip()}"
        );

        
        return match ($user->role) {
            User::ROLE_ADMIN => redirect()->intended('/admin'),
            User::ROLE_KASIR => redirect()->intended('/kasir'),
            default => redirect('/'),
        };
    }

    
    public function destroy(Request $request)
    {
        $user = $request->user('staff');

        if ($user) {
            $this->writeAuditLog(
                $user->id_user,
                'LOGOUT_STAF',
                'Sesi Staf',
                "Staf {$user->nama} ({$user->role}) telah keluar dari sistem."
            );
        }

        Auth::guard('staff')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/staff/login')->with('success', 'Anda telah berhasil keluar.');
    }

    
    protected function throttleKey(Request $request): string
    {
        return Str::transliterate(Str::lower($request->input('email')).'|'.$request->ip());
    }

    
    protected function writeAuditLog(int $idUser, string $aksi, string $objek, string $keterangan): void
    {
        AuditLog::create([
            'id_user' => $idUser,
            'aksi' => $aksi,
            'objek' => $objek,
            'keterangan' => $keterangan,
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);
    }
}
