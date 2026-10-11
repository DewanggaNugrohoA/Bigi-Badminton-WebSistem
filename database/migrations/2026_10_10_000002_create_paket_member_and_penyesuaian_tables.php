<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        
        Schema::create('paket_member', function (Blueprint $table) {
            $table->id('id_paket');
            $table->foreignId('id_user')->constrained('users', 'id_user')->cascadeOnDelete();
            $table->unsignedInteger('jumlah_sesi');
            $table->date('tanggal_mulai');
            $table->date('tanggal_akhir')->nullable();
            $table->enum('status', ['aktif', 'habis', 'kedaluwarsa', 'dibatalkan'])->default('aktif');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        
        Schema::table('reservasi', function (Blueprint $table) {
            $table->foreignId('id_paket')
                ->nullable()
                ->after('id_user')
                ->constrained('paket_member', 'id_paket')
                ->nullOnDelete();
        });

        
        Schema::create('penyesuaian_paket', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_paket')->constrained('paket_member', 'id_paket')->cascadeOnDelete();
            $table->integer('selisih');
            $table->text('alasan');
            $table->foreignId('id_admin')->constrained('users', 'id_user')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penyesuaian_paket');

        Schema::table('reservasi', function (Blueprint $table) {
            $table->dropForeign(['id_paket']);
            $table->dropColumn('id_paket');
        });

        Schema::dropIfExists('paket_member');
    }
};
