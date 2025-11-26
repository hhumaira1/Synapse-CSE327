# 📞 LiveKit VoIP Implementation Roadmap

## Executive Summary

**Current Status**: ⚠️ **NOT IMPLEMENTED** (Configuration Only)

Despite extensive planning documentation showing "✅ Fully implemented", a comprehensive codebase scan reveals **ZERO actual LiveKit implementation**. Only environment configuration exists.

### What Exists ✅
- LiveKit Cloud credentials configured in `.env`
- Database schema (`CallLog` model) - but designed for Twilio
- Extensive planning documentation in `MIGRATION_ANALYSIS.md`

### What's Missing ❌
- **Backend**: No LiveKit service, no token generation, no room management
- **Frontend**: No LiveKit React components, no call UI
- **Android**: No LiveKit SDK, no native call integration
- **Dependencies**: No LiveKit packages installed on ANY platform
- **Signaling**: No WebSocket/Socket.IO for call initiation

---

## 🔍 Discovery Audit Report

### Backend Investigation (NestJS 11)
```bash
# Searched for: livekit*.ts files
Result: ZERO files found

# Checked package.json for livekit-server-sdk
Result: NOT INSTALLED

# Searched src/ directory for voip/call services
Result: No voip, livekit, or call directories exist
```

**Current Dependencies:**
```json
{
  "@nestjs/platform-socket.io": "^11.1.8",  // ✅ Socket.IO installed (can be used for signaling)
  "@nestjs/websockets": "^11.1.8",
  "socket.io": "^4.8.1",
  "socket.io-client": "^4.8.1"
}
```

**Missing Dependencies:**
```json
{
  "livekit-server-sdk": "MISSING - Required for token generation"
}
```

### Frontend Investigation (Next.js 16)
```bash
# Searched for: components/voip/* or livekit components
Result: ZERO VoIP components found

# Checked package.json for @livekit/components-react
Result: NOT INSTALLED
```

**Current Dependencies:**
```json
{
  "socket.io-client": "^4.8.1"  // ✅ Socket.IO client installed (can be used for signaling)
}
```

**Missing Dependencies:**
```json
{
  "@livekit/components-react": "MISSING - Required for call UI",
  "livekit-client": "MISSING - Required for WebRTC client"
}
```

### Android Investigation (Kotlin + Jetpack Compose)
```bash
# Searched for: LiveKit SDK in build.gradle.kts
Result: NOT FOUND

# Checked for voip/call screens in app/src/
Result: NO call-related screens exist
```

**Current Dependencies:**
```kotlin
// Socket.IO for signaling - NOT INSTALLED
// Need: io.socket:socket.io-client:2.1.0
```

**Missing Dependencies:**
```kotlin
// LiveKit Android SDK
implementation("io.livekit:livekit-android:2.9.0")  // MISSING

// Socket.IO client for signaling
implementation("io.socket:socket.io-client:2.1.0")  // MISSING
```

### Database Schema Analysis
**Current Schema**: `CallLog` model exists but designed for **Twilio**, not LiveKit:

```prisma
model CallLog {
  twilioCallSid   String?  @unique      // ❌ Twilio-specific
  recordingSid    String?                // ❌ Twilio-specific
  fromNumber      String
  toNumber        String
  // ... other Twilio fields
}
```

**Required Changes for LiveKit**:
```prisma
model CallLog {
  // Remove Twilio fields, add LiveKit fields:
  roomName           String   @unique   // ✅ LiveKit room identifier
  participantIdentity String              // ✅ User's LiveKit identity
  trackSid           String?             // ✅ LiveKit audio track ID
  recordingUrl       String?             // ✅ LiveKit recording URL
  // Keep common fields: duration, status, createdAt, etc.
}
```

---

## 🎯 Implementation Phases

### Phase 1: Backend Foundation (2-3 days)

#### Step 1.1: Install Dependencies
```bash
cd server
npm install livekit-server-sdk@2.6.3
```

#### Step 1.2: Create LiveKit Module
```bash
# Generate NestJS module
nest generate module livekit
nest generate service livekit/livekit
nest generate controller livekit/livekit
```

**File**: `server/src/livekit/livekit.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AccessToken, RoomServiceClient, Room } from 'livekit-server-sdk';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.roomService = new RoomServiceClient(
      this.config.get('LIVEKIT_API_URL'),
      this.config.get('LIVEKIT_API_KEY'),
      this.config.get('LIVEKIT_API_SECRET'),
    );
  }

  /**
   * Generate LiveKit access token for user to join room
   */
  async generateToken(
    userId: string,
    roomName: string,
    tenantId: string,
  ): Promise<string> {
    const token = new AccessToken(
      this.config.get('LIVEKIT_API_KEY'),
      this.config.get('LIVEKIT_API_SECRET'),
      {
        identity: `${tenantId}:${userId}`, // Format: tenantId:userId for multi-tenant
        name: userId,
      },
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return await token.toJwt();
  }

  /**
   * Create a new LiveKit room for a call
   */
  async createRoom(callId: string, tenantId: string): Promise<Room> {
    try {
      const room = await this.roomService.createRoom({
        name: `${tenantId}-${callId}`, // Multi-tenant room naming
        emptyTimeout: 300, // Auto-delete after 5 min if empty
        maxParticipants: 10,
      });
      
      this.logger.log(`Created room: ${room.name}`);
      return room;
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a room after call ends
   */
  async deleteRoom(roomName: string): Promise<void> {
    await this.roomService.deleteRoom(roomName);
    this.logger.log(`Deleted room: ${roomName}`);
  }

  /**
   * List active rooms for a tenant
   */
  async listActiveRooms(tenantId: string): Promise<Room[]> {
    const allRooms = await this.roomService.listRooms();
    return allRooms.filter(room => room.name.startsWith(`${tenantId}-`));
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomName: string) {
    const participants = await this.roomService.listParticipants(roomName);
    return participants.map(p => ({
      identity: p.identity,
      name: p.name,
      joinedAt: p.joinedAt,
      isSpeaking: p.isSpeaking,
    }));
  }
}
```

#### Step 1.3: Create LiveKit Controller
**File**: `server/src/livekit/livekit.controller.ts`
```typescript
import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { LiveKitService } from './livekit.service';
import { SupabaseAuthGuard } from '../supabase-auth/guards/supabase-auth.guard';
import { CurrentUser } from '../supabase-auth/decorators/current-user.decorator';

@Controller('livekit')
@UseGuards(SupabaseAuthGuard)
export class LiveKitController {
  constructor(private livekitService: LiveKitService) {}

  /**
   * POST /api/livekit/token
   * Generate token for user to join call
   */
  @Post('token')
  async generateToken(
    @Body() body: { roomName: string },
    @CurrentUser('id') supabaseUserId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const token = await this.livekitService.generateToken(
      supabaseUserId,
      body.roomName,
      tenantId,
    );

    return { token, roomName: body.roomName };
  }

  /**
   * POST /api/livekit/rooms
   * Create a new call room
   */
  @Post('rooms')
  async createRoom(
    @Body() body: { callId: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const room = await this.livekitService.createRoom(body.callId, tenantId);
    return { roomName: room.name, sid: room.sid };
  }

  /**
   * GET /api/livekit/rooms/active
   * List active rooms for tenant
   */
  @Get('rooms/active')
  async listActiveRooms(@CurrentUser('tenantId') tenantId: string) {
    return this.livekitService.listActiveRooms(tenantId);
  }

  /**
   * GET /api/livekit/rooms/:roomName/participants
   * Get participants in a room
   */
  @Get('rooms/:roomName/participants')
  async getRoomParticipants(@Param('roomName') roomName: string) {
    return this.livekitService.getRoomParticipants(roomName);
  }
}
```

#### Step 1.4: Update Database Schema
**File**: `server/prisma/schema.prisma`

**BEFORE** (Twilio fields):
```prisma
model CallLog {
  id              String   @id @default(uuid())
  tenantId        String
  twilioCallSid   String?  @unique
  recordingSid    String?
  // ...
}
```

**AFTER** (LiveKit fields):
```prisma
model CallLog {
  id                  String   @id @default(uuid())
  tenantId            String
  
  // LiveKit fields
  roomName            String   @unique        // LiveKit room identifier
  roomSid             String?                 // LiveKit room SID
  participantIdentity String                  // User's LiveKit identity
  trackSid            String?                 // Audio track ID
  recordingUrl        String?                 // Recording URL from LiveKit
  
  // Common fields
  fromUserId          String?
  toUserId            String?
  fromUser            User?    @relation("CallsFrom", fields: [fromUserId], references: [id])
  toUser              User?    @relation("CallsTo", fields: [toUserId], references: [id])
  
  status              CallStatus  @default(INITIATED)
  duration            Int?        // Duration in seconds
  startTime           DateTime    @default(now())
  endTime             DateTime?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  tenant              Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
  @@index([fromUserId])
  @@index([toUserId])
}

enum CallStatus {
  INITIATED
  RINGING
  IN_PROGRESS
  COMPLETED
  MISSED
  FAILED
}
```

**Run Migration**:
```bash
cd server
npx prisma generate
npx prisma db push
```

#### Step 1.5: Create Call Management Service
**File**: `server/src/livekit/call-management.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LiveKitService } from './livekit.service';

@Injectable()
export class CallManagementService {
  constructor(
    private prisma: PrismaService,
    private livekit: LiveKitService,
  ) {}

  /**
   * Initiate a call between users
   */
  async initiateCall(
    fromUserId: string,
    toUserId: string,
    tenantId: string,
  ) {
    // Generate unique call ID
    const callId = `call-${Date.now()}`;
    
    // Create LiveKit room
    const room = await this.livekit.createRoom(callId, tenantId);
    
    // Create CallLog entry
    const callLog = await this.prisma.callLog.create({
      data: {
        tenantId,
        roomName: room.name,
        roomSid: room.sid,
        participantIdentity: `${tenantId}:${fromUserId}`,
        fromUserId,
        toUserId,
        status: 'INITIATED',
      },
    });

    // Generate tokens for both users
    const callerToken = await this.livekit.generateToken(
      fromUserId,
      room.name,
      tenantId,
    );
    const receiverToken = await this.livekit.generateToken(
      toUserId,
      room.name,
      tenantId,
    );

    return {
      callId: callLog.id,
      roomName: room.name,
      callerToken,
      receiverToken,
    };
  }

  /**
   * End a call and update duration
   */
  async endCall(callId: string, tenantId: string) {
    const callLog = await this.prisma.callLog.findFirst({
      where: { id: callId, tenantId },
    });

    if (!callLog) throw new Error('Call not found');

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - callLog.startTime.getTime()) / 1000,
    );

    await this.prisma.callLog.update({
      where: { id: callId },
      data: {
        status: 'COMPLETED',
        endTime,
        duration,
      },
    });

    // Delete LiveKit room
    await this.livekit.deleteRoom(callLog.roomName);
  }
}
```

#### Step 1.6: Add WebSocket Gateway for Signaling
**File**: `server/src/livekit/call-signaling.gateway.ts`
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CallManagementService } from './call-management.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/call',
})
export class CallSignalingGateway {
  @WebSocketServer() server: Server;
  private logger = new Logger(CallSignalingGateway.name);

  constructor(private callService: CallManagementService) {}

  /**
   * Client initiates a call
   */
  @SubscribeMessage('initiate-call')
  async handleInitiateCall(
    @MessageBody() data: { toUserId: string; fromUserId: string; tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Call initiated: ${data.fromUserId} -> ${data.toUserId}`);

    const callData = await this.callService.initiateCall(
      data.fromUserId,
      data.toUserId,
      data.tenantId,
    );

    // Send call offer to receiver
    this.server.emit(`incoming-call-${data.toUserId}`, {
      callId: callData.callId,
      roomName: callData.roomName,
      token: callData.receiverToken,
      fromUserId: data.fromUserId,
    });

    // Send confirmation to caller
    client.emit('call-initiated', {
      callId: callData.callId,
      roomName: callData.roomName,
      token: callData.callerToken,
    });
  }

  /**
   * Receiver accepts call
   */
  @SubscribeMessage('accept-call')
  async handleAcceptCall(
    @MessageBody() data: { callId: string; userId: string },
  ) {
    this.logger.log(`Call accepted: ${data.callId}`);
    
    // Notify caller that call was accepted
    this.server.emit(`call-accepted-${data.callId}`, { userId: data.userId });
  }

  /**
   * Call ended
   */
  @SubscribeMessage('end-call')
  async handleEndCall(
    @MessageBody() data: { callId: string; tenantId: string },
  ) {
    this.logger.log(`Call ended: ${data.callId}`);
    
    await this.callService.endCall(data.callId, data.tenantId);
    
    // Notify all participants
    this.server.emit(`call-ended-${data.callId}`);
  }
}
```

#### Step 1.7: Register Module in App
**File**: `server/src/livekit/livekit.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { LiveKitService } from './livekit.service';
import { LiveKitController } from './livekit.controller';
import { CallManagementService } from './call-management.service';
import { CallSignalingGateway } from './call-signaling.gateway';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [LiveKitService, CallManagementService, CallSignalingGateway],
  controllers: [LiveKitController],
  exports: [LiveKitService, CallManagementService],
})
export class LiveKitModule {}
```

**File**: `server/src/app.module.ts`
```typescript
import { LiveKitModule } from './livekit/livekit.module';

@Module({
  imports: [
    // ... other modules
    LiveKitModule, // ✅ Add this
  ],
})
export class AppModule {}
```

**Backend Completion: ✅ Day 2-3**

---

### Phase 2: Frontend Integration (2-3 days)

#### Step 2.1: Install Dependencies
```bash
cd Frontend
npm install @livekit/components-react@2.6.3 livekit-client@2.6.3
```

#### Step 2.2: Create LiveKit Context
**File**: `Frontend/src/contexts/LiveKitContext.tsx`
```tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/hooks/useUser';

interface LiveKitContextType {
  socket: Socket | null;
  incomingCall: IncomingCall | null;
  activeCallRoom: string | null;
  initiateCall: (toUserId: string) => Promise<void>;
  acceptCall: (callId: string) => void;
  endCall: () => void;
}

interface IncomingCall {
  callId: string;
  roomName: string;
  token: string;
  fromUserId: string;
}

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export function LiveKitProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const { user } = useUser();

  // Connect to Socket.IO for call signaling
  useEffect(() => {
    if (!user) return;

    const socketInstance = io('http://localhost:3001/call', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to call signaling server');
    });

    // Listen for incoming calls
    socketInstance.on(`incoming-call-${user.id}`, (call: IncomingCall) => {
      console.log('📞 Incoming call from:', call.fromUserId);
      setIncomingCall(call);
    });

    // Listen for call accepted
    socketInstance.on(`call-accepted-${user.id}`, () => {
      console.log('✅ Call accepted');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const initiateCall = async (toUserId: string) => {
    if (!socket || !user) return;

    socket.emit('initiate-call', {
      fromUserId: user.id,
      toUserId,
      tenantId: user.tenantId,
    });

    socket.once('call-initiated', (data: any) => {
      setActiveCallRoom(data.roomName);
    });
  };

  const acceptCall = (callId: string) => {
    if (!socket || !user || !incomingCall) return;

    socket.emit('accept-call', { callId, userId: user.id });
    setActiveCallRoom(incomingCall.roomName);
    setIncomingCall(null);
  };

  const endCall = () => {
    if (!socket || !activeCallRoom) return;

    socket.emit('end-call', { callId: activeCallRoom, tenantId: user?.tenantId });
    setActiveCallRoom(null);
  };

  return (
    <LiveKitContext.Provider
      value={{
        socket,
        incomingCall,
        activeCallRoom,
        initiateCall,
        acceptCall,
        endCall,
      }}
    >
      {children}
    </LiveKitContext.Provider>
  );
}

export const useLiveKit = () => {
  const context = useContext(LiveKitContext);
  if (!context) throw new Error('useLiveKit must be used within LiveKitProvider');
  return context;
};
```

#### Step 2.3: Create Call UI Components
**File**: `Frontend/src/components/voip/CallButton.tsx`
```tsx
'use client';

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveKit } from '@/contexts/LiveKitContext';

interface CallButtonProps {
  userId: string;
  userName?: string;
}

export function CallButton({ userId, userName }: CallButtonProps) {
  const { initiateCall } = useLiveKit();

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => initiateCall(userId)}
      className="gap-2"
    >
      <Phone className="h-4 w-4" />
      Call {userName || 'User'}
    </Button>
  );
}
```

**File**: `Frontend/src/components/voip/IncomingCallModal.tsx`
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLiveKit } from '@/contexts/LiveKitContext';

export function IncomingCallModal() {
  const { incomingCall, acceptCall, endCall } = useLiveKit();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (incomingCall) {
      setOpen(true);
      // Play ringtone
      const audio = new Audio('/ringtone.mp3');
      audio.loop = true;
      audio.play();

      return () => audio.pause();
    }
  }, [incomingCall]);

  const handleAccept = () => {
    if (incomingCall) {
      acceptCall(incomingCall.callId);
      setOpen(false);
    }
  };

  const handleReject = () => {
    endCall();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>📞 Incoming Call</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-10 w-10 text-primary animate-pulse" />
          </div>
          
          <p className="text-lg font-medium">User {incomingCall?.fromUserId}</p>
          
          <div className="flex gap-4">
            <Button
              size="lg"
              variant="destructive"
              onClick={handleReject}
              className="gap-2"
            >
              <PhoneOff className="h-5 w-5" />
              Decline
            </Button>
            
            <Button
              size="lg"
              onClick={handleAccept}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-5 w-5" />
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**File**: `Frontend/src/components/voip/ActiveCallView.tsx`
```tsx
'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, AudioConference, useRoomContext } from '@livekit/components-react';
import { PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveKit } from '@/contexts/LiveKitContext';
import '@livekit/components-styles';

function CallControls() {
  const { endCall } = useLiveKit();
  const room = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = async () => {
    const localTrack = room.localParticipant.audioTrackPublications.values().next().value?.audioTrack;
    if (localTrack) {
      await localTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
      <Button
        size="lg"
        variant="outline"
        onClick={toggleMute}
        className="rounded-full h-14 w-14"
      >
        {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
      
      <Button
        size="lg"
        variant="destructive"
        onClick={endCall}
        className="rounded-full h-14 w-14"
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
}

export function ActiveCallView() {
  const { activeCallRoom } = useLiveKit();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCallRoom) return;

    // Fetch LiveKit token from backend
    fetch('http://localhost:3001/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName: activeCallRoom }),
    })
      .then(res => res.json())
      .then(data => setToken(data.token));
  }, [activeCallRoom]);

  if (!activeCallRoom || !token) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        audio={true}
        video={false}
        className="h-full"
      >
        <div className="flex h-full items-center justify-center">
          <AudioConference />
          <CallControls />
        </div>
      </LiveKitRoom>
    </div>
  );
}
```

#### Step 2.4: Add Provider to Layout
**File**: `Frontend/src/app/layout.tsx`
```tsx
import { LiveKitProvider } from '@/contexts/LiveKitContext';
import { IncomingCallModal } from '@/components/voip/IncomingCallModal';
import { ActiveCallView } from '@/components/voip/ActiveCallView';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          <SupabaseProvider>
            <LiveKitProvider>
              {children}
              <IncomingCallModal />
              <ActiveCallView />
            </LiveKitProvider>
          </SupabaseProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

#### Step 2.5: Add Call Buttons to Contacts/Leads Pages
**Example**: `Frontend/src/app/(dashboard)/contacts/page.tsx`
```tsx
import { CallButton } from '@/components/voip/CallButton';

// Inside contact card:
<CallButton userId={contact.userId} userName={contact.name} />
```

**Frontend Completion: ✅ Day 5-6**

---

### Phase 3: Android Integration (3-4 days)

#### Step 3.1: Add Dependencies
**File**: `Synapse/app/build.gradle.kts`
```kotlin
dependencies {
    // ... existing dependencies

    // LiveKit Android SDK
    implementation("io.livekit:livekit-android:2.9.0")
    
    // Socket.IO for signaling
    implementation("io.socket:socket.io-client:2.1.0")
    
    // Permissions for audio
    implementation("androidx.activity:activity-compose:1.9.0")
}
```

#### Step 3.2: Add Permissions
**File**: `Synapse/app/src/main/AndroidManifest.xml`
```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
</manifest>
```

#### Step 3.3: Create LiveKit Manager
**File**: `Synapse/app/src/main/java/com/example/synapse/data/remote/livekit/LiveKitManager.kt`
```kotlin
package com.example.synapse.data.remote.livekit

import android.content.Context
import io.livekit.android.LiveKit
import io.livekit.android.room.Room
import io.livekit.android.room.track.LocalAudioTrack
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LiveKitManager @Inject constructor(
    private val context: Context
) {
    private var room: Room? = null
    private var localAudioTrack: LocalAudioTrack? = null

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted

    /**
     * Connect to LiveKit room
     */
    suspend fun connect(token: String, serverUrl: String, roomName: String) {
        room = LiveKit.create(
            appContext = context,
            overrides = {
                // Audio settings
                audio { enabled = true }
                video { enabled = false }
            }
        ).apply {
            connect(
                url = serverUrl,
                token = token
            )
        }

        // Create local audio track
        localAudioTrack = room?.localParticipant?.createAudioTrack()
        
        _isConnected.value = true
    }

    /**
     * Disconnect from room
     */
    fun disconnect() {
        localAudioTrack?.stop()
        room?.disconnect()
        room = null
        localAudioTrack = null
        _isConnected.value = false
    }

    /**
     * Toggle microphone mute
     */
    fun toggleMute() {
        localAudioTrack?.let { track ->
            val newMutedState = !track.muted
            track.muted = newMutedState
            _isMuted.value = newMutedState
        }
    }
}
```

#### Step 3.4: Create Socket.IO Manager for Signaling
**File**: `Synapse/app/src/main/java/com/example/synapse/data/remote/websocket/CallSignalingManager.kt`
```kotlin
package com.example.synapse.data.remote.websocket

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

data class IncomingCall(
    val callId: String,
    val roomName: String,
    val token: String,
    val fromUserId: String
)

@Singleton
class CallSignalingManager @Inject constructor() {
    private var socket: Socket? = null

    private val _incomingCall = MutableStateFlow<IncomingCall?>(null)
    val incomingCall: StateFlow<IncomingCall?> = _incomingCall

    fun connect(userId: String, serverUrl: String = "http://10.0.2.2:3001") {
        socket = IO.socket("$serverUrl/call").apply {
            on(Socket.EVENT_CONNECT) {
                Log.d("CallSignaling", "✅ Connected to signaling server")
            }

            on("incoming-call-$userId") { args ->
                val data = args[0] as JSONObject
                _incomingCall.value = IncomingCall(
                    callId = data.getString("callId"),
                    roomName = data.getString("roomName"),
                    token = data.getString("token"),
                    fromUserId = data.getString("fromUserId")
                )
            }

            connect()
        }
    }

    fun initiateCall(fromUserId: String, toUserId: String, tenantId: String) {
        socket?.emit("initiate-call", JSONObject().apply {
            put("fromUserId", fromUserId)
            put("toUserId", toUserId)
            put("tenantId", tenantId)
        })
    }

    fun acceptCall(callId: String, userId: String) {
        socket?.emit("accept-call", JSONObject().apply {
            put("callId", callId)
            put("userId", userId)
        })
        _incomingCall.value = null
    }

    fun endCall(callId: String, tenantId: String) {
        socket?.emit("end-call", JSONObject().apply {
            put("callId", callId)
            put("tenantId", tenantId)
        })
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
```

#### Step 3.5: Create Call Screen UI
**File**: `Synapse/app/src/main/java/com/example/synapse/presentation/voip/CallScreen.kt`
```kotlin
package com.example.synapse.presentation.voip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.synapse.data.remote.livekit.LiveKitManager
import kotlinx.coroutines.launch

@Composable
fun CallScreen(
    roomName: String,
    token: String,
    onEndCall: () -> Unit,
    viewModel: CallViewModel = hiltViewModel()
) {
    val isConnected by viewModel.isConnected.collectAsState()
    val isMuted by viewModel.isMuted.collectAsState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(token) {
        viewModel.connectToRoom(token, roomName)
    }

    DisposableEffect(Unit) {
        onDispose {
            viewModel.disconnect()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Connection status
            if (!isConnected) {
                CircularProgressIndicator(color = Color.White)
                Text("Connecting...", color = Color.White)
            } else {
                // Call info
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(32.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(60.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text(
                        text = roomName,
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White
                    )
                    
                    Text(
                        text = "In Call",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                }
            }
        }

        // Call controls at bottom
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(32.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Mute button
            FloatingActionButton(
                onClick = { viewModel.toggleMute() },
                containerColor = if (isMuted) Color.Red else Color.Gray,
                modifier = Modifier.size(64.dp)
            ) {
                Icon(
                    imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                    contentDescription = "Toggle Mute",
                    tint = Color.White
                )
            }

            // End call button
            FloatingActionButton(
                onClick = {
                    viewModel.disconnect()
                    onEndCall()
                },
                containerColor = Color.Red,
                modifier = Modifier.size(72.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.CallEnd,
                    contentDescription = "End Call",
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }
        }
    }
}
```

#### Step 3.6: Create ViewModel
**File**: `Synapse/app/src/main/java/com/example/synapse/presentation/voip/CallViewModel.kt`
```kotlin
package com.example.synapse.presentation.voip

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.remote.livekit.LiveKitManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CallViewModel @Inject constructor(
    private val liveKitManager: LiveKitManager
) : ViewModel() {

    val isConnected: StateFlow<Boolean> = liveKitManager.isConnected
    val isMuted: StateFlow<Boolean> = liveKitManager.isMuted

    fun connectToRoom(token: String, roomName: String) {
        viewModelScope.launch {
            liveKitManager.connect(
                token = token,
                serverUrl = "wss://synapsecrm-ha78pqaf.livekit.cloud",
                roomName = roomName
            )
        }
    }

    fun toggleMute() {
        liveKitManager.toggleMute()
    }

    fun disconnect() {
        liveKitManager.disconnect()
    }
}
```

#### Step 3.7: Add Call Button to Contact/Lead Screens
**Example**: `Synapse/.../presentation/contacts/ContactDetailScreen.kt`
```kotlin
// Add call button
Button(
    onClick = { 
        // Navigate to CallScreen with contact's userId
        navController.navigate("call/${contact.userId}")
    },
    modifier = Modifier.fillMaxWidth()
) {
    Icon(Icons.Default.Call, contentDescription = null)
    Spacer(Modifier.width(8.dp))
    Text("Call Contact")
}
```

**Android Completion: ✅ Day 9-10**

---

## 🧪 Testing Matrix

### Test All Call Combinations

| From      | To        | Status | Steps to Test                                                   |
|-----------|-----------|--------|-----------------------------------------------------------------|
| Web       | Web       | ⏳ TODO | 1. Open 2 browsers<br>2. Login as different users<br>3. Initiate call |
| Web       | Android   | ⏳ TODO | 1. Web user calls Android user<br>2. Accept on Android         |
| Android   | Web       | ⏳ TODO | 1. Android user calls Web user<br>2. Accept on Web             |
| Android   | Android   | ⏳ TODO | 1. Use 2 Android devices<br>2. Initiate call                   |

### Test Scenarios
1. ✅ User initiates call → Receiver gets notification
2. ✅ Receiver accepts → Audio connects
3. ✅ Mute/unmute works on both sides
4. ✅ Call ends → Room cleaned up, CallLog updated
5. ✅ Missed call → Status saved correctly
6. ✅ Multi-tenant isolation → User A (Tenant 1) CANNOT call User B (Tenant 2)

---

## 📊 Effort Summary

| Phase                    | Days | Complexity | Dependencies                    |
|--------------------------|------|------------|---------------------------------|
| **Phase 1: Backend**     | 2-3  | Medium     | livekit-server-sdk, Socket.IO   |
| **Phase 2: Frontend**    | 2-3  | Medium     | @livekit/components-react       |
| **Phase 3: Android**     | 3-4  | High       | livekit-android, socket.io-client |
| **Phase 4: Testing**     | 1-2  | Low        | N/A                             |
| **TOTAL**                | **8-12 days** | | |

---

## 🚀 Quick Start (After Implementation)

### Backend
```bash
cd server
npm install livekit-server-sdk
npm run start:dev
```

### Frontend
```bash
cd Frontend
npm install @livekit/components-react livekit-client
npm run dev
```

### Android
```bash
cd Synapse
./gradlew build
# Install on device/emulator
```

---

## 🔒 Multi-Tenant Security

**Critical**: Ensure all call endpoints enforce tenant isolation:

```typescript
// Backend example
async initiateCall(fromUserId: string, toUserId: string, tenantId: string) {
  // Verify both users belong to same tenant
  const users = await this.prisma.user.findMany({
    where: { id: { in: [fromUserId, toUserId] } }
  });

  if (users.some(u => u.tenantId !== tenantId)) {
    throw new Error('Cross-tenant calls not allowed');
  }

  // Proceed with call
}
```

---

## 📝 Environment Variables Checklist

### Backend (`.env`)
```env
✅ LIVEKIT_API_URL=wss://synapsecrm-ha78pqaf.livekit.cloud
✅ LIVEKIT_API_KEY=APILJXHBNmsgr6e
✅ LIVEKIT_API_SECRET=cKDQHeeefJotFtfcgLKORm4ecGMpa7P4e41cN96Pfs29
✅ LIVEKIT_RECORDING_ENABLED=true
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://synapsecrm-ha78pqaf.livekit.cloud
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### Android (`local.properties`)
```properties
livekit.url=wss://synapsecrm-ha78pqaf.livekit.cloud
api.baseUrl=http://10.0.2.2:3001/api/
```

---

## 🎯 Next Steps

1. **Start with Phase 1 (Backend)** - Foundation for all platforms
2. **Test backend endpoints** with Postman/cURL before frontend work
3. **Implement frontend** - Web calling interface
4. **Add Android support** - Mobile calling
5. **Cross-platform testing** - Ensure web↔app, app↔app, web↔web all work

---

## 📚 Resources

- [LiveKit Docs](https://docs.livekit.io/)
- [LiveKit Server SDK](https://github.com/livekit/server-sdk-js)
- [LiveKit React Components](https://github.com/livekit/components-js)
- [LiveKit Android SDK](https://github.com/livekit/client-sdk-android)
- [Socket.IO Docs](https://socket.io/docs/v4/)

---

**Status**: Ready for implementation. All credentials configured. Follow phases sequentially for best results.
