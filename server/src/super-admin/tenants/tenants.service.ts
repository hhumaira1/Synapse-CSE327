import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TenantType, UserRole } from 'prisma/generated/client';
import { AuditService } from '../audit/audit.service';

export interface CreateTenantDto {
  name: string;
  slug?: string;
  type?: TenantType;
  adminEmail: string;
  adminFirstName?: string;
  adminLastName?: string;
}

export interface UpdateTenantDto {
  name?: string;
  domain?: string;
  type?: TenantType;
  settings?: any;
}

@Injectable()
export class SuperAdminTenantsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters?: {
    search?: string;
    type?: TenantType;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Record<string, any> = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              contacts: true,
              leads: true,
              deals: true,
              tickets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: filters?.skip || 0,
        take: filters?.take || 20,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      tenants: tenants.map((t) => ({
        ...t,
        stats: t._count,
      })),
      total,
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            leads: true,
            deals: true,
            tickets: true,
            interactions: true,
            callLogs: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return {
      ...tenant,
      stats: tenant._count,
    };
  }

  async getStats(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const [
      userCount,
      contactCount,
      leadCount,
      dealCount,
      ticketCount,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.contact.count({ where: { tenantId: id } }),
      this.prisma.lead.count({ where: { tenantId: id } }),
      this.prisma.deal.count({ where: { tenantId: id } }),
      this.prisma.ticket.count({ where: { tenantId: id } }),
      this.prisma.user.findMany({
        where: { tenantId: id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      tenant,
      stats: {
        users: userCount,
        contacts: contactCount,
        leads: leadCount,
        deals: dealCount,
        tickets: ticketCount,
      },
      recentUsers,
    };
  }

  async create(createDto: CreateTenantDto, superAdminId: string) {
    // Generate slug from name if not provided
    const slug =
      createDto.slug ||
      createDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException(`Tenant with slug "${slug}" already exists`);
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: createDto.name,
        slug,
        type: createDto.type || TenantType.ORGANIZATION,
        isActive: true,
      },
    });

    // Create user invitation for admin
    // Note: invitedBy requires a User ID, but super admin is not a regular User
    // We'll create invitation with a placeholder until first admin accepts
    // Then they can invite others properly
    const invitationToken = this.generateInvitationToken();
    
    const invitation = await this.prisma.userInvitation.create({
      data: {
        tenantId: tenant.id,
        email: createDto.adminEmail,
        role: UserRole.ADMIN,
        invitedBy: 'SYSTEM', // Placeholder - will be updated when first user is created
        token: invitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log action
    await this.auditService.log({
      superAdminId,
      action: 'CREATE_TENANT',
      targetType: 'TENANT',
      targetId: tenant.id,
      metadata: {
        tenantName: tenant.name,
        slug: tenant.slug,
        adminEmail: createDto.adminEmail,
        invitationToken,
      },
    });

    return {
      tenant,
      invitation,
      invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${invitationToken}`,
    };
  }

  private generateInvitationToken(): string {
    // Generate a random token for invitation
    return `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  async update(id: string, updateDto: UpdateTenantDto, superAdminId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: updateDto,
    });

    // Log action
    await this.auditService.log({
      superAdminId,
      action: 'UPDATE_TENANT',
      targetType: 'TENANT',
      targetId: id,
      metadata: {
        previous: tenant,
        updated: updateDto,
      },
    });

    return updated;
  }

  async toggleStatus(id: string, superAdminId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: !tenant.isActive },
    });

    // Log action
    await this.auditService.log({
      superAdminId,
      action: tenant.isActive ? 'DEACTIVATE_TENANT' : 'ACTIVATE_TENANT',
      targetType: 'TENANT',
      targetId: id,
      metadata: {
        tenantName: tenant.name,
        previousStatus: tenant.isActive,
        newStatus: !tenant.isActive,
      },
    });

    return updated;
  }

  async remove(id: string, superAdminId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Soft delete by deactivating
    const deleted = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    // Log action
    await this.auditService.log({
      superAdminId,
      action: 'DELETE_TENANT',
      targetType: 'TENANT',
      targetId: id,
      metadata: {
        tenantName: tenant.name,
      },
    });

    return deleted;
  }
}
