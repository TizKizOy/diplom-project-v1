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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

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

  @Get('search/email')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Найти пользователя по email' })
  @ApiQuery({ name: 'value', required: true, example: 'user@example.com' })
  async getByEmail(@Query('value') email: string): Promise<IUser> {
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new NotFoundException(`Пользователь с email ${email} не найден`);
    return user;
  }

  @Get('filter')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Универсальный поиск (роль + ...)' })
  @ApiQuery({ name: 'roleId', required: false, type: Number })
  async getByFilter(@Query('roleId') roleId?: string): Promise<IUser[]> {
    return await this.usersService.getUsers({
      roleId: roleId ? parseInt(roleId) : undefined,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IUser> {
    return await this.usersService.getById(id);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённых пользователей' })
  async getDeleted(): Promise<IUser[]> {
    return await this.usersService.getDeleted();
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
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить пользователя' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IUser> {
    return await this.usersService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete пользователя' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.usersService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить пользователя' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.usersService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление пользователя' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.usersService.hardDelete(id, adminId);
  }
}
