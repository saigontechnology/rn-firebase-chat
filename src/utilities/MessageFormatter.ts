/**
 * Created by NL on 6/1/23.
 */
import { decryptData, generateKey } from './AESCrypto';
import {
  type IUserInfo,
  type LatestMessageProps,
  type MessageProps,
  MessageStatus,
  type SendMessageProps,
  type MediaType,
  MessageTypes,
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
  message: MessageProps,
  userName: string
) => {
  return generateKey('Arnold', 'salt', 5000, 256).then((key) => {
    return decryptData(message.text, key)
      .then((decryptedMessage) => {
        return {
          _id: message.id,
          text: decryptedMessage ? decryptedMessage : message.text,
          user: {
            _id: message.senderId,
            name: userName,
            avatar:
              'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
          },
          senderId: message.senderId,
          readBy: message.readBy,
          id: message.id,
        };
      })
      .catch(() => {
        return {
          _id: message.id,
          // if fail to decrypt, return the original text
          text: message.text,
          user: {
            _id: message.senderId,
            name: userName,
            avatar:
              'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
          },
          senderId: message.senderId,
          readBy: message.readBy,
          id: message.id,
        };
      });
  });
};

const formatSendMessage = (
  userId: string,
  text: string,
  type?: MediaType,
  path?: string,
  extension?: string
): SendMessageProps => ({
  readBy: {
    [userId]: true,
  },
  status: MessageStatus.sent,
  senderId: userId,
  createdAt: Date.now(),
  text: text ?? '',
  type: type ?? MessageTypes.text,
  path: path ?? '',
  extension: extension ?? '',
});

const formatLatestMessage = (
  userId: string,
  message: string,
  type?: MediaType,
  path?: string,
  extension?: string
): LatestMessageProps => ({
  text: message ?? '',
  senderId: userId,
  readBy: {
    [userId]: true,
  },
  type: type ?? MessageTypes.text,
  path: path ?? '',
  extension: extension ?? '',
});

export {
  formatMessageData,
  formatEncryptedMessageData,
  formatSendMessage,
  formatLatestMessage,
};
