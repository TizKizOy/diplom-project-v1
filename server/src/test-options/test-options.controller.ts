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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { TestOptionsService } from './test-options.service';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { ITestOption } from './interfaces/test-options.interface';
import { CreateTestOptionDto } from './dto/create-test-option.dto';
import { UpdateTestOptionDto } from './dto/update-test-option.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Test Options')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('test-options')
export class TestOptionsController {
  constructor(private readonly testOptionsService: TestOptionsService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({ summary: 'Получить все варианты ответов' })
  async getAll(): Promise<ITestOption[]> {
    return await this.testOptionsService.getAll();
  }

  @Get('question/:questionId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить варианты по ID вопроса' })
  async getByQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<ITestOption[]> {
    return await this.testOptionsService.getByQuestion(questionId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые варианты ответов' })
  async getDeleted(): Promise<ITestOption[]> {
    return await this.testOptionsService.getDeleted();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить вариант ответа по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ITestOption> {
    return await this.testOptionsService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать вариант ответа' })
  async create(
    @Body() body: CreateTestOptionDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITestOption> {
    return await this.testOptionsService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить вариант ответа' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTestOptionDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITestOption> {
    return await this.testOptionsService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete варианта ответа' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.testOptionsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить вариант ответа' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.testOptionsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление варианта ответа' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.testOptionsService.hardDelete(id, adminId);
  }
}
