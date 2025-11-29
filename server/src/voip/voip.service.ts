import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { LiveKitService } from '../livekit/livekit.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { FcmService } from '../fcm/fcm.service';
import { PushService } from '../push/push.service';

/**
 * VoipService - Redesigned for LiveKit + WebSocket signaling
 * 
 * Key improvements:
 * - WebSocket signaling instead of Supabase Realtime (50-150ms vs 500-2000ms)
 * - Dual notification: WebSocket + FCM/Web Push for reliability
 * - Simplified participant tracking (only Supabase IDs)
 * - Presence tracking via WebSocket
 * - Missed call timeout handling
 */
@Injectable()
export class VoipService {
  private readonly logger = new Logger(VoipService.name);

  constructor(
    private prisma: PrismaService,
    private livekit: LiveKitService,
    private websocket: WebsocketGateway,
    private fcm: FcmService,
    private push: PushService,
  ) {
    this.logger.log('✅ VoIP service initialized with WebSocket signaling');
  }

  /**
   * Get user's tenant ID from Supabase ID
   */
  async getUserTenantId(supabaseUserId: string): Promise<string> {
    // Try CRM user first
    const user = await this.prisma.user.findUnique({
      where: { supabaseUserId },
      select: { tenantId: true },
    });

    if (user) {
      return user.tenantId;
    }

    // Try portal customer
    const customer = await this.prisma.portalCustomer.findFirst({
      where: { supabaseUserId },
      select: { tenantId: true },
    });

    if (customer) {
      return customer.tenantId;
    }

    throw new NotFoundException(`User not found: ${supabaseUserId}`);
  }

  /**
   * Get participant name for display
   */
  private async getParticipantName(supabaseUserId: string): Promise<string> {
    // Try CRM user
    const user = await this.prisma.user.findUnique({
      where: { supabaseUserId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    }

    // Try portal customer
    const customer = await this.prisma.portalCustomer.findFirst({
      where: { supabaseUserId },
      select: { name: true, email: true },
    });

    if (customer) {
      return customer.name || customer.email;
    }

    return 'Unknown User';
  }

  /**
   * Get FCM token and push subscription for a user
   */
  private async getNotificationTargets(supabaseUserId: string) {
    // Try CRM user
    const user = await this.prisma.user.findUnique({
      where: { supabaseUserId },
      select: { fcmToken: true, pushSubscription: true },
    });

    if (user) {
      return {
        fcmToken: user.fcmToken,
        pushSubscription: user.pushSubscription,
      };
    }

    // Try portal customer
    const customer = await this.prisma.portalCustomer.findFirst({
      where: { supabaseUserId },
      select: { fcmToken: true, pushSubscription: true },
    });

    if (customer) {
      return {
        fcmToken: customer.fcmToken,
        pushSubscription: customer.pushSubscription,
      };
    }

    return { fcmToken: null, pushSubscription: null };
  }

  /**
   * Start a call - sends notifications via WebSocket + FCM + Web Push
   */
  async startCall(dto: {
    callerSupabaseId: string;
    calleeSupabaseId: string;
    tenantId: string;
    callerName?: string;
  }) {
    const { callerSupabaseId, calleeSupabaseId, tenantId, callerName } = dto;

    // Get participant names
    const [callerDisplayName, calleeDisplayName] = await Promise.all([
      callerName || this.getParticipantName(callerSupabaseId),
      this.getParticipantName(calleeSupabaseId),
    ]);

    // Generate room name
    const roomName = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Generate LiveKit token for caller
    const callerToken = await this.livekit.createToken(
      roomName,
      callerSupabaseId,
      callerDisplayName,
    );

    // Create CallLog
    const callLog = await this.prisma.callLog.create({
      data: {
        tenantId,
        roomName,
        callerSupabaseId,
        calleeSupabaseId,
        status: 'INITIATED',
        direction: 'OUTBOUND',
      },
    });

    this.logger.log(`📞 Call initiated: ${callerDisplayName} → ${calleeDisplayName} (room: ${roomName})`);

    // Send notifications (ALL THREE channels!)
    const notificationData = {
      from: callerSupabaseId,
      callerName: callerDisplayName,
      roomName,
      callLogId: callLog.id,
    };

    // 1. WebSocket (fastest - if user is online)
    this.websocket.sendIncomingCall(calleeSupabaseId, notificationData);

    // 2. Get FCM/Push tokens
    const targets = await this.getNotificationTargets(calleeSupabaseId);

    // 3. FCM (Android)
    if (targets.fcmToken) {
      try {
        await this.fcm.sendIncomingCallNotification({
          fcmToken: targets.fcmToken,
          callerId: callerSupabaseId,
          callerName: callerDisplayName,
          roomName,
          callLogId: callLog.id,
        });
      } catch (error) {
        this.logger.error('Failed to send FCM notification', error);
      }
    }

    // 4. Web Push (browsers)
    if (targets.pushSubscription) {
      try {
        await this.push.sendIncomingCallNotification(targets.pushSubscription, {
          callerId: callerSupabaseId,
          callerName: callerDisplayName,
          roomName,
          callLogId: callLog.id,
        });
      } catch (error) {
        this.logger.error('Failed to send web push notification', error);
      }
    }

    // 5. Set timeout for missed call (30 seconds)
    this.setupMissedCallTimeout(callLog.id, calleeSupabaseId, callerDisplayName);

    return {
      roomName,
      callerToken,
      callLogId: callLog.id,
      calleeInfo: {
        name: calleeDisplayName,
      },
    };
  }

  /**
   * Setup missed call timeout - if not answered in 30s, mark as MISSED
   */
  private setupMissedCallTimeout(
    callLogId: string,
    calleeSupabaseId: string,
    callerName: string,
  ) {
    setTimeout(async () => {
      const call = await this.prisma.callLog.findUnique({
        where: { id: callLogId },
      });

      if (!call || call.status !== 'INITIATED') {
        return; // Call was answered or already ended
      }

      // Mark as MISSED
      await this.prisma.callLog.update({
        where: { id: callLogId },
        data: {
          status: 'MISSED',
          endTime: new Date(),
        },
      });

      this.logger.warn(`⏰ Call ${callLogId} missed (timeout)`);

      // Get callee name for notification
      const calleeName = await this.getParticipantName(calleeSupabaseId);

      // Send missed call notification to CALLER (they're waiting for answer)
      this.websocket.server.to(`user:${call.callerSupabaseId}`).emit('missedCall', {
        callerName: calleeName, // Who didn't answer
        callTime: new Date().toLocaleTimeString(),
      });

      this.logger.log(`📵 Sent missedCall event to caller ${call.callerSupabaseId}`);

      // Cleanup LiveKit room
      try {
        await this.livekit.deleteRoom(call.roomName);
      } catch (error) {
        this.logger.error('Failed to delete LiveKit room', error);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Accept call
   */
  async acceptCall(dto: {
    callLogId: string;
    calleeSupabaseId: string;
    roomName: string;
  }) {
    const { callLogId, calleeSupabaseId, roomName } = dto;

    // Get call log to find the caller
    const call = await this.prisma.callLog.findUnique({
      where: { id: callLogId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const calleeName = await this.getParticipantName(calleeSupabaseId);

    // Generate token for callee
    const calleeToken = await this.livekit.createToken(roomName, calleeSupabaseId, calleeName);

    // Update call status
    await this.prisma.callLog.update({
      where: { id: callLogId },
      data: { status: 'CONNECTED' },
    });

    // Emit callAccepted event to the CALLER so their UI updates to "Connected"
    this.websocket.server.to(`user:${call.callerSupabaseId}`).emit('callAccepted', {
      from: calleeSupabaseId,
      roomName,
    });

    this.logger.log(`✅ Call accepted: ${calleeName} joined ${roomName}`);
    this.logger.log(`📤 Sent callAccepted to caller ${call.callerSupabaseId}`);

    return { calleeToken, roomName };
  }

  /**
   * Reject call
   */
  async rejectCall(dto: {
    callLogId: string;
    calleeSupabaseId: string;
    reason?: string;
  }) {
    const { callLogId, reason } = dto;

    // Update call status
    await this.prisma.callLog.update({
      where: { id: callLogId },
      data: {
        status: 'FAILED',
        endTime: new Date(),
      },
    });

    const callLog = await this.prisma.callLog.findUnique({
      where: { id: callLogId },
    });

    if (callLog?.roomName) {
      await this.livekit.deleteRoom(callLog.roomName);
    }

    this.logger.log(`❌ Call rejected: ${reason || 'No reason'}`);

    return { success: true };
  }

  /**
   * End call
   */
  async endCall(dto: {
    callLogId: string;
    userSupabaseId: string;
    roomName: string;
  }) {
    const { callLogId, roomName, userSupabaseId } = dto;

    const callLog = await this.prisma.callLog.findUnique({
      where: { id: callLogId },
    });

    if (!callLog) {
      throw new NotFoundException('Call log not found');
    }

    // Validate that the user is a participant in this call
    const isParticipant = 
      callLog.callerSupabaseId === userSupabaseId || 
      callLog.calleeSupabaseId === userSupabaseId;
    
    if (!isParticipant) {
      throw new NotFoundException('Unauthorized: You are not a participant in this call');
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - callLog.startTime.getTime()) / 1000);

    await this.prisma.callLog.update({
      where: { id: callLogId },
      data: {
        status: 'ENDED',
        endTime,
        duration,
      },
    });

    // Delete LiveKit room
    await this.livekit.deleteRoom(roomName);

    // Emit callEnded event to BOTH participants individually
    // Use user-specific rooms (e.g., "user:userId") that the WebSocket gateway creates
    const eventData = {
      roomName,
      endedBy: userSupabaseId,
      callLogId,
    };

    // Emit to both users via their user rooms
    this.websocket.server.to(`user:${callLog.callerSupabaseId}`).emit('callEnded', eventData);
    this.websocket.server.to(`user:${callLog.calleeSupabaseId}`).emit('callEnded', eventData);

    this.logger.log(`📤 Sent callEnded to user:${callLog.callerSupabaseId} and user:${callLog.calleeSupabaseId}`);
    this.logger.log(`📴 Call ended: ${roomName} (duration: ${duration}s) by ${userSupabaseId}`);

    return { success: true, duration };
  }

  /**
   * Generate token for joining room
   */
  async generateToken(dto: {
    userSupabaseId: string;
    roomName: string;
    userName?: string;
  }) {
    const { userSupabaseId, roomName, userName } = dto;

    const displayName = userName || (await this.getParticipantName(userSupabaseId));
    const token = await this.livekit.createToken(roomName, userSupabaseId, displayName);

    return { token, roomName };
  }

  /**
   * Update FCM token
   */
  async updateFcmToken(supabaseUserId: string, fcmToken: string) {
    // Try updating user
    const user = await this.prisma.user.findUnique({
      where: { supabaseUserId },
    });

    if (user) {
      await this.prisma.user.update({
        where: { supabaseUserId },
        data: { fcmToken },
      });
      return { success: true };
    }

    // Try updating portal customer
    await this.prisma.portalCustomer.updateMany({
      where: { supabaseUserId },
      data: { fcmToken },
    });

    return { success: true };
  }

  /**
   * Update push subscription
   */
  async updatePushSubscription(supabaseUserId: string, subscription: any) {
    // Try updating user
    const user = await this.prisma.user.findUnique({
      where: { supabaseUserId },
    });

    if (user) {
      await this.prisma.user.update({
        where: { supabaseUserId },
        data: { pushSubscription: subscription },
      });
      return { success: true };
    }

    // Try updating portal customer
    await this.prisma.portalCustomer.updateMany({
      where: { supabaseUserId },
      data: { pushSubscription: subscription },
    });

    return { success: true };
  }

  /**
   * Get call history
   */
  async getCallHistory(supabaseUserId: string, tenantId: string) {
    const callLogs = await this.prisma.callLog.findMany({
      where: {
        tenantId,
        OR: [
          { callerSupabaseId: supabaseUserId },
          { calleeSupabaseId: supabaseUserId },
        ],
      },
      include: {
        recording: true,
        transcription: {
          select: {
            id: true,
            status: true,
            summary: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    });

    return callLogs;
  }

  /**
   * Get recording for a call
   */
  async getRecording(callLogId: string) {
    const recording = await this.prisma.callRecording.findUnique({
      where: { callLogId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    return recording;
  }

  /**
   * Get transcript for a call
   */
  async getTranscript(callLogId: string) {
    const transcript = await this.prisma.callTranscription.findUnique({
      where: { callLogId },
    });

    if (!transcript) {
      throw new NotFoundException('Transcript not found');
    }

    return transcript;
  }

  /**
   * Get presence status for a user
   */
  async getPresence(userId: string) {
    const presence = await this.prisma.userPresence.findUnique({
      where: { userId },
    });

    return presence || { userId, status: 'OFFLINE' };
  }

  /**
   * Get available agents for calling
   * For portal customers: returns CRM staff from the tenant that serves them
   * For CRM users: returns other CRM staff in their own tenant
   */
  async getAvailableAgents(requestorSupabaseId: string, requestorTenantId: string) {
    // Look up portal customer by their Supabase user ID first
    const portalCustomer = await this.prisma.portalCustomer.findFirst({
      where: { supabaseUserId: requestorSupabaseId },
      include: {
        contact: {
          select: { tenantId: true, id: true, email: true }
        }
      }
    });
    
    this.logger.log(`🔍 Portal customer lookup for ${requestorSupabaseId}: found=${!!portalCustomer}, hasContact=${!!portalCustomer?.contact}`);
    if (portalCustomer?.contact) {
      this.logger.log(`   Contact: id=${portalCustomer.contact.id}, tenantId=${portalCustomer.contact.tenantId}`);
    }
    
    // Use CRM tenant from contact, or requestor's own tenant if they're CRM staff
    const crmTenantId = portalCustomer?.contact?.tenantId || requestorTenantId;
    
    this.logger.log(`🔍 getAvailableAgents: requestorTenant=${requestorTenantId}, crmTenant=${crmTenantId}`);
    
    const agents = await this.prisma.user.findMany({
      where: {
        tenantId: crmTenantId,
        isActive: true,
      },
      select: {
        id: true,
        supabaseUserId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    // Get presence for each agent
    const agentsWithPresence = await Promise.all(
      agents.map(async (agent) => {
        const presence = await this.prisma.userPresence.findUnique({
          where: { userId: agent.supabaseUserId },
        });

        return {
          id: agent.id,
          supabaseUserId: agent.supabaseUserId,
          name: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email,
          email: agent.email,
          role: agent.role,
          status: presence?.status || 'OFFLINE',
          isOnline: presence?.status === 'ONLINE',
        };
      }),
    );

    const onlineAgents = agentsWithPresence.filter((agent) => agent.isOnline);
    this.logger.log(`✅ Found ${onlineAgents.length} online agents (from ${agents.length} total)`);
    
    return onlineAgents;
  }

  /**
   * Get online portal customers in tenant (for CRM users to call customers)
   * NOTE: This returns ONLY portal customers, not CRM staff
   */
  async getOnlineUsers(tenantId: string) {
    this.logger.log(`🔍 getOnlineUsers: tenantId=${tenantId}`);
    
    // Get all online presences
    const onlinePresences = await this.prisma.userPresence.findMany({
      where: {
        tenantId,
        status: { in: ['ONLINE', 'BUSY'] },
      },
    });

    this.logger.log(`   Found ${onlinePresences.length} online presences`);

    if (onlinePresences.length === 0) {
      return [];
    }

    const userIds = onlinePresences.map((p) => p.userId);

    // Get ONLY portal customers (not CRM users)
    const portalCustomers = await this.prisma.portalCustomer.findMany({
      where: {
        supabaseUserId: { in: userIds },
        tenantId,
      },
      select: {
        supabaseUserId: true,
        name: true,
        email: true,
      },
    });

    this.logger.log(`   Found ${portalCustomers.length} portal customers online`);

    // Format portal customers
    const result = portalCustomers.map((c) => {
      const presence = onlinePresences.find((p) => p.userId === c.supabaseUserId);
      return {
        id: c.supabaseUserId,
        name: c.name,
        email: c.email,
        type: 'PORTAL_CUSTOMER' as const,
        role: null,
        status: presence?.status || 'OFFLINE',
        lastSeen: presence?.lastSeen?.toISOString(),
      };
    });

    this.logger.log(`✅ Returning ${result.length} online portal customers`);
    return result;
  }
}
