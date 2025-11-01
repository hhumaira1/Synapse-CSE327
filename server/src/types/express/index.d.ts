// Import JwtPayload from @clerk/types (used by @clerk/backend)
import type { JwtPayload } from '@clerk/types';

declare global {
  namespace Express {
    interface Request {
      // This adds the 'user' property to the Request object
      // It's populated by your ClerkAuthGuard with the verified JWT payload
      user?: JwtPayload;
    }
  }
}

// Required to make this file a module
export {};
