<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi pembuatan reservasi rutin mingguan member (autofield).
 * Hak akses: Hanya staf ber-role admin.
 */
class StoreMemberAutofieldRequest extends FormRequest
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
            'id_user' => ['required', 'exists:users,id_user'],
            'id_lapangan' => ['required', 'exists:lapangan,id_lapangan'],
            'hari' => ['required', 'in:0,1,2,3,4,5,6'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'harga_per_sesi' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'jumlah_sesi' => ['nullable'],
            'jenis_pembayaran' => ['required', 'in:DP,Lunas'],
            'jumlah_bayar' => ['required', 'integer', 'min:1', 'max:100000000'],
            'metode_pembayaran' => ['required', 'in:tunai,transfer,qris'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            if ($v->errors()->has('id_user') || $v->errors()->has('id_lapangan') || $v->errors()->has('hari') || $v->errors()->has('jam_mulai') || $v->errors()->has('jam_selesai') || $v->errors()->has('harga_per_sesi') || $v->errors()->has('jumlah_bayar')) {
                return;
            }

            try {
                $service = app(\App\Services\ReservasiService::class);
                $hargaPerSesi = $this->filled('harga_per_sesi') ? (int) $this->input('harga_per_sesi') : null;
                $jumlahSesiInput = $this->input('jumlah_sesi');
                $jumlahSesi = (is_numeric($jumlahSesiInput) && (int) $jumlahSesiInput > 0) ? (int) $jumlahSesiInput : null;
                $preview = $service->previewMemberAutofield(
                    (int) $this->input('id_user'),
                    (int) $this->input('id_lapangan'),
                    (string) $this->input('hari'),
                    (string) $this->input('jam_mulai'),
                    (string) $this->input('jam_selesai'),
                    $hargaPerSesi,
                    $jumlahSesi
                );

                $totalBiaya = (int) ($preview['total_biaya'] ?? 0);
                $nominal = (int) $this->input('jumlah_bayar');
                $jenis = $this->input('jenis_pembayaran');

                if ($jenis === 'DP') {
                    if ($nominal <= 0) {
                        $v->errors()->add('jumlah_bayar', 'Nominal harus lebih dari 0.');
                    } elseif ($nominal >= $totalBiaya) {
                        $v->errors()->add('jumlah_bayar', 'Nominal DP harus kurang dari total biaya.');
                    }
                } elseif ($jenis === 'Lunas') {
                    if ($nominal !== $totalBiaya) {
                        $v->errors()->add('jumlah_bayar', 'Nominal pelunasan harus sama dengan total biaya.');
                    }
                }
            } catch (\Throwable $e) {
                
            }
        });
    }

    public function messages(): array
    {
        return [
            'id_user.required' => 'Member wajib dipilih.',
            'id_lapangan.required' => 'Lapangan wajib dipilih.',
            'hari.required' => 'Hari rutin mingguan wajib dipilih.',
            'jam_mulai.required' => 'Jam mulai wajib diisi.',
            'jam_selesai.required' => 'Jam selesai wajib diisi.',
            'jam_selesai.after' => 'Jam selesai harus lebih akhir dari jam mulai.',
            'harga_per_sesi.integer' => 'Harga per sesi harus berupa angka bulat rupiah.',
            'harga_per_sesi.min' => 'Harga per sesi harus lebih dari 0.',
            'harga_per_sesi.max' => 'Harga per sesi melebihi batas wajar.',
            'jenis_pembayaran.required' => 'Jenis pembayaran (DP atau Lunas) wajib dipilih.',
            'jumlah_bayar.required' => 'Nominal pembayaran wajib diisi.',
            'jumlah_bayar.integer' => 'Nominal pembayaran harus berupa angka bulat rupiah.',
            'jumlah_bayar.min' => 'Nominal harus lebih dari 0.',
            'jumlah_bayar.max' => 'Nominal pembayaran melebihi batas wajar.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
        ];
    }
}
