<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('biaya_operasional', function (Blueprint $table) {
            if (!Schema::hasColumn('biaya_operasional', 'jenis_pengeluaran')) {
                $table->string('jenis_pengeluaran', 100)->default('Operasional')->after('id_user');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('biaya_operasional', function (Blueprint $table) {
            if (Schema::hasColumn('biaya_operasional', 'jenis_pengeluaran')) {
                $table->dropColumn('jenis_pengeluaran');
            }
        });
    }
};
