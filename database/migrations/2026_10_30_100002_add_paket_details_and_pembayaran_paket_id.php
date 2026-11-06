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
        Schema::table('paket_member', function (Blueprint $table) {
            $table->string('jenis_paket', 50)->nullable()->after('id_user');
            $table->unsignedTinyInteger('durasi_jam_per_sesi')->nullable()->after('jumlah_sesi');
            $table->decimal('harga_paket', 12, 2)->default(0)->after('durasi_jam_per_sesi');
        });

        Schema::table('pembayaran', function (Blueprint $table) {
            $table->unsignedBigInteger('id_reservasi')->nullable()->change();
            $table->foreignId('id_paket')
                ->nullable()
                ->after('id_reservasi')
                ->constrained('paket_member', 'id_paket')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            $table->dropForeign(['id_paket']);
            $table->dropColumn('id_paket');
            $table->unsignedBigInteger('id_reservasi')->nullable(false)->change();
        });

        Schema::table('paket_member', function (Blueprint $table) {
            $table->dropColumn(['jenis_paket', 'durasi_jam_per_sesi', 'harga_paket']);
        });
    }
};
