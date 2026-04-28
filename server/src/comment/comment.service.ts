import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/comment.db';
import { IComment } from './interfaces/comment.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  async getComments(filter: {
    id?: number;
    attemptId?: number;
    userId?: number;
    taskId?: number;
    isDeleted?: boolean;
  }): Promise<IComment[]> {
    const comments = await db.getComments(filter);
    return comments || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getComments({});
    return result || [];
  }

  async getById(id: number): Promise<IComment> {
    const comments = await db.getComments({ id });
    const comment = comments[0];
    if (!comment) {
      throw new NotFoundException(`Комментарий с id=${id} не найден`);
    }
    return comment;
  }

  async getByTask(taskId: number): Promise<IComment[]> {
    return await this.getComments({ taskId });
  }

  async getByAttempt(attemptId: number): Promise<IComment[]> {
    return await this.getComments({ attemptId });
  }

  async getByUser(userId: number): Promise<IComment[]> {
    return await this.getComments({ userId });
  }

  async getDeleted(): Promise<IComment[]> {
    const comments = await db.getDeletedComments();
    if (!comments || comments.length === 0) {
      throw new NotFoundException('Удалённые комментарии не найдены');
    }
    return comments;
  }

  async create(dto: CreateCommentDto, adminId: number): Promise<IComment> {
    try {
      return await db.createComment(dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка создания комментария');
    }
  }

  async update(
    id: number,
    dto: UpdateCommentDto,
    adminId: number,
  ): Promise<IComment> {
    await this.getById(id);
    try {
      return await db.updateComment(id, dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(
        e.message || 'Ошибка обновления комментария',
      );
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteComment(id, adminId);
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
      return await db.restoreComment(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteComment(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
