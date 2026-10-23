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
        Schema::table('open_mabar', function (Blueprint $table) {
            $table->string('no_hp', 20)->nullable()->after('gender');
            $table->integer('batas_usia_min')->nullable()->change();
            $table->integer('batas_usia_max')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('open_mabar', function (Blueprint $table) {
            $table->integer('batas_usia_min')->nullable(false)->change();
            $table->integer('batas_usia_max')->nullable(false)->change();
            $table->dropColumn('no_hp');
        });
    }
};
