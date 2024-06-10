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
}

interface MessageProps extends BaseEntity, IMessage {
  text: string;
  senderId: string;
  readBy: {
    [userId: string]: boolean;
  };
  status?: MessageStatus;
  imageUrl?: string;
  type?: 'photo' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mine?: string;
  extension?: string;
}

interface SendMessageProps {
  text: string;
  createdAt?: number;
  senderId: string;
  readBy: {
    [userId: string]: boolean;
  };
  status?: MessageStatus;
}

interface SendPhotoVideoMessageProps extends SendMessageProps {
  type: 'photo' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mine?: string;
  extension?: string;
}

export {
  MessageProps,
  LatestMessageProps,
  SendMessageProps,
  SendPhotoVideoMessageProps,
};
