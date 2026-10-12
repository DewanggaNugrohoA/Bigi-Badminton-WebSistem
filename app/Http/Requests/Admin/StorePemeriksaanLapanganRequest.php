<?php

namespace App\Http\Requests\Admin;

use App\Models\PemeriksaanLapangan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePemeriksaanLapanganRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $validKondisi = [
            PemeriksaanLapangan::KONDISI_BAIK,
            PemeriksaanLapangan::KONDISI_RUSAK_RINGAN,
            PemeriksaanLapangan::KONDISI_RUSAK_SEDANG,
            PemeriksaanLapangan::KONDISI_RUSAK_BERAT,
        ];

        return [
            'id_lapangan' => ['required', 'integer', 'exists:lapangan,id_lapangan'],
            'tanggal_pemeriksaan' => ['required', 'date', 'before_or_equal:today'],
            'karpet_vinil' => ['required', 'string', Rule::in($validKondisi)],
            'net' => ['required', 'string', Rule::in($validKondisi)],
            'tiang' => ['required', 'string', Rule::in($validKondisi)],
            'lampu' => ['required', 'string', Rule::in($validKondisi)],
            'lantai' => ['required', 'string', Rule::in($validKondisi)],
            'dinding' => ['required', 'string', Rule::in($validKondisi)],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_lapangan.required' => 'Lapangan wajib dipilih.',
            'id_lapangan.exists' => 'Lapangan yang dipilih tidak valid atau tidak ditemukan.',
            'tanggal_pemeriksaan.required' => 'Tanggal pemeriksaan wajib diisi.',
            'tanggal_pemeriksaan.date' => 'Format tanggal pemeriksaan tidak valid.',
            'tanggal_pemeriksaan.before_or_equal' => 'Tanggal pemeriksaan tidak boleh di masa depan.',
            'karpet_vinil.required' => 'Kondisi karpet / vinil wajib dipilih.',
            'karpet_vinil.in' => 'Kondisi karpet / vinil tidak valid.',
            'net.required' => 'Kondisi net wajib dipilih.',
            'net.in' => 'Kondisi net tidak valid.',
            'tiang.required' => 'Kondisi tiang wajib dipilih.',
            'tiang.in' => 'Kondisi tiang tidak valid.',
            'lampu.required' => 'Kondisi lampu wajib dipilih.',
            'lampu.in' => 'Kondisi lampu tidak valid.',
            'lantai.required' => 'Kondisi lantai wajib dipilih.',
            'lantai.in' => 'Kondisi lantai tidak valid.',
            'dinding.required' => 'Kondisi dinding wajib dipilih.',
            'dinding.in' => 'Kondisi dinding tidak valid.',
            'catatan.max' => 'Catatan maksimal 1000 karakter.',
        ];
    }
}
