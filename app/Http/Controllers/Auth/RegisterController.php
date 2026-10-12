<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VerifikasiOtp;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RegisterController extends Controller
{
    
    protected function hashOtp(string $otp): string
    {
        return hash_hmac('sha256', $otp, (string) config('app.key'));
    }

    
    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    
    public function store(Request $request, WhatsAppService $waService)
    {
        $ipSubmitKey = 'register_submit_ip:' . $request->ip();
        if (RateLimiter::tooManyAttempts($ipSubmitKey, 15)) {
            $seconds = RateLimiter::availableIn($ipSubmitKey);
            throw ValidationException::withMessages([
                'no_whatsapp' => "Terlalu banyak permintaan pendaftaran dari perangkat ini. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'no_whatsapp' => [
                'required',
                'string',
                'regex:/^08[0-9]{8,11}$/',
                'unique:users,no_whatsapp',
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'nama.required' => 'Nama lengkap wajib diisi.',
            'no_whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'no_whatsapp.regex' => 'Nomor WhatsApp harus diawali 08 dan terdiri dari 10 hingga 13 digit angka.',
            'no_whatsapp.unique' => 'Nomor WhatsApp ini sudah terdaftar.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        $noWhatsapp = preg_replace('/[^0-9]/', '', $validated['no_whatsapp']);
        if (str_starts_with($noWhatsapp, '0')) {
            $noWhatsapp = '62' . substr($noWhatsapp, 1);
        }

        
        if (User::where('no_whatsapp', $noWhatsapp)->orWhere('no_whatsapp', $validated['no_whatsapp'])->exists()) {
            throw ValidationException::withMessages([
                'no_whatsapp' => 'Nomor WhatsApp ini sudah terdaftar.',
            ]);
        }

        
        $phoneMinuteKey = 'register_otp_minute:' . $noWhatsapp;
        $phoneHourKey = 'register_otp_hour:' . $noWhatsapp;
        $ipHourKey = 'register_otp_hour_ip:' . $request->ip();

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
                'no_whatsapp' => 'Layanan verifikasi belum tersedia, hubungi admin.',
            ]);
        }

        RateLimiter::hit($ipSubmitKey, 3600);
        RateLimiter::hit($phoneMinuteKey, 60);
        RateLimiter::hit($phoneHourKey, 3600);
        RateLimiter::hit($ipHourKey, 3600);

        $otp = sprintf('%06d', random_int(100000, 999999));

        VerifikasiOtp::updateOrCreate(
            ['no_whatsapp' => $noWhatsapp],
            [
                'kode_otp' => $this->hashOtp($otp),
                'nama' => $validated['nama'],
                'password' => Hash::make($validated['password']),
                'expires_at' => Carbon::now()->addMinutes(10),
            ]
        );

        $waService->sendOtp($noWhatsapp, $otp);

        $request->session()->put('pending_no_whatsapp', $noWhatsapp);

        
        RateLimiter::clear('otp_attempts:' . $noWhatsapp);

        $msg = "Kode verifikasi telah dikirim ke nomor WhatsApp {$noWhatsapp}.";

        return redirect()->route('register.verifikasi')->with('success', $msg);
    }

    
    public function verifikasiCreate(Request $request)
    {
        $noWhatsapp = $request->session()->get('pending_no_whatsapp');

        if (! $noWhatsapp) {
            return redirect()->route('register')->with('error', 'Silakan isi form pendaftaran terlebih dahulu.');
        }

        return Inertia::render('Auth/VerifikasiOtp', [
            'no_whatsapp' => $noWhatsapp,
        ]);
    }

    
    public function verifikasiStore(Request $request)
    {
        $validated = $request->validate([
            'no_whatsapp' => ['required', 'string'],
            'kode_otp' => ['required', 'string', 'size:6'],
        ], [
            'kode_otp.required' => 'Kode verifikasi wajib diisi.',
            'kode_otp.size' => 'Kode verifikasi harus 6 digit angka.',
        ]);

        $noWhatsapp = $validated['no_whatsapp'];
        $attemptKey = 'otp_attempts:' . $noWhatsapp;
        $ipVerifyKey = 'verify_otp_ip:' . $request->ip();

        if (RateLimiter::tooManyAttempts($ipVerifyKey, 15)) {
            $seconds = RateLimiter::availableIn($ipVerifyKey);
            throw ValidationException::withMessages([
                'kode_otp' => "Terlalu banyak percobaan verifikasi kode dari perangkat ini. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $pending = VerifikasiOtp::where('no_whatsapp', $noWhatsapp)->first();

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
                $request->session()->forget('pending_no_whatsapp');

                throw ValidationException::withMessages([
                    'kode_otp' => 'Anda telah salah memasukkan kode verifikasi sebanyak 5 kali. Kode telah dibatalkan, silakan lakukan pendaftaran ulang.',
                ]);
            }

            $sisa = 5 - RateLimiter::attempts($attemptKey);
            throw ValidationException::withMessages([
                'kode_otp' => "Kode verifikasi salah. Sisa kesempatan: {$sisa} kali.",
            ]);
        }

        RateLimiter::clear($attemptKey);
        RateLimiter::clear($ipVerifyKey);

        User::create([
            'nama' => $pending->nama,
            'no_whatsapp' => $pending->no_whatsapp,
            'email' => null,
            'password' => $pending->password,
            'role' => 'user',
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
        ]);

        $pending->delete();
        $request->session()->forget('pending_no_whatsapp');

        return redirect()->route('login')->with('success', 'Registrasi dan verifikasi berhasil! Silakan masuk dengan nomor WhatsApp Anda.');
    }

    
    public function kirimUlangOtp(Request $request, WhatsAppService $waService)
    {
        $noWhatsapp = $request->input('no_whatsapp') ?: $request->session()->get('pending_no_whatsapp');

        if (! $noWhatsapp) {
            return redirect()->route('register')->with('error', 'Nomor tidak ditemukan.');
        }

        $pending = VerifikasiOtp::where('no_whatsapp', $noWhatsapp)->first();

        if (! $pending) {
            return redirect()->route('register')->with('error', 'Sesi pendaftaran berakhir, silakan daftar kembali.');
        }

        
        $phoneMinuteKey = 'register_otp_minute:' . $noWhatsapp;
        $phoneHourKey = 'register_otp_hour:' . $noWhatsapp;
        $ipHourKey = 'register_otp_hour_ip:' . $request->ip();

        if (RateLimiter::tooManyAttempts($phoneMinuteKey, 1)) {
            $seconds = RateLimiter::availableIn($phoneMinuteKey);
            return back()->with('error', "Tunggu {$seconds} detik sebelum meminta kode OTP kembali.");
        }

        if (RateLimiter::tooManyAttempts($phoneHourKey, 5) || RateLimiter::tooManyAttempts($ipHourKey, 10)) {
            $seconds = max(RateLimiter::availableIn($phoneHourKey), RateLimiter::availableIn($ipHourKey));
            return back()->with('error', "Batas pengiriman kode verifikasi tercapai. Silakan coba lagi dalam {$seconds} detik.");
        }

        $token = config('bigi.wa_gateway_token');
        if (empty($token) && ! app()->environment(['local', 'testing'])) {
            return back()->with('error', 'Layanan verifikasi belum tersedia, hubungi admin.');
        }

        RateLimiter::hit($phoneMinuteKey, 60);
        RateLimiter::hit($phoneHourKey, 3600);
        RateLimiter::hit($ipHourKey, 3600);

        $otp = sprintf('%06d', random_int(100000, 999999));
        $pending->update([
            'kode_otp' => $this->hashOtp($otp),
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        
        RateLimiter::clear('otp_attempts:' . $noWhatsapp);

        $waService->sendOtp($noWhatsapp, $otp);

        $msg = "Kode verifikasi baru telah dikirim ke nomor WhatsApp Anda.";

        return back()->with('success', $msg);
    }
}