<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('id_user');
            $table->string('nama', 255);
            $table->string('no_whatsapp', 20);
            $table->string('email', 255)->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'kasir', 'user'])->default('user');
            $table->enum('jenis_pelanggan', ['member', 'reguler'])->default('reguler');
            $table->date('tanggal_mulai_member')->nullable();
            $table->date('tanggal_akhir_member')->nullable();
            $table->enum('status_member', ['aktif', 'tidak_aktif'])->default('tidak_aktif');
            $table->enum('status_akun', ['aktif', 'nonaktif'])->default('aktif');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('sessions');
    }
};