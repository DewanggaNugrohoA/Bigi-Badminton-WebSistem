<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi pencatatan stock opname fisik.
 * Hak akses: Hanya staf kasir pada guard staff.
 */
class StokOpnameRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.id_produk' => ['required', 'integer', 'exists:produk,id_produk'],
            'items.*.stok_fisik' => ['required', 'integer', 'min:0'],
            'items.*.keterangan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            if (! is_array($items)) {
                return;
            }

            foreach ($items as $index => $item) {
                $idProduk = $item['id_produk'] ?? null;
                $stokFisik = isset($item['stok_fisik']) ? (int) $item['stok_fisik'] : null;
                $keterangan = trim($item['keterangan'] ?? '');

                if ($idProduk !== null && $stokFisik !== null) {
                    $produk = \App\Models\Produk::find($idProduk);
                    if ($produk && (int) $produk->stok !== $stokFisik && empty($keterangan)) {
                        $validator->errors()->add("items.{$index}.keterangan", "Keterangan wajib diisi ketika ada selisih stok untuk produk {$produk->nama_produk}.");
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Daftar produk opname tidak boleh kosong.',
            'items.min' => 'Pilih minimal satu produk untuk stock opname.',
            'items.*.id_produk.required' => 'Produk wajib dipilih.',
            'items.*.id_produk.exists' => 'Produk tidak ditemukan.',
            'items.*.stok_fisik.required' => 'Stok fisik wajib diisi.',
            'items.*.stok_fisik.integer' => 'Stok fisik harus berupa bilangan bulat.',
            'items.*.stok_fisik.min' => 'Stok fisik tidak boleh kurang dari 0.',
            'items.*.keterangan.max' => 'Keterangan maksimal 500 karakter.',
        ];
    }
}
