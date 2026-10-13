<?php

namespace App\Http\Requests;

use App\Models\TransaksiPos;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * FormRequest validasi transaksi checkout pembayaran kasir POS.
 * Hak akses: Hanya staf kasir pada guard staff.
 */
class CheckoutPosRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.id_produk' => ['required', 'integer', 'exists:produk,id_produk'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'metode_bayar' => ['required', Rule::in([TransaksiPos::METODE_TUNAI, TransaksiPos::METODE_QRIS])],
            'uang_diterima' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Keranjang belanja tidak boleh kosong.',
            'items.min' => 'Pilih minimal satu produk.',
            'items.*.id_produk.required' => 'Produk wajib dipilih.',
            'items.*.id_produk.exists' => 'Produk yang dipilih tidak ditemukan.',
            'items.*.jumlah.required' => 'Jumlah produk wajib diisi.',
            'items.*.jumlah.min' => 'Jumlah produk minimal 1.',
            'metode_bayar.required' => 'Metode pembayaran wajib dipilih.',
            'metode_bayar.in' => 'Metode pembayaran hanya boleh tunai atau QRIS.',
            'uang_diterima.numeric' => 'Nominal uang diterima harus berupa angka.',
            'uang_diterima.min' => 'Nominal uang diterima tidak valid.',
            'catatan.max' => 'Catatan maksimal 500 karakter.',
        ];
    }
}
