# Local API Testing Guide

## ✅ Setup Complete!

Your local environment is now configured for API testing.

## 🚀 Current Status

- **Backend**: Running on `http://localhost:5000` ✅
- **Admin Dashboard**: Running on `http://localhost:5173` ✅
- **API Mode**: **LOCAL** (configured in `admin/src/config/api.config.ts`)

## 🧪 How to Test

### Step 1: Access Admin Dashboard

Open your browser and go to:
```
http://localhost:5173
```

### Step 2: Login to Admin Dashboard

Use your admin credentials to login.

### Step 3: Navigate to API Management

1. Click on **"API Management"** in the sidebar
2. Go to the **"Test API"** tab

### Step 4: Get a Test API Key

1. Switch to the **"API Keys"** tab
2. Find a user or generate a new API key for testing
3. Copy the API key (you can reveal it by clicking the eye icon)

### Step 5: Run the Test

1. Go back to the **"Test API"** tab
2. Enter the API key you copied
3. Fill in test data:
   - **Phone**: 08012345678
   - **Network**: Select MTN/Airtel/Glo/9mobile
   - **Plan**: Select a data plan (will auto-populate amount)
4. Click **"Execute API Call"**

## 📊 What to Expect

### ✅ Successful Response
```json
{
  "success": true,
  "message": "Data purchase successful",
  "data": {
    "transaction": { ... },
    "provider_response": { ... }
  }
}
```

### ❌ Failed Response Examples

**Invalid API Key:**
```json
{
  "success": false,
  "message": "Invalid or disabled API key"
}
```

**Authentication Error:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Network Error (Failed to fetch):**
```json
{
  "success": false,
  "message": "Failed to fetch"
}
```

## 🔄 Switching Between Local and Production

To switch from **local** to **production** testing:

1. Open: `admin/src/config/api.config.ts`
2. Change line 7:
   ```typescript
   export const USE_LOCAL_API = false; // Changed from true to false
   ```
3. Save the file
4. The admin dashboard will hot-reload with the new configuration

### Current Endpoints

**Local Mode (`USE_LOCAL_API = true`):**
- Admin API: `http://localhost:5000/api/admin`
- General API: `http://localhost:5000/api`

**Production Mode (`USE_LOCAL_API = false`):**
- Admin API: `https://api.ibdata.com.ng/api/admin`
- General API: `https://api.ibdata.com.ng/api`

## 🐛 Debugging Tips

### Check Backend Logs

The backend console will show:
- `🔐 API Key authentication attempt` - API key received
- `✅ API Key validated for user: user@example.com` - Authentication successful
- `❌ Invalid or disabled API key` - Authentication failed

### Common Issues

1. **"Failed to fetch"** error:
   - Backend not running → Check if port 5000 is active
   - Wrong API URL → Check `api.config.ts` settings
   - CORS issue → Should be fixed for localhost

2. **"Invalid or disabled API key"**:
   - API key doesn't exist in database
   - API key is disabled (`api_key_enabled: false`)
   - Wrong API key format

3. **"No token provided"**:
   - Missing authentication header
   - Using wrong authentication method

## 📝 Testing Checklist

- [ ] Backend is running on port 5000
- [ ] Admin dashboard is running on port 5173
- [ ] `USE_LOCAL_API` is set to `true` in `api.config.ts`
- [ ] You have a valid API key
- [ ] API key is enabled in database
- [ ] Network/plan selections are valid

## 🎯 Recommendation

**Answer to your question:** 

**Test with LOCAL admin dashboard first!** 

Here's why:
1. ✅ **Immediate feedback** - See backend logs in real-time
2. ✅ **No network issues** - Eliminates CORS, VPS, and network problems
3. ✅ **Quick debugging** - Can check database and modify code instantly
4. ✅ **Safe testing** - Won't affect production data

Once everything works locally, then test on production VPS to ensure:
- Reverse proxy (nginx) is configured correctly
- SSL certificates are working
- CORS is properly configured
- Environment variables are set correctly

## 🔗 Quick Commands

**Check if backend is running:**
```bash
curl http://localhost:5000/api/billpayment/test-auth
```

**Expected response:**
```json
{"success":false,"message":"No token provided"}
```

**Test with API key:**
```bash
curl -X GET http://localhost:5000/api/billpayment/test-auth \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## 🎉 You're All Set!

The admin dashboard is now connected to your local backend. You can test all API functionality safely without worrying about production issues.
