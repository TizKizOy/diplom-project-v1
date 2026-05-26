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
import { TestAnswersService } from './test-answers.service';
import {
  ITestAnswer,
  IBulkCreateResult,
} from './interfaces/test-answers.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateTestAnswerDto } from './dto/create-test-answer.dto';
import { UpdateTestAnswerDto } from './dto/update-test-answer.dto';
import { BulkCreateTestAnswersDto } from './dto/bulk-create-test-answers.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';
import { AttemptsService } from 'src/attempts/attempts.service';
import type { IAttempt } from 'src/attempts/interfaces/attempts.interfaces';

@ApiTags('Test Answers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('test-answers')
export class TestAnswersController {
  constructor(
    private readonly testAnswersService: TestAnswersService,
    private readonly attemptsService: AttemptsService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить все ответы на вопросы тестов' })
  async getAll(): Promise<ITestAnswer[]> {
    return await this.testAnswersService.getAll();
  }

  @Get('attempt/:attemptId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить ответы по ID попытки' })
  async getByAttempt(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<ITestAnswer[]> {
    if (user.roleName === Role.LISTENER) {
      const attempt = await this.attemptsService.getById(attemptId);
      const row = attempt as IAttempt & { FkIdListener?: number };
      const listenerId = Number(row.fkIdListener ?? row.FkIdListener);
      if (listenerId !== user.pkIdUser) {
        throw new ForbiddenException('Нет прав на просмотр ответов этой попытки');
      }
    }
    return await this.testAnswersService.getByAttempt(attemptId);
  }

  @Get('question/:questionId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить ответы по ID вопроса (статистика)' })
  async getByQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<ITestAnswer[]> {
    return await this.testAnswersService.getByQuestion(questionId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые ответы' })
  async getDeleted(): Promise<ITestAnswer[]> {
    return await this.testAnswersService.getDeleted();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить ответ по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ITestAnswer> {
    return await this.testAnswersService.getById(id);
  }

  /** Регистрируем до @Post(), чтобы путь bulk не пересёкся с общими правилами. */
  @Post('bulk')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({
    summary: 'Массовое создание ответов (завершение теста)',
    description: 'Передаётся массив ответов для одной попытки',
  })
  async bulkCreate(
    @Body() body: BulkCreateTestAnswersDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IBulkCreateResult> {
    if (user.roleName === Role.LISTENER) {
      const attempt = await this.attemptsService.getById(body.attemptId);
      const row = attempt as IAttempt & { FkIdListener?: number };
      const listenerId = Number(row.fkIdListener ?? row.FkIdListener);
      if (listenerId !== user.pkIdUser) {
        throw new ForbiddenException('Нельзя сохранять ответы к чужой попытке');
      }
    }
    return await this.testAnswersService.bulkCreate(body, user.pkIdUser);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Создать ответ на вопрос теста',
    description:
      'Один ответ на один вопрос в рамках попытки. Дубликаты запрещены.',
  })
  async create(
    @Body() body: CreateTestAnswerDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITestAnswer> {
    return await this.testAnswersService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить ответ (изменить выбранный вариант)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTestAnswerDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITestAnswer> {
    return await this.testAnswersService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete ответа' })
  async deleteTestAnswer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.testAnswersService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить ответ' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.testAnswersService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление ответа' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.testAnswersService.hardDelete(id, adminId);
  }
}
