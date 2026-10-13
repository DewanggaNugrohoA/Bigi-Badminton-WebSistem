<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi pembukaan shift kasir baru.
 * Hak akses: Hanya kasir yang sedang login pada guard staff yang berhak membuka shift.
 */
class BukaShiftRequest extends FormRequest
{
    /**
     * Otorisasi hanya untuk staf ber-role kasir.
     */
    public function authorize(): bool
    {
        return $this->user('staff') !== null && $this->user('staff')->role === 'kasir';
    }

    public function rules(): array
    {
        return [
            'modal_awal' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'modal_awal.required' => 'Kas awal wajib diisi.',
            'modal_awal.integer' => 'Kas awal harus berupa bilangan bulat.',
            'modal_awal.min' => 'Kas awal tidak boleh kurang dari 0.',
        ];
    }
}
