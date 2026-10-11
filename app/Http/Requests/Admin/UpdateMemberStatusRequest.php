<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'jenis_pelanggan' => ['required', 'in:member,reguler'],
            'status_member' => ['required', 'in:aktif,tidak_aktif'],
            'tanggal_mulai_member' => ['nullable', 'date'],
            'tanggal_akhir_member' => ['nullable', 'date', 'after:tanggal_mulai_member'],
        ];
    }

    public function messages(): array
    {
        return [
            'jenis_pelanggan.required' => 'Jenis pelanggan wajib dipilih.',
            'jenis_pelanggan.in' => 'Jenis pelanggan harus berupa member atau reguler.',
            'status_member.required' => 'Status member wajib dipilih.',
            'status_member.in' => 'Status member harus aktif atau tidak aktif.',
            'tanggal_mulai_member.date' => 'Format tanggal mulai member tidak valid.',
            'tanggal_akhir_member.date' => 'Format tanggal akhir member tidak valid.',
            'tanggal_akhir_member.after' => 'Tanggal akhir member harus lebih akhir dari tanggal mulai.',
        ];
    }
}
