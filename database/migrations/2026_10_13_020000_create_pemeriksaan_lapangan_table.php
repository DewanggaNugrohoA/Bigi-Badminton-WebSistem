<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pemeriksaan_lapangan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_lapangan')->constrained('lapangan', 'id_lapangan')->restrictOnDelete();
            $table->date('tanggal_pemeriksaan');
            $table->foreignId('diperiksa_oleh')->constrained('users', 'id_user')->restrictOnDelete();
            $table->enum('karpet_vinil', ['baik', 'rusak_ringan', 'rusak_sedang', 'rusak_berat']);
            $table->enum('net', ['baik', 'rusak_ringan', 'rusak_sedang', 'rusak_berat']);
            $table->enum('tiang', ['baik', 'rusak_ringan', 'rusak_sedang', 'rusak_berat']);
            $table->enum('lampu', ['baik', 'rusak_ringan', 'rusak_sedang', 'rusak_berat']);
            $table->enum('lantai', ['baik', 'rusak_ringan', 'rusak_sedang', 'rusak_berat']);
            $table->enum('dinding', ['baik', 'rusak_ringan', 'rusak_sedang', 'rusak_berat']);
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['id_lapangan', 'tanggal_pemeriksaan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemeriksaan_lapangan');
    }
};
