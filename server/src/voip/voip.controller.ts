import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Param,
  Logger,
} from '@nestjs/common';
import { VoipService } from './voip.service';
import { CurrentUser } from '../supabase-auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from 'src/supabase-auth/guards/supabase-auth/supabase-auth.guard';

/**
 * VoipController - Redesigned for LiveKit + WebSocket signaling
 * 
 * Key changes:
 * - Uses X-Active-Tenant header instead of getTenantId()
 * - Simplified call endpoints (only Supabase IDs)
 * - New endpoints for FCM/push token registration
 * - Recording and transcription endpoints
 */
@Controller('voip')
@UseGuards(SupabaseAuthGuard)
export class VoipController {
  private readonly logger = new Logger(VoipController.name); // Added logger property
  
  constructor(private readonly voipService: VoipService) {}

  /**
   * Extract tenant ID from X-Active-Tenant header (for multi-portal users)
   * Falls back to user's primary tenant if header not provided
   */
  private async getTenantId(
    supabaseUserId: string,
    activeTenantHeader?: string,
  ): Promise<string> {
    if (activeTenantHeader) {
      return activeTenantHeader;
    }
    
    // Fallback: get user's tenant
    return this.voipService.getUserTenantId(supabaseUserId);
  }

  /**
   * POST /api/voip/start-call
   * 
   * Initiate a call - sends WebSocket + FCM + Web Push notifications
   */
  @Post('start-call')
  @HttpCode(HttpStatus.CREATED)
  async startCall(
    @Body() body: { calleeSupabaseId: string; callerName?: string },
    @CurrentUser('id') callerSupabaseId: string,
    @Headers('x-active-tenant') activeTenant?: string,
  ) {
    const tenantId = await this.getTenantId(callerSupabaseId, activeTenant);
    
    return this.voipService.startCall({
      callerSupabaseId,
      calleeSupabaseId: body.calleeSupabaseId,
      tenantId,
      callerName: body.callerName,
    });
  }

  /**
   * POST /api/voip/accept
   * 
   * Accept incoming call
   */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async acceptCall(
    @Body() body: { callLogId: string; roomName: string },
    @CurrentUser('id') calleeSupabaseId: string,
  ) {
    return this.voipService.acceptCall({
      callLogId: body.callLogId,
      calleeSupabaseId,
      roomName: body.roomName,
    });
  }

  /**
   * POST /api/voip/reject
   * 
   * Reject incoming call
   */
  @Post('reject')
  @HttpCode(HttpStatus.OK)
  async rejectCall(
     @Body() body: { callLogId: string; reason?: string },
    @CurrentUser('id') calleeSupabaseId: string,
  ) {
    return this.voipService.rejectCall({
      callLogId: body.callLogId,
      calleeSupabaseId,
      reason: body.reason,
    });
  }

  /**
   * POST /api/voip/end
   * 
   * End active call
   */
  @Post('end')
  @HttpCode(HttpStatus.OK)
  async endCall(
    @Body() body: { callLogId: string; roomName: string },
    @CurrentUser('id') userSupabaseId: string,
  ) {
    return this.voipService.endCall({
      callLogId: body.callLogId,
      userSupabaseId,
      roomName: body.roomName,
    });
  }

  /**
   * POST /api/voip/token
   * 
   * Generate LiveKit token for joining a room
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async generateToken(
    @Body() body: { roomName: string; userName?: string },
    @CurrentUser('id') userSupabaseId: string,
  ) {
    return this.voipService.generateToken({
      userSupabaseId,
      roomName: body.roomName,
      userName: body.userName,
    });
  }

  /**
   * POST /api/voip/update-fcm-token
   * 
   * Update FCM token for push notifications (Android)
   */
  @Post('update-fcm-token')
  @HttpCode(HttpStatus.OK)
  async updateFcmToken(
    @Body() body: { fcmToken: string },
    @CurrentUser('id') supabaseUserId: string,
  ) {
    return this.voipService.updateFcmToken(supabaseUserId, body.fcmToken);
  }

  /**
   * POST /api/voip/update-push-subscription
   * 
   * Update web push subscription (Web browsers)
   */
  @Post('update-push-subscription')
  @HttpCode(HttpStatus.OK)
  async updatePushSubscription(
    @Body() body: { subscription: any },
    @CurrentUser('id') supabaseUserId: string,
  ) {
    return this.voipService.updatePushSubscription(supabaseUserId, body.subscription);
  }

  /**
   * GET /api/voip/online-users
   * 
   * Get list of all online users in current tenant
   */
  @Get('online-users')
  async getOnlineUsers(
    @CurrentUser('id') userId: string,
    @Headers('x-active-tenant') activeTenant?: string,
  ) {
    const tenantId = await this.getTenantId(userId, activeTenant);
    this.logger.log(`🔍 Fetching online users for userId: ${userId}, tenantId: ${tenantId}`);
    
    const users = await this.voipService.getOnlineUsers(tenantId);
    this.logger.log(`✅ Found ${users.length} online users`);
    
    return users;
  }

  /**
   * GET /api/voip/available-agents
   * 
   * Get list of available support agents (for portal customers)
   */
  @Get('available-agents')
  async getAvailableAgents(
    @CurrentUser('id') userId: string,
    @Headers('x-active-tenant') activeTenant?: string,
  ) {
    const tenantId = await this.getTenantId(userId, activeTenant);
    this.logger.log(`🔍 Fetching available agents for userId: ${userId}, tenantId: ${tenantId}`);
    
    const agents = await this.voipService.getAvailableAgents(userId, tenantId);
    this.logger.log(`✅ Found ${agents.length} available agents`);
    
    return agents;
  }

  /**
   * GET /api/voip/history
   * 
   * Get call history for current user
   */
  @Get('history')
  async getCallHistory(
    @CurrentUser('id') supabaseUserId: string,
    @Headers('x-active-tenant') activeTenant?: string,
  ) {
    const tenantId = await this.getTenantId(supabaseUserId, activeTenant);
    return this.voipService.getCallHistory(supabaseUserId, tenantId);
  }

  /**
   * GET /api/voip/recording/:callLogId
   * 
   * Get recording URL for a call
   */
  @Get('recording/:callLogId')
  async getRecording(@Param('callLogId') callLogId: string) {
    return this.voipService.getRecording(callLogId);
  }

  /**
   * GET /api/voip/transcript/:callLogId
   * 
   * Get transcription for a call
   */
  @Get('transcript/:callLogId')
  async getTranscript(@Param('callLogId') callLogId: string) {
    return this.voipService.getTranscript(callLogId);
  }

  /**
   * GET /api/voip/presence/:userId
   * 
   * Get presence status for a user
   */
  @Get('presence/:userId')
  async getPresence(@Param('userId') userId: string) {
    return this.voipService.getPresence(userId);
  }
}
