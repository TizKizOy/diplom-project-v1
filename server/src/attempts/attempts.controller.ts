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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { CourseTeachersService } from 'src/course-teachers/course-teachers.service';
import { GroupsService } from 'src/groups/groups.service';
import { IAttempt } from './interfaces/attempts.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { UpdateAttemptDto } from './dto/update-attempt.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

/** Числовой id из строки БД / recordset (camelCase и PascalCase). */
function rowInt(row: object, ...keys: string[]): number | undefined {
  const r = row as Record<string, unknown>;
  for (const k of keys) {
    const v = r[k];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

@ApiTags('Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(
    private readonly attemptsService: AttemptsService,
    private readonly courseTeachersService: CourseTeachersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Получить все попытки',
    description: 'Доступно администратору и преподавателю. Для аналитики по курсам преподавателя используйте GET /attempts/course/:courseId.',
  })
  async getAll(): Promise<IAttempt[]> {
    return await this.attemptsService.getAll();
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Получить попытки по заданию' })
  async getByTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('roleName') roleName: string,
  ): Promise<IAttempt[]> {
    const canViewByTask = roleName === Role.ADMIN || roleName === Role.TEACHER;
    if (!canViewByTask) {
      throw new ForbiddenException('Нет прав на просмотр попыток по заданию');
    }

    return await this.attemptsService.getByTask(taskId);
  }

  @Get('listener/:listenerId')
  @ApiOperation({ summary: 'Получить попытки слушателя' })
  async getByListener(
    @Param('listenerId', ParseIntPipe) listenerId: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IAttempt[]> {
    const canViewOtherListeners =
      user.roleName === Role.ADMIN || user.roleName === Role.TEACHER;
    if (!canViewOtherListeners && user.pkIdUser !== listenerId) {
      throw new ForbiddenException(
        'Нет прав на просмотр попыток другого слушателя',
      );
    }

    return await this.attemptsService.getByListener(listenerId);
  }

  @Get('status/:statusId')
  @ApiOperation({
    summary:
      'Получить попытки по статусу: 1-На проверке, 2-Принято, 3-Отклонено, 4-На доработке',
  })
  async getByStatus(
    @Param('statusId', ParseIntPipe) statusId: number,
    @CurrentUser('roleName') roleName: string,
  ): Promise<IAttempt[]> {
    const canViewByStatus = roleName === Role.ADMIN || roleName === Role.TEACHER;
    if (!canViewByStatus) {
      throw new ForbiddenException('Нет прав на просмотр попыток по статусу');
    }

    return await this.attemptsService.getByStatus(statusId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые попытки' })
  async getDeleted(): Promise<IAttempt[]> {
    return await this.attemptsService.getDeleted();
  }

  @Get('course/:courseId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Попытки по курсу',
    description:
      'Администратор — любой курс. Преподаватель — только курс, за который он закреплён.',
  })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IAttempt[]> {
    const courseNum = Number(courseId);
    if (user.roleName === Role.TEACHER) {
      const userId = Number(user.pkIdUser);
      const onThisCourse =
        await this.courseTeachersService.getByCourse(courseNum);
      let allowed = onThisCourse.some((r) => {
        const tid = rowInt(r, 'fkIdTeacher', 'FkIdTeacher');
        return tid === userId;
      });
      if (!allowed) {
        const assigned =
          await this.courseTeachersService.getByTeacher(userId);
        allowed = assigned.some((a) => {
          const cid = rowInt(a, 'fkIdCourse', 'FkIdCourse');
          return cid === courseNum;
        });
      }
      if (!allowed) {
        const groups = await this.groupsService.getByCourse(courseNum);
        allowed = groups.some((g) => {
          const cur = rowInt(g, 'fkIdCurator', 'FkIdCurator');
          return cur === userId;
        });
      }
      if (!allowed) {
        throw new ForbiddenException('Нет доступа к попыткам по этому курсу');
      }
    }
    return await this.attemptsService.getByCourse(courseNum);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить попытку по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IAttempt> {
    return await this.attemptsService.getById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать попытку (сдать задание)',
    description:
      'Проверяет наличие активных попыток. Если есть активная (На проверке/Принято/Возвращено) - ошибка.',
  })
  async create(
    @Body() body: CreateAttemptDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IAttempt> {
    const canCreateForAnyListener =
      user.roleName === Role.ADMIN || user.roleName === Role.TEACHER;
    if (!canCreateForAnyListener && body.listenerId !== user.pkIdUser) {
      throw new ForbiddenException(
        'Нельзя создавать попытку от имени другого слушателя',
      );
    }

    const safeBody = {
      ...body,
      listenerId: canCreateForAnyListener ? body.listenerId : user.pkIdUser,
    };
    return await this.attemptsService.create(safeBody, user.pkIdUser);
  }

  @Put(':id/resubmit')
  @Roles(Role.LISTENER)
  @ApiOperation({ summary: 'Повторная отправка работы (статус «На доработке»)' })
  async resubmit(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Pick<CreateAttemptDto, 'answerText' | 'answerFileUrl'>,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IAttempt> {
    return await this.attemptsService.resubmit(id, body, user.pkIdUser);
  }

  @Put(':id/grade')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Оценить попытку (score/statusId)' })
  async grade(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAttemptDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IAttempt> {
    if (user.roleName === Role.LISTENER) {
      const attempt = await this.attemptsService.getById(id);
      if (attempt.fkIdListener !== user.pkIdUser) {
        throw new ForbiddenException('Нельзя выставлять оценку по чужой попытке');
      }
    }
    return await this.attemptsService.update(id, body, user.pkIdUser);
  }


  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить попытку' })
  @ApiBody({
  type: UpdateAttemptDto,
  examples: {
    'Пример обновления': {
      value: {
        statusId: 4,
        answerText: "Почти идеально",
        score: 85
      }
    }
  }
})
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAttemptDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IAttempt> {
    return await this.attemptsService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete попытки' })
  async deleteAttempt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.attemptsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить попытку' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.attemptsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление попытки' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.attemptsService.hardDelete(id, adminId);
  }
}
