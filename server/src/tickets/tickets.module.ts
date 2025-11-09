import { Module } from '@nestjs/common';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ClerkModule } from '../clerk/clerk.module';
import { OsticketModule } from '../osticket/osticket.module';
import { JiraModule } from '../jira/jira.module';

@Module({
  imports: [DatabaseModule, AuthModule, ClerkModule, OsticketModule, JiraModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
