<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('detail_transaksi_pos', function (Blueprint $table) {
            if (!Schema::hasColumn('detail_transaksi_pos', 'subtotal')) {
                $table->decimal('subtotal', 12, 2)->default(0)->after('harga');
            }
        });

        // Sinkronkan subtotal untuk baris data yang sudah ada
        DB::statement('UPDATE detail_transaksi_pos SET subtotal = jumlah * harga WHERE subtotal = 0 OR subtotal IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_transaksi_pos', function (Blueprint $table) {
            if (Schema::hasColumn('detail_transaksi_pos', 'subtotal')) {
                $table->dropColumn('subtotal');
            }
        });
    }
};
