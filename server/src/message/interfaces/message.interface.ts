export interface IMessage {
  pkIdMessage: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  senderName: string;
  receiverName: string;
}
