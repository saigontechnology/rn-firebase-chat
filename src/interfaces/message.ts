/**
 * Created by NL on 6/27/23.
 */

import type { IMessage } from 'react-native-gifted-chat/lib/Models';
import type { BaseEntity } from './base';
import type { MessageStatus } from './conversation';

interface LatestMessageProps {
  readBy: {
    [userId: string]: boolean;
  };
  senderId: string;
  text: string;
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
  size?: string;
  name?: string;
  duration?: number;
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
  size?: string;
  name?: string;
  duration?: number;
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
  size?: string;
  name?: string;
  duration?: number;
}

type MediaType = 'image' | 'video' | 'text' | 'document' | 'voice' | undefined;

export { MessageProps, LatestMessageProps, SendMessageProps, MediaType };
