import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URLs
    credentials: true,
  },
  namespace: '/voip',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Extract user info from handshake query/auth
    const userId = client.handshake.query.userId as string;
    let tenantId = client.handshake.query.tenantId as string;
    
    if (userId && tenantId) {
      // Portal customers need to be tracked in their Contact's CRM tenant, not their own portal tenant
      // This allows CRM users to see portal customers in their "Online Customers" list
      const portalCustomer = await this.prisma.portalCustomer.findFirst({
        where: { supabaseUserId: userId },
        include: {
          contact: {
            select: { tenantId: true }
          }
        }
      });
      
      // Use Contact's CRM tenant for presence if this is a portal customer
      const presenceTenantId = portalCustomer?.contact?.tenantId || tenantId;
      
      this.logger.log(`User ${userId} connecting: handshakeTenant=${tenantId}, presenceTenant=${presenceTenantId}, isPortal=${!!portalCustomer}`);
      
      client.userId = userId;
      client.tenantId = tenantId; // Keep original for client context
      
      // Join user-specific room
      client.join(`user:${userId}`);
      client.join(`tenant:${tenantId}`);
      
      // Update presence with the correct tenant (CRM tenant for portal customers)
      await this.updatePresence(userId, presenceTenantId, 'ONLINE');
      
      this.logger.log(`User ${userId} joined tenant ${tenantId}`);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    if (client.userId && client.tenantId) {
      // Update presence to OFFLINE
      await this.updatePresence(client.userId, client.tenantId, 'OFFLINE');
    }
  }

  /**
   * Update user presence status
   */
  private async updatePresence(userId: string, tenantId: string, status: 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE', currentRoom?: string) {
    try {
      await this.prisma.userPresence.upsert({
        where: { userId },
        update: {
          status,
          lastSeen: new Date(),
          currentRoom,
          tenantId,
        },
        create: {
          userId,
          status,
          tenantId,
          currentRoom,
        },
      });

      // Broadcast presence update to all users in the tenant
      this.server.to(`tenant:${tenantId}`).emit('presenceUpdate', {
        userId,
        status,
        currentRoom,
      });
    } catch (error) {
      this.logger.error(`Failed to update presence for ${userId}`, error);
    }
  }

  /**
   * Client sends heartbeat to stay online
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId && client.tenantId) {
      await this.prisma.userPresence.update({
        where: { userId: client.userId },
        data: { lastSeen: new Date() },
      });
    }
  }

  /**
   * Initiate a call
   */
  @SubscribeMessage('startCall')
  async handleStartCall(
    @MessageBody() data: { calleeId: string; roomName: string; callerName: string; callLogId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { calleeId, roomName, callerName, callLogId } = data;

    this.logger.log(`Call initiated: ${client.userId} → ${calleeId}`);

    // Update caller's presence to BUSY
    if (client.userId && client.tenantId) {
      await this.updatePresence(client.userId, client.tenantId, 'BUSY', roomName);
    }

    // Send incoming call event to callee
    this.server.to(`user:${calleeId}`).emit('incomingCall', {
      from: client.userId,
      callerName,
      roomName,
      callLogId,
    });
  }

  /**
   * Accept a call
   */
  @SubscribeMessage('acceptCall')
  async handleAcceptCall(
    @MessageBody() data: { callerId: string; roomName: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { callerId, roomName } = data;

    this.logger.log(`Call accepted: ${client.userId} accepted call from ${callerId}`);

    // Update callee's presence to BUSY
    if (client.userId && client.tenantId) {
      await this.updatePresence(client.userId, client.tenantId, 'BUSY', roomName);
    }

    // Notify caller that call was accepted
    this.server.to(`user:${callerId}`).emit('callAccepted', {
      from: client.userId,
      roomName,
    });
  }

  /**
   * Reject a call
   */
  @SubscribeMessage('rejectCall')
  async handleRejectCall(
    @MessageBody() data: { callerId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { callerId } = data;

    this.logger.log(`Call rejected: ${client.userId} rejected call from ${callerId}`);

    // Notify caller that call was rejected
    this.server.to(`user:${callerId}`).emit('callRejected', {
      from: client.userId,
    });

    // Update caller's presence back to ONLINE
    const caller = await this.prisma.userPresence.findUnique({
      where: { userId: callerId },
    });
    if (caller) {
      await this.updatePresence(callerId, caller.tenantId, 'ONLINE');
    }
  }

  /**
   * End a call
   */
  @SubscribeMessage('endCall')
  async handleEndCall(
    @MessageBody() data: { otherUserId: string; roomName: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { otherUserId, roomName } = data;

    this.logger.log(`Call ended: ${client.userId} ended call with ${otherUserId}`);

    // Update both users' presence to ONLINE
    if (client.userId && client.tenantId) {
      await this.updatePresence(client.userId, client.tenantId, 'ONLINE');
    }

    const otherUser = await this.prisma.userPresence.findUnique({
      where: { userId: otherUserId },
    });
    if (otherUser) {
      await this.updatePresence(otherUserId, otherUser.tenantId, 'ONLINE');
    }

    // Notify other user that call ended
    this.server.to(`user:${otherUserId}`).emit('callEnded', {
      from: client.userId,
      roomName,
    });
  }

  /**
   * Public method to send incoming call notification
   * Called from VoIP service
   */
  sendIncomingCall(calleeId: string, data: { from: string; callerName: string; roomName: string; callLogId: string }) {
    this.server.to(`user:${calleeId}`).emit('incomingCall', data);
  }

  /**
   * Public method to send missed call notification
   */
  sendMissedCall(userId: string, data: { callerName: string; callTime: string }) {
    this.server.to(`user:${userId}`).emit('missedCall', data);
  }
}
