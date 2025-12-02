import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class SuperAdminAuthService {
  constructor(private prisma: PrismaService) {}

  async getSuperAdminBySupabaseId(supabaseUserId: string) {
    return this.prisma.superAdmin.findUnique({
      where: { supabaseUserId },
    });
  }

  async getSuperAdminById(id: string) {
    return this.prisma.superAdmin.findUnique({
      where: { id },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.superAdmin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
