import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramAuthService } from './telegram-auth.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    SupabaseAuthModule,
    ChatbotModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramAuthService],
  exports: [TelegramService, TelegramAuthService],
})
export class TelegramModule {}
