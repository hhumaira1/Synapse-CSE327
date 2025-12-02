import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SupabaseAuthService } from '../../supabase-auth/supabase-auth/supabase-auth.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private supabaseAuthService: SupabaseAuthService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const authHeader = request.headers?.authorization as string | undefined;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify Supabase token
      const supabaseUser = await this.supabaseAuthService.verifyToken(token);

      if (!supabaseUser) {
        throw new UnauthorizedException('Invalid token');
      }

      // Check if this user is a super admin
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { supabaseUserId: supabaseUser.id },
      });

      if (!superAdmin) {
        throw new UnauthorizedException('Not authorized as super admin');
      }

      if (!superAdmin.isActive) {
        throw new UnauthorizedException('Super admin account is deactivated');
      }

      // Update last login
      await this.prisma.superAdmin.update({
        where: { id: superAdmin.id },
        data: { lastLoginAt: new Date() },
      });

      // Attach super admin to request
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.superAdmin = superAdmin;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.user = supabaseUser; // Keep Supabase user data too
      return true;
    } catch {
      throw new UnauthorizedException('Super admin authentication failed');
    }
  }
}
