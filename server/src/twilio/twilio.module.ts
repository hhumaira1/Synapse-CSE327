import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwilioService } from './twilio/twilio.service';
import { TwilioController } from './twilio/twilio.controller';
import { VoiceService } from './voice/voice.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, SupabaseAuthModule],
  providers: [TwilioService, VoiceService],
  controllers: [TwilioController],
  exports: [TwilioService, VoiceService],
})
export class TwilioModule {}
