import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyAccess } from 'src/common/jwt/jwt-utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException(
        'Access токен отсутствует. Требуется авторизация.',
      );
    }

    try {
      const payload = verifyAccess(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Недействительный или просроченный access токен',
      );
    }
  }
}
