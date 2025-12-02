import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

// Services
import { SuperAdminAuthService } from './auth/auth.service';
import { AuditService } from './audit/audit.service';
import { SuperAdminTenantsService } from './tenants/tenants.service';
import { SuperAdminAnalyticsService } from './analytics/analytics.service';

// Controllers
import { SuperAdminAuthController } from './auth/auth.controller';
import { AuditController } from './audit/audit.controller';
import { SuperAdminTenantsController } from './tenants/tenants.controller';
import { SuperAdminAnalyticsController } from './analytics/analytics.controller';

// Guards
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [DatabaseModule, SupabaseAuthModule],
  providers: [
    SuperAdminGuard,
    SuperAdminAuthService,
    AuditService,
    SuperAdminTenantsService,
    SuperAdminAnalyticsService,
  ],
  controllers: [
    SuperAdminAuthController,
    AuditController,
    SuperAdminTenantsController,
    SuperAdminAnalyticsController,
  ],
  exports: [SuperAdminGuard, AuditService],
})
export class SuperAdminModule {}
