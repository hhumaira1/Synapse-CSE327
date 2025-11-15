import { Module } from '@nestjs/common';
import { LeadsService } from './leads/leads.service';
import { LeadsController } from './leads/leads.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, SupabaseAuthModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
