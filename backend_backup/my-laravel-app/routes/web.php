<?php

use Illuminate\Support\Facades\Route;

// Define web routes for the application
Route::get('/', function () {
    return view('welcome');
});

// Additional web routes can be defined here
// Example: Route::get('/about', [AboutController::class, 'index']);