import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class SuperAdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalContacts,
      totalLeads,
      totalDeals,
      totalTickets,
      newTenantsThisMonth,
      newUsersThisMonth,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.contact.count(),
      this.prisma.lead.count(),
      this.prisma.deal.count(),
      this.prisma.ticket.count(),
      this.prisma.tenant.count({
        where: {
          createdAt: { gte: firstDayOfMonth },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: firstDayOfMonth },
        },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalUsers,
      totalContacts,
      totalLeads,
      totalDeals,
      totalTickets,
      newTenantsThisMonth,
      newUsersThisMonth,
    };
  }

  async getTenantGrowth(months: number = 6) {
    const now = new Date();
    const monthsAgo = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        createdAt: { gte: monthsAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by month
    const groupedByMonth = tenants.reduce((acc: Record<string, number>, tenant) => {
      const monthKey = tenant.createdAt.toISOString().substring(0, 7); // YYYY-MM
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getUsageStats() {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Top 20 most active tenants
    });

    return tenants.map((tenant) => ({
      tenantId: tenant.id,
      tenantName: tenant.name,
      slug: tenant.slug,
      users: tenant._count.users,
      contacts: tenant._count.contacts,
      leads: tenant._count.leads,
      deals: tenant._count.deals,
      tickets: tenant._count.tickets,
      totalActivity:
        tenant._count.contacts +
        tenant._count.leads +
        tenant._count.deals +
        tenant._count.tickets,
    }));
  }

  async getActiveUsers(days: number = 30) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const activeUsers = await this.prisma.user.count({
      where: {
        updatedAt: { gte: daysAgo },
        isActive: true,
      },
    });

    const totalUsers = await this.prisma.user.count({
      where: { isActive: true },
    });

    return {
      activeUsers,
      totalUsers,
      inactiveUsers: totalUsers - activeUsers,
      activityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      periodDays: days,
    };
  }
}
