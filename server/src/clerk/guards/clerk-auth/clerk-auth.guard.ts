import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClerkService } from 'src/clerk/clerk/clerk.service';
import { JwtPayload } from '@clerk/types';
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    console.log(
      'ClerkAuthGuard - Auth header:',
      authHeader ? 'Present' : 'Missing',
    );

    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      console.log('ClerkAuthGuard - Invalid auth header');
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      console.log('ClerkAuthGuard - Empty token');
      throw new UnauthorizedException('Empty bearer token');
    }

    console.log('ClerkAuthGuard - Token length:', token.length);

    try {
      // Our global type file 'src/types/express/index.d.ts'
      // ensures 'request.user' is valid TypeScript
      const payload = await this.clerkService.verifyToken(token);
      console.log(
        'ClerkAuthGuard - Token verified, payload keys:',
        payload ? Object.keys(payload) : 'null',
      );

      request.user = payload as JwtPayload; // <-- Attaching user payload to request
      console.log('ClerkAuthGuard - User attached to request:', !!request.user);

      return true;
    } catch (error) {
      console.log(
        'ClerkAuthGuard - Token verification failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
