// Import User from @supabase/supabase-js (used by Supabase auth)
import type { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      // This adds the 'user' property to the Request object
      // It's populated by your SupabaseAuthGuard with the verified User object
      user?: User;
    }
  }
}

// Required to make this file a module
export {};
