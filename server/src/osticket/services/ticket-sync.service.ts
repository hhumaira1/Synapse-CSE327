import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OsTicketApiService } from './osticket-api.service';
import {
  PRIORITY_MAP,
  STATUS_MAP,
  OSTICKET_TO_INTERNAL_STATUS,
  OSTICKET_TO_INTERNAL_PRIORITY,
  OsTicketSyncResult,
  CreateOsTicketRequest,
} from '../interfaces/osticket-types';
import {
  TicketStatus,
  TicketPriority,
  TicketSource,
} from 'prisma/generated/client';

/**
 * Ticket Sync Service
 * Handles bidirectional synchronization between internal tickets and osTicket
 */
@Injectable()
export class TicketSyncService {
  private readonly logger = new Logger(TicketSyncService.name);

  constructor(
    private prisma: PrismaService,
    private osTicketApi: OsTicketApiService,
  ) {}

  /**
   * Sync internal ticket TO osTicket (create or update)
   */
  async syncToOsTicket(
    tenantId: string,
    ticketId: string,
    force = false,
  ): Promise<OsTicketSyncResult> {
    try {
      // Get internal ticket
      const ticket = await this.prisma.ticket.findFirst({
        where: { id: ticketId, tenantId },
        include: {
          contact: true,
          portalCustomer: true,
          assignedUser: true,
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }

      // Check if integration is active
      const integration = await this.prisma.integration.findFirst({
        where: {
          tenantId,
          serviceName: 'osticket',
          isActive: true,
        },
      });

      if (!integration) {
        return {
          success: false,
          error: 'osTicket integration not active',
          syncedAt: new Date(),
        };
      }

      // Initialize osTicket API
      const config = integration.config as {
        baseUrl: string;
        apiKey: string;
      };
      this.osTicketApi.initialize({
        ...config,
        isActive: true,
      });

      // If already synced and not forced, update instead of create
      if (ticket.externalId && ticket.externalSystem === 'osticket' && !force) {
        await this.updateOsTicketTicket(ticket, config);
        return {
          success: true,
          ticketId: ticket.id,
          externalId: ticket.externalId,
          syncedAt: new Date(),
        };
      }

      // Create new osTicket ticket
      const osTicketRequest: CreateOsTicketRequest = {
        name: ticket.contact?.firstName
          ? `${ticket.contact.firstName} ${ticket.contact.lastName}`
          : ticket.portalCustomer?.name || 'Unknown',
        email:
          ticket.contact?.email ||
          ticket.portalCustomer?.email ||
         'no-reply@example.com',
        phone: ticket.contact?.phone || undefined,
        subject: ticket.title,
        message: ticket.description || ticket.title,
        priority: PRIORITY_MAP[ticket.priority] || 2,
        source: 'API',
        autorespond: false,
      };

      const osTicketResponse =
        await this.osTicketApi.createTicket(osTicketRequest);

      // Update internal ticket with osTicket ID
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          externalId: osTicketResponse.number,
          externalSystem: 'osticket',
          source: TicketSource.API,
        },
      });

      this.logger.log(
        `Synced ticket ${ticket.id} to osTicket: ${osTicketResponse.number}`,
      );

      return {
        success: true,
        ticketId: ticket.id,
        externalId: osTicketResponse.number,
        syncedAt: new Date(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to sync ticket ${ticketId}:`, errorMsg);
      return {
        success: false,
        ticketId,
        error: errorMsg,
        syncedAt: new Date(),
      };
    }
  }

  /**
   * Update existing osTicket ticket
   */
  private async updateOsTicketTicket(ticket: any, config: any): Promise<void> {
    this.osTicketApi.initialize({ ...config, isActive: true });

    await this.osTicketApi.updateTicket(ticket.externalId, {
      status: STATUS_MAP[ticket.status as keyof typeof STATUS_MAP],
      priority: PRIORITY_MAP[ticket.priority as keyof typeof PRIORITY_MAP],
    });

    this.logger.log(`Updated osTicket ticket ${ticket.externalId}`);
  }

  /**
   * Sync FROM osTicket to internal ticket
   */
  async syncFromOsTicket(
    tenantId: string,
    osTicketNumber: string,
  ): Promise<OsTicketSyncResult> {
    try {
      // Check integration
      const integration = await this.prisma.integration.findFirst({
        where: { tenantId, serviceName: 'osticket', isActive: true },
      });

      if (!integration) {
        return {
          success: false,
          error: 'osTicket integration not active',
          syncedAt: new Date(),
        };
      }

      // Initialize API
      const config = integration.config as { baseUrl: string; apiKey: string };
      this.osTicketApi.initialize({ ...config, isActive: true });

      // Fetch from osTicket
      const osTicket = await this.osTicketApi.getTicket(osTicketNumber);

      // Find or create internal ticket
      let internalTicket = await this.prisma.ticket.findFirst({
        where: {
          tenantId,
          externalId: osTicketNumber,
          externalSystem: 'osticket',
        },
      });

      if (internalTicket) {
        // Update existing ticket
        internalTicket = await this.prisma.ticket.update({
          where: { id: internalTicket.id },
          data: {
            title: osTicket.subject,
            description: osTicket.message,
            status: OSTICKET_TO_INTERNAL_STATUS[osTicket.status.id] as TicketStatus,
            priority: OSTICKET_TO_INTERNAL_PRIORITY[osTicket.priority.id] as TicketPriority,
          },
        });
      } else {
        // Create new internal ticket
        // Find or create contact first
        const contact = await this.findOrCreateContact(
          tenantId,
          osTicket.user.email,
          osTicket.user.name,
        );

        internalTicket = await this.prisma.ticket.create({
          data: {
            tenantId,
            contactId: contact.id,
            title: osTicket.subject,
            description: osTicket.message,
            status: OSTICKET_TO_INTERNAL_STATUS[osTicket.status.id] as TicketStatus,
            priority: OSTICKET_TO_INTERNAL_PRIORITY[osTicket.priority.id] as TicketPriority,
            source: TicketSource.API,
            externalId: osTicketNumber,
            externalSystem: 'osticket',
            submittedByPortalCustomer: false,
          },
        });
      }

      this.logger.log(
        `Synced osTicket ${osTicketNumber} to internal ticket ${internalTicket.id}`,
      );

      return {
        success: true,
        ticketId: internalTicket.id,
        externalId: osTicketNumber,
        syncedAt: new Date(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to sync from osTicket ${osTicketNumber}:`,
        errorMsg,
      );
      return {
        success: false,
        externalId: osTicketNumber,
        error: errorMsg,
        syncedAt: new Date(),
      };
    }
  }

  /**
   * Sync comments between internal ticket and osTicket
   */
  async syncComments(tenantId: string, ticketId: string): Promise<void> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket || !ticket.externalId) {
      return;
    }

    // Get integration
    const integration = await this.prisma.integration.findFirst({
      where: { tenantId, serviceName: 'osticket', isActive: true },
    });

    if (!integration) {
      return;
    }

    const config = integration.config as { baseUrl: string; apiKey: string };
    this.osTicketApi.initialize({ ...config, isActive: true });

    // Sync each comment to osTicket
    for (const comment of ticket.comments) {
      if (comment.isInternal && comment.content) {
        await this.osTicketApi.addReply(ticket.externalId, {
          message: `${comment.authorName || 'Support'}: ${comment.content}`,
          alert: false,
          autorespond: false,
        });
      }
    }

    this.logger.log(
      `Synced ${ticket.comments.length} comments for ticket ${ticketId}`,
    );
  }

  /**
   * Find or create contact from osTicket user data
   */
  private async findOrCreateContact(
    tenantId: string,
    email: string,
    name: string,
  ) {
    let contact = await this.prisma.contact.findFirst({
      where: { tenantId, email },
    });

    if (!contact) {
      const [firstName, ...lastNameParts] = name.split(' ');
      contact = await this.prisma.contact.create({
        data: {
          tenantId,
          email,
          firstName: firstName || 'Unknown',
          lastName: lastNameParts.join(' ') || '',
        },
      });
    }

    return contact;
  }

  /**
   * Sync all existing tickets to osTicket (one-time setup)
   */
  async syncAllTickets(tenantId: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        tenantId,
        externalSystem: null, // Only sync tickets not yet synced
      },
    });

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const ticket of tickets) {
      const result = await this.syncToOsTicket(tenantId, ticket.id);
      if (result.success) {
        results.synced++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${ticket.id}: ${result.error}`);
        }
      }
    }

    this.logger.log(
      `Bulk sync completed: ${results.synced} synced, ${results.failed} failed`,
    );

    return results;
  }
}
