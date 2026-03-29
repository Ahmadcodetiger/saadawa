<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Define your API routes here

Route::middleware('api')->group(function () {
    // Example route
    Route::get('/example', function (Request $request) {
        return response()->json(['message' => 'Hello, API!']);
    });

    // Add more routes as needed
});