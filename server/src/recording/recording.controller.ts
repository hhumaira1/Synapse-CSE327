import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { RecordingService } from './recording.service';

/**
 * RecordingController
 * 
 * Webhook endpoint for LiveKit egress events
 */
@Controller('webhooks/recording')
export class RecordingController {
  private readonly logger = new Logger(RecordingController.name);

  constructor(private recordingService: RecordingService) {}

  /**
   * POST /webhooks/recording/livekit-egress
   * 
   * LiveKit calls this webhook when recording status changes
   * Configure in LiveKit dashboard: Egress → Webhooks
   */
  @Post('livekit-egress')
  @HttpCode(HttpStatus.OK)
  async handleLiveKitEgress(@Body() payload: any) {
    this.logger.log('Received LiveKit egress webhook');
    
    try {
      await this.recordingService.handleEgressWebhook({
        egressId: payload.egressId || payload.egress_id,
        roomName: payload.roomName || payload.room_name,
        status: payload.status,
        fileUrl: payload.file?.location || payload.fileUrl,
        error: payload.error,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process egress webhook', error);
      return { success: false, error: error.message };
    }
  }
}
