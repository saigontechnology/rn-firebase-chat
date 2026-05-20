/**
 * Created by NL on 6/27/23.
 */

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { IMessage } from 'react-native-gifted-chat';
import type { BaseEntity } from './base';
import { type MessageStatus, MessageTypes } from './conversation';
import type { ReplyToMessage } from '@saigontechnology/firebase-chat-shared';

type TimestampField = number | FirebaseFirestoreTypes.FieldValue;

interface LatestMessageProps {
  readBy: {
    [userId: string]: boolean;
  };
  senderId: string;
  name: string;
  text: string;
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
}

interface MessageProps extends BaseEntity, Omit<IMessage, 'replyMessage'> {
  text: string;
  senderId: string;
  readBy: {
    [userId: string]: boolean;
  };
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
  createdAt: Date | number;
  replyMessage?: ReplyToMessage;
  isEdited?: boolean;
}

interface SendMessageProps {
  text: string;
  createdAt?: TimestampField;
  senderId: string;
  readBy: {
    [userId: string]: boolean;
  };
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
  /** Size of the file in bytes. When provided, sendMessageWithFile enforces maxFileSizeBytes. */
  fileSize?: number;
  replyMessage?: ReplyToMessage;
}

type MediaType = 'image' | 'video' | 'text' | 'voice' | undefined;

type ImagePickerValue = {
  type: MessageTypes.image | MessageTypes.video;
  path: string;
  extension: string;
};

export {
  type MessageProps,
  type LatestMessageProps,
  type SendMessageProps,
  type MediaType,
  type TimestampField,
  type ImagePickerValue,
};
