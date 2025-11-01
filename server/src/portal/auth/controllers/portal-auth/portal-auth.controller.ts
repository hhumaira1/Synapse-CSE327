import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClerkAuthGuard } from 'src/clerk/guards/clerk-auth/clerk-auth.guard';
import { PortalAuthService } from '../../services/portal-auth/portal-auth.service';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';
import type { JwtPayload } from '@clerk/types';
@Controller('portal/auth')
export class PortalAuthController {
  constructor(private readonly portalAuthService: PortalAuthService) {}

  /**
   * Called by the frontend ONCE after a new portal user
   * signs up via an invite. This links their Clerk account
   * to the PortalCustomer record.
   */
  @Post('sync')
  @UseGuards(ClerkAuthGuard)
  async syncPortalUser(
    @CurrentUser('sub') clerkId: string,
    @CurrentUser() fullUser: JwtPayload,
    @Body() body: { tenantId: string },
  ) {
    // Extract primary email
    interface EmailAddress {
      id: string;
      email_address: string;
    }

    type JwtPayloadWithEmail = JwtPayload & {
      email_addresses?: EmailAddress[];
      primary_email_address_id?: string;
    };

    const fullUserWithEmail = fullUser as JwtPayloadWithEmail;

    // Extract primary email
    const email = fullUserWithEmail.email_addresses?.find(
      (e) => e.id === fullUserWithEmail.primary_email_address_id,
    )?.email_address;

    // const email = fullUser.email_addresses?.find(
    //   (e) => e.id === fullUser.primary_email_address_id,
    // )?.email_address;

    if (!email) {
      throw new BadRequestException('Primary email not found in token');
    }

    if (!body.tenantId) {
      throw new BadRequestException('Tenant ID is required for sync');
    }

    const portalCustomer = await this.portalAuthService.syncPortalCustomer(
      clerkId,
      email,
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
  @UseGuards(ClerkAuthGuard)
  async getMe(@CurrentUser('sub') clerkId: string) {
    const accounts = await this.portalAuthService.getPortalAccounts(clerkId);
    return accounts;
  }
}
