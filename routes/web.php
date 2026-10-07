<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\KasirController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::middleware('role:user')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Open Mabar routes
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

        // Chat Mabar routes
        Route::get('/open-mabar/{mabar}/chat', [\App\Http\Controllers\ChatMabarController::class, 'index'])->name('open-mabar.chat');
        Route::post('/open-mabar/{mabar}/chat', [\App\Http\Controllers\ChatMabarController::class, 'kirimPesan'])->name('open-mabar.chat.kirim');

        // Pengaturan Akun (UC-10)
        Route::get('/pengaturan/akun', [\App\Http\Controllers\AkunController::class, 'edit'])->name('pengaturan.akun');
        Route::put('/pengaturan/akun/profil', [\App\Http\Controllers\AkunController::class, 'updateProfil'])->name('pengaturan.akun.profil');
        Route::put('/pengaturan/akun/password', [\App\Http\Controllers\AkunController::class, 'updatePassword'])->name('pengaturan.akun.password');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');
    });

    Route::middleware('role:kasir')->group(function () {
        Route::get('/kasir', [KasirController::class, 'index'])->name('kasir.dashboard');
    });
});
