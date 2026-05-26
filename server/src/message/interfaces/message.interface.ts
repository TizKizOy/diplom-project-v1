export interface IMessage {
  pkIdMessage: number;
  fkIdSender: number;
  fkIdReceiver: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  senderName: string;
  receiverName: string;
}
