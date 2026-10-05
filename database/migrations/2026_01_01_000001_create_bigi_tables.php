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
            $table->string('nama_lapangan');
            $table->decimal('harga_per_jam', 12, 2);
            $table->enum('status', ['tersedia', 'pemeliharaan'])->default('tersedia');
            $table->timestamps();
        });

        Schema::create('produk', function (Blueprint $table) {
            $table->id('id_produk');
            $table->string('nama_produk');
            $table->string('kategori');
            $table->decimal('harga_jual', 12, 2);
            $table->integer('stok')->default(0);
            $table->timestamps();
        });

        Schema::create('reservasi', function (Blueprint $table) {
            $table->id('id_reservasi');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->string('kode_reservasi')->unique();
            $table->date('tanggal_reservasi');
            $table->decimal('total_harga', 12, 2);
            $table->enum('status_reservasi', ['menunggu', 'dp', 'lunas', 'batal'])->default('menunggu');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        Schema::create('detail_reservasi', function (Blueprint $table) {
            $table->id('id_detail_reservasi');
            $table->foreignId('id_reservasi')->constrained('reservasi', 'id_reservasi')->onDelete('cascade');
            $table->foreignId('id_lapangan')->constrained('lapangan', 'id_lapangan')->onDelete('cascade');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        Schema::create('pembayaran', function (Blueprint $table) {
            $table->id('id_pembayaran');
            $table->foreignId('id_reservasi')->constrained('reservasi', 'id_reservasi')->onDelete('cascade');
            $table->enum('metode_pembayaran', ['transfer', 'cash', 'qris']);
            $table->decimal('jumlah_bayar', 12, 2);
            $table->enum('status_pembayaran', ['pending', 'berhasil', 'gagal'])->default('pending');
            $table->string('bukti_pembayaran')->nullable();
            $table->dateTime('tanggal_bayar')->nullable();
            $table->timestamps();
        });

        Schema::create('shift_kasir', function (Blueprint $table) {
            $table->id('id_shift');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->dateTime('waktu_buka');
            $table->dateTime('waktu_tutup')->nullable();
            $table->decimal('saldo_awal', 12, 2);
            $table->decimal('saldo_akhir', 12, 2)->nullable();
            $table->decimal('total_tunai', 12, 2)->nullable();
            $table->decimal('total_non_tunai', 12, 2)->nullable();
            $table->enum('status_shift', ['buka', 'tutup'])->default('buka');
            $table->timestamps();
        });

        Schema::create('transaksi_pos', function (Blueprint $table) {
            $table->id('id_transaksi');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->foreignId('id_shift')->nullable()->constrained('shift_kasir', 'id_shift')->onDelete('set null');
            $table->string('nomor_transaksi')->unique();
            $table->decimal('total_harga', 12, 2);
            $table->string('metode_pembayaran');
            $table->decimal('jumlah_bayar', 12, 2);
            $table->decimal('kembalian', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('detail_transaksi_pos', function (Blueprint $table) {
            $table->id('id_detail');
            $table->foreignId('id_transaksi')->constrained('transaksi_pos', 'id_transaksi')->onDelete('cascade');
            $table->foreignId('id_produk')->constrained('produk', 'id_produk')->onDelete('cascade');
            $table->integer('jumlah');
            $table->decimal('harga_satuan', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        Schema::create('retur_void', function (Blueprint $table) {
            $table->id('id_retur');
            $table->foreignId('id_transaksi')->constrained('transaksi_pos', 'id_transaksi')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->foreignId('id_admin')->nullable()->constrained('users', 'id_user')->onDelete('set null');
            $table->enum('tipe', ['void', 'retur']);
            $table->text('alasan');
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])->default('menunggu');
            $table->timestamps();
        });

        Schema::create('restock', function (Blueprint $table) {
            $table->id('id_restock');
            $table->foreignId('id_produk')->constrained('produk', 'id_produk')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->integer('jumlah');
            $table->decimal('biaya_total', 12, 2);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_opname', function (Blueprint $table) {
            $table->id('id_opname');
            $table->foreignId('id_produk')->constrained('produk', 'id_produk')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->integer('stok_sistem');
            $table->integer('stok_fisik');
            $table->integer('selisih');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_log', function (Blueprint $table) {
            $table->id('id_log');
            $table->foreignId('id_user')->nullable()->constrained('users', 'id_user')->onDelete('set null');
            $table->string('aktivitas');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        Schema::create('informasi', function (Blueprint $table) {
            $table->id('id_informasi');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->string('judul');
            $table->text('konten');
            $table->enum('status_terbit', ['draft', 'terbit'])->default('draft');
            $table->timestamps();
        });

        Schema::create('biaya_operasional', function (Blueprint $table) {
            $table->id('id_biaya');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->string('kategori');
            $table->decimal('jumlah_biaya', 12, 2);
            $table->text('keterangan')->nullable();
            $table->date('tanggal');
            $table->timestamps();
        });

        Schema::create('laporan_keuangan', function (Blueprint $table) {
            $table->id('id_laporan');
            $table->string('periode');
            $table->decimal('total_pemasukan', 12, 2);
            $table->decimal('total_pengeluaran', 12, 2);
            $table->decimal('laba_bersih', 12, 2);
            $table->timestamps();
        });

        Schema::create('open_mabar', function (Blueprint $table) {
            $table->id('id_mabar');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->foreignId('id_lapangan')->constrained('lapangan', 'id_lapangan')->onDelete('cascade');
            $table->string('judul');
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->string('level_pemain');
            $table->integer('max_peserta');
            $table->decimal('harga_per_orang', 12, 2);
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak', 'selesai'])->default('menunggu');
            $table->text('alasan_penolakan')->nullable();
            $table->timestamps();
        });

        Schema::create('peserta_mabar', function (Blueprint $table) {
            $table->id('id_peserta');
            $table->foreignId('id_mabar')->constrained('open_mabar', 'id_mabar')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->enum('status_pembayaran', ['pending', 'lunas'])->default('pending');
            $table->timestamps();
        });

        Schema::create('chat_mabar', function (Blueprint $table) {
            $table->id('id_chat');
            $table->foreignId('id_mabar')->constrained('open_mabar', 'id_mabar')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->text('pesan');
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
