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
import { JiraApiService } from '../../jira/services/jira-api.service';
import {
  CreateJiraIssueRequest,
  PRIORITY_MAP,
  STATUS_MAP,
  JIRA_TO_INTERNAL_STATUS,
  JIRA_TO_INTERNAL_PRIORITY,
} from '../../jira/interfaces/jira-types';

/**
 * Tickets Service - Jira as PRIMARY system
 * Internal DB acts as CACHE for performance and analytics
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private jiraApi: JiraApiService,
  ) {}

  /**
   * Initialize Jira API with tenant's configuration
   * Falls back to global environment config if no tenant-specific config exists
   */
  private async initializeJira(tenantId: string): Promise<boolean> {
    // Check if already initialized from environment variables
    if (this.jiraApi.isConfigured()) {
      this.logger.log('Using global Jira configuration from environment');
      return true;
    }

    // Try to load tenant-specific configuration
    const integration = await this.prisma.integration.findFirst({
      where: {
        tenantId,
        serviceName: 'jira',
        isActive: true,
      },
    });

    if (!integration) {
      throw new HttpException(
        'Jira not configured. Add JIRA_ENABLED=true and Jira credentials to server/.env',
        HttpStatus.BAD_REQUEST,
      );
    }

    const config = integration.config as {
      baseUrl: string;
      email: string;
      apiToken: string;
      projectKey: string;
    };

    this.jiraApi.initialize({
      ...config,
      isActive: true,
    });

    return true;
  }

  /**
   * Create ticket - PRIMARY operation in Jira, then cache locally
   */
  async create(tenantId: string, createTicketDto: CreateTicketDto) {
    // Initialize Jira API
    await this.initializeJira(tenantId);

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

    // Build description with contact info
    const descriptionText = `${createTicketDto.description || createTicketDto.title}

Submitted by: ${contact.firstName} ${contact.lastName}
Email: ${contact.email || 'N/A'}
Phone: ${contact.phone || 'N/A'}`;

    // Create issue in Jira FIRST (primary system)
    const jiraRequest: CreateJiraIssueRequest = {
      fields: {
        project: {
          key: this.jiraApi.getProjectKey() || 'KAN',
        },
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
        issuetype: {
          name: 'Task',
        },
        priority: {
          name: PRIORITY_MAP[createTicketDto.priority || 'MEDIUM'] || 'Medium',
        },
      },
    };

    let jiraResponse;
    try {
      jiraResponse = await this.jiraApi.createIssue(jiraRequest);
    } catch (error) {
      this.logger.error('Failed to create issue in Jira:', error);
      throw new HttpException(
        'Failed to create issue in Jira. Please check your integration settings.',
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
        externalId: jiraResponse.key, // Jira issue key (e.g., "KAN-123")
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
      `Created issue in Jira: ${jiraResponse.key}, cached as ${cachedTicket.id}`,
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
        await this.initializeJira(tenantId);
        const jiraIssue = await this.jiraApi.getIssue(ticket.externalId);

        // Update cache with latest data
        await this.prisma.ticket.update({
          where: { id },
          data: {
            status: JIRA_TO_INTERNAL_STATUS[
              jiraIssue.fields.status.name
            ] as TicketStatus,
            priority: JIRA_TO_INTERNAL_PRIORITY[
              jiraIssue.fields.priority?.name || 'Medium'
            ] as TicketPriority,
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

    // Initialize Jira API
    await this.initializeJira(tenantId);

    // Update in Jira FIRST (primary system)
    try {
      // Handle status change via transition
      if (updateTicketDto.status) {
        const statusName =
          STATUS_MAP[updateTicketDto.status as keyof typeof STATUS_MAP];
        await this.jiraApi.transitionIssue(ticket.externalId, statusName);
      }

      // Handle priority/other field updates
      const updateFields: any = {};
      if (updateTicketDto.priority) {
        updateFields.priority = {
          name: PRIORITY_MAP[
            updateTicketDto.priority as keyof typeof PRIORITY_MAP
          ],
        };
      }

      if (Object.keys(updateFields).length > 0) {
        await this.jiraApi.updateIssue(ticket.externalId, updateFields);
      }
    } catch (error) {
      this.logger.error('Failed to update issue in Jira:', error);
      throw new HttpException(
        'Failed to update issue in Jira',
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

    this.logger.log(`Updated issue in Jira: ${ticket.externalId}`);

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
      // Initialize Jira API
      await this.initializeJira(tenantId);

      // Close issue in Jira (transition to Closed status)
      try {
        await this.jiraApi.transitionIssue(ticket.externalId, 'Closed');
        this.logger.log(`Closed issue in Jira: ${ticket.externalId}`);
      } catch (error) {
        this.logger.warn('Failed to close issue in Jira:', error);
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

    // Initialize Jira API
    await this.initializeJira(tenantId);

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

    this.logger.log(`Added comment to Jira issue: ${ticket.externalId}`);

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

    // Initialize Jira API
    await this.initializeJira(tenantId);

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

  /**
   * Sync all tickets from Jira to refresh cache
   */
  async syncFromJira(tenantId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    await this.initializeJira(tenantId);

    try {
      const jiraIssues = await this.jiraApi.listIssues(100);
      const results = { synced: 0, errors: [] as string[] };

      for (const jiraIssue of jiraIssues) {
        try {
          // Check if already cached
          let cachedTicket = await this.prisma.ticket.findFirst({
            where: {
              tenantId,
              externalId: jiraIssue.key,
              externalSystem: 'jira',
            },
          });

          if (cachedTicket) {
            // Update existing cache
            await this.prisma.ticket.update({
              where: { id: cachedTicket.id },
              data: {
                title: jiraIssue.fields.summary,
                description:
                  jiraIssue.fields.description?.content?.[0]?.content?.[0]
                    ?.text || '',
                status: JIRA_TO_INTERNAL_STATUS[
                  jiraIssue.fields.status.name
                ] as TicketStatus,
                priority: JIRA_TO_INTERNAL_PRIORITY[
                  jiraIssue.fields.priority?.name || 'Medium'
                ] as TicketPriority,
              },
            });
          }
          // Note: We don't create new tickets from Jira automatically
          // Only tickets created via our API are cached

          results.synced++;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Issue ${jiraIssue.key}: ${errorMsg}`);
        }
      }

      this.logger.log(`Synced ${results.synced} issues from Jira`);
      return results;
    } catch (error) {
      this.logger.error('Failed to sync from Jira:', error);
      throw new HttpException(
        'Failed to sync issues from Jira',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
