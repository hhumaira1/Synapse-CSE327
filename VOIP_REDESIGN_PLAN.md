# SynapseCRM VoIP System - Complete Redesign Plan

## Executive Summary

**Status**: Current implementation REMOVED - Complete redesign required
**Decision**: Replace Supabase Realtime with dedicated WebSocket server (PartyKit recommended)
**Reason**: Supabase Realtime has proven unreliable for real-time call signaling with multiple issues:
- Duplicate Supabase client instances causing memory leaks
- Inconsistent event delivery (events not reaching clients)
- Complex subscription management across multiple components
- LiveKit DataChannel errors indicating signaling issues
- No clear separation between database operations and real-time messaging

---

## 🎯 New Architecture Overview

### Core Principles
1. **Separation of Concerns**: Database operations (Prisma/Supabase PostgreSQL) separate from real-time signaling
2. **Dedicated Signaling Server**: WebSocket server (PartyKit) for call events, presence, and coordination
3. **Media via LiveKit**: Continue using LiveKit Cloud for actual voice/video streaming (proven to work)
4. **Dual-Identity Support**: Handle both CRM Users and Portal Customers seamlessly
5. **Multi-Platform**: Web (Next.js), Android (Kotlin/Compose), future iOS support

### Technology Stack

#### Signaling Layer
**Primary Option: PartyKit** (Recommended)
- **What it is**: Edge-deployed WebSocket server with built-in room management
- **Why**: Specifically designed for real-time collaboration, automatic scaling, persistent connections
- **Deployment**: Edge-based (low latency), managed infrastructure
- **Cost**: Free tier available, pay-as-you-grow pricing
- **Features**:
  - Automatic connection management
  - Built-in room/channel abstraction
  - TypeScript-first API
  - Durable Objects for state management
  - Hibernation support (saves resources)

**Alternative Options**:
- **Socket.IO Server** (Self-hosted on Railway/Render)
  - Pros: Full control, battle-tested, room support
  - Cons: Need to manage deployment, scaling, health checks
  
- **Ably** (Managed service)
  - Pros: Enterprise-grade, excellent reliability
  - Cons: Higher cost, overkill for our use case
  
- **WebSocket Gateway in NestJS** (Current backend)
  - Pros: Collocated with existing API, no new deployment
  - Cons: Single point of failure, harder to scale independently

#### Media Layer (No Change)
- **LiveKit Cloud**: Continue using for WebRTC media streaming
- **Already Working**: Token generation, room management proven functional
- **Issue Was**: Signaling layer (Supabase Realtime), not LiveKit

#### Database Layer (No Change)
- **Supabase PostgreSQL**: Continue for data persistence (CallLog, CallEvent tables)
- **Prisma ORM**: Keep existing schema and queries
- **No Realtime Extension**: Use database only for persistence, not pub/sub

---

## 📊 System Flow Diagrams

### Call Initiation Flow (CRM → Portal Customer)
```
┌─────────────┐                ┌──────────────┐                ┌──────────────┐
│   CRM User  │                │   Backend    │                │  PartyKit    │
│  (Browser)  │                │   (NestJS)   │                │  WS Server   │
└──────┬──────┘                └──────┬───────┘                └──────┬───────┘
       │                              │                                │
       │ 1. Click "Call" button       │                                │
       │─────POST /voip/start────────>│                                │
       │     { calleeId }             │                                │
       │                              │ 2. Create CallLog & CallEvent  │
       │                              │    in PostgreSQL               │
       │                              │                                │
       │                              │ 3. Generate LiveKit tokens     │
       │                              │    (caller + callee)           │
       │                              │                                │
       │<─────Return tokens───────────│                                │
       │   { callerToken, roomName }  │                                │
       │                              │                                │
       │ 4. Connect to PartyKit       │                                │
       │────────WS connect───────────────────────────────────────────>│
       │     (with JWT auth)          │                                │
       │                              │                                │
       │ 5. Send CALL_STARTED event   │                                │
       │────────────────────────────────────────────────────────────>│
       │     { roomName, calleeId }   │                                │
       │                              │                                │
       │                              │    6. Broadcast to callee's    │
       │                              │       WebSocket connection     │
       │                              │                                │
┌──────┴──────┐                       │                    ┌───────────┴──────┐
│   Portal    │                       │                    │   Event routed   │
│  Customer   │<──────────────────────────────────────────┤   to calleeId    │
│  (Browser)  │   CALL_STARTED event │                    └──────────────────┘
└─────────────┘   { roomName, callerName, callerToken }
       │
       │ 7. Show incoming call modal
       │
       │ 8. Click "Accept"
       │────────WS send ACCEPTED──────────────────────────────────────>│
       │     { roomName }             │                                │
       │                              │                                │
       │<─────────────────────────────────────────────────────────────┤
       │   Broadcast ACCEPTED to all  │                                │
       │   participants in room       │                                │
       │                              │                                │
       │ 9. Both connect to LiveKit with tokens                        │
       │────────────────────> LiveKit Cloud <──────────────────────────│
       │                     (wss://synapsecrm-*.livekit.cloud)        │
       │                                                                │
       │ 10. Audio starts flowing via WebRTC                           │
       └────────────────────────────────────────────────────────────────┘
```

### Call State Synchronization
```
┌─────────────────────────────────────────────────────────────────────┐
│                     PartyKit Room State                             │
│  (Durable Object - survives connection drops)                       │
├─────────────────────────────────────────────────────────────────────┤
│  roomId: "tenant-abc-room-123"                                      │
│  participants: [                                                    │
│    { userId: "user-1", role: "caller", state: "connected" },       │
│    { userId: "user-2", role: "callee", state: "ringing" }          │
│  ]                                                                  │
│  callState: "RINGING" | "CONNECTED" | "ENDED"                      │
│  startedAt: "2025-11-24T10:30:00Z"                                 │
│  metadata: { tenantId, callLogId }                                 │
└─────────────────────────────────────────────────────────────────────┘
            │                              │
            │ onMessage()                  │ onConnect()
            ▼                              ▼
    ┌────────────────┐            ┌────────────────┐
    │   CRM Browser  │            │ Portal Browser │
    │  (WebSocket)   │            │  (WebSocket)   │
    └────────────────┘            └────────────────┘
```

### Event Types and Payloads
```typescript
// Call Signaling Events (WebSocket)
type CallEvent = 
  | { type: 'CALL_STARTED', roomName: string, callerId: string, callerName: string, calleeId: string }
  | { type: 'RINGING', roomName: string } // ACK from callee's browser
  | { type: 'ACCEPTED', roomName: string, acceptedBy: string }
  | { type: 'REJECTED', roomName: string, rejectedBy: string, reason?: string }
  | { type: 'ENDED', roomName: string, endedBy: string, duration: number }
  | { type: 'PARTICIPANT_JOINED', roomName: string, userId: string }
  | { type: 'PARTICIPANT_LEFT', roomName: string, userId: string }
  | { type: 'ERROR', message: string, roomName?: string }

// Presence Events (Optional)
type PresenceEvent =
  | { type: 'USER_ONLINE', userId: string, tenantId: string }
  | { type: 'USER_OFFLINE', userId: string, tenantId: string }
  | { type: 'USER_IN_CALL', userId: string, roomName: string }
```

---

## 🏗️ Implementation Phases

### Phase 1: PartyKit Setup & Basic Signaling (Week 1)

#### 1.1 PartyKit Server Deployment
```bash
# Create new PartyKit project
npx partykit@latest init synapse-voip-server
cd synapse-voip-server
npm install
```

**File Structure**:
```
synapse-voip-server/
├── partykit.config.ts          # PartyKit configuration
├── src/
│   ├── server.ts                # Main PartyKit server logic
│   ├── types.ts                 # Shared TypeScript types
│   ├── auth.ts                  # JWT verification (Supabase tokens)
│   └── rooms/
│       ├── CallRoom.ts          # Call-specific room logic
│       └── PresenceRoom.ts      # User presence tracking
├── package.json
└── tsconfig.json
```

**server.ts** (Main PartyKit Server):
```typescript
import type * as Party from "partykit/server";
import { verifySupabaseToken } from './auth';
import { CallEvent, ParticipantInfo } from './types';

export default class VoipServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // State: Active participants in this call room
  private participants = new Map<string, ParticipantInfo>();
  private callState: 'IDLE' | 'RINGING' | 'CONNECTED' | 'ENDED' = 'IDLE';
  private startTime?: number;

  /**
   * Handle new WebSocket connection
   */
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[${this.room.id}] New connection: ${conn.id}`);

    // 1. Verify JWT token from query params
    const token = new URL(ctx.request.url).searchParams.get('token');
    if (!token) {
      conn.close(1008, 'Missing authentication token');
      return;
    }

    try {
      const userData = await verifySupabaseToken(token);
      
      // 2. Store connection metadata
      conn.setState({ 
        userId: userData.supabaseUserId, 
        tenantId: userData.tenantId,
        role: userData.role // 'CRM_USER' | 'PORTAL_CUSTOMER'
      });

      this.participants.set(conn.id, {
        connectionId: conn.id,
        userId: userData.supabaseUserId,
        tenantId: userData.tenantId,
        role: userData.role,
        name: userData.name
      });

      // 3. Notify others about new participant
      this.broadcast({
        type: 'PARTICIPANT_JOINED',
        roomName: this.room.id,
        userId: userData.supabaseUserId,
        participant: this.participants.get(conn.id)
      }, conn.id); // Exclude sender

      // 4. Send current room state to new connection
      conn.send(JSON.stringify({
        type: 'ROOM_STATE',
        participants: Array.from(this.participants.values()),
        callState: this.callState
      }));

    } catch (error) {
      console.error(`[${this.room.id}] Auth failed:`, error);
      conn.close(1008, 'Invalid authentication token');
    }
  }

  /**
   * Handle incoming messages
   */
  async onMessage(message: string, sender: Party.Connection) {
    try {
      const event: CallEvent = JSON.parse(message);
      const senderState = sender.state as { userId: string; tenantId: string; role: string };

      console.log(`[${this.room.id}] Event from ${senderState.userId}:`, event.type);

      // Route event based on type
      switch (event.type) {
        case 'CALL_STARTED':
          await this.handleCallStarted(event, sender);
          break;
        
        case 'RINGING':
          // Callee acknowledges incoming call
          this.broadcast(event);
          break;
        
        case 'ACCEPTED':
          this.callState = 'CONNECTED';
          this.startTime = Date.now();
          this.broadcast(event);
          break;
        
        case 'REJECTED':
          this.callState = 'ENDED';
          this.broadcast(event);
          // Room can be closed after rejection
          setTimeout(() => this.room.hibernate(), 5000);
          break;
        
        case 'ENDED':
          this.callState = 'ENDED';
          const duration = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
          this.broadcast({ ...event, duration });
          setTimeout(() => this.room.hibernate(), 5000);
          break;
        
        default:
          console.warn(`[${this.room.id}] Unknown event type:`, event.type);
      }

    } catch (error) {
      console.error(`[${this.room.id}] Message handling error:`, error);
      sender.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format'
      }));
    }
  }

  /**
   * Handle call initiation
   */
  private async handleCallStarted(event: CallEvent & { type: 'CALL_STARTED' }, sender: Party.Connection) {
    this.callState = 'RINGING';
    
    // Find callee's connection
    const calleeConn = this.findConnectionByUserId(event.calleeId);
    
    if (calleeConn) {
      // Callee is online and connected to this room
      calleeConn.send(JSON.stringify(event));
    } else {
      // Callee not connected - they'll get notification via webhook or polling
      sender.send(JSON.stringify({
        type: 'CALLEE_OFFLINE',
        roomName: this.room.id,
        calleeId: event.calleeId
      }));
    }
  }

  /**
   * Handle connection close
   */
  async onClose(conn: Party.Connection) {
    const state = conn.state as { userId: string };
    console.log(`[${this.room.id}] Connection closed: ${state.userId}`);
    
    this.participants.delete(conn.id);
    
    // Notify others
    this.broadcast({
      type: 'PARTICIPANT_LEFT',
      roomName: this.room.id,
      userId: state.userId
    });

    // If no participants left, hibernate room
    if (this.participants.size === 0) {
      console.log(`[${this.room.id}] No participants, hibernating...`);
      setTimeout(() => this.room.hibernate(), 30000); // 30s grace period
    }
  }

  /**
   * Broadcast to all connections except sender
   */
  private broadcast(event: any, excludeId?: string) {
    const message = JSON.stringify(event);
    this.room.getConnections().forEach((conn) => {
      if (conn.id !== excludeId) {
        conn.send(message);
      }
    });
  }

  /**
   * Find connection by user ID
   */
  private findConnectionByUserId(userId: string): Party.Connection | undefined {
    return Array.from(this.room.getConnections()).find((conn) => {
      const state = conn.state as { userId: string };
      return state.userId === userId;
    });
  }
}

VoipServer.options = {
  hibernate: true, // Enable hibernation when idle
};
```

**auth.ts** (JWT Verification):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function verifySupabaseToken(token: string) {
  try {
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Fetch user details from database (CRM User or Portal Customer)
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, tenant_id, first_name, last_name, email, role')
      .eq('supabase_user_id', user.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      // Try portal customers table
      const { data: portalCustomer } = await supabase
        .from('portal_customers')
        .select('id, tenant_id, name, email')
        .eq('supabase_user_id', user.id)
        .single();

      if (portalCustomer) {
        return {
          supabaseUserId: user.id,
          tenantId: portalCustomer.tenant_id,
          role: 'PORTAL_CUSTOMER',
          name: portalCustomer.name
        };
      }
    }

    if (dbUser) {
      return {
        supabaseUserId: user.id,
        tenantId: dbUser.tenant_id,
        role: 'CRM_USER',
        name: `${dbUser.first_name} ${dbUser.last_name}`.trim() || dbUser.email
      };
    }

    throw new Error('User not found in database');
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}
```

**types.ts** (Shared Types):
```typescript
export interface ParticipantInfo {
  connectionId: string;
  userId: string;
  tenantId: string;
  role: 'CRM_USER' | 'PORTAL_CUSTOMER';
  name: string;
}

export type CallEvent = 
  | { type: 'CALL_STARTED'; roomName: string; callerId: string; callerName: string; calleeId: string; calleeName: string }
  | { type: 'RINGING'; roomName: string }
  | { type: 'ACCEPTED'; roomName: string; acceptedBy: string }
  | { type: 'REJECTED'; roomName: string; rejectedBy: string; reason?: string }
  | { type: 'ENDED'; roomName: string; endedBy: string; duration?: number }
  | { type: 'PARTICIPANT_JOINED'; roomName: string; userId: string; participant: ParticipantInfo }
  | { type: 'PARTICIPANT_LEFT'; roomName: string; userId: string }
  | { type: 'ERROR'; message: string; roomName?: string };
```

**Deployment**:
```bash
# Deploy to PartyKit cloud
npx partykit deploy

# Get deployment URL (example)
# https://synapse-voip.your-username.partykit.dev
```

#### 1.2 Frontend WebSocket Hook (Next.js)
```typescript
// Frontend/src/hooks/useVoipWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { useUser } from './useUser';

const PARTYKIT_URL = process.env.NEXT_PUBLIC_PARTYKIT_URL!; // https://synapse-voip.*.partykit.dev

export function useVoipWebSocket(roomName?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const { user, session } = useUser();

  useEffect(() => {
    if (!roomName || !session?.access_token) return;

    // Construct WebSocket URL with auth token
    const wsUrl = `${PARTYKIT_URL}/party/${roomName}?token=${session.access_token}`;
    
    console.log('[VoIP WS] Connecting to:', roomName);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[VoIP WS] Connected to room:', roomName);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[VoIP WS] Event received:', data.type);
        setLastEvent(data);
      } catch (error) {
        console.error('[VoIP WS] Parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[VoIP WS] Error:', error);
    };

    ws.onclose = () => {
      console.log('[VoIP WS] Disconnected from room:', roomName);
      setIsConnected(false);
    };

    wsRef.current = ws;

    // Cleanup on unmount or room change
    return () => {
      ws.close();
    };
  }, [roomName, session?.access_token]);

  const sendEvent = (event: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    } else {
      console.warn('[VoIP WS] Cannot send - not connected');
    }
  };

  return { isConnected, lastEvent, sendEvent };
}
```

---

### Phase 2: Backend Integration (Week 1-2)

#### 2.1 Update VoIP Controller (Remove Supabase Realtime)
```typescript
// server/src/voip/voip.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../supabase-auth/decorators/current-user.decorator';
import { VoipService } from './voip.service';

@Controller('voip')
@UseGuards(SupabaseAuthGuard)
export class VoipController {
  constructor(private readonly voipService: VoipService) {}

  /**
   * Start a call
   * Backend no longer broadcasts events - PartyKit handles real-time
   */
  @Post('start')
  async startCall(
    @Body() dto: { calleeId: string; callerName?: string },
    @CurrentUser('id') supabaseUserId: string
  ) {
    // 1. Get caller info
    const caller = await this.voipService.getParticipantInfo(supabaseUserId, dto.tenantId);
    
    // 2. Get callee info
    const callee = await this.voipService.getParticipantInfo(dto.calleeId, dto.tenantId);
    
    // 3. Generate room name
    const roomName = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 4. Generate LiveKit tokens for both parties
    const callerToken = await this.livekitService.generateToken(
      caller.supabaseUserId,
      `${dto.tenantId}-${roomName}`,
      dto.tenantId,
      { name: caller.name }
    );
    
    const calleeToken = await this.livekitService.generateToken(
      callee.supabaseUserId,
      `${dto.tenantId}-${roomName}`,
      dto.tenantId,
      { name: callee.name }
    );
    
    // 5. Create CallLog entry in database
    const callLog = await this.prisma.callLog.create({
      data: {
        tenantId: dto.tenantId,
        roomName,
        fromUserId: caller.role === 'CRM_USER' ? caller.id : null,
        toUserId: callee.role === 'CRM_USER' ? callee.id : null,
        fromPortalCustomerId: caller.role === 'PORTAL_CUSTOMER' ? caller.id : null,
        toPortalCustomerId: callee.role === 'PORTAL_CUSTOMER' ? callee.id : null,
        status: 'RINGING',
        startedAt: new Date()
      }
    });
    
    // 6. Create CallEvent entry (for history)
    await this.prisma.callEvent.create({
      data: {
        tenantId: dto.tenantId,
        callerId: caller.id,
        calleeId: callee.id,
        roomName,
        eventType: 'CALL_STARTED',
        payload: {
          callerName: caller.name,
          calleeName: callee.name,
          calleeToken // Include callee token for when they accept
        }
      }
    });
    
    // 7. Return tokens and room info to frontend
    // Frontend will connect to PartyKit and send CALL_STARTED event
    return {
      roomName,
      callerToken,
      calleeToken, // Frontend will not use this, but PartyKit will send to callee
      callLogId: callLog.id,
      calleeInfo: {
        id: callee.id,
        name: callee.name,
        role: callee.role
      }
    };
  }

  // Accept, Reject, End endpoints remain similar
  // But instead of broadcasting via Supabase Realtime, frontend handles via PartyKit
}
```

**Key Changes**:
- Backend generates tokens for BOTH parties upfront
- No Supabase Realtime broadcasting - that's PartyKit's job
- CallLog and CallEvent still created for persistence/history
- Frontend receives both tokens and sends CALL_STARTED to PartyKit

---

### Phase 3: Frontend Integration (Week 2)

#### 3.1 New VoIP Context (Replacing old Supabase-based one)
```typescript
// Frontend/src/contexts/VoipContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useVoipWebSocket } from '@/hooks/useVoipWebSocket';
import { useUserData } from '@/hooks/useUserData';

interface ActiveCall {
  roomName: string;
  callerName: string;
  calleeName: string;
  isIncoming: boolean;
  callerToken?: string;
  calleeToken?: string;
  state: 'RINGING' | 'CONNECTED' | 'ENDED';
}

interface VoipContextType {
  activeCall: ActiveCall | null;
  startCall: (calleeId: string, calleeName: string) => Promise<void>;
  acceptCall: () => void;
  rejectCall: (reason?: string) => void;
  endCall: () => void;
  isReady: boolean;
}

const VoipContext = createContext<VoipContextType | undefined>(undefined);

export function VoipProvider({ children }: { children: ReactNode }) {
  const { userData } = useUserData();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  
  // Connect to PartyKit only when there's an active call
  const { isConnected, lastEvent, sendEvent } = useVoipWebSocket(
    activeCall?.roomName
  );

  // Handle incoming events from PartyKit
  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case 'CALL_STARTED':
        // Incoming call
        if (lastEvent.calleeId === userData?.id) {
          setActiveCall({
            roomName: lastEvent.roomName,
            callerName: lastEvent.callerName,
            calleeName: userData?.name || 'You',
            isIncoming: true,
            calleeToken: lastEvent.calleeToken, // Backend included this
            state: 'RINGING'
          });
        }
        break;

      case 'ACCEPTED':
        // Other party accepted our call
        if (activeCall) {
          setActiveCall({ ...activeCall, state: 'CONNECTED' });
        }
        break;

      case 'REJECTED':
        // Call rejected
        setActiveCall(null);
        break;

      case 'ENDED':
        // Call ended
        setActiveCall(null);
        break;
    }
  }, [lastEvent, userData]);

  const startCall = async (calleeId: string, calleeName: string) => {
    try {
      // 1. Call backend to generate tokens
      const response = await fetch('/api/voip/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calleeId })
      });

      if (!response.ok) throw new Error('Failed to start call');

      const data = await response.json();

      // 2. Set active call state
      setActiveCall({
        roomName: data.roomName,
        callerName: userData?.name || 'You',
        calleeName,
        isIncoming: false,
        callerToken: data.callerToken,
        calleeToken: data.calleeToken,
        state: 'RINGING'
      });

      // 3. Send CALL_STARTED event to PartyKit (after WS connects)
      // This will be done in a useEffect when activeCall changes
    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  };

  // Send CALL_STARTED when we initiate a call and WS is connected
  useEffect(() => {
    if (activeCall && !activeCall.isIncoming && isConnected) {
      sendEvent({
        type: 'CALL_STARTED',
        roomName: activeCall.roomName,
        callerId: userData?.id,
        callerName: activeCall.callerName,
        calleeId: activeCall.calleeId, // Need to add this to state
        calleeName: activeCall.calleeName,
        calleeToken: activeCall.calleeToken
      });
    }
  }, [activeCall, isConnected]);

  const acceptCall = () => {
    if (!activeCall || !activeCall.isIncoming) return;

    sendEvent({
      type: 'ACCEPTED',
      roomName: activeCall.roomName,
      acceptedBy: userData?.id
    });

    setActiveCall({ ...activeCall, state: 'CONNECTED' });
  };

  const rejectCall = (reason?: string) => {
    if (!activeCall) return;

    sendEvent({
      type: 'REJECTED',
      roomName: activeCall.roomName,
      rejectedBy: userData?.id,
      reason
    });

    setActiveCall(null);
  };

  const endCall = () => {
    if (!activeCall) return;

    sendEvent({
      type: 'ENDED',
      roomName: activeCall.roomName,
      endedBy: userData?.id
    });

    setActiveCall(null);
  };

  return (
    <VoipContext.Provider
      value={{
        activeCall,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        isReady: !!userData && isConnected
      }}
    >
      {children}
    </VoipContext.Provider>
  );
}

export const useVoip = () => {
  const context = useContext(VoipContext);
  if (!context) throw new Error('useVoip must be used within VoipProvider');
  return context;
};
```

---

### Phase 4: Android Integration (Week 3)

#### 4.1 WebSocket Client (Kotlin)
```kotlin
// Synapse/app/src/main/java/com/example/synapse/data/remote/voip/PartyKitClient.kt
package com.example.synapse.data.remote.voip

import android.util.Log
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.*
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
sealed class CallEvent {
    @Serializable
    data class CallStarted(
        val roomName: String,
        val callerId: String,
        val callerName: String,
        val calleeId: String,
        val calleeName: String,
        val calleeToken: String
    ) : CallEvent()

    @Serializable
    data class Accepted(val roomName: String, val acceptedBy: String) : CallEvent()

    @Serializable
    data class Rejected(val roomName: String, val rejectedBy: String, val reason: String?) : CallEvent()

    @Serializable
    data class Ended(val roomName: String, val endedBy: String, val duration: Int?) : CallEvent()
}

@Singleton
class PartyKitClient @Inject constructor(
    private val okHttpClient: OkHttpClient
) {
    private val tag = "PartyKitClient"
    private var webSocket: WebSocket? = null
    
    private val _events = MutableSharedFlow<CallEvent>(replay = 0)
    val events: SharedFlow<CallEvent> = _events.asSharedFlow()
    
    private val json = Json { ignoreUnknownKeys = true }

    fun connect(roomName: String, token: String) {
        val url = "${BuildConfig.PARTYKIT_URL}/party/$roomName?token=$token"
        
        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(tag, "✅ Connected to room: $roomName")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val event = json.decodeFromString<CallEvent>(text)
                    Log.d(tag, "📞 Event received: ${event::class.simpleName}")
                    _events.tryEmit(event)
                } catch (e: Exception) {
                    Log.e(tag, "❌ Failed to parse event: ${e.message}")
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(tag, "❌ WebSocket error: ${t.message}")
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(tag, "🔌 Disconnected: $reason")
            }
        })
    }

    fun sendEvent(event: CallEvent) {
        val json = json.encodeToString(CallEvent.serializer(), event)
        webSocket?.send(json)
    }

    fun disconnect() {
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
    }
}
```

#### 4.2 Updated CallViewModel (Android)
```kotlin
// Use PartyKitClient instead of Supabase Realtime
@HiltViewModel
class CallViewModel @Inject constructor(
    private val voipApiService: VoipApiService,
    private val partyKitClient: PartyKitClient,
    private val liveKitManager: LiveKitManager,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _callState = MutableStateFlow<CallState>(CallState.Idle)
    val callState: StateFlow<CallState> = _callState.asStateFlow()

    private var eventCollectionJob: Job? = null

    init {
        // Collect events from PartyKit
        eventCollectionJob = viewModelScope.launch {
            partyKitClient.events.collect { event ->
                handleCallEvent(event)
            }
        }
    }

    fun initiateCall(calleeId: String, calleeName: String) {
        viewModelScope.launch {
            try {
                // 1. Call backend to get tokens
                val result = voipApiService.startCall(calleeId, null)
                result.onSuccess { response ->
                    // 2. Connect to PartyKit room
                    partyKitClient.connect(response.roomName, response.callerToken)
                    
                    // 3. Send CALL_STARTED event
                    partyKitClient.sendEvent(
                        CallEvent.CallStarted(
                            roomName = response.roomName,
                            callerId = userRepository.currentUser.value?.id ?: "",
                            callerName = userRepository.currentUser.value?.name ?: "",
                            calleeId = calleeId,
                            calleeName = calleeName,
                            calleeToken = response.calleeToken
                        )
                    )
                    
                    _callState.value = CallState.Dialing
                }
            } catch (e: Exception) {
                Log.e("CallViewModel", "Failed to initiate call", e)
            }
        }
    }

    private fun handleCallEvent(event: CallEvent) {
        when (event) {
            is CallEvent.CallStarted -> {
                // Incoming call
                _callState.value = CallState.Ringing(event.callerName)
            }
            is CallEvent.Accepted -> {
                // Connect to LiveKit
                viewModelScope.launch {
                    liveKitManager.connect(
                        url = BuildConfig.LIVEKIT_URL,
                        token = event.token,
                        roomName = event.roomName
                    )
                    _callState.value = CallState.InCall(event.roomName, event.otherUserName)
                }
            }
            is CallEvent.Rejected -> {
                _callState.value = CallState.Idle
            }
            is CallEvent.Ended -> {
                liveKitManager.disconnect()
                _callState.value = CallState.Idle
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        partyKitClient.disconnect()
        eventCollectionJob?.cancel()
    }
}
```

---

### Phase 5: Testing & Optimization (Week 3-4)

#### 5.1 Test Scenarios
1. **CRM to Portal**: User calls portal customer, accept, talk, end
2. **Portal to CRM**: Portal customer calls agent, accept, reject, ringing timeout
3. **Connection Drop**: WiFi disconnect during call, reconnection handling
4. **Offline User**: Call user who's not online (no WS connection)
5. **Multi-Device**: Same user on web + Android, call routing
6. **Concurrency**: Multiple calls in same tenant simultaneously

#### 5.2 Performance Monitoring
- **PartyKit Dashboard**: Connection count, message rate, error rate
- **LiveKit Dashboard**: Media quality, packet loss, jitter
- **Backend Logs**: API response times, token generation time
- **Frontend Sentry**: WebSocket connection failures, UI errors

#### 5.3 Fallback Strategy
If PartyKit has issues:
1. **Immediate**: Switch to polling (check CallEvent table every 2s)
2. **Week 1**: Deploy self-hosted Socket.IO server on Railway
3. **Week 2**: Implement NestJS WebSocket Gateway as fallback

---

## 🔐 Security Considerations

### Authentication Flow
```
1. User logs in → Supabase Auth generates JWT
2. Frontend stores JWT in session
3. When connecting to PartyKit:
   - Include JWT as query param: ?token=<jwt>
   - PartyKit server verifies JWT with Supabase
   - Connection rejected if invalid

4. Backend API calls:
   - Use same JWT in Authorization header
   - NestJS SupabaseAuthGuard validates
```

### Multi-Tenant Isolation
- PartyKit room names include `tenantId`: `tenant-abc-call-123`
- Auth middleware checks user's `tenantId` matches room prefix
- Database queries always filter by `tenantId`

### Rate Limiting
- PartyKit: 100 messages/second per connection
- Backend API: 10 calls/minute per user (NestJS throttler)
- LiveKit: Token TTL = 1 hour

---

## 📊 Cost Estimation

### PartyKit (Recommended)
- **Free Tier**: 10K connections/month, 1GB transfer
- **Pro Tier** ($20/mo): 100K connections/month, 10GB transfer
- **Estimated Usage** (100 active users, 50 calls/day):
  - Connections: ~500/month (well under free tier)
  - Messages: ~10K/month (call events)
  - **Cost**: **FREE** for MVP, ~$20/mo at scale

### LiveKit Cloud (Current)
- **Free Tier**: 10K participant minutes/month
- **Current Usage**: ~2K minutes/month (estimated)
- **Cost**: **FREE** (well within limits)

### Alternative: Self-hosted Socket.IO
- **Railway/Render**: $7-15/mo for small instance
- **More control but requires DevOps maintenance**

**Total VoIP Cost**: **$0-20/month** vs current **$0** (Supabase Realtime included in database plan)

---

## 🚀 Migration Strategy

### Week 1: Parallel Implementation
- Keep old Supabase Realtime code commented out
- Implement PartyKit alongside
- Feature flag: `ENABLE_NEW_VOIP=true` in env

### Week 2: Testing
- Internal testing on staging environment
- A/B test with 10% of users
- Monitor error rates

### Week 3: Full Rollout
- Enable for 100% of users
- Remove old code
- Update documentation

### Rollback Plan
If critical issues:
1. Set `ENABLE_NEW_VOIP=false`
2. Uncomment old Supabase code
3. Redeploy (< 5 minutes)

---

## 📚 Alternative Architectures Considered

### Option 1: Supabase Realtime (REJECTED - Current Issues)
❌ Duplicate client instances
❌ Unreliable event delivery
❌ Complex subscription management
❌ Not designed for high-frequency signaling

### Option 2: Socket.IO Self-Hosted (Fallback)
✅ Full control
✅ Battle-tested
❌ DevOps overhead
❌ Scaling complexity

### Option 3: Ably (Overkill)
✅ Enterprise-grade
✅ Excellent SDKs
❌ $29/mo minimum
❌ Over-engineered for our needs

### Option 4: NestJS WebSocket Gateway (Considered)
✅ Collocated with API
✅ No extra deployment
❌ Single point of failure
❌ Harder to scale independently

**Final Decision: PartyKit** - Best balance of simplicity, cost, and reliability for real-time signaling.

---

## 📖 Resources

### PartyKit
- Docs: https://docs.partykit.io
- Examples: https://github.com/partykit/partykit/tree/main/examples
- Discord: https://discord.gg/partykit

### LiveKit
- Docs: https://docs.livekit.io
- Android SDK: https://github.com/livekit/client-sdk-android

### Reference Implementations
- PartyKit + Next.js: https://github.com/partykit/partykit-nextjs-chat-template
- LiveKit Call Demo: https://github.com/livekit/livekit-demo

---

## ✅ Next Steps

1. **Immediate** (Today):
   - Create PartyKit account
   - Initialize new project: `npx partykit init synapse-voip-server`
   
2. **Week 1**:
   - Implement PartyKit server (server.ts, auth.ts)
   - Deploy to PartyKit cloud
   - Create frontend WebSocket hook
   - Test basic signaling (CALL_STARTED → ACCEPTED)

3. **Week 2**:
   - Update backend VoIP controller
   - Integrate with frontend (VoipContext)
   - Test full call flow (CRM ↔ Portal)

4. **Week 3**:
   - Android integration (PartyKitClient)
   - End-to-end testing
   - Performance optimization

5. **Week 4**:
   - Load testing
   - Documentation
   - Production deployment

**Estimated Timeline**: 3-4 weeks to full production
**Risk Level**: LOW (PartyKit proven for similar use cases)
**Rollback Strategy**: Feature flag + keep old code for 1 month

---

## 🎯 Success Criteria

- ✅ 99.9% WebSocket connection success rate
- ✅ < 500ms latency for call signaling events
- ✅ Zero "Callee not found" errors
- ✅ No duplicate Supabase client warnings
- ✅ Works across all platforms (Web, Android, future iOS)
- ✅ Supports 100+ concurrent calls per tenant
- ✅ Call logs persisted correctly in database
- ✅ LiveKit audio quality maintained (< 150ms jitter)

---

**Questions or need clarification on any phase? Let me know and I'll provide more detailed implementation code!**
