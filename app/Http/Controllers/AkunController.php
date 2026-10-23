<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetOtp;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AkunController extends Controller
{
    /**
     * Hash kode OTP dengan HMAC-SHA256 menggunakan app.key.
     */
    protected function hashOtp(string $otp): string
    {
        return hash_hmac('sha256', $otp, (string) config('app.key'));
    }
    
    public function edit(Request $request)
    {
        $user = $request->user();

        $noWhatsappTampil = $user->no_whatsapp;
        if ($noWhatsappTampil && str_starts_with($noWhatsappTampil, '62')) {
            $noWhatsappTampil = '0' . substr($noWhatsappTampil, 2);
        } elseif ($noWhatsappTampil && str_starts_with($noWhatsappTampil, '+62')) {
            $noWhatsappTampil = '0' . substr($noWhatsappTampil, 3);
        }

        return Inertia::render('Pengaturan/Akun', [
            'user' => [
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'email' => $user->email,
                'no_whatsapp' => $noWhatsappTampil,
                'foto' => $user->foto,
                'jenis_pelanggan' => $user->jenis_pelanggan,
                'status_member' => $user->status_member,
                'tanggal_mulai_member' => $user->tanggal_mulai_member?->format('Y-m-d'),
                'tanggal_akhir_member' => $user->tanggal_akhir_member?->format('Y-m-d'),
            ],
        ]);
    }

    
    public function updateProfil(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id_user, 'id_user'),
            ],
            'no_whatsapp' => [
                'required',
                'string',
                'regex:/^(\+?62|0)8[0-9]{8,11}$/',
            ],
            'foto' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
        ], [
            'nama.required' => 'Nama wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah digunakan oleh akun lain.',
            'no_whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'no_whatsapp.regex' => 'Nomor WhatsApp harus diawali 08 dan terdiri dari 10 hingga 13 digit angka.',
            'foto.image' => 'File foto profil harus berupa gambar.',
            'foto.mimes' => 'Format foto harus JPG, PNG, GIF, atau WEBP.',
            'foto.max' => 'Ukuran foto profil maksimal 2MB.',
        ]);

        $cleanPhone = preg_replace('/[^0-9]/', '', $validated['no_whatsapp']);
        if (str_starts_with($cleanPhone, '62')) {
            $cleanPhone = '0' . substr($cleanPhone, 2);
        }

        $altPhone = str_starts_with($cleanPhone, '0') ? '62' . substr($cleanPhone, 1) : '';
        $phoneExists = \App\Models\User::where(function ($q) use ($cleanPhone, $altPhone) {
            $q->where('no_whatsapp', $cleanPhone);
            if ($altPhone) {
                $q->orWhere('no_whatsapp', $altPhone);
            }
        })->where('id_user', '!=', $user->id_user)->exists();

        if ($phoneExists) {
            throw ValidationException::withMessages([
                'no_whatsapp' => 'Nomor WhatsApp ini sudah digunakan oleh akun lain.',
            ]);
        }

        if ($request->boolean('hapus_foto')) {
            $dir = \Illuminate\Support\Facades\Storage::disk('public')->path('avatars');
            if (is_dir($dir)) {
                array_map('unlink', glob($dir . DIRECTORY_SEPARATOR . 'avatar_' . $user->id_user . '.*') ?: []);
                clearstatcache();
            }
        }

        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $dir = \Illuminate\Support\Facades\Storage::disk('public')->path('avatars');
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            array_map('unlink', glob($dir . DIRECTORY_SEPARATOR . 'avatar_' . $user->id_user . '.*') ?: []);
            $file->storeAs('avatars', 'avatar_' . $user->id_user . '.' . $ext, 'public');
            clearstatcache();
        }

        $updateData = [
            'nama' => $validated['nama'],
            'no_whatsapp' => $cleanPhone,
        ];
        if (array_key_exists('email', $validated) && $validated['email'] !== null) {
            $updateData['email'] = $validated['email'];
        }

        $user->update($updateData);

        return redirect()->route('pengaturan.akun')->with('success', 'Perubahan berhasil disimpan');
    }

    
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

    /**
     * Kirim kode OTP reset kata sandi ke nomor WhatsApp pengguna yang sedang login.
     */
    public function kirimOtpLupaPassword(Request $request, WhatsAppService $waService)
    {
        $user = $request->user();

        if (! $user->no_whatsapp) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor WhatsApp belum terdaftar di akun Anda.',
                ], 422);
            }
            throw ValidationException::withMessages([
                'otp' => 'Nomor WhatsApp belum terdaftar di akun Anda.',
            ]);
        }

        $rawPhone = $user->no_whatsapp;
        $cleanPhone = preg_replace('/[^0-9]/', '', $rawPhone);
        $noWhatsapp = $cleanPhone;
        if (str_starts_with($cleanPhone, '0')) {
            $noWhatsapp = '62' . substr($cleanPhone, 1);
        }

        $phoneMinuteKey = 'reset_otp_minute:' . $noWhatsapp;
        $phoneHourKey = 'reset_otp_hour:' . $noWhatsapp;
        $ipHourKey = 'reset_otp_hour_ip:' . $request->ip();

        if (RateLimiter::tooManyAttempts($phoneMinuteKey, 1)) {
            $seconds = RateLimiter::availableIn($phoneMinuteKey);
            $msg = "Tunggu {$seconds} detik sebelum meminta kode OTP kembali.";
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $msg], 429);
            }
            throw ValidationException::withMessages(['otp' => $msg]);
        }

        if (RateLimiter::tooManyAttempts($phoneHourKey, 5) || RateLimiter::tooManyAttempts($ipHourKey, 10)) {
            $seconds = max(RateLimiter::availableIn($phoneHourKey), RateLimiter::availableIn($ipHourKey));
            $msg = "Batas pengiriman kode verifikasi tercapai. Silakan coba lagi dalam {$seconds} detik.";
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $msg], 429);
            }
            throw ValidationException::withMessages(['otp' => $msg]);
        }

        $token = config('bigi.wa_gateway_token');
        if (empty($token) && ! app()->environment(['local', 'testing'])) {
            $msg = 'Layanan verifikasi WhatsApp belum tersedia, hubungi admin.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }
            throw ValidationException::withMessages(['otp' => $msg]);
        }

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
        RateLimiter::clear('reset_otp_attempts:' . $noWhatsapp);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Kode OTP berhasil dikirim ke nomor WhatsApp Anda.',
            ]);
        }

        return back()->with('success', 'Kode OTP berhasil dikirim ke nomor WhatsApp Anda.');
    }

    /**
     * Verifikasi kode OTP dan simpan kata sandi baru untuk pengguna yang login.
     */
    public function verifikasiOtpLupaPassword(Request $request)
    {
        $validated = $request->validate([
            'kode_otp' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ], [
            'kode_otp.required' => 'Kode verifikasi wajib diisi.',
            'kode_otp.size' => 'Kode verifikasi harus 6 digit angka.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        $user = $request->user();
        $rawPhone = $user->no_whatsapp;
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

        $pending = PasswordResetOtp::where(function ($q) use ($noWhatsapp, $rawPhone, $altPhone) {
            $q->where('no_whatsapp', $noWhatsapp)
              ->orWhere('no_whatsapp', $rawPhone);
            if ($altPhone) {
                $q->orWhere('no_whatsapp', $altPhone);
            }
        })->first();

        if (! $pending || Carbon::now()->isAfter($pending->expires_at)) {
            if ($pending) {
                $pending->delete();
            }
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

                throw ValidationException::withMessages([
                    'kode_otp' => 'Anda telah salah memasukkan kode verifikasi sebanyak 5 kali. Silakan kirim ulang kode OTP.',
                ]);
            }

            $sisa = 5 - RateLimiter::attempts($attemptKey);
            throw ValidationException::withMessages([
                'kode_otp' => "Kode verifikasi salah. Sisa kesempatan: {$sisa} kali.",
            ]);
        }

        RateLimiter::clear($attemptKey);
        RateLimiter::clear($ipVerifyKey);

        $user->password = Hash::make($validated['password']);
        $user->save();

        $pending->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Kata sandi berhasil diperbarui dengan verifikasi WhatsApp.',
            ]);
        }

        return redirect()->route('pengaturan.akun')
            ->with('success', 'Kata sandi berhasil diperbarui dengan verifikasi WhatsApp.');
    }
}
