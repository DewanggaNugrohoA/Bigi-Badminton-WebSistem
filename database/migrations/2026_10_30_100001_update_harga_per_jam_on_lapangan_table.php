<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('lapangan')->update(['harga_per_jam' => 60000.00]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('lapangan')->update(['harga_per_jam' => 50000.00]);
    }
};
