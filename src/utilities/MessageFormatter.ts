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
import type { Asset } from 'react-native-image-picker';

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

export const getMediaTypeFromExtension = (path: string): MediaType => {
  const photoExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'wmv'];
  const extension = path.split('.').pop();
  if (extension && photoExtensions.includes(extension)) {
    return MessageTypes.image;
  } else if (extension && videoExtensions.includes(extension)) {
    return MessageTypes.video;
  } else {
    return undefined;
  }
};

export const convertExtension = (file: Asset | undefined): string => {
  if (!file || file.type?.startsWith('image')) {
    return 'jpg';
  } else {
    return 'mp4';
  }
};

export {
  formatMessageData,
  formatEncryptedMessageData,
  formatSendMessage,
  formatLatestMessage,
};
