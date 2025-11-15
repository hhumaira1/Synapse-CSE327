import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseAuthService } from './supabase-auth/supabase-auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth/supabase-auth.guard';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [SupabaseAuthService, SupabaseAuthGuard],
  exports: [SupabaseAuthService, SupabaseAuthGuard],
  controllers: [AuthController],
})
export class SupabaseAuthModule {}
