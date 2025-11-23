import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LiveKitService } from './livekit.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

/**
 * Call event types for Supabase Realtime signaling
 */
export enum CallEventType {
  CALL_STARTED = 'call_started',
  RINGING = 'ringing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ENDED = 'ended',
  MISSED = 'missed',
}

/**
 * DTO for starting a call
 */
export interface StartCallDto {
  callerId: string;
  calleeId: string;
  tenantId: string;
  callerName?: string;
}

/**
 * DTO for accepting a call
 */
export interface AcceptCallDto {
  roomName: string;
  calleeId: string;
  tenantId: string;
}

/**
 * DTO for rejecting a call
 */
export interface RejectCallDto {
  roomName: string;
  calleeId: string;
  tenantId: string;
  reason?: string;
}

/**
 * DTO for ending a call
 */
export interface EndCallDto {
  roomName: string;
  userId: string;
  tenantId: string;
}

/**
 * DTO for generating LiveKit token
 */
export interface GenerateTokenDto {
  userId: string;
  roomName: string;
  tenantId: string;
  userName?: string;
}

/**
 * VoipService
 * 
 * Handles VoIP call signaling using Supabase Realtime.
 * Inserts call events into Supabase, which are then propagated
 * to all subscribed clients in real-time.
 */
@Injectable()
export class VoipService {
  private readonly logger = new Logger(VoipService.name);
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private livekit: LiveKitService,
    private config: ConfigService,
  ) {
    // Initialize Supabase client with service role for backend operations
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.logger.log('✅ VoIP service initialized with Supabase Realtime');
  }

  /**
   * Start a call - Creates initial call event and LiveKit room
   * 
   * @param dto - Call initiation data
   * @returns Room name and caller token
   */
  async startCall(dto: StartCallDto) {
    const { callerId, calleeId, tenantId, callerName } = dto;

    // Verify both users exist and belong to same tenant
    const [caller, callee] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: callerId, tenantId } }),
      this.prisma.user.findFirst({ where: { id: calleeId, tenantId } }),
    ]);

    if (!caller || !callee) {
      throw new NotFoundException('Caller or callee not found in this tenant');
    }

    // Generate deterministic room name
    const roomName = LiveKitService.generateRoomName(callerId, calleeId, tenantId);

    // Create LiveKit room
    await this.livekit.createRoom(roomName, tenantId);

    // Generate token for caller
    const callerToken = await this.livekit.generateToken(
      callerId,
      `${tenantId}-${roomName}`,
      tenantId,
      { name: callerName || caller.firstName || 'Unknown' },
    );

    // Insert call_started event in Supabase (triggers Realtime)
    const { data: callEvent, error } = await this.supabase
      .from('call_events')
      .insert({
        tenant_id: tenantId,
        caller_id: callerId,
        callee_id: calleeId,
        room_name: roomName,
        event_type: CallEventType.CALL_STARTED,
        payload: {
          callerName: callerName || caller.firstName || 'Unknown',
          callerToken,
        },
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to insert call event: ${error.message}`);
      throw new BadRequestException('Failed to start call');
    }

    // Create CallLog entry in Prisma
    const callLog = await this.prisma.callLog.create({
      data: {
        tenantId,
        roomName,
        roomSid: roomName,
        participantIdentity: `${tenantId}:${callerId}`,
        fromUserId: callerId,
        toUserId: calleeId,
        status: 'INITIATED',
      },
    });

    this.logger.log(`📞 Call started: ${callerId} → ${calleeId} in room ${roomName}`);

    return {
      roomName,
      callerToken,
      callLogId: callLog.id,
      callEventId: callEvent.id,
    };
  }

  /**
   * Accept a call - Generates token for callee and updates call event
   * 
   * @param dto - Call acceptance data
   * @returns Callee token
   */
  async acceptCall(dto: AcceptCallDto) {
    const { roomName, calleeId, tenantId } = dto;

    // Verify callee exists
    const callee = await this.prisma.user.findFirst({
      where: { id: calleeId, tenantId },
    });

    if (!callee) {
      throw new NotFoundException('Callee not found');
    }

    // Generate token for callee
    const calleeToken = await this.livekit.generateToken(
      calleeId,
      `${tenantId}-${roomName}`,
      tenantId,
      { name: callee.firstName || 'Unknown' },
    );

    // Insert accepted event in Supabase (triggers Realtime)
    const { error } = await this.supabase
      .from('call_events')
      .insert({
        tenant_id: tenantId,
        caller_id: null, // Not needed for accepted event
        callee_id: calleeId,
        room_name: roomName,
        event_type: CallEventType.ACCEPTED,
        payload: {
          calleeToken,
          calleeName: callee.firstName || 'Unknown',
        },
      });

    if (error) {
      this.logger.error(`Failed to insert accepted event: ${error.message}`);
      throw new BadRequestException('Failed to accept call');
    }

    // Update CallLog status
    await this.prisma.callLog.updateMany({
      where: { roomName, tenantId },
      data: { status: 'IN_PROGRESS' },
    });

    this.logger.log(`✅ Call accepted by ${calleeId} in room ${roomName}`);

    return { calleeToken, roomName };
  }

  /**
   * Reject a call - Creates rejection event
   * 
   * @param dto - Call rejection data
   */
  async rejectCall(dto: RejectCallDto) {
    const { roomName, calleeId, tenantId, reason } = dto;

    // Insert rejected event in Supabase (triggers Realtime)
    const { error } = await this.supabase
      .from('call_events')
      .insert({
        tenant_id: tenantId,
        caller_id: null,
        callee_id: calleeId,
        room_name: roomName,
        event_type: CallEventType.REJECTED,
        payload: { reason: reason || 'Call rejected' },
      });

    if (error) {
      this.logger.error(`Failed to insert rejected event: ${error.message}`);
      throw new BadRequestException('Failed to reject call');
    }

    // Update CallLog status
    await this.prisma.callLog.updateMany({
      where: { roomName, tenantId },
      data: { status: 'FAILED', endTime: new Date() },
    });

    // Delete LiveKit room
    await this.livekit.deleteRoom(`${tenantId}-${roomName}`);

    this.logger.log(`❌ Call rejected by ${calleeId} in room ${roomName}`);

    return { success: true };
  }

  /**
   * End a call - Creates end event and cleans up resources
   * 
   * @param dto - Call end data
   */
  async endCall(dto: EndCallDto) {
    const { roomName, userId, tenantId } = dto;

    // Insert ended event in Supabase (triggers Realtime)
    const { error } = await this.supabase
      .from('call_events')
      .insert({
        tenant_id: tenantId,
        caller_id: null,
        callee_id: userId,
        room_name: roomName,
        event_type: CallEventType.ENDED,
        payload: { endedBy: userId },
      });

    if (error) {
      this.logger.error(`Failed to insert ended event: ${error.message}`);
    }

    // Update CallLog with final status and duration
    const callLog = await this.prisma.callLog.findFirst({
      where: { roomName, tenantId },
    });

    if (callLog) {
      const endTime = new Date();
      const duration = Math.floor(
        (endTime.getTime() - callLog.startTime.getTime()) / 1000,
      );

      await this.prisma.callLog.update({
        where: { id: callLog.id },
        data: {
          status: 'COMPLETED',
          endTime,
          duration,
        },
      });
    }

    // Delete LiveKit room
    await this.livekit.deleteRoom(`${tenantId}-${roomName}`);

    this.logger.log(`📴 Call ended in room ${roomName}`);

    return { success: true, duration: callLog ? callLog.duration : 0 };
  }

  /**
   * Generate LiveKit token for a user (called after accepting)
   * 
   * @param dto - Token generation data
   * @returns LiveKit JWT token
   */
  async generateToken(dto: GenerateTokenDto) {
    const { userId, roomName, tenantId, userName } = dto;

    const token = await this.livekit.generateToken(
      userId,
      `${tenantId}-${roomName}`,
      tenantId,
      { name: userName || 'Unknown' },
    );

    return { token, roomName };
  }

  /**
   * Get call history for a user
   * 
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @returns Array of call logs
   */
  async getCallHistory(userId: string, tenantId: string) {
    const callLogs = await this.prisma.callLog.findMany({
      where: {
        tenantId,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    });

    return callLogs;
  }
}
