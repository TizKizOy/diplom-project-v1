import { query } from 'src/common/db/dbConfig';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { IMessage } from '../interfaces/message.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getMessages = async (filter: {
  id?: number;
  senderId?: number;
  receiverId?: number;
  isDeleted?: boolean;
}): Promise<IMessage[]> => {
  return await query<IMessage>(
    `EXEC prGetMessages
    @pkIdMessage = @pkIdMessage,
    @fkIdSender = @fkIdSender,
    @fkIdReceiver = @fkIdReceiver,
    @isDeleted = @isDeleted`,
    {
      pkIdMessage: filter.id ?? null,
      fkIdReceiver: filter.receiverId ?? null,
      fkIdSender: filter.senderId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedMessages = async (): Promise<IMessage[]> => {
  return await getMessages({ isDeleted: true });
};

export const createMessage = async (
  dto: CreateMessageDto,
  adminId: number,
): Promise<IMessage> => {
  const result = await query<IMessage>(
    `EXEC spMessagesCreate
      @fkIdSender = @fkIdSender,
      @fkIdReceiver = @fkIdReceiver,
      @message = @message`,
    {
      fkIdSender: dto.senderId,
      fkIdReceiver: dto.receiverId,
      message: dto.message,
    },
    adminId,
  );

  return result[0];
};

export const updateMessage = async (
  id: number,
  dto: UpdateMessageDto,
  adminId: number,
): Promise<IMessage> => {
  const result = await query<IMessage>(
    `EXEC spMessagesUpdate
    @pkIdMessage = @pkIdMessage,
    @message = @message,
    @isRead = @isRead`,
    {
      pkIdMessage: id,
      message: dto.message ?? null,
      isRead: dto.isRead ?? null,
    },
    adminId,
  );

  return result[0];
};

export const deleteMessage = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spMessagesDelete @pkIdMessage = @pkIdMessage`,
    { pkIdMessage: id },
    adminId,
  );
  return result[0];
};

export const restoreMessage = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spMessagesRestore @pkIdMessage = @pkIdMessage`,
    { pkIdMessage: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteMessage = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spMessagesHardDelete @pkIdMessage = @pkIdMessage`,
    { pkIdMessage: id },
    adminId,
  );
  return result[0];
};
