import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CURRENT_USER_KEY = 'currentUser';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    const user = request[CURRENT_USER_KEY] as
      | Record<string, unknown>
      | undefined;
    return data ? user?.[data] : user;
  },
);
