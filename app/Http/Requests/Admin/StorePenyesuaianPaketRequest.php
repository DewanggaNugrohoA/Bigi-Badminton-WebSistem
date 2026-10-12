<?php

namespace App\Http\Requests\Admin;

use App\Models\PaketMember;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class StorePenyesuaianPaketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('jenis')) {
            $jenis = $this->input('jenis');
            $jumlah = $this->input('jumlah');

            if (is_numeric($jumlah) && (int) $jumlah > 0) {
                $selisih = $jenis === 'pemakaian' ? -abs((int) $jumlah) : abs((int) $jumlah);
                $this->merge(['selisih' => $selisih]);
            }

            // Tanggal main disimpan terpisah, tidak diselipkan ke catatan/alasan
            $tanggal = $this->input('tanggal_main', $this->input('tanggal'));
            if ($tanggal) {
                $this->merge(['tanggal_main' => $tanggal]);
            }

            if (! $this->filled('alasan')) {
                $catatan = $this->input('catatan');
                if ($catatan) {
                    $alasan = $catatan;
                } else {
                    $alasan = $jenis === 'pemakaian' ? 'Pemakaian sesi' : 'Penambahan sesi';
                }
                $this->merge(['alasan' => $alasan]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'selisih' => ['required', 'integer', 'not_in:0', 'min:-100', 'max:100'],
            'tanggal_main' => ['nullable', 'date'],
            'alasan' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'selisih.required' => 'Jumlah penyesuaian sesi wajib ditentukan.',
            'selisih.not_in' => 'Jumlah sesi tidak boleh nol.',
            'selisih.min' => 'Pengurangan sesi maksimal 100 sesi.',
            'selisih.max' => 'Penambahan sesi maksimal 100 sesi.',
            'tanggal_main.date' => 'Format tanggal main tidak valid.',
            'alasan.required' => 'Alasan atau catatan penyesuaian wajib diisi.',
            'alasan.min' => 'Alasan minimal 3 karakter.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $paketId = (int) $this->route('paket');
            $paket = PaketMember::find($paketId);

            if (! $paket) {
                $v->errors()->add('paket', 'Paket member tidak ditemukan.');
                return;
            }

            $today = Carbon::today('Asia/Jakarta');
            $isExpired = $paket->tanggal_akhir && Carbon::parse($paket->tanggal_akhir)->startOfDay()->lt($today);
            $isCanceled = $paket->status === PaketMember::STATUS_DIBATALKAN;
            $isNotActive = $paket->status !== PaketMember::STATUS_AKTIF;

            if ($isCanceled || $isNotActive || $isExpired) {
                $v->errors()->add('paket', 'Tidak dapat melakukan penyesuaian pada paket yang tidak aktif, kedaluwarsa, atau telah dibatalkan.');
                return;
            }

            // Jika pemakaian, pastikan tidak melebihi sisa sesi
            $selisih = (int) $this->input('selisih');
            if ($selisih < 0) {
                $jumlahPemakaian = abs($selisih);
                if ($jumlahPemakaian > $paket->sisa_sesi) {
                    $msg = "Jumlah pemakaian ({$jumlahPemakaian} sesi) tidak boleh melebihi sisa sesi ({$paket->sisa_sesi} sesi).";
                    $v->errors()->add('jumlah', $msg);
                    $v->errors()->add('selisih', $msg);
                }
            }
        });
    }
}
