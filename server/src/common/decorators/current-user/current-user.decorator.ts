import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';

// Note: Our global type file 'src/types/express/index.d.ts'
// is what makes 'request.user' available on the Request type.
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    // Debug logging
    console.log('CurrentUser decorator:', {
      hasUser: !!user,
      requestedField: data,
      userKeys: user ? Object.keys(user) : null,
    });

    if (!user) return null;
    return data ? user[data] : user;
  },
);
