<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi alasan pembatalan paket member aktif.
 * Hak akses: Hanya admin yang berhak membatalkan paket member.
 */
class CancelPaketMemberRequest extends FormRequest
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
            'alasan' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'alasan.required' => 'Alasan pembatalan paket wajib diisi.',
            'alasan.min' => 'Alasan minimal 3 karakter.',
        ];
    }
}
