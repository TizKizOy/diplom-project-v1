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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { IComment } from './interfaces/comment.interface';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить все активные комментарии' })
  async getAll(): Promise<IComment[]> {
    return await this.commentService.getAll();
  }

  @Get('task/:taskId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить комментарии по задаче' })
  async getByTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<IComment[]> {
    return await this.commentService.getByTask(taskId);
  }

  @Get('attempt/:attemptId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить комментарии по попытке' })
  async getByAttempt(
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ): Promise<IComment[]> {
    return await this.commentService.getByAttempt(attemptId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить комментарии по пользователю' })
  async getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IComment[]> {
    const canViewOtherUsers = user.roleName === Role.ADMIN || user.roleName === Role.TEACHER;
    if (!canViewOtherUsers && user.pkIdUser !== userId) {
      throw new ForbiddenException(
        'Нет прав на просмотр комментариев другого пользователя',
      );
    }

    return await this.commentService.getByUser(userId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые комментарии' })
  async getDeleted(): Promise<IComment[]> {
    return await this.commentService.getDeleted();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить комментарий по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IComment> {
    return await this.commentService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Создать комментарий' })
  async create(
    @Body() body: CreateCommentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IComment> {
    const canCreateForAnotherUser =
      user.roleName === Role.ADMIN || user.roleName === Role.TEACHER;
    if (!canCreateForAnotherUser && body.fkIdUser !== user.pkIdUser) {
      throw new ForbiddenException(
        'Нельзя создавать комментарий от имени другого пользователя',
      );
    }

    const safeBody = {
      ...body,
      fkIdUser: canCreateForAnotherUser ? body.fkIdUser : user.pkIdUser,
    };
    return await this.commentService.create(safeBody, user.pkIdUser);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Обновить комментарий' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCommentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IComment> {
    const existing = await this.commentService.getById(id);
    await this.assertCanMutateComment(existing, user);
    return await this.commentService.update(id, body, user.pkIdUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Soft-delete комментария' })
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IDeletedResult> {
    const existing = await this.commentService.getById(id);
    await this.assertCanMutateComment(existing, user);
    return await this.commentService.remove(id, user.pkIdUser);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить комментарий' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.commentService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление комментария' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.commentService.hardDelete(id, adminId);
  }

  private async assertCanMutateComment(
    comment: IComment,
    user: IJwtPayload,
  ): Promise<void> {
    if (user.roleName === Role.ADMIN || user.roleName === Role.TEACHER) {
      return;
    }
    if (user.roleName === Role.LISTENER) {
      if (comment.fkIdUser === user.pkIdUser) return;
      const mine = await this.commentService.getByUser(user.pkIdUser);
      if (mine.some((c) => c.pkIdComment === comment.pkIdComment)) return;
    }
    throw new ForbiddenException('Нет прав изменять или удалять этот комментарий');
  }
}
