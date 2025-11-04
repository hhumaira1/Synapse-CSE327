import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ClerkService } from 'src/clerk/clerk/clerk.service';
import { EmailService } from 'src/common/services/email/email.service';
import { UserRole } from 'prisma/generated/client';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkService: ClerkService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Check if an email is already used by an internal user globally
   * RULE: ONE EMAIL = ONE INTERNAL USER GLOBALLY
   */
  async isEmailUsedByInternalUser(email: string): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return !!existingUser;
  }

  /**
   * Invite a new employee to the tenant
   * VALIDATION: Email must not exist in User table globally
   */
  async inviteEmployee(
    tenantId: string,
    invitedByUserId: string,
    email: string,
    role: UserRole,
    name: string,
  ) {
    const normalizedEmail = email.toLowerCase();

    // 1. Check if email is already used by another internal user globally
    const existingUser = await this.isEmailUsedByInternalUser(normalizedEmail);
    if (existingUser) {
      throw new ConflictException(
        'This email is already registered as an internal user in another organization. Each email can only be an employee of one company.',
      );
    }

    // 2. Check if there's already a pending invitation for this email in this tenant
    const existingInvitation = await this.prisma.userInvitation.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: normalizedEmail,
        },
      },
    });

    if (existingInvitation && !existingInvitation.acceptedAt) {
      // Check if invitation is still valid
      if (existingInvitation.expiresAt > new Date()) {
        throw new ConflictException(
          'An invitation has already been sent to this email address and is still valid.',
        );
      }
      // Delete expired invitation
      await this.prisma.userInvitation.delete({
        where: { id: existingInvitation.id },
      });
    }

    // 3. Generate unique invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // 4. Create invitation record
    const invitation = await this.prisma.userInvitation.create({
      data: {
        tenantId,
        email: normalizedEmail,
        role,
        invitedBy: invitedByUserId,
        token,
        expiresAt,
      },
      include: {
        tenant: true,
        invitedByUser: true,
      },
    });

    // 5. Send invitation email via Nodemailer
    try {
      const inviterUser = await this.prisma.user.findUnique({
        where: { id: invitedByUserId },
        select: { name: true },
      });

      await this.emailService.sendEmployeeInvitation(
        normalizedEmail,
        invitation.tenant.name,
        inviterUser?.name || 'Team Admin',
        token,
        role,
      );

      this.logger.log(
        `Employee invitation email sent to ${normalizedEmail} for tenant ${tenantId}`,
      );
    } catch (error) {
      // If email fails, delete the database invitation
      await this.prisma.userInvitation.delete({
        where: { id: invitation.id },
      });
      this.logger.error('Failed to send invitation email:', error);
      throw new BadRequestException(
        'Failed to send invitation email. Please check email configuration.',
      );
    }

    return {
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        tenantName: invitation.tenant.name,
      },
    };
  }

  /**
   * Accept employee invitation and create User record
   */
  async acceptEmployeeInvitation(token: string, clerkId: string) {
    // 1. Find invitation
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    // 2. Check if already accepted
    if (invitation.acceptedAt) {
      throw new BadRequestException(
        'This invitation has already been accepted',
      );
    }

    // 3. Check if expired
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    // 4. Get user details from Clerk
    const clerkUser = await this.clerkService.client.users.getUser(clerkId);
    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress || invitation.email;

    // 5. Verify email matches invitation
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'The email address you signed up with does not match the invitation',
      );
    }

    // 6. Check if email is already used (double-check)
    const existingUser = await this.isEmailUsedByInternalUser(email);
    if (existingUser) {
      throw new ConflictException(
        'This email is already registered as an internal user',
      );
    }

    // 7. Create User record
    const user = await this.prisma.user.create({
      data: {
        tenantId: invitation.tenantId,
        clerkId,
        email: email.toLowerCase(),
        name:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
          email.split('@')[0],
        role: invitation.role,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    });

    // 8. Mark invitation as accepted
    await this.prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    this.logger.log(
      `User ${user.email} accepted invitation and joined tenant ${user.tenantId}`,
    );

    return {
      message: 'Invitation accepted successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
        },
      },
    };
  }

  /**
   * Get all tenants accessible to a user (internal + customer portals)
   */
  async getUserTenants(clerkId: string) {
    // 1. Find internal user access
    const internalUser = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });

    // 2. Find customer portal access
    const portalAccess = await this.prisma.portalCustomer.findMany({
      where: { clerkId },
      include: { tenant: true },
    });

    const tenants: Array<
      | {
          id: string;
          name: string;
          slug: string;
          type: 'internal';
          role: UserRole;
          userId: string;
        }
      | {
          id: string;
          name: string;
          slug: string;
          type: 'customer';
          role: 'CUSTOMER';
          portalCustomerId: string;
        }
    > = [];

    // Add internal user tenant
    if (internalUser) {
      tenants.push({
        id: internalUser.tenant.id,
        name: internalUser.tenant.name,
        slug: internalUser.tenant.slug,
        type: 'internal' as const,
        role: internalUser.role,
        userId: internalUser.id,
      });
    }

    // Add portal customer tenants
    for (const portal of portalAccess) {
      tenants.push({
        id: portal.tenant.id,
        name: portal.tenant.name,
        slug: portal.tenant.slug,
        type: 'customer' as const,
        role: 'CUSTOMER' as const,
        portalCustomerId: portal.id,
      });
    }

    return tenants;
  }

  /**
   * Get all users in a tenant
   */
  async getTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get pending invitations for a tenant
   */
  async getPendingInvitations(tenantId: string) {
    return this.prisma.userInvitation.findMany({
      where: {
        tenantId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        invitedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Cancel/delete an invitation
   */
  async cancelInvitation(tenantId: string, invitationId: string) {
    const invitation = await this.prisma.userInvitation.findFirst({
      where: {
        id: invitationId,
        tenantId,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Cannot cancel an accepted invitation');
    }

    await this.prisma.userInvitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation cancelled successfully' };
  }

  /**
   * Update user role (ADMIN only)
   */
  async updateUserRole(tenantId: string, userId: string, newRole: UserRole) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    // Prevent removing the last admin
    if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: {
          tenantId,
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot change role of the last admin. Promote another user first.',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return updatedUser;
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    // Prevent removing the last admin
    if (user.role === UserRole.ADMIN) {
      const activeAdminCount = await this.prisma.user.count({
        where: {
          tenantId,
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        throw new BadRequestException(
          'Cannot deactivate the last admin. Promote another user first.',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return updatedUser;
  }
}
