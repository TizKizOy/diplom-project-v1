import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/message.db';
import { IMessage } from './interfaces/message.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {
  async getMessages(filter: {
    id?: number;
    isRead?: boolean;
    senderId?: number;
    receiverId?: number;
    isDeleted?: boolean;
  }): Promise<IMessage[]> {
    const messages = await db.getMessages(filter);
    return messages || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getMessages({});
    return result || [];
  }

  async getById(id: number): Promise<IMessage> {
    const messages = await db.getMessages({ id });
    const message = messages[0];
    if (!message) {
      throw new NotFoundException(`Сообщение с id=${id} не найдено`);
    }
    return message;
  }

  async getBySender(senderId: number): Promise<IMessage[]> {
    return await this.getMessages({ senderId });
  }

  async getByReceiver(receiverId: number): Promise<IMessage[]> {
    return await this.getMessages({ receiverId });
  }

  async getUnreadByReceiver(receiverId: number): Promise<IMessage[]> {
    const list = await this.getByReceiver(receiverId);
    return list.filter((m) => !m.isRead);
  }

  async getDeleted(): Promise<IMessage[]> {
    const messages = await db.getDeletedMessages();
    if (!messages || messages.length === 0) {
      throw new NotFoundException('Удалённые сообщения не найдены');
    }
    return messages;
  }

  async create(dto: CreateMessageDto, adminId: number): Promise<IMessage> {
    try {
      return await db.createMessage(dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка создания сообщения');
    }
  }

  async update(
    id: number,
    dto: UpdateMessageDto,
    adminId: number,
  ): Promise<IMessage> {
    await this.getById(id);
    try {
      return await db.updateMessage(id, dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка обновления сообщения');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteMessage(id, adminId);
      if (!result.deletedId) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreMessage(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteMessage(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
