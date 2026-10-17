<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Kirim kode OTP untuk pendaftaran akun baru.
     */
    public function sendOtp(string $noWhatsapp, string $otp): bool
    {
        $pesan = "Halo! Kode verifikasi pendaftaran Bigi Badminton Anda adalah: *{$otp}*.\n\nKode berlaku selama 10 menit. Mohon tidak membagikan kode ini kepada siapapun.";
        return $this->sendRawMessage($noWhatsapp, $pesan, $otp);
    }

    /**
     * Kirim kode OTP untuk reset / lupa kata sandi.
     */
    public function sendResetPasswordOtp(string $noWhatsapp, string $otp): bool
    {
        $pesan = "Halo! Kode verifikasi reset kata sandi Bigi Badminton Anda adalah: *{$otp}*.\n\nKode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.";
        return $this->sendRawMessage($noWhatsapp, $pesan, $otp);
    }

    /**
     * Pengiriman pesan WhatsApp raw via gateway (Fonnte / generic).
     */
    public function sendRawMessage(string $noWhatsapp, string $pesan, ?string $otpForLog = null): bool
    {
        $token = config('bigi.wa_gateway_token') ?: env('WA_GATEWAY_TOKEN');
        $url = config('bigi.wa_gateway_url') ?: env('WA_GATEWAY_URL', 'https://api.fonnte.com/send');
        $provider = config('bigi.wa_gateway_provider') ?: env('WA_GATEWAY_PROVIDER', 'fonnte');

        if (empty($token)) {
            if (app()->environment(['local', 'testing'])) {
                $logContent = $otpForLog ? "OTP: {$otpForLog}" : "Pesan: {$pesan}";
                Log::info("[DEV WA OTP] Kirim ke {$noWhatsapp}: {$logContent}");
                return true;
            }

            Log::error("[WA OTP Error] Gateway token belum dikonfigurasi.");
            return false;
        }

        try {
            if ($provider === 'fonnte') {
                $response = Http::timeout(10)
                    ->withHeaders([
                        'Authorization' => $token,
                    ])
                    ->post($url, [
                        'target' => $noWhatsapp,
                        'message' => $pesan,
                        'countryCode' => '62',
                    ]);

                if ($response->successful()) {
                    Log::info("[WA OTP Sent] Berhasil kirim pesan ke {$noWhatsapp}");
                    return true;
                }

                Log::warning("[WA OTP Fonnte Error] Gagal kirim: " . $response->body());
                return false;
            }

            $response = Http::timeout(10)
                ->withHeaders([
                    'Authorization' => $token,
                ])
                ->post($url, [
                    'phone' => $noWhatsapp,
                    'message' => $pesan,
                ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("[WA OTP Exception] Error: " . $e->getMessage());
            return false;
        }
    }
}
