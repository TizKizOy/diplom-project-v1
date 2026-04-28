import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IJwtPayload } from '../jwt/jwt-utils';

export const CurrentUser = createParamDecorator(
  <T extends keyof IJwtPayload>(data: T | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IJwtPayload | undefined;
    
    return data ? user?.[data] : user;
  },
);