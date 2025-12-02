import { Module, forwardRef } from '@nestjs/common';
import { ZammadApiService } from './services/zammad-api.service';
import { ZammadService } from './services/zammad.service';
import { ZammadIdentityService } from './services/zammad-identity.service';
import { ZammadWebhooksController } from './controllers/zammad-webhooks.controller';
import { ZammadSsoController } from './controllers/zammad-sso.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PortalAuthModule } from '../portal/auth/portal-auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => AuthModule),
        forwardRef(() => PortalAuthModule),
        forwardRef(() => SupabaseAuthModule),
    ],
    providers: [
        ZammadApiService,
        ZammadService,
        ZammadIdentityService,
    ],
    controllers: [
        ZammadWebhooksController,
        ZammadSsoController,
    ],
    exports: [
        ZammadApiService,
        ZammadService,
        ZammadIdentityService,
    ],
})
export class ZammadModule { }
