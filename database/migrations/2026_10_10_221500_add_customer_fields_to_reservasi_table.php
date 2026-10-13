<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservasi', function (Blueprint $table) {
            $table->string('nama_pemesan', 100)->nullable()->after('id_user');
            $table->string('no_whatsapp_pemesan', 20)->nullable()->after('nama_pemesan');
            $table->unsignedBigInteger('id_user')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('reservasi', function (Blueprint $table) {
            $table->unsignedBigInteger('id_user')->nullable(false)->change();
            $table->dropColumn(['nama_pemesan', 'no_whatsapp_pemesan']);
        });
    }
};
