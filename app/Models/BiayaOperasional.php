<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiayaOperasional extends Model
{
    protected $table = 'biaya_operasional';
    protected $primaryKey = 'id_biaya';

    protected $fillable = [
        'id_user',
        'jenis_pengeluaran',
        'tanggal_biaya',
        'keterangan',
        'jumlah',
        'nominal',
        'tanggal',
        'id_admin',
        'user_id',
    ];

    protected $appends = ['nominal', 'tanggal'];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    // Accessor & Mutator Alias: nominal <=> jumlah
    public function getNominalAttribute(): float
    {
        return (float) ($this->attributes['jumlah'] ?? 0);
    }

    public function setNominalAttribute($value): void
    {
        $this->attributes['jumlah'] = $value;
    }

    // Accessor & Mutator Alias: tanggal <=> tanggal_biaya
    public function getTanggalAttribute(): ?string
    {
        return $this->attributes['tanggal_biaya'] ?? null;
    }

    public function setTanggalAttribute($value): void
    {
        $this->attributes['tanggal_biaya'] = $value;
    }

    // Mutator Alias: user_id / id_admin <=> id_user
    public function setUserIdAttribute($value): void
    {
        $this->attributes['id_user'] = $value;
    }

    public function setIdAdminAttribute($value): void
    {
        $this->attributes['id_user'] = $value;
    }
}
