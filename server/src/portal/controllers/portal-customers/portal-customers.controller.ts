import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PortalCustomersService } from '../../services/portal-customers/portal-customers.service';
import { InviteCustomerDto } from '../../dto/invite-customer.dto';
import { ClerkAuthGuard } from 'src/clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { UserRole } from 'prisma/generated/client';

@Controller('portal/customers')
@UseGuards(ClerkAuthGuard)
export class PortalCustomersController {
  constructor(
    private readonly portalCustomersService: PortalCustomersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get portal invitation details by token (PUBLIC - no auth required)
   * Used when customer clicks invitation link
   */
  @Get('invitation/:accessToken')
  async getInvitationDetails(@Param('accessToken') accessToken: string) {
    const portalCustomer =
      await this.portalCustomersService.getPortalCustomerByToken(accessToken);

    if (!portalCustomer || !portalCustomer.contact || !portalCustomer.tenant) {
      throw new NotFoundException('Invitation not found or expired');
    }

    return {
      id: portalCustomer.id,
      isActive: portalCustomer.isActive,
      alreadyAccepted: !!portalCustomer.clerkId,
      contact: {
        firstName: portalCustomer.contact.firstName,
        lastName: portalCustomer.contact.lastName,
        email: portalCustomer.contact.email,
      },
      tenant: {
        name: portalCustomer.tenant.name,
      },
    };
  }

  /**
   * Invite customer to portal (ADMIN/MANAGER only)
   */
  @Post('invite')
  async inviteCustomer(
    @CurrentUser('sub') clerkId: string,
    @Body() inviteCustomerDto: InviteCustomerDto,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Only ADMIN and MANAGER can invite customers
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Only admins and managers can invite customers to the portal',
      );
    }

    return this.portalCustomersService.inviteCustomer(
      currentUser.tenantId,
      inviteCustomerDto.contactId,
      inviteCustomerDto.message,
    );
  }

  /**
   * Link portal access token to Clerk account (used during customer sign-up)
   * This endpoint is called when customer clicks invitation link and signs up
   */
  @Post('link/:accessToken')
  async linkPortalAccess(
    @Param('accessToken') accessToken: string,
    @CurrentUser('sub') clerkId: string,
  ) {
    return this.portalCustomersService.linkClerkToPortalCustomer(
      accessToken,
      clerkId,
    );
  }

  /**
   * Get portal customers where current user is the customer (by Clerk ID)
   * Used in customer portal dashboard
   */
  @Get('my-access')
  async getMyPortalAccess(@CurrentUser('sub') clerkId: string) {
    return this.portalCustomersService.getPortalCustomerByClerkId(clerkId);
  }

  /**
   * Get all portal customers for current tenant
   */
  @Get()
  async getPortalCustomers(
    @CurrentUser('sub') clerkId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.portalCustomersService.getPortalCustomers(
      currentUser.tenantId,
      activeOnly === 'false' ? false : true,
    );
  }

  /**
   * Deactivate portal access (ADMIN only)
   */
  @Delete(':id')
  async deactivatePortalAccess(
    @CurrentUser('sub') clerkId: string,
    @Param('id') portalCustomerId: string,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate portal access');
    }

    return this.portalCustomersService.deactivatePortalAccess(
      currentUser.tenantId,
      portalCustomerId,
    );
  }
}
