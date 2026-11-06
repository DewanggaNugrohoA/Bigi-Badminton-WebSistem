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
        Schema::table('audit_log', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_log', 'role')) {
                $table->string('role', 50)->nullable()->after('id_user');
            }
            if (!Schema::hasColumn('audit_log', 'modul')) {
                $table->string('modul', 100)->nullable()->after('aksi');
            }
            if (!Schema::hasColumn('audit_log', 'data_lama')) {
                $table->json('data_lama')->nullable()->after('keterangan');
            }
            if (!Schema::hasColumn('audit_log', 'data_baru')) {
                $table->json('data_baru')->nullable()->after('data_lama');
            }
            if (!Schema::hasColumn('audit_log', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('data_baru');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            $cols = ['role', 'modul', 'data_lama', 'data_baru', 'ip_address'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('audit_log', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
