# API Key Testing Guide

## Changes Made

### 1. Virtual Account Phone Number Support (10-digit numbers)
**File:** `backend/src/controllers/payment.controller.ts`

- Now automatically prepends '0' to 10-digit phone numbers when creating virtual accounts
- Users can provide either 10 or 11 digit phone numbers
- System validates and normalizes the number before sending to Payrant API

**Example:**
- User provides: `8012345678` (10 digits)
- System converts to: `08012345678` (11 digits)

### 2. Enhanced API Key Authentication
**File:** `backend/src/middleware/apiKey.middleware.ts`

**Improvements:**
- ✅ Case-insensitive header check (accepts both `x-api-key` and `X-API-Key`)
- ✅ Enhanced logging for debugging VPS issues
- ✅ More informative error messages
- ✅ Includes user email and role in the request object

**File:** `backend/src/routes/billpayment.routes.ts`
- ✅ Added test endpoint `/api/billpayment/test-auth` for quick authentication testing

## Testing API Key on VPS

### Step 1: Test Authentication Endpoint

Use this endpoint to verify your API key is working:

```bash
curl -X GET https://api.ibdata.com.ng/api/billpayment/test-auth \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "user_id_here",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Expected Response (Failure):**
```json
{
  "success": false,
  "message": "Invalid or disabled API key"
}
```

### Step 2: Check Wallet Balance

API users can check their wallet balance using this endpoint:

```bash
curl -X GET https://api.ibdata.com.ng/api/billpayment/balance \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "balance": 5000.50,
    "currency": "NGN"
  }
}
```

### Step 3: Purchase Responses
All purchase endpoints (`/airtime`, `/data`, etc.) now include the updated wallet balance in the response:

```json
{
  "success": true,
  "message": "Data purchase successful",
  "data": {
    "transaction": { ... },
    "balance": 4850.00,
    "provider_response": { ... }
  }
}
```

### Step 4: Check VPS Logs

On your VPS, check the application logs to see detailed authentication attempts:

```bash
# If using PM2
pm2 logs backend --lines 50

# If using systemd
journalctl -u your-app-name -n 50 -f

# Or check your log file directly
tail -f /path/to/your/logs/error.log
```

**Look for these log messages:**
- `🔐 API Key authentication attempt` - API key was provided
- `✅ API Key validated for user: user@example.com` - Success
- `❌ Invalid or disabled API key` - Key not found or disabled
- `🔑 No API key provided, continuing to JWT check` - No API key in request

### Step 3: Common VPS Issues & Solutions

#### Issue 1: CORS Headers
If you're calling from a browser/frontend, ensure CORS is configured:

```typescript
// In your app.ts or server.ts
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true,
  exposedHeaders: ['x-api-key']
}));
```

#### Issue 2: Case Sensitivity
Some HTTP clients/proxies convert headers to lowercase. The updated middleware now handles both:
- `x-api-key` ✅
- `X-API-Key` ✅

#### Issue 3: API Key Not Enabled
Verify in your database that the API key is enabled:

```javascript
// MongoDB query
db.users.findOne({ api_key: "your-api-key" })

// Check that:
// - api_key field matches exactly
// - api_key_enabled is true
```

#### Issue 4: Reverse Proxy Headers
If using nginx/apache, ensure headers are forwarded:

**Nginx:**
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header X-API-Key $http_x_api_key;
    proxy_pass_request_headers on;
}
```

**Apache:**
```apache
ProxyPreserveHost On
ProxyPass /api/ http://localhost:3000/
ProxyPassReverse /api/ http://localhost:3000/
```

### Step 4: Generate/Check API Key

To generate or check your API key, you can:

1. **Via Admin Dashboard** (if available)
2. **Via Database:**
   ```javascript
   // MongoDB Shell
   db.users.findOne({ email: "your-email@example.com" }, { api_key: 1, api_key_enabled: 1 })
   ```

3. **Update API Key Enabled Status:**
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { api_key_enabled: true } }
   )
   ```

## Testing Virtual Account Creation with 10-digit Phone

### Example Request:

```bash
curl -X POST https://your-vps-domain.com/api/payment/virtual-account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**If user has 10-digit phone number in database:**
- System will automatically convert it to 11 digits by prepending '0'
- Virtual account will be created successfully
- Console will log: `📱 Normalized 10-digit phone to 11 digits: 08012345678`

## Quick Debugging Checklist

- [ ] API key exists in database
- [ ] API key is enabled (`api_key_enabled: true`)
- [ ] API key matches exactly (no extra spaces)
- [ ] Headers are being sent correctly
- [ ] CORS is configured if calling from browser
- [ ] Reverse proxy is forwarding headers
- [ ] Check VPS logs for detailed error messages
- [ ] Test with the `/api/billpayment/test-auth` endpoint first

## Need More Help?

If authentication still fails on VPS after these checks:
1. Share the VPS logs showing the authentication attempt
2. Confirm the request headers being sent
3. Verify the database User document structure
