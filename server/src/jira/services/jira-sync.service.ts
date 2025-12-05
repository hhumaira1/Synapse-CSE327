import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JiraApiService } from './jira-api.service';
import {
  TicketStatus,
  TicketPriority,
} from 'prisma/generated/client';
import {
  JIRA_TO_INTERNAL_STATUS,
  JIRA_TO_INTERNAL_PRIORITY,
} from '../interfaces/jira-types';

/**
 * Jira Auto-Sync Service
 * Automatically syncs tickets from Jira to local cache at regular intervals
 * Runs even when webhooks are not configured for backup sync
 */
@Injectable()
export class JiraSyncService {
  private readonly logger = new Logger(JiraSyncService.name);
  private isSyncing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jiraApi: JiraApiService,
  ) { }

  /**
   * Auto-sync every 5 minutes
   * Can be configured via environment variable JIRA_SYNC_INTERVAL
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoSync() {
    const enabled = process.env.JIRA_AUTO_SYNC_ENABLED !== 'false';

    if (!enabled) {
      return;
    }

    if (this.isSyncing) {
      this.logger.log('Sync already in progress - skipping');
      return;
    }

    if (!this.jiraApi.isConfigured()) {
      this.logger.log('Jira not configured - skipping auto-sync');
      return;
    }

    this.isSyncing = true;
    this.logger.log('Starting automatic Jira sync...');

    try {
      const result = await this.syncAllTenants();
      this.logger.log(
        `Auto-sync completed: ${result.synced} tickets synced, ${result.errors.length} errors`,
      );
    } catch (error) {
      this.logger.error('Auto-sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync all tenants - works with global Jira configuration
   * Syncs all tickets that are linked to Jira across all tenants
   */
  async syncAllTenants(): Promise<{ synced: number; errors: string[] }> {
    const results = { synced: 0, errors: [] as string[] };

    try {
      // Get all tickets linked to Jira (across all tenants)
      const tickets = await this.prisma.ticket.findMany({
        where: {
          externalSystem: 'jira',
          externalId: { not: null },
        },
        include: {
          tenant: true,
        },
      });

      this.logger.log(`Found ${tickets.length} Jira-linked tickets across all tenants`);

      // Sync each ticket
      for (const ticket of tickets) {
        try {
          if (!ticket.externalId) continue;

          // Fetch latest data from Jira
          const jiraIssue = await this.jiraApi.getIssue(ticket.externalId);

          // Update local cache with latest Jira data
          await this.prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              title: jiraIssue.fields.summary,
              description: this.extractTextFromADF(jiraIssue.fields.description),
              status: (JIRA_TO_INTERNAL_STATUS[jiraIssue.fields.status.name] ||
                TicketStatus.OPEN) as TicketStatus,
              priority: (JIRA_TO_INTERNAL_PRIORITY[
                jiraIssue.fields.priority?.name || 'Medium'
              ] || TicketPriority.MEDIUM) as TicketPriority,
            },
          });

          results.synced++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Ticket ${ticket.externalId}: ${errorMsg}`);
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to sync all tenants:', error);
      throw error;
    }
  }

  /**
   * Sync a specific tenant's tickets from Jira
   */
  async syncTenant(tenantId: string): Promise<{ synced: number; errors: string[] }> {
    this.logger.log(`Syncing tenant: ${tenantId}`);

    try {
      // Get all tickets for this tenant that are linked to Jira
      const tickets = await this.prisma.ticket.findMany({
        where: {
          tenantId,
          externalSystem: 'jira',
          externalId: { not: null },
        },
      });

      this.logger.log(`Found ${tickets.length} Jira-linked tickets for tenant ${tenantId}`);

      const results = { synced: 0, errors: [] as string[] };

      // Sync each ticket
      for (const ticket of tickets) {
        try {
          if (!ticket.externalId) continue;

          // Fetch latest data from Jira
          const jiraIssue = await this.jiraApi.getIssue(ticket.externalId);

          // Update local cache with latest Jira data
          await this.prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              title: jiraIssue.fields.summary,
              description: this.extractTextFromADF(jiraIssue.fields.description),
              status: (JIRA_TO_INTERNAL_STATUS[jiraIssue.fields.status.name] ||
                TicketStatus.OPEN) as TicketStatus,
              priority: (JIRA_TO_INTERNAL_PRIORITY[
                jiraIssue.fields.priority?.name || 'Medium'
              ] || TicketPriority.MEDIUM) as TicketPriority,
            },
          });

          results.synced++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Ticket ${ticket.externalId}: ${errorMsg}`);
        }
      }

      this.logger.log(
        `Tenant ${tenantId}: Synced ${results.synced} tickets, ${results.errors.length} errors`,
      );

      return results;
    } catch (error) {
      this.logger.error(`Failed to sync tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Manual sync trigger (called from API endpoint)
   */
  async syncNow(tenantId?: string): Promise<{ synced: number; errors: string[] }> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    try {
      if (tenantId) {
        return await this.syncTenant(tenantId);
      } else {
        return await this.syncAllTenants();
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Extract plain text from Atlassian Document Format (ADF)
   */
  private extractTextFromADF(adf: any): string {
    if (typeof adf === 'string') {
      return adf;
    }

    if (!adf || !adf.content) {
      return '';
    }

    let text = '';
    for (const node of adf.content) {
      if (node.type === 'paragraph' && node.content) {
        for (const contentNode of node.content) {
          if (contentNode.type === 'text') {
            text += contentNode.text + ' ';
          }
        }
        text += '\n';
      }
    }

    return text.trim();
  }
}
