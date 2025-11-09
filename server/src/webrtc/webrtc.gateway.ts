import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CallDirection } from 'prisma/generated/client';

// Store active connections
interface UserConnection {
  userId: string;
  tenantId: string;
  socketId: string;
  role: 'tenant_member' | 'portal_customer';
  contactId?: string; // For portal customers
}

interface CallSession {
  callId: string;
  callLogId: string;
  callerId: string; // Tenant member user ID
  callerSocketId: string;
  calleeId: string; // Portal customer contact ID
  calleeSocketId?: string;
  status: 'initiated' | 'ringing' | 'answered' | 'rejected' | 'ended';
  startedAt?: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/api/webrtc',
  path: '/api/socket.io',
})
export class WebRTCGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebRTCGateway.name);
  private connections: Map<string, UserConnection> = new Map();
  private activeCalls: Map<string, CallSession> = new Map();

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      const tenantId = client.handshake.auth.tenantId;
      const role = client.handshake.auth.role;
      const contactId = client.handshake.auth.contactId;

      if (!userId || !tenantId) {
        this.logger.warn(
          `Connection rejected: Missing auth data (socket: ${client.id})`,
        );
        client.disconnect();
        return;
      }

      const connection: UserConnection = {
        userId,
        tenantId,
        socketId: client.id,
        role: role || 'tenant_member',
        contactId,
      };

      this.connections.set(client.id, connection);
      this.logger.log(
        `✅ User connected: ${userId} (${role}) - Socket: ${client.id}`,
      );

      // Notify user of successful connection
      client.emit('connection:success', { userId, tenantId, role });
    } catch (error: any) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const connection = this.connections.get(client.id);
    if (connection) {
      this.logger.log(
        `❌ User disconnected: ${connection.userId} - Socket: ${client.id}`,
      );

      // End any active calls involving this user
      this.activeCalls.forEach((call, callId) => {
        if (
          call.callerSocketId === client.id ||
          call.calleeSocketId === client.id
        ) {
          void this.endCall(callId, client.id);
        }
      });

      this.connections.delete(client.id);
    }
  }

  /**
   * Initiate a call from tenant member to portal customer
   */
  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      contactId: string;
      contactPhone: string;
      contactName: string;
    },
  ) {
    try {
      const caller = this.connections.get(client.id);
      if (!caller || caller.role !== 'tenant_member') {
        client.emit('call:error', { message: 'Unauthorized' });
        return;
      }

      const { contactId, contactPhone, contactName } = data;

      // Find if contact (portal customer) is online
      const calleeConnection = Array.from(this.connections.values()).find(
        (conn) =>
          conn.tenantId === caller.tenantId &&
          conn.role === 'portal_customer' &&
          conn.contactId === contactId,
      );

      // Create CallLog entry
      const callLog = await this.prisma.callLog.create({
        data: {
          tenantId: caller.tenantId,
          userId: caller.userId,
          contactId,
          direction: CallDirection.OUTBOUND,
          fromNumber: 'WebRTC', // Not using phone numbers
          toNumber: contactPhone,
          status: 'INITIATED',
        },
      });

      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const callSession: CallSession = {
        callId,
        callLogId: callLog.id,
        callerId: caller.userId,
        callerSocketId: client.id,
        calleeId: contactId,
        calleeSocketId: calleeConnection?.socketId,
        status: 'initiated',
      };

      this.activeCalls.set(callId, callSession);

      if (calleeConnection) {
        // Callee is online - send call notification
        this.logger.log(
          `📞 Initiating call ${callId}: ${caller.userId} -> ${contactId}`,
        );

        callSession.status = 'ringing';
        await this.prisma.callLog.update({
          where: { id: callLog.id },
          data: { status: 'RINGING' },
        });

        // Fetch caller's name from Users table
        const callerUser = await this.prisma.user.findUnique({
          where: { id: caller.userId },
          select: { name: true },
        });

        // Notify callee of incoming call
        this.server
          .to(calleeConnection.socketId)
          .emit('call:incoming', {
            callId,
            callerId: caller.userId,
            callerName: callerUser?.name || 'Unknown User',
            contactPhone,
          });

        // Notify caller that call is ringing
        client.emit('call:ringing', { callId, callLogId: callLog.id });
      } else {
        // Callee is offline
        this.logger.warn(`Contact ${contactId} is offline`);
        await this.prisma.callLog.update({
          where: { id: callLog.id },
          data: { status: 'FAILED' },
        });

        client.emit('call:failed', {
          callId,
          message: 'Contact is offline',
        });
        this.activeCalls.delete(callId);
      }
    } catch (error: any) {
      this.logger.error(`Failed to initiate call: ${error.message}`);
      client.emit('call:error', { message: error.message });
    }
  }

  /**
   * Callee accepts the call
   */
  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      const { callId } = data;
      const call = this.activeCalls.get(callId);

      if (!call) {
        client.emit('call:error', { message: 'Call not found' });
        return;
      }

      call.status = 'answered';
      call.startedAt = new Date();

      await this.prisma.callLog.update({
        where: { id: call.callLogId },
        data: { status: 'ANSWERED', startedAt: new Date() },
      });

      this.logger.log(`📞 Call accepted: ${callId}`);

      // Notify caller that call was accepted
      this.server.to(call.callerSocketId).emit('call:accepted', { callId });

      // Notify callee
      client.emit('call:accepted', { callId });
    } catch (error: any) {
      this.logger.error(`Failed to accept call: ${error.message}`);
      client.emit('call:error', { message: error.message });
    }
  }

  /**
   * Callee rejects the call
   */
  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      const { callId } = data;
      const call = this.activeCalls.get(callId);

      if (!call) {
        client.emit('call:error', { message: 'Call not found' });
        return;
      }

      call.status = 'rejected';

      await this.prisma.callLog.update({
        where: { id: call.callLogId },
        data: { status: 'FAILED', endedAt: new Date() },
      });

      this.logger.log(`📞 Call rejected: ${callId}`);

      // Notify caller
      this.server.to(call.callerSocketId).emit('call:rejected', { callId });

      // Also notify callee (portal customer) to clean up their state
      if (call.calleeSocketId) {
        this.server.to(call.calleeSocketId).emit('call:rejected', { callId });
      }

      this.activeCalls.delete(callId);
    } catch (error: any) {
      this.logger.error(`Failed to reject call: ${error.message}`);
      client.emit('call:error', { message: error.message });
    }
  }

  /**
   * End active call
   */
  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const { callId } = data;
    await this.endCall(callId, client.id);
  }

  private async endCall(callId: string, initiatorSocketId?: string) {
    try {
      const call = this.activeCalls.get(callId);
      if (!call) return;

      const duration = call.startedAt
        ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000)
        : 0;

      await this.prisma.callLog.update({
        where: { id: call.callLogId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          duration,
        },
      });

      this.logger.log(`📞 Call ended: ${callId} (duration: ${duration}s)`);

      // Notify both parties
      this.server.to(call.callerSocketId).emit('call:ended', { callId });
      if (call.calleeSocketId) {
        this.server.to(call.calleeSocketId).emit('call:ended', { callId });
      }

      this.activeCalls.delete(callId);
    } catch (error: any) {
      this.logger.error(`Failed to end call: ${error.message}`);
    }
  }

  /**
   * WebRTC Signaling: Offer
   */
  @SubscribeMessage('webrtc:offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; offer: RTCSessionDescriptionInit },
  ) {
    const { callId, offer } = data;
    const call = this.activeCalls.get(callId);

    if (!call || !call.calleeSocketId) {
      client.emit('call:error', { message: 'Call not found' });
      return;
    }

    this.logger.log(`🔄 Forwarding WebRTC offer for call ${callId}`);
    this.server.to(call.calleeSocketId).emit('webrtc:offer', { callId, offer });
  }

  /**
   * WebRTC Signaling: Answer
   */
  @SubscribeMessage('webrtc:answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; answer: RTCSessionDescriptionInit },
  ) {
    const { callId, answer } = data;
    const call = this.activeCalls.get(callId);

    if (!call) {
      client.emit('call:error', { message: 'Call not found' });
      return;
    }

    this.logger.log(`🔄 Forwarding WebRTC answer for call ${callId}`);
    this.server.to(call.callerSocketId).emit('webrtc:answer', { callId, answer });
  }

  /**
   * WebRTC Signaling: ICE Candidate
   */
  @SubscribeMessage('webrtc:ice-candidate')
  handleICECandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; candidate: RTCIceCandidateInit },
  ) {
    const { callId, candidate } = data;
    const call = this.activeCalls.get(callId);

    if (!call) return;

    // Forward to other peer
    const targetSocketId =
      client.id === call.callerSocketId
        ? call.calleeSocketId
        : call.callerSocketId;

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('webrtc:ice-candidate', {
        callId,
        candidate,
      });
    }
  }
}
