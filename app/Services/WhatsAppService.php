<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    
    public function sendOtp(string $noWhatsapp, string $otp): bool
    {
        $token = config('bigi.wa_gateway_token') ?: env('WA_GATEWAY_TOKEN');
        $url = config('bigi.wa_gateway_url') ?: env('WA_GATEWAY_URL', 'https://api.fonnte.com/send');
        $provider = config('bigi.wa_gateway_provider') ?: env('WA_GATEWAY_PROVIDER', 'fonnte');

        $pesan = "Halo! Kode verifikasi pendaftaran Bigi Badminton Anda adalah: *{$otp}*.\n\nKode berlaku selama 10 menit. Mohon tidak membagikan kode ini kepada siapapun.";

        
        if (empty($token)) {
            if (app()->environment(['local', 'testing'])) {
                Log::info("[DEV WA OTP] Kirim OTP ke {$noWhatsapp}: {$otp}");
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
                    Log::info("[WA OTP Sent] Berhasil kirim OTP ke {$noWhatsapp}");
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
