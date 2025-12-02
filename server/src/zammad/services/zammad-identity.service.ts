import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ZammadApiService } from './zammad-api.service';

/**
 * Zammad Identity Service
 * Handles the dual-role problem: same email as both CRM agent AND portal customer
 * 
 * SOLUTION: Organization-Based Access Control
 * - One Zammad account per email globally
 * - User belongs to multiple organizations with different roles
 * - Example: john@example.com
 *   → Organization A (Role: Agent, Group: A-Support)
 *   → Organization B (Role: Customer)
 */
@Injectable()
export class ZammadIdentityService {
  private readonly logger = new Logger(ZammadIdentityService.name);

  constructor(
    private prisma: PrismaService,
    private zammadApi: ZammadApiService,
  ) {}

  /**
   * Get or create Zammad user for CRM internal user (agent)
   * Handles case where email already exists as customer in another tenant
   */
  async getOrCreateAgentAccount(
    email: string,
    firstName: string,
    lastName: string,
    tenantId: string,
    role: 'ADMIN' | 'MANAGER' | 'MEMBER',
  ): Promise<{ zammadUserId: number; zammadEmail: string }> {
    try {
      // Get tenant's Zammad organization
      const integration = await this.prisma.integration.findUnique({
        where: {
          tenantId_serviceName: { tenantId, serviceName: 'zammad' },
        },
      });

      if (!integration) {
        throw new Error(`No Zammad integration for tenant ${tenantId}`);
      }

      const config = integration.config as any;
      const organizationId = config.organizationId;
      const groupId = config.groupId;

      // Check if user already exists in Zammad globally
      const existingUser = await this.zammadApi.searchUserByEmail(email);

      if (existingUser) {
        this.logger.log(`Zammad user ${email} already exists (ID: ${existingUser.id})`);

        // Add user to this tenant's organization as agent
        await this.addUserToOrganization(
          existingUser.id,
          organizationId,
          'agent',
          groupId,
        );

        // Update roles to include Agent
        await this.ensureAgentRole(existingUser.id, role);

        return {
          zammadUserId: existingUser.id,
          zammadEmail: email,
        };
      }

      // Create new Zammad user as agent
      const zammadRoles = this.mapCrmRoleToZammad(role);
      const groupIds = groupId ? [groupId] : [];

      const newUser = await this.zammadApi.createUser({
        firstname: firstName,
        lastname: lastName,
        email: email,
        organization_id: organizationId,
        roles: zammadRoles,
        group_ids: groupIds,
      });

      this.logger.log(`✅ Created Zammad agent: ${email} (ID: ${newUser.id})`);

      return {
        zammadUserId: newUser.id,
        zammadEmail: email,
      };
    } catch (error) {
      this.logger.error(`Failed to get/create agent account for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Get or create Zammad user for portal customer
   * Handles case where email already exists as agent in another tenant
   */
  async getOrCreateCustomerAccount(
    email: string,
    firstName: string,
    lastName: string,
    tenantId: string,
  ): Promise<{ zammadUserId: number; zammadEmail: string }> {
    try {
      // Get tenant's Zammad organization
      const integration = await this.prisma.integration.findUnique({
        where: {
          tenantId_serviceName: { tenantId, serviceName: 'zammad' },
        },
      });

      if (!integration) {
        throw new Error(`No Zammad integration for tenant ${tenantId}`);
      }

      const config = integration.config as any;
      const organizationId = config.organizationId;

      // Check if user already exists in Zammad globally
      const existingUser = await this.zammadApi.searchUserByEmail(email);

      if (existingUser) {
        this.logger.log(`Zammad user ${email} already exists (ID: ${existingUser.id})`);

        // Add user to this tenant's organization as customer
        await this.addUserToOrganization(
          existingUser.id,
          organizationId,
          'customer',
        );

        // Ensure user has Customer role (even if they're agent elsewhere)
        await this.ensureCustomerRole(existingUser.id);

        return {
          zammadUserId: existingUser.id,
          zammadEmail: email,
        };
      }

      // Create new Zammad user as customer
      const newUser = await this.zammadApi.createUser({
        firstname: firstName,
        lastname: lastName,
        email: email,
        organization_id: organizationId,
        roles: ['Customer'],
      });

      this.logger.log(`✅ Created Zammad customer: ${email} (ID: ${newUser.id})`);

      return {
        zammadUserId: newUser.id,
        zammadEmail: email,
      };
    } catch (error) {
      this.logger.error(`Failed to get/create customer account for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Add user to organization with specific role
   * This allows same user to be agent in Org A and customer in Org B
   */
  private async addUserToOrganization(
    userId: number,
    organizationId: number,
    roleType: 'agent' | 'customer',
    groupId?: number,
  ): Promise<void> {
    try {
      const user = await this.zammadApi.getUser(userId);

      // Get current organization IDs
      const currentOrgIds = user.organization_ids || [user.organization_id];

      // Add new organization if not already present
      if (!currentOrgIds.includes(organizationId)) {
        const updatedOrgIds = [...new Set([...currentOrgIds, organizationId])];

        await this.zammadApi.updateUser(userId, {
          organization_ids: updatedOrgIds,
        });

        this.logger.log(`Added user ${userId} to organization ${organizationId} as ${roleType}`);
      }

      // If agent, add to group
      if (roleType === 'agent' && groupId) {
        const currentGroupIds = user.group_ids || [];
        if (!currentGroupIds.includes(groupId)) {
          await this.zammadApi.updateUser(userId, {
            group_ids: [...currentGroupIds, groupId],
          });
          this.logger.log(`Added user ${userId} to group ${groupId}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to add user to organization:`, error.message);
    }
  }

  /**
   * Ensure user has Agent role (for accessing tickets as agent)
   */
  private async ensureAgentRole(userId: number, crmRole: string): Promise<void> {
    try {
      const user = await this.zammadApi.getUser(userId);
      const currentRoles = user.role_ids || [];
      const requiredRoles = this.mapCrmRoleToZammad(crmRole);

      // Get role IDs from Zammad
      const agentRoleId = await this.getRoleId('Agent');
      const adminRoleId = await this.getRoleId('Admin');
      const customerRoleId = await this.getRoleId('Customer');

      let newRoleIds = [...currentRoles];

      // Add Agent role if not present
      if (agentRoleId && !newRoleIds.includes(agentRoleId)) {
        newRoleIds.push(agentRoleId);
      }

      // Add Admin role if required
      if (requiredRoles.includes('Admin') && adminRoleId && !newRoleIds.includes(adminRoleId)) {
        newRoleIds.push(adminRoleId);
      }

      // Keep Customer role if they have it (dual role support)
      if (currentRoles.includes(customerRoleId)) {
        this.logger.log(`User ${userId} has both Agent and Customer roles (dual access)`);
      }

      await this.zammadApi.updateUser(userId, {
        role_ids: newRoleIds,
      });

      this.logger.log(`Updated user ${userId} roles to include Agent`);
    } catch (error) {
      this.logger.warn(`Failed to ensure agent role:`, error.message);
    }
  }

  /**
   * Ensure user has Customer role
   */
  private async ensureCustomerRole(userId: number): Promise<void> {
    try {
      const user = await this.zammadApi.getUser(userId);
      const currentRoles = user.role_ids || [];
      const customerRoleId = await this.getRoleId('Customer');

      if (customerRoleId && !currentRoles.includes(customerRoleId)) {
        await this.zammadApi.updateUser(userId, {
          role_ids: [...currentRoles, customerRoleId],
        });
        this.logger.log(`Added Customer role to user ${userId}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to ensure customer role:`, error.message);
    }
  }

  /**
   * Get Zammad role ID by name
   */
  private async getRoleId(roleName: string): Promise<number | null> {
    try {
      const roles = await this.zammadApi.getRoles();
      const role = roles.find((r: any) => r.name === roleName);
      return role?.id || null;
    } catch (error) {
      this.logger.warn(`Failed to get role ID for ${roleName}:`, error.message);
      return null;
    }
  }

  /**
   * Map CRM user role to Zammad roles
   */
  private mapCrmRoleToZammad(crmRole?: string): string[] {
    switch (crmRole) {
      case 'ADMIN':
        return ['Agent', 'Admin'];
      case 'MANAGER':
      case 'MEMBER':
      default:
        return ['Agent'];
    }
  }

  /**
   * Get user's access context for a specific tenant
   * Determines if user is agent, customer, or both
   */
  async getUserAccessContext(
    email: string,
    tenantId: string,
  ): Promise<{
    isAgent: boolean;
    isCustomer: boolean;
    zammadUserId: number | null;
    organizationId: number | null;
  }> {
    try {
      // Check if user exists in Zammad
      const zammadUser = await this.zammadApi.searchUserByEmail(email);
      if (!zammadUser) {
        return { isAgent: false, isCustomer: false, zammadUserId: null, organizationId: null };
      }

      // Get tenant's organization
      const integration = await this.prisma.integration.findUnique({
        where: {
          tenantId_serviceName: { tenantId, serviceName: 'zammad' },
        },
      });

      if (!integration) {
        return { isAgent: false, isCustomer: false, zammadUserId: zammadUser.id, organizationId: null };
      }

      const config = integration.config as any;
      const organizationId = config.organizationId;

      // Check if user belongs to this organization
      const userOrgIds = zammadUser.organization_ids || [zammadUser.organization_id];
      const belongsToOrg = userOrgIds.includes(organizationId);

      if (!belongsToOrg) {
        return { isAgent: false, isCustomer: false, zammadUserId: zammadUser.id, organizationId };
      }

      // Check roles
      const roles = zammadUser.roles || [];
      const isAgent = roles.includes('Agent') || roles.includes('Admin');
      const isCustomer = roles.includes('Customer');

      return {
        isAgent,
        isCustomer,
        zammadUserId: zammadUser.id,
        organizationId,
      };
    } catch (error) {
      this.logger.error(`Failed to get user access context:`, error.message);
      return { isAgent: false, isCustomer: false, zammadUserId: null, organizationId: null };
    }
  }
}
