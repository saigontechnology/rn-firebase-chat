import type {
  IUserInfo,
  LatestMessageProps,
  MediaType,
  MessageProps,
  MessageStatus,
  MessageTypes,
  SendMessageProps,
} from '../types';
import { getTextMessage } from './blacklist';
import { getCurrentTimestamp } from './date';

// Re-export for convenience
export { MessageTypes, MessageStatus };

const convertTextMessage = async (
  text: string,
  regex?: RegExp,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
): Promise<string> => {
  let messageText = text;
  if (encryptKey) {
    if (decryptMessageFunc) {
      messageText = await decryptMessageFunc(text);
    }
  }
  return getTextMessage(regex, messageText);
};

export const formatMessageText = async (
  message: MessageProps | LatestMessageProps,
  regexPattern?: RegExp,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
): Promise<MessageProps | LatestMessageProps> => {
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

/**
 * Transforms a raw Firestore MessageProps into the shape expected by GiftedChat / the web message list.
 * The `user` field uses the provided userInfo.
 */
export const formatMessageData = async (
  message: MessageProps,
  userInfo: IUserInfo,
  regexPattern?: RegExp,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
): Promise<MessageProps & { _id: string; user: { _id: string; name: string; avatar: string } }> => {
  const rawCreatedAt = message.createdAt as
    | number
    | { toMillis: () => number }
    | undefined;

  const createdAt =
    rawCreatedAt && typeof (rawCreatedAt as { toMillis?: unknown }).toMillis === 'function'
      ? (rawCreatedAt as { toMillis: () => number }).toMillis()
      : (rawCreatedAt as number | undefined) ?? getCurrentTimestamp();

  return {
    ...message,
    text: await convertTextMessage(
      message.text,
      regexPattern,
      encryptKey,
      decryptMessageFunc
    ),
    _id: message.id,
    createdAt,
    user: {
      _id: userInfo.id,
      name: userInfo.name,
      avatar: userInfo.avatar,
    },
  };
};

/**
 * Builds a SendMessageProps payload ready to write to Firestore.
 * Pass `createdAt` as your platform's server timestamp (Firestore FieldValue) or omit to use Date.now().
 */
export const formatSendMessage = (
  userId: string,
  text: string,
  type?: MediaType,
  path?: string,
  extension?: string,
  createdAt?: unknown
): SendMessageProps => ({
  readBy: { [userId]: true },
  status: 0 as MessageStatus, // MessageStatus.sent
  senderId: userId,
  createdAt: createdAt ?? getCurrentTimestamp(),
  text: text ?? '',
  type: type ?? ('text' as MediaType),
  path: path ?? '',
  extension: extension ?? '',
});

export const formatLatestMessage = (
  userId: string,
  name: string,
  message: string,
  type?: MediaType,
  path?: string,
  extension?: string
): LatestMessageProps => ({
  text: message ?? '',
  senderId: userId,
  name,
  readBy: { [userId]: true },
  type: type ?? ('text' as MediaType),
  path: path ?? '',
  extension: extension ?? '',
});

export const getMediaTypeFromExtension = (path: string): MediaType => {
  const photoExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'wmv'];
  const extension = path.split('.').pop();
  if (extension && photoExtensions.includes(extension)) {
    return 'image';
  } else if (extension && videoExtensions.includes(extension)) {
    return 'video';
  }
  return undefined;
};

export const getAbsoluteFilePath = (path: string): string => {
  return path?.startsWith?.('file:/') ? path : `file://${path}`;
};
