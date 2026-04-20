import {
  formatLatestMessage,
  getAbsoluteFilePath,
  getMediaTypeFromExtension,
  getTextMessage,
} from '@saigontechnology/firebase-chat-shared';
import { decryptedMessageData } from './aesCrypto';
import {
  type IUserInfo,
  type LatestMessageProps,
  type MessageProps,
  MessageStatus,
  MessageTypes,
  type SendMessageProps,
  type MediaType,
} from '../interfaces';
import { getCurrentTimestamp, getServerTimestamp } from './date';

export { formatLatestMessage, getAbsoluteFilePath, getMediaTypeFromExtension };

const formatdecryptedMessageData = async (
  text: string,
  encryptionKey: string
): Promise<string> => {
  return decryptedMessageData(text, encryptionKey);
};

/**
 * Returns the effective decrypt function: the provided one, or the built-in AES
 * decrypt bound to encryptKey when no custom function is supplied.
 */
const resolveDecryptFunc = (
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
): ((text: string) => Promise<string>) | undefined =>
  decryptMessageFunc ??
  (encryptKey ? (t) => formatdecryptedMessageData(t, encryptKey) : undefined);

const convertTextMessage = async (
  text: string,
  regex?: RegExp,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
): Promise<string> => {
  const decrypt = resolveDecryptFunc(encryptKey, decryptMessageFunc);
  const messageText = decrypt ? await decrypt(text) : text;
  return getTextMessage(regex, messageText);
};

/**
 * Transforms a raw Firestore MessageProps into the shape expected by GiftedChat.
 * Adds `_id`, normalized `createdAt` (ms number), and `user`.
 */
const formatMessageData = async (
  message: MessageProps,
  userInfo: IUserInfo | undefined,
  regexPattern?: RegExp,
  encryptKey?: string,
  decryptMessageFunc?: (text: string) => Promise<string>
): Promise<MessageProps> => {
  const formattedReply = message.replyMessage
    ? {
        ...message.replyMessage,
        _id: message.replyMessage.id || message.replyMessage._id,
        text: await convertTextMessage(
          message.replyMessage.text ?? '',
          regexPattern,
          encryptKey,
          decryptMessageFunc
        ),
        user: message.replyMessage.user
          ? {
              ...message.replyMessage.user,
              _id:
                (
                  message.replyMessage.user as {
                    id?: string;
                    _id?: string | number;
                  }
                ).id || message.replyMessage.user._id,
            }
          : undefined,
      }
    : undefined;

  return {
    ...message,
    text: await convertTextMessage(
      message.text,
      regexPattern,
      encryptKey,
      decryptMessageFunc
    ),
    _id: message.id || message._id,
    createdAt:
      message.createdAt &&
      typeof (message.createdAt as unknown as Record<string, unknown>)
        .toMillis === 'function'
        ? (
            message.createdAt as unknown as { toMillis: () => number }
          ).toMillis()
        : (message.createdAt as number | Date) || getCurrentTimestamp(),
    user: {
      _id: userInfo?.id ?? '',
      name: userInfo?.name,
      avatar: userInfo?.avatar,
    },
    replyMessage: formattedReply,
  } as MessageProps;
};

/**
 * Builds a SendMessageProps payload with a Firestore server timestamp for `createdAt`.
 */
const formatSendMessage = (
  userId: string,
  text: string,
  type?: MediaType,
  path?: string,
  extension?: string
): SendMessageProps => ({
  readBy: { [userId]: true },
  status: MessageStatus.sent,
  senderId: userId,
  createdAt: getServerTimestamp(),
  text: text ?? '',
  type: type ?? MessageTypes.text,
  path: path ?? '',
  extension: extension ?? '',
});

const formatMessageText = async (
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

export {
  formatMessageData,
  formatdecryptedMessageData,
  formatMessageText,
  formatSendMessage,
};

export type { LatestMessageProps };
