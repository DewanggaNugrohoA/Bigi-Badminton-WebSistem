<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi penolakan pengajuan Open Mabar beserta alasan penolakannya.
 * Hak akses: Hanya staf ber-role admin.
 */
class RejectOpenMabarRequest extends FormRequest
{
    /**
     * Otorisasi khusus admin.
     */
    public function authorize(): bool
    {
        $user = $this->user('staff') ?: $this->user();
        return $user !== null && $user->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'alasan' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'alasan.required' => 'Alasan penolakan wajib diisi.',
            'alasan.string' => 'Alasan penolakan harus berupa teks.',
            'alasan.min' => 'Alasan penolakan minimal 5 karakter agar jelas bagi pengaju.',
            'alasan.max' => 'Alasan penolakan maksimal 500 karakter.',
        ];
    }
}
