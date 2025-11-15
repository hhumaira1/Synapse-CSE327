import { Module } from '@nestjs/common';
import { StagesService } from './stages/stages.service';
import { StagesController } from './stages/stages.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, SupabaseAuthModule],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
