<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi penambahan paket sesi bermain member baru.
 * Hak akses: Hanya staf ber-role admin.
 */
class StorePaketMemberRequest extends FormRequest
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
            'jenis_paket' => ['nullable', 'string', 'in:bulanan_4x3,bulanan_4x2,pagi_4x3,kustom'],
            'jumlah_sesi' => ['required', 'integer', 'min:1', 'max:200'],
            'durasi_jam_per_sesi' => ['nullable', 'integer', 'min:1', 'max:12'],
            'harga_paket' => ['nullable', 'numeric', 'min:0'],
            'metode_pembayaran' => ['nullable', 'in:tunai,transfer,qris'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_akhir' => ['nullable', 'date', 'after:tanggal_mulai'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'jumlah_sesi.required' => 'Jumlah sesi wajib diisi.',
            'jumlah_sesi.integer' => 'Jumlah sesi harus berupa angka bulat.',
            'jumlah_sesi.min' => 'Jumlah sesi minimal 1.',
            'tanggal_mulai.required' => 'Tanggal mulai paket wajib diisi.',
            'tanggal_mulai.date' => 'Format tanggal mulai tidak valid.',
            'tanggal_akhir.date' => 'Format tanggal akhir tidak valid.',
            'tanggal_akhir.after' => 'Tanggal akhir harus lebih akhir dari tanggal mulai.',
        ];
    }
}
