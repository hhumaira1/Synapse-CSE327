import { Module } from '@nestjs/common';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';
import { JiraModule } from '../jira/jira.module'; // Jira integration enabled
// import { ZammadModule } from '../zammad/zammad.module'; // COMMENTED OUT - Switched to Jira

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SupabaseAuthModule,
    JiraModule, // Using Jira now
    // ZammadModule, // COMMENTED OUT
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule { }
