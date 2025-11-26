# VoIP Realtime Fix - Step by Step

## Problem
Backend creates calls successfully but frontend doesn't show incoming call notifications.

## Root Cause
**Supabase Realtime is NOT enabled for the `call_events` table.**

---

## ✅ SOLUTION: Run This SQL in Supabase

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `rjwewskfdfylbgzxxfjf`
3. Click **SQL Editor** in left sidebar

### Step 2: Run This SQL
```sql
-- ============================================
-- Enable Realtime for call_events table
-- ============================================

-- Add call_events to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE call_events;

-- Grant read permissions to authenticated users
GRANT SELECT ON call_events TO authenticated;

-- Grant full permissions to service_role
GRANT ALL PRIVILEGES ON call_events TO service_role;

-- Disable RLS to allow service role full access
ALTER TABLE call_events DISABLE ROW LEVEL SECURITY;

-- Verify Realtime is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'call_events';

-- Check publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'call_events';
```

### Step 3: Verify
The last query should return:
```
pubname            | schemaname | tablename
-------------------+------------+-------------
supabase_realtime  | public     | call_events
```

---

## 🔍 Testing After SQL

### Test 1: CRM User Calls Portal Customer
1. **CRM Dashboard** → Go to Contacts page
2. Click phone icon next to a contact with portal access
3. **Check backend logs** - should see: "Call started: CRM_USER → PORTAL_CUSTOMER"
4. **Portal Customer should see** - Incoming call modal with caller name

### Test 2: Portal Customer Calls CRM Agent
1. **Portal Dashboard** → Click "Call Support" button
2. Select an available agent from list
3. **Check backend logs** - should see: "Call started: PORTAL_CUSTOMER → CRM_USER"
4. **CRM User should see** - Incoming call modal

---

## 🐛 If Still Not Working

### Check Browser Console (F12)
Look for:
```javascript
✅ Subscribed to call events for user: <userId>
📞 Call event received: CALL_STARTED {...}
```

If you see subscription but NO event received → Supabase Realtime still not configured

### Check Network Tab
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for Supabase Realtime connection
4. Should see messages coming through when call is initiated

### Verify Environment Variables
```bash
# Frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://rjwewskfdfylbgzxxfjf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check Backend Logs
Backend should show:
```
[VoipService] 📞 Call initiated: CRM_USER(...) → PORTAL_CUSTOMER(...)
[LiveKitService] 🏠 Created room: ...
[VoipService] ✅ Call started: CRM_USER → PORTAL_CUSTOMER in room ...
```

✅ If you see these logs → backend is working, issue is frontend Realtime subscription

---

## 📝 Changes Already Made

### Backend ✅
- Fixed enum values (CALL_STARTED uppercase)
- Using Prisma CallEvent model (not Supabase direct insert)
- Proper tenant isolation
- getTenantId() helper for dual-identity users

### Frontend ✅
- Fixed column names in subscription (caller_id/callee_id)
- Fixed CallEvent interface to match database
- CallManager uses useUserData (has tenantId + supabaseUserId)
- CallManager in root layout (works for both dashboard and portal)
- AgentSelector only fetches when dialog opens

---

## 🚨 CRITICAL: Run the SQL First!

Without the Realtime SQL, the database will NOT broadcast events to the frontend, so calls will never appear.

**After running SQL:**
1. Refresh frontend page
2. Test calls again
3. Check browser console for "Call event received" messages
