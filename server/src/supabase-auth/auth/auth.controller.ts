import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthService } from '../supabase-auth/supabase-auth.service';
import { SupabaseAuthGuard } from '../guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthService } from '../../auth/auth.service';

class SignUpDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  workspaceName?: string;
  workspaceType?: string;
}

class SignInDto {
  email: string;
  password: string;
}

class ResetPasswordDto {
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private supabaseAuthService: SupabaseAuthService,
    private authService: AuthService,
  ) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        workspaceName,
        workspaceType,
      } = signUpDto;

      // Sign up user in Supabase
      const { data, error } = await this.supabaseAuthService.signUp(
        email,
        password,
        {
          firstName,
          lastName,
        },
      );

      if (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      // Create user and tenant in our database
      if (data.user) {
        const user = await this.authService.createUserFromSupabase(
          data.user.id,
          email,
          firstName,
          lastName,
          workspaceName || `${firstName}'s Workspace`,
          workspaceType || 'business',
        );

        return {
          user: data.user,
          dbUser: user,
          session: data.session,
        };
      }

      return data;
    } catch (error) {
      throw new HttpException(
        error.message || 'Sign up failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    try {
      const { email, password } = signInDto;

      const { data, error } = await this.supabaseAuthService.signIn(
        email,
        password,
      );

      if (error) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }

      // Get user from database
      const dbUser = await this.authService.getUserBySupabaseId(data.user.id);

      return {
        user: data.user,
        dbUser,
        session: data.session,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Sign in failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('signout')
  @UseGuards(SupabaseAuthGuard)
  async signOut() {
    try {
      const { error } = await this.supabaseAuthService.signOut();

      if (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      return { message: 'Signed out successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Sign out failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const { email } = resetPasswordDto;

      const { error } = await this.supabaseAuthService.resetPassword(email);

      if (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      return { message: 'Password reset email sent' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Password reset failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getCurrentUser(@CurrentUser() user: any) {
    try {
      // Get user from database
      const dbUser = await this.authService.getUserBySupabaseId(user.id);

      return {
        supabaseUser: user,
        dbUser,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('onboard')
  @UseGuards(SupabaseAuthGuard)
  async onboard(
    @CurrentUser() user: any,
    @Body() body: { tenantName: string },
  ) {
    try {
      const { tenantName } = body;

      if (!tenantName || !tenantName.trim()) {
        throw new HttpException(
          'Workspace name is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Extract user metadata from Supabase user
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const email = user.email as string;
      const firstName =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (user.user_metadata?.firstName as string) ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (user.user_metadata?.first_name as string) ||
        '';
      const lastName =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (user.user_metadata?.lastName as string) ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (user.user_metadata?.last_name as string) ||
        '';

      // Create user and workspace in database
      const dbUser = await this.authService.createUserFromSupabase(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        user.id as string,
        email,
        firstName,
        lastName,
        tenantName,
        'business',
      );

      return {
        message: 'Onboarding successful',
        user: dbUser,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Onboarding failed';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }
}
