/**
 * Created by NL on 6/27/23.
 */
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { BaseEntity } from './base';
import type { LatestMessageProps, MediaType } from './message';
import { LinksType } from './link';

interface MemberProps {
  [userId: string]: FirebaseFirestoreTypes.DocumentReference;
}

interface CustomConversationInfo {
  id: string;
  name?: string;
  image?: string;
}

interface ConversationProps extends BaseEntity {
  latestMessage?: LatestMessageProps;
  updatedAt: number;
  members: string[];
  name?: string;
  image?: string;
  typing?: {
    [userId: string]: boolean;
  };
  unRead?: number;
  links?: LinksType;
}

enum MessageTypes {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
}

enum MessageStatus {
  sent,
  received,
  seen,
  failed,
}

interface ConversationData {
  unRead?: { [key: string]: string };
  typing?: { [key: string]: boolean };
}

interface MediaFile {
  id: string;
  path: string;
  type: MediaType;
}

export {
  ConversationProps,
  MemberProps,
  MessageTypes,
  MessageStatus,
  CustomConversationInfo,
  ConversationData,
  MediaFile,
};
