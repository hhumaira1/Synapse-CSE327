import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

/**
 * RecordingService
 * 
 * Handles:
 * - LiveKit egress webhook events
 * - Uploading recordings to Supabase Storage
 * - Updating CallRecording status in database
 * - Triggering transcription after upload
 */
@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Initialize Supabase client
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.warn('Supabase credentials not configured');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.logger.log('✅ Recording service initialized with Supabase Storage');
  }

  /**
   * Handle LiveKit egress webhook
   * Called when recording is complete
   */
  async handleEgressWebhook(payload: {
    egressId: string;
    roomName: string;
    status: 'EGRESS_STARTING' | 'EGRESS_ACTIVE' | 'EGRESS_ENDING' | 'EGRESS_COMPLETE' | 'EGRESS_FAILED';
    fileUrl?: string;
    error?: string;
  }) {
    const { egressId, roomName, status, fileUrl, error } = payload;

    this.logger.log(`LiveKit egress webhook: ${egressId} - ${status}`);

    // Find the call log by room name
    const callLog = await this.prisma.callLog.findFirst({
      where: { roomName },
    });

    if (!callLog) {
      this.logger.warn(`Call log not found for room: ${roomName}`);
      return;
    }

    // Check if recording record exists
    let recording = await this.prisma.callRecording.findUnique({
      where: { callLogId: callLog.id },
    });

    switch (status) {
      case 'EGRESS_STARTING':
      case 'EGRESS_ACTIVE':
        // Create or update recording as IN_PROGRESS
        if (!recording) {
          recording = await this.prisma.callRecording.create({
            data: {
              callLogId: callLog.id,
              tenantId: callLog.tenantId,
              fileUrl: '', // Will be updated when complete
              fileName: `${roomName}.webm`,
              provider: 'LIVEKIT',
              providerId: egressId,
              status: 'IN_PROGRESS',
            },
          });
        } else {
          await this.prisma.callRecording.update({
            where: { id: recording.id },
            data: { status: 'IN_PROGRESS' },
          });
        }
        break;

      case 'EGRESS_COMPLETE':
        if (fileUrl) {
          // Download from LiveKit and upload to Supabase Storage
          await this.uploadToSupabase(recording, fileUrl, callLog.tenantId);
        }
        break;

      case 'EGRESS_FAILED':
        if (recording) {
          await this.prisma.callRecording.update({
            where: { id: recording.id },
            data: { status: 'FAILED' },
          });
        }
        this.logger.error(`Recording failed for ${roomName}: ${error}`);
        break;
    }
  }

  /**
   * Download recording from LiveKit and upload to Supabase Storage
   */
  private async uploadToSupabase(
    recording: any,
    livekitUrl: string,
    tenantId: string,
  ) {
    try {
      this.logger.log(`Downloading recording from LiveKit: ${livekitUrl}`);

      // Download file from LiveKit
      const response = await fetch(livekitUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      // Bucket: 'call-recordings'
      // Path: {tenantId}/{callLogId}.webm
      const fileName = `${tenantId}/${recording.callLogId}.webm`;

      const { data, error } = await this.supabase.storage
        .from('call-recordings')
        .upload(fileName, buffer, {
          contentType: 'audio/webm',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('call-recordings')
        .getPublicUrl(fileName);

      this.logger.log(`✅ Recording uploaded to Supabase: ${urlData.publicUrl}`);

      // Update database
      await this.prisma.callRecording.update({
        where: { id: recording.id },
        data: {
          fileUrl: urlData.publicUrl,
          fileSize: buffer.length,
          status: 'COMPLETED',
          recordingEndTime: new Date(),
        },
      });

      // Trigger transcription (optional - could be async job)
      // await this.transcriptionService.startTranscription(recording.callLogId);

    } catch (error) {
      this.logger.error('Failed to upload recording to Supabase', error);
      await this.prisma.callRecording.update({
        where: { id: recording.id },
        data: { status: 'FAILED' },
      });
    }
  }

  /**
   * Get recording URL from Supabase Storage
   */
  async getRecordingUrl(callLogId: string): Promise<string | null> {
    const recording = await this.prisma.callRecording.findUnique({
      where: { callLogId },
    });

    if (!recording || recording.status !== 'COMPLETED') {
      return null;
    }

    return recording.fileUrl;
  }

  /**
   * Delete recording from Supabase Storage
   */
  async deleteRecording(callLogId: string): Promise<void> {
    const recording = await this.prisma.callRecording.findUnique({
      where: { callLogId },
      include: { callLog: true },
    });

    if (!recording) {
      return;
    }

    // Delete from Supabase Storage
    const fileName = `${recording.tenantId}/${callLogId}.webm`;
    await this.supabase.storage.from('call-recordings').remove([fileName]);

    // Delete from database
    await this.prisma.callRecording.delete({
      where: { id: recording.id },
    });

    this.logger.log(`🗑️ Deleted recording: ${callLogId}`);
  }
}
