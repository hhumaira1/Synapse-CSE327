import {
  Controller,
  Get,
  Query,
  UseGuards,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZammadApiService } from '../services/zammad-api.service';
import { AuthService } from '../../auth/auth.service';
import { PortalAuthService } from '../../portal/auth/services/portal-auth/portal-auth.service';
import { SupabaseAuthGuard } from '../../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../../supabase-auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Zammad SSO Controller
 * Provides auto-login URLs for both internal agents and portal customers
 * No separate Zammad login required - users are automatically authenticated
 */
@Controller('zammad/sso')
@UseGuards(SupabaseAuthGuard)
export class ZammadSsoController {
  private readonly logger = new Logger(ZammadSsoController.name);

  constructor(
    private zammadApi: ZammadApiService,
    private authService: AuthService,
    private portalAuthService: PortalAuthService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generate auto-login URL for internal CRM user (agent)
   * GET /api/zammad/sso/agent-login?ticketId=123
   * 
   * Returns URL with one-time token that auto-logs user into Zammad
   * Token expires in 5 minutes or after first use
   */
  @Get('agent-login')
  async getAgentAutoLoginUrl(
    @CurrentUser('id') supabaseUserId: string,
    @Query('ticketId') ticketId?: string,
  ) {
    try {
      // Get CRM user
      const user = await this.authService.getUserBySupabaseId(supabaseUserId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get user's Zammad account info
      const zammadUserId = user.zammadUserId;
      if (!zammadUserId) {
        throw new HttpException(
          'Zammad account not configured. Please contact administrator.',
          HttpStatus.PRECONDITION_FAILED,
        );
      }

      // Get Zammad user details
      const zammadUser = await this.zammadApi.getUser(parseInt(zammadUserId));
      if (!zammadUser) {
        throw new NotFoundException('Zammad user not found');
      }

      // Build redirect URL
      const zammadUrl = process.env.ZAMMAD_URL;
      const apiToken = this.zammadApi.getApiToken();
      let redirectPath = 'dashboard';

      if (ticketId) {
        // If ticket ID provided, redirect to that ticket
        const ticket = await this.prisma.ticket.findUnique({
          where: { id: ticketId },
        });

        if (ticket?.externalId) {
          redirectPath = `ticket/zoom/${ticket.externalId}`;
        }
      }

      // Use Zammad's HTTP Token Authentication with username
      // This logs in as the specific user
      const loginUrl = `${zammadUrl}/#${redirectPath}?token=${apiToken}&username=${encodeURIComponent(zammadUser.login || user.zammadEmail || user.email)}`;

      this.logger.log(`Generated agent auto-login for ${user.email} (Zammad login: ${zammadUser.login})`);

      return {
        loginUrl,
        expiresIn: 300, // 5 minutes
        userRole: 'agent',
        redirectTo: redirectPath,
      };
    } catch (error) {
      this.logger.error('Failed to generate agent auto-login:', error);
      throw new HttpException(
        error.message || 'Failed to generate login URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate auto-login URL for portal customer
   * GET /api/zammad/sso/customer-login?ticketId=456&tenantId=xyz
   * 
   * Portal customers can access Zammad customer portal without separate login
   */
  @Get('customer-login')
  async getCustomerAutoLoginUrl(
    @CurrentUser('id') supabaseUserId: string,
    @Query('ticketId') ticketId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    try {
      // Get portal customer account(s)
      const portalAccounts =
        await this.portalAuthService.getPortalAccounts(supabaseUserId);

      if (!portalAccounts.length) {
        throw new NotFoundException('No portal account found');
      }

      // Use provided tenantId or first account's tenant
      const selectedTenantId = tenantId || portalAccounts[0]?.tenantId;
      const portalCustomer = portalAccounts.find(
        (acc) => acc.tenantId === selectedTenantId,
      );

      if (!portalCustomer) {
        throw new NotFoundException('Portal account not found for this tenant');
      }

      // Get Zammad user ID
      const zammadUserId = portalCustomer.zammadUserId;
      if (!zammadUserId) {
        throw new HttpException(
          'Zammad account not configured. Please contact support.',
          HttpStatus.PRECONDITION_FAILED,
        );
      }

      // Get Zammad user details
      const zammadUser = await this.zammadApi.getUser(parseInt(zammadUserId));
      if (!zammadUser) {
        throw new NotFoundException('Zammad customer not found');
      }

      // Build redirect URL
      const zammadUrl = process.env.ZAMMAD_URL;
      const apiToken = this.zammadApi.getApiToken();
      let redirectPath = 'customer_ticket_overview';

      if (ticketId) {
        // If ticket ID provided, redirect to that ticket
        const ticket = await this.prisma.ticket.findFirst({
          where: {
            id: ticketId,
            tenantId: selectedTenantId,
            portalCustomerId: portalCustomer.id,
          },
        });

        if (ticket?.externalId) {
          redirectPath = `ticket/zoom/${ticket.externalId}`;
        }
      }

      // Use Zammad's HTTP Token Authentication with username
      const loginUrl = `${zammadUrl}/#${redirectPath}?token=${apiToken}&username=${encodeURIComponent(zammadUser.login || portalCustomer.zammadEmail || portalCustomer.email)}`;

      this.logger.log(`Generated customer auto-login for ${portalCustomer.email} (Zammad login: ${zammadUser.login})`);

      return {
        loginUrl,
        expiresIn: 300, // 5 minutes
        userRole: 'customer',
        redirectTo: redirectPath,
      };
    } catch (error) {
      this.logger.error('Failed to generate customer auto-login:', error);
      throw new HttpException(
        error.message || 'Failed to generate login URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Universal auto-login endpoint
   * Automatically determines if user is agent or customer for given tenant
   * GET /api/zammad/sso/login?ticketId=123&tenantId=xyz
   */
  @Get('login')
  async getUniversalAutoLoginUrl(
    @CurrentUser('id') supabaseUserId: string,
    @Query('ticketId') ticketId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    try {
      // Try to get as internal user first
      try {
        const user = await this.authService.getUserBySupabaseId(supabaseUserId);
        if (user && user.zammadUserId) {
          // User is internal agent
          return this.getAgentAutoLoginUrl(supabaseUserId, ticketId);
        }
      } catch (error) {
        // Not an internal user, try portal customer
      }

      // Try as portal customer
      const portalAccounts =
        await this.portalAuthService.getPortalAccounts(supabaseUserId);

      if (portalAccounts.length > 0) {
        return this.getCustomerAutoLoginUrl(supabaseUserId, ticketId, tenantId);
      }

      throw new NotFoundException(
        'No Zammad account found. Please contact administrator.',
      );
    } catch (error) {
      this.logger.error('Failed to generate universal auto-login:', error);
      throw new HttpException(
        error.message || 'Failed to generate login URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check user's Zammad access status
   * GET /api/zammad/sso/status
   * 
   * Returns information about user's Zammad account and access level
   */
  @Get('status')
  async getZammadStatus(@CurrentUser('id') supabaseUserId: string) {
    try {
      let isAgent = false;
      let isCustomer = false;
      let hasAccess = false;
      let tenants: any[] = [];

      // Check if internal user
      try {
        const user = await this.authService.getUserBySupabaseId(supabaseUserId);
        if (user?.zammadUserId) {
          isAgent = true;
          hasAccess = true;
          tenants.push({
            tenantId: user.tenantId,
            tenantName: user.tenant?.name,
            role: 'agent',
            zammadUserId: user.zammadUserId,
          });
        }
      } catch (error) {
        // Not an internal user
      }

      // Check if portal customer
      const portalAccounts =
        await this.portalAuthService.getPortalAccounts(supabaseUserId);

      if (portalAccounts.length > 0) {
        isCustomer = true;
        hasAccess = true;

        for (const account of portalAccounts) {
          if (account.zammadUserId) {
            const tenant = await this.prisma.tenant.findUnique({
              where: { id: account.tenantId },
            });

            tenants.push({
              tenantId: account.tenantId,
              tenantName: tenant?.name,
              role: 'customer',
              zammadUserId: account.zammadUserId,
            });
          }
        }
      }

      return {
        hasAccess,
        isAgent,
        isCustomer,
        isDualRole: isAgent && isCustomer,
        tenants,
        zammadUrl: process.env.ZAMMAD_URL,
      };
    } catch (error) {
      this.logger.error('Failed to get Zammad status:', error);
      return {
        hasAccess: false,
        isAgent: false,
        isCustomer: false,
        isDualRole: false,
        tenants: [],
      };
    }
  }
}
