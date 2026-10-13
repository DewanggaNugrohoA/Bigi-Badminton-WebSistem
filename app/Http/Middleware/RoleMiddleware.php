<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware otorisasi berbasis peran (role-based access control).
 *
 * Memeriksa apakah pengguna memiliki role yang diizinkan untuk mengakses rute.
 * Jika role tidak cocok, memicu respon HTTP 403 (bukan redirect diam-diam).
 * Jika akun berstatus 'nonaktif', sesi pengguna langsung dicabut dan dialihkan ke login.
 */
class RoleMiddleware
{
    /**
     * Tangani request masuk dan pastikan role pengguna terdaftar dalam daftar argumen yang diizinkan.
     */
    public function handle(Request $request, Closure $next, string ...$args): Response
    {
        
        $guard = null;
        $roles = [];

        foreach ($args as $arg) {
            if (in_array($arg, ['web', 'staff'], true)) {
                $guard = $arg;
            } else {
                $roles[] = $arg;
            }
        }

        
        if (! $guard) {
            $guard = ($request->is('admin*') || $request->is('kasir*') || $request->is('staff*')) ? 'staff' : 'web';
        }

        $user = $request->user($guard) ?: $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(403, 'Anda tidak memiliki hak akses ke halaman ini.');
        }

        if ($user->status_akun === 'nonaktif') {
            \Illuminate\Support\Facades\Auth::guard($guard)->logout();
            $request->session()->regenerateToken();

            $redirectRoute = in_array($user->role, ['admin', 'kasir'], true) ? 'staff.login' : 'login';

            return redirect()->route($redirectRoute)->withErrors([
                'email' => 'Akun Anda telah dinonaktifkan.',
            ]);
        }

        return $next($request);
    }
}
