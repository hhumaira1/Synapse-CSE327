import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VoipService, StartCallDto, AcceptCallDto, RejectCallDto, EndCallDto, GenerateTokenDto } from './voip.service';
//import { SupabaseAuthGuard } from '../supabase-auth/guards/supabase-auth.guard';
import { CurrentUser } from '../supabase-auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from 'src/supabase-auth/guards/supabase-auth/supabase-auth.guard';

/**
 * VoipController
 * 
 * REST API endpoints for VoIP call management.
 * All signaling happens via Supabase Realtime, these endpoints
 * just trigger the events.
 */
@Controller('voip')
@UseGuards(SupabaseAuthGuard)
export class VoipController {
  constructor(private readonly voipService: VoipService) {}

  /**
   * POST /api/voip/start-call
   * 
   * Initiate a call between two users.
   * Creates LiveKit room and inserts "call_started" event.
   * 
   * @body calleeId - User ID to call
   * @body callerName - Optional caller name
   * 
   * @returns { roomName, callerToken, callLogId }
   */
  @Post('start-call')
  @HttpCode(HttpStatus.CREATED)
  async startCall(
    @Body() body: { calleeId: string; callerName?: string },
    @CurrentUser('id') callerId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const dto: StartCallDto = {
      callerId,
      calleeId: body.calleeId,
      tenantId,
      callerName: body.callerName,
    };

    return this.voipService.startCall(dto);
  }

  /**
   * POST /api/voip/accept
   * 
   * Accept an incoming call.
   * Generates LiveKit token and inserts "accepted" event.
   * 
   * @body roomName - Room name from call_started event
   * 
   * @returns { calleeToken, roomName }
   */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async acceptCall(
    @Body() body: { roomName: string },
    @CurrentUser('id') calleeId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const dto: AcceptCallDto = {
      roomName: body.roomName,
      calleeId,
      tenantId,
    };

    return this.voipService.acceptCall(dto);
  }

  /**
   * POST /api/voip/reject
   * 
   * Reject an incoming call.
   * Inserts "rejected" event and cleans up room.
   * 
   * @body roomName - Room name from call_started event
   * @body reason - Optional rejection reason
   * 
   * @returns { success: true }
   */
  @Post('reject')
  @HttpCode(HttpStatus.OK)
  async rejectCall(
    @Body() body: { roomName: string; reason?: string },
    @CurrentUser('id') calleeId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const dto: RejectCallDto = {
      roomName: body.roomName,
      calleeId,
      tenantId,
      reason: body.reason,
    };

    return this.voipService.rejectCall(dto);
  }

  /**
   * POST /api/voip/end
   * 
   * End an active call.
   * Inserts "ended" event, updates CallLog, deletes room.
   * 
   * @body roomName - Room name
   * 
   * @returns { success: true, duration }
   */
  @Post('end')
  @HttpCode(HttpStatus.OK)
  async endCall(
    @Body() body: { roomName: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const dto: EndCallDto = {
      roomName: body.roomName,
      userId,
      tenantId,
    };

    return this.voipService.endCall(dto);
  }

  /**
   * POST /api/voip/token
   * 
   * Generate LiveKit token for a user to join a room.
   * Called by both caller (after starting) and callee (after accepting).
   * 
   * @body roomName - Room name to join
   * @body userName - Optional user display name
   * 
   * @returns { token, roomName }
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async generateToken(
    @Body() body: { roomName: string; userName?: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const dto: GenerateTokenDto = {
      userId,
      roomName: body.roomName,
      tenantId,
      userName: body.userName,
    };

    return this.voipService.generateToken(dto);
  }

  /**
   * GET /api/voip/history
   * 
   * Get call history for current user.
   * 
   * @returns Array of CallLog entries
   */
  @Get('history')
  async getCallHistory(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.voipService.getCallHistory(userId, tenantId);
  }
}
