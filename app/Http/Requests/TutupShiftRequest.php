<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TutupShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('staff') !== null && $this->user('staff')->role === 'kasir';
    }

    public function rules(): array
    {
        return [
            'kas_fisik' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'kas_fisik.required' => 'Kas hitung fisik wajib diisi.',
            'kas_fisik.integer' => 'Kas hitung fisik harus berupa bilangan bulat.',
            'kas_fisik.min' => 'Kas hitung fisik tidak boleh kurang dari 0.',
        ];
    }
}
