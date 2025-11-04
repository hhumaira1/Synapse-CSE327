import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { EmailService } from 'src/common/services/email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PortalCustomersService {
  private readonly logger = new Logger(PortalCustomersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Invite a customer to access the portal
   * NOTE: Unlike employee invitations, the same email CAN be used across multiple tenants
   * Each tenant can have their own portal customer with the same email
   */
  async inviteCustomer(
    tenantId: string,
    contactId: string,
    customMessage?: string,
  ) {
    // 1. Find the contact
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found in this tenant');
    }

    if (!contact.email) {
      throw new BadRequestException(
        'Contact must have an email address to access the portal',
      );
    }

    // 2. Check if portal customer already exists for this contact
    const existingPortalCustomer = await this.prisma.portalCustomer.findFirst({
      where: {
        contactId,
        tenantId,
      },
    });

    if (existingPortalCustomer) {
      if (existingPortalCustomer.isActive) {
        throw new BadRequestException(
          'This contact already has active portal access',
        );
      }
      // Reactivate if previously deactivated
      const reactivated = await this.prisma.portalCustomer.update({
        where: { id: existingPortalCustomer.id },
        data: {
          isActive: true,
          accessToken: randomBytes(32).toString('hex'), // Generate new token
        },
      });

      this.logger.log(
        `Reactivated portal access for contact ${contactId} in tenant ${tenantId}`,
      );

      return {
        message: 'Portal access reactivated',
        portalCustomer: reactivated,
      };
    }

    // 3. Generate access token for portal invitation
    const accessToken = randomBytes(32).toString('hex');

    // 4. Create portal customer record (without clerkId initially)
    const portalCustomer = await this.prisma.portalCustomer.create({
      data: {
        tenantId,
        contactId,
        email: contact.email.toLowerCase(),
        accessToken,
        isActive: true,
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    // 5. Send invitation email
    try {
      await this.emailService.sendCustomerPortalInvitation(
        contact.email,
        portalCustomer.tenant.name,
        contact.firstName + (contact.lastName ? ` ${contact.lastName}` : ''),
        accessToken,
      );

      this.logger.log(
        `Customer portal invitation sent to ${contact.email} for tenant ${tenantId}`,
      );
    } catch (error) {
      // If email fails, delete the portal customer record
      await this.prisma.portalCustomer.delete({
        where: { id: portalCustomer.id },
      });
      this.logger.error('Failed to send customer portal invitation:', error);
      throw new BadRequestException(
        'Failed to send portal invitation email. Please check email configuration.',
      );
    }

    return {
      message: 'Portal invitation sent successfully',
      portalCustomer: {
        id: portalCustomer.id,
        email: portalCustomer.email,
        contactName:
          contact.firstName + (contact.lastName ? ` ${contact.lastName}` : ''),
        tenantName: portalCustomer.tenant.name,
      },
    };
  }

  /**
   * Link Clerk account to portal customer after they accept invitation
   */
  async linkClerkToPortalCustomer(accessToken: string, clerkId: string) {
    // Find portal customer by access token
    const portalCustomer = await this.prisma.portalCustomer.findFirst({
      where: {
        accessToken,
        isActive: true,
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    if (!portalCustomer) {
      throw new NotFoundException('Invalid or expired portal access token');
    }

    // Check if already linked to a Clerk account
    if (portalCustomer.clerkId) {
      throw new BadRequestException(
        'This portal access is already linked to an account',
      );
    }

    // Update with Clerk ID
    const updated = await this.prisma.portalCustomer.update({
      where: { id: portalCustomer.id },
      data: {
        clerkId,
        accessToken: null, // Clear token after successful linking
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    this.logger.log(
      `Portal customer ${portalCustomer.id} linked to Clerk account ${clerkId}`,
    );

    const contactName = updated.contact
      ? updated.contact.firstName +
        (updated.contact.lastName ? ` ${updated.contact.lastName}` : '')
      : updated.email.split('@')[0];

    return {
      message: 'Portal access activated successfully',
      portalCustomer: {
        id: updated.id,
        email: updated.email,
        contactName,
        tenantId: updated.tenantId,
        tenantName: updated.tenant.name,
      },
    };
  }

  /**
   * Get portal customer by access token (for invitation acceptance)
   */
  async getPortalCustomerByToken(accessToken: string) {
    return this.prisma.portalCustomer.findFirst({
      where: {
        accessToken,
        isActive: true,
      },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get portal customer by Clerk ID
   */
  async getPortalCustomerByClerkId(clerkId: string, tenantId?: string) {
    const where: any = {
      clerkId,
      isActive: true,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const portalCustomers = await this.prisma.portalCustomer.findMany({
      where,
      include: {
        contact: true,
        tenant: true,
      },
    });

    return portalCustomers;
  }

  /**
   * Deactivate portal access for a customer
   */
  async deactivatePortalAccess(tenantId: string, portalCustomerId: string) {
    const portalCustomer = await this.prisma.portalCustomer.findFirst({
      where: {
        id: portalCustomerId,
        tenantId,
      },
    });

    if (!portalCustomer) {
      throw new NotFoundException('Portal customer not found');
    }

    await this.prisma.portalCustomer.update({
      where: { id: portalCustomerId },
      data: { isActive: false },
    });

    this.logger.log(
      `Deactivated portal access for customer ${portalCustomerId} in tenant ${tenantId}`,
    );

    return { message: 'Portal access deactivated successfully' };
  }

  /**
   * Get all portal customers for a tenant
   */
  async getPortalCustomers(tenantId: string, activeOnly = true) {
    return this.prisma.portalCustomer.findMany({
      where: {
        tenantId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
