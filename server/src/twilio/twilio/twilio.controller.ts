import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Logger,
  Param,
} from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { VoiceService } from '../voice/voice.service';
import { SupabaseAuthGuard } from 'src/supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from 'src/supabase-auth/decorators/current-user.decorator';
import { AuthService } from 'src/auth/auth.service';

interface TwilioWebhookBody {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
}

@Controller('twilio')
export class TwilioController {
  private readonly logger = new Logger(TwilioController.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly voiceService: VoiceService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Generate Twilio Access Token for frontend client
   * POST /api/twilio/access-token
   */
  @Post('access-token')
  @UseGuards(SupabaseAuthGuard)
  async getAccessToken(@CurrentUser('id') supabaseUserId: string) {
    try {
      const user = await this.authService.getUserBySupabaseId(supabaseUserId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const identity = user.id;
      const tokenData = this.twilioService.generateAccessToken(identity);

      this.logger.log(`Generated access token for user: ${user.id}`);

      return tokenData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate access token: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Initiate outbound call
   * POST /api/twilio/make-call
   */
  @Post('make-call')
  @UseGuards(SupabaseAuthGuard)
  async makeCall(
    @Body() body: { to: string; contactId?: string },
    @CurrentUser('id') supabaseUserId: string,
  ) {
    try {
      let { to, contactId } = body;

      if (!to) {
        throw new BadRequestException('Phone number is required');
      }

      // Auto-format Bangladesh numbers (01XXXXXXXXX -> +8801XXXXXXXXX)
      if (to.startsWith('01') && to.length === 11) {
        to = `+880${to.slice(1)}`;
        this.logger.log(`Auto-formatted Bangladesh number: ${body.to} -> ${to}`);
      }
      // Auto-format US numbers (add +1 if missing)
      else if (to.length === 10 && /^\d{10}$/.test(to)) {
        to = `+1${to}`;
        this.logger.log(`Auto-formatted US number: ${body.to} -> ${to}`);
      }
      // Add + if missing but has country code
      else if (!to.startsWith('+') && to.length > 10) {
        to = `+${to}`;
      }

      // Validate E.164 format: +[country code][number]
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        throw new BadRequestException(
          'Invalid phone number format. Use international format: +[country code][number]. ' +
          'Examples: +8801712345678 (Bangladesh), +17085547043 (US)'
        );
      }

      const user = await this.authService.getUserBySupabaseId(supabaseUserId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const result = await this.voiceService.makeCall({
        tenantId: user.tenantId,
        userId: user.id,
        to,
        contactId,
      });

      this.logger.log(`Call initiated by user ${user.id} to ${to}`);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to make call: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Twilio voice webhook - generates TwiML for call
   * POST /api/twilio/voice-webhook
   */
  @Post('voice-webhook')
  voiceWebhook() {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your call</Say>
  <Dial callerId="${this.twilioService.getTwilioPhoneNumber()}">
    <Number></Number>
  </Dial>
</Response>`;

    return twiml;
  }

  /**
   * Twilio call status webhook
   * POST /api/twilio/call-status
   */
  @Post('call-status')
  async callStatusWebhook(@Body() body: TwilioWebhookBody) {
    try {
      const { CallSid, CallStatus, CallDuration } = body;

      this.logger.log(
        `Received call status update: ${CallSid as string} - ${CallStatus as string}`,
      );

      await this.voiceService.updateCallStatus({
        callSid: CallSid as string,
        callStatus: CallStatus as string,
        callDuration: CallDuration as string,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process call status: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Twilio recording status webhook
   * POST /api/twilio/recording-status
   */
  @Post('recording-status')
  async recordingStatusWebhook(@Body() body: TwilioWebhookBody) {
    try {
      const { CallSid, RecordingUrl, RecordingSid } = body;

      this.logger.log(`Received recording for call: ${CallSid as string}`);

      await this.voiceService.updateCallStatus({
        callSid: CallSid as string,
        callStatus: 'completed',
        recordingUrl: RecordingUrl as string,
        recordingSid: RecordingSid as string,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process recording status: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get call logs with filters
   * GET /api/twilio/call-logs
   */
  @Get('call-logs')
  @UseGuards(SupabaseAuthGuard)
  async getCallLogs(
    @CurrentUser('id') supabaseUserId: string,
    @Query('userId') userId?: string,
    @Query('contactId') contactId?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const user = await this.authService.getUserBySupabaseId(supabaseUserId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const filters: {
        userId?: string;
        contactId?: string;
        status?: string;
        direction?: 'INBOUND' | 'OUTBOUND';
        startDate?: Date;
        endDate?: Date;
      } = {
        userId,
        contactId,
        status,
      };

      if (direction && (direction === 'INBOUND' || direction === 'OUTBOUND')) {
        filters.direction = direction;
      }

      if (startDate) {
        filters.startDate = new Date(startDate);
      }

      if (endDate) {
        filters.endDate = new Date(endDate);
      }

      const callLogs = await this.voiceService.getCallLogs(
        user.tenantId,
        filters,
      );

      return callLogs;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch call logs: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get single call log by ID
   * GET /api/twilio/call-logs/:id
   */
  @Get('call-logs/:id')
  @UseGuards(SupabaseAuthGuard)
  async getCallLog(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
  ) {
    try {
      const user = await this.authService.getUserBySupabaseId(supabaseUserId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const callLog = await this.voiceService.getCallLog(user.tenantId, id);

      return callLog;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch call log: ${errorMessage}`);
      throw error;
    }
  }
}


