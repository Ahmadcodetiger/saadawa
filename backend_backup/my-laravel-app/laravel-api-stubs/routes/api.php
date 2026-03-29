<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| This structure mirrors the existing frontend calls and the `demo/` backend.
| All endpoints return JSON and should follow:
| { success: bool, message: string, data?: any, errors?: any }
|
*/

Route::prefix('auth')->group(function () {
    Route::post('register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('verify-otp', [\App\Http\Controllers\Api\AuthController::class, 'verifyOtp']);
    Route::post('resend-otp', [\App\Http\Controllers\Api\AuthController::class, 'resendOtp']);
    Route::post('forgot-password', [\App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
    Route::post('verify-email-otp', [\App\Http\Controllers\Api\AuthController::class, 'verifyEmailOtp']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Users
    Route::prefix('users')->group(function () {
        Route::get('profile', [\App\Http\Controllers\Api\UserController::class, 'getProfile']);
        Route::put('profile', [\App\Http\Controllers\Api\UserController::class, 'updateProfile']);
        Route::delete('profile', [\App\Http\Controllers\Api\UserController::class, 'deleteProfile']);
        Route::put('password', [\App\Http\Controllers\Api\UserController::class, 'updatePassword']);
        Route::post('transaction-pin', [\App\Http\Controllers\Api\UserController::class, 'setTransactionPin']);
        Route::put('transaction-pin', [\App\Http\Controllers\Api\UserController::class, 'updateTransactionPin']);
        Route::post('kyc', [\App\Http\Controllers\Api\UserController::class, 'uploadKyc']);
    });

    // Wallet
    Route::prefix('wallet')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\WalletController::class, 'getWallet']);
        Route::post('fund', [\App\Http\Controllers\Api\WalletController::class, 'fundWallet']);
        Route::get('transactions', [\App\Http\Controllers\Api\WalletController::class, 'getWalletTransactions']);
        Route::post('transfer', [\App\Http\Controllers\Api\WalletController::class, 'transferFunds']);
        Route::put('adjust', [\App\Http\Controllers\Api\WalletController::class, 'adjustBalance']);
    });

    // Transactions
    Route::prefix('transactions')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
        Route::get('{id}', [\App\Http\Controllers\Api\TransactionController::class, 'show']);
        Route::put('{id}/status', [\App\Http\Controllers\Api\TransactionController::class, 'updateStatus']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
        Route::get('{id}', [\App\Http\Controllers\Api\NotificationController::class, 'show']);
        Route::put('{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::put('read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
        Route::delete('{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
        Route::delete('/', [\App\Http\Controllers\Api\NotificationController::class, 'destroyAll']);
    });

    // Support
    Route::prefix('support')->group(function () {
        Route::post('/', [\App\Http\Controllers\Api\SupportController::class, 'store']);
        Route::get('/', [\App\Http\Controllers\Api\SupportController::class, 'index']);
        Route::get('{id}', [\App\Http\Controllers\Api\SupportController::class, 'show']);
        Route::put('{id}', [\App\Http\Controllers\Api\SupportController::class, 'update']);
        Route::put('{id}/status', [\App\Http\Controllers\Api\SupportController::class, 'updateStatus']);
        Route::delete('{id}', [\App\Http\Controllers\Api\SupportController::class, 'destroy']);
    });

    // Promotions
    Route::prefix('promotions')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\PromotionController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\PromotionController::class, 'store']);
        Route::get('{id}', [\App\Http\Controllers\Api\PromotionController::class, 'show']);
        Route::put('{id}', [\App\Http\Controllers\Api\PromotionController::class, 'update']);
        Route::delete('{id}', [\App\Http\Controllers\Api\PromotionController::class, 'destroy']);
    });

    // Payment (webhooks are public; see below)
    Route::prefix('payment')->group(function () {
        Route::post('initiate', [\App\Http\Controllers\Api\PaymentController::class, 'initiate']);
        Route::get('verify/{reference}', [\App\Http\Controllers\Api\PaymentController::class, 'verify']);
        Route::get('banks', [\App\Http\Controllers\Api\PaymentController::class, 'banks']);

        Route::post('virtual-account', [\App\Http\Controllers\Api\PaymentController::class, 'createVirtualAccount']);
        Route::get('virtual-account', [\App\Http\Controllers\Api\PaymentController::class, 'getVirtualAccount']);
        Route::delete('virtual-account', [\App\Http\Controllers\Api\PaymentController::class, 'deactivateVirtualAccount']);
    });

    // Admin
    Route::prefix('admin')->group(function () {
        Route::post('login', [\App\Http\Controllers\Api\AdminController::class, 'login'])->withoutMiddleware('auth:sanctum');
        Route::middleware([\App\Http\Middleware\AdminOnly::class])->group(function () {
            Route::get('dashboard', [\App\Http\Controllers\Api\AdminController::class, 'dashboard']);

            Route::get('users', [\App\Http\Controllers\Api\AdminController::class, 'usersIndex']);
            Route::get('users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'usersShow']);
            Route::put('users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'usersUpdate']);
            Route::put('users/{id}/status', [\App\Http\Controllers\Api\AdminController::class, 'usersUpdateStatus']);
            Route::delete('users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'usersDestroy']);

            Route::post('users/{id}/api-key', [\App\Http\Controllers\Api\AdminController::class, 'generateApiKey']);
            Route::delete('users/{id}/api-key', [\App\Http\Controllers\Api\AdminController::class, 'revokeApiKey']);

            Route::get('audit-logs', [\App\Http\Controllers\Api\AdminController::class, 'auditLogsIndex']);
            Route::delete('audit-logs/{id}', [\App\Http\Controllers\Api\AdminController::class, 'auditLogsDestroy']);
        });
    });
});

// Billpayment: allow either X-API-Key OR Bearer token (Sanctum).
Route::prefix('billpayment')
    ->middleware([\App\Http\Middleware\ApiKeyOptionalAuth::class])
    ->group(function () {
        Route::get('balance', [\App\Http\Controllers\Api\BillPaymentController::class, 'balance']);
        Route::get('networks', [\App\Http\Controllers\Api\BillPaymentController::class, 'networks']);
        Route::get('data-plans', [\App\Http\Controllers\Api\BillPaymentController::class, 'dataPlans']);
        Route::get('cable-providers', [\App\Http\Controllers\Api\BillPaymentController::class, 'cableProviders']);
        Route::get('electricity-providers', [\App\Http\Controllers\Api\BillPaymentController::class, 'electricityProviders']);
        Route::get('exampin-providers', [\App\Http\Controllers\Api\BillPaymentController::class, 'examPinProviders']);

        Route::post('airtime', [\App\Http\Controllers\Api\BillPaymentController::class, 'buyAirtime']);
        Route::post('data', [\App\Http\Controllers\Api\BillPaymentController::class, 'buyData']);

        Route::post('cable/verify', [\App\Http\Controllers\Api\BillPaymentController::class, 'verifyCable']);
        Route::post('cable/purchase', [\App\Http\Controllers\Api\BillPaymentController::class, 'buyCable']);

        Route::post('electricity/verify', [\App\Http\Controllers\Api\BillPaymentController::class, 'verifyElectricity']);
        Route::post('electricity/purchase', [\App\Http\Controllers\Api\BillPaymentController::class, 'buyElectricity']);

        Route::post('exampin', [\App\Http\Controllers\Api\BillPaymentController::class, 'buyExamPin']);
        Route::get('transaction/{reference}', [\App\Http\Controllers\Api\BillPaymentController::class, 'transactionStatus']);
    });

// Payment webhooks (public). Implement gateway signature verification in controller.
Route::prefix('payment/webhook')->group(function () {
    Route::post('monnify', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'monnify']);
    Route::post('paystack', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'paystack']);
    Route::post('payrant', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'payrant']);
});
