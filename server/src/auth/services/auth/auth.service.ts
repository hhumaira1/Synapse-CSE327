import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

  // Sync Clerk user with our database
  async syncUserWithDatabase(
    clerkId: string,
    email: string,
    name: string,
    tenantId?: string,
  ) {
    let user = await this.prisma.user.findUnique({
      where: { clerkId },
    });
    if (!user) {
      if (!tenantId) {
        this.logger.warn(`No tenantId provided for new user: ${clerkId}`);
        throw new BadRequestException('Tenant ID required for new users');
      }
      user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          tenantId,
          role: UserRole.MEMBER,
        },
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
    });

    this.logger.log(`Created tenant ${tenant.id} and admin user ${user.id}`);
    return { tenant, user };
  }

  // Fetch user details along with tenant info/
  async getUserDetails(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });
    return user;
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
