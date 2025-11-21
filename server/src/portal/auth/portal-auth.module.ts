import { Module } from '@nestjs/common';
import { PortalAuthService } from './services/portal-auth/portal-auth.service';
import { PortalAuthController } from './controllers/portal-auth/portal-auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { SupabaseAuthModule } from 'src/supabase-auth/supabase-auth.module';

@Module({
  imports: [DatabaseModule, SupabaseAuthModule],
  providers: [PortalAuthService],
  controllers: [PortalAuthController],
  exports: [PortalAuthService], // Export so portal module can use it
})
export class PortalAuthModule {}
