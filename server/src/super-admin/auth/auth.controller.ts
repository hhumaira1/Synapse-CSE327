import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CurrentSuperAdmin } from '../decorators/current-super-admin.decorator';
import type { SuperAdmin } from 'prisma/generated/client';

@Controller('super-admin/auth')
@UseGuards(SuperAdminGuard)
export class SuperAdminAuthController {
  @Get('me')
  async getMe(@CurrentSuperAdmin() superAdmin: SuperAdmin) {
    return {
      id: superAdmin.id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      isActive: superAdmin.isActive,
      lastLoginAt: superAdmin.lastLoginAt,
    };
  }
}
