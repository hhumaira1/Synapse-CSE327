import { Module } from '@nestjs/common';
import { OsTicketController } from './controllers/osticket.controller';
import { OsTicketApiService } from './services/osticket-api.service';
import { TicketSyncService } from './services/ticket-sync.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, SupabaseAuthModule],
  controllers: [OsTicketController],
  providers: [OsTicketApiService, TicketSyncService],
  exports: [OsTicketApiService, TicketSyncService],
})
export class OsticketModule {}
