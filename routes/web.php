<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;

// Health check (no middleware - used by Railway)
Route::get('/up', fn () => response('OK', 200));

// Frontend routes - scoped by site domain
Route::middleware(['identify.site'])->group(function () {
    Route::get('/', [ArticleController::class, 'index'])->name('home');
    Route::get('/categorie/{category:slug}', [CategoryController::class, 'show'])->name('category.show');
    Route::get('/{article:slug}', [ArticleController::class, 'show'])->name('article.show');
    Route::get('/pagina/{page:slug}', [PageController::class, 'show'])->name('page.show');
});
