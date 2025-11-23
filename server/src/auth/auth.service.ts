import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { UserRole, TenantType } from 'prisma/generated/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user and tenant from Supabase signup
   */
  async createUserFromSupabase(
    supabaseUserId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    workspaceName?: string,
    workspaceType?: string,
  ) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { supabaseUserId },
      include: { tenant: true },
    });

    if (existingUser) {
      return existingUser;
    }

    // Map workspace type to TenantType enum
    const tenantType = this.mapToTenantType(workspaceType);

    // Generate slug from workspace name
    const slug = this.generateSlug(workspaceName || `${firstName}'s Workspace`);

    // Create tenant first
    const tenant = await this.prisma.tenant.create({
      data: {
        name: workspaceName || `${firstName}'s Workspace`,
        slug,
        type: tenantType,
        domain: email.split('@')[1], // Use email domain as tenant domain
      },
    });

    // Create user and associate with tenant
    const user = await this.prisma.user.create({
      data: {
        supabaseUserId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: UserRole.ADMIN, // First user is admin
        tenantId: tenant.id,
      },
      include: { tenant: true },
    });

    return user;
  }

  /**
   * Get user by Supabase user ID
   */
  async getUserBySupabaseId(supabaseUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseUserId },
      include: { tenant: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get user details (alias for getUserBySupabaseId)
   */
  async getUserDetails(supabaseUserId: string) {
    return this.getUserBySupabaseId(supabaseUserId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    return user;
  }

  /**
   * Update user metadata
   */
  async updateUser(
    supabaseUserId: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: UserRole;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { supabaseUserId },
      data,
      include: { tenant: true },
    });

    return user;
  }

  /**
   * Map workspace type string to TenantType enum
   */
  private mapToTenantType(workspaceType?: string): TenantType {
    switch (workspaceType?.toLowerCase()) {
      case 'organization':
        return TenantType.ORGANIZATION;
      case 'personal':
        return TenantType.PERSONAL;
      case 'business':
        return TenantType.BUSINESS;
      default:
        return TenantType.BUSINESS;
    }
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .concat('-', Math.random().toString(36).substring(2, 7));
  }
}
