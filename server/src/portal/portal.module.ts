import { Module } from '@nestjs/common';
import { PortalCustomersService } from './services/portal-customers/portal-customers.service';
import { PortalCustomersController } from './controllers/portal-customers/portal-customers.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [PortalCustomersService],
  controllers: [PortalCustomersController],
  exports: [PortalCustomersService],
})
export class PortalModule {}
