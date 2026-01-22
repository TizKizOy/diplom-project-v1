import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { comparingPassword } from 'src/common/hash/crypto';
import {
  generatePayload,
  signAccess,
  signRefresh,
  verifyRefresh,
} from 'src/common/jwt/jwt-utils';
import { RegisterDto } from './dto/register.dto';
import { createUser, getUser } from 'src/users/db/users.db';

@Injectable()
export class AuthService {
  async login(login: string, password: string) {
    const findUser = await getUser({ login: login });
    if (!findUser) throw new NotFoundException('Сервер не получил админа с бд');

    const isPasswordValid = await comparingPassword(
      password,
      findUser.passwordHash,
    );
    if (!isPasswordValid) throw new Error('Неверный пароль');

    const payload = generatePayload(findUser);
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    return { findUser, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const decodedPayload = verifyRefresh(refreshToken);

    const payload = generatePayload(decodedPayload);
    const newAccessToken = signAccess(payload);
    const newRefreshToken = signRefresh(payload);

    return { newAccessToken, newRefreshToken };
  }

  async register(dto: RegisterDto) {
    try {
      const createdUser = await createUser({ roleId: 3, ...dto });
      if (!createdUser) throw new NotFoundException('createUser exception');

      const payload = generatePayload(createdUser);
      const accessToken = signAccess(payload);
      const refreshToken = signRefresh(payload);

      return { createdUser, accessToken, refreshToken };
    } catch (e: any) {
      if (e.code === '23505') {
        const field = e.constraint?.replace(/^tbusers_+|_key$/g, '');
        throw new ConflictException(`Поле ${field} уже существует`);
      }
      throw e;
    }
  }
}
