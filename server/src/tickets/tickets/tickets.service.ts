import {
  Injectable,
  NotFoundException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { AddCommentDto } from '../dto/add-comment.dto';
import {
  TicketStatus,
  TicketPriority,
  TicketSource,
} from 'prisma/generated/client';

// ==================== ZAMMAD INTEGRATION ====================
import { ZammadService } from '../../zammad/services/zammad.service';
import { ZammadApiService } from '../../zammad/services/zammad-api.service';

// ==================== JIRA INTEGRATION (COMMENTED OUT) ====================
// import { JiraApiService } from '../../jira/services/jira-api.service';
// import {
//   CreateJiraIssueRequest,
//   PRIORITY_MAP,
//   STATUS_MAP,
//   JIRA_TO_INTERNAL_STATUS,
//   JIRA_TO_INTERNAL_PRIORITY,
// } from '../../jira/interfaces/jira-types';

/**
 * Tickets Service - Zammad as PRIMARY system
 * Internal DB acts as CACHE for performance and analytics
 * 
 * MIGRATION NOTE: Jira code commented out, replaced with Zammad
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private zammadApi: ZammadApiService,
    private zammadService: ZammadService,
    // private jiraApi: JiraApiService, // COMMENTED OUT
  ) { }

  /**
   * Create ticket - PRIMARY operation in Zammad, then cache locally
   */
  async create(tenantId: string, createTicketDto: CreateTicketDto) {
    // Get contact details
    const contact = await this.prisma.contact.findFirst({
      where: { id: createTicketDto.contactId, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Find portal customer if exists
    let portalCustomerId = createTicketDto.portalCustomerId;
    if (!portalCustomerId && createTicketDto.contactId) {
      const portalCustomer = await this.prisma.portalCustomer.findFirst({
        where: {
          contactId: createTicketDto.contactId,
          tenantId,
        },
      });
      if (portalCustomer) {
        portalCustomerId = portalCustomer.id;
      }
    }

    // Create ticket in Zammad FIRST (primary system)
    let zammadTicket;
    try {
      zammadTicket = await this.zammadService.createTicketInZammad(
        tenantId,
        createTicketDto,
        contact.email || 'no-email@example.com',
        contact.firstName || 'Unknown',
        contact.lastName || 'Customer',
      );
    } catch (error) {
      this.logger.error('Failed to create ticket in Zammad:', error);
      throw new HttpException(
        'Failed to create ticket in Zammad. Please check your integration settings.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cache ticket in internal DB (read replica)
    const cachedTicket = await this.prisma.ticket.create({
      data: {
        tenantId,
        contactId: createTicketDto.contactId,
        portalCustomerId,
        dealId: createTicketDto.dealId,
        assignedUserId: createTicketDto.assignedUserId,
        title: createTicketDto.title,
        description: createTicketDto.description,
        status: TicketStatus.OPEN,
        priority: createTicketDto.priority || TicketPriority.MEDIUM,
        source: createTicketDto.source || TicketSource.API,
        externalId: zammadTicket.id.toString(), // Zammad ticket ID
        externalSystem: 'zammad',
        submittedByPortalCustomer:
          createTicketDto.submittedByPortalCustomer || false,
      },
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
      },
    });

    this.logger.log(
      `Created ticket in Zammad: #${zammadTicket.number}, cached as ${cachedTicket.id}`,
    );

    return cachedTicket;

    // ==================== JIRA CODE (COMMENTED OUT) ====================
    // await this.initializeJira(tenantId);
    // const descriptionText = `${createTicketDto.description || createTicketDto.title}
    //
    // Submitted by: ${contact.firstName} ${contact.lastName}
    // Email: ${contact.email || 'N/A'}
    // Phone: ${contact.phone || 'N/A'}`;
    //
    // const jiraRequest: CreateJiraIssueRequest = {
    //   fields: {
    //     project: { key: this.jiraApi.getProjectKey() || 'KAN' },
    //     summary: createTicketDto.title,
    //     description: { ... },
    //     issuetype: { name: 'Task' },
    //     priority: { name: PRIORITY_MAP[createTicketDto.priority || 'MEDIUM'] },
    //   },
    // };
    // const jiraResponse = await this.jiraApi.createIssue(jiraRequest);
    // externalId: jiraResponse.key,
    // externalSystem: 'jira',
  }

  /**
   * Find all tickets - Read from CACHE (fast)
   * Cache is kept in sync via webhook or periodic sync
   */
  async findAll(
    tenantId: string,
    filters?: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assignedUserId?: string;
      contactId?: string;
      portalCustomerId?: string;
    },
  ) {
    // Read from cache (internal DB)
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        externalSystem: 'zammad', // Only return Zammad tickets
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.assignedUserId && {
          assignedUserId: filters.assignedUserId,
        }),
        ...(filters?.contactId && { contactId: filters.contactId }),
        ...(filters?.portalCustomerId && {
          portalCustomerId: filters.portalCustomerId,
        }),
      },
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Find one ticket - Read from CACHE, optionally refresh from Zammad
   */
  async findOne(tenantId: string, id: string, refresh = false) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId, externalSystem: 'zammad' },
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
        comments: {
          include: {
            user: true,
            portalCustomer: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Optionally refresh from Zammad
    if (refresh && ticket.externalId) {
      try {
        const zammadTicket = await this.zammadApi.getTicket(
          parseInt(ticket.externalId),
        );

        // Update cache with latest data
        await this.prisma.ticket.update({
          where: { id },
          data: {
            status: this.zammadService.mapStatusFromZammad(
              zammadTicket.state,
            ) as TicketStatus,
            priority: this.zammadService.mapPriorityFromZammad(
              zammadTicket.priority,
            ) as TicketPriority,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to refresh ticket from Zammad:`, error);
      }
    }

    return ticket;
  }

  /**
   * Update ticket - PRIMARY operation in Zammad, then update cache
   */
  async update(tenantId: string, id: string, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId, externalSystem: 'zammad' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    if (!ticket.externalId) {
      throw new HttpException(
        'Ticket not linked to Zammad',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update in Zammad FIRST (primary system)
    try {
      const updateFields: any = {};

      if (updateTicketDto.status) {
        updateFields.state = this.zammadService.mapStatusToZammad(
          updateTicketDto.status,
        );
      }

      if (updateTicketDto.priority) {
        updateFields.priority = this.zammadService.mapPriorityToZammad(
          updateTicketDto.priority,
        );
      }

      if (Object.keys(updateFields).length > 0) {
        await this.zammadApi.updateTicket(
          parseInt(ticket.externalId),
          updateFields,
        );
      }
    } catch (error) {
      this.logger.error('Failed to update ticket in Zammad:', error);
      throw new HttpException(
        'Failed to update ticket in Zammad',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update cache (internal DB)
    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
      },
    });

    this.logger.log(`Updated ticket in Zammad: #${ticket.externalId}`);

    return updatedTicket;
  }

  /**
   * Delete ticket - Close in Zammad, remove from cache
   */
  async remove(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId, externalSystem: 'zammad' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    if (ticket.externalId) {
      // Close ticket in Zammad
      try {
        await this.zammadApi.updateTicket(parseInt(ticket.externalId), {
          state: 'closed',
        });
        this.logger.log(`Closed ticket in Zammad: #${ticket.externalId}`);
      } catch (error) {
        this.logger.warn('Failed to close ticket in Zammad:', error);
        // Continue to delete cache anyway
      }
    }

    // Remove from cache
    return this.prisma.ticket.delete({
      where: { id },
    });
  }

  /**
   * Add comment - PRIMARY operation in Zammad, then cache locally
   */
  async addComment(
    tenantId: string,
    ticketId: string,
    userId: string,
    addCommentDto: AddCommentDto,
    authorName?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, externalSystem: 'zammad' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (!ticket.externalId) {
      throw new HttpException(
        'Ticket not linked to Zammad',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Add article to Zammad FIRST (primary system)
    const commentText = authorName
      ? `${authorName}: ${addCommentDto.content}`
      : addCommentDto.content;

    try {
      await this.zammadApi.addArticle(
        parseInt(ticket.externalId),
        commentText,
        true, // internal note
      );
    } catch (error) {
      this.logger.error('Failed to add comment to Zammad:', error);
      throw new HttpException(
        'Failed to add comment to Zammad',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cache comment locally
    const comment = await this.prisma.ticketComment.create({
      data: {
        content: addCommentDto.content,
        ticketId,
        userId,
        authorName,
        isInternal: true,
      },
      include: {
        user: true,
        portalCustomer: true,
      },
    });

    this.logger.log(`Added comment to Zammad ticket: #${ticket.externalId}`);

    return comment;
  }

  /**
   * Add portal comment - PRIMARY operation in Zammad, then cache
   */
  async addPortalComment(
    tenantId: string,
    ticketId: string,
    portalCustomerId: string,
    addCommentDto: AddCommentDto,
    authorName?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, externalSystem: 'zammad' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (!ticket.externalId) {
      throw new HttpException(
        'Ticket not linked to Zammad',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Add article to Zammad FIRST
    const commentText = authorName
      ? `${authorName}: ${addCommentDto.content}`
      : addCommentDto.content;

    try {
      await this.zammadApi.addArticle(
        parseInt(ticket.externalId),
        commentText,
        false, // customer-facing
      );
    } catch (error) {
      this.logger.error('Failed to add portal comment to Zammad:', error);
      throw new HttpException(
        'Failed to add comment to Zammad',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cache comment locally
    const comment = await this.prisma.ticketComment.create({
      data: {
        content: addCommentDto.content,
        ticketId,
        portalCustomerId,
        authorName,
        isInternal: false,
      },
      include: {
        user: true,
        portalCustomer: true,
      },
    });

    return comment;
  }

  /**
   * Find portal customer's tickets - Read from CACHE
   */
  async findMyTickets(tenantId: string, portalCustomerId: string) {
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        portalCustomerId,
        externalSystem: 'zammad', // Only Zammad tickets
      },
      include: {
        contact: true,
        assignedUser: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
