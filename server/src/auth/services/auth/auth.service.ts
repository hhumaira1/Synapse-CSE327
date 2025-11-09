import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UserRole } from 'prisma/generated/client/wasm';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ClerkService } from 'src/clerk/clerk/clerk.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkService: ClerkService,
  ) {}

  // Sync Clerk user with our database (ONE tenant only)
  async syncUserWithDatabase(
    clerkId: string,
    email: string,
    name: string,
    tenantId?: string,
  ) {
    let user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });

    if (!user) {
      if (!tenantId) {
        this.logger.warn(`No tenantId provided for new user: ${clerkId}`);
        throw new BadRequestException('Tenant ID required for new users');
      }

      // Check if email is already used by another internal user
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException(
          'This email is already associated with an internal user in another organization. ' +
            'Each email can only be used for one company account.',
        );
      }

      user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          tenantId,
          role: UserRole.MEMBER,
        },
        include: { tenant: true },
      });

      this.logger.log(`Created new user ${user.id} for tenant ${tenantId}`);
    }

    return user;
  }

  // Create initial tenant and admin user
  async createInitialUserAndTenant(
    clerkId: string,
    email: string,
    name: string,
    tenantName: string,
  ) {
    // Check if this email is already an internal user
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        `The email ${email} is already registered as an internal user. ` +
          `Each email can only create one workspace. ` +
          `If you need to join an existing workspace, ask the admin to invite you.`,
      );
    }

    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const tenant = await this.prisma.tenant.create({
      data: {
        name: tenantName,
        slug: `${slug}-${Date.now()}`,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        tenantId: tenant.id,
        role: UserRole.ADMIN,
      },
      include: { tenant: true },
    });

    this.logger.log(`Created tenant ${tenant.id} and admin user ${user.id}`);
    return { tenant, user };
  }

  // Fetch user details along with tenant info
  async getUserDetails(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });
    return user;
  }

  // Get all tenants user can access (internal + portal customer)
  async getMyTenants(clerkId: string) {
    // Get internal user tenant (if exists)
    const internalUser = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });

    // Get portal customer access (can be multiple)
    const portalAccess = await this.prisma.portalCustomer.findMany({
      where: { clerkId, isActive: true },
      include: { tenant: true },
    });

    return {
      internalAccess: internalUser
        ? {
            tenant: internalUser.tenant,
            role: internalUser.role,
            type: 'INTERNAL' as const,
          }
        : null,
      portalAccess: portalAccess.map((p) => ({
        tenant: p.tenant,
        type: 'PORTAL_CUSTOMER' as const,
        portalCustomerId: p.id,
      })),
    };
  }

  // Fetch complete user data from Clerk API
  async getClerkUser(clerkId: string) {
    try {
      const user = await this.clerkService.client.users.getUser(clerkId);
      return user;
    } catch (error) {
      this.logger.error(`Failed to fetch Clerk user ${clerkId}:`, error);
      throw new BadRequestException('Failed to fetch user details from Clerk');
    }
  }
}
