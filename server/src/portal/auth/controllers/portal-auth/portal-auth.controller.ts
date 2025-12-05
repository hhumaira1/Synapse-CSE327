import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { PortalAuthService } from '../../services/portal-auth/portal-auth.service';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';
import type { User } from '@supabase/supabase-js';
@Controller('portal/auth')
export class PortalAuthController {
  constructor(private readonly portalAuthService: PortalAuthService) {}

  /**
   * Called by the frontend ONCE after a new portal user
   * signs up via an invite. This links their Supabase account
   * to the PortalCustomer record.
   */
  @Post('sync')
  @UseGuards(SupabaseAuthGuard)
  async syncPortalUser(
    @CurrentUser() user: User,
    @Body() body: { tenantId: string },
  ) {
    if (!user.email) {
      throw new BadRequestException('Email not found in user profile');
    }

    if (!body.tenantId) {
      throw new BadRequestException('Tenant ID is required for sync');
    }

    const portalCustomer = await this.portalAuthService.syncPortalCustomer(
      user.id,
      user.email,
      body.tenantId,
    );

    return {
      message: 'Portal account synced successfully',
      user: portalCustomer,
    };
  }

  /**
   * Gets the portal-level "me" details.
   * This returns ALL tenant portals this user has access to.
   */
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@CurrentUser() user: User) {
    const accounts = await this.portalAuthService.getPortalAccounts(user.id);
    return accounts;
  }
}
