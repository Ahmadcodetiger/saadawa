# Laravel API Blueprint (VTU App)

This repo currently contains:

- `frontend/` (React Native / Expo) which calls a REST API under `/api`
- `demo/` (Node/Express + MongoDB) which defines the existing endpoint surface
- `backend/my-laravel-app/` (this folder) which is not yet a fully-installed Laravel app (placeholder files only)

This document is the plan to build a production-ready Laravel API that matches the frontend expectations and the `demo/` API contract.

## 1. What The React Native App Expects

From `frontend/services/*` the app uses:

- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/resend-otp`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/verify-email-otp`
- User
  - `GET /api/users/profile`
  - `PUT /api/users/profile`
  - `PUT /api/users/password`
  - `POST /api/users/transaction-pin`
  - `PUT /api/users/transaction-pin`
  - `POST /api/users/kyc`
  - `DELETE /api/users/profile`
- Wallet
  - `GET /api/wallet`
  - `POST /api/wallet/fund`
  - `GET /api/wallet/transactions`
  - `POST /api/wallet/transfer`
  - `PUT /api/wallet/adjust` (admin)
- Transactions
  - `GET /api/transactions` (paginated; filters optional)
  - `GET /api/transactions/:id`
  - `PUT /api/transactions/:id/status` (admin/system)
- Billpayment
  - `GET /api/billpayment/networks`
  - `GET /api/billpayment/data-plans?network=...`
  - `GET /api/billpayment/cable-providers`
  - `GET /api/billpayment/electricity-providers`
  - `GET /api/billpayment/exampin-providers`
  - `POST /api/billpayment/airtime`
  - `POST /api/billpayment/data`
  - `POST /api/billpayment/cable/verify`
  - `POST /api/billpayment/cable/purchase`
  - `POST /api/billpayment/electricity/verify`
  - `POST /api/billpayment/electricity/purchase`
  - `POST /api/billpayment/exampin`
  - `GET /api/billpayment/transaction/:reference`
  - `GET /api/billpayment/balance` (developer API key usage in `demo/`)
- Notifications
  - `GET /api/notifications`
  - `GET /api/notifications/:id`
  - `PUT /api/notifications/:id/read`
  - `PUT /api/notifications/read-all`
  - `DELETE /api/notifications/:id`
  - `DELETE /api/notifications`
- Support
  - `POST /api/support`
  - `GET /api/support`
  - `GET /api/support/:id`
  - `PUT /api/support/:id`
  - `PUT /api/support/:id/status`
  - `DELETE /api/support/:id`
- Promotions
  - `GET /api/promotions`
  - `POST /api/promotions`
  - `GET /api/promotions/:id`
  - `PUT /api/promotions/:id`
  - `DELETE /api/promotions/:id`
- Admin API (used by `frontend/services/api.ts`)
  - `POST /api/admin/login`
  - `GET /api/admin/dashboard`
  - `GET /api/admin/users`
  - `GET /api/admin/users/:id`
  - `PUT /api/admin/users/:id`
  - `PUT /api/admin/users/:id/status`
  - `DELETE /api/admin/users/:id`
  - `POST /api/admin/users/:id/api-key`
  - `DELETE /api/admin/users/:id/api-key`
  - `GET /api/admin/audit-logs`
  - `DELETE /api/admin/audit-logs/:id`
  - Pricing/Providers/Funding endpoints also exist in `demo/`
- Payment (wallet funding + webhooks)
  - `POST /api/payment/initiate`
  - `GET /api/payment/verify/:reference`
  - `GET /api/payment/banks`
  - `POST /api/payment/virtual-account`
  - `GET /api/payment/virtual-account`
  - `DELETE /api/payment/virtual-account`
  - `POST /api/payment/webhook/monnify`
  - `POST /api/payment/webhook/paystack`
  - `POST /api/payment/webhook/payrant`

The frontend sends `Authorization: Bearer <token>` after login/register, and some billpayment calls may use `x-api-key`.

## 2. Auth Strategy In Laravel (Production-Friendly)

Use **Laravel Sanctum** personal access tokens, because it:

- Works well with mobile apps (Bearer tokens)
- Avoids JWT token rotation complexity
- Supports token abilities/scopes for admin vs user vs developer API key

Token format still matches the frontend expectation: `Authorization: Bearer <token>`.

### API Key Support (Developer/Partner Access)

The `demo/` backend allows:

- If `x-api-key` is present and valid, treat request as authenticated (skip Bearer check)
- Otherwise require Bearer token

In Laravel, implement a middleware that:

- Reads `X-API-Key` header
- Looks up user where `api_key = ...` and `api_key_enabled = 1`
- If found: sets the authenticated user for the request (so downstream `auth()` works)
- If not present: does nothing (so Sanctum can authenticate via Bearer)

## 3. Data Model Mapping (Mongo -> SQL)

Minimum tables to satisfy the mobile app contract:

- `users`
  - `email` unique
  - `phone_number` unique
  - `password` (hash)
  - `first_name`, `last_name`
  - `country` default `Nigeria`
  - `kyc_status` enum (`pending`, `verified`, `rejected`)
  - `transaction_pin` (hash, nullable)
  - `api_key` (nullable, unique)
  - `api_key_enabled` boolean
  - `status` enum (`active`, `inactive`, `suspended`)
  - `referral_code` unique
  - `referred_by` nullable FK to users
- `wallets`
  - `user_id` unique FK
  - `balance` decimal (use integer kobo/naira-cents if you want exactness)
  - `currency` default `NGN`
  - `last_transaction_at` nullable
- `transactions`
  - `user_id`, `wallet_id`
  - `type` enum (`airtime_topup`, `data_purchase`, `bill_payment`, `wallet_topup`, `e-pin_purchase`)
  - `amount`, `fee`, `total_charged`
  - `status` enum (`pending`, `successful`, `failed`, `refunded`)
  - `reference_number` unique
  - `payment_method`
  - `description`, `destination_account`, `receipt_url`, `error_message` (nullable)
  - `operator_id` nullable FK
  - `plan_id` nullable FK
- `otps`
  - `channel` enum (`sms`, `email`)
  - `phone_number`/`email`
  - `code_hash`
  - `expires_at`
  - `consumed_at` nullable
- `notifications`
- `support_tickets` (+ optional `support_messages`)
- `promotions`

Admin panel needs more:

- `admin_users` (or reuse `users` with a `role` field)
- `audit_logs`
- `providers`, `operators`, `plans`, `funding_accounts`, `virtual_accounts`

Recommendation for simplicity: reuse `users` and add `role` (e.g. `user`, `admin`) unless you *must* keep a separate admin auth system.

## 4. Route Layout (Laravel)

Use `routes/api.php` with groups:

- `/auth/*` public (register/login/otp)
- protected group: `auth:sanctum`
  - `/users/*`, `/wallet/*`, `/transactions/*`, `/payment/*` (except webhooks)
- `/billpayment/*`: allow either `x-api-key` OR Bearer
  - middleware order: `api_key_optional` then `auth:sanctum`
- `/admin/*`: protected by an `admin` gate/middleware (token ability or role)
- `/payment/webhook/*`: public but must verify webhook signature per gateway

## 5. Response Shape (Keep Frontend Happy)

Return consistent JSON:

```json
{ "success": true, "message": "OK", "data": { } }
```

For validation errors, prefer:

```json
{ "success": false, "message": "Validation error", "errors": { "field": ["..."] } }
```

And use proper HTTP codes (`200`, `201`, `401`, `403`, `404`, `422`, `500`).

## 6. Production Hardening Checklist

- App
  - Set `APP_ENV=production`, `APP_DEBUG=false`, unique `APP_KEY`
  - Use `php artisan config:cache`, `route:cache`, `event:cache`
- Security
  - CORS locked to your Expo/web origins
  - `TrustProxies` configured behind Nginx/Cloudflare
  - Rate limiting per route group (login/otp strict)
  - Password policy and brute-force protection
  - Webhook signature verification (Paystack/Monnify/Payrant)
- Data integrity
  - Money fields: store in integer minor units (kobo) or use decimal with strict rounding
  - Use DB transactions for wallet funding + ledger updates
  - Idempotency keys for payment verification/webhooks
- Observability
  - Centralized logs (JSON) and request IDs
  - Sentry (optional) for errors
- Performance
  - Queue jobs for billpayment calls, SMS/email OTP sending, and webhook processing
  - Redis cache for data plans/providers list

## 7. Next Build Steps (What We Do Next)

1. Install prerequisites on your machine (or server):
   - PHP 8.2+ and Composer
   - MySQL/Postgres, Redis (recommended)
2. Create a real Laravel project (recommended in a new folder like `backend/laravel-api`), then we port endpoints from `demo/`.
3. Implement in this order:
   - Auth + token issuance
   - Users profile + transaction PIN
   - Wallet + transactions ledger
   - Billpayment facade + provider abstraction
   - Admin endpoints
   - Payments + webhooks

