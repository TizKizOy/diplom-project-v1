import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({ summary: 'Получить всех активных пользователей' })
  async getAll(): Promise<IUser[]> {
    return await this.usersService.getAll();
  }

  @Get('role/:roleId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Получить пользователей по роли: 1-Админ, 2-Препод, 3-Слушатель',
  })
  async getByRole(
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<IUser[]> {
    return await this.usersService.getByRole(roleId);
  }

  @Get('search/login')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Найти пользователя по логину' })
  @ApiQuery({ name: 'value', required: true, example: 'ivanov' })
  async getByLogin(@Query('value') login: string): Promise<IUser> {
    const user = await this.usersService.findByLogin(login);
    if (!user)
      throw new NotFoundException(`Пользователь с логином ${login} не найден`);
    return user;
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённых пользователей' })
  async getDeleted(): Promise<IUser[]> {
    return await this.usersService.getDeleted();
  }

  @Get('messaging-contacts')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({
    summary: 'Контакты для личных сообщений',
    description:
      'Администратор — все пользователи. Преподаватель — админы, слушатели в группах куратора и на своих курсов, коллеги по курсу. Слушатель — администраторы, кураторы групп и преподаватели курсов, на которые записан.',
  })
  async getMessagingContacts(
    @CurrentUser() user: IJwtPayload,
  ): Promise<IUser[]> {
    return await this.usersService.getMessagingContacts(
      user.pkIdUser,
      user.roleName,
    );
  }

  @Put('me')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Обновить свой профиль' })
  async updateMe(
    @Body() body: UpdateUserDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IUser> {
    const { roleId, login, ...rest } = body;
    if (roleId !== undefined) {
      throw new BadRequestException('Нельзя менять роль через профиль');
    }
    if (user.roleName !== Role.ADMIN && login !== undefined) {
      throw new BadRequestException('Логин может изменить только администратор');
    }
    const dto: UpdateUserDto =
      user.roleName === Role.ADMIN ? body : { ...rest, ...(login ? { login } : {}) };
    return await this.usersService.update(user.pkIdUser, dto, user.pkIdUser);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IUser> {
    if (user.roleName !== Role.ADMIN && user.roleName !== Role.TEACHER && user.pkIdUser !== id) {
      throw new ForbiddenException('Нет прав на просмотр профиля другого пользователя');
    }
    return await this.usersService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Создать пользователя' })
  async create(
    @Body() body: CreateUserDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IUser> {
    return await this.usersService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Обновить пользователя' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IUser> {
    if (user.roleName !== Role.ADMIN && user.pkIdUser !== id) {
      throw new ForbiddenException('Нет прав на изменение чужого профиля');
    }
    if (user.roleName !== Role.ADMIN) {
      const { roleId, login, ...rest } = body;
      if (roleId !== undefined) {
        throw new BadRequestException('Нельзя менять роль');
      }
      if (login !== undefined) {
        throw new BadRequestException('Логин может изменить только администратор');
      }
      return await this.usersService.update(id, rest, user.pkIdUser);
    }
    return await this.usersService.update(id, body, user.pkIdUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete пользователя' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.usersService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить пользователя' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.usersService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление пользователя' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.usersService.hardDelete(id, adminId);
  }
}
