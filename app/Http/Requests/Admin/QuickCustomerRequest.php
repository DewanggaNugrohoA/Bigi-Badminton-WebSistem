<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi pembuatan kilat akun pelanggan baru dari modal reservasi admin.
 * Hak akses: Hanya staf ber-role admin.
 */
class QuickCustomerRequest extends FormRequest
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
            'nama' => ['required', 'string', 'max:255'],
            'no_whatsapp' => ['required', 'string', 'regex:/^08[0-9]{8,11}$/', 'unique:users,no_whatsapp'],
            'jenis_pelanggan' => ['required', 'in:reguler,member'],
            'tanggal_mulai_member' => ['nullable', 'required_if:jenis_pelanggan,member', 'date'],
            'tanggal_akhir_member' => ['nullable', 'required_if:jenis_pelanggan,member', 'date', 'after:tanggal_mulai_member'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama pelanggan wajib diisi.',
            'no_whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'no_whatsapp.regex' => 'Format nomor WhatsApp harus diawali 08 (10-13 digit).',
            'no_whatsapp.unique' => 'Nomor WhatsApp ini sudah terdaftar di sistem.',
            'jenis_pelanggan.required' => 'Jenis pelanggan wajib dipilih.',
            'tanggal_mulai_member.required_if' => 'Tanggal mulai member wajib diisi untuk member.',
            'tanggal_akhir_member.required_if' => 'Tanggal akhir member wajib diisi untuk member.',
            'tanggal_akhir_member.after' => 'Tanggal akhir member harus sesudah tanggal mulai.',
        ];
    }
}
