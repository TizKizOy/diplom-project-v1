import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyRefresh } from 'src/common/jwt/jwt-utils';

@Injectable()
export class RefreshGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh токен отсутствует');
    }

    try {
      const payload = verifyRefresh(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Недействительный или просроченный refresh токен',
      );
    }
  }
}
