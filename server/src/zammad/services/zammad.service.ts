import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ZammadApiService } from './zammad-api.service';
import { Tenant, TicketPriority } from 'prisma/generated/client';
import { CreateTicketDto } from '../../tickets/dto/create-ticket.dto';

/**
 * Zammad Service - Business Logic Layer
 * Handles multi-tenant organization management and ticket sync
 */
@Injectable()
export class ZammadService {
    private readonly logger = new Logger(ZammadService.name);

    constructor(
        private prisma: PrismaService,
        private zammadApi: ZammadApiService,
    ) { }

    /**
     * Auto-create Zammad organization when tenant is created
     */
    async createOrganizationForTenant(tenant: Tenant) {
        try {
            // Create organization in Zammad
            const zammadOrg = await this.zammadApi.createOrganization(
                tenant.name,
                tenant.domain || undefined,
                `CRM Tenant ID: ${tenant.id}`,
            );

            // ✨ AUTO-CREATE DEFAULT GROUP FOR TENANT ✨
            let groupId: number | undefined;
            try {
                const groupName = `${tenant.name} - Support`;
                const groupResponse = await this.zammadApi['axiosInstance'].post('/api/v1/groups', {
                    name: groupName,
                    active: true,
                    note: `Auto-created for tenant: ${tenant.name}`,
                });
                groupId = groupResponse.data.id;
                this.logger.log(`Created Zammad group: ${groupName} (ID: ${groupId})`);
            } catch (groupError) {
                this.logger.warn(`Failed to create group for tenant ${tenant.name}:`, groupError.message);
                // Continue anyway - organization still works
            }

            // Store integration mapping
            const integration = await this.prisma.integration.create({
                data: {
                    tenantId: tenant.id,
                    serviceName: 'zammad',
                    config: {
                        organizationId: zammadOrg.id,
                        organizationName: zammadOrg.name,
                        customerPortalUrl: `${process.env.ZAMMAD_URL}/#customer_ticket_new`,
                        groupId: groupId,  // Store group ID
                        groupName: groupId ? `${tenant.name} - Support` : undefined,
                    },
                },
            });

            this.logger.log(
                `Created Zammad organization for tenant ${tenant.name}: Org ID ${zammadOrg.id}`,
            );

            return {
                ...integration,
                config: integration.config as {
                    organizationId: number;
                    organizationName: string;
                    customerPortalUrl: string;
                    groupId?: number;
                    groupName?: string;
                },
            };
        } catch (error) {
            this.logger.error(`Failed to create organization for tenant ${tenant.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Get Zammad integration for a tenant
     */
    async getIntegration(tenantId: string) {
        const integration = await this.prisma.integration.findUnique({
            where: {
                tenantId_serviceName: {
                    tenantId,
                    serviceName: 'zammad',
                },
            },
        });

        if (!integration) {
            return null;
        }

        return {
            ...integration,
            config: integration.config as {
                organizationId: number;
                organizationName: string;
                customerPortalUrl: string;
                groupId?: number;
                groupName?: string;
            },
        };
    }

    /**
     * Map internal priority to Zammad priority
     */
    mapPriorityToZammad(priority: TicketPriority): string {
        const mapping = {
            LOW: '1 low',
            MEDIUM: '2 normal',
            HIGH: '3 high',
            URGENT: '3 high', // Zammad doesn't have "urgent", map to high
        };
        return mapping[priority] || '2 normal';
    }

    /**
     * Map Zammad priority to internal priority
     */
    mapPriorityFromZammad(priority: string): TicketPriority {
        const mapping = {
            '1 low': TicketPriority.LOW,
            '2 normal': TicketPriority.MEDIUM,
            '3 high': TicketPriority.HIGH,
        };
        return mapping[priority] || TicketPriority.MEDIUM;
    }

    /**
     * Map internal status to Zammad state
     */
    mapStatusToZammad(status: string): string {
        const mapping = {
            OPEN: 'open',
            IN_PROGRESS: 'open',
            RESOLVED: 'closed',
            CLOSED: 'closed',
        };
        return mapping[status] || 'new';
    }

    /**
     * Map Zammad state to internal status
     */
    mapStatusFromZammad(state: string): string {
        const mapping = {
            'new': 'OPEN',
            'open': 'IN_PROGRESS',
            'pending reminder': 'IN_PROGRESS',
            'pending close': 'IN_PROGRESS',
            'closed': 'RESOLVED',
        };
        return mapping[state] || 'OPEN';
    }

    /**
     * Create ticket in Zammad for a tenant
     */
    async createTicketInZammad(
        tenantId: string,
        createTicketDto: CreateTicketDto,
        contactEmail: string,
        contactFirstName: string,
        contactLastName: string,
    ) {
        const integration = await this.getIntegration(tenantId);
        if (!integration) {
            throw new Error(`No Zammad integration found for tenant ${tenantId}`);
        }

        // Get or create user in Zammad
        const user = await this.zammadApi.getOrCreateUser(
            contactEmail,
            contactFirstName,
            contactLastName,
            integration.config.organizationId,
        );

        // Create ticket in Zammad
        const zammadTicket = await this.zammadApi.createTicket({
            title: createTicketDto.title,
            group: 'Users', // Default group, configure as needed
            customer_id: user.id,
            organization_id: integration.config.organizationId,
            state: 'new',
            priority: this.mapPriorityToZammad(createTicketDto.priority || TicketPriority.MEDIUM),
            article: {
                subject: createTicketDto.title,
                body: createTicketDto.description || createTicketDto.title,
                type: 'note',
                internal: false,
            },
        });

        return zammadTicket;
    }

    /**
     * Auto-create Zammad agent account for tenant user
     * Called when a new user is created in the CRM
     */
    async createZammadAgentAccount(
        email: string,
        firstName: string,
        lastName: string,
        tenantId: string,
        crmRole?: string,  // ADMIN, MANAGER, or MEMBER
    ) {
        try {
            const integration = await this.getIntegration(tenantId);
            if (!integration) {
                this.logger.warn(`No Zammad integration for tenant ${tenantId}, skipping agent creation`);
                return null;
            }

            // Check if user already exists in Zammad
            const searchResponse = await this.zammadApi['axiosInstance'].get('/api/v1/users/search', {
                params: { query: email },
            });

            if (searchResponse.data && searchResponse.data.length > 0) {
                this.logger.log(`Zammad user ${email} already exists`);
                return searchResponse.data[0];
            }

            // Generate a random password (user will reset it via email)
            const randomPassword = Math.random().toString(36).slice(-16) +
                Math.random().toString(36).slice(-16);

            // Map CRM role to Zammad roles
            const zammadRoles = this.mapCrmRoleToZammad(crmRole);

            // Get group ID from integration (if available)
            const groupIds = integration.config.groupId ? [integration.config.groupId] : [];

            // Create agent account in Zammad
            const createResponse = await this.zammadApi['axiosInstance'].post('/api/v1/users', {
                firstname: firstName,
                lastname: lastName,
                email: email,
                organization_id: integration.config.organizationId,
                roles: zammadRoles,  // Role-based access
                group_ids: groupIds,  // Assign to tenant's group
                password: randomPassword,
            });

            this.logger.log(`✅ Created Zammad ${zammadRoles.join('+')} account for ${email} (CRM Role: ${crmRole})`);
            if (groupIds.length > 0) {
                this.logger.log(`   📌 Assigned to group: ${integration.config.groupName}`);
            }

            // Optionally send password reset email via Zammad
            try {
                await this.zammadApi['axiosInstance'].post('/api/v1/users/password_reset', {
                    username: email,
                });
                this.logger.log(`📧 Sent password reset email to ${email}`);
            } catch (emailError) {
                this.logger.warn(`Failed to send password reset email:`, emailError.message);
            }

            return createResponse.data;
        } catch (error) {
            this.logger.error(`Failed to create Zammad agent for ${email}:`, error.message);
            // Don't throw - user can still use CRM even if Zammad fails
            return null;
        }
    }

    /**
     * Auto-create Zammad customer account for portal customer
     * Different from Agent - this is for external customers
     */
    async createZammadCustomerAccount(
        email: string,
        firstName: string,
        lastName: string,
        tenantId: string,
    ) {
        try {
            const integration = await this.getIntegration(tenantId);
            if (!integration) {
                this.logger.warn(`No Zammad integration for tenant ${tenantId}, skipping customer creation`);
                return null;
            }

            // Check if user already exists in Zammad
            const searchResponse = await this.zammadApi['axiosInstance'].get('/api/v1/users/search', {
                params: { query: email },
            });

            if (searchResponse.data && searchResponse.data.length > 0) {
                this.logger.log(`Zammad user ${email} already exists`);
                return searchResponse.data[0];
            }

            // Generate a random password (customer will use portal login, not direct Zammad)
            const randomPassword = Math.random().toString(36).slice(-16) +
                Math.random().toString(36).slice(-16);

            // Create customer account in Zammad
            const createResponse = await this.zammadApi['axiosInstance'].post('/api/v1/users', {
                firstname: firstName,
                lastname: lastName,
                email: email,
                organization_id: integration.config.organizationId,
                roles: ['Customer'],  // Customer role - read-only portal access
                password: randomPassword,
            });

            this.logger.log(`✅ Created Zammad Customer account for ${email}`);

            return createResponse.data;
        } catch (error) {
            this.logger.error(`Failed to create Zammad customer for ${email}:`, error.message);
            // Don't throw - continue anyway
            return null;
        }
    }

    /**
     * Map CRM user role to Zammad roles
     */
    private mapCrmRoleToZammad(crmRole?: string): string[] {
        switch (crmRole) {
            case 'ADMIN':
                // Full access: Can manage Zammad settings + all tickets
                return ['Agent', 'Admin'];
            case 'MANAGER':
                // Agent access: Can manage tickets, assign to team
                return ['Agent'];
            case 'MEMBER':
                // Agent access: Can work on tickets
                return ['Agent'];
            default:
                // Default to Agent if role unknown
                return ['Agent'];
        }
    }
}
