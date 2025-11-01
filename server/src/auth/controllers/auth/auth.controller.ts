/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';
import type { JwtPayload } from '@clerk/types';
import { ClerkAuthGuard } from 'src/clerk/guards/clerk-auth/clerk-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('onboard')
  @UseGuards(ClerkAuthGuard) // ← Fixed: Added guard to protect route
  async onboard(
    @CurrentUser('sub') clerkId: string,
    @CurrentUser() fullUser: JwtPayload,
    @Body() body: { tenantName?: string },
  ) {
    // Log the received data for debugging
    console.log('Onboard request:', { clerkId, fullUser, body });

    // Validate that we have the user data
    if (!fullUser) {
      throw new BadRequestException('User authentication data not found');
    }

    if (!clerkId) {
      throw new BadRequestException('User ID not found in token');
    }

    console.log('Fetching full user details from Clerk API...');
    
    // Fetch complete user details from Clerk API
    let clerkUser: any;
    try {
      clerkUser = await this.authService.getClerkUser(clerkId);
      console.log('Clerk user fetched successfully:', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: clerkUser.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        hasEmailAddresses: !!clerkUser.emailAddresses?.length,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        primaryEmailId: clerkUser.primaryEmailAddressId,
      });
    } catch (error) {
      console.error('Failed to fetch user from Clerk:', error);
      throw new BadRequestException('Failed to fetch user details from Clerk');
    }

    // Extract primary email from Clerk user data
    let email: string | undefined;
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (clerkUser.emailAddresses && clerkUser.primaryEmailAddressId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const primaryEmail = clerkUser.emailAddresses.find(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (e: any) => e.id === clerkUser.primaryEmailAddressId,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      email = primaryEmail?.emailAddress;
    }

    // Fallback to first email if no primary email
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!email && clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      email = clerkUser.emailAddresses[0].emailAddress;
    }

    if (!email) {
      console.error('No email found in Clerk user data:', clerkUser);
      throw new BadRequestException('Email not found. Please ensure your email is verified in Clerk.');
    }

    // Determine name
    const name =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      email.split('@')[0] || // Use email username as fallback
      'Unknown User';

    console.log('Extracted user info:', { clerkId, email, name });

    // Check if user exists
    const existingUser = await this.authService.getUserDetails(clerkId);
    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      return { isNewUser: false, user: existingUser };
    }

    // Create initial tenant and admin user
    if (!body.tenantName?.trim()) {
      throw new BadRequestException('Tenant name is required');
    }

    console.log('Creating new tenant and user...');
    
    // Create initial tenant and admin user
    const { tenant, user } = await this.authService.createInitialUserAndTenant(
      clerkId,
      email,
      name,
      body.tenantName.trim(),
    );

    console.log('Successfully created:', { tenantId: tenant.id, userId: user.id });
    
    return { 
      message: 'Onboard successful', 
      isNewUser: true,
      tenant, 
      user 
    };
  }

  // Get current user details
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getMe(@CurrentUser('sub') clerkId: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) {
      throw new BadRequestException('User not found in database');
    }
    return user;
  }
}
