<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('penyesuaian_paket', function (Blueprint $table) {
            $table->date('tanggal_main')->nullable()->after('selisih');
        });
    }

    public function down(): void
    {
        Schema::table('penyesuaian_paket', function (Blueprint $table) {
            $table->dropColumn('tanggal_main');
        });
    }
};
