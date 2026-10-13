<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware injeksi HTTP security response headers.
 *
 * Mengamankan aplikasi dari clickjacking (X-Frame-Options: SAMEORIGIN),
 * MIME-sniffing drive-by downloads (X-Content-Type-Options: nosniff),
 * dan pembocoran data sensitif referrer (Referrer-Policy: strict-origin-when-cross-origin).
 */
class SecurityHeadersMiddleware
{
    /**
     * Sisipkan header keamanan HTTP standar pada setiap respon keluar.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return $response;
    }
}
