<?php

namespace App\Http\Requests;

use App\Models\ReturVoid;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * FormRequest validasi pengajuan pembatalan (void) atau retur barang transaksi POS.
 * Hak akses: Hanya staf ber-role kasir pada guard staff.
 */
class VoidReturRequest extends FormRequest
{
    /**
     * Otorisasi hanya untuk kasir.
     */
    public function authorize(): bool
    {
        return $this->user('staff') !== null && $this->user('staff')->role === 'kasir';
    }

    public function rules(): array
    {
        return [
            'id_transaksi' => ['required', 'integer', 'exists:transaksi_pos,id_transaksi'],
            'jenis' => ['required', Rule::in([ReturVoid::JENIS_VOID, ReturVoid::JENIS_RETUR])],
            'alasan' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_transaksi.required' => 'Transaksi wajib dipilih.',
            'id_transaksi.exists' => 'Transaksi tidak ditemukan.',
            'jenis.required' => 'Jenis pembatalan wajib dipilih.',
            'jenis.in' => 'Jenis pembatalan hanya boleh void atau retur.',
            'alasan.required' => 'Alasan wajib diisi.',
            'alasan.min' => 'Alasan minimal 5 karakter.',
            'alasan.max' => 'Alasan maksimal 500 karakter.',
        ];
    }
}
