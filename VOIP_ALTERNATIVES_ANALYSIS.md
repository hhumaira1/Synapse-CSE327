# 🎯 VoIP Solutions & Architecture Analysis

## 📞 VoIP Platform Comparison (2025)

### 1. **LiveKit** (RECOMMENDED) ⭐
- **Type**: Open-source WebRTC infrastructure
- **Pricing**: FREE (self-hosted) or $0.01/min (cloud)
- **Best For**: Full-featured calling with recording, transcription
- **Pros**:
  - ✅ Built-in TURN/STUN servers (NAT traversal)
  - ✅ AI voice agents support (OpenAI/Deepgram)
  - ✅ Official React/Android/iOS SDKs
  - ✅ Recording & transcription built-in
  - ✅ Easy WebRTC abstraction
- **Cons**:
  - ⚠️ Learning curve for advanced features
  - ⚠️ Self-hosting requires infrastructure knowledge
- **Use Case**: **Perfect for SynapseCRM** - CRM needs recording, transcription, call quality

---

### 2. **Twilio Voice**
- **Type**: Cloud telephony API
- **Pricing**: $0.0085/min + $1/month per number
- **Best For**: PSTN calling (dial real phone numbers)
- **Pros**:
  - ✅ Most mature platform (15+ years)
  - ✅ Global phone numbers
  - ✅ SMS integration
  - ✅ Excellent documentation
- **Cons**:
  - ❌ Expensive at scale ($0.0085/min = $510/10k mins)
  - ❌ Requires Twilio account management
  - ❌ Complex WebRTC setup
- **Use Case**: When you need to call **real phone numbers** (mobile/landline)

---

### 3. **Agora.io**
- **Type**: Real-time engagement platform
- **Pricing**: FREE (10k mins/month), then $0.99/1k mins
- **Best For**: Video conferencing, live streaming
- **Pros**:
  - ✅ Better pricing than Twilio ($0.99/1k mins vs $8.50/1k mins)
  - ✅ Strong in Asia/China markets
  - ✅ Video + screen sharing
  - ✅ Official React/Android SDKs
- **Cons**:
  - ⚠️ Complex SDK
  - ⚠️ Less popular in West (documentation gaps)
  - ⚠️ No built-in AI agent support
- **Use Case**: Multi-party video calls or Asia-focused deployments

---

### 4. **Daily.co**
- **Type**: Video/audio API
- **Pricing**: FREE (10k mins/month), then $0.0015/min
- **Best For**: Embedded video meetings
- **Pros**:
  - ✅ Simplest API (1 line of code to embed)
  - ✅ Pre-built UI components
  - ✅ Recording & transcription
  - ✅ No server-side code needed
- **Cons**:
  - ⚠️ Limited customization
  - ⚠️ Video-first (audio-only not optimized)
  - ⚠️ Smaller community
- **Use Case**: Quick MVP or video-heavy use cases

---

### 5. **Vonage (formerly Nexmo)**
- **Type**: CPaaS (Communications Platform)
- **Pricing**: $0.009/min + phone number costs
- **Best For**: Enterprise SMS + Voice
- **Pros**:
  - ✅ Strong SMS capabilities
  - ✅ Global coverage
  - ✅ Enterprise SLAs
- **Cons**:
  - ❌ Expensive
  - ❌ Complex API
  - ❌ Outdated SDKs
- **Use Case**: Enterprise only (not recommended for startups)

---

### 6. **Jitsi Meet** (Self-Hosted)
- **Type**: Open-source video conferencing
- **Pricing**: FREE (100% open source)
- **Best For**: Privacy-focused or fully self-hosted
- **Pros**:
  - ✅ Completely free
  - ✅ No account required
  - ✅ End-to-end encryption
  - ✅ Self-hosted control
- **Cons**:
  - ❌ Manual infrastructure setup
  - ❌ No managed recording
  - ❌ Limited mobile SDKs
  - ❌ Scalability challenges
- **Use Case**: Government/healthcare with strict privacy needs

---

### 7. **Whereby** (Embedded)
- **Type**: Embedded video rooms
- **Pricing**: $9.99/month (3 rooms)
- **Best For**: Simple embedded meetings
- **Pros**:
  - ✅ No app download needed
  - ✅ Browser-based
  - ✅ Beautiful UI
- **Cons**:
  - ❌ Video-only focus
  - ❌ Limited API control
  - ❌ Not for high-volume usage
- **Use Case**: Simple 1-on-1 video support calls

---

## 🏆 Final Recommendation: **LiveKit**

**Why LiveKit wins for SynapseCRM**:
1. ✅ **CRM-specific features**: Recording, transcription, call analytics
2. ✅ **Cost**: FREE self-hosted or $0.01/min (vs Twilio's $0.0085/min)
3. ✅ **Developer experience**: Modern SDKs, excellent docs
4. ✅ **Scalability**: Used by GitHub, Figma, Notion
5. ✅ **AI agents**: Can build voice AI receptionists later

---

## 🔌 WebSocket Alternatives Comparison

### 1. **Socket.IO** (CURRENT - KEEP IT) ⭐
- **Type**: Event-based real-time library
- **Best For**: General real-time communication
- **Pros**:
  - ✅ Auto-reconnection
  - ✅ Fallback to long-polling
  - ✅ Room/namespace support
  - ✅ Easy to use
- **Cons**:
  - ⚠️ Not pure WebSocket (adds overhead)
- **Use Case**: **Keep for call signaling, active status, notifications**

---

### 2. **Server-Sent Events (SSE)**
- **Type**: HTTP-based one-way push
- **Best For**: Server → Client updates only
- **Pros**:
  - ✅ Built into browsers (no library)
  - ✅ Auto-reconnect
  - ✅ Simpler than WebSockets
- **Cons**:
  - ❌ One-way only (server → client)
  - ❌ Not suitable for bidirectional signaling
- **Use Case**: Notifications, live feeds (not for calling)

---

### 3. **WebRTC Data Channels**
- **Type**: Peer-to-peer data transfer
- **Best For**: Direct P2P communication
- **Pros**:
  - ✅ No server needed (after signaling)
  - ✅ Low latency
  - ✅ Encrypted by default
- **Cons**:
  - ❌ Complex NAT traversal
  - ❌ Still needs signaling server
- **Use Case**: File sharing, gaming (not for signaling)

---

### 4. **GraphQL Subscriptions**
- **Type**: Query-based real-time
- **Best For**: GraphQL-heavy apps
- **Pros**:
  - ✅ Type-safe subscriptions
  - ✅ Unified API (REST + real-time)
- **Cons**:
  - ❌ Overkill for simple signaling
  - ❌ Requires GraphQL setup
- **Use Case**: If already using GraphQL

---

### 5. **Pusher / Ably**
- **Type**: Managed real-time services
- **Pricing**: Pusher ($49/month), Ably (FREE 6M msgs)
- **Best For**: No server-side WebSocket management
- **Pros**:
  - ✅ Fully managed (no infra)
  - ✅ SDKs for all platforms
  - ✅ Auto-scaling
- **Cons**:
  - ❌ Cost ($$$)
  - ❌ Vendor lock-in
- **Use Case**: Enterprise with budget

---

### 6. **Firebase Realtime Database / Firestore**
- **Type**: Real-time database
- **Pricing**: FREE (generous), then pay-as-you-go
- **Best For**: Simple presence/status tracking
- **Pros**:
  - ✅ Built-in presence system
  - ✅ Offline sync
  - ✅ Easy to use
- **Cons**:
  - ⚠️ Not designed for call signaling
  - ⚠️ Vendor lock-in (Google)
- **Use Case**: Active status tracking (not call signaling)

---

### 7. **Native WebSockets (ws library)**
- **Type**: Raw WebSocket implementation
- **Best For**: Full control, minimal overhead
- **Pros**:
  - ✅ Lightweight
  - ✅ No abstraction overhead
  - ✅ Maximum performance
- **Cons**:
  - ❌ Manual reconnection logic
  - ❌ No room/namespace features
  - ❌ More boilerplate
- **Use Case**: High-performance, low-latency needs

---

## 🏆 Signaling Recommendation: **Keep Socket.IO**

**Why Socket.IO is perfect for SynapseCRM**:
1. ✅ **Already installed** in both backend and frontend
2. ✅ **Auto-reconnection** - handles network drops
3. ✅ **Room support** - perfect for multi-tenant isolation
4. ✅ **Event-based** - clean API for call signaling
5. ✅ **Fallback** - works even if WebSocket blocked

**Alternative for Active Status**: Consider **Firebase Presence** or **Supabase Realtime** for simple online/offline tracking (optional optimization later).

---

## 📱 Android Calling Architecture (Future Implementation)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ANDROID CALLING STACK                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Layer 1: UI Layer (Jetpack Compose)                        │
├─────────────────────────────────────────────────────────────┤
│  - CallScreen.kt          → Active call UI                  │
│  - IncomingCallDialog.kt  → Accept/reject incoming          │
│  - CallNotificationService → Background call notifications  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: ViewModel Layer                                    │
├─────────────────────────────────────────────────────────────┤
│  - CallViewModel.kt       → Call state management           │
│  - Call states: IDLE, RINGING, CONNECTING, ACTIVE, ENDED   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Service Layer (Android Services)                  │
├─────────────────────────────────────────────────────────────┤
│  - CallConnectionService  → Native Android call integration │
│    (extends ConnectionService - integrates with phone UI)   │
│                                                              │
│  - CallForegroundService  → Keep app alive during calls     │
│    (prevents system from killing app)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Network Layer (Data/Remote)                       │
├─────────────────────────────────────────────────────────────┤
│  A) SIGNALING (Socket.IO)                                   │
│     - CallSignalingManager.kt → Connect to signaling server │
│     - Emit: initiate-call, accept-call, end-call           │
│     - Listen: incoming-call, call-accepted, call-ended      │
│                                                              │
│  B) MEDIA (LiveKit)                                         │
│     - LiveKitManager.kt → Room management                   │
│     - AudioTrackManager.kt → Mic/speaker control           │
│     - ConnectionQualityMonitor.kt → Network health         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: System Integration                                │
├─────────────────────────────────────────────────────────────┤
│  - AudioManager          → Audio routing (earpiece/speaker) │
│  - NotificationManager   → Call notifications               │
│  - PowerManager.WakeLock → Keep screen on during calls      │
│  - Proximity Sensor      → Turn off screen near ear         │
└─────────────────────────────────────────────────────────────┘
```

---

### Key Android Components

#### 1. **CallConnectionService** (Critical for Native Integration)
```kotlin
class CallConnectionService : ConnectionService() {
    // Integrates with Android's native phone UI
    // Shows calls in phone app, lock screen, Bluetooth devices
    
    override fun onCreateOutgoingConnection(...): Connection {
        // Handle outgoing call
    }
    
    override fun onCreateIncomingConnection(...): Connection {
        // Handle incoming call
    }
}
```

**Why needed**: Makes your app calls appear in:
- Native phone app history
- Bluetooth car systems
- Smartwatches
- Lock screen call UI

---

#### 2. **Firebase Cloud Messaging (FCM)** for Call Notifications
```kotlin
class CallNotificationService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        // Receive incoming call notification even when app is killed
        showIncomingCallNotification()
    }
}
```

**Why needed**: Wake up app for incoming calls when:
- App is in background
- App is killed
- Phone is locked

---

#### 3. **Audio Routing Strategy**
```kotlin
sealed class AudioDevice {
    object Earpiece      // Default for voice calls
    object Speaker       // Speakerphone
    object WiredHeadset  // Headphones/earbuds
    object Bluetooth     // Bluetooth headset/car
}

class AudioRouter {
    fun switchTo(device: AudioDevice) {
        audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
        // Handle routing logic
    }
}
```

---

### Android Implementation Phases (When You're Ready)

#### **Phase A: Prerequisites (1 day)**
1. Add permissions (`RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `BLUETOOTH_CONNECT`)
2. Install dependencies:
   ```kotlin
   implementation("io.livekit:livekit-android:2.9.0")
   implementation("io.socket:socket.io-client:2.1.0")
   implementation("com.google.firebase:firebase-messaging:24.1.0")
   ```

#### **Phase B: Signaling (1 day)**
3. Create `CallSignalingManager.kt` (Socket.IO client)
4. Connect to `http://your-backend:3001/call` namespace
5. Emit/listen for call events

#### **Phase C: LiveKit Integration (2 days)**
6. Create `LiveKitManager.kt` (room management)
7. Handle audio tracks (mute/unmute)
8. Connection quality monitoring

#### **Phase D: Native Integration (2 days)**
9. Implement `CallConnectionService` (system phone UI)
10. Add `CallForegroundService` (keep alive)
11. Audio routing logic (earpiece/speaker/Bluetooth)

#### **Phase E: UI (1-2 days)**
12. Build `CallScreen` with Jetpack Compose
13. Create `IncomingCallDialog`
14. Call history screen

**Total**: **7-8 days** for full Android implementation

---

## 🌐 Web-to-Web Calling Architecture (FOCUS NOW)

### Simplified Architecture for Phase 1

```
┌────────────────────────────────────────────────────────────┐
│              WEB-TO-WEB CALLING (MVP)                      │
└────────────────────────────────────────────────────────────┘

USER A (Internal CRM)                USER B (Portal Customer)
     │                                        │
     │  1. Click "Call Customer"              │
     ├──────────────────────────────────────► │
     │  Socket.IO: emit('initiate-call')      │
     │                                         │
     │                                         │  2. Notification Modal
     │                                         │  "Incoming call from [Agent]"
     │                                         │
     │  3. Accept Call                         │
     │  ◄──────────────────────────────────────┤
     │  Socket.IO: emit('accept-call')         │
     │                                          │
     │  4. Both fetch LiveKit tokens            │
     ├────────────► BACKEND API ◄──────────────┤
     │  POST /api/livekit/token                 │
     │                                          │
     │  5. Join LiveKit Room                    │
     ├────────────► LiveKit Cloud ◄────────────┤
     │  Connect to wss://livekit...             │
     │                                          │
     │  6. Audio streaming via WebRTC           │
     │  ◄═══════════════════════════════════════│
     │                                          │
     │  7. End Call                             │
     ├──────────────────────────────────────►  │
     │  Socket.IO: emit('end-call')            │
```

---

### Active Status System Architecture

```
┌────────────────────────────────────────────────────────────┐
│              ACTIVE STATUS TRACKING                        │
└────────────────────────────────────────────────────────────┘

FRONTEND                    BACKEND                  DATABASE
   │                           │                        │
   │  1. User logs in          │                        │
   ├──────────────────────────►│                        │
   │  Socket.IO: connect       │                        │
   │                           │                        │
   │                           │  2. Update status      │
   │                           ├───────────────────────►│
   │                           │  SET user:123 ONLINE   │
   │                           │  (Redis or Postgres)   │
   │                           │                        │
   │  3. Broadcast to tenant   │                        │
   │  ◄────────────────────────┤                        │
   │  emit('user-online', {userId})                     │
   │                           │                        │
   │  4. Heartbeat every 30s   │                        │
   │  ─────────────────────────►                        │
   │  emit('heartbeat')        │                        │
   │                           │                        │
   │  5. User disconnects      │                        │
   │  ────────────────────────►│                        │
   │  Socket disconnect        │                        │
   │                           │  6. Update status      │
   │                           ├───────────────────────►│
   │                           │  SET user:123 OFFLINE  │
   │                           │  SET lastSeen: now()   │
```

---

### Multi-Tenant Isolation for Calls

```typescript
// Backend: Ensure tenant isolation
async initiateCall(fromUserId: string, toUserId: string, tenantId: string) {
  // 1. Verify both users in same tenant
  const [fromUser, toUser] = await prisma.user.findMany({
    where: { id: { in: [fromUserId, toUserId] } }
  });

  if (!fromUser || !toUser) {
    throw new Error('User not found');
  }

  if (fromUser.tenantId !== tenantId || toUser.tenantId !== tenantId) {
    throw new Error('Cross-tenant calls not allowed');
  }

  // 2. Create room with tenant prefix
  const roomName = `${tenantId}-call-${Date.now()}`;
  
  // 3. Proceed with call...
}
```

---

## 🎯 Implementation Plan: Web-to-Web Calling ONLY

### Phase 1A: Backend - Active Status (1 day)

**Files to Create**:
1. `server/src/presence/presence.gateway.ts`
2. `server/src/presence/presence.service.ts`
3. `server/src/presence/presence.module.ts`

**Features**:
- Track online/offline status
- Heartbeat mechanism (disconnect after 60s inactivity)
- Broadcast status changes to tenant members
- Store last seen timestamp

---

### Phase 1B: Backend - Call Signaling (1 day)

**Files to Create**:
1. `server/src/livekit/livekit.service.ts` (token generation)
2. `server/src/livekit/call-signaling.gateway.ts` (Socket.IO)
3. `server/src/livekit/livekit.controller.ts` (REST endpoints)

**Features**:
- Generate LiveKit tokens
- Initiate call signaling
- Accept/reject call logic
- End call cleanup

---

### Phase 2: Frontend - Active Status UI (0.5 day)

**Files to Create**:
1. `Frontend/src/contexts/PresenceContext.tsx`
2. `Frontend/src/components/ui/StatusIndicator.tsx`

**Features**:
- Green dot for online users
- Gray dot for offline users
- "Last seen 5 mins ago" tooltip

---

### Phase 3: Frontend - Web Calling UI (2 days)

**Files to Create**:
1. `Frontend/src/contexts/LiveKitContext.tsx`
2. `Frontend/src/components/voip/CallButton.tsx`
3. `Frontend/src/components/voip/IncomingCallModal.tsx`
4. `Frontend/src/components/voip/ActiveCallView.tsx`

**Features**:
- Call button next to contacts/leads (only if online)
- Incoming call notification modal
- Active call UI (mute, end call)
- Call duration timer

---

### Phase 4: Portal Customer Integration (1 day)

**Files to Modify**:
1. `Frontend/src/app/portal/layout.tsx` (add LiveKitProvider)
2. Create portal-specific call UI

**Features**:
- Customers can receive calls from agents
- Customers can see agent availability
- Call history in portal

---

### Total: **4.5 days** for web-to-web calling with active status

---

## 📊 Feature Priority Matrix

| Feature                     | Priority | Days | Why?                                    |
|-----------------------------|----------|------|-----------------------------------------|
| Active status (online/away) | 🔴 HIGH  | 1    | Must know who's available before calling |
| Agent → Customer calls      | 🔴 HIGH  | 2    | Core CRM feature                        |
| Customer → Agent calls      | 🟡 MEDIUM| 1    | Nice-to-have for self-service           |
| Call recording              | 🟡 MEDIUM| 0.5  | LiveKit built-in (just enable)          |
| Call history/logs           | 🟢 LOW   | 0.5  | Already have CallLog model              |
| Screen sharing              | 🟢 LOW   | 1    | Future enhancement                      |
| Group calls (3+ people)     | ⚪ LATER | 2    | Not MVP                                 |

---

## 🚀 Next Steps (Start Today)

1. ✅ **Confirm**: Use LiveKit + Socket.IO (best combo)
2. ✅ **Install**: `npm install livekit-server-sdk` in backend
3. ✅ **Install**: `npm install @livekit/components-react livekit-client` in frontend
4. 🔨 **Build**: Active status system first (foundation)
5. 🔨 **Build**: Call signaling with Socket.IO
6. 🔨 **Build**: Web calling UI
7. ✅ **Test**: Internal agent → Portal customer calls

---

**Ready to start implementation?** I can begin with:
- **Option A**: Active status system (backend + frontend)
- **Option B**: LiveKit backend setup (token generation + signaling)
- **Option C**: Complete web calling implementation (all at once)

Which would you prefer? 🚀
