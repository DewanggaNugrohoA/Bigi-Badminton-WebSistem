<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class BuatAdminCommand extends Command
{
    
    protected $signature = 'bigi:buat-admin {--role=admin : Peran staf (admin atau kasir)} {--force : Jalankan paksa di lingkungan produksi}';

    
    protected $description = 'Buat akun staf administratif (Admin atau Kasir) secara aman dan interaktif';

    
    public function handle(): int
    {
        $roleOption = strtolower($this->option('role') ?: 'admin');
        if (! in_array($roleOption, ['admin', 'kasir'], true)) {
            $this->error("Pilihan --role tidak valid. Gunakan 'admin' atau 'kasir'.");
            return self::FAILURE;
        }

        
        if (app()->environment('production') && ! $this->option('force')) {
            if (! $this->confirm('Aplikasi berada di lingkungan PRODUKSI. Lanjutkan pembuatan staf?')) {
                $this->warn('Operasi dibatalkan.');
                return self::FAILURE;
            }
        }

        $this->info("=== Pembuatan Akun Staf (" . strtoupper($roleOption) . ") ===");

        $nama = $this->ask('Masukkan Nama Lengkap Staf');
        while (empty(trim($nama))) {
            $this->error('Nama lengkap tidak boleh kosong.');
            $nama = $this->ask('Masukkan Nama Lengkap Staf');
        }

        $email = $this->ask('Masukkan Alamat Email Staf');
        $validator = Validator::make(['email' => $email], [
            'email' => ['required', 'email', 'unique:users,email'],
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar di sistem.',
        ]);

        while ($validator->fails()) {
            $this->error($validator->errors()->first('email'));
            $email = $this->ask('Masukkan Alamat Email Staf');
            $validator = Validator::make(['email' => $email], [
                'email' => ['required', 'email', 'unique:users,email'],
            ]);
        }
        $email = strtolower(trim($email));

        $password = $this->secret('Masukkan Kata Sandi (Minimal 10 karakter, harus ada huruf dan angka)');
        $passwordConfirm = $this->secret('Ulangi Kata Sandi');

        while (! $this->validatePassword($password, $passwordConfirm)) {
            $password = $this->secret('Masukkan Kata Sandi Baru (Minimal 10 karakter, harus ada huruf dan angka)');
            $passwordConfirm = $this->secret('Ulangi Kata Sandi Baru');
        }

        $noWhatsapp = $this->ask('Masukkan Nomor WhatsApp Staf (Format 08...)');
        $cleanPhone = preg_replace('/[^0-9]/', '', (string) $noWhatsapp);

        while (empty($cleanPhone) || ! preg_match('/^08[0-9]{8,11}$/', $cleanPhone) || User::where('no_whatsapp', $cleanPhone)->exists()) {
            if (empty($cleanPhone)) {
                $this->error('Nomor WhatsApp wajib diisi.');
            } elseif (! preg_match('/^08[0-9]{8,11}$/', $cleanPhone)) {
                $this->error('Format nomor WhatsApp tidak valid. Harus berawalan 08 dengan panjang 10-13 digit angka.');
            } else {
                $this->error('Nomor WhatsApp ini sudah terdaftar di sistem.');
            }
            $noWhatsapp = $this->ask('Masukkan Nomor WhatsApp Staf (Format 08...)');
            $cleanPhone = preg_replace('/[^0-9]/', '', (string) $noWhatsapp);
        }
        $noWhatsapp = $cleanPhone;

        $user = User::create([
            'nama' => trim($nama),
            'email' => $email,
            'no_whatsapp' => $noWhatsapp,
            'password' => Hash::make($password),
            'role' => $roleOption,
            'jenis_pelanggan' => 'reguler',
            'status_member' => 'tidak_aktif',
            'status_akun' => 'aktif',
        ]);

        AuditLog::create([
            'id_user' => $user->id_user,
            'aksi' => 'BUAT_STAF_CLI',
            'objek' => 'Akun Staf',
            'keterangan' => "Pembuatan akun staf via Artisan: {$user->nama} ({$user->email}, role: {$user->role})",
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);

        $this->info("Berhasil membuat akun staf {$user->role}: {$user->nama} ({$user->email}) [ID: {$user->id_user}]");

        return self::SUCCESS;
    }

    
    protected function validatePassword(?string $password, ?string $confirmation): bool
    {
        if (empty($password)) {
            $this->error('Kata sandi tidak boleh kosong.');
            return false;
        }

        if (strlen($password) < 10) {
            $this->error('Kata sandi minimal 10 karakter.');
            return false;
        }

        if (! preg_match('/[A-Za-z]/', $password) || ! preg_match('/[0-9]/', $password)) {
            $this->error('Kata sandi harus mengandung kombinasi huruf dan angka.');
            return false;
        }

        if ($password !== $confirmation) {
            $this->error('Konfirmasi kata sandi tidak cocok.');
            return false;
        }

        return true;
    }
}
