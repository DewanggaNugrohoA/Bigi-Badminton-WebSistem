<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class RestockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('staff') !== null && $this->user('staff')->role === 'kasir';
    }

    public function rules(): array
    {
        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');

        return [
            'id_produk' => ['required', 'integer', 'exists:produk,id_produk'],
            'jumlah' => ['required', 'integer', 'min:1'],
            'tanggal' => ['required', 'date', 'before_or_equal:' . $today],
            'keterangan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_produk.required' => 'Produk wajib dipilih.',
            'id_produk.exists' => 'Produk tidak ditemukan.',
            'jumlah.required' => 'Jumlah restock wajib diisi.',
            'jumlah.integer' => 'Jumlah restock harus berupa bilangan bulat.',
            'jumlah.min' => 'Jumlah restock minimal 1.',
            'tanggal.required' => 'Tanggal restock wajib diisi.',
            'tanggal.date' => 'Format tanggal tidak valid.',
            'tanggal.before_or_equal' => 'Tanggal restock tidak boleh di masa depan.',
            'keterangan.max' => 'Keterangan maksimal 500 karakter.',
        ];
    }
}
