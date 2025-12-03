import { Controller, Get, Param } from '@nestjs/common';

/**
 * Jira Board Access Controller
 * Provides pre-filtered board URLs for tenant members
 */
@Controller('jira')
// TODO: Add authentication guard when available
export class JiraBoardController {
    /**
     * Get Jira board URL filtered by tenant
     * Returns pre-filtered board link showing only that tenant's issues
     * 
     * GET /api/jira/board/:tenantId
     */
    @Get('board/:tenantId')
    getTenantBoardUrl(@Param('tenantId') tenantId: string) {
        const baseUrl = process.env.JIRA_BASE_URL;
        const projectKey = process.env.JIRA_PROJECT_KEY;

        if (!baseUrl || !projectKey) {
            return {
                error: 'Jira not configured',
                message: 'Please set JIRA_BASE_URL and JIRA_PROJECT_KEY in environment variables',
            };
        }

        // JQL query to filter by tenant label
        const jql = `project = ${projectKey} AND labels = tenant-${tenantId}`;
        const encodedJql = encodeURIComponent(jql);

        return {
            tenantId,
            // Issue navigator with filter
            issueNavigatorUrl: `${baseUrl}/issues/?jql=${encodedJql}`,
            // Board with quick filter (if you have board ID)
            boardUrl: `${baseUrl}/jira/software/projects/${projectKey}/boards/1?quickFilter=custom&jql=${encodedJql}`,
            // Raw JQL for reference
            jql,
            // Description
            description: `View all tickets for this tenant in Jira`,
        };
    }

    /**
     * Get customer portal URL
     * 
     * GET /api/jira/customer-portal
     */
    @Get('customer-portal')
    getCustomerPortalUrl() {
        const baseUrl = process.env.JIRA_BASE_URL;

        if (!baseUrl) {
            return {
                error: 'Jira not configured',
                message: 'Please set JIRA_BASE_URL in environment variables',
            };
        }

        // Jira Service Management portal URL (portal ID usually 1)
        const portalUrl = `${baseUrl}/servicedesk/customer/portal/1`;

        return {
            portalUrl,
            description: 'Customer portal for submitting and viewing support requests',
            note: 'Customers do NOT need a Jira account to access this portal',
        };
    }
}
