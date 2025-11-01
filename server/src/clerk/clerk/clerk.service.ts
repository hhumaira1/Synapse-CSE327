/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  readonly client = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  /**
   * Verifies a Clerk JWT token and returns the payload.
   * Handles both v1 (direct payload) and v2 (result object) API formats.
   */
  async verifyToken(token: string) {
    try {
      console.log('ClerkService - Starting token verification');
      console.log(
        'ClerkService - Secret key present:',
        !!process.env.CLERK_SECRET_KEY,
      );

      const result = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      console.log('ClerkService - Verification result received');
      console.log('ClerkService - Result type:', typeof result);
      console.log(
        'ClerkService - Result is object:',
        typeof result === 'object',
      );

      // Handle different API versions
      let payload: any = null;

      if (result && typeof result === 'object') {
        // Check if it's v2 format with data/errors structure
        if ('data' in result || 'errors' in result) {
          console.log('ClerkService - V2 API format detected');

          if ('errors' in result && result.errors) {
            console.log('ClerkService - Verification errors:', result.errors);
            throw new UnauthorizedException('Token verification failed');
          }

          payload = 'data' in result ? result.data : null;
          console.log(
            'ClerkService - Extracted payload from data field:',
            !!payload,
          );
        } else {
          // V1 format - result is the payload directly
          console.log('ClerkService - V1 API format detected');
          payload = result;
        }
      } else {
        console.log('ClerkService - Unexpected result format');
      }

      if (payload && typeof payload === 'object') {
        console.log(
          'ClerkService - Final payload keys:',
          Object.keys(payload as Record<string, unknown>),
        );

        // Log the user ID if available
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const userId =
          typeof payload === 'object' &&
          payload !== null &&
          'sub' in payload &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          typeof payload.sub === 'string'
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              payload.sub
            : 'unknown';
        this.logger.log(`Token verified successfully for user: ${userId}`);
      } else {
        console.log('ClerkService - No valid payload found');
      }

      console.log('ClerkService - Returning payload:', !!payload);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return payload;
    } catch (error) {
      console.log('ClerkService - Exception caught:', error);
      this.logger.error('Clerk token verification error', error);
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
