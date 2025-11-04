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
import { ClerkAuthGuard } from 'src/clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { UserRole } from 'prisma/generated/client';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Invite a new employee to the tenant
   * ADMIN and MANAGER can invite
   */
  @Post('invite')
  async inviteEmployee(
    @CurrentUser('sub') clerkId: string,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    // Get current user's details
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Only ADMIN and MANAGER can invite users
    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only admins and managers can invite new employees');
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
    @CurrentUser('sub') clerkId: string,
  ) {
    return this.usersService.acceptEmployeeInvitation(token, clerkId);
  }

  /**
   * Get all users in current tenant
   */
  @Get()
  async getTenantUsers(@CurrentUser('sub') clerkId: string) {
    const currentUser = await this.authService.getUserDetails(clerkId);

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
  async getPendingInvitations(@CurrentUser('sub') clerkId: string) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only admins and managers can view pending invitations');
    }

    return this.usersService.getPendingInvitations(currentUser.tenantId);
  }

  /**
   * Cancel an invitation
   * ADMIN and MANAGER can cancel
   */
  @Delete('invitations/:id')
  async cancelInvitation(
    @CurrentUser('sub') clerkId: string,
    @Param('id') invitationId: string,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only admins and managers can cancel invitations');
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
    @CurrentUser('sub') clerkId: string,
    @Param('id') userId: string,
    @Body('role') newRole: UserRole,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

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

  /**
   * Deactivate user
   * ADMIN only
   */
  @Delete(':id')
  async deactivateUser(
    @CurrentUser('sub') clerkId: string,
    @Param('id') userId: string,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    return this.usersService.deactivateUser(currentUser.tenantId, userId);
  }
}
