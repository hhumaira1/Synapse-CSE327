# VoIP CRM ↔ Customer Calling - Implementation Complete

## 🎉 Implementation Status

✅ **Backend**: Complete and running on `http://localhost:3001`
✅ **Frontend**: Updated to support CRM ↔ Customer calling
✅ **Database**: Prisma schema updated with ParticipantType support

---

## 🔧 Configuration Required

### 1. Supabase Realtime Setup

Run these SQL commands in your **Supabase SQL Editor**:

```sql
-- Enable replica identity for call_events table (required for realtime)
ALTER TABLE call_events REPLICA IDENTITY FULL;

-- Add call_events to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE call_events;
```

**Why this is needed:**
- Supabase Realtime requires `REPLICA IDENTITY FULL` to broadcast row changes
- The publication makes the `call_events` table visible to realtime subscribers

---

## 🧪 Testing Guide

### Backend API Testing (PowerShell)

#### 1. Get Available Agents (Portal Customers)
```powershell
$headers = @{
    'Authorization' = 'Bearer YOUR_SUPABASE_JWT'
}

Invoke-RestMethod -Uri 'http://localhost:3001/api/voip/agents/available' `
  -Method GET `
  -Headers $headers
```

**Expected Response:**
```json
[
  {
    "supabaseUserId": "abc123...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "ADMIN"
  }
]
```

#### 2. Start a Call (CRM User → Portal Customer OR Portal Customer → CRM User)
```powershell
$body = @{
    calleeSupabaseId = "TARGET_SUPABASE_USER_ID"
    callerName = "Your Name"
} | ConvertTo-Json

$headers = @{
    'Authorization' = 'Bearer YOUR_SUPABASE_JWT'
    'Content-Type' = 'application/json'
}

Invoke-RestMethod -Uri 'http://localhost:3001/api/voip/start-call' `
  -Method POST `
  -Headers $headers `
  -Body $body
```

**Expected Response:**
```json
{
  "roomName": "call-abc123-def456-1732423456789",
  "callerToken": "eyJhbGciOiJIUzI1NiIs...",
  "calleeToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 3. Get Call History
```powershell
$headers = @{
    'Authorization' = 'Bearer YOUR_SUPABASE_JWT'
}

Invoke-RestMethod -Uri 'http://localhost:3001/api/voip/history' `
  -Method GET `
  -Headers $headers
```

**Expected Response:**
```json
[
  {
    "id": "call123",
    "fromUserId": "user1",
    "toUserId": "user2",
    "fromUserType": "CRM_USER",
    "toUserType": "PORTAL_CUSTOMER",
    "roomName": "call-abc123-def456-1732423456789",
    "startedAt": "2025-11-24T04:00:00.000Z",
    "endedAt": "2025-11-24T04:05:30.000Z",
    "duration": 330,
    "status": "COMPLETED"
  }
]
```

---

## 📱 Frontend Usage

### For CRM Users

#### 1. Call a Portal Customer
```tsx
import { CallButton } from '@/components/voip';

// In your contact detail page
<CallButton
  supabaseUserId={contact.supabaseUserId}
  userName={`${contact.firstName} ${contact.lastName}`}
  variant="outline"
  size="sm"
/>
```

### For Portal Customers

#### 1. Call Available CRM Agents
```tsx
import { AgentSelector } from '@/components/voip';

// In your portal customer dashboard
<AgentSelector variant="default" size="default" />

// Or with custom trigger
<AgentSelector>
  <Button variant="ghost">
    <Phone className="mr-2" />
    Need Help?
  </Button>
</AgentSelector>
```

### Global Call Management

Add this to your app layout to handle incoming calls:

```tsx
// app/layout.tsx
import { CallManager } from '@/components/voip';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CallManager />
        {children}
      </body>
    </html>
  );
}
```

---

## 🔍 How to Get Supabase JWT Token

### Method 1: From Browser Console (For Testing)
1. Open your app in Chrome
2. Open DevTools (F12)
3. Go to **Console** tab
4. Run:
```javascript
// If using @supabase/ssr
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);
```

### Method 2: From Network Tab
1. Open DevTools → **Network** tab
2. Perform any authenticated action (e.g., load dashboard)
3. Find a request to `/api/*`
4. Check **Request Headers** → `Authorization: Bearer ...`
5. Copy the token after "Bearer "

---

## 🏗️ Architecture Overview

### Database Flow
```
CRM User (User table)
  ↓ supabaseUserId = "abc123"
  ↓
CallLog
  ↓ fromUserType = "CRM_USER"
  ↓ toUserType = "PORTAL_CUSTOMER"
  ↓ toPortalCustomerId = "def456"
  ↓
Portal Customer (PortalCustomer table)
  ↓ supabaseUserId = "xyz789"
```

### Calling Flow

#### CRM User → Portal Customer
1. CRM user clicks **CallButton** with portal customer's `supabaseUserId`
2. Backend checks User table (not found) → checks PortalCustomer table (found)
3. Creates CallLog with `fromUserType=CRM_USER`, `toUserType=PORTAL_CUSTOMER`
4. Sends realtime event to portal customer via Supabase Realtime
5. Portal customer sees incoming call modal

#### Portal Customer → CRM User
1. Portal customer opens **AgentSelector**
2. Fetches available CRM agents via `/api/voip/agents/available`
3. Clicks agent to call → backend creates call with `fromUserType=PORTAL_CUSTOMER`, `toUserType=CRM_USER`
4. CRM user receives incoming call notification

---

## 🐛 Troubleshooting

### Issue: "No agents available"
**Cause:** No CRM users exist in the tenant
**Solution:**
1. Create a CRM user via `/api/auth/signup`
2. Ensure user has same `tenantId` as portal customer
3. Check database: `SELECT * FROM "User" WHERE "tenantId" = 'YOUR_TENANT_ID';`

### Issue: Incoming call not showing
**Cause:** Supabase Realtime not configured
**Solution:**
1. Run the SQL commands from **Configuration Required** section
2. Check Supabase dashboard → **Database** → **Replication** → Verify `call_events` table is published

### Issue: "Failed to start call"
**Possible Causes:**
1. **Invalid JWT token** → Get fresh token from browser
2. **Target user not found** → Verify `supabaseUserId` exists in User or PortalCustomer table
3. **LiveKit credentials missing** → Check backend `.env`:
   ```
   LIVEKIT_API_URL=wss://...
   LIVEKIT_API_KEY=...
   LIVEKIT_API_SECRET=...
   ```

### Issue: Call connects but no audio
**Cause:** LiveKit permissions or browser microphone access
**Solution:**
1. Check browser console for WebRTC errors
2. Ensure HTTPS or localhost (WebRTC requires secure context)
3. Grant microphone permissions in browser

---

## 📦 Files Modified/Created

### Backend (✅ Complete)
- ✅ `server/prisma/schema.prisma` - Added ParticipantType enum, CallLog relations
- ✅ `server/src/voip/voip.service.ts` - Dual participant detection
- ✅ `server/src/voip/voip.controller.ts` - Updated endpoints
- ✅ `server/src/voip/livekit.service.ts` - Fixed imports

### Frontend (✅ Complete)
- ✅ `Frontend/src/hooks/useCallEvents.ts` - Uses `supabaseUserId` instead of `userId`
- ✅ `Frontend/src/hooks/useAvailableAgents.ts` - NEW: Fetch CRM agents
- ✅ `Frontend/src/components/voip/CallButton.tsx` - Updated props
- ✅ `Frontend/src/components/voip/AgentSelector.tsx` - NEW: Agent picker for portal customers
- ✅ `Frontend/src/components/voip/CallManager.tsx` - Updated to use `supabaseUserId`
- ✅ `Frontend/src/components/voip/index.ts` - Export all VoIP components

---

## 🚀 Next Steps

1. **Run Supabase SQL** (see Configuration Required section)
2. **Test Backend APIs** using PowerShell commands above
3. **Add CallButton** to your contact/lead detail pages
4. **Add AgentSelector** to portal customer pages
5. **Verify realtime events** by opening two browser tabs (one CRM, one portal)

---

## 📞 Testing Checklist

- [ ] Run Supabase SQL commands
- [ ] Backend server running on port 3001
- [ ] GET `/api/voip/agents/available` returns CRM users
- [ ] POST `/api/voip/start-call` creates CallLog
- [ ] Incoming call modal shows up for callee
- [ ] Accept call connects to LiveKit room
- [ ] Audio works in both directions
- [ ] End call updates CallLog status
- [ ] Call history shows participant types

---

**Questions?** Check the backend logs for detailed error messages:
```powershell
cd "g:\Cse 327\synapse\server"
npm run start:dev
```

Look for:
- ✅ VoIP service initialized with Supabase Realtime
- ✅ LiveKit service initialized
- 📞 Call event logs when starting/accepting/ending calls
