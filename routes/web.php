<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('checkout');
})->name('home');

Route::get('/checkout', function () {
    return Inertia::render('checkout');
})->name('checkout');
