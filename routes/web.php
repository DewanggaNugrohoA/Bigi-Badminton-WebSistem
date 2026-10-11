<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware('guest:web')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
    Route::get('/register/verifikasi', [RegisterController::class, 'verifikasiCreate'])->name('register.verifikasi');
    Route::post('/register/verifikasi', [RegisterController::class, 'verifikasiStore']);
    Route::post('/register/kirim-ulang-otp', [RegisterController::class, 'kirimUlangOtp'])->name('register.kirim-ulang-otp');
});

Route::middleware('guest:staff')->group(function () {
    Route::get('/staff/login', [\App\Http\Controllers\Auth\StaffLoginController::class, 'create'])->name('staff.login');
    Route::post('/staff/login', [\App\Http\Controllers\Auth\StaffLoginController::class, 'store'])->name('staff.login.store');
});

Route::middleware(['auth:web', 'role:user,web'])->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    
    Route::get('/open-mabar', [\App\Http\Controllers\OpenMabarController::class, 'index'])->name('open-mabar.index');
    Route::get('/open-mabar/create', [\App\Http\Controllers\OpenMabarController::class, 'create'])->name('open-mabar.create');
    Route::post('/open-mabar', [\App\Http\Controllers\OpenMabarController::class, 'store'])->name('open-mabar.store');
    Route::get('/open-mabar/saya', [\App\Http\Controllers\OpenMabarController::class, 'saya'])->name('open-mabar.saya');
    Route::get('/open-mabar/{mabar}', [\App\Http\Controllers\OpenMabarController::class, 'show'])->name('open-mabar.show');
    Route::get('/open-mabar/{mabar}/edit', [\App\Http\Controllers\OpenMabarController::class, 'edit'])->name('open-mabar.edit');
    Route::put('/open-mabar/{mabar}/edit', [\App\Http\Controllers\OpenMabarController::class, 'update'])->name('open-mabar.update');
    Route::delete('/open-mabar/{mabar}', [\App\Http\Controllers\OpenMabarController::class, 'destroy'])->name('open-mabar.destroy');
    Route::post('/open-mabar/{mabar}/ikut', [\App\Http\Controllers\OpenMabarController::class, 'ikut'])->name('open-mabar.ikut');
    Route::delete('/open-mabar/{mabar}/ikut', [\App\Http\Controllers\OpenMabarController::class, 'batalIkut'])->name('open-mabar.batal-ikut');

    
    Route::get('/chat-panel/daftar', [\App\Http\Controllers\ChatPanelController::class, 'daftarMabar'])->name('chat-panel.daftar');
    Route::get('/chat-panel/{mabar}/pesan', [\App\Http\Controllers\ChatPanelController::class, 'pesan'])->name('chat-panel.pesan');
    Route::post('/chat-panel/{mabar}/kirim', [\App\Http\Controllers\ChatPanelController::class, 'kirim'])->name('chat-panel.kirim');

    
    Route::get('/pengaturan/akun', [\App\Http\Controllers\AkunController::class, 'edit'])->name('pengaturan.akun');
    Route::put('/pengaturan/akun/profil', [\App\Http\Controllers\AkunController::class, 'updateProfil'])->name('pengaturan.akun.profil');
    Route::put('/pengaturan/akun/password', [\App\Http\Controllers\AkunController::class, 'updatePassword'])->name('pengaturan.akun.password');
});

Route::middleware('auth:staff')->group(function () {
    Route::post('/staff/logout', [\App\Http\Controllers\Auth\StaffLoginController::class, 'destroy'])->name('staff.logout');

    Route::middleware('role:admin,staff')->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');

        
        Route::get('/admin/reservasi', [\App\Http\Controllers\Admin\ReservasiController::class, 'index'])->name('admin.reservasi');
        Route::post('/admin/reservasi/regular', [\App\Http\Controllers\Admin\ReservasiController::class, 'storeRegular'])->name('admin.reservasi.store-regular');
        Route::post('/admin/reservasi/autofield/preview', [\App\Http\Controllers\Admin\ReservasiController::class, 'previewAutofield'])->name('admin.reservasi.preview-autofield');
        Route::post('/admin/reservasi/autofield', [\App\Http\Controllers\Admin\ReservasiController::class, 'storeAutofield'])->name('admin.reservasi.store-autofield');
        Route::post('/admin/reservasi/{id}/pelunasan', [\App\Http\Controllers\Admin\ReservasiController::class, 'pelunasan'])->name('admin.reservasi.pelunasan');
        Route::post('/admin/reservasi/{id}/cancel', [\App\Http\Controllers\Admin\ReservasiController::class, 'cancel'])->name('admin.reservasi.cancel');
        Route::post('/admin/reservasi/{id}/finish', [\App\Http\Controllers\Admin\ReservasiController::class, 'finish'])->name('admin.reservasi.finish');
        Route::get('/admin/reservasi/search-customers', [\App\Http\Controllers\Admin\ReservasiController::class, 'searchCustomers'])->name('admin.reservasi.search-customers');
        Route::post('/admin/reservasi/quick-customer', [\App\Http\Controllers\Admin\ReservasiController::class, 'quickCustomer'])->name('admin.reservasi.quick-customer');

        
        Route::get('/admin/open-mabar', [\App\Http\Controllers\Admin\OpenMabarController::class, 'index'])->name('admin.open-mabar');
        Route::get('/admin/open-mabar/{id}/conflict', [\App\Http\Controllers\Admin\OpenMabarController::class, 'checkConflict'])->name('admin.open-mabar.conflict');
        Route::post('/admin/open-mabar/{id}/approve', [\App\Http\Controllers\Admin\OpenMabarController::class, 'approve'])->name('admin.open-mabar.approve');
        Route::post('/admin/open-mabar/{id}/reject', [\App\Http\Controllers\Admin\OpenMabarController::class, 'reject'])->name('admin.open-mabar.reject');
        Route::get('/admin/member', [\App\Http\Controllers\Admin\MemberController::class, 'index'])->name('admin.member');
        Route::put('/admin/member/{user}/status', [\App\Http\Controllers\Admin\MemberController::class, 'updateStatus'])->name('admin.member.update-status');
        Route::post('/admin/member/{user}/paket', [\App\Http\Controllers\Admin\MemberController::class, 'storePaket'])->name('admin.member.store-paket');
        Route::post('/admin/member/paket/{paket}/adjust', [\App\Http\Controllers\Admin\MemberController::class, 'adjustPaket'])->name('admin.member.adjust-paket');
        Route::post('/admin/member/paket/{paket}/cancel', [\App\Http\Controllers\Admin\MemberController::class, 'cancelPaket'])->name('admin.member.cancel-paket');

        
        Route::get('/admin/laporan', [\App\Http\Controllers\Admin\LaporanController::class, 'index'])->name('admin.laporan');

        
        Route::get('/admin/pengaturan', [AdminController::class, 'placeholder'])->name('admin.pengaturan');
    });
});
