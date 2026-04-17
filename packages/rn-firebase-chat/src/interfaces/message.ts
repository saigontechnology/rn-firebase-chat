/**
 * Created by NL on 6/27/23.
 */

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { IMessage, Reply, ReplyMessage } from 'react-native-gifted-chat';
import type { BaseEntity } from './base';
import { type MessageStatus, MessageTypes } from './conversation';

export interface QuickReplyValue {
  title: string;
  value: string;
  /** Optional message override shown in the chat bubble when selected */
  messageId?: string;
}

export interface QuickReplies {
  type: 'radio' | 'checkbox';
  values: QuickReplyValue[];
  /** Keep chips visible after selection (checkbox only) */
  keepIt?: boolean;
}

export type { Reply };

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
  replyMessage?: ReplyMessage;
  isEdited?: boolean;
  quickReplies?: QuickReplies;
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
  replyMessage?: ReplyMessage;
  quickReplies?: QuickReplies;
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
