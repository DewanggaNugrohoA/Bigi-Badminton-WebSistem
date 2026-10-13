<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest validasi penambahan stok produk kasir (restock).
 * Hak akses: Hanya kasir aktif pada guard staff.
 */
class RestockRequest extends FormRequest
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
        $today = Carbon::now('Asia/Jakarta')->format('Y-m-d');

        return [
            'id_produk' => ['nullable', 'integer', 'exists:produk,id_produk'],
            'nama_produk' => ['nullable', 'string', 'min:2', 'max:100'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'harga' => ['nullable', 'integer', 'min:1'],
            'jumlah' => ['required', 'integer', 'min:1'],
            'tanggal' => ['required', 'date', 'before_or_equal:' . $today],
            'keterangan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $hasIdProduk = $this->filled('id_produk');
            $hasNamaProduk = $this->filled('nama_produk');
            $hasKategori = $this->filled('kategori');
            $hasHarga = $this->filled('harga');

            $hasAnyNewProductField = $hasNamaProduk || $hasKategori || $hasHarga;

            if ($hasIdProduk && $hasAnyNewProductField) {
                $validator->errors()->add('id_produk', 'Pilih salah satu: restock produk yang ada atau tambah produk baru, tidak boleh keduanya.');
                return;
            }

            if (! $hasIdProduk && ! $hasNamaProduk) {
                $validator->errors()->add('id_produk', 'Produk wajib dipilih atau masukkan data produk baru.');
                return;
            }

            if (! $hasIdProduk && $hasNamaProduk) {
                $namaInput = trim((string) $this->input('nama_produk'));

                if (mb_strlen($namaInput) < 2) {
                    $validator->errors()->add('nama_produk', 'Nama produk minimal 2 karakter.');
                }
                if (mb_strlen($namaInput) > 100) {
                    $validator->errors()->add('nama_produk', 'Nama produk maksimal 100 karakter.');
                }

                if (! $hasKategori || trim((string) $this->input('kategori')) === '') {
                    $validator->errors()->add('kategori', 'Kategori produk wajib diisi untuk produk baru.');
                }

                if (! $hasHarga) {
                    $validator->errors()->add('harga', 'Harga produk wajib diisi untuk produk baru.');
                }

                $existing = \App\Models\Produk::whereRaw('LOWER(TRIM(nama_produk)) = ?', [mb_strtolower($namaInput)])->first();
                if ($existing) {
                    $validator->errors()->add('nama_produk', "Produk dengan nama '{$existing->nama_produk}' sudah terdaftar. Silakan pilih produk dari daftar yang tersedia.");
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'id_produk.integer' => 'ID produk harus berupa angka bulat.',
            'id_produk.exists' => 'Produk tidak ditemukan.',
            'nama_produk.min' => 'Nama produk minimal 2 karakter.',
            'nama_produk.max' => 'Nama produk maksimal 100 karakter.',
            'kategori.max' => 'Kategori produk maksimal 100 karakter.',
            'harga.integer' => 'Harga harus berupa bilangan bulat rupiah.',
            'harga.min' => 'Harga produk harus lebih dari 0.',
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
