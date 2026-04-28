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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
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

@ApiTags('Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все попытки (доступно всем)' })
  async getAll(): Promise<IAttempt[]> {
    return await this.attemptsService.getAll();
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Получить попытки по заданию' })
  async getByTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<IAttempt[]> {
    return await this.attemptsService.getByTask(taskId);
  }

  @Get('listener/:listenerId')
  @ApiOperation({ summary: 'Получить попытки слушателя' })
  async getByListener(
    @Param('listenerId', ParseIntPipe) listenerId: number,
  ): Promise<IAttempt[]> {
    return await this.attemptsService.getByListener(listenerId);
  }

  @Get('status/:statusId')
  @ApiOperation({
    summary:
      'Получить попытки по статусу: 1-На проверке, 2-Принято, 3-Отклонено, 4-На доработке',
  })
  async getByStatus(
    @Param('statusId', ParseIntPipe) statusId: number,
  ): Promise<IAttempt[]> {
    return await this.attemptsService.getByStatus(statusId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые попытки' })
  async getDeleted(): Promise<IAttempt[]> {
    return await this.attemptsService.getDeleted();
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
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IAttempt> {
    return await this.attemptsService.create(body, adminId);
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
