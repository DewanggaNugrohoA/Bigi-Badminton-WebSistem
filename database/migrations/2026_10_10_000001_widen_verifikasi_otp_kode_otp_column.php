<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('verifikasi_otp', function (Blueprint $table) {
            $table->string('kode_otp', 255)->change();
        });
    }

    public function down(): void
    {
        Schema::table('verifikasi_otp', function (Blueprint $table) {
            $table->string('kode_otp', 6)->change();
        });
    }
};
