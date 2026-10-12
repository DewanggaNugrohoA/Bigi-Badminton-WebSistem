<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ApproveOpenMabarRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('staff') ?: $this->user();
        return $user !== null && $user->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'id_lapangan' => ['nullable', 'integer', 'exists:lapangan,id_lapangan'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_lapangan.integer' => 'Pilihan lapangan tidak valid.',
            'id_lapangan.exists' => 'Lapangan yang dipilih tidak ditemukan dalam sistem.',
        ];
    }
}
