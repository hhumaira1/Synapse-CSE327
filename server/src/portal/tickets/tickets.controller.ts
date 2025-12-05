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
import { SupabaseAuthGuard } from '../../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../../supabase-auth/decorators/current-user.decorator';
import { PortalAuthService } from '../auth/services/portal-auth/portal-auth.service';

@Controller('portal/tickets')
@UseGuards(SupabaseAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly portalAuthService: PortalAuthService,
  ) {}

  @Post()
  async createTicket(
    @Body() body: { title: string; description: string; tenantId?: string },
    @CurrentUser('id') supabaseUserId: string,
  ) {
    if (!body.title || !body.description) {
      throw new BadRequestException('Title and description are required');
    }

    // Get portal customer account for this tenant
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(supabaseUserId);

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
    @CurrentUser('id') supabaseUserId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    // Get portal customer account(s)
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(supabaseUserId);

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
    @CurrentUser('id') supabaseUserId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    // Get portal customer account(s)
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(supabaseUserId);

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
    @CurrentUser('id') supabaseUserId: string,
  ) {
    if (!body.content) {
      throw new BadRequestException('Comment content is required');
    }

    // Get portal customer account(s)
    const portalAccounts =
      await this.portalAuthService.getPortalAccounts(supabaseUserId);

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

    // Get user name from portal customer data
    const authorName = portalCustomer.name || portalCustomer.email;

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
