import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { SupabaseAuthGuard } from 'src/supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from 'src/supabase-auth/decorators/current-user.decorator';
import { AuthService } from 'src/auth/auth.service';
import { UserRole } from 'prisma/generated/client';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) { }

  /**
   * Invite a new employee to the tenant
   * ADMIN and MANAGER can invite
   */
  @Post('invite')
  async inviteEmployee(
    @CurrentUser('id') supabaseUserId: string,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    // Get current user's details
    const currentUser = await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Only ADMIN and MANAGER can invite users
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Only admins and managers can invite new employees',
      );
    }

    return this.usersService.inviteEmployee(
      currentUser.tenantId,
      currentUser.id,
      inviteUserDto.email,
      inviteUserDto.role,
      inviteUserDto.name,
    );
  }

  /**
   * Accept employee invitation
   * Public endpoint (protected by invitation token validation)
   */
  @Post('accept-invite/:token')
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    // Extract user details from Supabase user object
    const supabaseUserId = user.id;
    const email = user.email;
    const firstName = user.user_metadata?.firstName || user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.lastName || user.user_metadata?.last_name || '';

    return this.usersService.acceptEmployeeInvitation(
      token,
      supabaseUserId,
      email,
      firstName,
      lastName,
    );
  }

  /**
   * Get all tenants accessible to current user
   */
  @Get('my-tenants')
  async getMyTenants(@CurrentUser('id') supabaseUserId: string) {
    return this.usersService.getUserTenants(supabaseUserId);
  }

  /**
   * Get all users in current tenant
   */
  @Get()
  async getTenantUsers(@CurrentUser('id') supabaseUserId: string) {
    const currentUser = await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.usersService.getTenantUsers(currentUser.tenantId);
  }

  /**
   * Get pending invitations for current tenant
   * ADMIN and MANAGER can view
   */
  @Get('invitations/pending')
  async getPendingInvitations(@CurrentUser('id') supabaseUserId: string) {
    const currentUser = await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Only admins and managers can view pending invitations',
      );
    }

    return this.usersService.getPendingInvitations(currentUser.tenantId);
  }

  /**
   * Cancel an invitation
   * ADMIN and MANAGER can cancel
   */
  @Delete('invitations/:id')
  async cancelInvitation(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') invitationId: string,
  ) {
    const currentUser = await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Only admins and managers can cancel invitations',
      );
    }

    return this.usersService.cancelInvitation(
      currentUser.tenantId,
      invitationId,
    );
  }

  /**
   * Update user role
   * ADMIN only
   */
  @Patch(':id/role')
  async updateUserRole(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') userId: string,
    @Body('role') newRole: UserRole,
  ) {
    const currentUser = await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    return this.usersService.updateUserRole(
      currentUser.tenantId,
      userId,
      newRole,
    );
  }

  @Get('me/profile')
  async getMyProfile(@CurrentUser('id') id: string) {
    const user = await this.authService.getUserBySupabaseId(id);
    return { ...user, tenant: { id: user.tenant.id, name: user.tenant.name } };
  }

  @Patch('me/profile')
  async updateMyProfile(@CurrentUser('id') id: string, @Body() data: { firstName?: string; lastName?: string }) {
    const user = await this.authService.getUserBySupabaseId(id);
    return this.usersService.updateUserProfile(user.id, data);
  }

  /**
   * Deactivate user
   * ADMIN only
   */
  @Delete(':id')
  async deactivateUser(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') userId: string,
  ) {
    const currentUser = await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    return this.usersService.deactivateUser(currentUser.tenantId, userId);
  }
}


