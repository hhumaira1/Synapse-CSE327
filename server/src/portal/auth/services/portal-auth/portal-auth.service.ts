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
   * Links a new Supabase user (supabaseUserId) to a pre-invited PortalCustomer
   * record based on their email and the tenant they were invited to.
   */
  async syncPortalCustomer(supabaseUserId: string, email: string, tenantId: string) {
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

    if (portalCustomer.supabaseUserId && portalCustomer.supabaseUserId !== supabaseUserId) {
      this.logger.warn(
        `Failed sync: Email ${email} already linked to a different Supabase account.`,
      );
      throw new ForbiddenException(
        'This email is already linked to another user.',
      );
    }

    if (portalCustomer.supabaseUserId === supabaseUserId) {
      this.logger.log(`User ${supabaseUserId} already synced. Returning details.`);
      return portalCustomer; // Already synced, just log in
    }

    // This is the successful first-time sync
    const updatedCustomer = await this.prisma.portalCustomer.update({
      where: {
        id: portalCustomer.id,
      },
      data: {
        supabaseUserId: supabaseUserId, // <-- The critical link
      },
    });

    this.logger.log(
      `Successfully synced supabaseUserId ${supabaseUserId} to portalCustomer ${updatedCustomer.id}`,
    );
    return updatedCustomer;
  }

  /**
   * Gets all portal accounts associated with a single supabaseUserId.
   * A customer might be a portal user for multiple tenants.
   */
  async getPortalAccounts(supabaseUserId: string) {
    if (!supabaseUserId) {
      throw new NotFoundException('User not found');
    }

    const accounts = await this.prisma.portalCustomer.findMany({
      where: { supabaseUserId },
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
      this.logger.warn(`No portal accounts found for supabaseUserId ${supabaseUserId}`);
      throw new NotFoundException('No portal accounts found for this user.');
    }

    return accounts;
  }
}
