import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { comparingPassword } from 'src/common/hash/crypto';
import {
  generatePayload,
  signAccess,
  signRefresh,
  verifyRefresh,
  type IJwtPayload,
} from 'src/common/jwt/jwt-utils';
import { RegisterDto } from './dto/register.dto';
import { findUserByLogin, createUserFromAuth } from './db/auth.db';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}
  async login(login: string, password: string) {
    const user = await findUserByLogin(login);

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
      user: {
        id: user.pkIdUser,
        fullName: user.fullName,
        role: user.roleName,
        position: user.positionName ?? undefined,
      },
    };
  }

  async register(dto: RegisterDto) {
    try {
      const user = await createUserFromAuth(dto);

      const payload = generatePayload(user);

      return {
        accessToken: signAccess(payload),
        refreshToken: signRefresh(payload),
        user: {
          id: user.pkIdUser,
          fullName: user.fullName,
          role: user.roleName,
        },
      };
    } catch (e: any) {
      if (e.message && e.message.includes('уже занят')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка регистрации');
    }
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = verifyRefresh(refreshToken);
      const user = await findUserByLogin(decoded.login);

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      const payload = generatePayload(user);
      return {
        accessToken: signAccess(payload),
        refreshToken: signRefresh(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Недействительный refresh токен');
    }
  }

  /** Актуальные данные из БД (JWT при логине может устареть после правки профиля). */
  async getProfile(userId: number): Promise<IJwtPayload> {
    const user = await this.usersService.getById(userId);
    return generatePayload(user);
  }
}
