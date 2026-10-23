<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\KasirController;
use Illuminate\Support\Facades\Route;

// ==========================================
// 1. RUTE PUBLIK & AUTENTIKASI PENGGUNA UMUM
// ==========================================
Route::get('/', [HomeController::class, 'index'])->name('home');

// Tamu web (pelanggan belum login): Login, Registrasi, dan Verifikasi OTP WhatsApp
Route::middleware('guest:web')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:15,1');

    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:15,1');
    Route::get('/register/verifikasi', [RegisterController::class, 'verifikasiCreate'])->name('register.verifikasi');
    Route::post('/register/verifikasi', [RegisterController::class, 'verifikasiStore'])->middleware('throttle:15,1');
    Route::post('/register/kirim-ulang-otp', [RegisterController::class, 'kirimUlangOtp'])->middleware('throttle:5,1')->name('register.kirim-ulang-otp');

    // Lupa kata sandi via OTP WhatsApp
    Route::get('/lupa-password', [ResetPasswordController::class, 'showRequestForm'])->name('password.request');
    Route::post('/lupa-password', [ResetPasswordController::class, 'sendResetOtp'])->middleware('throttle:15,1')->name('password.send');
    Route::get('/lupa-password/verifikasi', [ResetPasswordController::class, 'showResetForm'])->name('password.verifikasi');
    Route::post('/lupa-password/kirim-ulang-otp', [ResetPasswordController::class, 'resendOtp'])->middleware('throttle:5,1')->name('password.resend');
    Route::post('/lupa-password/reset', [ResetPasswordController::class, 'resetPassword'])->middleware('throttle:15,1')->name('password.update');
});

// Tamu staf (karyawan belum login): Login khusus internal staf (Admin & Kasir)
Route::middleware('guest:staff')->group(function () {
    Route::get('/staff/login', [\App\Http\Controllers\Auth\StaffLoginController::class, 'create'])->name('staff.login');
    Route::post('/staff/login', [\App\Http\Controllers\Auth\StaffLoginController::class, 'store'])->middleware('throttle:10,1')->name('staff.login.store');
});

// =========================================================================
// 2. PANEL USER / PELANGGAN (Guard: web, Role: user)
// Middleware role:user,web menjamin hanya pengguna umum yang bisa mengakses.
// =========================================================================
Route::middleware(['auth:web', 'role:user,web'])->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    
    Route::get('/open-mabar', [\App\Http\Controllers\OpenMabarController::class, 'index'])->name('open-mabar.index');
    Route::get('/open-mabar/create', [\App\Http\Controllers\OpenMabarController::class, 'create'])->name('open-mabar.create');
    Route::post('/open-mabar', [\App\Http\Controllers\OpenMabarController::class, 'store'])->name('open-mabar.store');
    Route::get('/open-mabar/mabar-bareng', [\App\Http\Controllers\OpenMabarController::class, 'mabarBareng'])->name('open-mabar.bareng');
    Route::get('/open-mabar/saya', [\App\Http\Controllers\OpenMabarController::class, 'saya'])->name('open-mabar.saya');
    Route::get('/open-mabar/{mabar}', [\App\Http\Controllers\OpenMabarController::class, 'show'])->name('open-mabar.show');
    Route::get('/open-mabar/{mabar}/edit', [\App\Http\Controllers\OpenMabarController::class, 'edit'])->name('open-mabar.edit');
    Route::put('/open-mabar/{mabar}/edit', [\App\Http\Controllers\OpenMabarController::class, 'update'])->name('open-mabar.update');
    Route::delete('/open-mabar/{mabar}', [\App\Http\Controllers\OpenMabarController::class, 'destroy'])->name('open-mabar.destroy');
    Route::post('/open-mabar/{mabar}/ikut', [\App\Http\Controllers\OpenMabarController::class, 'ikut'])->name('open-mabar.ikut');
    Route::delete('/open-mabar/{mabar}/ikut', [\App\Http\Controllers\OpenMabarController::class, 'batalIkut'])->name('open-mabar.batal-ikut');

    
    Route::get('/chat-panel/daftar', [\App\Http\Controllers\ChatPanelController::class, 'daftarMabar'])->name('chat-panel.daftar');
    Route::get('/chat-panel/{mabar}/pesan', [\App\Http\Controllers\ChatPanelController::class, 'pesan'])->name('chat-panel.pesan');
    Route::post('/chat-panel/{mabar}/kirim', [\App\Http\Controllers\ChatPanelController::class, 'kirim'])->middleware('throttle:30,1')->name('chat-panel.kirim');

    
    Route::get('/pengaturan/akun', [\App\Http\Controllers\AkunController::class, 'edit'])->name('pengaturan.akun');
    Route::put('/pengaturan/akun/profil', [\App\Http\Controllers\AkunController::class, 'updateProfil'])->name('pengaturan.akun.profil');
    Route::put('/pengaturan/akun/password', [\App\Http\Controllers\AkunController::class, 'updatePassword'])->name('pengaturan.akun.password');
    Route::post('/pengaturan/akun/lupa-password/kirim-otp', [\App\Http\Controllers\AkunController::class, 'kirimOtpLupaPassword'])->name('pengaturan.akun.lupa-password.kirim-otp');
    Route::post('/pengaturan/akun/lupa-password/verifikasi', [\App\Http\Controllers\AkunController::class, 'verifikasiOtpLupaPassword'])->name('pengaturan.akun.lupa-password.verifikasi');
});

// =========================================================================
// 3. AREA STAF INTERNAL (Guard: staff)
// Sesi terpisah untuk karyawan lapangan, dibagi menjadi Panel Admin dan Panel Kasir.
// =========================================================================
Route::middleware('auth:staff')->group(function () {
    Route::post('/staff/logout', [\App\Http\Controllers\Auth\StaffLoginController::class, 'destroy'])->name('staff.logout');

    // -------------------------------------------------------------
    // PANEL ADMIN (Role: admin)
    // Hak akses: Operasional reservasi, approval mabar, member, dan laporan.
    // -------------------------------------------------------------
    Route::middleware('role:admin,staff')->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');

        // Reservasi Lapangan & Transaksi Sewa
        Route::get('/admin/reservasi', [\App\Http\Controllers\Admin\ReservasiController::class, 'index'])->name('admin.reservasi');
        Route::post('/admin/reservasi/regular', [\App\Http\Controllers\Admin\ReservasiController::class, 'storeRegular'])->name('admin.reservasi.store-regular');
        Route::post('/admin/reservasi/autofield/preview', [\App\Http\Controllers\Admin\ReservasiController::class, 'previewAutofield'])->name('admin.reservasi.preview-autofield');
        Route::post('/admin/reservasi/autofield', [\App\Http\Controllers\Admin\ReservasiController::class, 'storeAutofield'])->name('admin.reservasi.store-autofield');
        Route::post('/admin/reservasi/{id}/pelunasan', [\App\Http\Controllers\Admin\ReservasiController::class, 'pelunasan'])->name('admin.reservasi.pelunasan');
        Route::post('/admin/reservasi/{id}/cancel', [\App\Http\Controllers\Admin\ReservasiController::class, 'cancel'])->name('admin.reservasi.cancel');
        Route::post('/admin/reservasi/{id}/finish', [\App\Http\Controllers\Admin\ReservasiController::class, 'finish'])->name('admin.reservasi.finish');
        Route::post('/admin/reservasi/{id}/reschedule', [\App\Http\Controllers\Admin\ReservasiController::class, 'reschedule'])->name('admin.reservasi.reschedule');
        Route::delete('/admin/reservasi/{id}', [\App\Http\Controllers\Admin\ReservasiController::class, 'destroy'])->name('admin.reservasi.destroy');
        Route::get('/admin/reservasi/search-customers', [\App\Http\Controllers\Admin\ReservasiController::class, 'searchCustomers'])->name('admin.reservasi.search-customers');
        Route::post('/admin/reservasi/quick-customer', [\App\Http\Controllers\Admin\ReservasiController::class, 'quickCustomer'])->name('admin.reservasi.quick-customer');

        // Persetujuan Open Mabar
        Route::get('/admin/open-mabar', [\App\Http\Controllers\Admin\OpenMabarController::class, 'index'])->name('admin.open-mabar');
        Route::get('/admin/open-mabar/notifikasi', [\App\Http\Controllers\Admin\OpenMabarController::class, 'notifikasi'])->name('admin.open-mabar.notifikasi');
        Route::get('/admin/open-mabar/{id}/conflict', [\App\Http\Controllers\Admin\OpenMabarController::class, 'checkConflict'])->name('admin.open-mabar.conflict');
        Route::post('/admin/open-mabar/{id}/approve', [\App\Http\Controllers\Admin\OpenMabarController::class, 'approve'])->name('admin.open-mabar.approve');
        Route::post('/admin/open-mabar/{id}/reject', [\App\Http\Controllers\Admin\OpenMabarController::class, 'reject'])->name('admin.open-mabar.reject');

        // Paket & Keanggotaan Member
        Route::get('/admin/member', [\App\Http\Controllers\Admin\MemberController::class, 'index'])->name('admin.member');
        Route::put('/admin/member/{user}/status', [\App\Http\Controllers\Admin\MemberController::class, 'updateStatus'])->name('admin.member.update-status');
        Route::post('/admin/member/{user}/paket', [\App\Http\Controllers\Admin\MemberController::class, 'storePaket'])->name('admin.member.store-paket');
        Route::post('/admin/member/paket/{paket}/adjust', [\App\Http\Controllers\Admin\MemberController::class, 'adjustPaket'])->name('admin.member.adjust-paket');
        Route::post('/admin/member/paket/{paket}/cancel', [\App\Http\Controllers\Admin\MemberController::class, 'cancelPaket'])->name('admin.member.cancel-paket');

        // Laporan Rekapitulasi & Ekspor Excel
        Route::get('/admin/laporan', [\App\Http\Controllers\Admin\LaporanController::class, 'index'])->name('admin.laporan');
        Route::post('/admin/laporan/pemeriksaan-lapangan', [\App\Http\Controllers\Admin\LaporanController::class, 'storePemeriksaan'])->name('admin.laporan.pemeriksaan-lapangan.store');
        Route::get('/admin/laporan/ekspor', [\App\Http\Controllers\Admin\LaporanController::class, 'ekspor'])->name('admin.laporan.ekspor');
    });

    // -------------------------------------------------------------
    // PANEL KASIR (Role: kasir)
    // Hak akses: Operasional kasir POS (snack, minuman), shift kasir, restock, opname, void/retur.
    // -------------------------------------------------------------
    Route::middleware('role:kasir,staff')->group(function () {
        Route::get('/kasir', [KasirController::class, 'index'])->name('kasir.dashboard');
        Route::get('/kasir/shift', [KasirController::class, 'shift'])->name('kasir.shift');
        Route::post('/kasir/shift/buka', [KasirController::class, 'bukaShift'])->name('kasir.shift.buka');
        Route::post('/kasir/shift/tutup', [KasirController::class, 'tutupShift'])->name('kasir.shift.tutup');
        Route::post('/kasir/checkout', [KasirController::class, 'checkout'])->name('kasir.checkout');
        Route::get('/kasir/struk/{id}', [KasirController::class, 'struk'])->name('kasir.struk');
        Route::get('/kasir/riwayat', [KasirController::class, 'riwayat'])->name('kasir.riwayat');

        Route::get('/kasir/produk', [KasirController::class, 'produkIndex'])->name('kasir.produk.index');
        Route::post('/kasir/produk', [KasirController::class, 'produkStore'])->name('kasir.produk.store');
        Route::put('/kasir/produk/{id}', [KasirController::class, 'produkUpdate'])->name('kasir.produk.update');

        Route::get('/kasir/restock', [KasirController::class, 'restockIndex'])->name('kasir.restock.index');
        Route::post('/kasir/restock', [KasirController::class, 'restockStore'])->name('kasir.restock.store');

        Route::get('/kasir/opname', [KasirController::class, 'opnameIndex'])->name('kasir.opname.index');
        Route::post('/kasir/opname', [KasirController::class, 'opnameStore'])->name('kasir.opname.store');
    });
});
