import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

@ApiTags('Authorization')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход в систему (логин + пароль)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход',
    schema: {
      example: {
        message: 'Вход выполнен успешно',
        user: {
          id: 1,
          fullName: 'Иванов Иван',
          role: 'Слушатель',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверный пароль' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 403, description: 'Пользователь удален' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      dto.login,
      dto.password,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Вход выполнен успешно',
      user,
    };
  }

  @Post('register')
  @ApiOperation({
    summary: 'Регистрация нового пользователя (роль: Слушатель)',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Успешная регистрация',
    schema: {
      example: {
        message: 'Регистрация успешна',
        user: {
          id: 5,
          fullName: 'Иванов Иван',
          role: 'Слушатель',
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Логин или Email уже занят' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Регистрация успешна',
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Выход из системы (очистка cookies)' })
  @ApiResponse({ status: 200, description: 'Выход выполнен успешно' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Выход выполнен' };
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  @ApiOperation({ summary: 'Обновление access токена по refresh токену' })
  @ApiResponse({ status: 200, description: 'Токены обновлены' })
  @ApiResponse({ status: 401, description: 'Недействительный refresh токен' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies.refreshToken;
    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Токены обновлены' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить данные текущего авторизованного пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя',
    schema: {
      example: {
        pkIdUser: 1,
        fullName: 'Иванов Иван Иванович',
        login: 'ivanov',
        roleName: 'Слушатель',
        iat: 1234567890,
        exp: 1234567980,
      },
    },
  })
  async getMe(@CurrentUser() user: IJwtPayload) {
    return this.authService.getProfile(user.pkIdUser);
  }
}
