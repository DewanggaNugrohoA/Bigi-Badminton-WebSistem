<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpenMabarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'tanggal' => ['required', 'date', 'after_or_equal:today'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'gender' => ['required', 'in:putra,putri,campuran'],
            'batas_usia_min' => ['required', 'integer', 'min:1'],
            'batas_usia_max' => ['required', 'integer', 'gte:batas_usia_min'],
            'kuota' => ['required', 'integer', 'min:1'],
            'deskripsi' => ['nullable', 'string'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'id_lapangan' => ['nullable', 'exists:lapangan,id_lapangan'],
        ];
    }

    public function messages(): array
    {
        return [
            'judul.required' => 'Judul mabar wajib diisi.',
            'tanggal.required' => 'Tanggal pelaksanaan wajib diisi.',
            'tanggal.after_or_equal' => 'Tanggal pelaksanaan tidak boleh lampau.',
            'jam_mulai.required' => 'Jam mulai wajib diisi.',
            'jam_selesai.required' => 'Jam selesai wajib diisi.',
            'jam_selesai.after' => 'Jam selesai harus setelah jam mulai.',
            'gender.required' => 'Kategori jenis kelamin wajib dipilih.',
            'gender.in' => 'Kategori jenis kelamin tidak valid.',
            'batas_usia_min.required' => 'Batas usia minimal wajib diisi.',
            'batas_usia_min.min' => 'Batas usia minimal minimal 1 tahun.',
            'batas_usia_max.required' => 'Batas usia maksimal wajib diisi.',
            'batas_usia_max.gte' => 'Batas usia maksimal harus lebih besar atau sama dengan usia minimal.',
            'kuota.required' => 'Kuota peserta wajib diisi.',
            'kuota.min' => 'Kuota minimal 1 orang.',
            'foto.image' => 'File foto harus berupa gambar.',
            'foto.max' => 'Ukuran foto maksimal 2 MB.',
            'id_lapangan.exists' => 'Lapangan yang dipilih tidak valid.',
        ];
    }
}
