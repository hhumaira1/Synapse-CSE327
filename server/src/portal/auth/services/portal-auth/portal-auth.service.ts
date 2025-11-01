import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class PortalAuthService {
  private readonly logger = new Logger(PortalAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Links a new Clerk user (clerkId) to a pre-invited PortalCustomer
   * record based on their email and the tenant they were invited to.
   */
  async syncPortalCustomer(clerkId: string, email: string, tenantId: string) {
    const portalCustomer = await this.prisma.portalCustomer.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenantId,
          email: email,
        },
      },
    });

    if (!portalCustomer) {
      this.logger.warn(
        `Failed sync: No invite found for ${email} at tenant ${tenantId}`,
      );
      throw new ForbiddenException(
        'Invite not found for this email and tenant.',
      );
    }

    if (portalCustomer.clerkId && portalCustomer.clerkId !== clerkId) {
      this.logger.warn(
        `Failed sync: Email ${email} already linked to a different Clerk account.`,
      );
      throw new ForbiddenException(
        'This email is already linked to another user.',
      );
    }

    if (portalCustomer.clerkId === clerkId) {
      this.logger.log(`User ${clerkId} already synced. Returning details.`);
      return portalCustomer; // Already synced, just log in
    }

    // This is the successful first-time sync
    const updatedCustomer = await this.prisma.portalCustomer.update({
      where: {
        id: portalCustomer.id,
      },
      data: {
        clerkId: clerkId, // <-- The critical link
      },
    });

    this.logger.log(
      `Successfully synced clerkId ${clerkId} to portalCustomer ${updatedCustomer.id}`,
    );
    return updatedCustomer;
  }

  /**
   * Gets all portal accounts associated with a single clerkId.
   * A customer might be a portal user for multiple tenants.
   */
  async getPortalAccounts(clerkId: string) {
    if (!clerkId) {
      throw new NotFoundException('User not found');
    }

    const accounts = await this.prisma.portalCustomer.findMany({
      where: { clerkId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!accounts || accounts.length === 0) {
      this.logger.warn(`No portal accounts found for clerkId ${clerkId}`);
      throw new NotFoundException('No portal accounts found for this user.');
    }

    return accounts;
  }
}
