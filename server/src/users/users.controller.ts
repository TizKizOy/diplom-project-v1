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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import type { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

@ApiTags('Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({ summary: 'Получить всех активных пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей',
    type: [Object],
  })
  async getAll(): Promise<IUser[]> {
    return await this.usersService.getAll();
  }

  @Roles(Role.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Получить удалённых пользователей' })
  @ApiResponse({ status: 200, description: 'Список удалённых пользователей' })
  async getDeleted(): Promise<IUser[]> {
    return await this.usersService.getDeleted();
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IUser> {
    return await this.usersService.getById(id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  @ApiOperation({ summary: 'Создать нового пользователя' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  async create(
    @Body() body: CreateUserDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IUser> {
    return await this.usersService.create(body, user.pkIdUser);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Put(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Пользователь обновлён' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IUser> {
    return await this.usersService.update(id, body, user.pkIdUser);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Пользователь помечен как удалённый',
  })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.usersService.remove(id, user.pkIdUser);
  }

  @Roles(Role.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Восстановить удалённого пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiResponse({ status: 200, description: 'Пользователь восстановлен' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.usersService.restore(id, user.pkIdUser);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Жёсткое удаление пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiResponse({ status: 200, description: 'Пользователь физически удалён' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.usersService.hardDelete(id, user.pkIdUser);
  }
}
