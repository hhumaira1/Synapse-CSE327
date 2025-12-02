import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TicketStatus, TicketPriority } from 'prisma/generated/client';

/**
 * Zammad Webhooks Controller
 * Receives webhooks from Zammad when tickets are created/updated
 * 
 * Webhook setup in Zammad:
 * 1. Admin → Manage → Webhooks → Create New
 * 2. Endpoint URL: https://yourcrm.com/api/webhooks/zammad/:tenantId
 * 3. Trigger: Ticket Create, Ticket Update
 */
@Controller('webhooks/zammad')
export class ZammadWebhooksController {
    private readonly logger = new Logger(ZammadWebhooksController.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Handle webhook from Zammad
     * Payload contains ticket data from Zammad
     */
    @Post(':tenantId')
    async handleWebhook(
        @Param('tenantId') tenantId: string,
        @Body() payload: any,
    ) {
        this.logger.log(`Received Zammad webhook for tenant ${tenantId}`);
        this.logger.debug('Webhook payload:', JSON.stringify(payload, null, 2));

        try {
            const ticket = payload.ticket;
            if (!ticket) {
                this.logger.warn('No ticket data in webhook payload');
                return { status: 'ignored', reason: 'No ticket data' };
            }

            // Check if ticket already exists in our database
            const existingTicket = await this.prisma.ticket.findFirst({
                where: {
                    tenantId,
                    externalSystem: 'zammad',
                    externalId: ticket.id.toString(),
                },
            });

            if (existingTicket) {
                // Update existing ticket
                await this.updateTicketFromWebhook(existingTicket.id, ticket);
                return { status: 'updated', ticketId: existingTicket.id };
            } else {
                // Create new ticket in our database
                await this.createTicketFromWebhook(tenantId, ticket, payload);
                return { status: 'created' };
            }
        } catch (error) {
            this.logger.error('Error processing Zammad webhook:', error);
            return { status: 'error', message: error.message };
        }
    }

    /**
     * Create ticket in our database from Zammad webhook
     */
    private async createTicketFromWebhook(tenantId: string, ticket: any, payload: any) {
        // Map Zammad state to our status
        const status = this.mapZammadStateToStatus(ticket.state);
        const priority = this.mapZammadPriorityToPriority(ticket.priority);

        // Try to find contact by email
        let contactId: string | undefined;
        if (payload.customer && payload.customer.email) {
            const contact = await this.prisma.contact.findFirst({
                where: {
                    tenantId,
                    email: payload.customer.email,
                },
            });
            contactId = contact?.id;
        }

        const createdTicket = await this.prisma.ticket.create({
            data: {
                tenantId,
                contactId,
                title: ticket.title,
                description: payload.article?.body || ticket.title,
                status,
                priority,
                source: 'PORTAL',
                externalSystem: 'zammad',
                externalId: ticket.id.toString(),
                submittedByPortalCustomer: true,
            },
        });

        this.logger.log(`Created ticket from Zammad webhook: ${createdTicket.id}`);
    }

    /**
     * Update existing ticket from Zammad webhook
     */
    private async updateTicketFromWebhook(ticketId: string, zammadTicket: any) {
        const status = this.mapZammadStateToStatus(zammadTicket.state);
        const priority = this.mapZammadPriorityToPriority(zammadTicket.priority);

        await this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status,
                priority,
                title: zammadTicket.title,
            },
        });

        this.logger.log(`Updated ticket from Zammad webhook: ${ticketId}`);
    }

    /**
     * Map Zammad state to internal TicketStatus
     */
    private mapZammadStateToStatus(state: string): TicketStatus {
        const mapping: Record<string, TicketStatus> = {
            'new': TicketStatus.OPEN,
            'open': TicketStatus.IN_PROGRESS,
            'pending reminder': TicketStatus.IN_PROGRESS,
            'pending close': TicketStatus.IN_PROGRESS,
            'closed': TicketStatus.RESOLVED,
        };
        return mapping[state] || TicketStatus.OPEN;
    }

    /**
     * Map Zammad priority to internal TicketPriority
     */
    private mapZammadPriorityToPriority(priority: string): TicketPriority {
        const mapping: Record<string, TicketPriority> = {
            '1 low': TicketPriority.LOW,
            '2 normal': TicketPriority.MEDIUM,
            '3 high': TicketPriority.HIGH,
        };
        return mapping[priority] || TicketPriority.MEDIUM;
    }
}
