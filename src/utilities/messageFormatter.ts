/**
 * Created by NL on 6/1/23.
 */
import { decryptedMessageData } from './aesCrypto';
import RNFS from 'react-native-fs';
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
import { getTextMessage } from './blacklist';
import { getCurrentTimestamp } from './date';

interface FormatLatestMessageParams {
  userId: string;
  name: string;
  text: string;
  type?: MediaType;
  path?: string;
  extension?: string;
  fileName?: string;
  size?: string;
}

const convertTextMessage = async (
  text: string,
  regex?: RegExp,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
) => {
  let messageText = text;
  if (encryptKey) {
    messageText = decryptMessageFunc
      ? await decryptMessageFunc(text)
      : await formatdecryptedMessageData(text, encryptKey);
  }
  return getTextMessage(regex, messageText);
};

const formatMessageText = async (
  message: MessageProps | LatestMessageProps,
  regexPattern?: RegExp | undefined,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
) => {
  return {
    ...message,
    text: await convertTextMessage(
      message.text,
      regexPattern,
      encryptKey,
      decryptMessageFunc
    ),
  };
};

const formatMessageData = async (
  message: MessageProps,
  userInfo: IUserInfo,
  regexPattern?: RegExp | undefined,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
) => {
  return {
    ...message,
    text: await convertTextMessage(
      message.text,
      regexPattern,
      encryptKey,
      decryptMessageFunc
    ),
    _id: message.id,
    createdAt: message.createdAt || getCurrentTimestamp(),
    user: {
      _id: userInfo.id,
      name: userInfo.name,
      avatar: userInfo.avatar,
    },
  };
};

const formatdecryptedMessageData = async (
  text: string,
  conversationId: string
) => {
  return await decryptedMessageData(text, conversationId);
};

const formatSendMessage = (
  userId: string,
  text: string,
  type?: MediaType,
  path?: string,
  extension?: string,
  fileName?: string,
  size?: string
): SendMessageProps => ({
  readBy: {
    [userId]: true,
  },
  status: MessageStatus.sent,
  senderId: userId,
  createdAt: getCurrentTimestamp(),
  text: text ?? '',
  type: type ?? MessageTypes.text,
  path: path ?? '',
  extension: extension ?? '',
  fileName: fileName ?? '',
  size: size ?? '',
});

const formatLatestMessage = ({
  userId,
  name,
  text,
  type,
  path,
  extension,
  fileName,
  size,
}: FormatLatestMessageParams): LatestMessageProps => ({
  text: text ?? '',
  senderId: userId,
  name: name,
  readBy: {
    [userId]: true,
  },
  type: type ?? MessageTypes.text,
  path: path ?? '',
  extension: extension ?? '',
  fileName: fileName ?? '',
  size: size ?? '',
});

const getMediaTypeFromExtension = (path: string): MediaType => {
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

const convertExtension = (file?: Asset): string => {
  if (!file || file.type?.startsWith('image')) {
    return 'jpg';
  } else {
    return 'mp4';
  }
};

const getAbsoluteFilePath = (path: string) => {
  return path?.startsWith?.('file:/') ? path : `file://${path}`;
};

const getAbsoluteFilePathWithName = async (path: string, name: string) => {
  if (path.startsWith('content://') && name) {
    try {
      const destPath = `${RNFS.TemporaryDirectoryPath}/${name}`;
      await RNFS.copyFile(path, destPath);
      path = destPath;
    } catch (error) {
      console.error('Error copying file:', error);
    }
  }
  return getAbsoluteFilePath(path);
};

export {
  formatMessageData,
  formatdecryptedMessageData,
  formatSendMessage,
  formatLatestMessage,
  formatMessageText,
  getMediaTypeFromExtension,
  getAbsoluteFilePathWithName,
  getAbsoluteFilePath,
  convertExtension,
};
