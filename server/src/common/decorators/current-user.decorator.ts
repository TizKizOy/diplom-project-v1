import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IJwtPayload } from '../jwt/jwt-utils';

export const CurrentUser = createParamDecorator(
  (data: keyof any | undefined, ctx: ExecutionContext): IJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);
