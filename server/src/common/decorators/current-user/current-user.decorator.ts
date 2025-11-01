import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@clerk/types';

// Note: Our global type file 'src/types/express/index.d.ts'
// is what makes 'request.user' available on the Request type.
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
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
