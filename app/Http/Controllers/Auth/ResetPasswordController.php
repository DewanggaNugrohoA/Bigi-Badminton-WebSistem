<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Controller untuk alur lupa / reset kata sandi menggunakan OTP WhatsApp.
 */
class ResetPasswordController extends Controller
{
    /**
     * Hash kode OTP dengan HMAC-SHA256 menggunakan app.key agar aman dari kebocoran database.
     */
    protected function hashOtp(string $otp): string
    {
        return hash_hmac('sha256', $otp, (string) config('app.key'));
    }

    /**
     * Tampilkan formulir permintaan lupa kata sandi (input nomor WhatsApp).
     */
    public function showRequestForm()
    {
        return Inertia::render('Auth/LupaPassword');
    }

    /**
     * Proses pengiriman kode OTP reset kata sandi ke nomor WhatsApp pengguna terdaftar.
     */
    public function sendResetOtp(Request $request, WhatsAppService $waService)
    {
        $ipSubmitKey = 'reset_submit_ip:' . $request->ip();
        if (RateLimiter::tooManyAttempts($ipSubmitKey, 15)) {
            $seconds = RateLimiter::availableIn($ipSubmitKey);
            throw ValidationException::withMessages([
                'no_whatsapp' => "Terlalu banyak permintaan dari perangkat ini. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $validated = $request->validate([
            'no_whatsapp' => [
                'required',
                'string',
                'regex:/^08[0-9]{8,11}$/',
            ],
        ], [
            'no_whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'no_whatsapp.regex' => 'Nomor WhatsApp harus diawali 08 dan terdiri dari 10 hingga 13 digit angka.',
        ]);

        $rawPhone = $validated['no_whatsapp'];
        $cleanPhone = preg_replace('/[^0-9]/', '', $rawPhone);
        $noWhatsapp = $cleanPhone;
        $altPhone = '';

        if (str_starts_with($cleanPhone, '0')) {
            $noWhatsapp = '62' . substr($cleanPhone, 1);
            $altPhone = $cleanPhone;
        } elseif (str_starts_with($cleanPhone, '62')) {
            $altPhone = '0' . substr($cleanPhone, 2);
        }

        // Cari user dengan nomor ini (mendukung 08... maupun 628...)
        $user = User::where(function ($query) use ($noWhatsapp, $rawPhone, $altPhone) {
            $query->where('no_whatsapp', $noWhatsapp)
                  ->orWhere('no_whatsapp', $rawPhone);
            if ($altPhone) {
                $query->orWhere('no_whatsapp', $altPhone);
            }
        })->where('role', User::ROLE_USER)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'no_whatsapp' => 'Nomor WhatsApp tidak terdaftar sebagai akun pengguna.',
            ]);
        }

        if ($user->status_akun === 'nonaktif') {
            throw ValidationException::withMessages([
                'no_whatsapp' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
            ]);
        }

        $phoneMinuteKey = 'reset_otp_minute:' . $noWhatsapp;
        $phoneHourKey = 'reset_otp_hour:' . $noWhatsapp;
        $ipHourKey = 'reset_otp_hour_ip:' . $request->ip();

        if (RateLimiter::tooManyAttempts($phoneMinuteKey, 1)) {
            $seconds = RateLimiter::availableIn($phoneMinuteKey);
            throw ValidationException::withMessages([
                'no_whatsapp' => "Tunggu {$seconds} detik sebelum meminta kode OTP kembali.",
            ]);
        }

        if (RateLimiter::tooManyAttempts($phoneHourKey, 5) || RateLimiter::tooManyAttempts($ipHourKey, 10)) {
            $seconds = max(RateLimiter::availableIn($phoneHourKey), RateLimiter::availableIn($ipHourKey));
            throw ValidationException::withMessages([
                'no_whatsapp' => "Batas pengiriman kode verifikasi tercapai. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $token = config('bigi.wa_gateway_token');
        if (empty($token) && ! app()->environment(['local', 'testing'])) {
            throw ValidationException::withMessages([
                'no_whatsapp' => 'Layanan verifikasi WhatsApp belum tersedia, hubungi admin.',
            ]);
        }

        RateLimiter::hit($ipSubmitKey, 3600);
        RateLimiter::hit($phoneMinuteKey, 60);
        RateLimiter::hit($phoneHourKey, 3600);
        RateLimiter::hit($ipHourKey, 3600);

        $otp = sprintf('%06d', random_int(100000, 999999));

        PasswordResetOtp::updateOrCreate(
            ['no_whatsapp' => $noWhatsapp],
            [
                'kode_otp' => $this->hashOtp($otp),
                'expires_at' => Carbon::now()->addMinutes(10),
            ]
        );

        $waService->sendResetPasswordOtp($noWhatsapp, $otp);

        $request->session()->put('reset_no_whatsapp', $noWhatsapp);
        RateLimiter::clear('reset_otp_attempts:' . $noWhatsapp);

        return redirect()->route('password.verifikasi')
            ->with('success', "Kode verifikasi reset kata sandi telah dikirim ke nomor WhatsApp {$rawPhone}.");
    }

    /**
     * Tampilkan formulir verifikasi OTP dan input kata sandi baru.
     */
    public function showResetForm(Request $request)
    {
        $noWhatsapp = $request->session()->get('reset_no_whatsapp') ?: $request->query('no_whatsapp');

        if (! $noWhatsapp) {
            return redirect()->route('password.request')
                ->with('error', 'Silakan masukkan nomor WhatsApp Anda terlebih dahulu.');
        }

        $pending = PasswordResetOtp::where('no_whatsapp', $noWhatsapp)->first();
        if (! $pending) {
            return redirect()->route('password.request')
                ->with('error', 'Sesi reset kata sandi tidak ditemukan atau telah berakhir.');
        }

        return Inertia::render('Auth/LupaPasswordVerifikasi', [
            'no_whatsapp' => $noWhatsapp,
        ]);
    }

    /**
     * Kirim ulang kode OTP reset kata sandi.
     */
    public function resendOtp(Request $request, WhatsAppService $waService)
    {
        $noWhatsapp = $request->input('no_whatsapp') ?: $request->session()->get('reset_no_whatsapp');

        if (! $noWhatsapp) {
            return redirect()->route('password.request')
                ->with('error', 'Nomor tidak ditemukan.');
        }

        $pending = PasswordResetOtp::where('no_whatsapp', $noWhatsapp)->first();
        if (! $pending) {
            return redirect()->route('password.request')
                ->with('error', 'Sesi reset berakhir, silakan ajukan kembali.');
        }

        $phoneMinuteKey = 'reset_otp_minute:' . $noWhatsapp;
        $phoneHourKey = 'reset_otp_hour:' . $noWhatsapp;

        if (RateLimiter::tooManyAttempts($phoneMinuteKey, 1)) {
            $seconds = RateLimiter::availableIn($phoneMinuteKey);
            throw ValidationException::withMessages([
                'kode_otp' => "Tunggu {$seconds} detik sebelum meminta kode baru.",
            ]);
        }

        if (RateLimiter::tooManyAttempts($phoneHourKey, 5)) {
            $seconds = RateLimiter::availableIn($phoneHourKey);
            throw ValidationException::withMessages([
                'kode_otp' => "Batas pengiriman kode tercapai. Coba lagi dalam {$seconds} detik.",
            ]);
        }

        RateLimiter::hit($phoneMinuteKey, 60);
        RateLimiter::hit($phoneHourKey, 3600);

        $otp = sprintf('%06d', random_int(100000, 999999));

        $pending->update([
            'kode_otp' => $this->hashOtp($otp),
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        $waService->sendResetPasswordOtp($noWhatsapp, $otp);
        RateLimiter::clear('reset_otp_attempts:' . $noWhatsapp);

        return back()->with('success', 'Kode verifikasi baru telah dikirim ke nomor WhatsApp Anda.');
    }

    /**
     * Verifikasi kode OTP dan simpan kata sandi baru.
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'no_whatsapp' => ['required', 'string'],
            'kode_otp' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'no_whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'kode_otp.required' => 'Kode verifikasi wajib diisi.',
            'kode_otp.size' => 'Kode verifikasi harus 6 digit angka.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        $rawPhone = $validated['no_whatsapp'];
        $cleanPhone = preg_replace('/[^0-9]/', '', $rawPhone);
        $noWhatsapp = $cleanPhone;
        $altPhone = '';

        if (str_starts_with($cleanPhone, '0')) {
            $noWhatsapp = '62' . substr($cleanPhone, 1);
            $altPhone = $cleanPhone;
        } elseif (str_starts_with($cleanPhone, '62')) {
            $altPhone = '0' . substr($cleanPhone, 2);
        }

        $attemptKey = 'reset_otp_attempts:' . $noWhatsapp;
        $ipVerifyKey = 'reset_verify_ip:' . $request->ip();

        if (RateLimiter::tooManyAttempts($ipVerifyKey, 15)) {
            $seconds = RateLimiter::availableIn($ipVerifyKey);
            throw ValidationException::withMessages([
                'kode_otp' => "Terlalu banyak percobaan dari perangkat ini. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $pending = PasswordResetOtp::where('no_whatsapp', $noWhatsapp)->first();

        if (! $pending || Carbon::parse($pending->expires_at)->isPast()) {
            throw ValidationException::withMessages([
                'kode_otp' => 'Kode verifikasi salah atau telah kedaluwarsa.',
            ]);
        }

        $inputHash = $this->hashOtp($validated['kode_otp']);
        if (! hash_equals($pending->kode_otp, $inputHash)) {
            RateLimiter::hit($ipVerifyKey, 600);
            RateLimiter::hit($attemptKey, 1800);

            if (RateLimiter::attempts($attemptKey) >= 5) {
                $pending->delete();
                RateLimiter::clear($attemptKey);
                $request->session()->forget('reset_no_whatsapp');

                throw ValidationException::withMessages([
                    'kode_otp' => 'Anda telah salah memasukkan kode verifikasi sebanyak 5 kali. Silakan ajukan reset kata sandi kembali.',
                ]);
            }

            $sisa = 5 - RateLimiter::attempts($attemptKey);
            throw ValidationException::withMessages([
                'kode_otp' => "Kode verifikasi salah. Sisa kesempatan: {$sisa} kali.",
            ]);
        }

        RateLimiter::clear($attemptKey);
        RateLimiter::clear($ipVerifyKey);

        $user = User::where(function ($query) use ($noWhatsapp, $rawPhone, $altPhone) {
            $query->where('no_whatsapp', $noWhatsapp)
                  ->orWhere('no_whatsapp', $rawPhone);
            if ($altPhone) {
                $query->orWhere('no_whatsapp', $altPhone);
            }
        })->where('role', User::ROLE_USER)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'no_whatsapp' => 'Pengguna tidak ditemukan.',
            ]);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        $pending->delete();
        $request->session()->forget('reset_no_whatsapp');

        return redirect()->route('login')
            ->with('success', 'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
    }
}
