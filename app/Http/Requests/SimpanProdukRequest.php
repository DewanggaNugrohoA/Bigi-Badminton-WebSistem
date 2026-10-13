<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

/**
 * FormRequest validasi pembuatan dan pembaruan data produk pada modul kasir.
 * Hak akses: Hanya staf ber-role kasir pada guard staff.
 */
class SimpanProdukRequest extends FormRequest
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
        $idProduk = $this->route('id') ?? $this->input('id_produk');

        return [
            'nama_produk' => [
                'required',
                'string',
                'min:2',
                'max:100',
                Rule::unique('produk', 'nama_produk')->ignore($idProduk, 'id_produk'),
            ],
            'kategori' => ['required', 'string', 'max:100'],
            'harga' => ['required', 'integer', 'min:1'],
            'stok_minimum' => ['required', 'integer', 'min:0'],
            'status_produk' => ['required', Rule::in(['aktif', 'nonaktif'])],
            'gambar' => [
                'nullable',
                File::image()
                    ->types(['jpg', 'jpeg', 'png', 'webp'])
                    ->max(2048),
            ],
            'hapus_gambar' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama_produk.required' => 'Nama produk wajib diisi.',
            'nama_produk.min' => 'Nama produk minimal 2 karakter.',
            'nama_produk.max' => 'Nama produk maksimal 100 karakter.',
            'nama_produk.unique' => 'Nama produk sudah digunakan.',
            'kategori.required' => 'Kategori produk wajib diisi.',
            'harga.required' => 'Harga produk wajib diisi.',
            'harga.integer' => 'Harga harus berupa bilangan bulat rupiah.',
            'harga.min' => 'Harga produk harus lebih dari 0.',
            'stok_minimum.required' => 'Stok minimum wajib diisi.',
            'stok_minimum.integer' => 'Stok minimum harus berupa angka bulat.',
            'stok_minimum.min' => 'Stok minimum tidak boleh kurang dari 0.',
            'status_produk.required' => 'Status produk wajib dipilih.',
            'status_produk.in' => 'Status produk hanya boleh aktif atau nonaktif.',
            'gambar.image' => 'Berkas gambar produk harus berupa gambar yang valid.',
            'gambar.mimes' => 'Format gambar harus berupa JPG, JPEG, PNG, atau WebP.',
            'gambar.max' => 'Ukuran berkas gambar maksimal 2048 KB (2 MB).',
        ];
    }
}
