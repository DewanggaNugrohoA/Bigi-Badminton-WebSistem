<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StorePenyesuaianPaketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'selisih' => ['required', 'integer', 'not_in:0'],
            'alasan' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'selisih.required' => 'Nilai penyesuaian sesi wajib diisi.',
            'selisih.integer' => 'Nilai penyesuaian harus berupa angka bulat (+ atau -).',
            'selisih.not_in' => 'Nilai penyesuaian tidak boleh 0.',
            'alasan.required' => 'Alasan penyesuaian wajib dicatat.',
            'alasan.min' => 'Alasan minimal 3 karakter.',
        ];
    }
}
