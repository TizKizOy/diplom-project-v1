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
import { MessageService } from './message.service';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { IMessage } from './interfaces/message.interface';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @Get()
  @ApiOperation({ summary: 'Получить все активные сообщения' })
  async getAll(): Promise<IMessage[]> {
    return await this.messageService.getAll();
  }

  @Get('sender/:senderId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить сообщения по отправителю' })
  async getBySender(
    @Param('senderId', ParseIntPipe) senderId: number,
  ): Promise<IMessage[]> {
    return await this.messageService.getBySender(senderId);
  }

  @Get('receiver/:receiverId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить сообщения по получателю' })
  async getByReceiver(
    @Param('receiverId', ParseIntPipe) receiverId: number,
  ): Promise<IMessage[]> {
    return await this.messageService.getByReceiver(receiverId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые сообщения' })
  async getDeleted(): Promise<IMessage[]> {
    return await this.messageService.getDeleted();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить сообщение по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IMessage> {
    return await this.messageService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Создать сообщение' })
  async create(
    @Body() body: CreateMessageDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IMessage> {
    return await this.messageService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Обновить сообщение' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMessageDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IMessage> {
    return await this.messageService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Soft-delete сообщения' })
  async deleteMessage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.messageService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить сообщение' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.messageService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление сообщения' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.messageService.hardDelete(id, adminId);
  }
}
