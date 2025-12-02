import { Module } from '@nestjs/common';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';
// import { JiraModule } from '../jira/jira.module'; // COMMENTED OUT - Using Zammad now
import { ZammadModule } from '../zammad/zammad.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SupabaseAuthModule,
    // JiraModule, // COMMENTED OUT
    ZammadModule, // NEW - Zammad integration
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule { }
