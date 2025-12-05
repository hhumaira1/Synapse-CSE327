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

// ==================== JIRA INTEGRATION ====================
import { JiraApiService } from '../../jira/services/jira-api.service';
import {
  CreateJiraIssueRequest,
  PRIORITY_MAP,
  STATUS_MAP,
  JIRA_TO_INTERNAL_STATUS,
  JIRA_TO_INTERNAL_PRIORITY,
} from '../../jira/interfaces/jira-types';

// ==================== ZAMMAD INTEGRATION (COMMENTED OUT) ====================
// import { ZammadService } from '../../zammad/services/zammad.service';
// import { ZammadApiService } from '../../zammad/services/zammad-api.service';

/**
 * Tickets Service - Jira as PRIMARY system
 * Internal DB acts as CACHE for performance and analytics
 * 
 * MIGRATION NOTE: Switched from Zammad to Jira
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private jiraApi: JiraApiService,
    // private zammadApi: ZammadApiService, // COMMENTED OUT
    // private zammadService: ZammadService, // COMMENTED OUT
  ) { }

  /**
   * Create ticket - PRIMARY operation in Jira, then cache locally
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

    // Get assigned user's Jira account ID if assigned
    let jiraAssigneeId: string | null = null;
    if (createTicketDto.assignedUserId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: createTicketDto.assignedUserId },
      });

      if (assignedUser && assignedUser.email) {
        const jiraUser = await this.jiraApi.findUserByEmail(assignedUser.email);
        if (jiraUser) {
          jiraAssigneeId = jiraUser.accountId;
          this.logger.log(`Found Jira user for ${assignedUser.email}: ${jiraUser.displayName}`);
        } else {
          this.logger.warn(`No Jira user found for email: ${assignedUser.email}`);
        }
      }
    }

    // Create ticket in Jira FIRST (primary system)
    let jiraIssue;
    try {
      const descriptionText = `${createTicketDto.description || createTicketDto.title}

Submitted by: ${contact.firstName} ${contact.lastName}
Email: ${contact.email || 'N/A'}
Phone: ${contact.phone || 'N/A'}`;

      const jiraRequest: CreateJiraIssueRequest = {
        fields: {
          project: { key: this.jiraApi.getProjectKey() || 'KAN' },
          summary: createTicketDto.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: descriptionText,
                  },
                ],
              },
            ],
          },
          issuetype: { name: 'Task' },
          priority: { name: PRIORITY_MAP[createTicketDto.priority || 'MEDIUM'] },
          labels: [`tenant-${tenantId}`], // ← ADD TENANT LABEL for filtering
        },
      };

      // Add assignee if available
      if (jiraAssigneeId) {
        jiraRequest.fields.assignee = { accountId: jiraAssigneeId };
      }

      jiraIssue = await this.jiraApi.createIssue(jiraRequest);
    } catch (error) {
      this.logger.error('Failed to create ticket in Jira:', error);
      throw new HttpException(
        'Failed to create ticket in Jira. Please check your integration settings.',
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
        externalId: jiraIssue.key, // Jira issue key (e.g., "PROJ-123")
        externalSystem: 'jira',
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
      `Created ticket in Jira: ${jiraIssue.key}, cached as ${cachedTicket.id}`,
    );

    return cachedTicket;
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
        externalSystem: 'jira', // Only return Jira tickets
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
   * Find one ticket - Read from CACHE, optionally refresh from Jira
   */
  async findOne(tenantId: string, id: string, refresh = false) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId, externalSystem: 'jira' },
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

    // Optionally refresh from Jira
    if (refresh && ticket.externalId) {
      try {
        const jiraIssue = await this.jiraApi.getIssue(ticket.externalId);

        // Map Jira status to internal status
        const mappedStatus = JIRA_TO_INTERNAL_STATUS[jiraIssue.fields.status.name] || 'OPEN';

        // Map Jira priority to internal priority
        const mappedPriority = JIRA_TO_INTERNAL_PRIORITY[jiraIssue.fields.priority?.name || 'Medium'] || 'MEDIUM';

        // Update cache with latest data
        await this.prisma.ticket.update({
          where: { id },
          data: {
            status: mappedStatus as TicketStatus,
            priority: mappedPriority as TicketPriority,
            title: jiraIssue.fields.summary,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to refresh ticket from Jira:`, error);
      }
    }

    return ticket;
  }

  /**
   * Update ticket - PRIMARY operation in Jira, then update cache
   */
  async update(tenantId: string, id: string, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId, externalSystem: 'jira' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    if (!ticket.externalId) {
      throw new HttpException(
        'Ticket not linked to Jira',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update in Jira FIRST (primary system)
    try {
      // Handle status change via transition
      if (updateTicketDto.status) {
        const jiraStatus = STATUS_MAP[updateTicketDto.status];
        if (jiraStatus) {
          await this.jiraApi.transitionIssue(ticket.externalId, jiraStatus);
        }
      }

      // Build fields to update
      const updateFields: any = {};

      if (updateTicketDto.priority) {
        updateFields.priority = { name: PRIORITY_MAP[updateTicketDto.priority] };
      }

      if (updateTicketDto.title) {
        updateFields.summary = updateTicketDto.title;
      }

      if (updateTicketDto.description) {
        updateFields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updateTicketDto.description,
                },
              ],
            },
          ],
        };
      }

      // Handle assignee update
      if (updateTicketDto.assignedUserId !== undefined) {
        if (updateTicketDto.assignedUserId) {
          // Assign to a user
          const assignedUser = await this.prisma.user.findUnique({
            where: { id: updateTicketDto.assignedUserId },
          });

          if (assignedUser && assignedUser.email) {
            const jiraUser = await this.jiraApi.findUserByEmail(assignedUser.email);
            if (jiraUser) {
              await this.jiraApi.assignIssue(ticket.externalId, jiraUser.accountId);
            }
          }
        } else {
          // Unassign the ticket
          await this.jiraApi.assignIssue(ticket.externalId, null);
        }
      }

      // Update other fields if any
      if (Object.keys(updateFields).length > 0) {
        await this.jiraApi.updateIssue(ticket.externalId, updateFields);
      }
    } catch (error) {
      this.logger.error('Failed to update ticket in Jira:', error);
      throw new HttpException(
        'Failed to update ticket in Jira',
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

    this.logger.log(`Updated ticket in Jira: ${ticket.externalId}`);

    return updatedTicket;
  }

  /**
   * Delete ticket - Close in Jira, remove from cache
   */
  async remove(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId, externalSystem: 'jira' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    if (ticket.externalId) {
      // Close ticket in Jira (transition to Closed status)
      try {
        await this.jiraApi.transitionIssue(ticket.externalId, 'Closed');
        this.logger.log(`Closed ticket in Jira: ${ticket.externalId}`);
      } catch (error) {
        this.logger.warn('Failed to close ticket in Jira:', error);
        // Continue to delete cache anyway
      }
    }

    // Remove from cache
    return this.prisma.ticket.delete({
      where: { id },
    });
  }

  /**
   * Add comment - PRIMARY operation in Jira, then cache locally
   */
  async addComment(
    tenantId: string,
    ticketId: string,
    userId: string,
    addCommentDto: AddCommentDto,
    authorName?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, externalSystem: 'jira' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (!ticket.externalId) {
      throw new HttpException(
        'Ticket not linked to Jira',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Add comment to Jira FIRST (primary system)
    const commentText = authorName
      ? `${authorName}: ${addCommentDto.content}`
      : addCommentDto.content;

    try {
      await this.jiraApi.addComment(ticket.externalId, commentText);
    } catch (error) {
      this.logger.error('Failed to add comment to Jira:', error);
      throw new HttpException(
        'Failed to add comment to Jira',
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

    this.logger.log(`Added comment to Jira ticket: ${ticket.externalId}`);

    return comment;
  }

  /**
   * Add portal comment - PRIMARY operation in Jira, then cache
   */
  async addPortalComment(
    tenantId: string,
    ticketId: string,
    portalCustomerId: string,
    addCommentDto: AddCommentDto,
    authorName?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, externalSystem: 'jira' },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (!ticket.externalId) {
      throw new HttpException(
        'Ticket not linked to Jira',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Add comment to Jira FIRST
    const commentText = authorName
      ? `${authorName}: ${addCommentDto.content}`
      : addCommentDto.content;

    try {
      await this.jiraApi.addComment(ticket.externalId, commentText);
    } catch (error) {
      this.logger.error('Failed to add portal comment to Jira:', error);
      throw new HttpException(
        'Failed to add comment to Jira',
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
        externalSystem: 'jira', // Only Jira tickets
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
