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
import { TestQuestionsService } from './test-questions.service';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { ITestQuestion } from './interfaces/test-questions.interfaces';
import { CreateTestQuestionDto } from './dto/create-test-question.dto';
import { UpdateTestQuestionDto } from './dto/update-test-question.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Test Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('test-questions')
export class TestQuestionsController {
  constructor(private readonly testQuestionsService: TestQuestionsService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({ summary: 'Получить все вопросы' })
  async getAll(): Promise<ITestQuestion[]> {
    return await this.testQuestionsService.getAll();
  }

  @Get('test/:testId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить вопросы по ID теста' })
  async getByTest(
    @Param('testId', ParseIntPipe) testId: number,
  ): Promise<ITestQuestion[]> {
    return await this.testQuestionsService.getByTest(testId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые вопросы' })
  async getDeleted(): Promise<ITestQuestion[]> {
    return await this.testQuestionsService.getDeleted();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить вопрос по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ITestQuestion> {
    return await this.testQuestionsService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать вопрос' })
  async create(
    @Body() body: CreateTestQuestionDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITestQuestion> {
    return await this.testQuestionsService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить вопрос' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTestQuestionDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITestQuestion> {
    return await this.testQuestionsService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete вопроса' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.testQuestionsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить вопрос' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.testQuestionsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление вопроса' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.testQuestionsService.hardDelete(id, adminId);
  }
}
