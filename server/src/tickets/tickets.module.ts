import { Module } from '@nestjs/common';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';
import { OsticketModule } from '../osticket/osticket.module';
import { JiraModule } from '../jira/jira.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SupabaseAuthModule,
    OsticketModule,
    JiraModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
