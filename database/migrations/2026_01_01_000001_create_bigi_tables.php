<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lapangan', function (Blueprint $table) {
            $table->id('id_lapangan');
            $table->string('nama_lapangan', 50);
            $table->decimal('harga_per_jam', 12, 2);
            $table->enum('status_lapangan', ['tersedia', 'perawatan']);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('produk', function (Blueprint $table) {
            $table->id('id_produk');
            $table->string('nama_produk', 255);
            $table->string('kategori', 100);
            $table->decimal('harga', 12, 2);
            $table->integer('stok')->default(0);
            $table->integer('stok_minimum')->default(0);
            $table->enum('status_produk', ['aktif', 'nonaktif']);
            $table->timestamps();
        });

        Schema::create('reservasi', function (Blueprint $table) {
            $table->id('id_reservasi');
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->date('tanggal_pemesanan');
            $table->decimal('total_biaya', 12, 2);
            $table->enum('status_reservasi', ['terkonfirmasi', 'selesai', 'batal'])->default('terkonfirmasi');
            $table->timestamps();
        });

        Schema::create('detail_reservasi', function (Blueprint $table) {
            $table->id('id_detail_reservasi');
            $table->foreignId('id_reservasi')->constrained('reservasi', 'id_reservasi')->cascadeOnDelete();
            $table->foreignId('id_lapangan')->constrained('lapangan', 'id_lapangan')->restrictOnDelete();
            $table->date('tanggal_main');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->integer('durasi');
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();

            $table->index(['id_lapangan', 'tanggal_main']);
        });

        Schema::create('pembayaran', function (Blueprint $table) {
            $table->id('id_pembayaran');
            $table->foreignId('id_reservasi')->constrained('reservasi', 'id_reservasi')->restrictOnDelete();
            $table->date('tanggal_pembayaran');
            $table->enum('jenis_pembayaran', ['DP', 'Lunas']);
            $table->decimal('jumlah', 12, 2);
            $table->enum('metode_pembayaran', ['transfer', 'tunai', 'qris']);
            $table->enum('status_pembayaran', ['menunggu', 'terkonfirmasi']);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('shift_kasir', function (Blueprint $table) {
            $table->id('id_shift');
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->dateTime('waktu_buka');
            $table->dateTime('waktu_tutup')->nullable();
            $table->decimal('modal_awal', 12, 2);
            $table->decimal('kas_sistem', 12, 2)->nullable();
            $table->decimal('kas_fisik', 12, 2)->nullable();
            $table->decimal('selisih', 12, 2)->nullable();
            $table->enum('status', ['terbuka', 'ditutup'])->default('terbuka');
            $table->timestamps();
        });

        Schema::create('transaksi_pos', function (Blueprint $table) {
            $table->id('id_transaksi');
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->foreignId('id_shift')->constrained('shift_kasir', 'id_shift')->restrictOnDelete();
            $table->string('no_transaksi', 30)->unique();
            $table->dateTime('tanggal');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('diskon', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->enum('metode_bayar', ['tunai', 'qris']);
            $table->decimal('uang_diterima', 12, 2)->nullable();
            $table->decimal('kembalian', 12, 2)->nullable();
            $table->enum('status_transaksi', ['selesai', 'void', 'retur'])->default('selesai');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        Schema::create('detail_transaksi_pos', function (Blueprint $table) {
            $table->id('id_detail');
            $table->foreignId('id_transaksi')->constrained('transaksi_pos', 'id_transaksi')->cascadeOnDelete();
            $table->foreignId('id_produk')->constrained('produk', 'id_produk')->restrictOnDelete();
            $table->integer('jumlah');
            $table->decimal('harga', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        Schema::create('retur_void', function (Blueprint $table) {
            $table->id('id_retur');
            $table->foreignId('id_transaksi')->constrained('transaksi_pos', 'id_transaksi')->restrictOnDelete();
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->foreignId('id_admin')->nullable()->constrained('users', 'id_user')->restrictOnDelete();
            $table->enum('jenis', ['void', 'retur']);
            $table->text('alasan');
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])->default('menunggu');
            $table->dateTime('tanggal');
            $table->timestamps();
        });

        Schema::create('restock', function (Blueprint $table) {
            $table->id('id_restock');
            $table->foreignId('id_produk')->constrained('produk', 'id_produk')->restrictOnDelete();
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->integer('jumlah');
            $table->date('tanggal');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_opname', function (Blueprint $table) {
            $table->id('id_opname');
            $table->foreignId('id_produk')->constrained('produk', 'id_produk')->restrictOnDelete();
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->integer('stok_sistem');
            $table->integer('stok_fisik');
            $table->integer('selisih');
            $table->date('tanggal');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_log', function (Blueprint $table) {
            $table->id('id_log');
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->string('aksi', 100);
            $table->string('objek', 100);
            $table->text('keterangan')->nullable();
            $table->dateTime('waktu');
            $table->timestamps();
        });

        Schema::create('informasi', function (Blueprint $table) {
            $table->id('id_informasi');
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->string('judul', 255);
            $table->string('gambar', 255)->nullable();
            $table->date('tanggal_publikasi')->nullable();
            $table->enum('status', ['draft', 'terbit'])->default('draft');
            $table->timestamps();
        });

        Schema::create('biaya_operasional', function (Blueprint $table) {
            $table->id('id_biaya');
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->date('tanggal_biaya');
            $table->text('keterangan');
            $table->decimal('jumlah', 12, 2);
            $table->timestamps();
        });

        Schema::create('laporan_keuangan', function (Blueprint $table) {
            $table->id('id_laporan');
            $table->date('periode_awal');
            $table->date('periode_akhir');
            $table->decimal('pendapatan_lapangan', 12, 2);
            $table->decimal('pendapatan_pos', 12, 2);
            $table->decimal('total_pengeluaran', 12, 2);
            $table->decimal('profit_bersih', 12, 2);
            $table->timestamps();
        });

        Schema::create('open_mabar', function (Blueprint $table) {
            $table->id('id_mabar');
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->string('judul', 255);
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->enum('gender', ['putra', 'putri', 'campuran']);
            $table->integer('batas_usia_min');
            $table->integer('batas_usia_max');
            $table->integer('kuota');
            $table->text('deskripsi')->nullable();
            $table->string('foto', 255)->nullable();
            $table->foreignId('id_lapangan')->nullable()->constrained('lapangan', 'id_lapangan')->restrictOnDelete();
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])->default('menunggu');
            $table->timestamps();
        });

        Schema::create('peserta_mabar', function (Blueprint $table) {
            $table->id('id_peserta');
            $table->foreignId('id_mabar')->constrained('open_mabar', 'id_mabar')->cascadeOnDelete();
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->date('tanggal_daftar');
            $table->enum('status_peserta', ['terdaftar', 'batal'])->default('terdaftar');
            $table->timestamps();

            $table->unique(['id_mabar', 'id_user']);
        });

        Schema::create('chat_mabar', function (Blueprint $table) {
            $table->id('id_chat');
            $table->foreignId('id_mabar')->constrained('open_mabar', 'id_mabar')->cascadeOnDelete();
            $table->foreignId('id_user')->constrained('users', 'id_user')->restrictOnDelete();
            $table->text('pesan');
            $table->dateTime('waktu');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_mabar');
        Schema::dropIfExists('peserta_mabar');
        Schema::dropIfExists('open_mabar');
        Schema::dropIfExists('laporan_keuangan');
        Schema::dropIfExists('biaya_operasional');
        Schema::dropIfExists('informasi');
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('stock_opname');
        Schema::dropIfExists('restock');
        Schema::dropIfExists('retur_void');
        Schema::dropIfExists('detail_transaksi_pos');
        Schema::dropIfExists('transaksi_pos');
        Schema::dropIfExists('shift_kasir');
        Schema::dropIfExists('pembayaran');
        Schema::dropIfExists('detail_reservasi');
        Schema::dropIfExists('reservasi');
        Schema::dropIfExists('produk');
        Schema::dropIfExists('lapangan');
    }
};