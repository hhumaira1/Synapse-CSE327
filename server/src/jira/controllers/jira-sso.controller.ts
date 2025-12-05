import { Controller, Get, Param } from '@nestjs/common';
import { JiraApiService } from '../services/jira-api.service';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Jira SSO/Deep Linking Controller
 * Provides one-click access to Jira issues from CRM
 */
@Controller('jira')
// TODO: Add authentication guard when available
export class JiraSsoController {
    constructor(
        private readonly jiraApi: JiraApiService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Get Jira issue URL for a ticket
     * Returns deep link to open issue directly in Jira
     * 
     * GET /api/jira/ticket/:ticketId/link
     */
    @Get('ticket/:ticketId/link')
    async getTicketLink(@Param('ticketId') ticketId: string) {
        // Find ticket
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket || ticket.externalSystem !== 'jira' || !ticket.externalId) {
            return {
                hasJiraLink: false,
                message: 'Ticket not linked to Jira',
            };
        }

        // Generate Jira URL
        const jiraUrl = this.jiraApi.getIssueUrl(ticket.externalId);

        return {
            hasJiraLink: true,
            ticketId: ticket.id,
            jiraIssueKey: ticket.externalId,
            jiraUrl,
        };
    }

    /**
     * Get Jira base URL for general access
     * 
     * GET /api/jira/base-url
     */
    @Get('base-url')
    getBaseUrl() {
        const baseUrl = process.env.JIRA_BASE_URL;

        return {
            jiraBaseUrl: baseUrl,
            jiraEnabled: process.env.JIRA_ENABLED === 'true',
        };
    }
}
