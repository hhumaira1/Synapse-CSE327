import { Module } from '@nestjs/common';
import { PortalAuthService } from './services/portal-auth/portal-auth.service';
import { PortalAuthController } from './controllers/portal-auth/portal-auth.controller';

@Module({
  providers: [PortalAuthService],
  controllers: [PortalAuthController],
})
export class PortalAuthModule {}
