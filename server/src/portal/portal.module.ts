import { Module } from '@nestjs/common';
import { PortalCustomersService } from './services/portal-customers/portal-customers.service';
import { PortalCustomersController } from './controllers/portal-customers/portal-customers.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsModule } from 'src/tickets/tickets.module';
import { PortalAuthModule } from './auth/portal-auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, TicketsModule, PortalAuthModule],
  providers: [PortalCustomersService],
  controllers: [PortalCustomersController, TicketsController],
  exports: [PortalCustomersService],
})
export class PortalModule {}
