import { Module } from '@nestjs/common';
import { VoipController } from './voip.controller';
import { VoipService } from './voip.service';
import { DatabaseModule } from '../database/database.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';
import { LiveKitModule } from '../livekit/livekit.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { FcmModule } from '../fcm/fcm.module';
import { PushModule } from '../push/push.module';

/**
 * VoipModule - Redesigned with WebSocket signaling
 * 
 * Integrates:
 * - LiveKit for media (audio/video)
 * - WebSocket for real-time signaling ( replaces Supabase Realtime)
 * - FCM for Android push notifications
 * - Web Push for browser notifications
 * - Presence tracking
 */
@Module({
  imports: [
    DatabaseModule,
    SupabaseAuthModule,
    LiveKitModule,
    WebsocketModule,
    FcmModule,
    PushModule,
  ],
  controllers: [VoipController],
  providers: [VoipService],
  exports: [VoipService],
})
export class VoipModule {}
