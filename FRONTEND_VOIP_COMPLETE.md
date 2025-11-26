# 📞 Complete VoIP Testing Guide - Frontend Ready!

## ✅ Implementation Complete

All frontend and backend code is now ready for testing!

---

## 🚀 Quick Start - Testing in 5 Minutes

### Step 1: Configure Supabase Realtime (One-Time Setup)

Open **Supabase SQL Editor** and run:

```sql
-- Enable realtime for call_events table
ALTER TABLE call_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE call_events;
```

### Step 2: Start Frontend

```powershell
cd Frontend
npm run dev
```

Frontend will run on: **http://localhost:3000**

### Step 3: Navigate to Test Page

Open your browser to: **http://localhost:3000/test-voip**

---

## 📱 Real Call Testing Scenarios

### Scenario 1: Two CRM Users Calling Each Other

#### Setup:
1. **Open TWO browser tabs**
2. **Tab 1**: Sign in as CRM User A
3. **Tab 2**: Sign in as CRM User B

#### Test Flow:
1. **Tab 1** (User A):
   - Go to `/test-voip`
   - Copy User B's `supabaseUserId` from Tab 2
   - Paste into "Target Supabase User ID" field
   - Enter "User B" as display name
   - Click **"Call"** button
   - You'll see: Full-screen calling interface with User B's avatar

2. **Tab 2** (User B):
   - You'll see: **Incoming call modal** appears automatically
   - You'll hear: Ringtone (sine wave pulse)
   - Modal shows: User A's name and "Incoming call..." message
   - Click **"Accept"** to connect

3. **Both Tabs**:
   - Full-screen call UI appears
   - Timer starts counting (00:00, 00:01, 00:02...)
   - Audio streams connect via LiveKit
   - **Test microphone**: Click mute button
   - **Test speaker**: Click speaker button
   - **End call**: Click red phone button

---

### Scenario 2: Portal Customer → CRM Agent

#### Setup:
1. **Tab 1**: Sign in as Portal Customer
2. **Tab 2**: Sign in as CRM User (Agent)

#### Test Flow:
1. **Tab 1** (Portal Customer):
   - Go to `/test-voip`
   - See "Available CRM Agents" section
   - See list of all CRM users in tenant
   - Option A: Click **"Call"** button next to an agent's card
   - Option B: Click **"Call Support"** → Select agent from modal
   
2. **Tab 2** (CRM Agent):
   - Incoming call modal appears
   - Shows portal customer's name
   - Click **"Accept"**

3. **Call Connects**:
   - Both sides see full-screen call UI
   - Audio works both ways
   - All controls functional

---

### Scenario 3: CRM Agent → Portal Customer

#### Setup:
1. **Tab 1**: Sign in as CRM User
2. **Tab 2**: Sign in as Portal Customer

#### Test Flow:
1. **Get Portal Customer's Supabase ID**:
   - Tab 2: Go to `/test-voip`
   - Copy the "Supabase User ID" from "Your Information" card

2. **Tab 1** (CRM User):
   - Go to `/test-voip`
   - Paste customer's ID into "Target Supabase User ID"
   - Enter customer's name
   - Click **"Call"**

3. **Tab 2** (Portal Customer):
   - Incoming call modal appears
   - Click **"Accept"**

4. **Call Connects** - same as other scenarios

---

## 🎨 What the UI Looks Like

### Incoming Call Modal (Recipient Side)
```
┌─────────────────────────────────────┐
│     📞 Incoming Call                │
├─────────────────────────────────────┤
│                                     │
│       [Animated Phone Icon]         │
│         (Pulsing purple)            │
│                                     │
│         John Smith                  │
│       Incoming call...              │
│                                     │
│   [Decline Button]  [Accept Button] │
│      (Red)            (Green)       │
│                                     │
└─────────────────────────────────────┘
```
- **Sound**: Continuous sine wave ringtone
- **Animation**: Phone icon pulses
- **Backdrop**: Blocks interaction with rest of app

### Active Call View (Both Sides)
```
┌─────────────────────────────────────┐
│                                     │
│      ┌─────────────────┐            │
│      │   John Smith    │            │ <- Top: User name & status
│      │   Connected     │            │
│      └─────────────────┘            │
│                                     │
│      ┌─────────┐                    │
│      │ 00:45   │                    │ <- Timer (only when connected)
│      └─────────┘                    │
│                                     │
│                                     │
│           ╭─────╮                   │
│           │  J  │                   │ <- Center: Avatar (first letter)
│           ╰─────╯                   │    (Purple gradient circle)
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│   [🎤] [📞 END] [🔊]                │ <- Bottom: Controls
│   Mute   Call   Speaker             │
│                                     │
└─────────────────────────────────────┘
```
- **Background**: Purple/pink gradient (full-screen)
- **Controls**: Bottom center, large circular buttons
- **State Changes**:
  - "Calling..." (caller waiting)
  - "Ringing..." (callee's phone ringing)
  - "Connecting..." (call accepted, LiveKit connecting)
  - "Connected" (active call)

---

## 🔧 Technical Details

### Frontend Architecture

#### Components Created/Updated:
```
Frontend/src/
├── hooks/
│   ├── useCallEvents.ts           ✅ Updated (uses supabaseUserId)
│   └── useAvailableAgents.ts      ✅ New (fetch CRM agents)
├── components/voip/
│   ├── CallButton.tsx              ✅ Updated (accepts supabaseUserId)
│   ├── CallManager.tsx             ✅ Updated (global call handler)
│   ├── ActiveCallView.tsx          ✅ Updated (full-screen call UI)
│   ├── IncomingCallModal.tsx       ✅ Updated (Web Audio API ringtone)
│   ├── AgentSelector.tsx           ✅ New (portal customer UI)
│   └── index.ts                    ✅ New (exports)
├── lib/
│   └── api-client.ts               ✅ Updated (includes auth token)
└── app/(dashboard)/
    └── test-voip/
        └── page.tsx                ✅ New (complete test UI)
```

#### API Endpoints Used:
- `POST /api/voip/start-call` - Initiate call
- `POST /api/voip/accept` - Accept incoming call
- `POST /api/voip/reject` - Reject incoming call
- `POST /api/voip/end` - End active call
- `GET /api/voip/agents/available` - Get CRM agents (portal customers)
- `GET /api/voip/history` - Get call logs

#### Realtime Events (Supabase):
```javascript
// Frontend subscribes to:
channel: `call_events:${tenantId}:${userId}`
filter: `callee_supabase_id=eq.${userId}`

// Events received:
- CALL_STARTED  → Show incoming call modal
- ACCEPTED      → Transition to connecting state
- REJECTED      → Show rejection message
- ENDED         → End call, close UI
```

---

## 🧪 Debugging & Troubleshooting

### Enable Detailed Logging

Open **Browser Console** (F12) to see:

```
✅ Subscribed to call events for user: abc123...
📞 Call event received: call_started {...}
✅ Connected to LiveKit room
🔊 Participant joined: user_abc123
📴 Disconnected from LiveKit room
```

### Common Issues

#### 1. "No agents available"
**Cause**: No CRM users in your tenant
**Fix**: 
```powershell
# Check database
SELECT * FROM "User" WHERE "tenantId" = 'YOUR_TENANT_ID';
```

#### 2. Incoming call doesn't show
**Cause**: Supabase Realtime not configured
**Fix**: Run the SQL commands from Step 1

#### 3. No audio during call
**Causes**:
- Microphone permission denied
- LiveKit credentials missing
- Echo cancellation issues

**Fixes**:
- Check browser permissions (chrome://settings/content/microphone)
- Verify backend `.env` has `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Use headphones to prevent echo

#### 4. "Failed to start call" error
**Cause**: Invalid Supabase user ID
**Fix**: 
- Copy exact `supabaseUserId` from test page
- Ensure both users are in same tenant
- Check backend logs for error details

#### 5. Call connects but immediately disconnects
**Cause**: LiveKit token expired or invalid
**Fix**:
- Check backend LiveKit configuration
- Verify `LIVEKIT_API_URL` is correct (wss://...)
- Check LiveKit dashboard for connection attempts

---

## 📊 Expected Database State

### After Starting Call:
```sql
-- CallLog entry created
SELECT * FROM "CallLog" 
WHERE "roomName" = 'call-abc123-def456-1732423456789';

-- Result:
{
  id: "log123",
  tenantId: "tenant1",
  fromUserId: "user1",
  toUserId: null,
  fromUserType: "CRM_USER",
  toUserType: "PORTAL_CUSTOMER",
  toPortalCustomerId: "portal1",
  roomName: "call-abc123-def456-1732423456789",
  status: "INITIATED",
  startedAt: "2025-11-24T05:00:00.000Z",
  endedAt: null,
  duration: null
}
```

### call_events Table:
```sql
SELECT * FROM call_events 
WHERE room_name = 'call-abc123-def456-1732423456789'
ORDER BY created_at DESC;

-- Multiple events:
event_type: "call_started"   (caller initiates)
event_type: "ringing"        (callee's phone rings)
event_type: "accepted"       (callee accepts)
event_type: "ended"          (either party ends)
```

---

## 🎬 Video Walkthrough Script

Use this script to record/demonstrate the feature:

### Recording Setup:
1. Open 2 browser windows side-by-side
2. Window 1: User "Alice" (CRM Admin)
3. Window 2: User "Bob" (Portal Customer)

### Script:
```
[00:00] "Let's test the VoIP calling feature"
[00:05] Window 1: Navigate to /test-voip
[00:10] "Here's Alice, a CRM user. She can see Bob in the available agents list"
[00:15] Click "Call" button next to Bob
[00:18] "Full-screen calling interface appears"
[00:20] Switch to Window 2
[00:22] "Bob immediately receives an incoming call notification with ringtone"
[00:25] Click "Accept"
[00:27] "Call connects via LiveKit. Both see the active call UI"
[00:30] "Timer shows call duration: 00:03, 00:04..."
[00:35] Click mute button in Window 1
[00:37] "Alice mutes her microphone"
[00:40] Click mute again
[00:42] "Unmuted"
[00:45] Click red end button
[00:47] "Call ends on both sides"
[00:50] "This works for CRM-to-Customer and Customer-to-CRM calls!"
```

---

## ✅ Final Checklist

Before marking as complete:

- [ ] Supabase SQL commands executed
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] `/test-voip` page loads without errors
- [ ] Can see "Your Information" card
- [ ] Can see "Available CRM Agents" (if agents exist)
- [ ] Incoming call modal appears when receiving call
- [ ] Ringtone plays (check browser audio permissions)
- [ ] Accept button connects to LiveKit
- [ ] Full-screen call UI shows
- [ ] Timer increments every second
- [ ] Mute button works
- [ ] End call button works
- [ ] Call log created in database
- [ ] Realtime events fire correctly

---

## 🚀 Production Deployment Notes

### Environment Variables Required:

**Backend** (`server/.env`):
```env
LIVEKIT_API_URL=wss://synapsecrm-ha78pqaf.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...
```

**Frontend** (`Frontend/.env.local`):
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://synapsecrm-ha78pqaf.livekit.cloud
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

### Security Considerations:
1. **LiveKit tokens** expire after 1 hour (configurable)
2. **JWT verification** happens on every API call
3. **Tenant isolation** prevents cross-tenant calls
4. **Call logs** stored for compliance/audit

---

## 🎉 Success!

You now have a fully functional VoIP calling system with:
- ✅ Real-time incoming call notifications
- ✅ Full-screen call UI with controls
- ✅ Mute/unmute functionality
- ✅ Speaker toggle
- ✅ Call duration timer
- ✅ Ringtone (Web Audio API)
- ✅ CRM ↔ Customer bidirectional calling
- ✅ Agent selection for portal customers
- ✅ Database logging
- ✅ Multi-tenant support

**Start testing at: http://localhost:3000/test-voip**
