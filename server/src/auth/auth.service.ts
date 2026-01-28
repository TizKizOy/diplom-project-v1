import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { comparingPassword } from 'src/common/hash/crypto';
import {
  generatePayload,
  signAccess,
  signRefresh,
  verifyRefresh,
} from 'src/common/jwt/jwt-utils';
import { RegisterDto } from './dto/register.dto';
import { getUser, createUser } from 'src/users/db/users.db';

@Injectable()
export class AuthService {
  async login(login: string, password: string) {
    const user = await getUser({ login });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isValid = await comparingPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Неверный пароль');
    }

    const payload = generatePayload(user);

    return {
      accessToken: signAccess(payload),
      refreshToken: signRefresh(payload),
    };
  }

  async register(dto: RegisterDto) {
    try {
      const user = await createUser({ ...dto, roleId: 3 }, null as any);

      const payload = generatePayload(user);

      return {
        accessToken: signAccess(payload),
        refreshToken: signRefresh(payload),
      };
    } catch (e: any) {
      if (e.code === '23505' || e.message?.includes('уже занят')) {
        const field = e.constraint?.match(/tbUsers_(.+)_key/)?.[1] || 'Поле';
        throw new ConflictException(`${field} уже существует`);
      }
      throw e;
    }
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = verifyRefresh(refreshToken);
      const user = await getUser({ id: decoded.pkIdUser });

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      const payload = generatePayload(user);
      return {
        newAccessToken: signAccess(payload),
        newRefreshToken: signRefresh(payload),
      };
    } catch {
      throw new UnauthorizedException('Недействительный refresh токен');
    }
  }
}
