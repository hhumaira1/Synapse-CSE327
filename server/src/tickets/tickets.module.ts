import { Module } from '@nestjs/common';
import { TicketsService } from './tickets/tickets.service';
import { TicketsController } from './tickets/tickets.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService], // Export so portal module can use it
})
export class TicketsModule {}
