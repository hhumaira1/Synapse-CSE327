import { Module } from '@nestjs/common';
import { PortalCustomersService } from './services/portal-customers/portal-customers.service';
import { PortalCustomersController } from './controllers/portal-customers/portal-customers.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { SupabaseAuthModule } from 'src/supabase-auth/supabase-auth.module';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsModule } from 'src/tickets/tickets.module';
import { PortalAuthModule } from './auth/portal-auth.module';
import { ZammadModule } from 'src/zammad/zammad.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SupabaseAuthModule,
    TicketsModule,
    PortalAuthModule,
    ZammadModule,  // Add Zammad for auto-provisioning
  ],
  providers: [PortalCustomersService],
  controllers: [PortalCustomersController, TicketsController],
  exports: [PortalCustomersService],
})
export class PortalModule { }
