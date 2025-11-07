import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { TicketsService } from '../../tickets/tickets/tickets.service';
import { ClerkAuthGuard } from '../../clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';
import { PortalAuthService } from '../auth/services/portal-auth/portal-auth.service';
import { ClerkService } from '../../clerk/clerk/clerk.service';

@Controller('portal/tickets')
@UseGuards(ClerkAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly portalAuthService: PortalAuthService,
    private readonly clerkService: ClerkService,
  ) {}

  @Post()
  async createTicket(
    @Body() body: { title: string; description: string; tenantId?: string },
    @CurrentUser('sub') clerkId: string,
  ) {
    if (!body.title || !body.description) {
      throw new BadRequestException('Title and description are required');
    }

    // Get portal customer account for this tenant
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(clerkId);

    // Use provided tenantId or first account's tenant
    const tenantId = body.tenantId || portalAccounts[0]?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('No portal account found');
    }

    const portalCustomer = portalAccounts.find(
      (acc) => acc.tenantId === tenantId,
    );
    if (!portalCustomer) {
      throw new UnauthorizedException('Access denied to this tenant');
    }

    if (!portalCustomer.contactId) {
      throw new BadRequestException(
        'Portal customer must be linked to a contact',
      );
    }

    // Create ticket for portal customer
    return this.ticketsService.create(tenantId, {
      title: body.title,
      description: body.description,
      priority: 'MEDIUM', // Default priority for customer-submitted tickets
      source: 'PORTAL',
      contactId: portalCustomer.contactId,
      portalCustomerId: portalCustomer.id,
    });
  }

  @Get()
  async getMyTickets(
    @CurrentUser('sub') clerkId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    // Get portal customer account(s)
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(clerkId);

    // Use provided tenantId or first account's tenant
    const selectedTenantId = tenantId || portalAccounts[0]?.tenantId;
    if (!selectedTenantId) {
      throw new BadRequestException('No portal account found');
    }

    const portalCustomer = portalAccounts.find(
      (acc) => acc.tenantId === selectedTenantId,
    );
    if (!portalCustomer) {
      throw new UnauthorizedException('Access denied to this tenant');
    }

    // Get all tickets for this portal customer
    return this.ticketsService.findAll(selectedTenantId, {
      portalCustomerId: portalCustomer.id,
    });
  }

  @Get(':id')
  async getTicketDetail(
    @Param('id') ticketId: string,
    @CurrentUser('sub') clerkId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    // Get portal customer account(s)
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(clerkId);

    // Use provided tenantId or first account's tenant
    const selectedTenantId = tenantId || portalAccounts[0]?.tenantId;
    if (!selectedTenantId) {
      throw new BadRequestException('No portal account found');
    }

    const portalCustomer = portalAccounts.find(
      (acc) => acc.tenantId === selectedTenantId,
    );
    if (!portalCustomer) {
      throw new UnauthorizedException('Access denied to this tenant');
    }

    // Get specific ticket
    const ticket = await this.ticketsService.findOne(
      selectedTenantId,
      ticketId,
    );

    // Verify ticket belongs to this portal customer
    if (ticket.portalCustomerId !== portalCustomer.id) {
      throw new UnauthorizedException('Access denied to this ticket');
    }

    return ticket;
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') ticketId: string,
    @Body() body: { content: string; tenantId?: string },
    @CurrentUser('sub') clerkId: string,
  ) {
    if (!body.content) {
      throw new BadRequestException('Comment content is required');
    }

    // Get portal customer account(s)
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(clerkId);

    // Use provided tenantId or first account's tenant
    const selectedTenantId = body.tenantId || portalAccounts[0]?.tenantId;
    if (!selectedTenantId) {
      throw new BadRequestException('No portal account found');
    }

    const portalCustomer = portalAccounts.find(
      (acc) => acc.tenantId === selectedTenantId,
    );
    if (!portalCustomer) {
      throw new UnauthorizedException('Access denied to this tenant');
    }

    // Verify ticket belongs to this customer
    const ticket = await this.ticketsService.findOne(
      selectedTenantId,
      ticketId,
    );

    if (ticket.portalCustomerId !== portalCustomer.id) {
      throw new UnauthorizedException('Access denied to this ticket');
    }

    // Get user name from Clerk
    let authorName = portalCustomer.name || portalCustomer.email;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const clerkUser: any =
        await this.clerkService.client.users.getUser(clerkId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const firstName = (clerkUser?.firstName as string) || '';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const lastName = (clerkUser?.lastName as string) || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) {
        authorName = fullName;
      }
    } catch {
      // If Clerk fetch fails, use portal customer name/email
    }

    // Use the new portal comment method
    return this.ticketsService.addPortalComment(
      selectedTenantId,
      ticketId,
      portalCustomer.id,
      { content: body.content },
      authorName,
    );
  }
}
