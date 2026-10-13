<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email', 255)->nullable()->change();
            $table->unique('no_whatsapp');
        });

        Schema::create('verifikasi_otp', function (Blueprint $table) {
            $table->id('id_otp');
            $table->string('no_whatsapp', 20)->index();
            $table->string('kode_otp', 6);
            $table->string('nama', 255);
            $table->string('password', 255);
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verifikasi_otp');

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['no_whatsapp']);
            $table->string('email', 255)->nullable(false)->change();
        });
    }
};
