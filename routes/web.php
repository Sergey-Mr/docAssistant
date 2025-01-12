<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TextController;
use App\Http\Controllers\TabController;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['auth', 'ensure.default.tab'])->group(function () {
    Route::get('/dashboard', function () {
        $currentTab = request()->query('tab') 
            ? Auth::user()->tabs()->findOrFail(request()->query('tab'))
            : Auth::user()->tabs()->first();

        return view('dashboard', compact('currentTab'));
    })->name('dashboard');
    
    Route::post('/tabs', [TabController::class, 'store'])->name('tabs.store');
});
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/text/update', [TextController::class, 'update'])->name('text.update');

    Route::post('/tabs', [TabController::class, 'store'])->name('tabs.store');
});

require __DIR__.'/auth.php';
