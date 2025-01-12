<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TextController;
use App\Http\Controllers\TabController;
use App\Http\Controllers\TextProcessingController;
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

Route::post('/api/annotations/process', [TextProcessingController::class, 'process'])
    ->name('annotations.process')
    ->middleware('auth');

Route::post('/text/update', [TextController::class, 'update'])->name('api.text.update');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    Route::post('/text/update', [TextController::class, 'update'])->name('text.update');
    Route::get('/tabs/{tab}/content', [TabController::class, 'getContent'])->name('tabs.content');
    Route::delete('/tabs/{tab}', [TabController::class, 'destroy'])->name('tabs.destroy');

});

require __DIR__.'/auth.php';
