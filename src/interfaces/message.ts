/**
 * Created by NL on 6/27/23.
 */

import type { IMessage } from 'react-native-gifted-chat';
import type { BaseEntity } from './base';
import type { MessageStatus } from './conversation';

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
  createdAt?: number;
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

export { type MessageProps, type LatestMessageProps, type SendMessageProps, type MediaType };
