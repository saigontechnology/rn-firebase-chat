/**
 * Created by NL on 6/1/23.
 */
import { encryptedMessageData } from './AESCrypto';
import {
  type IUserInfo,
  type LatestMessageProps,
  type MessageProps,
  MessageStatus,
  type SendMessageProps,
  type EncryptionOptions,
} from '../interfaces';

const formatMessageData = (message: MessageProps, userInfo: IUserInfo) => {
  return {
    ...message,
    _id: message.id,
    createdAt: message.createdAt || Date.now(),
    user: {
      _id: userInfo.id,
      name: userInfo.name,
      avatar: userInfo.avatar,
    },
  };
};

const formatEncryptedMessageData = async (
  text: string,
  conversationId: string,
  options: EncryptionOptions = {}
) => {
  return await encryptedMessageData(text, conversationId, options);
};

const formatSendMessage = (
  userId: string,
  message: string
): SendMessageProps => ({
  readBy: {
    [userId]: true,
  },
  status: MessageStatus.sent,
  senderId: userId,
  createdAt: Date.now(),
  text: message,
});

const formatLatestMessage = (
  userId: string,
  message: string
): LatestMessageProps => ({
  text: message,
  senderId: userId,
  readBy: {
    [userId]: true,
  },
});

export {
  formatMessageData,
  formatEncryptedMessageData,
  formatSendMessage,
  formatLatestMessage,
};
