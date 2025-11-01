# Authentication Flow Debug Guide

## Problem Diagnosis
The issue is that users aren't being created in the backend database after Clerk authentication. Here's how to fix and test it:

## Required Setup

### 1. Start Both Servers
You need both servers running simultaneously:

**Terminal 1 - Backend:**
```powershell
cd server
npm run start:dev
```
*Should show: "🚀 Backend running on http://localhost:3001/api"*

**Terminal 2 - Frontend:**
```powershell
cd Frontend
npm run dev
```
*Should show: "Ready - started server on 0.0.0.0:3000"*

### 2. Test Authentication Flow

#### Step 1: Access the Homepage
1. Go to `http://localhost:3000`
2. You should see the landing page with "Sign In" and "Get Started" buttons

#### Step 2: Sign Up Process
1. Click "Get Started" (this triggers `SignUpButton` modal)
2. Complete the Clerk sign-up form
3. After verification, you should be redirected to `/onboard`

#### Step 3: Onboarding Process
1. On `/onboard` page, enter a workspace name (e.g., "My Company")
2. Click "Create Workspace"
3. This makes a POST request to `/api/auth/onboard`
4. You should be redirected to `/dashboard`

### 3. Verify Database Creation

#### Backend Logs
Check backend terminal for logs like:
```
Created tenant abc123 and admin user def456
```

#### Database Check
You can verify users were created:
```powershell
cd server
npx prisma studio
```
Then check the `User` and `Tenant` tables.

## Common Issues & Solutions

### Issue 1: "Network Error" or API calls failing
**Cause:** Backend not running or CORS issues
**Solution:** 
- Ensure backend is running on port 3001
- Check `.env` file has correct `CLERK_SECRET_KEY`

### Issue 2: Onboard page shows "Failed to create workspace"
**Cause:** Authentication token not being sent
**Solution:**
- Check browser Network tab for 401/403 errors
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` matches backend

### Issue 3: Users can sign in but aren't in database
**Cause:** Skipping onboard flow
**Solution:**
- After Clerk sign-up, users MUST go through `/onboard`
- This is where the database user record is created

## Testing Commands

### Test Backend API Directly
```bash
# Test if backend is running
curl http://localhost:3001/api

# Test protected route (will fail without token)
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" http://localhost:3001/api/auth/me
```

### Check Browser Console
Open Developer Tools → Console for any JavaScript errors during authentication.

## Expected Flow
1. User clicks "Get Started" → Clerk modal opens
2. User completes signup → Redirected to `/onboard`
3. User enters workspace name → POST to `/api/auth/onboard`
4. Backend creates Tenant + User records → Returns success
5. Frontend redirects to `/dashboard`
6. Dashboard loads with user's data

The key missing piece was likely that **both servers need to be running** and users must complete the **onboarding step** to be created in your database.