/**
 * Created by NL on 6/27/23.
 */

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { IMessage } from 'react-native-gifted-chat';
import type { BaseEntity } from './base';
import { type MessageStatus, MessageTypes } from './conversation';

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

interface MessageProps extends BaseEntity, IMessage {
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
}

type MediaType = 'image' | 'video' | 'text' | undefined;

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
