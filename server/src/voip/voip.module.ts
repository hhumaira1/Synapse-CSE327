import { Module } from '@nestjs/common';
import { VoipController } from './voip.controller';
import { VoipService } from './voip.service';
import { LiveKitService } from './livekit.service';
import { DatabaseModule } from '../database/database.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

/**
 * VoipModule
 * 
 * Handles VoIP calling with:
 * - Supabase Realtime for signaling
 * - LiveKit for audio/video streaming
 * 
 * No WebSockets used - all real-time via Supabase.
 */
@Module({
  imports: [DatabaseModule, SupabaseAuthModule],
  controllers: [VoipController],
  providers: [VoipService, LiveKitService],
  exports: [VoipService, LiveKitService],
})
export class VoipModule {}
