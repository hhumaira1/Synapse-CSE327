import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseAuthService } from '../../supabase-auth/supabase-auth.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabaseAuthService: SupabaseAuthService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Check if this is a Telegram pseudo-JWT
      if (token.startsWith('telegram:')) {
        const parts = token.split(':');
        if (parts.length !== 3) {
          throw new UnauthorizedException('Invalid Telegram token format');
        }

        const [, userId, tenantId] = parts;

        // Verify user exists in database
        const dbUser = await this.prisma.user.findFirst({
          where: {
            id: userId,
            tenantId: tenantId,
            isActive: true,
          },
          include: {
            tenant: true,
          },
        });

        if (!dbUser) {
          throw new UnauthorizedException('Telegram user not found or inactive');
        }

        // Create a Supabase-compatible user object
        const user = {
          id: dbUser.supabaseUserId,
          email: dbUser.email,
          user_metadata: {
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            name: dbUser.name,
          },
        };

        // Attach user to request object
        request.user = user;
        return true;
      }

      // Regular Supabase JWT
      const user = await this.supabaseAuthService.verifyToken(token);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user to request object
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
