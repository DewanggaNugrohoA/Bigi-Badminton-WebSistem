<?php

namespace App\Http\Requests\Admin;

use App\Models\Lapangan;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi pembuatan reservasi reguler satu sesi oleh admin.
 * Hak akses: Hanya staf ber-role admin.
 */
class StoreRegularReservasiRequest extends FormRequest
{
    /**
     * Otorisasi khusus admin.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'nama_pemesan' => ['required', 'string', 'min:2', 'max:100'],
            'no_whatsapp_pemesan' => ['nullable', 'string', 'max:20'],
            'tanggal_main' => ['required', 'date', 'after_or_equal:today'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'id_lapangan' => ['required', 'exists:lapangan,id_lapangan'],
            'jenis_pembayaran' => ['required', 'in:DP,Lunas'],
            'nominal_dp' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'jumlah_bayar' => ['nullable', 'integer', 'min:1', 'max:100000000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            if ($v->errors()->has('jam_mulai') || $v->errors()->has('jam_selesai') || $v->errors()->has('id_lapangan')) {
                return;
            }

            $lapangan = Lapangan::find($this->input('id_lapangan'));
            if (! $lapangan) {
                return;
            }

            $mulai = Carbon::parse($this->input('jam_mulai'));
            $selesai = Carbon::parse($this->input('jam_selesai'));
            $durasiMenit = (int) $mulai->diffInMinutes($selesai);
            $totalBiaya = \App\Services\ReservasiService::hitungTarifReservasi($durasiMenit);

            $jenis = $this->input('jenis_pembayaran');
            $nominalInput = $this->input('nominal_dp') ?? $this->input('jumlah_bayar');

            if ($jenis === 'DP') {
                if ($nominalInput === null || $nominalInput === '') {
                    $v->errors()->add('nominal_dp', 'Nominal DP wajib diisi.');
                    return;
                }

                $nominal = (int) $nominalInput;
                if ($nominal <= 0) {
                    $v->errors()->add('nominal_dp', 'Nominal harus lebih dari 0.');
                } elseif ($nominal >= $totalBiaya) {
                    $v->errors()->add('nominal_dp', 'Nominal DP harus kurang dari total biaya.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'nama_pemesan.required' => 'Nama pemesan wajib diisi.',
            'nama_pemesan.string' => 'Nama pemesan harus berupa teks.',
            'nama_pemesan.min' => 'Nama pemesan minimal 2 karakter.',
            'nama_pemesan.max' => 'Nama pemesan maksimal 100 karakter.',
            'no_whatsapp_pemesan.max' => 'Nomor WhatsApp maksimal 20 karakter.',
            'id_lapangan.required' => 'Lapangan wajib dipilih.',
            'id_lapangan.exists' => 'Data lapangan tidak valid.',
            'tanggal_main.required' => 'Tanggal main wajib diisi.',
            'tanggal_main.after_or_equal' => 'Tanggal main tidak boleh sebelum hari ini.',
            'jam_mulai.required' => 'Jam mulai wajib diisi.',
            'jam_selesai.required' => 'Jam selesai wajib diisi.',
            'jam_selesai.after' => 'Jam selesai harus lebih akhir dari jam mulai.',
            'jenis_pembayaran.required' => 'Jenis pembayaran (DP atau Lunas) wajib dipilih.',
            'jenis_pembayaran.in' => 'Jenis pembayaran tidak valid (harus DP atau Lunas).',
            'nominal_dp.integer' => 'Nominal pembayaran harus berupa angka bulat rupiah.',
            'nominal_dp.min' => 'Nominal harus lebih dari 0.',
            'nominal_dp.max' => 'Nominal pembayaran melebihi batas wajar.',
            'jumlah_bayar.integer' => 'Nominal pembayaran harus berupa angka bulat rupiah.',
            'jumlah_bayar.min' => 'Nominal harus lebih dari 0.',
            'jumlah_bayar.max' => 'Nominal pembayaran melebihi batas wajar.',
        ];
    }
}
