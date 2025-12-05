import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from 'src/contacts/contacts/contacts.service';
import { DealsService } from 'src/deals/deals/deals.service';
import { LeadsService } from 'src/leads/leads/leads.service';
import { TicketsService } from 'src/tickets/tickets/tickets.service';
import { AnalyticsService } from 'src/analytics/analytics/analytics.service';
import { EntityResolverService } from './entity-resolver.service';

/**
 * Tool handler interface - all tools must implement this
 */
export interface ToolHandler {
  execute(args: any, context: ToolContext): Promise<any>;
}

export interface ToolContext {
  userId: string;
  tenantId: string;
}

/**
 * Centralized tool registry using Strategy Pattern
 * Fixes: DRY violation, Open/Closed principle
 */
@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools: Map<string, ToolHandler> = new Map();

  constructor(
    private contactsService: ContactsService,
    private dealsService: DealsService,
    private leadsService: LeadsService,
    private ticketsService: TicketsService,
    private analyticsService: AnalyticsService,
    private entityResolver: EntityResolverService,
  ) {
    this.registerTools();
  }

  /**
   * Register all tools - add new tools here instead of switch statement
   */
  private registerTools() {
    // Contacts tools
    this.register('contacts_list', {
      execute: async (args, ctx) => this.contactsService.findAll(ctx.tenantId),
    });

    this.register('contacts_create', {
      execute: async (args, ctx) => this.contactsService.create(ctx.tenantId, args),
    });

    this.register('contacts_update', {
      execute: async (args, ctx) =>
        this.contactsService.update(ctx.tenantId, args.contactId, args),
    });

    this.register('contacts_delete', {
      execute: async (args, ctx) => {
        await this.contactsService.remove(ctx.tenantId, args.contactId);
        return { success: true, message: `Contact ${args.contactId} deleted` };
      },
    });

    this.register('contacts_search', {
      execute: async (args, ctx) =>
        this.entityResolver.searchContacts(args.query, ctx.tenantId, 10),
    });

    this.register('contacts_get', {
      execute: async (args, ctx) =>
        this.contactsService.findOne(ctx.tenantId, args.contactId),
    });

    // Deals tools
    this.register('deals_list', {
      execute: async (args, ctx) => this.dealsService.findAll(ctx.tenantId, args),
    });

    this.register('deals_create', {
      execute: async (args, ctx) => this.dealsService.create(ctx.tenantId, args),
    });

    this.register('deals_update', {
      execute: async (args, ctx) =>
        this.dealsService.update(ctx.tenantId, args.dealId, args),
    });

    this.register('deals_delete', {
      execute: async (args, ctx) => {
        await this.dealsService.remove(ctx.tenantId, args.dealId);
        return { success: true, message: `Deal ${args.dealId} deleted` };
      },
    });

    this.register('deals_move_stage', {
      execute: async (args, ctx) =>
        this.dealsService.moveStage(ctx.tenantId, args.dealId, args.stageId),
    });

    this.register('deals_get', {
      execute: async (args, ctx) =>
        this.dealsService.findOne(ctx.tenantId, args.dealId),
    });

    // Leads tools
    this.register('leads_list', {
      execute: async (args, ctx) => this.leadsService.findAll(ctx.tenantId, args),
    });

    this.register('leads_create', {
      execute: async (args, ctx) => this.leadsService.create(ctx.tenantId, args),
    });

    this.register('leads_update', {
      execute: async (args, ctx) =>
        this.leadsService.update(ctx.tenantId, args.leadId, args),
    });

    this.register('leads_delete', {
      execute: async (args, ctx) => {
        await this.leadsService.remove(ctx.tenantId, args.leadId);
        return { success: true, message: `Lead ${args.leadId} deleted` };
      },
    });

    this.register('leads_convert', {
      execute: async (args, ctx) =>
        this.leadsService.convert(ctx.tenantId, ctx.userId, args.leadId, {
          pipelineId: args.pipelineId,
          stageId: args.stageId,
          probability: 50,
        }),
    });

    this.register('leads_get', {
      execute: async (args, ctx) =>
        this.leadsService.findOne(ctx.tenantId, args.leadId),
    });

    // Tickets tools
    this.register('tickets_list', {
      execute: async (args, ctx) => this.ticketsService.findAll(ctx.tenantId, args),
    });

    this.register('tickets_create', {
      execute: async (args, ctx) => this.ticketsService.create(ctx.tenantId, args),
    });

    this.register('tickets_update', {
      execute: async (args, ctx) =>
        this.ticketsService.update(ctx.tenantId, args.ticketId, args),
    });

    this.register('tickets_delete', {
      execute: async (args, ctx) => {
        await this.ticketsService.remove(ctx.tenantId, args.ticketId);
        return { success: true, message: `Ticket ${args.ticketId} deleted` };
      },
    });

    this.register('tickets_close', {
      execute: async (args, ctx) =>
        this.ticketsService.update(ctx.tenantId, args.ticketId, {
          status: 'CLOSED',
          resolution: args.resolution,
        } as any),
    });

    this.register('tickets_get', {
      execute: async (args, ctx) =>
        this.ticketsService.findOne(ctx.tenantId, args.ticketId),
    });

    // Analytics tools
    this.register('analytics_dashboard', {
      execute: async (args, ctx) => this.analyticsService.getDashboard(ctx.tenantId),
    });

    this.logger.log(`Registered ${this.tools.size} tools`);
  }

  /**
   * Register a new tool - allows extending without modifying existing code
   */
  register(name: string, handler: ToolHandler) {
    this.tools.set(name, handler);
  }

  /**
   * Execute a tool by name
   */
  async execute(toolName: string, args: any, context: ToolContext): Promise<any> {
    const handler = this.tools.get(toolName);

    if (!handler) {
      throw new Error(`Tool "${toolName}" not registered`);
    }

    this.logger.log(`Executing tool: ${toolName}`);
    return await handler.execute(args, context);
  }

  /**
   * Check if tool exists
   */
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
