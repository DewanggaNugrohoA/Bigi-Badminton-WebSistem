<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOpenMabarRequest extends FormRequest
{
    public function authorize(): bool
    {
        $mabar = $this->route('mabar');
        return $mabar ? \Illuminate\Support\Facades\Gate::allows('update', $mabar) : true;
    }

    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'tanggal' => ['required', 'date', 'after_or_equal:today'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'gender' => ['required', 'in:putra,putri,campuran'],
            'no_hp' => ['required', 'string', 'regex:/^08[0-9]{8,11}$/'],
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
            'no_hp.required' => 'Nomor HP/WhatsApp wajib diisi.',
            'no_hp.regex' => 'Nomor HP/WhatsApp harus diawali 08 dan terdiri dari 10 hingga 13 digit angka.',
            'kuota.required' => 'Kuota peserta wajib diisi.',
            'kuota.min' => 'Kuota minimal 1 orang.',
            'foto.image' => 'File foto harus berupa gambar.',
            'foto.max' => 'Ukuran foto maksimal 2 MB.',
            'id_lapangan.exists' => 'Lapangan yang dipilih tidak valid.',
        ];
    }
}
