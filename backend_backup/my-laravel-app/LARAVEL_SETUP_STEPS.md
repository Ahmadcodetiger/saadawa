# Laravel API Setup Steps (Windows + Production)

This file is intentionally practical: copy/paste commands, then we implement the controllers/services to match `demo/` and your React Native app.

## A. Create A Real Laravel API Project

Your current `backend/my-laravel-app/` looks like a placeholder (key Laravel files/folders are missing). The clean approach is to create a fresh Laravel project in a new folder, then port the API.

From `C:\Users\USER\Desktop\VTUApp-main\VTUApp-main\backend`:

```powershell
composer create-project laravel/laravel laravel-api
cd laravel-api
php artisan key:generate
```

If you want to reuse `backend/my-laravel-app/` as the real project folder, we can do that too, but it’s riskier unless the placeholder contents are removed first.

## B. Configure API Auth (Sanctum)

In the Laravel project folder:

```powershell
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"
php artisan migrate
```

Then ensure `app/Http/Kernel.php` has `\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class`
only if you plan to use cookie-based auth. For React Native, we typically use Bearer tokens only, so this can stay unused.

## C. Database + Core Migrations

Set your DB in `.env` then create migrations:

```powershell
php artisan make:migration create_users_table
php artisan make:migration create_wallets_table
php artisan make:migration create_transactions_table
php artisan make:migration create_otps_table
php artisan make:migration create_notifications_table
php artisan make:migration create_support_tickets_table
php artisan make:migration create_promotions_table
```

We’ll model fields based on `demo/src/models/*.ts` (see `LARAVEL_API_GUIDE.md`).

## D. Match Frontend Response Shape

Create a small response helper (or base controller) so every endpoint returns:

```json
{ "success": true, "message": "OK", "data": { } }
```

And errors return:

```json
{ "success": false, "message": "Validation error", "errors": { "field": ["..."] } }
```

## E. Routes And Controllers (What We Generate)

We will create controllers mirroring the current contract:

- `AuthController` (`/auth/register`, `/auth/login`, OTP + password reset)
- `UserController` (`/users/profile`, `/users/password`, `/users/transaction-pin`, `/users/kyc`)
- `WalletController` (`/wallet`, `/wallet/fund`, `/wallet/transactions`, `/wallet/transfer`)
- `TransactionController` (`/transactions`, `/transactions/{id}`, `/transactions/{id}/status`)
- `BillPaymentController` (`/billpayment/*`)
- `NotificationController` (`/notifications/*`)
- `SupportController` (`/support/*`)
- `PromotionController` (`/promotions/*`)
- `AdminController` (`/admin/*`)
- `PaymentController` (`/payment/*`, webhooks)

## F. API Key Support (x-api-key) For Billpayment

Add a middleware `ApiKeyOptionalAuth` that:

- Reads `X-API-Key`
- Finds a user with `api_key` + `api_key_enabled`
- Sets `auth()->setUser($user)` and continues
- If no API key: do nothing (Sanctum Bearer token still works)

Apply it before `auth:sanctum` on the `/billpayment/*` route group.

## G. CORS For React Native / Expo

Configure `config/cors.php`:

- `allowed_origins`: your production domain(s) plus local Expo origins when developing
- `allowed_headers`: include `Authorization` and `X-API-Key`
- `paths`: `['api/*', 'sanctum/csrf-cookie']` (csrf-cookie optional for mobile)

## H. Production Essentials

- Rate limiting:
  - `POST /auth/login`, OTP endpoints: strict (per IP + per email/phone)
  - All other endpoints: reasonable defaults
- Webhook verification:
  - Paystack/Monnify/Payrant signature verification is mandatory
- Wallet consistency:
  - Always update wallet + insert transaction inside a DB transaction
  - Add idempotency for payment verification and webhook replays
- Queue:
  - Send OTP, billpayment provider calls, and webhook processing via queues

## I. What I Need From You (One Confirmation)

Which folder should become the real Laravel project?

- Option 1: `backend/laravel-api` (recommended fresh project)
- Option 2: reuse `backend/my-laravel-app` (we clean/replace placeholder contents)

Reply with just: `laravel-api` or `my-laravel-app`.

