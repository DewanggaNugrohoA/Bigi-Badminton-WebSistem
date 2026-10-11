<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RejectOpenMabarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
